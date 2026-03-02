//! Route configuration

use actix_web::{HttpResponse, web};

use crate::handlers;
use crate::middleware::{Auth, RateLimit};

/// Configure all routes
pub fn configure(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/api")
            // Auth routes (public - rate limited to prevent brute force)
            .service(
                web::scope("/auth")
                    .wrap(RateLimit::new(10)) // 10 requests per minute for auth endpoints
                    .route("/register", web::post().to(handlers::auth::register))
                    .route("/login", web::post().to(handlers::auth::login))
                    .route("/refresh", web::post().to(handlers::auth::refresh))
                    .route("/logout", web::post().to(handlers::auth::logout))
                    .route("/me", web::get().to(handlers::auth::me)),
            )
            // Protected routes with auth middleware
            .service(
                web::scope("/player")
                    .wrap(Auth)
                    .route("/stats", web::get().to(handlers::player::get_stats))
                    .route("/stats", web::put().to(handlers::player::update_stats))
                    .route("/add-xp", web::post().to(handlers::player::add_xp))
                    .route(
                        "/activity",
                        web::post().to(handlers::player::track_activity),
                    ),
            )
            .service(
                web::scope("/workouts")
                    .wrap(Auth)
                    .route("", web::get().to(handlers::workouts::get_workouts))
                    .route("", web::post().to(handlers::workouts::create_workout)),
            )
            .service(web::scope("/body").wrap(Auth).route(
                "/latest",
                web::get().to(handlers::workouts::get_body_latest),
            ))
            .service(
                web::scope("/code")
                    .wrap(Auth)
                    .route("/latest", web::get().to(handlers::code::get_latest))
                    .route("/{date}", web::get().to(handlers::code::get_by_date))
                    .route(
                        "/stats/total",
                        web::get().to(handlers::code::get_stats_total),
                    )
                    .route(
                        "/stats/streak",
                        web::get().to(handlers::code::get_stats_streak),
                    )
                    .route("", web::post().to(handlers::code::save_code)),
            )
            .service(
                web::scope("/german")
                    .wrap(Auth)
                    .route("/latest", web::get().to(handlers::german::get_latest))
                    .route("/{date}", web::get().to(handlers::german::get_by_date))
                    .route("", web::post().to(handlers::german::save_german)),
            )
            .service(
                web::scope("/protocol")
                    .wrap(Auth)
                    .route("/streak", web::get().to(handlers::protocol::get_streak))
                    .route("/{date}", web::get().to(handlers::protocol::get_protocol))
                    .route("", web::post().to(handlers::protocol::create_protocol)),
            )
            .service(
                web::scope("/retention")
                    .wrap(Auth)
                    .route("/status", web::get().to(handlers::protocol::get_retention)),
            )
            .service(
                web::scope("/finance")
                    .wrap(Auth)
                    .route("", web::get().to(handlers::finance::get_finance))
                    .route("", web::post().to(handlers::finance::create_finance_entry))
                    .route("/profile", web::get().to(handlers::finance::get_profile))
                    .route("/profile", web::put().to(handlers::finance::upsert_profile))
                    .route("/summary", web::get().to(handlers::finance::get_summary))
                    .route("/caps", web::get().to(handlers::finance::get_caps)),
            )
            .service(web::scope("/coach").wrap(Auth).route(
                "/actions/history",
                web::get().to(handlers::code::get_coach_actions_history),
            ))
            .service(
                web::scope("/ai")
                    .wrap(Auth)
                    .route("/chat", web::post().to(handlers::ai::chat))
                    .route(
                        "/memory/upsert",
                        web::post().to(handlers::ai::upsert_memory),
                    )
                    .route(
                        "/memory/search",
                        web::post().to(handlers::ai::search_memory),
                    )
                    .route("/rag/query", web::post().to(handlers::ai::rag_query))
                    .route(
                        "/voice/transcribe",
                        web::post().to(handlers::ai::transcribe_voice),
                    ),
            )
            .service(
                web::scope("/weekly")
                    .wrap(Auth)
                    .route("/plan", web::get().to(handlers::weekly::get_plan))
                    .route("/review", web::get().to(handlers::weekly::get_review)),
            )
            .service(
                web::scope("/adaptive")
                    .wrap(Auth)
                    .route("/profile", web::get().to(handlers::adaptive::get_profile))
                    .route(
                        "/recommendation",
                        web::get().to(handlers::adaptive::get_recommendation),
                    ),
            )
            .service(
                web::scope("/analytics")
                    .wrap(Auth)
                    .route("/trends", web::get().to(handlers::analytics::get_trends)),
            )
            .service(
                web::scope("/skills")
                    .wrap(Auth)
                    .route("", web::get().to(handlers::skills::get_skills))
                    .route(
                        "/categories",
                        web::get().to(handlers::skills::get_categories),
                    )
                    .route("/{key}", web::get().to(handlers::skills::get_skill))
                    .route("/{key}", web::put().to(handlers::skills::update_skill)),
            )
            // Tech Stack Curriculum routes
            .service(
                web::scope("/curriculum")
                    .wrap(Auth)
                    .route(
                        "/stats",
                        web::get().to(handlers::curriculum::get_curriculum_stats),
                    )
                    .route("/skills", web::get().to(handlers::curriculum::get_skills))
                    .route(
                        "/skills/{key}",
                        web::get().to(handlers::curriculum::get_skill_detail),
                    )
                    .route(
                        "/modules/{id}",
                        web::put().to(handlers::curriculum::update_module_progress),
                    ),
            )
            .service(
                web::scope("/challenges")
                    .wrap(Auth)
                    .route("", web::get().to(handlers::challenges::get_challenges))
                    .route("/quote", web::get().to(handlers::challenges::get_quote))
                    .route(
                        "/join",
                        web::post().to(handlers::challenges::join_challenge),
                    )
                    .route(
                        "/progress",
                        web::post().to(handlers::challenges::update_progress),
                    ),
            )
            .service(
                web::scope("/fang-yuan")
                    .wrap(Auth)
                    .route(
                        "/principles",
                        web::get().to(handlers::fang_yuan::get_principles),
                    )
                    .route(
                        "/principles/{num}",
                        web::get().to(handlers::fang_yuan::get_principle),
                    )
                    .route("/quiz", web::post().to(handlers::fang_yuan::submit_quiz))
                    .route(
                        "/daily",
                        web::get().to(handlers::fang_yuan::get_daily_teaching),
                    ),
            )
            .service(
                web::scope("/telemetry")
                    .wrap(Auth)
                    .route(
                        "/event",
                        web::post().to(handlers::workouts::telemetry_event),
                    )
                    .route(
                        "/error",
                        web::post().to(handlers::workouts::telemetry_error),
                    ),
            )
            .service(
                web::scope("/outcomes")
                    .wrap(Auth)
                    .route("", web::get().to(handlers::workouts::get_outcomes))
                    .route(
                        "/summary",
                        web::get().to(handlers::workouts::get_outcomes_summary),
                    ),
            )
            // Job Hunt Tracker routes
            .service(
                web::scope("/jobs")
                    .wrap(Auth)
                    .route("", web::get().to(handlers::jobs::get_jobs))
                    .route("", web::post().to(handlers::jobs::create_job))
                    .route("/stats", web::get().to(handlers::jobs::get_job_stats))
                    .route("/goals", web::put().to(handlers::jobs::set_goals))
                    .route("/{id}", web::get().to(handlers::jobs::get_job))
                    .route("/{id}", web::put().to(handlers::jobs::update_job))
                    .route("/{id}", web::delete().to(handlers::jobs::delete_job)),
            )
            // WebSocket endpoint
            .service(web::resource("/ws").route(web::get().to(handlers::websocket::ws_handler)))
            // Export routes
            .service(
                web::scope("/export")
                    .wrap(Auth)
                    .route("", web::get().to(handlers::export::export_data))
                    .route(
                        "/formats",
                        web::get().to(handlers::export::get_export_formats),
                    ),
            )
            // Photo progress routes
            .service(
                web::scope("/photos")
                    .wrap(Auth)
                    .route("", web::get().to(handlers::photos::get_photos))
                    .route("", web::post().to(handlers::photos::upload_photo))
                    .route("/stats", web::get().to(handlers::photos::get_photo_stats))
                    .route("/{id}", web::delete().to(handlers::photos::delete_photo)),
            )
            // Weight tracking routes
            .service(
                web::scope("/weight")
                    .wrap(Auth)
                    .route("", web::get().to(handlers::weight::get_weight_history))
                    .route("", web::post().to(handlers::weight::save_weight))
                    .route("/chart", web::get().to(handlers::weight::get_weight_chart))
                    .route("/{id}", web::delete().to(handlers::weight::delete_weight)),
            )
            // Legacy init-db endpoint (public)
            .route("/init-db", web::post().to(init_db_handler)),
    );
}

/// Legacy init-db handler
async fn init_db_handler() -> HttpResponse {
    HttpResponse::Ok().json(serde_json::json!({
        "message": "Database already initialized",
        "status": "success"
    }))
}
