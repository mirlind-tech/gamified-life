//! Code/Career API handlers

use actix_web::{HttpRequest, HttpResponse, web};
use serde::Deserialize;
use serde_json::json;
use sqlx::{PgPool, Row};
use uuid::Uuid;

use crate::handlers::auth::get_request_id;
use crate::services::AuthService;

/// Extract user ID from JWT token in request
fn extract_user_id(req: &HttpRequest, auth_service: &AuthService) -> Option<Uuid> {
    let token = req
        .headers()
        .get("authorization")
        .and_then(|h| h.to_str().ok())
        .and_then(|h| h.strip_prefix("Bearer "));

    token.and_then(|t| {
        auth_service
            .validate_token(t)
            .ok()
            .and_then(|claims| Uuid::parse_str(&claims.sub).ok())
    })
}

/// Get latest coding session
pub async fn get_latest(
    req: HttpRequest,
    pool: web::Data<PgPool>,
    auth_service: web::Data<AuthService>,
) -> HttpResponse {
    let request_id = get_request_id(&req);

    let user_id = match extract_user_id(&req, &auth_service) {
        Some(id) => id,
        None => {
            return HttpResponse::Unauthorized().json(json!({
                "status": "error",
                "error": { "code": "UNAUTHORIZED", "message": "Authentication required" }
            }));
        }
    };

    let session = sqlx::query(
        r#"
        SELECT
            id,
            COALESCE(project_name, '') AS project_name,
            COALESCE(duration_minutes, 0) AS duration_minutes,
            COALESCE(commits_made, 0) AS commits_made,
            COALESCE(started_at::date::text, CURRENT_DATE::text) AS session_date
        FROM coding_sessions
        WHERE user_id = $1
        ORDER BY started_at DESC NULLS LAST, created_at DESC
        LIMIT 1
        "#,
    )
    .bind(user_id)
    .fetch_optional(pool.get_ref())
    .await;

    match session {
        Ok(Some(row)) => {
            let parsed = (|| -> Result<(uuid::Uuid, String, i32, i32, String), sqlx::Error> {
                Ok((
                    row.try_get("id")?,
                    row.try_get("project_name")?,
                    row.try_get("duration_minutes")?,
                    row.try_get("commits_made")?,
                    row.try_get("session_date")?,
                ))
            })();

            let (id, project_name, duration_minutes, commits_made, session_date) = match parsed {
                Ok(v) => v,
                Err(e) => {
                    tracing::error!("Failed to decode latest code session row: {}", e);
                    return HttpResponse::InternalServerError().json(json!({
                        "status": "error",
                        "error": { "code": "DB_ERROR", "message": "Failed to load code session" },
                        "meta": { "request_id": request_id }
                    }));
                }
            };

            HttpResponse::Ok().json(json!({
                "status": "success",
                "data": {
                    "progress": {
                        "id": id.to_string(),
                        "date": session_date,
                        "hours": duration_minutes as f64 / 60.0,
                        "github_commits": commits_made,
                        "project": project_name,
                        "skills": [],
                        "notes": ""
                    }
                },
                "meta": { "request_id": request_id }
            }))
        }
        Ok(None) => HttpResponse::Ok().json(json!({
            "status": "success",
            "data": { "progress": null },
            "meta": { "request_id": request_id }
        })),
        Err(e) => {
            tracing::error!("Failed to load latest code session: {}", e);
            HttpResponse::InternalServerError().json(json!({
                "status": "error",
                "error": { "code": "DB_ERROR", "message": "Failed to load code session" },
                "meta": { "request_id": request_id }
            }))
        }
    }
}

