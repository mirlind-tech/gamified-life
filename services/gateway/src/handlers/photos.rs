//! Photo Progress API handlers

use actix_multipart::Multipart;
use actix_web::{HttpRequest, HttpResponse, web};
use futures::{StreamExt, TryStreamExt};
use serde_json::json;
use sqlx::{PgPool, Row};
use std::io::Write;
use uuid::Uuid;

use crate::handlers::auth::get_request_id;
use crate::services::AuthService;

const MAX_FILE_SIZE: usize = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES: &[&str] = &["image/jpeg", "image/png", "image/webp"];

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

/// Upload a photo
pub async fn upload_photo(
    req: HttpRequest,
    mut payload: Multipart,
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

    // Create upload directory if it doesn't exist
    let upload_dir = format!("./uploads/photos/{}", user_id);
    if let Err(e) = std::fs::create_dir_all(&upload_dir) {
        tracing::error!("Failed to create upload directory: {}", e);
        return HttpResponse::InternalServerError().json(json!({
            "status": "error",
            "error": { "code": "UPLOAD_ERROR", "message": "Failed to create upload directory" },
            "meta": { "request_id": request_id }
        }));
    }

    let mut photo_type = String::new();
    let mut week_number = 0;
    let mut notes = String::new();
    let mut saved_file = None;

    // Process multipart form data
    while let Ok(Some(mut field)) = payload.try_next().await {
        let name = field.name();

        match name {
            "photo_type" => {
                if let Some(chunk) = field.next().await {
                    if let Ok(data) = chunk {
                        photo_type = String::from_utf8_lossy(&data).to_string();
                    }
                }
            }
            "week_number" => {
                if let Some(chunk) = field.next().await {
                    if let Ok(data) = chunk {
                        if let Ok(num) = String::from_utf8_lossy(&data).parse::<i32>() {
                            week_number = num;
                        }
                    }
                }
            }
            "notes" => {
                if let Some(chunk) = field.next().await {
                    if let Ok(data) = chunk {
                        notes = String::from_utf8_lossy(&data).to_string();
                    }
                }
            }
            "photo" => {
                // Validate MIME type
                let mime_type = field
                    .content_type()
                    .map(|m| m.to_string())
                    .unwrap_or_default();
                if !ALLOWED_MIME_TYPES.contains(&mime_type.as_str()) {
                    return HttpResponse::BadRequest().json(json!({
                        "status": "error",
                        "error": { 
                            "code": "INVALID_FILE_TYPE", 
                            "message": format!("Only JPEG, PNG, and WebP images are allowed. Got: {}", mime_type) 
                        },
                        "meta": { "request_id": request_id }
                    }));
                }

                // Generate unique filename
                let file_id = Uuid::new_v4();
                let ext = match mime_type.as_str() {
                    "image/png" => "png",
                    "image/webp" => "webp",
                    _ => "jpg",
                };
                let filename = format!("{}_{}.{}", photo_type, file_id, ext);
                let filepath = format!("{}/{}", upload_dir, filename);

                // Save file
                let mut total_size = 0;
                let mut file = match std::fs::File::create(&filepath) {
                    Ok(f) => f,
                    Err(e) => {
                        tracing::error!("Failed to create file: {}", e);
                        return HttpResponse::InternalServerError().json(json!({
                            "status": "error",
                            "error": { "code": "FILE_ERROR", "message": "Failed to save file" },
                            "meta": { "request_id": request_id }
                        }));
                    }
                };

                while let Some(chunk) = field.next().await {
                    if let Ok(data) = chunk {
                        total_size += data.len();
                        if total_size > MAX_FILE_SIZE {
                            // Clean up and return error
                            let _ = std::fs::remove_file(&filepath);
                            return HttpResponse::BadRequest().json(json!({
                                "status": "error",
                                "error": { "code": "FILE_TOO_LARGE", "message": "File size exceeds 10MB limit" },
                                "meta": { "request_id": request_id }
                            }));
                        }
                        if let Err(e) = file.write_all(&data) {
                            tracing::error!("Failed to write file: {}", e);
                            let _ = std::fs::remove_file(&filepath);
                            return HttpResponse::InternalServerError().json(json!({
                                "status": "error",
                                "error": { "code": "WRITE_ERROR", "message": "Failed to write file" },
                                "meta": { "request_id": request_id }
                            }));
                        }
                    }
                }

                saved_file = Some((filepath, mime_type, total_size));
            }
            _ => {}
        }
    }

    // Validate required fields
    if photo_type.is_empty() || !["front", "side", "back"].contains(&photo_type.as_str()) {
        return HttpResponse::BadRequest().json(json!({
            "status": "error",
            "error": { "code": "INVALID_TYPE", "message": "photo_type must be 'front', 'side', or 'back'" },
            "meta": { "request_id": request_id }
        }));
    }

    if week_number <= 0 {
        return HttpResponse::BadRequest().json(json!({
            "status": "error",
            "error": { "code": "INVALID_WEEK", "message": "week_number must be a positive integer" },
            "meta": { "request_id": request_id }
        }));
    }

    let (file_path, mime_type, file_size) = match saved_file {
        Some(f) => f,
        None => {
            return HttpResponse::BadRequest().json(json!({
                "status": "error",
                "error": { "code": "NO_FILE", "message": "No photo file provided" },
                "meta": { "request_id": request_id }
            }));
        }
    };

    // Save to database
    let taken_at = chrono::Local::now().date_naive();

    let result = sqlx::query_scalar::<_, uuid::Uuid>(
        r#"
        INSERT INTO photo_progress (user_id, photo_type, file_path, file_size, mime_type, taken_at, week_number, notes)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id
        "#
    )
    .bind(user_id)
    .bind(&photo_type)
    .bind(&file_path)
    .bind(file_size as i32)
    .bind(&mime_type)
    .bind(taken_at)
    .bind(week_number)
    .bind(&notes)
    .fetch_one(pool.get_ref())
    .await;

    match result {
        Ok(id) => HttpResponse::Created().json(json!({
            "status": "success",
            "data": {
                "id": id.to_string(),
                "photo_type": photo_type,
                "week_number": week_number,
                "file_path": file_path,
                "taken_at": taken_at.to_string(),
                "message": "Photo uploaded successfully"
            },
            "meta": { "request_id": request_id }
        })),
        Err(e) => {
            // Clean up file on DB error
            let _ = std::fs::remove_file(&file_path);
            tracing::error!("Failed to save photo record: {}", e);
            HttpResponse::InternalServerError().json(json!({
                "status": "error",
                "error": { "code": "DB_ERROR", "message": "Failed to save photo record" },
                "meta": { "request_id": request_id }
            }))
        }
    }
}

