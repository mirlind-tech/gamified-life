//! Workouts API handlers

use actix_web::{HttpRequest, HttpResponse, web};
use serde::{Deserialize, Serialize};
use serde_json::json;
use sqlx::PgPool;
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

/// Get all workouts for user
pub async fn get_workouts(
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

    let workouts = sqlx::query_as::<_, WorkoutRow>(
        r#"
        SELECT id, user_id, workout_name, duration_minutes, exercises, total_volume_kg::float8, notes, created_at
        FROM workouts
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT 50
        "#
    )
    .bind(user_id)
    .fetch_all(pool.get_ref())
    .await;

    match workouts {
        Ok(rows) => {
            let workouts: Vec<WorkoutResponse> = rows.into_iter().map(|r| r.into()).collect();
            HttpResponse::Ok().json(json!({
                "status": "success",
                "data": { "workouts": workouts },
                "meta": { "request_id": request_id }
            }))
        }
        Err(e) => {
            tracing::warn!("Failed to get workouts: {}", e);
            HttpResponse::Ok().json(json!({
                "status": "success",
                "data": { "workouts": Vec::<WorkoutResponse>::new() },
                "meta": { "request_id": request_id }
            }))
        }
    }
}

/// Create new workout
#[derive(Debug, Deserialize)]
pub struct CreateWorkoutRequest {
    pub name: String,
    #[serde(alias = "durationMinutes")]
    pub duration: i32,
    pub exercises: Option<serde_json::Value>,
    pub notes: Option<String>,
}

pub async fn create_workout(
    req: HttpRequest,
    body: web::Json<CreateWorkoutRequest>,
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
        INSERT INTO workouts (user_id, workout_name, workout_type, started_at, duration_minutes, exercises, total_volume_kg, notes, source, created_at)
        VALUES ($1, $2, 'strength', NOW(), $3, $4, 0, $5, 'web', NOW())
        RETURNING id
        "#
    )
    .bind(user_id)
    .bind(&body.name)
    .bind(body.duration)
    .bind(body.exercises.clone().unwrap_or(json!([])))
    .bind(body.notes.clone().unwrap_or_default())
    .fetch_one(pool.get_ref())
    .await;

    match result {
        Ok(id) => HttpResponse::Created().json(json!({
            "status": "success",
            "data": {
                "id": id.to_string(),
                "message": "Workout created"
            },
            "meta": { "request_id": request_id }
        })),
        Err(e) => {
            tracing::error!("Failed to create workout: {}", e);
            HttpResponse::InternalServerError().json(json!({
                "status": "error",
                "error": { "code": "DB_ERROR", "message": "Failed to create workout" },
                "meta": { "request_id": request_id }
            }))
        }
    }
}

/// Get body measurements
pub async fn get_body_latest(
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

    // Get latest body measurement for user
    let measurement = sqlx::query_as::<_, BodyMeasurementRow>(
        r#"
        SELECT weight_kg, height_cm, biceps_cm, chest_cm, waist_cm, hips_cm, thighs_cm, calves_cm, shoulders_cm, measured_at
        FROM body_measurements
        WHERE user_id = $1
        ORDER BY measured_at DESC
        LIMIT 1
        "#
    )
    .bind(user_id)
    .fetch_optional(pool.get_ref())
    .await;

    match measurement {
        Ok(Some(row)) => HttpResponse::Ok().json(json!({
            "status": "success",
            "data": {
                "measurements": {
                    "weight": row.weight_kg,
                    "height": row.height_cm,
                    "biceps": row.biceps_cm,
                    "chest": row.chest_cm,
                    "waist": row.waist_cm,
                    "hips": row.hips_cm,
                    "thighs": row.thighs_cm,
                    "calves": row.calves_cm,
                    "shoulders": row.shoulders_cm,
                    "date": row.measured_at.to_rfc3339()
                }
            },
            "meta": { "request_id": request_id }
        })),
        _ => {
            // Return default body stats if none found
            HttpResponse::Ok().json(json!({
                "status": "success",
                "data": {
                    "measurements": {
                        "weight": 60.0,
                        "height": 170.0,
                        "biceps": 26.0,
                        "chest": 90.0,
                        "waist": 75.0,
                        "hips": 81.0,
                        "thighs": 50.0,
                        "calves": 35.0,
                        "shoulders": 112.0,
                        "date": chrono::Utc::now().to_rfc3339()
                    }
                },
                "meta": { "request_id": request_id }
            }))
        }
    }
}

/// Telemetry event endpoint (stub)
pub async fn telemetry_event(
    req: HttpRequest,
    _body: web::Json<serde_json::Value>,
) -> HttpResponse {
    let request_id = get_request_id(&req);

    HttpResponse::Ok().json(json!({
        "status": "success",
        "data": { "received": true },
        "meta": { "request_id": request_id }
    }))
}

/// Telemetry error endpoint (stub)
pub async fn telemetry_error(req: HttpRequest, body: web::Json<serde_json::Value>) -> HttpResponse {
    let request_id = get_request_id(&req);

    tracing::warn!("Client error reported: {:?}", body);

    HttpResponse::Ok().json(json!({
        "status": "success",
        "data": { "received": true },
        "meta": { "request_id": request_id }
    }))
}

/// Outcomes endpoint - get user's weekly outcomes
pub async fn get_outcomes(
    req: HttpRequest,
    pool: web::Data<PgPool>,
    auth_service: web::Data<AuthService>,
    _query: web::Query<std::collections::HashMap<String, String>>,
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

    // Calculate outcomes based on actual data
    let outcomes = calculate_outcomes(&pool, user_id).await;

    HttpResponse::Ok().json(json!({
        "status": "success",
        "data": { "outcomes": outcomes },
        "meta": { "request_id": request_id }
    }))
}

