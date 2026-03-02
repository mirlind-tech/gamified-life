//! User models for API responses
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

/// User profile response (frontend-compatible)
#[derive(Debug, Serialize, Deserialize)]
pub struct User {
    pub id: String,
    pub email: String,
    pub username: String,
    pub created_at: DateTime<Utc>,
}

/// Auth response (frontend-compatible format)
#[derive(Debug, Serialize, Deserialize)]
pub struct AuthResponseData {
    pub token: String,
    pub user: User,
}

/// Player stats (frontend-compatible)
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
