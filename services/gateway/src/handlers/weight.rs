//! Weight tracking API handlers

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

/// Create or update weight entry
#[derive(Debug, Deserialize)]
pub struct WeightEntryRequest {
    pub weight_kg: f64,
    pub body_fat_percentage: Option<f64>,
    pub entry_date: String, // YYYY-MM-DD
    pub notes: Option<String>,
}

pub async fn save_weight(
    req: HttpRequest,
    body: web::Json<WeightEntryRequest>,
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

    // Validate weight
    if body.weight_kg <= 0.0 || body.weight_kg > 500.0 {
        return HttpResponse::BadRequest().json(json!({
            "status": "error",
            "error": { "code": "INVALID_WEIGHT", "message": "Weight must be between 0 and 500 kg" },
            "meta": { "request_id": request_id }
        }));
    }

    // Parse date
    let entry_date = match chrono::NaiveDate::parse_from_str(&body.entry_date, "%Y-%m-%d") {
        Ok(d) => d,
        Err(_) => {
            return HttpResponse::BadRequest().json(json!({
                "status": "error",
                "error": { "code": "INVALID_DATE", "message": "Date must be in YYYY-MM-DD format" },
                "meta": { "request_id": request_id }
            }));
        }
    };

    // Insert or update
    let result = sqlx::query_scalar::<_, uuid::Uuid>(
        r#"
        INSERT INTO weight_entries (user_id, weight_kg, body_fat_percentage, entry_date, notes)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (user_id, entry_date) DO UPDATE 
        SET weight_kg = $2, body_fat_percentage = $3, notes = $5
        RETURNING id
        "#,
    )
    .bind(user_id)
    .bind(body.weight_kg)
    .bind(body.body_fat_percentage)
    .bind(entry_date)
    .bind(body.notes.as_ref().unwrap_or(&"".to_string()))
    .fetch_one(pool.get_ref())
    .await;

    match result {
        Ok(id) => HttpResponse::Ok().json(json!({
            "status": "success",
            "data": {
                "id": id.to_string(),
                "weight_kg": body.weight_kg,
                "entry_date": body.entry_date,
                "message": "Weight entry saved"
            },
            "meta": { "request_id": request_id }
        })),
        Err(e) => {
            tracing::error!("Failed to save weight: {}", e);
            HttpResponse::InternalServerError().json(json!({
                "status": "error",
                "error": { "code": "DB_ERROR", "message": "Failed to save weight entry" },
                "meta": { "request_id": request_id }
            }))
        }
    }
}

/// Get weight history
pub async fn get_weight_history(
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

    // Parse range query param
    let range = req
        .query_string()
        .split('&')
        .find(|p| p.starts_with("range="))
        .and_then(|p| p.split('=').nth(1))
        .map(|v| v.to_string())
        .unwrap_or_else(|| "30d".to_string());

    let days = match range.as_str() {
        "7d" => 7,
        "30d" => 30,
        "90d" => 90,
        "1y" => 365,
        _ => 30,
    };

    let entries = sqlx::query(
        "SELECT id, weight_kg, body_fat_percentage, entry_date, notes, created_at 
         FROM weight_entries WHERE user_id = $1 AND entry_date >= CURRENT_DATE - INTERVAL '1 day' * $2
         ORDER BY entry_date DESC"
    )
    .bind(user_id)
    .bind(days)
    .fetch_all(pool.get_ref())
    .await;

    match entries {
        Ok(rows) => {
            let entries: Vec<_> = rows.iter().map(|row| {
                json!({
                    "id": row.try_get::<uuid::Uuid, _>("id").unwrap_or_default().to_string(),
                    "weight_kg": row.try_get::<f64, _>("weight_kg").unwrap_or(0.0),
                    "body_fat_percentage": row.try_get::<Option<f64>, _>("body_fat_percentage").unwrap_or(None),
                    "entry_date": row.try_get::<chrono::NaiveDate, _>("entry_date").ok().map(|d| d.to_string()),
                    "notes": row.try_get::<Option<String>, _>("notes").unwrap_or(None),
                    "created_at": row.try_get::<chrono::DateTime<chrono::Utc>, _>("created_at").ok().map(|d| d.to_rfc3339())
                })
            }).collect();

            // Calculate stats
            let stats = calculate_weight_stats(&entries);

            HttpResponse::Ok().json(json!({
                "status": "success",
                "data": {
                    "entries": entries,
                    "stats": stats,
                    "range": range
                },
                "meta": { "request_id": request_id }
            }))
        }
        Err(e) => {
            tracing::error!("Failed to fetch weight history: {}", e);
            HttpResponse::InternalServerError().json(json!({
                "status": "error",
                "error": { "code": "DB_ERROR", "message": "Failed to fetch weight history" },
                "meta": { "request_id": request_id }
            }))
        }
    }
}