/// Get coding session by date
pub async fn get_by_date(
    req: HttpRequest,
    path: web::Path<String>,
    pool: web::Data<PgPool>,
    auth_service: web::Data<AuthService>,
) -> HttpResponse {
    let request_id = get_request_id(&req);
    let date = path.into_inner();

    let user_id = match extract_user_id(&req, &auth_service) {
        Some(id) => id,
        None => {
            return HttpResponse::Unauthorized().json(json!({
                "status": "error",
                "error": { "code": "UNAUTHORIZED", "message": "Authentication required" }
            }));
        }
    };

    let session = sqlx::query(
        r#"
        SELECT
            id,
            COALESCE(project_name, '') AS project_name,
            COALESCE(duration_minutes, 0) AS duration_minutes,
            COALESCE(commits_made, 0) AS commits_made
        FROM coding_sessions
        WHERE user_id = $1 AND started_at >= $2::date AND started_at < ($2::date + interval '1 day')
        LIMIT 1
        "#,
    )
    .bind(user_id)
    .bind(&date)
    .fetch_optional(pool.get_ref())
    .await;

    match session {
        Ok(Some(row)) => {
            let parsed = (|| -> Result<(uuid::Uuid, String, i32, i32), sqlx::Error> {
                Ok((
                    row.try_get("id")?,
                    row.try_get("project_name")?,
                    row.try_get("duration_minutes")?,
                    row.try_get("commits_made")?,
                ))
            })();

            let (id, project_name, duration_minutes, commits_made) = match parsed {
                Ok(v) => v,
                Err(e) => {
                    tracing::error!("Failed to decode code session for date {}: {}", date, e);
                    return HttpResponse::InternalServerError().json(json!({
                        "status": "error",
                        "error": { "code": "DB_ERROR", "message": "Failed to load code session" },
                        "meta": { "request_id": request_id }
                    }));
                }
            };

            HttpResponse::Ok().json(json!({
                "status": "success",
                "data": {
                    "progress": {
                        "id": id.to_string(),
                        "date": date,
                        "hours": duration_minutes as f64 / 60.0,
                        "github_commits": commits_made,
                        "project": project_name,
                        "skills": [],
                        "notes": ""
                    }
                },
                "meta": { "request_id": request_id }
            }))
        }
        _ => HttpResponse::Ok().json(json!({
            "status": "success",
            "data": {
                "progress": {
                    "id": null,
                    "date": date,
                    "hours": 0.0,
                    "github_commits": 0,
                    "project": "",
                    "skills": [],
                    "notes": ""
                }
            },
            "meta": { "request_id": request_id }
        })),
    }
}

/// Save coding progress
#[derive(Debug, Deserialize)]
pub struct SaveCodeRequest {
    pub date: String,
    pub hours: f64,
    #[serde(default, alias = "commits")]
    pub github_commits: i32,
    pub project: String,
    pub notes: Option<String>,
}

pub async fn save_code(
    req: HttpRequest,
    body: web::Json<SaveCodeRequest>,
    pool: web::Data<PgPool>,
    auth_service: web::Data<AuthService>,
) -> HttpResponse {
    let request_id = get_request_id(&req);

    let user_id = match extract_user_id(&req, &auth_service) {
        Some(id) => id,
        None => {
            return HttpResponse::Unauthorized().json(json!({
                "status": "error",
                "error": { "code": "UNAUTHORIZED", "message": "Authentication required" }
            }));
        }
    };

    let result = sqlx::query_scalar::<_, uuid::Uuid>(
        r#"
        INSERT INTO coding_sessions 
            (id, user_id, project_name, started_at, duration_minutes, commits_made, 
             notes, source, created_at)
        VALUES (gen_random_uuid(), $1, $2, $3::timestamptz, $4, $5, $6, 'web', NOW())
        RETURNING id
        "#,
    )
    .bind(user_id)
    .bind(&body.project)
    .bind(format!("{}T00:00:00Z", body.date))
    .bind((body.hours * 60.0) as i32)
    .bind(body.github_commits)
    .bind(body.notes.clone().unwrap_or_default())
    .fetch_one(pool.get_ref())
    .await;

    match result {
        Ok(id) => HttpResponse::Created().json(json!({
            "status": "success",
            "data": {
                "id": id.to_string(),
                "message": "Code progress saved"
            },
            "meta": { "request_id": request_id }
        })),
        Err(e) => {
            tracing::error!("Failed to save code: {}", e);
            HttpResponse::InternalServerError().json(json!({
                "status": "error",
                "error": { "code": "DB_ERROR", "message": "Failed to save" },
                "meta": { "request_id": request_id }
            }))
        }
    }
}

/// Get code stats total
pub async fn get_stats_total(
    req: HttpRequest,
    pool: web::Data<PgPool>,
    auth_service: web::Data<AuthService>,
) -> HttpResponse {
    let request_id = get_request_id(&req);

    let user_id = match extract_user_id(&req, &auth_service) {
        Some(id) => id,
        None => {
            return HttpResponse::Unauthorized().json(json!({
                "status": "error",
                "error": { "code": "UNAUTHORIZED", "message": "Authentication required" }
            }));
        }
    };

    let total_hours = sqlx::query_scalar::<_, f64>(
        "SELECT COALESCE(SUM(duration_minutes), 0) / 60.0 FROM coding_sessions WHERE user_id = $1",
    )
    .bind(user_id)
    .fetch_one(pool.get_ref())
    .await
    .unwrap_or(0.0);

    let total_commits = sqlx::query_scalar::<_, i64>(
        "SELECT COALESCE(SUM(commits_made), 0) FROM coding_sessions WHERE user_id = $1",
    )
    .bind(user_id)
    .fetch_one(pool.get_ref())
    .await
    .unwrap_or(0);

    HttpResponse::Ok().json(json!({
        "status": "success",
        "data": {
            "total_hours": total_hours,
            "total_commits": total_commits
        },
        "meta": { "request_id": request_id }
    }))
}

