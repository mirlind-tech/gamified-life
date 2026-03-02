//! AI Core API handlers

use actix_web::{HttpRequest, HttpResponse, web};
use serde::Deserialize;
use serde_json::{Value, json};
use sqlx::PgPool;
use uuid::Uuid;

use crate::handlers::auth::get_request_id;
use crate::services::{AiCoreError, AiCoreService, AuthService, ChatTurn};

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

/// Resolve user ID from JWT or fallback to provided/default
fn resolve_user_id(
    req: &HttpRequest,
    auth_service: &AuthService,
    provided: Option<&str>,
) -> String {
    // First try JWT token
    if let Some(id) = extract_user_id(req, auth_service) {
        return id.to_string();
    }

    // Then try provided user_id
    if let Some(value) = provided {
        let trimmed = value.trim();
        if !trimmed.is_empty() {
            return trimmed.to_string();
        }
    }

    // Finally try x-user-id header
    if let Some(header_value) = req
        .headers()
        .get("x-user-id")
        .and_then(|header| header.to_str().ok())
    {
        let trimmed = header_value.trim();
        if !trimmed.is_empty() {
            return trimmed.to_string();
        }
    }

    "default-user".to_string()
}

#[derive(Debug, Deserialize)]
pub struct ChatRequestBody {
    pub prompt: String,
    pub model: Option<String>,
    pub history: Option<Vec<ChatTurn>>,
}

#[derive(Debug, Deserialize)]
pub struct MemoryUpsertRequestBody {
    pub user_id: Option<String>,
    pub id: Option<String>,
    pub text: String,
    pub metadata: Option<Value>,
}

#[derive(Debug, Deserialize)]
pub struct MemorySearchRequestBody {
    pub user_id: Option<String>,
    pub query: String,
    pub limit: Option<usize>,
}

#[derive(Debug, Deserialize)]
pub struct RagQueryRequestBody {
    pub user_id: Option<String>,
    pub question: String,
    pub limit: Option<usize>,
    pub model: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct VoiceTranscriptionRequestBody {
    pub audio_base64: String,
    pub language: Option<String>,
    pub prompt: Option<String>,
}

pub async fn chat(
    req: HttpRequest,
    body: web::Json<ChatRequestBody>,
    ai_service: web::Data<AiCoreService>,
    _auth_service: web::Data<AuthService>,
) -> HttpResponse {
    let request_id = get_request_id(&req);
    let history = body.history.clone().unwrap_or_default();

    match ai_service
        .chat(&body.prompt, &history, body.model.clone(), None)
        .await
    {
        Ok(result) => HttpResponse::Ok().json(json!({
            "status": "success",
            "data": {
                "reply": result.reply,
                "model": result.model
            },
            "meta": { "request_id": request_id }
        })),
        Err(error) => ai_error_response(error, &request_id),
    }
}

pub async fn upsert_memory(
    req: HttpRequest,
    body: web::Json<MemoryUpsertRequestBody>,
    ai_service: web::Data<AiCoreService>,
    auth_service: web::Data<AuthService>,
) -> HttpResponse {
    let request_id = get_request_id(&req);
    let user_id = resolve_user_id(&req, &auth_service, body.user_id.as_deref());
    let metadata = body.metadata.clone().unwrap_or_else(|| json!({}));

    match ai_service
        .upsert_memory(&user_id, body.id.clone(), &body.text, metadata)
        .await
    {
        Ok(result) => HttpResponse::Ok().json(json!({
            "status": "success",
            "data": {
                "id": result.id,
                "dimensions": result.dimensions
            },
            "meta": { "request_id": request_id }
        })),
        Err(error) => ai_error_response(error, &request_id),
    }
}

pub async fn search_memory(
    req: HttpRequest,
    body: web::Json<MemorySearchRequestBody>,
    ai_service: web::Data<AiCoreService>,
    auth_service: web::Data<AuthService>,
) -> HttpResponse {
    let request_id = get_request_id(&req);
    let user_id = resolve_user_id(&req, &auth_service, body.user_id.as_deref());
    let limit = body.limit.unwrap_or(6).clamp(1, 20);

    match ai_service.search_memory(&user_id, &body.query, limit).await {
        Ok(hits) => HttpResponse::Ok().json(json!({
            "status": "success",
            "data": { "hits": hits },
            "meta": { "request_id": request_id }
        })),
        Err(error) => ai_error_response(error, &request_id),
    }
}

pub async fn rag_query(
    req: HttpRequest,
    body: web::Json<RagQueryRequestBody>,
    ai_service: web::Data<AiCoreService>,
    auth_service: web::Data<AuthService>,
    pool: web::Data<PgPool>,
) -> HttpResponse {
    let request_id = get_request_id(&req);
    let user_id = resolve_user_id(&req, &auth_service, body.user_id.as_deref());
    let limit = body.limit.unwrap_or(6).clamp(1, 20);

    match ai_service
        .rag_query(
            pool.get_ref(),
            &user_id,
            &body.question,
            limit,
            body.model.clone(),
        )
        .await
    {
        Ok(result) => HttpResponse::Ok().json(json!({
            "status": "success",
            "data": {
                "answer": result.answer,
                "model": result.model,
                "contexts": result.contexts
            },
            "meta": { "request_id": request_id }
        })),
        Err(error) => ai_error_response(error, &request_id),
    }
}

pub async fn transcribe_voice(
    req: HttpRequest,
    body: web::Json<VoiceTranscriptionRequestBody>,
    ai_service: web::Data<AiCoreService>,
) -> HttpResponse {
    let request_id = get_request_id(&req);

    match ai_service
        .transcribe(
            &body.audio_base64,
            body.language.as_deref(),
            body.prompt.as_deref(),
        )
        .await
    {
        Ok(result) => HttpResponse::Ok().json(json!({
            "status": "success",
            "data": {
                "text": result.text,
                "language": result.language,
                "provider": result.provider
            },
            "meta": { "request_id": request_id }
        })),
        Err(error) => ai_error_response(error, &request_id),
    }
}

fn ai_error_response(error: AiCoreError, request_id: &str) -> HttpResponse {
    let (status, code) = match &error {
        AiCoreError::Upstream(_) | AiCoreError::InvalidResponse(_) => (
            actix_web::http::StatusCode::BAD_GATEWAY,
            "AI_UPSTREAM_ERROR",
        ),
        AiCoreError::Http(_) => (actix_web::http::StatusCode::BAD_GATEWAY, "AI_NETWORK_ERROR"),
        AiCoreError::Database(_) => (
            actix_web::http::StatusCode::INTERNAL_SERVER_ERROR,
            "AI_DATABASE_ERROR",
        ),
    };

    HttpResponse::build(status).json(json!({
        "status": "error",
        "error": {
            "code": code,
            "message": error.to_string()
        },
        "meta": { "request_id": request_id }
    }))
}