/// Calculate weight stats
fn calculate_weight_stats(entries: &[serde_json::Value]) -> serde_json::Value {
    if entries.is_empty() {
        return json!({
            "current": null,
            "lowest": null,
            "highest": null,
            "average": null,
            "change": null
        });
    }

    let weights: Vec<f64> = entries
        .iter()
        .filter_map(|e| e["weight_kg"].as_f64())
        .collect();

    if weights.is_empty() {
        return json!({
            "current": null,
            "lowest": null,
            "highest": null,
            "average": null,
            "change": null
        });
    }

    let current = weights.first().copied().unwrap_or(0.0);
    let lowest = weights.iter().fold(f64::INFINITY, |a, &b| a.min(b));
    let highest = weights.iter().fold(f64::NEG_INFINITY, |a, &b| a.max(b));
    let average = weights.iter().sum::<f64>() / weights.len() as f64;
    let change = if weights.len() > 1 {
        current - weights.last().copied().unwrap_or(current)
    } else {
        0.0
    };

    json!({
        "current": current,
        "lowest": lowest,
        "highest": highest,
        "average": round_to_2(average),
        "change": round_to_2(change)
    })
}

fn round_to_2(num: f64) -> f64 {
    (num * 100.0).round() / 100.0
}

/// Delete weight entry
pub async fn delete_weight(
    req: HttpRequest,
    path: web::Path<String>,
    pool: web::Data<PgPool>,
    auth_service: web::Data<AuthService>,
) -> HttpResponse {
    let request_id = get_request_id(&req);
    let entry_id = path.into_inner();

    let user_id = match extract_user_id(&req, &auth_service) {
        Some(id) => id,
        None => {
            return HttpResponse::Unauthorized().json(json!({
                "status": "error",
                "error": { "code": "UNAUTHORIZED", "message": "Authentication required" }
            }));
        }
    };

    let result = sqlx::query("DELETE FROM weight_entries WHERE id = $1 AND user_id = $2")
        .bind(&entry_id)
        .bind(user_id)
        .execute(pool.get_ref())
        .await;

    match result {
        Ok(res) if res.rows_affected() > 0 => HttpResponse::Ok().json(json!({
            "status": "success",
            "data": { "message": "Weight entry deleted" },
            "meta": { "request_id": request_id }
        })),
        _ => HttpResponse::NotFound().json(json!({
            "status": "error",
            "error": { "code": "NOT_FOUND", "message": "Weight entry not found" },
            "meta": { "request_id": request_id }
        })),
    }
}

/// Get weight chart data (for visualization)
pub async fn get_weight_chart(
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

    // Parse range
    let range = req
        .query_string()
        .split('&')
        .find(|p| p.starts_with("range="))
        .and_then(|p| p.split('=').nth(1))
        .map(|v| v.to_string())
        .unwrap_or_else(|| "30d".to_string());

    let days = match range.as_str() {
        "7d" => 7,
        "30d" => 30,
        "90d" => 90,
        "1y" => 365,
        _ => 30,
    };

    let entries = sqlx::query(
        "SELECT weight_kg, entry_date 
         FROM weight_entries WHERE user_id = $1 AND entry_date >= CURRENT_DATE - INTERVAL '1 day' * $2
         ORDER BY entry_date ASC"
    )
    .bind(user_id)
    .bind(days)
    .fetch_all(pool.get_ref())
    .await;

    match entries {
        Ok(rows) => {
            let data_points: Vec<_> = rows.iter().map(|row| {
                json!({
                    "date": row.try_get::<chrono::NaiveDate, _>("entry_date").ok().map(|d| d.to_string()),
                    "weight": row.try_get::<f64, _>("weight_kg").unwrap_or(0.0)
                })
            }).collect();

            HttpResponse::Ok().json(json!({
                "status": "success",
                "data": {
                    "chart_data": data_points,
                    "range": range
                },
                "meta": { "request_id": request_id }
            }))
        }
        Err(e) => {
            tracing::error!("Failed to fetch chart data: {}", e);
            HttpResponse::InternalServerError().json(json!({
                "status": "error",
                "error": { "code": "DB_ERROR", "message": "Failed to fetch chart data" },
                "meta": { "request_id": request_id }
            }))
        }
    }
}
