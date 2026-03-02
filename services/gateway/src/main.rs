//! Mirlind Life OS - API Gateway
//!
//! The main entry point for all API requests.

use actix_cors::Cors;
use actix_web::{App, HttpServer, middleware as actix_middleware, web};
use dotenvy::dotenv;
use std::env;
use tracing::{Level, info};
use tracing_subscriber::FmtSubscriber;

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

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    // Load environment variables
    dotenv().ok();

    // Initialize tracing
    let _subscriber = FmtSubscriber::builder()
        .with_max_level(Level::INFO)
        .with_target(false)
        .with_thread_ids(true)
        .with_file(true)
        .with_line_number(true)
        .compact()
        .init();

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