/// Get photos for a user
pub async fn get_photos(
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

    // Get query params for filtering
    let week_number = req
        .query_string()
        .split('&')
        .find(|p| p.starts_with("week="))
        .and_then(|p| p.split('=').nth(1))
        .and_then(|v| v.parse::<i32>().ok());

    let photos = if let Some(week) = week_number {
        sqlx::query(
            "SELECT id, photo_type, file_path, file_size, taken_at, week_number, notes, created_at 
             FROM photo_progress WHERE user_id = $1 AND week_number = $2 ORDER BY photo_type",
        )
        .bind(user_id)
        .bind(week)
        .fetch_all(pool.get_ref())
        .await
    } else {
        sqlx::query(
            "SELECT id, photo_type, file_path, file_size, taken_at, week_number, notes, created_at 
             FROM photo_progress WHERE user_id = $1 ORDER BY week_number DESC, photo_type",
        )
        .bind(user_id)
        .fetch_all(pool.get_ref())
        .await
    };

    match photos {
        Ok(rows) => {
            let photos: Vec<_> = rows.iter().map(|row| {
                json!({
                    "id": row.try_get::<uuid::Uuid, _>("id").unwrap_or_default().to_string(),
                    "photo_type": row.try_get::<String, _>("photo_type").unwrap_or_default(),
                    "file_path": row.try_get::<String, _>("file_path").unwrap_or_default(),
                    "file_size": row.try_get::<i32, _>("file_size").unwrap_or(0),
                    "taken_at": row.try_get::<chrono::NaiveDate, _>("taken_at").ok().map(|d| d.to_string()),
                    "week_number": row.try_get::<i32, _>("week_number").unwrap_or(0),
                    "notes": row.try_get::<Option<String>, _>("notes").unwrap_or(None),
                    "created_at": row.try_get::<chrono::DateTime<chrono::Utc>, _>("created_at").ok().map(|d| d.to_rfc3339())
                })
            }).collect();

            HttpResponse::Ok().json(json!({
                "status": "success",
                "data": { "photos": photos },
                "meta": { "request_id": request_id }
            }))
        }
        Err(e) => {
            tracing::error!("Failed to fetch photos: {}", e);
            HttpResponse::InternalServerError().json(json!({
                "status": "error",
                "error": { "code": "DB_ERROR", "message": "Failed to fetch photos" },
                "meta": { "request_id": request_id }
            }))
        }
    }
}

