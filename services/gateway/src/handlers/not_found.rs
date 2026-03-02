use actix_web::HttpResponse;
use serde_json::json;

/// 404 handler
pub async fn handler() -> HttpResponse {
    HttpResponse::NotFound().json(json!({
        "status": "error",
        "error": {
            "code": "NOT_FOUND",
            "message": "The requested resource was not found"
        }
    }))
}