/// Get code stats streak
pub async fn get_stats_streak(req: HttpRequest) -> HttpResponse {
    let request_id = get_request_id(&req);

    HttpResponse::Ok().json(json!({
        "status": "success",
        "data": {
            "streak_days": 0,
            "last_session_date": null
        },
        "meta": { "request_id": request_id }
    }))
}

/// Get coach action history
pub async fn get_coach_actions_history(
    req: HttpRequest,
    pool: web::Data<PgPool>,
    auth_service: web::Data<AuthService>,
) -> HttpResponse {
    let request_id = get_request_id(&req);

    let user_id = match extract_user_id(&req, &auth_service) {
        Some(id) => id,
        None => {
            return HttpResponse::Unauthorized().json(json!({
                "status": "error",
                "error": { "code": "UNAUTHORIZED", "message": "Authentication required" }
            }));
        }
    };

    // Generate personalized coach actions based on user's recent activity
    let actions = generate_coach_actions(&pool, user_id).await;

    HttpResponse::Ok().json(json!({
        "status": "success",
        "data": { "actions": actions },
        "meta": { "request_id": request_id }
    }))
}

async fn generate_coach_actions(pool: &sqlx::PgPool, user_id: Uuid) -> Vec<serde_json::Value> {
    let mut actions = vec![];

    // Check recent workout activity
    let recent_workout: Option<chrono::DateTime<chrono::Utc>> =
        sqlx::query_scalar("SELECT MAX(created_at) FROM workouts WHERE user_id = $1")
            .bind(user_id)
            .fetch_one(pool)
            .await
            .ok()
            .flatten();

    if recent_workout.is_none()
        || recent_workout.unwrap() < chrono::Utc::now() - chrono::Duration::days(3)
    {
        actions.push(json!({
            "id": "workout_reminder",
            "type": "reminder",
            "priority": "high",
            "title": "Time for a workout!",
            "message": "Your last workout was over 3 days ago. Schedule one today.",
            "pillar": "body",
            "suggested_action": "Log a workout",
            "completed": false
        }));
    }

    // Check coding activity
    let recent_coding: Option<chrono::DateTime<chrono::Utc>> =
        sqlx::query_scalar("SELECT MAX(created_at) FROM coding_sessions WHERE user_id = $1")
            .bind(user_id)
            .fetch_one(pool)
            .await
            .ok()
            .flatten();

    if recent_coding.is_none()
        || recent_coding.unwrap() < chrono::Utc::now() - chrono::Duration::days(1)
    {
        actions.push(json!({
            "id": "coding_reminder",
            "type": "reminder",
            "priority": "high",
            "title": "Keep your coding streak!",
            "message": "No coding logged today. Even 30 minutes counts.",
            "pillar": "career",
            "suggested_action": "Log coding session",
            "completed": false
        }));
    }

    // Check German study
    let recent_german: Option<chrono::DateTime<chrono::Utc>> =
        sqlx::query_scalar("SELECT MAX(created_at) FROM german_sessions WHERE user_id = $1")
            .bind(user_id)
            .fetch_one(pool)
            .await
            .ok()
            .flatten();

    if recent_german.is_none()
        || recent_german.unwrap() < chrono::Utc::now() - chrono::Duration::days(1)
    {
        actions.push(json!({
            "id": "german_reminder",
            "type": "reminder",
            "priority": "medium",
            "title": "Daily German practice",
            "message": "Consistency is key for language learning. Do your Anki cards!",
            "pillar": "german",
            "suggested_action": "Log German study",
            "completed": false
        }));
    }

    // Check protocol score
    let recent_protocol: Option<i32> = sqlx::query_scalar(
        "SELECT protocol_score FROM daily_protocol WHERE user_id = $1 AND protocol_date = CURRENT_DATE"
    )
    .bind(user_id)
    .fetch_optional(pool)
    .await
    .ok()
    .flatten();

    if recent_protocol.is_none() || recent_protocol.unwrap() < 60 {
        actions.push(json!({
            "id": "protocol_boost",
            "type": "suggestion",
            "priority": "high",
            "title": "Boost your protocol score",
            "message": "Complete today's protocol items: wake up on time, German study, workout, and sleep by 22:00.",
            "pillar": "mind",
            "suggested_action": "View protocol",
            "completed": false
        }));
    }

    // Add a positive reinforcement if all is going well
    if actions.is_empty() {
        actions.push(json!({
            "id": "keep_going",
            "type": "encouragement",
            "priority": "low",
            "title": "You're on fire! 🔥",
            "message": "All your pillars are on track. Keep up the excellent work!",
            "pillar": "general",
            "suggested_action": "None - you're doing great!",
            "completed": false
        }));
    }

    actions
}
