use serde::Deserialize;

#[derive(Debug, Clone, Deserialize)]
pub struct AppConfig {
    pub database_url: String,
    #[allow(dead_code)]
    pub redis_url: String,
    pub jwt_secret: String,
    pub jwt_expiration_hours: i64,
    pub refresh_token_expiration_days: i64,
    #[allow(dead_code)]
    pub cors_origins: Vec<String>,
    #[allow(dead_code)]
    pub rate_limit_requests: u32,
    #[allow(dead_code)]
    pub rate_limit_duration_seconds: u64,
    #[allow(dead_code)]
    pub service_urls: ServiceUrls,
    #[allow(dead_code)]
    pub ai_core: AiCoreConfig,
}

#[derive(Debug, Clone, Deserialize)]
#[allow(dead_code)]
pub struct ServiceUrls {
    pub messaging: String,
    pub finance: String,
    pub ai_core: String,
    pub education: String,
    pub docs: String,
}

#[derive(Debug, Clone, Deserialize)]
#[allow(dead_code)]
pub struct AiCoreConfig {
    pub ollama_url: String,
    pub ollama_chat_model: String,
    pub ollama_embedding_model: String,
    pub qdrant_url: String,
    pub qdrant_collection: String,
    pub qdrant_top_k: u64,
    pub whisper_url: String,
    pub whisper_model: String,
}

impl AppConfig {
    pub fn from_env() -> Result<Self, Box<dyn std::error::Error>> {
        Ok(Self {
            database_url: std::env::var("DATABASE_URL")
                .unwrap_or_else(|_| "postgres://localhost:5432/mirlind".to_string()),
            redis_url: std::env::var("REDIS_URL")
                .unwrap_or_else(|_| "redis://localhost:6379".to_string()),
            jwt_secret: std::env::var("JWT_SECRET").map_err(|_| "JWT_SECRET must be set")?,
            jwt_expiration_hours: std::env::var("JWT_EXPIRATION_HOURS")
                .ok()
                .and_then(|s| s.parse().ok())
                .unwrap_or(24),
            refresh_token_expiration_days: std::env::var("REFRESH_TOKEN_EXPIRATION_DAYS")
                .ok()
                .and_then(|s| s.parse().ok())
                .unwrap_or(30),
            cors_origins: std::env::var("CORS_ORIGINS")
                .unwrap_or_default()
                .split(',')
                .map(|s| s.trim().to_string())
                .filter(|s| !s.is_empty())
                .collect(),
            rate_limit_requests: std::env::var("RATE_LIMIT_REQUESTS")
                .ok()
                .and_then(|s| s.parse().ok())
                .unwrap_or(100),
            rate_limit_duration_seconds: std::env::var("RATE_LIMIT_DURATION_SECONDS")
                .ok()
                .and_then(|s| s.parse().ok())
                .unwrap_or(60),
            service_urls: ServiceUrls {
                messaging: std::env::var("MESSAGING_SERVICE_URL")
                    .unwrap_or_else(|_| "http://localhost:3001".to_string()),
                finance: std::env::var("FINANCE_SERVICE_URL")
                    .unwrap_or_else(|_| "http://localhost:3002".to_string()),
                ai_core: std::env::var("AI_CORE_SERVICE_URL")
                    .unwrap_or_else(|_| "http://localhost:3003".to_string()),
                education: std::env::var("EDUCATION_SERVICE_URL")
                    .unwrap_or_else(|_| "http://localhost:3004".to_string()),
                docs: std::env::var("DOCS_SERVICE_URL")
                    .unwrap_or_else(|_| "http://localhost:3005".to_string()),
            },
            ai_core: AiCoreConfig {
                ollama_url: std::env::var("OLLAMA_URL")
                    .unwrap_or_else(|_| "http://localhost:11434".to_string()),
                ollama_chat_model: std::env::var("OLLAMA_CHAT_MODEL")
                    .unwrap_or_else(|_| "llama3.1:8b".to_string()),
                ollama_embedding_model: std::env::var("OLLAMA_EMBEDDING_MODEL")
                    .unwrap_or_else(|_| "nomic-embed-text".to_string()),
                qdrant_url: std::env::var("QDRANT_URL")
                    .unwrap_or_else(|_| "http://localhost:6333".to_string()),
                qdrant_collection: std::env::var("QDRANT_COLLECTION")
                    .unwrap_or_else(|_| "user_memory".to_string()),
                qdrant_top_k: std::env::var("QDRANT_TOP_K")
                    .ok()
                    .and_then(|s| s.parse().ok())
                    .unwrap_or(6),
                whisper_url: std::env::var("WHISPER_URL")
                    .unwrap_or_else(|_| "http://localhost:9000/transcribe".to_string()),
                whisper_model: std::env::var("WHISPER_MODEL")
                    .unwrap_or_else(|_| "small".to_string()),
            },
        })
    }
}