/// Outcomes summary endpoint
pub async fn get_outcomes_summary(
    req: HttpRequest,
    pool: web::Data<PgPool>,
    auth_service: web::Data<AuthService>,
    _query: web::Query<std::collections::HashMap<String, String>>,
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

    // Calculate summary based on actual data
    let summary = calculate_outcomes_summary(&pool, user_id).await;

    HttpResponse::Ok().json(json!({
        "status": "success",
        "data": summary,
        "meta": { "request_id": request_id }
    }))
}

/// Calculate outcomes from user's actual data
async fn calculate_outcomes(pool: &PgPool, user_id: Uuid) -> Vec<serde_json::Value> {
    let mut outcomes = vec![];

    // Body outcomes
    let workout_count: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM workouts WHERE user_id = $1 AND created_at > NOW() - INTERVAL '7 days'"
    )
    .bind(user_id)
    .fetch_one(pool)
    .await
    .unwrap_or(0);

    outcomes.push(json!({
        "pillar": "body",
        "goal": "Complete 4 workouts per week",
        "achieved": workout_count >= 4,
        "current": workout_count,
        "target": 4,
        "trend": if workout_count >= 4 { "up" } else { "neutral" }
    }));

    // Coding outcomes
    let coding_hours: f64 = sqlx::query_scalar(
        "SELECT COALESCE(SUM(duration_minutes), 0) / 60.0 FROM coding_sessions WHERE user_id = $1 AND created_at > NOW() - INTERVAL '7 days'"
    )
    .bind(user_id)
    .fetch_one(pool)
    .await
    .unwrap_or(0.0);

    outcomes.push(json!({
        "pillar": "career",
        "goal": "Code 10 hours per week",
        "achieved": coding_hours >= 10.0,
        "current": coding_hours,
        "target": 10,
        "trend": if coding_hours >= 10.0 { "up" } else { "neutral" }
    }));

    // German outcomes
    let german_hours: f64 = sqlx::query_scalar(
        "SELECT COALESCE(SUM(duration_minutes), 0) / 60.0 FROM german_sessions WHERE user_id = $1 AND created_at > NOW() - INTERVAL '7 days'"
    )
    .bind(user_id)
    .fetch_one(pool)
    .await
    .unwrap_or(0.0);

    outcomes.push(json!({
        "pillar": "german",
        "goal": "Study German 5 hours per week",
        "achieved": german_hours >= 5.0,
        "current": german_hours,
        "target": 5,
        "trend": if german_hours >= 5.0 { "up" } else { "neutral" }
    }));

    // Protocol outcomes
    let protocol_days: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM daily_protocol WHERE user_id = $1 AND protocol_score >= 80 AND protocol_date > NOW() - INTERVAL '7 days'"
    )
    .bind(user_id)
    .fetch_one(pool)
    .await
    .unwrap_or(0);

    outcomes.push(json!({
        "pillar": "protocol",
        "goal": "Complete 5 high-score days per week",
        "achieved": protocol_days >= 5,
        "current": protocol_days,
        "target": 5,
        "trend": if protocol_days >= 5 { "up" } else { "neutral" }
    }));

    outcomes
}

/// Calculate outcomes summary
async fn calculate_outcomes_summary(pool: &PgPool, user_id: Uuid) -> serde_json::Value {
    let outcomes = calculate_outcomes(pool, user_id).await;

    let total_goals = outcomes.len() as i32;
    let achieved_goals = outcomes
        .iter()
        .filter(|o| o["achieved"].as_bool().unwrap_or(false))
        .count() as i32;

    let completion_rate = if total_goals > 0 {
        (achieved_goals as f64 / total_goals as f64) * 100.0
    } else {
        0.0
    };

    json!({
        "goals": outcomes,
        "objectives": [],
        "actions": [],
        "score": {
            "score": achieved_goals * 20, // Max 100
            "completionRate": completion_rate,
            "objectiveRate": 0.0,
            "checkinRate": 0.0
        }
    })
}

// Database row types
#[derive(sqlx::FromRow)]
struct WorkoutRow {
    id: uuid::Uuid,
    user_id: uuid::Uuid,
    workout_name: String,
    duration_minutes: i32,
    exercises: serde_json::Value,
    total_volume_kg: Option<f64>,
    notes: Option<String>,
    created_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, Serialize)]
struct WorkoutResponse {
    id: String,
    user_id: String,
    name: String,
    duration_minutes: i32,
    exercises: serde_json::Value,
    total_volume_kg: Option<f64>,
    notes: Option<String>,
    created_at: String,
}

impl From<WorkoutRow> for WorkoutResponse {
    fn from(row: WorkoutRow) -> Self {
        Self {
            id: row.id.to_string(),
            user_id: row.user_id.to_string(),
            name: row.workout_name,
            duration_minutes: row.duration_minutes,
            exercises: row.exercises,
            total_volume_kg: row.total_volume_kg,
            notes: row.notes,
            created_at: row.created_at.to_rfc3339(),
        }
    }
}

#[derive(sqlx::FromRow)]
struct BodyMeasurementRow {
    weight_kg: Option<f64>,
    height_cm: Option<f64>,
    biceps_cm: Option<f64>,
    chest_cm: Option<f64>,
    waist_cm: Option<f64>,
    hips_cm: Option<f64>,
    thighs_cm: Option<f64>,
    calves_cm: Option<f64>,
    shoulders_cm: Option<f64>,
    measured_at: chrono::DateTime<chrono::Utc>,
}
