//! Skills Tree API handlers

use actix_web::{HttpRequest, HttpResponse, web};
use serde::Deserialize;
use serde_json::json;
use sqlx::{PgPool, Row};
use uuid::Uuid;

use crate::handlers::auth::get_request_id;
use crate::services::AuthService;

/// All 12 skills with their metadata
const SKILLS_DATA: &[(&str, &str, &str, i32)] = &[
    // (key, name, category, estimated_hours)
    ("backflip", "Backflip", "physical", 40),
    ("handstand", "Handstand", "physical", 40),
    ("muscle_up", "Muscle Up", "physical", 40),
    ("guitar", "Play Guitar Song", "creative", 40),
    ("beatbox", "Beatbox", "creative", 40),
    ("juggling", "Juggling", "creative", 40),
    ("salsa", "Salsa Basic", "social", 40),
    ("magic", "Magic Card Trick", "social", 40),
    ("speed_reading", "Speed Reading", "mental", 40),
    ("memory_palace", "Memory Palace", "mental", 40),
    ("knots", "Essential Knots", "survival", 40),
    ("fire_making", "Fire Making", "survival", 40),
];

/// Extract user ID from JWT token
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

/// Get all skills for user
pub async fn get_skills(
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

    // Initialize skills if not exists
    for (key, _name, category, _hours) in SKILLS_DATA {
        let _ = sqlx::query(
            "INSERT INTO skills (user_id, skill_key, category, status) VALUES ($1, $2, $3, 'locked') ON CONFLICT DO NOTHING"
        )
        .bind(user_id)
        .bind(key)
        .bind(category)
        .execute(pool.get_ref())
        .await;
    }

    // Unlock first 3 skills for new users
    let _ = sqlx::query(
        "UPDATE skills SET status = 'available', unlocked_at = NOW() WHERE user_id = $1 AND skill_key IN ('backflip', 'handstand', 'muscle_up') AND status = 'locked'"
    )
    .bind(user_id)
    .execute(pool.get_ref())
    .await;

    // Fetch all skills
    let skills = sqlx::query(
        r#"
        SELECT skill_key, category, current_stage, stage_progress, hours_invested, status, started_at, completed_at
        FROM skills WHERE user_id = $1 ORDER BY category, skill_key
        "#
    )
    .bind(user_id)
    .fetch_all(pool.get_ref())
    .await;

    let skills_list: Vec<_> = match skills {
        Ok(rows) => rows.iter().map(|row| {
            let key: String = row.try_get("skill_key").unwrap_or_default();
            let skill_data = SKILLS_DATA.iter().find(|(k, _, _, _)| *k == key);
            let name = skill_data.map(|(_, n, _, _)| *n).unwrap_or(&key);
            let est_hours = skill_data.map(|(_, _, _, h)| *h).unwrap_or(40);

            json!({
                "id": key,
                "name": name,
                "category": row.try_get::<String, _>("category").unwrap_or_default(),
                "currentStage": row.try_get::<i32, _>("current_stage").unwrap_or(1),
                "stageProgress": row.try_get::<i32, _>("stage_progress").unwrap_or(0),
                "hoursInvested": row.try_get::<i32, _>("hours_invested").unwrap_or(0),
                "estimatedHours": est_hours,
                "status": row.try_get::<String, _>("status").unwrap_or_default(),
                "startedAt": row.try_get::<Option<chrono::DateTime<chrono::Utc>>, _>("started_at").ok().flatten().map(|d| d.to_rfc3339()),
                "completedAt": row.try_get::<Option<chrono::DateTime<chrono::Utc>>, _>("completed_at").ok().flatten().map(|d| d.to_rfc3339())
            })
        }).collect(),
        Err(_) => vec![],
    };

    HttpResponse::Ok().json(json!({
        "status": "success",
        "data": { "skills": skills_list },
        "meta": { "request_id": request_id }
    }))
}

