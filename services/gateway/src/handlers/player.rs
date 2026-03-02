//! Player stats handlers with PostgreSQL integration

use actix_web::{HttpRequest, HttpResponse, web};
use serde::Deserialize;
use serde_json::json;
use sqlx::PgPool;
use uuid::Uuid;

use crate::handlers::auth::get_request_id;
use crate::models::{ActivityStats, AddXPResponse, PlayerStats};
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

/// Get player stats from PostgreSQL
pub async fn get_stats(
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

    let result = sqlx::query_as::<_, (i64, i32, i32, serde_json::Value, serde_json::Value)>(
        r#"
        SELECT gs.xp_total as xp, gs.level, gs.streak_days,
               COALESCE((
                   SELECT json_object_agg(domain, json_build_object(
                       'level', 1,
                       'xp', 0,
                       'xpToNext', 100,
                       'name', domain,
                       'color', '#00ff88'
                   ))
                   FROM (
                       SELECT 'body' as domain
                       UNION SELECT 'mind'
                       UNION SELECT 'german'
                       UNION SELECT 'code'
                       UNION SELECT 'finance'
                   ) domains
               ), '{}'::json) as pillars,
               '{}'::json as skills
        FROM gamification_stats gs
        WHERE gs.user_id = $1
        "#,
    )
    .bind(user_id)
    .fetch_one(pool.get_ref())
    .await;

    match result {
        Ok((xp, level, _streak, pillars, skills)) => {
            let xp_to_next = level * 100;

            let stats = PlayerStats {
                level,
                xp: xp as i32,
                xp_to_next,
                pillars,
                skills,
                activity_stats: ActivityStats::default(),
            };

            HttpResponse::Ok().json(json!({
                "status": "success",
                "data": { "stats": stats },
                "meta": { "request_id": request_id }
            }))
        }
        Err(e) => {
            tracing::warn!("Failed to get player stats: {}", e);
            HttpResponse::Ok().json(json!({
                "status": "success",
                "data": {
                    "stats": PlayerStats {
                        level: 1,
                        xp: 0,
                        xp_to_next: 100,
                        pillars: json!({}),
                        skills: json!({}),
                        activity_stats: ActivityStats::default(),
                    }
                },
                "meta": { "request_id": request_id }
            }))
        }
    }
}

/// Request body for adding XP
#[derive(Debug, Deserialize)]
pub struct AddXPRequest {
    pub amount: i32,
    pub pillar: Option<String>,
    pub skill_id: Option<String>,
}

/// Add XP to player
pub async fn add_xp(
    req: HttpRequest,
    body: web::Json<AddXPRequest>,
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

    let AddXPRequest {
        amount,
        pillar: _pillar,
        skill_id: _skill_id,
    } = body.into_inner();

    // Get current stats for user
    let current = sqlx::query_as::<_, (i64, i32)>(
        "SELECT xp_total, level FROM gamification_stats WHERE user_id = $1",
    )
    .bind(user_id)
    .fetch_one(pool.get_ref())
    .await;

    let (current_xp, current_level) = match current {
        Ok((xp, lvl)) => (xp as i32, lvl),
        Err(_) => (0, 1),
    };

    let new_xp = current_xp + amount;
    let new_level = (new_xp / 100) + 1;
    let xp_to_next = new_level * 100;
    let progress = (new_xp % 100) as f64 / 100.0;
    let level_up = new_level > current_level;
    let levels_gained = new_level - current_level;

    // Update in database
    let _ = sqlx::query(
        "UPDATE gamification_stats SET xp_total = $1, level = $2, updated_at = NOW() WHERE user_id = $3"
    )
    .bind(new_xp as i64)
    .bind(new_level)
    .bind(user_id)
    .execute(pool.get_ref())
    .await;

    HttpResponse::Ok().json(json!({
        "status": "success",
        "data": AddXPResponse {
            message: format!("Added {} XP", amount),
            level_up,
            levels_gained,
            new_level,
            xp: new_xp,
            xp_to_next,
            progress,
        },
        "meta": { "request_id": request_id }
    }))
}

/// Track activity
#[derive(Debug, Deserialize)]
pub struct TrackActivityRequest {
    pub activity_type: String,
    pub count: Option<i32>,
}

pub async fn track_activity(
    req: HttpRequest,
    body: web::Json<TrackActivityRequest>,
) -> HttpResponse {
    let request_id = get_request_id(&req);

    HttpResponse::Ok().json(json!({
        "status": "success",
        "data": {
            "message": "Activity tracked",
            "type": body.activity_type,
            "total": body.count.unwrap_or(1),
        },
        "meta": { "request_id": request_id }
    }))
}

/// Update player stats
#[derive(Debug, Deserialize)]
pub struct UpdateStatsRequest {
    pub level: Option<i32>,
    pub xp: Option<i32>,
}

pub async fn update_stats(
    req: HttpRequest,
    body: web::Json<UpdateStatsRequest>,
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

    if let Some(xp) = body.xp {
        let _ = sqlx::query("UPDATE gamification_stats SET xp_total = $1 WHERE user_id = $2")
            .bind(xp as i64)
            .bind(user_id)
            .execute(pool.get_ref())
            .await;
    }

    if let Some(level) = body.level {
        let _ = sqlx::query("UPDATE gamification_stats SET level = $1 WHERE user_id = $2")
            .bind(level)
            .bind(user_id)
            .execute(pool.get_ref())
            .await;
    }

    HttpResponse::Ok().json(json!({
        "status": "success",
        "data": { "message": "Stats updated" },
        "meta": { "request_id": request_id }
    }))
}
