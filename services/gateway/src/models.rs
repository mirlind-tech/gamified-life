//! Data models for the gateway service
//!
//! These models are specific to the gateway layer.

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

/// User profile (frontend-compatible)
#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
#[allow(dead_code)]
pub struct User {
    pub id: Uuid,
    pub email: String,
    pub username: String,
    pub created_at: DateTime<Utc>,
}

impl User {
    /// Convert to frontend format (string ID)
    #[allow(dead_code)]
    pub fn to_response(&self) -> UserResponse {
        UserResponse {
            id: self.id.to_string(),
            email: self.email.clone(),
            username: self.username.clone(),
            created_at: self.created_at,
        }
    }
}

/// User response for frontend
#[derive(Debug, Serialize, Deserialize)]
#[allow(dead_code)]
pub struct UserResponse {
    pub id: String,
    pub email: String,
    pub username: String,
    pub created_at: DateTime<Utc>,
}

/// Auth response (frontend-compatible)
#[derive(Debug, Serialize, Deserialize)]
#[allow(dead_code)]
pub struct AuthResponseData {
    pub token: String,
    pub user: UserResponse,
}

/// Player stats for frontend
#[derive(Debug, Serialize, Deserialize, Default)]
pub struct PlayerStats {
    pub level: i32,
    pub xp: i32,
    pub xp_to_next: i32,
    pub pillars: serde_json::Value,
    pub skills: serde_json::Value,
    pub activity_stats: ActivityStats,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct ActivityStats {
    pub focus_sessions: i32,
    pub focus_minutes: i32,
    pub habits_completed: i32,
    pub journal_entries: i32,
    pub quests_completed: i32,
    pub meditation_minutes: i32,
}

/// Add XP response
#[derive(Debug, Serialize, Deserialize)]
pub struct AddXPResponse {
    pub message: String,
    pub level_up: bool,
    pub levels_gained: i32,
    pub new_level: i32,
    pub xp: i32,
    pub xp_to_next: i32,
    pub progress: f64,
}

/// API response wrapper
#[derive(Debug, Serialize, Deserialize)]
#[allow(dead_code)]
pub struct ApiResponse<T> {
    pub status: String,
    pub data: Option<T>,
    pub error: Option<ApiError>,
    pub request_id: String,
}

#[derive(Debug, Serialize, Deserialize)]
#[allow(dead_code)]
pub struct ApiError {
    pub code: String,
    pub message: String,
}

/// Pagination params
#[derive(Debug, Deserialize)]
#[allow(dead_code)]
pub struct PaginationParams {
    pub page: Option<u32>,
    pub per_page: Option<u32>,
}

impl PaginationParams {
    #[allow(dead_code)]
    pub fn page(&self) -> u32 {
        self.page.unwrap_or(1).max(1)
    }

    #[allow(dead_code)]
    pub fn per_page(&self) -> u32 {
        let per_page = self.per_page.unwrap_or(20);
        per_page.min(100).max(1)
    }

    #[allow(dead_code)]
    pub fn offset(&self) -> i64 {
        ((self.page() - 1) * self.per_page()) as i64
    }
}

/// Service health status
#[derive(Debug, Serialize, Deserialize)]
#[allow(dead_code)]
pub struct ServiceHealth {
    pub name: String,
    pub status: String,
    pub latency_ms: u64,
}