/// Get single skill details
pub async fn get_skill(
    req: HttpRequest,
    path: web::Path<String>,
    pool: web::Data<PgPool>,
    auth_service: web::Data<AuthService>,
) -> HttpResponse {
    let request_id = get_request_id(&req);
    let skill_key = path.into_inner();

    let user_id = match extract_user_id(&req, &auth_service) {
        Some(id) => id,
        None => {
            return HttpResponse::Unauthorized().json(json!({
                "status": "error",
                "error": { "code": "UNAUTHORIZED", "message": "Authentication required" }
            }));
        }
    };

    let skill = sqlx::query(
        r#"
        SELECT skill_key, category, current_stage, stage_progress, hours_invested, status, started_at, completed_at
        FROM skills WHERE user_id = $1 AND skill_key = $2
        "#
    )
    .bind(user_id)
    .bind(&skill_key)
    .fetch_optional(pool.get_ref())
    .await;

    match skill {
        Ok(Some(row)) => {
            let skill_data = SKILLS_DATA.iter().find(|(k, _, _, _)| *k == skill_key);
            let name = skill_data.map(|(_, n, _, _)| *n).unwrap_or(&skill_key);
            let est_hours = skill_data.map(|(_, _, _, h)| *h).unwrap_or(40);

            // Define stages for each skill
            let stages = json!([
                { "number": 1, "name": "Foundation", "description": "Learn basics and fundamentals", "hours": 10 },
                { "number": 2, "name": "Progression", "description": "Build consistency and technique", "hours": 15 },
                { "number": 3, "name": "Execution", "description": "Master and perform consistently", "hours": 15 }
            ]);

            HttpResponse::Ok().json(json!({
                "status": "success",
                "data": {
                    "skill": {
                        "id": skill_key,
                        "name": name,
                        "category": row.try_get::<String, _>("category").unwrap_or_default(),
                        "currentStage": row.try_get::<i32, _>("current_stage").unwrap_or(1),
                        "stageProgress": row.try_get::<i32, _>("stage_progress").unwrap_or(0),
                        "hoursInvested": row.try_get::<i32, _>("hours_invested").unwrap_or(0),
                        "estimatedHours": est_hours,
                        "status": row.try_get::<String, _>("status").unwrap_or_default(),
                        "stages": stages,
                        "startedAt": row.try_get::<Option<chrono::DateTime<chrono::Utc>>, _>("started_at").ok().flatten().map(|d| d.to_rfc3339()),
                        "completedAt": row.try_get::<Option<chrono::DateTime<chrono::Utc>>, _>("completed_at").ok().flatten().map(|d| d.to_rfc3339())
                    }
                },
                "meta": { "request_id": request_id }
            }))
        }
        _ => HttpResponse::NotFound().json(json!({
            "status": "error",
            "error": { "code": "NOT_FOUND", "message": "Skill not found" },
            "meta": { "request_id": request_id }
        })),
    }
}

/// Update skill progress
#[derive(Debug, Deserialize)]
pub struct UpdateSkillRequest {
    #[serde(alias = "hoursInvested")]
    pub hours_invested: Option<i32>,
    #[serde(alias = "stageProgress")]
    pub stage_progress: Option<i32>,
    pub status: Option<String>,
}

pub async fn update_skill(
    req: HttpRequest,
    path: web::Path<String>,
    body: web::Json<UpdateSkillRequest>,
    pool: web::Data<PgPool>,
    auth_service: web::Data<AuthService>,
) -> HttpResponse {
    let request_id = get_request_id(&req);
    let skill_key = path.into_inner();

    let user_id = match extract_user_id(&req, &auth_service) {
        Some(id) => id,
        None => {
            return HttpResponse::Unauthorized().json(json!({
                "status": "error",
                "error": { "code": "UNAUTHORIZED", "message": "Authentication required" }
            }));
        }
    };

    // Build dynamic update query
    let mut updates = vec![];
    let mut started_at = None;

    if let Some(hours) = body.hours_invested {
        updates.push(format!("hours_invested = {}", hours));
        if hours > 0 {
            started_at = Some("started_at = COALESCE(started_at, NOW())");
        }
    }

    if let Some(progress) = body.stage_progress {
        updates.push(format!("stage_progress = {}", progress));
        // Auto-advance stage if progress >= 100
        if progress >= 100 {
            updates.push("current_stage = LEAST(current_stage + 1, 3)".to_string());
            updates.push("stage_progress = 0".to_string());
        }
    }

    if let Some(status) = &body.status {
        updates.push(format!("status = '{}'", status));
        if status == "completed" {
            updates.push("completed_at = NOW()".to_string());
        } else if status == "active" {
            started_at = Some("started_at = COALESCE(started_at, NOW())");
        }
    }

    if let Some(stmt) = started_at {
        updates.push(stmt.to_string());
    }

    updates.push("updated_at = NOW()".to_string());

    let query = format!(
        "UPDATE skills SET {} WHERE user_id = $1 AND skill_key = $2 RETURNING id",
        updates.join(", ")
    );

    let result = sqlx::query_scalar::<_, uuid::Uuid>(&query)
        .bind(user_id)
        .bind(&skill_key)
        .fetch_one(pool.get_ref())
        .await;

    match result {
        Ok(id) => HttpResponse::Ok().json(json!({
            "status": "success",
            "data": {
                "id": id.to_string(),
                "message": "Skill updated"
            },
            "meta": { "request_id": request_id }
        })),
        Err(e) => {
            tracing::error!("Failed to update skill: {}", e);
            HttpResponse::InternalServerError().json(json!({
                "status": "error",
                "error": { "code": "DB_ERROR", "message": "Failed to update skill" },
                "meta": { "request_id": request_id }
            }))
        }
    }
}

/// Get skills by category
pub async fn get_categories(req: HttpRequest) -> HttpResponse {
    let request_id = get_request_id(&req);

    let categories = json!([
        { "id": "physical", "name": "Physical", "icon": "💪", "skills": ["backflip", "handstand", "muscle_up"] },
        { "id": "creative", "name": "Creative", "icon": "🎨", "skills": ["guitar", "beatbox", "juggling"] },
        { "id": "social", "name": "Social", "icon": "🤝", "skills": ["salsa", "magic"] },
        { "id": "mental", "name": "Mental", "icon": "🧠", "skills": ["speed_reading", "memory_palace"] },
        { "id": "survival", "name": "Survival", "icon": "🔥", "skills": ["knots", "fire_making"] }
    ]);

    HttpResponse::Ok().json(json!({
        "status": "success",
        "data": { "categories": categories },
        "meta": { "request_id": request_id }
    }))
}
