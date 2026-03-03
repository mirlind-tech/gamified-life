//! Mirlind Life OS - API Gateway
//!
//! The main entry point for all API requests.

use actix_cors::Cors;
use actix_web::{App, HttpServer, middleware as actix_middleware, web};
use dotenvy::dotenv;
use std::env;
use tracing::{Level, info};
use tracing_subscriber::EnvFilter;

mod config;
mod handlers;
mod middleware;
mod models;
mod routes;
mod services;
mod utils;

use config::AppConfig;
use handlers::websocket::MessageBroker;
use middleware::RequestId;
use services::{AiCoreService, AuthService};
use services::cache::CacheService;

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    // Load environment variables
    dotenv().ok();

    // Initialize structured JSON logging
    let json_logging = env::var("JSON_LOGGING").unwrap_or_else(|_| "false".to_string()) == "true";
    
    if json_logging {
        // Production: JSON format for observability
        tracing_subscriber::fmt()
            .json()
            .with_env_filter(
                EnvFilter::from_default_env()
                    .add_directive(Level::INFO.into())
            )
            .with_target(true)
            .with_thread_ids(true)
            .with_file(true)
            .with_line_number(true)
            .with_current_span(true)
            .with_span_list(true)
            .init();
        info!("JSON structured logging enabled");
    } else {
        // Development: Pretty format
        tracing_subscriber::fmt()
            .with_env_filter(
                tracing_subscriber::EnvFilter::from_default_env()
                    .add_directive(Level::DEBUG.into())
            )
            .with_target(false)
            .with_thread_ids(true)
            .with_file(true)
            .with_line_number(true)
            .compact()
            .init();
    }

    info!(
        "🚀 Starting Mirlind Life OS API Gateway v{}",
        env!("CARGO_PKG_VERSION")
    );

    // Load configuration
    info!("Loading configuration...");
    let app_config = match AppConfig::from_env() {
        Ok(config) => config,
        Err(e) => {
            eprintln!("Failed to load configuration: {}", e);
            std::process::exit(1);
        }
    };
    let database_url = app_config.database_url.clone();
    let app_config = web::Data::new(app_config);
    info!("Configuration loaded successfully");

    // Initialize database
    info!("Initializing database connection...");
    let db_pool = match sqlx::PgPool::connect(&database_url).await {
        Ok(pool) => {
            info!("✅ Database connected successfully");
            pool
        }
        Err(e) => {
            eprintln!("Failed to connect to database: {}", e);
            std::process::exit(1);
        }
    };
    let db_pool = web::Data::new(db_pool);

    // Initialize Redis cache
    info!("Initializing Redis cache...");
    let cache_service = match CacheService::new(&app_config.redis_url).await {
        Ok(cache) => {
            info!("✅ Redis cache connected successfully");
            cache
        }
        Err(e) => {
            eprintln!("Failed to connect to Redis: {}", e);
            std::process::exit(1);
        }
    };
    let cache_service = web::Data::new(cache_service);

    // Initialize auth service
    info!("Initializing auth service...");
    let auth_service = AuthService::new(
        app_config.jwt_secret.clone(),
        app_config.jwt_expiration_hours,
        app_config.refresh_token_expiration_days,
    );
    let auth_service = web::Data::new(auth_service);
    info!("Auth service initialized");

    // Initialize AI core service
    info!("Initializing AI core service...");
    let ai_core_service = AiCoreService::new(app_config.ai_core.clone());
    let ai_core_service = web::Data::new(ai_core_service);
    info!("AI core service initialized");

    // Initialize WebSocket message broker
    info!("Initializing WebSocket broker...");
    let ws_broker = web::Data::new(MessageBroker::new());
    info!("WebSocket broker initialized");

    // Get server configuration
    let host = env::var("GATEWAY_HOST").unwrap_or_else(|_| "127.0.0.1".to_string());
    let port = env::var("GATEWAY_PORT")
        .ok()
        .and_then(|p| p.parse().ok())
        .unwrap_or(3005);

    info!("📡 Server binding to {}:{}", host, port);

    // Start HTTP server
    HttpServer::new(move || {
        // Configure CORS
        let cors = Cors::default()
            .allowed_origin_fn(|origin, _req_head| {
                let origin_str = origin.to_str().unwrap_or("");
                origin_str.starts_with("http://localhost:")
                    || origin_str.starts_with("http://127.0.0.1:")
                    || origin_str.ends_with(".mirlind.io")
            })
            .allowed_methods(vec!["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"])
            .allowed_headers(vec![
                actix_web::http::header::AUTHORIZATION,
                actix_web::http::header::ACCEPT,
                actix_web::http::header::CONTENT_TYPE,
            ])
            .supports_credentials()
            .max_age(3600);

        App::new()
            // Shared state
            .app_data(app_config.clone())
            .app_data(auth_service.clone())
            .app_data(db_pool.clone())
            .app_data(ai_core_service.clone())
            .app_data(cache_service.clone())
            .app_data(ws_broker.clone())
            // Middleware (order matters - last added wraps first)
            .wrap(cors)
            .wrap(RequestId)
            .wrap(actix_middleware::Logger::new(
                "%a %r %s %b %Dms %{User-Agent}i",
            ))
            .wrap(actix_middleware::Compress::default())
            .wrap(actix_middleware::NormalizePath::trim())
            // Health check
            .service(web::resource("/health").route(web::get().to(handlers::health::health_check)))
            // Version info
            .service(web::resource("/version").route(web::get().to(handlers::health::version_info)))
            // API routes
            .configure(routes::configure)
            // 404 handler
            .default_service(web::route().to(handlers::not_found::handler))
    })
    .bind(format!("{}:{}", host, port))?
    .run()
    .await
}
