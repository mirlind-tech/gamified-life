//! Adaptive assessment API handlers

use actix_web::{HttpRequest, HttpResponse, web};
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

/// Get adaptive profile based on user's actual data
pub async fn get_profile(
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

    // Calculate levels based on actual user data
    let body_level = calculate_body_level(&pool, user_id).await;
    let mind_level = calculate_mind_level(&pool, user_id).await;
    let career_level = calculate_career_level(&pool, user_id).await;
    let finance_level = calculate_finance_level(&pool, user_id).await;
    let german_level = calculate_german_level(&pool, user_id).await;

    // Calculate difficulty factor based on performance
    let difficulty_factor = calculate_difficulty_factor(
        body_level,
        mind_level,
        career_level,
        finance_level,
        german_level,
    );

    // Estimate daily minutes based on current commitments
    let daily_minutes = estimate_daily_minutes(&pool, user_id).await;

    HttpResponse::Ok().json(json!({
        "status": "success",
        "data": {
            "profile": {
                "body_level": body_level,
                "mind_level": mind_level,
                "career_level": career_level,
                "finance_level": finance_level,
                "german_level": german_level,
                "daily_minutes": daily_minutes,
                "stress_level": 3, // Default moderate stress
                "difficulty_factor": difficulty_factor,
                "baseline_completed": true
            }
        },
        "meta": { "request_id": request_id }
    }))
}

/// Get adaptive recommendation based on user's profile
pub async fn get_recommendation(
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

    // Get user's current focus areas
    let recommendations = generate_recommendations(&pool, user_id).await;

    HttpResponse::Ok().json(json!({
        "status": "success",
        "data": {
            "recommendations": recommendations
        },
        "meta": { "request_id": request_id }
    }))
}

// Helper functions

async fn calculate_body_level(pool: &PgPool, user_id: Uuid) -> i32 {
    let workout_count: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM workouts WHERE user_id = $1 AND created_at > NOW() - INTERVAL '30 days'"
    )
    .bind(user_id)
    .fetch_one(pool)
    .await
    .unwrap_or(0);

    match workout_count {
        0..=2 => 1,
        3..=6 => 2,
        7..=12 => 3,
        13..=20 => 4,
        _ => 5,
    }
}

async fn calculate_mind_level(pool: &PgPool, user_id: Uuid) -> i32 {
    let protocol_score: i64 = sqlx::query_scalar(
        "SELECT COALESCE(AVG(protocol_score), 0) FROM daily_protocol WHERE user_id = $1 AND protocol_date > NOW() - INTERVAL '30 days'"
    )
    .bind(user_id)
    .fetch_one(pool)
    .await
    .unwrap_or(0);

    match protocol_score {
        0..=20 => 1,
        21..=40 => 2,
        41..=60 => 3,
        61..=80 => 4,
        _ => 5,
    }
}

async fn calculate_career_level(pool: &PgPool, user_id: Uuid) -> i32 {
    let coding_hours: f64 = sqlx::query_scalar(
        "SELECT COALESCE(SUM(duration_minutes), 0) / 60.0 FROM coding_sessions WHERE user_id = $1 AND created_at > NOW() - INTERVAL '30 days'"
    )
    .bind(user_id)
    .fetch_one(pool)
    .await
    .unwrap_or(0.0);

    match coding_hours as i32 {
        0..=5 => 1,
        6..=15 => 2,
        16..=30 => 3,
        31..=50 => 4,
        _ => 5,
    }
}

async fn calculate_finance_level(pool: &PgPool, user_id: Uuid) -> i32 {
    let entries: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM finance_entries WHERE user_id = $1 AND entry_date > NOW() - INTERVAL '30 days'"
    )
    .bind(user_id)
    .fetch_one(pool)
    .await
    .unwrap_or(0);

    match entries {
        0..=5 => 1,
        6..=15 => 2,
        16..=25 => 3,
        26..=35 => 4,
        _ => 5,
    }
}

async fn calculate_german_level(pool: &PgPool, user_id: Uuid) -> i32 {
    let study_hours: f64 = sqlx::query_scalar(
        "SELECT COALESCE(SUM(duration_minutes), 0) / 60.0 FROM german_sessions WHERE user_id = $1 AND created_at > NOW() - INTERVAL '30 days'"
    )
    .bind(user_id)
    .fetch_one(pool)
    .await
    .unwrap_or(0.0);

    match study_hours as i32 {
        0..=3 => 1,
        4..=10 => 2,
        11..=20 => 3,
        21..=35 => 4,
        _ => 5,
    }
}

