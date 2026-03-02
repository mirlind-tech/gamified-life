//! Daily Protocol API handlers

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

/// Get protocol for a specific date
pub async fn get_protocol(
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

    // Try to find protocol for this date
    let protocol = sqlx::query(
        r#"
        SELECT 
            id, 
            COALESCE(protocol_score, 0) as protocol_score, 
            COALESCE(notes, '') as notes, 
            COALESCE(protocol_date::text, $2) as protocol_date,
            COALESCE(actual_wake_time::text, '') as actual_wake_time,
            COALESCE(german_completed, false) as german_completed,
            COALESCE(gym_completed, false) as gym_completed,
            COALESCE(coding_completed, false) as coding_completed,
            COALESCE(coding_duration_minutes, 0) as coding_duration_minutes,
            COALESCE(actual_sleep_time::text, '') as actual_sleep_time
        FROM daily_protocol
        WHERE user_id = $1 AND protocol_date = $2::date
        LIMIT 1
        "#,
    )
    .bind(user_id)
    .bind(&date)
    .fetch_optional(pool.get_ref())
    .await;

    match protocol {
        Ok(Some(row)) => {
            let parsed = (|| -> Result<(uuid::Uuid, i32, String, String, bool, bool, bool, i32, bool), sqlx::Error> {
                Ok((
                    row.try_get("id")?,
                    row.try_get("protocol_score")?,
                    row.try_get("notes")?,
                    row.try_get("protocol_date")?,
                    !row.try_get::<String, _>("actual_wake_time")?.is_empty(),
                    row.try_get("german_completed")?,
                    row.try_get("gym_completed")?,
                    row.try_get("coding_duration_minutes")?,
                    !row.try_get::<String, _>("actual_sleep_time")?.is_empty(),
                ))
            })();

            match parsed {
                Ok((
                    id,
                    score,
                    notes,
                    protocol_date,
                    wake05,
                    german,
                    gym,
                    coding_mins,
                    sleep22,
                )) => HttpResponse::Ok().json(json!({
                    "status": "success",
                    "data": {
                        "protocol": {
                            "id": id.to_string(),
                            "date": protocol_date,
                            "score": score,
                            "notes": notes,
                            "wake05": wake05,
                            "german_study": german,
                            "gym_workout": gym,
                            "sleep22": sleep22,
                            "coding_hours": coding_mins as f64 / 60.0
                        }
                    },
                    "meta": { "request_id": request_id }
                })),
                Err(e) => {
                    tracing::error!("Failed to parse protocol row: {}", e);
                    // Return default
                    HttpResponse::Ok().json(json!({
                        "status": "success",
                        "data": {
                            "protocol": {
                                "id": null,
                                "date": date,
                                "score": 0,
                                "notes": "",
                                "wake05": false,
                                "german_study": false,
                                "gym_workout": false,
                                "sleep22": false,
                                "coding_hours": 0.0
                            }
                        },
                        "meta": { "request_id": request_id }
                    }))
                }
            }
        }
        _ => {
            // Return default protocol for this date
            HttpResponse::Ok().json(json!({
                "status": "success",
                "data": {
                    "protocol": {
                        "id": null,
                        "date": date,
                        "score": 0,
                        "notes": "",
                        "wake05": false,
                        "german_study": false,
                        "gym_workout": false,
                        "sleep22": false,
                        "coding_hours": 0.0
                    }
                },
                "meta": { "request_id": request_id }
            }))
        }
    }
}

/// Get protocol streak
pub async fn get_streak(
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

    // Get current streak (simplified - count consecutive days with protocol_score >= 80)
    let streak = sqlx::query_scalar::<_, i64>(
        r#"
        WITH ranked_protocols AS (
            SELECT protocol_date, protocol_score,
                   protocol_date - (ROW_NUMBER() OVER (ORDER BY protocol_date))::int AS grp
            FROM daily_protocol
            WHERE user_id = $1 AND protocol_score >= 80
            ORDER BY protocol_date DESC
        )
        SELECT COUNT(*) FROM ranked_protocols
        WHERE grp = (SELECT grp FROM ranked_protocols LIMIT 1)
        "#,
    )
    .bind(user_id)
    .fetch_one(pool.get_ref())
    .await
    .unwrap_or(0);

    // Get longest streak
    let longest = sqlx::query_scalar::<_, i64>(
        r#"
        SELECT COALESCE(MAX(streak_count), 0) FROM (
            SELECT COUNT(*) as streak_count
            FROM (
                SELECT protocol_date, protocol_score,
                       protocol_date - (ROW_NUMBER() OVER (ORDER BY protocol_date))::int AS grp
                FROM daily_protocol
                WHERE user_id = $1 AND protocol_score >= 80
            ) ranked
            GROUP BY grp
        ) streaks
        "#,
    )
    .bind(user_id)
    .fetch_one(pool.get_ref())
    .await
    .unwrap_or(0);

    // Get last completed date
    let last_completed = sqlx::query_scalar::<_, chrono::NaiveDate>(
        "SELECT protocol_date FROM daily_protocol WHERE user_id = $1 AND protocol_score >= 80 ORDER BY protocol_date DESC LIMIT 1"
    )
    .bind(user_id)
    .fetch_optional(pool.get_ref())
    .await
    .ok()
    .flatten();

    HttpResponse::Ok().json(json!({
        "status": "success",
        "data": {
            "current": streak,
            "longest": longest,
            "last_completed": last_completed.map(|d| d.format("%Y-%m-%d").to_string())
        },
        "meta": { "request_id": request_id }
    }))
}

