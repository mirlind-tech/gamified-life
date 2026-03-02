//! Challenges API handlers

use actix_web::{HttpRequest, HttpResponse, web};
use serde::Deserialize;
use serde_json::json;
use sqlx::{PgPool, Row};
use uuid::Uuid;

use crate::handlers::auth::get_request_id;
use crate::services::AuthService;

/// Challenge definitions
const CHALLENGES_DATA: &[(&str, &str, i32, &str, i32, &str)] = &[
    // (key, title, duration_days, difficulty, xp_reward, description)
    (
        "ice_demon",
        "The Ice Demon",
        7,
        "4/5",
        500,
        "Cold showers, mental toughness",
    ),
    (
        "code_marathon",
        "Code Marathon",
        30,
        "3/5",
        1000,
        "Daily coding commitment",
    ),
    (
        "digital_detox",
        "Digital Detox War",
        7,
        "5/5",
        750,
        "Eliminate distractions",
    ),
    (
        "german_conquest",
        "German Conquest",
        14,
        "4/5",
        700,
        "Intensive German study",
    ),
    (
        "baki_forge",
        "Baki Body Forge",
        30,
        "4/5",
        1200,
        "Intense physical training",
    ),
    (
        "fang_yuan_mindset",
        "Fang Yuan Mindset",
        7,
        "5/5",
        800,
        "Mental discipline challenge",
    ),
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

/// Get all challenges
pub async fn get_challenges(
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

    // Initialize challenges if not exists
    for (key, title, duration, _difficulty, _xp, _) in CHALLENGES_DATA {
        let _ = sqlx::query(
            "INSERT INTO challenges (user_id, challenge_key, title, duration_days) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING"
        )
        .bind(user_id)
        .bind(key)
        .bind(title)
        .bind(duration)
        .execute(pool.get_ref())
        .await;
    }

    // Fetch challenges with progress
    let challenges = sqlx::query(
        r#"
        SELECT c.id, c.challenge_key, c.title, c.duration_days, c.status, c.progress, c.streak, 
               c.started_at, c.completed_at,
               (SELECT COUNT(*) FROM challenge_progress WHERE challenge_id = c.id AND completed = true) as days_completed
        FROM challenges c WHERE c.user_id = $1 ORDER BY c.created_at
        "#
    )
    .bind(user_id)
    .fetch_all(pool.get_ref())
    .await;

    let challenges_list: Vec<_> = match challenges {
        Ok(rows) => rows.iter().map(|row| {
            let key: String = row.try_get("challenge_key").unwrap_or_default();
            let challenge_data = CHALLENGES_DATA.iter().find(|(k, _, _, _, _, _)| *k == key);
            let difficulty = challenge_data.map(|(_, _, _, d, _, _)| *d).unwrap_or("3/5");
            let xp = challenge_data.map(|(_, _, _, _, xp, _)| *xp).unwrap_or(500);
            let desc = challenge_data.map(|(_, _, _, _, _, d)| *d).unwrap_or("");

            json!({
                "id": row.try_get::<uuid::Uuid, _>("id").map(|id| id.to_string()).unwrap_or_default(),
                "key": key,
                "title": row.try_get::<String, _>("title").unwrap_or_default(),
                "description": desc,
                "durationDays": row.try_get::<i32, _>("duration_days").unwrap_or(7),
                "difficulty": difficulty,
                "xpReward": xp,
                "status": row.try_get::<String, _>("status").unwrap_or_default(),
                "progress": row.try_get::<i32, _>("progress").unwrap_or(0),
                "streak": row.try_get::<i32, _>("streak").unwrap_or(0),
                "daysCompleted": row.try_get::<i64, _>("days_completed").unwrap_or(0),
                "startedAt": row.try_get::<Option<chrono::DateTime<chrono::Utc>>, _>("started_at").ok().flatten().map(|d| d.to_rfc3339()),
                "completedAt": row.try_get::<Option<chrono::DateTime<chrono::Utc>>, _>("completed_at").ok().flatten().map(|d| d.to_rfc3339())
            })
        }).collect(),
        Err(_) => vec![],
    };

    HttpResponse::Ok().json(json!({
        "status": "success",
        "data": { "challenges": challenges_list },
        "meta": { "request_id": request_id }
    }))
}

/// Join/Start a challenge
#[derive(Debug, Deserialize)]
pub struct JoinChallengeRequest {
    pub key: String,
}

pub async fn join_challenge(
    req: HttpRequest,
    body: web::Json<JoinChallengeRequest>,
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

    // Update challenge status
    let result = sqlx::query(
        r#"
        UPDATE challenges 
        SET status = 'active', started_at = NOW(), progress = 0
        WHERE user_id = $1 AND challenge_key = $2
        RETURNING id, duration_days
        "#,
    )
    .bind(user_id)
    .bind(&body.key)
    .fetch_one(pool.get_ref())
    .await;

    match result {
        Ok(row) => {
            let challenge_id: uuid::Uuid = row.try_get("id").unwrap_or_default();
            let duration: i32 = row.try_get("duration_days").unwrap_or(7);

            // Create progress entries for each day
            for day in 1..=duration {
                let _ = sqlx::query(
                    "INSERT INTO challenge_progress (challenge_id, day, completed) VALUES ($1, $2, false) ON CONFLICT DO NOTHING"
                )
                .bind(challenge_id)
                .bind(day)
                .execute(pool.get_ref())
                .await;
            }

            HttpResponse::Ok().json(json!({
                "status": "success",
                "data": {
                    "id": challenge_id.to_string(),
                    "message": "Challenge started"
                },
                "meta": { "request_id": request_id }
            }))
        }
        Err(e) => {
            tracing::error!("Failed to join challenge: {}", e);
            HttpResponse::InternalServerError().json(json!({
                "status": "error",
                "error": { "code": "DB_ERROR", "message": "Failed to start challenge" },
                "meta": { "request_id": request_id }
            }))
        }
    }
}

/// Update challenge progress
#[derive(Debug, Deserialize)]
pub struct UpdateProgressRequest {
    pub challenge_id: String,
    pub day: i32,
    pub completed: bool,
    pub notes: Option<String>,
}

pub async fn update_progress(
    req: HttpRequest,
    body: web::Json<UpdateProgressRequest>,
    pool: web::Data<PgPool>,
    auth_service: web::Data<AuthService>,
) -> HttpResponse {
    let request_id = get_request_id(&req);
    let challenge_id = body.challenge_id.clone();

    let user_id = match extract_user_id(&req, &auth_service) {
        Some(id) => id,
        None => {
            return HttpResponse::Unauthorized().json(json!({
                "status": "error",
                "error": { "code": "UNAUTHORIZED", "message": "Authentication required" }
            }));
        }
    };

    // Verify challenge belongs to user
    let challenge = sqlx::query_scalar::<_, uuid::Uuid>(
        "SELECT id FROM challenges WHERE id = $1 AND user_id = $2",
    )
    .bind(&challenge_id)
    .bind(user_id)
    .fetch_optional(pool.get_ref())
    .await;

    if challenge.is_err() || challenge.unwrap().is_none() {
        return HttpResponse::NotFound().json(json!({
            "status": "error",
            "error": { "code": "NOT_FOUND", "message": "Challenge not found" },
            "meta": { "request_id": request_id }
        }));
    }

    let challenge_uuid = match uuid::Uuid::parse_str(&challenge_id) {
        Ok(u) => u,
        Err(_) => {
            return HttpResponse::BadRequest().json(json!({
                "status": "error",
                "error": { "code": "INVALID_ID", "message": "Invalid challenge ID" },
                "meta": { "request_id": request_id }
            }));
        }
    };

    // Update progress
    let result = sqlx::query(
        r#"
        INSERT INTO challenge_progress (challenge_id, day, completed, notes)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (challenge_id, day) DO UPDATE SET completed = $3, notes = $4
        RETURNING id
        "#,
    )
    .bind(challenge_uuid)
    .bind(body.day)
    .bind(body.completed)
    .bind(body.notes.clone().unwrap_or_default())
    .fetch_one(pool.get_ref())
    .await;

    // Update challenge progress percentage
    let _ = sqlx::query(
        r#"
        UPDATE challenges 
        SET progress = (
            SELECT (COUNT(*) FILTER (WHERE completed = true) * 100 / NULLIF(COUNT(*), 0))
            FROM challenge_progress WHERE challenge_id = $1
        )
        WHERE id = $1
        "#,
    )
    .bind(challenge_uuid)
    .execute(pool.get_ref())
    .await;

    match result {
        Ok(row) => {
            let id: uuid::Uuid = row.get("id");
            HttpResponse::Ok().json(json!({
                "status": "success",
                "data": {
                    "id": id.to_string(),
                    "message": "Progress updated"
                },
                "meta": { "request_id": request_id }
            }))
        }
        Err(e) => {
            tracing::error!("Failed to update progress: {}", e);
            HttpResponse::InternalServerError().json(json!({
                "status": "error",
                "error": { "code": "DB_ERROR", "message": "Failed to update progress" },
                "meta": { "request_id": request_id }
            }))
        }
    }
}

/// Get daily quote
pub async fn get_quote(req: HttpRequest) -> HttpResponse {
    let request_id = get_request_id(&req);

    let quotes = vec![
        json!({ "author": "Fang Yuan", "text": "Strength is the only virtue. Everything else is just decoration." }),
        json!({ "author": "Baki Hanma", "text": "The only one who can surpass me... is me!" }),
        json!({ "author": "Fang Yuan", "text": "Sacrifice the present for the future. Regret is for the weak." }),
        json!({ "author": "Baki Hanma", "text": "Pain is weakness leaving the body." }),
        json!({ "author": "Fang Yuan", "text": "Think 10 moves ahead. Those who plan, conquer." }),
    ];

    // Select quote based on timestamp for consistency
    let idx = (chrono::Local::now().timestamp() / 86400) as usize % quotes.len();
    let quote = &quotes[idx];

    HttpResponse::Ok().json(json!({
        "status": "success",
        "data": { "quote": quote },
        "meta": { "request_id": request_id }
    }))
}
