use serde::{Deserialize, Serialize};

use crate::{DeviceInfo, Id, Location, Timestamp};

/// User authentication request
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AuthRequest {
    pub email: String,
    pub password: String,
    pub device_info: DeviceInfo,
    pub location: Option<Location>,
}

/// Registration request
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RegisterRequest {
    pub email: String,
    pub password: String,
    pub username: String,
    pub display_name: String,
    pub device_info: DeviceInfo,
}

/// Authentication response with tokens
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AuthResponse {
    pub user_id: Id,
    pub access_token: String,
    pub refresh_token: String,
    pub expires_in: i64,
    pub token_type: String,
}

/// Token claims structure
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TokenClaims {
    pub sub: String, // User ID
    pub jti: String, // Token ID
    pub iat: i64,    // Issued at
    pub exp: i64,    // Expiration
    pub typ: TokenType,
    pub device_id: String,
    pub permissions: Vec<String>,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum TokenType {
    Access,
    Refresh,
    Service,
}

/// Refresh token request
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RefreshRequest {
    pub refresh_token: String,
}

/// Logout request
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LogoutRequest {
    pub all_devices: bool,
}

/// Session information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Session {
    pub id: Id,
    pub user_id: Id,
    pub device_info: DeviceInfo,
    pub location: Option<Location>,
    pub created_at: Timestamp,
    pub expires_at: Timestamp,
    pub last_active_at: Timestamp,
}

/// Active sessions list
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SessionsList {
    pub sessions: Vec<Session>,
    pub current_session_id: Id,
}

/// Password change request
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PasswordChangeRequest {
    pub current_password: String,
    pub new_password: String,
}

/// MFA methods
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum MfaMethod {
    Totp,
    Webauthn,
    RecoveryCodes,
}

/// MFA setup response
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MfaSetupResponse {
    pub method: MfaMethod,
    pub secret: Option<String>,
    pub qr_code_uri: Option<String>,
    pub backup_codes: Vec<String>,
}

/// Permission enum
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq, Hash)]
#[serde(rename_all = "snake_case")]
pub enum Permission {
    // User management
    UserRead,
    UserWrite,
    UserDelete,

    // Messaging
    MessageSend,
    MessageDelete,
    GroupCreate,
    GroupManage,

    // Finance
    WalletRead,
    WalletWrite,
    TransactionSend,
    TransactionReceive,

    // Admin
    AdminAccess,
    ServiceManage,
}

/// Role definition
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum Role {
    User,
    Premium,
    Moderator,
    Admin,
    System,
}

impl Role {
    pub fn permissions(&self) -> Vec<Permission> {
        match self {
            Role::User => vec![
                Permission::UserRead,
                Permission::UserWrite,
                Permission::MessageSend,
                Permission::WalletRead,
                Permission::WalletWrite,
                Permission::TransactionSend,
                Permission::TransactionReceive,
            ],
            Role::Premium => {
                let mut perms = Role::User.permissions();
                perms.push(Permission::GroupCreate);
                perms
            }
            Role::Moderator => {
                let mut perms = Role::Premium.permissions();
                perms.push(Permission::MessageDelete);
                perms.push(Permission::GroupManage);
                perms
            }
            Role::Admin => vec![
                Permission::UserRead,
                Permission::UserWrite,
                Permission::UserDelete,
                Permission::MessageSend,
                Permission::MessageDelete,
                Permission::GroupCreate,
                Permission::GroupManage,
                Permission::WalletRead,
                Permission::WalletWrite,
                Permission::TransactionSend,
                Permission::TransactionReceive,
                Permission::AdminAccess,
            ],
            Role::System => vec![Permission::ServiceManage],
        }
    }
}

/// WebAuthn challenge
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WebAuthnChallenge {
    pub challenge_id: String,
    pub challenge: String,
    pub rp_name: String,
    pub rp_id: String,
    pub user_id: String,
    pub user_name: String,
    pub user_display_name: String,
}

/// WebAuthn registration completion
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WebAuthnRegisterRequest {
    pub challenge_id: String,
    pub credential_id: String,
    pub public_key: String,
    pub sign_count: u32,
}

/// WebAuthn authentication
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WebAuthnAuthRequest {
    pub credential_id: String,
    pub authenticator_data: String,
    pub client_data_json: String,
    pub signature: String,
}
