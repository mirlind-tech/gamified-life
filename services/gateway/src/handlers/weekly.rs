//! Weekly plan API handlers

use actix_web::{HttpRequest, HttpResponse, web};
use chrono::Datelike;
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

#[derive(Debug, Deserialize)]
pub struct WeekQuery {
    pub week_start: Option<String>,
}

/// Get weekly plan
pub async fn get_plan(
    req: HttpRequest,
    _query: web::Query<WeekQuery>,
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

    let week_start = _query.week_start.clone().unwrap_or_else(|| {
        // Default to current week's Monday
        let today = chrono::Local::now().date_naive();
        let days_from_monday = today.weekday().num_days_from_monday();
        let monday = today - chrono::Duration::days(days_from_monday as i64);
        monday.format("%Y-%m-%d").to_string()
    });

    // Try to load saved weekly plan from database
    let plan = sqlx::query(
        r#"
        SELECT goals, objectives, actions
        FROM weekly_plans
        WHERE user_id = $1 AND week_start = $2::date
        LIMIT 1
        "#,
    )
    .bind(user_id)
    .bind(&week_start)
    .fetch_optional(pool.get_ref())
    .await;

    let (goals, objectives, actions) = match plan {
        Ok(Some(row)) => {
            let goals: Option<serde_json::Value> = row.try_get("goals").unwrap_or(None);
            let objectives: Option<serde_json::Value> = row.try_get("objectives").unwrap_or(None);
            let actions: Option<serde_json::Value> = row.try_get("actions").unwrap_or(None);
            (
                goals.unwrap_or_else(|| json!([])),
                objectives.unwrap_or_else(|| json!([])),
                actions.unwrap_or_else(|| json!({})),
            )
        }
        _ => (json!([]), json!([]), json!({})),
    };

    HttpResponse::Ok().json(json!({
        "status": "success",
        "data": {
            "week_start": week_start,
            "goals": goals,
            "objectives": objectives,
            "actions": actions,
            "review": null
        },
        "meta": { "request_id": request_id }
    }))
}

/// Get weekly review
pub async fn get_review(
    req: HttpRequest,
    _query: web::Query<WeekQuery>,
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

    let week_start = _query.week_start.clone().unwrap_or_else(|| {
        let today = chrono::Local::now().date_naive();
        let days_from_monday = today.weekday().num_days_from_monday();
        let monday = today - chrono::Duration::days(days_from_monday as i64);
        monday.format("%Y-%m-%d").to_string()
    });

    // Try to load saved weekly review
    let review = sqlx::query(
        r#"
        SELECT wins, failures, lessons, score
        FROM weekly_reviews
        WHERE user_id = $1 AND week_start = $2::date
        LIMIT 1
        "#,
    )
    .bind(user_id)
    .bind(&week_start)
    .fetch_optional(pool.get_ref())
    .await;

    let (wins, failures, lessons, score) = match review {
        Ok(Some(row)) => {
            let wins: Option<serde_json::Value> = row.try_get("wins").unwrap_or(None);
            let failures: Option<serde_json::Value> = row.try_get("failures").unwrap_or(None);
            let lessons: Option<serde_json::Value> = row.try_get("lessons").unwrap_or(None);
            let score: Option<i32> = row.try_get("score").unwrap_or(Some(0));
            (
                wins.unwrap_or_else(|| json!([])),
                failures.unwrap_or_else(|| json!([])),
                lessons.unwrap_or_else(|| json!([])),
                score.unwrap_or(0),
            )
        }
        _ => (json!([]), json!([]), json!([]), 0),
    };

    HttpResponse::Ok().json(json!({
        "status": "success",
        "data": {
            "week_start": week_start,
            "wins": wins,
            "failures": failures,
            "lessons": lessons,
            "score": score
        },
        "meta": { "request_id": request_id }
    }))
}
