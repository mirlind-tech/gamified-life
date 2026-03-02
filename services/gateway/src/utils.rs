//! Utility functions for the gateway service

use actix_web::{HttpMessage, HttpResponse};
use serde::Serialize;
use serde_json::json;

/// Create a successful API response
#[allow(dead_code)]
pub fn success_response<T: Serialize>(data: T, request_id: &str) -> HttpResponse {
    HttpResponse::Ok().json(json!({
        "status": "success",
        "data": data,
        "meta": {
            "request_id": request_id
        }
    }))
}

/// Create an error API response
#[allow(dead_code)]
pub fn error_response(code: &str, message: &str, request_id: &str) -> HttpResponse {
    HttpResponse::BadRequest().json(json!({
        "status": "error",
        "error": {
            "code": code,
            "message": message
        },
        "meta": {
            "request_id": request_id
        }
    }))
}

/// Extract request ID from request extensions
#[allow(dead_code)]
pub fn get_request_id(req: &actix_web::HttpRequest) -> String {
    req.extensions()
        .get::<String>()
        .cloned()
        .unwrap_or_else(|| "unknown".to_string())
}