fn calculate_difficulty_factor(
    body: i32,
    mind: i32,
    career: i32,
    finance: i32,
    german: i32,
) -> f64 {
    let avg = (body + mind + career + finance + german) as f64 / 5.0;
    // Higher level = higher difficulty factor (1.0 to 1.5)
    1.0 + (avg - 1.0) * 0.125
}

async fn estimate_daily_minutes(pool: &PgPool, user_id: Uuid) -> i32 {
    let total_minutes: i64 = sqlx::query_scalar(
        "SELECT COALESCE(SUM(duration_minutes), 0) FROM workouts WHERE user_id = $1 AND created_at > NOW() - INTERVAL '7 days'"
    )
    .bind(user_id)
    .fetch_one(pool)
    .await
    .unwrap_or(0);

    let coding_minutes: i64 = sqlx::query_scalar(
        "SELECT COALESCE(SUM(duration_minutes), 0) FROM coding_sessions WHERE user_id = $1 AND created_at > NOW() - INTERVAL '7 days'"
    )
    .bind(user_id)
    .fetch_one(pool)
    .await
    .unwrap_or(0);

    let german_minutes: i64 = sqlx::query_scalar(
        "SELECT COALESCE(SUM(duration_minutes), 0) FROM german_sessions WHERE user_id = $1 AND created_at > NOW() - INTERVAL '7 days'"
    )
    .bind(user_id)
    .fetch_one(pool)
    .await
    .unwrap_or(0);

    let total_weekly = (total_minutes + coding_minutes + german_minutes) as i32;
    // Add baseline for protocol, Anki, etc.
    (total_weekly / 7) + 60
}

async fn generate_recommendations(pool: &PgPool, user_id: Uuid) -> Vec<serde_json::Value> {
    let mut recommendations = vec![];

    // Check each pillar and recommend based on level
    let body_level = calculate_body_level(pool, user_id).await;
    let mind_level = calculate_mind_level(pool, user_id).await;
    let career_level = calculate_career_level(pool, user_id).await;
    let finance_level = calculate_finance_level(pool, user_id).await;
    let german_level = calculate_german_level(pool, user_id).await;

    // Find the weakest pillar
    let levels = [
        ("body", body_level),
        ("mind", mind_level),
        ("career", career_level),
        ("finance", finance_level),
        ("german", german_level),
    ];

    let min_level = levels
        .iter()
        .min_by_key(|(_, l)| l)
        .map(|(_, l)| *l)
        .unwrap_or(1);
    let weak_pillars: Vec<_> = levels
        .iter()
        .filter(|(_, l)| *l == min_level)
        .map(|(p, _)| *p)
        .collect();

    for pillar in weak_pillars.iter().take(2) {
        let rec = match *pillar {
            "body" => json!({
                "pillar": "body",
                "priority": "high",
                "action": "Increase workout frequency",
                "suggestion": "Aim for at least 3 workouts per week",
                "estimated_time": "45 min/day"
            }),
            "mind" => json!({
                "pillar": "mind",
                "priority": "high",
                "action": "Strengthen protocol adherence",
                "suggestion": "Focus on wake time and sleep schedule consistency",
                "estimated_time": "Focus on routine"
            }),
            "career" => json!({
                "pillar": "career",
                "priority": "high",
                "action": "Increase coding hours",
                "suggestion": "Dedicate at least 1 hour daily to skill development",
                "estimated_time": "60 min/day"
            }),
            "finance" => json!({
                "pillar": "finance",
                "priority": "medium",
                "action": "Track expenses daily",
                "suggestion": "Log all transactions to build awareness",
                "estimated_time": "5 min/day"
            }),
            "german" => json!({
                "pillar": "german",
                "priority": "high",
                "action": "Increase German study time",
                "suggestion": "Combine Anki + radio + tandem for immersion",
                "estimated_time": "45 min/day"
            }),
            _ => continue,
        };
        recommendations.push(rec);
    }

    // Add a general recommendation
    recommendations.push(json!({
        "pillar": "general",
        "priority": "medium",
        "action": "Review weekly goals",
        "suggestion": "Check your weekly plan and adjust priorities",
        "estimated_time": "15 min/week"
    }));

    recommendations
}
