//! Analytics API handlers

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

#[derive(Debug, Deserialize)]
pub struct TrendsQuery {
    pub weeks: Option<i32>,
}

/// Get analytics trends
pub async fn get_trends(
    req: HttpRequest,
    _query: web::Query<TrendsQuery>,
    pool: web::Data<PgPool>,
    auth_service: web::Data<AuthService>,
) -> HttpResponse {
    let request_id = get_request_id(&req);
    let weeks = _query.weeks.unwrap_or(8).clamp(1, 52);

    let user_id = match extract_user_id(&req, &auth_service) {
        Some(id) => id,
        None => {
            return HttpResponse::Unauthorized().json(json!({
                "status": "error",
                "error": { "code": "UNAUTHORIZED", "message": "Authentication required" }
            }));
        }
    };

    // Get weekly workout data
    let workout_trends = sqlx::query(
        r#"
        SELECT 
            DATE_TRUNC('week', created_at)::date as week,
            COUNT(*) as sessions,
            COALESCE(SUM(duration_minutes), 0) as minutes
        FROM workouts
        WHERE user_id = $1 AND created_at >= NOW() - INTERVAL '1 year'
        GROUP BY DATE_TRUNC('week', created_at)
        ORDER BY week DESC
        LIMIT $2
        "#,
    )
    .bind(user_id)
    .bind(weeks)
    .fetch_all(pool.get_ref())
    .await;

    let body_trends: Vec<_> = match workout_trends {
        Ok(rows) => rows
            .iter()
            .map(|row| {
                let week: chrono::NaiveDate = row.try_get("week").unwrap_or_default();
                let sessions: i64 = row.try_get("sessions").unwrap_or(0);
                let minutes: i64 = row.try_get("minutes").unwrap_or(0);
                json!({
                    "week": week.format("%Y-%m-%d").to_string(),
                    "sessions": sessions,
                    "minutes": minutes
                })
            })
            .collect(),
        Err(_) => vec![],
    };

    // Get coding trends
    let code_trends = sqlx::query(
        r#"
        SELECT 
            DATE_TRUNC('week', created_at)::date as week,
            COUNT(*) as sessions,
            COALESCE(SUM(duration_minutes), 0) as minutes,
            COALESCE(SUM(commits_made), 0) as commits
        FROM coding_sessions
        WHERE user_id = $1 AND created_at >= NOW() - INTERVAL '1 year'
        GROUP BY DATE_TRUNC('week', created_at)
        ORDER BY week DESC
        LIMIT $2
        "#,
    )
    .bind(user_id)
    .bind(weeks)
    .fetch_all(pool.get_ref())
    .await;

    let code_trends: Vec<_> = match code_trends {
        Ok(rows) => rows
            .iter()
            .map(|row| {
                let week: chrono::NaiveDate = row.try_get("week").unwrap_or_default();
                let sessions: i64 = row.try_get("sessions").unwrap_or(0);
                let minutes: i64 = row.try_get("minutes").unwrap_or(0);
                let commits: i64 = row.try_get("commits").unwrap_or(0);
                json!({
                    "week": week.format("%Y-%m-%d").to_string(),
                    "sessions": sessions,
                    "hours": minutes as f64 / 60.0,
                    "commits": commits
                })
            })
            .collect(),
        Err(_) => vec![],
    };

    // Get German trends
    let german_trends = sqlx::query(
        r#"
        SELECT 
            DATE_TRUNC('week', created_at)::date as week,
            COUNT(*) as sessions,
            COALESCE(SUM(duration_minutes), 0) as minutes,
            COALESCE(SUM(anki_cards_reviewed), 0) as anki_cards
        FROM german_sessions
        WHERE user_id = $1 AND created_at >= NOW() - INTERVAL '1 year'
        GROUP BY DATE_TRUNC('week', created_at)
        ORDER BY week DESC
        LIMIT $2
        "#,
    )
    .bind(user_id)
    .bind(weeks)
    .fetch_all(pool.get_ref())
    .await;

    let german_trends: Vec<_> = match german_trends {
        Ok(rows) => rows
            .iter()
            .map(|row| {
                let week: chrono::NaiveDate = row.try_get("week").unwrap_or_default();
                let sessions: i64 = row.try_get("sessions").unwrap_or(0);
                let minutes: i64 = row.try_get("minutes").unwrap_or(0);
                let cards: i64 = row.try_get("anki_cards").unwrap_or(0);
                json!({
                    "week": week.format("%Y-%m-%d").to_string(),
                    "sessions": sessions,
                    "minutes": minutes,
                    "anki_cards": cards
                })
            })
            .collect(),
        Err(_) => vec![],
    };

    // Get protocol trends
    let protocol_trends = sqlx::query(
        r#"
        SELECT 
            DATE_TRUNC('week', protocol_date)::date as week,
            COALESCE(AVG(protocol_score), 0)::float8 as avg_score,
            COUNT(*) as days_logged
        FROM daily_protocol
        WHERE user_id = $1 AND protocol_date >= CURRENT_DATE - INTERVAL '1 year'
        GROUP BY DATE_TRUNC('week', protocol_date)
        ORDER BY week DESC
        LIMIT $2
        "#,
    )
    .bind(user_id)
    .bind(weeks)
    .fetch_all(pool.get_ref())
    .await;

    let protocol_trends: Vec<_> = match protocol_trends {
        Ok(rows) => rows
            .iter()
            .map(|row| {
                let week: chrono::NaiveDate = row.try_get("week").unwrap_or_default();
                let score: f64 = row.try_get("avg_score").unwrap_or(0.0);
                let days: i64 = row.try_get("days_logged").unwrap_or(0);
                json!({
                    "week": week.format("%Y-%m-%d").to_string(),
                    "score": score,
                    "days_logged": days
                })
            })
            .collect(),
        Err(_) => vec![],
    };

    HttpResponse::Ok().json(json!({
        "status": "success",
        "data": {
            "trends": {
                "weeks": weeks,
                "body": body_trends,
                "code": code_trends,
                "german": german_trends,
                "protocol": protocol_trends,
                "finance": [],
                "mind": []
            }
        },
        "meta": { "request_id": request_id }
    }))
}