/// Delete a photo
pub async fn delete_photo(
    req: HttpRequest,
    path: web::Path<String>,
    pool: web::Data<PgPool>,
    auth_service: web::Data<AuthService>,
) -> HttpResponse {
    let request_id = get_request_id(&req);
    let photo_id = path.into_inner();

    let user_id = match extract_user_id(&req, &auth_service) {
        Some(id) => id,
        None => {
            return HttpResponse::Unauthorized().json(json!({
                "status": "error",
                "error": { "code": "UNAUTHORIZED", "message": "Authentication required" }
            }));
        }
    };

    // Get file path before deleting
    let file_path: Option<String> =
        sqlx::query_scalar("SELECT file_path FROM photo_progress WHERE id = $1 AND user_id = $2")
            .bind(&photo_id)
            .bind(user_id)
            .fetch_optional(pool.get_ref())
            .await
            .unwrap_or(None);

    // Delete from database
    let result = sqlx::query("DELETE FROM photo_progress WHERE id = $1 AND user_id = $2")
        .bind(&photo_id)
        .bind(user_id)
        .execute(pool.get_ref())
        .await;

    match result {
        Ok(res) if res.rows_affected() > 0 => {
            // Delete file from disk
            if let Some(path) = file_path {
                let _ = std::fs::remove_file(path);
            }

            HttpResponse::Ok().json(json!({
                "status": "success",
                "data": { "message": "Photo deleted successfully" },
                "meta": { "request_id": request_id }
            }))
        }
        _ => HttpResponse::NotFound().json(json!({
            "status": "error",
            "error": { "code": "NOT_FOUND", "message": "Photo not found" },
            "meta": { "request_id": request_id }
        })),
    }
}

/// Get photo stats
pub async fn get_photo_stats(
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

    let total_photos: i64 =
        sqlx::query_scalar("SELECT COUNT(*) FROM photo_progress WHERE user_id = $1")
            .bind(user_id)
            .fetch_one(pool.get_ref())
            .await
            .unwrap_or(0);

    let weeks_logged: i64 = sqlx::query_scalar(
        "SELECT COUNT(DISTINCT week_number) FROM photo_progress WHERE user_id = $1",
    )
    .bind(user_id)
    .fetch_one(pool.get_ref())
    .await
    .unwrap_or(0);

    let first_photo: Option<chrono::NaiveDate> =
        sqlx::query_scalar("SELECT MIN(taken_at) FROM photo_progress WHERE user_id = $1")
            .bind(user_id)
            .fetch_one(pool.get_ref())
            .await
            .ok()
            .flatten();

    let latest_photo: Option<chrono::NaiveDate> =
        sqlx::query_scalar("SELECT MAX(taken_at) FROM photo_progress WHERE user_id = $1")
            .bind(user_id)
            .fetch_one(pool.get_ref())
            .await
            .ok()
            .flatten();

    HttpResponse::Ok().json(json!({
        "status": "success",
        "data": {
            "total_photos": total_photos,
            "weeks_logged": weeks_logged,
            "first_photo": first_photo.map(|d| d.to_string()),
            "latest_photo": latest_photo.map(|d| d.to_string()),
            "milestone_badges": get_milestone_badges(weeks_logged)
        },
        "meta": { "request_id": request_id }
    }))
}

fn get_milestone_badges(weeks: i64) -> Vec<String> {
    let mut badges = vec![];

    if weeks >= 1 {
        badges.push("First Photo".to_string());
    }
    if weeks >= 4 {
        badges.push("4 Weeks".to_string());
    }
    if weeks >= 8 {
        badges.push("8 Weeks".to_string());
    }
    if weeks >= 12 {
        badges.push("12 Weeks".to_string());
    }
    if weeks >= 26 {
        badges.push("Half Year".to_string());
    }
    if weeks >= 52 {
        badges.push("Full Year".to_string());
    }

    badges
}
