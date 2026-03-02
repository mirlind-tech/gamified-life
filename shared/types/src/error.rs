use serde::{Deserialize, Serialize};
use std::fmt;

/// Standard error response for all API endpoints
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ApiError {
    pub code: String,
    pub message: String,
    pub details: Option<serde_json::Value>,
    pub request_id: String,
}

impl ApiError {
    pub fn new(code: impl Into<String>, message: impl Into<String>) -> Self {
        Self {
            code: code.into(),
            message: message.into(),
            details: None,
            request_id: uuid::Uuid::new_v4().to_string(),
        }
    }

    pub fn with_details(mut self, details: serde_json::Value) -> Self {
        self.details = Some(details);
        self
    }

    pub fn with_request_id(mut self, request_id: impl Into<String>) -> Self {
        self.request_id = request_id.into();
        self
    }
}

impl fmt::Display for ApiError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(
            f,
            "[{}] {} (req_id: {})",
            self.code, self.message, self.request_id
        )
    }
}

impl std::error::Error for ApiError {}

/// Standard API response wrapper
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "status", rename_all = "snake_case")]
pub enum ApiResponse<T> {
    Success { data: T, meta: Option<ResponseMeta> },
    Error { error: ApiError },
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct ResponseMeta {
    pub total_count: Option<u64>,
    pub page: Option<u32>,
    pub per_page: Option<u32>,
    pub next_cursor: Option<String>,
}

impl<T> ApiResponse<T> {
    pub fn success(data: T) -> Self {
        ApiResponse::Success { data, meta: None }
    }

    pub fn success_with_meta(data: T, meta: ResponseMeta) -> Self {
        ApiResponse::Success {
            data,
            meta: Some(meta),
        }
    }

    pub fn error(error: ApiError) -> Self {
        ApiResponse::Error { error }
    }
}

/// Error codes used across the system
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ErrorCode {
    // Authentication errors (1xx)
    Unauthorized = 100,
    InvalidToken = 101,
    TokenExpired = 102,
    InsufficientPermissions = 103,

    // Validation errors (2xx)
    ValidationError = 200,
    MissingField = 201,
    InvalidFormat = 202,

    // Resource errors (3xx)
    NotFound = 300,
    AlreadyExists = 301,
    Conflict = 302,

    // Rate limiting (4xx)
    RateLimitExceeded = 400,

    // Service errors (5xx)
    InternalError = 500,
    ServiceUnavailable = 501,
    Timeout = 502,

    // Blockchain/Finance errors (6xx)
    InsufficientFunds = 600,
    InvalidTransaction = 601,
    NetworkError = 602,
}

impl ErrorCode {
    pub fn as_str(&self) -> &'static str {
        match self {
            ErrorCode::Unauthorized => "UNAUTHORIZED",
            ErrorCode::InvalidToken => "INVALID_TOKEN",
            ErrorCode::TokenExpired => "TOKEN_EXPIRED",
            ErrorCode::InsufficientPermissions => "INSUFFICIENT_PERMISSIONS",
            ErrorCode::ValidationError => "VALIDATION_ERROR",
            ErrorCode::MissingField => "MISSING_FIELD",
            ErrorCode::InvalidFormat => "INVALID_FORMAT",
            ErrorCode::NotFound => "NOT_FOUND",
            ErrorCode::AlreadyExists => "ALREADY_EXISTS",
            ErrorCode::Conflict => "CONFLICT",
            ErrorCode::RateLimitExceeded => "RATE_LIMIT_EXCEEDED",
            ErrorCode::InternalError => "INTERNAL_ERROR",
            ErrorCode::ServiceUnavailable => "SERVICE_UNAVAILABLE",
            ErrorCode::Timeout => "TIMEOUT",
            ErrorCode::InsufficientFunds => "INSUFFICIENT_FUNDS",
            ErrorCode::InvalidTransaction => "INVALID_TRANSACTION",
            ErrorCode::NetworkError => "NETWORK_ERROR",
        }
    }
}
