use actix_web::HttpResponse;
use serde_json::json;
use std::time::{SystemTime, UNIX_EPOCH};

/// Health check endpoint - simplified version
pub async fn health_check() -> HttpResponse {
    let response = json!({
        "status": "healthy",
        "version": env!("CARGO_PKG_VERSION"),
        "timestamp": SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs(),
        "message": "Mirlind Life OS API Gateway is running"
    });

    HttpResponse::Ok().json(response)
}

/// Version information endpoint
pub async fn version_info() -> HttpResponse {
    let build_info = json!({
        "name": "Mirlind Life OS API Gateway",
        "version": env!("CARGO_PKG_VERSION"),
        "description": "Mirlind Protocol API Gateway",
        "rust_version": "1.93.1",
        "features": [
            "authentication",
            "rate_limiting",
            "websocket",
            "caching",
            "tracing"
        ]
    });

    HttpResponse::Ok().json(build_info)
}
