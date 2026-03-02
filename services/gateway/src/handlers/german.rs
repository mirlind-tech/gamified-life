//! German learning API handlers

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

/// Get latest German session
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
            COALESCE(anki_cards_reviewed, 0) as anki_cards_reviewed,
            COALESCE(anki_time_seconds, 0) as anki_time_seconds,
            COALESCE(duration_minutes, 0) as duration_minutes,
            COALESCE(listening_material, '') as listening_material,
            COALESCE(tandem_partner, '') as tandem_partner,
            COALESCE(started_at::date::text, CURRENT_DATE::text) as session_date,
            COALESCE(notes, '') as notes
        FROM german_sessions
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
            let parsed = (|| -> Result<(uuid::Uuid, i32, i32, i32, String, String, String, String), sqlx::Error> {
                Ok((
                    row.try_get("id")?,
                    row.try_get("anki_cards_reviewed")?,
                    row.try_get("anki_time_seconds")?,
                    row.try_get("duration_minutes")?,
                    row.try_get("listening_material")?,
                    row.try_get("tandem_partner")?,
                    row.try_get("session_date")?,
                    row.try_get("notes")?,
                ))
            })();

            let (id, anki_cards, anki_time, duration, listening, tandem, session_date, notes) =
                match parsed {
                    Ok(v) => v,
                    Err(e) => {
                        tracing::error!("Failed to decode latest German session row: {}", e);
                        return HttpResponse::InternalServerError().json(json!({
                        "status": "error",
                        "error": { "code": "DB_ERROR", "message": "Failed to load German session" },
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
                        "anki_cards": anki_cards,
                        "anki_time": anki_time / 60,
                        "anki_streak": 0,
                        "radio_hours": if listening.is_empty() { 0.0 } else { duration as f64 / 60.0 },
                        "tandem_minutes": if tandem.is_empty() { 0 } else { duration },
                        "total_words": 0,
                        "language_transfer": false,
                        "language_transfer_lesson": 0,
                        "notes": notes
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
            tracing::error!("Failed to load latest German session: {}", e);
            HttpResponse::InternalServerError().json(json!({
                "status": "error",
                "error": { "code": "DB_ERROR", "message": "Failed to load German session" },
                "meta": { "request_id": request_id }
            }))
        }
    }
}

/// Get German session by date
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
            COALESCE(anki_cards_reviewed, 0) as anki_cards_reviewed,
            COALESCE(anki_time_seconds, 0) as anki_time_seconds,
            COALESCE(duration_minutes, 0) as duration_minutes,
            COALESCE(listening_material, '') as listening_material,
            COALESCE(tandem_partner, '') as tandem_partner,
            COALESCE(notes, '') as notes
        FROM german_sessions
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
            let parsed =
                (|| -> Result<(uuid::Uuid, i32, i32, i32, String, String, String), sqlx::Error> {
                    Ok((
                        row.try_get("id")?,
                        row.try_get("anki_cards_reviewed")?,
                        row.try_get("anki_time_seconds")?,
                        row.try_get("duration_minutes")?,
                        row.try_get("listening_material")?,
                        row.try_get("tandem_partner")?,
                        row.try_get("notes")?,
                    ))
                })();

            let (id, anki_cards, anki_time, duration, listening, tandem, notes) = match parsed {
                Ok(v) => v,
                Err(e) => {
                    tracing::error!("Failed to decode German session for date {}: {}", date, e);
                    return HttpResponse::InternalServerError().json(json!({
                        "status": "error",
                        "error": { "code": "DB_ERROR", "message": "Failed to load German session" },
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
                        "anki_cards": anki_cards,
                        "anki_time": anki_time / 60,
                        "anki_streak": 0,
                        "radio_hours": if listening.is_empty() { 0.0 } else { duration as f64 / 60.0 },
                        "tandem_minutes": if tandem.is_empty() { 0 } else { duration },
                        "total_words": 0,
                        "language_transfer": false,
                        "language_transfer_lesson": 0,
                        "notes": notes
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
                    "anki_cards": 0,
                    "anki_time": 0,
                    "anki_streak": 0,
                    "radio_hours": 0.0,
                    "tandem_minutes": 0,
                    "total_words": 0,
                    "language_transfer": false,
                    "language_transfer_lesson": 0,
                    "notes": ""
                }
            },
            "meta": { "request_id": request_id }
        })),
    }
}

/// Save German progress
#[derive(Debug, Deserialize)]
pub struct SaveGermanRequest {
    pub date: String,
    #[serde(alias = "ankiCards")]
    pub anki_cards: i32,
    #[serde(alias = "ankiTime")]
    pub anki_time: i32,
    #[serde(alias = "radioHours")]
    pub radio_hours: f64,
    #[serde(alias = "tandemMinutes")]
    pub tandem_minutes: i32,
    pub notes: Option<String>,
}

pub async fn save_german(
    req: HttpRequest,
    body: web::Json<SaveGermanRequest>,
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

    // Calculate total duration from components
    let total_duration = body.anki_time + body.tandem_minutes + (body.radio_hours * 60.0) as i32;

    // Determine session type based on input
    let session_type = if body.anki_cards > 0 && body.radio_hours > 0.0 {
        "mixed"
    } else if body.anki_cards > 0 {
        "anki"
    } else if body.radio_hours > 0.0 {
        "listening"
    } else if body.tandem_minutes > 0 {
        "tandem"
    } else {
        "study"
    };

    let result = sqlx::query_scalar::<_, uuid::Uuid>(
        r#"
        INSERT INTO german_sessions 
            (id, user_id, session_type, duration_minutes, started_at, 
             anki_cards_reviewed, anki_time_seconds, listening_material, 
             tandem_partner, notes, source, created_at)
        VALUES (gen_random_uuid(), $1, $2, $3, $4::timestamptz, $5, $6, 
                CASE WHEN $7::float > 0 THEN 'Radio' ELSE NULL END,
                CASE WHEN $8 > 0 THEN 'Partner' ELSE NULL END,
                $9, 'web', NOW())
        RETURNING id
        "#,
    )
    .bind(user_id)
    .bind(session_type)
    .bind(total_duration)
    .bind(format!("{}T00:00:00Z", body.date))
    .bind(body.anki_cards)
    .bind(body.anki_time * 60)
    .bind(body.radio_hours)
    .bind(body.tandem_minutes)
    .bind(body.notes.clone().unwrap_or_default())
    .fetch_one(pool.get_ref())
    .await;

    match result {
        Ok(id) => HttpResponse::Created().json(json!({
            "status": "success",
            "data": {
                "id": id.to_string(),
                "message": "German progress saved"
            },
            "meta": { "request_id": request_id }
        })),
        Err(e) => {
            tracing::error!("Failed to save German progress: {}", e);
            HttpResponse::InternalServerError().json(json!({
                "status": "error",
                "error": { "code": "DB_ERROR", "message": "Failed to save" },
                "meta": { "request_id": request_id }
            }))
        }
    }
}
