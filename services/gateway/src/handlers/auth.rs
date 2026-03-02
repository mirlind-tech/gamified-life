//! Authentication handlers with PostgreSQL integration

use actix_web::{HttpRequest, HttpResponse, web};
use serde::Deserialize;
use serde_json::json;
use sqlx::PgPool;
use uuid::Uuid;

use crate::services::AuthService;

/// Get request ID from headers or generate one
pub fn get_request_id(req: &HttpRequest) -> String {
    req.headers()
        .get("x-request-id")
        .and_then(|h| h.to_str().ok())
        .map(|s| s.to_string())
        .unwrap_or_else(|| uuid::Uuid::new_v4().to_string())
}

/// Extract user ID from JWT token in Authorization header
fn extract_user_id_from_token(req: &HttpRequest, auth_service: &AuthService) -> Option<Uuid> {
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

/// Request body for registration
#[derive(Debug, Deserialize)]
pub struct RegisterRequestBody {
    pub email: String,
    pub password: String,
    pub username: String,
}

/// Register new user
pub async fn register(
    req: HttpRequest,
    body: web::Json<RegisterRequestBody>,
    pool: web::Data<PgPool>,
    auth_service: web::Data<AuthService>,
) -> HttpResponse {
    let request_id = get_request_id(&req);

    // Check if user already exists
    let existing = sqlx::query_scalar::<_, i64>("SELECT COUNT(*) FROM users WHERE email = $1")
        .bind(&body.email)
        .fetch_one(pool.get_ref())
        .await;

    match existing {
        Ok(count) if count > 0 => {
            return HttpResponse::Conflict().json(json!({
                "error": "User already exists",
                "meta": { "request_id": request_id }
            }));
        }
        Err(e) => {
            tracing::error!("Database error: {}", e);
            return HttpResponse::InternalServerError().json(json!({
                "error": "Database error",
                "meta": { "request_id": request_id }
            }));
        }
        _ => {}
    }

    // Hash password using bcrypt
    let password_hash = match bcrypt::hash(&body.password, bcrypt::DEFAULT_COST) {
        Ok(h) => h,
        Err(_) => {
            return HttpResponse::InternalServerError().json(json!({
                "error": "Failed to hash password",
                "meta": { "request_id": request_id }
            }));
        }
    };

    // Create user
    let user_id = Uuid::new_v4();
    let result = sqlx::query(
        "INSERT INTO users (id, email, username, password_hash, created_at, updated_at) VALUES ($1, $2, $3, $4, NOW(), NOW())"
    )
    .bind(user_id)
    .bind(&body.email)
    .bind(&body.username)
    .bind(&password_hash)
    .execute(pool.get_ref())
    .await;

    match result {
        Ok(_) => {
            // Create gamification stats for user
            let _ = sqlx::query(
                "INSERT INTO gamification_stats (user_id, xp_total, level, streak_days) VALUES ($1, 0, 1, 0)"
            )
            .bind(user_id)
            .execute(pool.get_ref())
            .await;

            // Generate tokens
            let device_id = format!("web-{}", Uuid::new_v4());
            let permissions = vec!["user:read".to_string(), "user:write".to_string()];

            let (access_token, _) = match auth_service.create_access_token(
                user_id,
                device_id.clone(),
                permissions.clone(),
            ) {
                Ok(t) => t,
                Err(_) => {
                    return HttpResponse::InternalServerError().json(json!({
                        "error": "Failed to create access token",
                        "meta": { "request_id": request_id }
                    }));
                }
            };

            let (refresh_token, _) = match auth_service.create_refresh_token(user_id, device_id) {
                Ok(t) => t,
                Err(_) => {
                    return HttpResponse::InternalServerError().json(json!({
                        "error": "Failed to create refresh token",
                        "meta": { "request_id": request_id }
                    }));
                }
            };

            HttpResponse::Created().json(json!({
                "status": "success",
                "data": {
                    "user": {
                        "id": user_id.to_string(),
                        "email": body.email,
                        "username": body.username,
                    },
                    "access_token": access_token,
                    "refresh_token": refresh_token,
                    "expires_in": 86400,
                    "token_type": "Bearer"
                },
                "meta": { "request_id": request_id }
            }))
        }
        Err(e) => {
            tracing::error!("Failed to create user: {}", e);
            HttpResponse::InternalServerError().json(json!({
                "error": "Failed to create user",
                "meta": { "request_id": request_id }
            }))
        }
    }
}

/// Request body for login
#[derive(Debug, Deserialize)]
pub struct LoginRequestBody {
    pub email: String,
    pub password: String,
}

/// Login user
pub async fn login(
    req: HttpRequest,
    body: web::Json<LoginRequestBody>,
    pool: web::Data<PgPool>,
    auth_service: web::Data<AuthService>,
) -> HttpResponse {
    let request_id = get_request_id(&req);

    // Find user by email
    let user_result = sqlx::query_as::<_, (Uuid, String, String, String)>(
        "SELECT id, email, username, password_hash FROM users WHERE email = $1",
    )
    .bind(&body.email)
    .fetch_one(pool.get_ref())
    .await;

    match user_result {
        Ok((user_id, email, username, password_hash)) => {
            // Verify password using bcrypt
            let valid = bcrypt::verify(&body.password, &password_hash).unwrap_or(false);
            if !valid {
                return HttpResponse::Unauthorized().json(json!({
                    "error": "Invalid credentials",
                    "meta": { "request_id": request_id }
                }));
            }

            // Generate tokens
            let device_id = format!("web-{}", Uuid::new_v4());
            let permissions = vec!["user:read".to_string(), "user:write".to_string()];

            let (access_token, _) = match auth_service.create_access_token(
                user_id,
                device_id.clone(),
                permissions.clone(),
            ) {
                Ok(t) => t,
                Err(_) => {
                    return HttpResponse::InternalServerError().json(json!({
                        "error": "Failed to create access token",
                        "meta": { "request_id": request_id }
                    }));
                }
            };

            let (refresh_token, _) = match auth_service.create_refresh_token(user_id, device_id) {
                Ok(t) => t,
                Err(_) => {
                    return HttpResponse::InternalServerError().json(json!({
                        "error": "Failed to create refresh token",
                        "meta": { "request_id": request_id }
                    }));
                }
            };

            HttpResponse::Ok().json(json!({
                "status": "success",
                "data": {
                    "user": {
                        "id": user_id.to_string(),
                        "email": email,
                        "username": username,
                    },
                    "access_token": access_token,
                    "refresh_token": refresh_token,
                    "expires_in": 86400,
                    "token_type": "Bearer"
                },
                "meta": { "request_id": request_id }
            }))
        }
        Err(sqlx::Error::RowNotFound) => HttpResponse::Unauthorized().json(json!({
            "error": "Invalid credentials",
            "meta": { "request_id": request_id }
        })),
        Err(e) => {
            tracing::error!("Database error: {}", e);
            HttpResponse::InternalServerError().json(json!({
                "error": "Database error",
                "meta": { "request_id": request_id }
            }))
        }
    }
}

/// Request body for refresh
#[derive(Debug, Deserialize)]
pub struct RefreshRequestBody {
    pub refresh_token: String,
}

/// Refresh access token
pub async fn refresh(
    req: HttpRequest,
    body: web::Json<RefreshRequestBody>,
    auth_service: web::Data<AuthService>,
) -> HttpResponse {
    let request_id = get_request_id(&req);

    match auth_service.refresh_access_token(&body.refresh_token) {
        Ok((access_token, refresh_token, claims)) => {
            let user_id = Uuid::parse_str(&claims.sub).unwrap_or_default();

            HttpResponse::Ok().json(json!({
                "status": "success",
                "data": {
                    "user_id": user_id.to_string(),
                    "access_token": access_token,
                    "refresh_token": refresh_token,
                    "expires_in": 86400,
                    "token_type": "Bearer"
                },
                "meta": { "request_id": request_id }
            }))
        }
        Err(_e) => HttpResponse::Unauthorized().json(json!({
            "status": "error",
            "error": {
                "code": "INVALID_TOKEN",
                "message": "Invalid or expired token"
            }
        })),
    }
}

/// Logout user
pub async fn logout(req: HttpRequest) -> HttpResponse {
    let request_id = get_request_id(&req);

    // In a full implementation, we would invalidate the token here
    // For now, just return success (client should delete token)

    HttpResponse::Ok().json(json!({
        "status": "success",
        "data": { "message": "Logout successful" },
        "meta": { "request_id": request_id }
    }))
}

/// Get current user info (requires authentication)
pub async fn me(
    req: HttpRequest,
    pool: web::Data<PgPool>,
    auth_service: web::Data<AuthService>,
) -> HttpResponse {
    let request_id = get_request_id(&req);

    // Extract user ID from JWT token
    let user_id = match extract_user_id_from_token(&req, &auth_service) {
        Some(id) => id,
        None => {
            return HttpResponse::Unauthorized().json(json!({
                "status": "error",
                "error": {
                    "code": "UNAUTHORIZED",
                    "message": "Authentication required"
                }
            }));
        }
    };

    // Fetch user from database
    let user_result = sqlx::query_as::<_, (Uuid, String, String, chrono::DateTime<chrono::Utc>)>(
        "SELECT id, email, username, created_at FROM users WHERE id = $1",
    )
    .bind(user_id)
    .fetch_one(pool.get_ref())
    .await;

    match user_result {
        Ok((id, email, username, created_at)) => HttpResponse::Ok().json(json!({
            "status": "success",
            "data": {
                "user": {
                    "id": id.to_string(),
                    "email": email,
                    "username": username,
                    "created_at": created_at,
                }
            },
            "meta": { "request_id": request_id }
        })),
        Err(sqlx::Error::RowNotFound) => HttpResponse::NotFound().json(json!({
            "status": "error",
            "error": {
                "code": "USER_NOT_FOUND",
                "message": "User not found"
            }
        })),
        Err(e) => {
            tracing::error!("Database error: {}", e);
            HttpResponse::InternalServerError().json(json!({
                "status": "error",
                "error": {
                    "code": "DATABASE_ERROR",
                    "message": "Internal server error"
                }
            }))
        }
    }
}
