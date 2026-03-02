use chrono::{Duration, Utc};
use jsonwebtoken::{DecodingKey, EncodingKey, Header, Validation, decode, encode};
use shared_types::{TokenClaims, TokenType};
use std::sync::Arc;
use thiserror::Error;
use uuid::Uuid;

#[derive(Debug, Error)]
pub enum AuthError {
    #[error("Invalid token")]
    InvalidToken,
    #[error("Token expired")]
    TokenExpired,
    #[error("Token creation failed")]
    TokenCreation,
}

/// Authentication service for JWT handling
pub struct AuthService {
    jwt_secret: Arc<String>,
    jwt_expiration_hours: i64,
    refresh_token_expiration_days: i64,
}

impl AuthService {
    pub fn new(
        jwt_secret: String,
        jwt_expiration_hours: i64,
        refresh_token_expiration_days: i64,
    ) -> Self {
        Self {
            jwt_secret: Arc::new(jwt_secret),
            jwt_expiration_hours,
            refresh_token_expiration_days,
        }
    }

    /// Create a new access token
    pub fn create_access_token(
        &self,
        user_id: Uuid,
        device_id: String,
        permissions: Vec<String>,
    ) -> Result<(String, TokenClaims), AuthError> {
        let now = Utc::now();
        let exp = now + Duration::hours(self.jwt_expiration_hours);

        let claims = TokenClaims {
            sub: user_id.to_string(),
            jti: Uuid::new_v4().to_string(),
            iat: now.timestamp(),
            exp: exp.timestamp(),
            typ: TokenType::Access,
            device_id,
            permissions,
        };

        let token = encode(
            &Header::default(),
            &claims,
            &EncodingKey::from_secret(self.jwt_secret.as_bytes()),
        )
        .map_err(|_| AuthError::TokenCreation)?;

        Ok((token, claims))
    }

    /// Create a new refresh token
    pub fn create_refresh_token(
        &self,
        user_id: Uuid,
        device_id: String,
    ) -> Result<(String, TokenClaims), AuthError> {
        let now = Utc::now();
        let exp = now + Duration::days(self.refresh_token_expiration_days);

        let claims = TokenClaims {
            sub: user_id.to_string(),
            jti: Uuid::new_v4().to_string(),
            iat: now.timestamp(),
            exp: exp.timestamp(),
            typ: TokenType::Refresh,
            device_id,
            permissions: vec![],
        };

        let token = encode(
            &Header::default(),
            &claims,
            &EncodingKey::from_secret(self.jwt_secret.as_bytes()),
        )
        .map_err(|_| AuthError::TokenCreation)?;

        Ok((token, claims))
    }

    /// Validate a token
    pub fn validate_token(&self, token: &str) -> Result<TokenClaims, AuthError> {
        let validation = Validation::default();

        let token_data = decode::<TokenClaims>(
            token,
            &DecodingKey::from_secret(self.jwt_secret.as_bytes()),
            &validation,
        )
        .map_err(|e| match e.kind() {
            jsonwebtoken::errors::ErrorKind::ExpiredSignature => AuthError::TokenExpired,
            _ => AuthError::InvalidToken,
        })?;

        Ok(token_data.claims)
    }

    /// Refresh an access token using a refresh token
    pub fn refresh_access_token(
        &self,
        refresh_token: &str,
    ) -> Result<(String, String, TokenClaims), AuthError> {
        let claims = self.validate_token(refresh_token)?;

        if claims.typ != TokenType::Refresh {
            return Err(AuthError::InvalidToken);
        }

        let user_id = Uuid::parse_str(&claims.sub).map_err(|_| AuthError::InvalidToken)?;

        // Create new tokens
        let (access_token, access_claims) = self.create_access_token(
            user_id,
            claims.device_id.clone(),
            claims.permissions.clone(),
        )?;

        let (new_refresh_token, _) = self.create_refresh_token(user_id, claims.device_id)?;

        Ok((access_token, new_refresh_token, access_claims))
    }
}
