use serde::{Deserialize, Serialize};

use crate::{Id, Role, Timestamp};

/// User profile
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct User {
    pub id: Id,
    pub email: String,
    pub username: String,
    pub display_name: String,
    pub avatar_url: Option<String>,
    pub bio: Option<String>,
    pub role: Role,
    pub status: UserStatus,
    pub created_at: Timestamp,
    pub updated_at: Timestamp,
    pub last_active_at: Option<Timestamp>,
    pub verified_at: Option<Timestamp>,
    pub settings: UserSettings,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum UserStatus {
    Active,
    Inactive,
    Suspended,
    PendingVerification,
}

/// User settings
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserSettings {
    pub notifications: NotificationSettings,
    pub privacy: PrivacySettings,
    pub appearance: AppearanceSettings,
    pub language: String,
    pub timezone: String,
}

impl Default for UserSettings {
    fn default() -> Self {
        Self {
            notifications: NotificationSettings::default(),
            privacy: PrivacySettings::default(),
            appearance: AppearanceSettings::default(),
            language: "en".to_string(),
            timezone: "UTC".to_string(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NotificationSettings {
    pub push_enabled: bool,
    pub email_enabled: bool,
    pub sms_enabled: bool,
    pub message_preview: bool,
    pub sound_enabled: bool,
    pub do_not_disturb: bool,
    pub dnd_start: Option<String>,
    pub dnd_end: Option<String>,
}

impl Default for NotificationSettings {
    fn default() -> Self {
        Self {
            push_enabled: true,
            email_enabled: true,
            sms_enabled: false,
            message_preview: true,
            sound_enabled: true,
            do_not_disturb: false,
            dnd_start: None,
            dnd_end: None,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PrivacySettings {
    pub profile_visible: bool,
    pub last_seen_visible: bool,
    pub read_receipts: bool,
    pub typing_indicators: bool,
    pub discoverable_by_email: bool,
    pub discoverable_by_phone: bool,
}

impl Default for PrivacySettings {
    fn default() -> Self {
        Self {
            profile_visible: true,
            last_seen_visible: true,
            read_receipts: true,
            typing_indicators: true,
            discoverable_by_email: false,
            discoverable_by_phone: false,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppearanceSettings {
    pub theme: Theme,
    pub accent_color: String,
    pub font_size: FontSize,
    pub reduced_motion: bool,
    pub high_contrast: bool,
}

impl Default for AppearanceSettings {
    fn default() -> Self {
        Self {
            theme: Theme::Dark,
            accent_color: "#00f0ff".to_string(), // Cyberpunk cyan
            font_size: FontSize::Medium,
            reduced_motion: false,
            high_contrast: false,
        }
    }
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum Theme {
    Light,
    Dark,
    Cyberpunk,
    System,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum FontSize {
    Small,
    Medium,
    Large,
}

/// User profile update request
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateProfileRequest {
    pub display_name: Option<String>,
    pub bio: Option<String>,
    pub avatar_url: Option<String>,
}

/// User public profile (limited info)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PublicProfile {
    pub id: Id,
    pub username: String,
    pub display_name: String,
    pub avatar_url: Option<String>,
    pub bio: Option<String>,
    pub status: UserStatus,
    pub last_active_at: Option<Timestamp>,
}

impl From<User> for PublicProfile {
    fn from(user: User) -> Self {
        Self {
            id: user.id,
            username: user.username,
            display_name: user.display_name,
            avatar_url: user.avatar_url,
            bio: user.bio,
            status: user.status,
            last_active_at: user.last_active_at,
        }
    }
}

/// User stats
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserStats {
    pub user_id: Id,
    pub xp_total: u64,
    pub level: u32,
    pub streak_days: u32,
    pub longest_streak: u32,
    pub achievements_count: u32,
    pub messages_sent: u64,
    pub transactions_count: u64,
}