/// Create/update protocol
#[derive(Debug, Deserialize)]
pub struct CreateProtocolRequest {
    pub date: String,
    #[serde(alias = "wake05")]
    pub wake05: bool,
    #[serde(alias = "germanStudy")]
    pub german_study: bool,
    #[serde(alias = "gymWorkout")]
    pub gym_workout: bool,
    #[serde(alias = "sleep22")]
    pub sleep22: bool,
    #[serde(alias = "codingHours")]
    pub coding_hours: f64,
    pub notes: Option<String>,
}

pub async fn create_protocol(
    req: HttpRequest,
    body: web::Json<CreateProtocolRequest>,
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

    // Calculate score
    let mut completed = 0;
    if body.wake05 {
        completed += 1;
    }
    if body.german_study {
        completed += 1;
    }
    if body.gym_workout {
        completed += 1;
    }
    if body.sleep22 {
        completed += 1;
    }
    let score = (completed as f64 / 4.0 * 100.0) as i32;

    // Parse date
    let protocol_date = match chrono::NaiveDate::parse_from_str(&body.date, "%Y-%m-%d") {
        Ok(d) => d,
        Err(_) => {
            return HttpResponse::BadRequest().json(json!({
                "status": "error",
                "error": { "code": "INVALID_DATE", "message": "Invalid date format" },
                "meta": { "request_id": request_id }
            }));
        }
    };

    // Check if protocol exists for this date
    let existing = sqlx::query_scalar::<_, uuid::Uuid>(
        "SELECT id FROM daily_protocol WHERE user_id = $1 AND protocol_date = $2",
    )
    .bind(user_id)
    .bind(protocol_date)
    .fetch_optional(pool.get_ref())
    .await;

    let result = match existing {
        Ok(Some(id)) => {
            // Update existing
            sqlx::query_scalar::<_, uuid::Uuid>(
                r#"
                UPDATE daily_protocol SET 
                    protocol_score = $2,
                    actual_wake_time = CASE WHEN $3 THEN '05:00'::time ELSE NULL END,
                    german_completed = $4,
                    gym_completed = $5,
                    coding_completed = $6,
                    coding_duration_minutes = $7,
                    actual_sleep_time = CASE WHEN $8 THEN '22:00'::time ELSE NULL END,
                    notes = $9,
                    updated_at = NOW()
                WHERE id = $1
                RETURNING id
                "#,
            )
            .bind(id)
            .bind(score)
            .bind(body.wake05)
            .bind(body.german_study)
            .bind(body.gym_workout)
            .bind(body.coding_hours > 0.0)
            .bind((body.coding_hours * 60.0) as i32)
            .bind(body.sleep22)
            .bind(body.notes.clone().unwrap_or_default())
            .fetch_one(pool.get_ref())
            .await
        }
        _ => {
            // Insert new
            sqlx::query_scalar::<_, uuid::Uuid>(
                r#"
                INSERT INTO daily_protocol 
                    (id, user_id, protocol_date, protocol_score, target_wake_time, actual_wake_time, 
                     german_completed, gym_completed, coding_completed, coding_duration_minutes, 
                     target_sleep_time, actual_sleep_time, notes, created_at)
                VALUES (gen_random_uuid(), $1, $2, $3, '05:00'::time, 
                        CASE WHEN $4 THEN '05:00'::time ELSE NULL END, 
                        $5, $6, $7, $8, '22:00'::time, 
                        CASE WHEN $9 THEN '22:00'::time ELSE NULL END, 
                        $10, NOW())
                RETURNING id
                "#
            )
            .bind(user_id)
            .bind(protocol_date)
            .bind(score)
            .bind(body.wake05)
            .bind(body.german_study)
            .bind(body.gym_workout)
            .bind(body.coding_hours > 0.0)
            .bind((body.coding_hours * 60.0) as i32)
            .bind(body.sleep22)
            .bind(body.notes.clone().unwrap_or_default())
            .fetch_one(pool.get_ref())
            .await
        }
    };

    match result {
        Ok(id) => HttpResponse::Created().json(json!({
            "status": "success",
            "data": {
                "id": id.to_string(),
                "score": score,
                "message": "Protocol saved"
            },
            "meta": { "request_id": request_id }
        })),
        Err(e) => {
            tracing::error!("Failed to save protocol: {}", e);
            HttpResponse::InternalServerError().json(json!({
                "status": "error",
                "error": { "code": "DB_ERROR", "message": "Failed to save protocol" },
                "meta": { "request_id": request_id }
            }))
        }
    }
}

/// Retention status endpoint
pub async fn get_retention(req: HttpRequest) -> HttpResponse {
    let request_id = get_request_id(&req);

    HttpResponse::Ok().json(json!({
        "status": "success",
        "data": {
            "status": "active",
            "risk_level": "low",
            "suggestions": []
        },
        "meta": { "request_id": request_id }
    }))
}
