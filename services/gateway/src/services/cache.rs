use redis::{AsyncCommands, RedisError, aio::ConnectionManager};
use serde::{Serialize, de::DeserializeOwned};
use std::time::Duration;

#[derive(Clone)]
#[allow(dead_code)]
pub struct CacheService {
    connection: ConnectionManager,
}

#[allow(dead_code)]
impl CacheService {
    /// Initialize cache service with Redis connection
    pub async fn new(redis_url: &str) -> Result<Self, RedisError> {
        let client = redis::Client::open(redis_url)?;
        let connection = ConnectionManager::new(client).await?;
        Ok(Self { connection })
    }

    /// Get a value from cache
    pub async fn get<T: DeserializeOwned>(&self, key: &str) -> Result<Option<T>, CacheError> {
        let mut conn = self.connection.clone();
        let value: Option<String> = conn.get(key).await?;

        match value {
            Some(v) => {
                let parsed = serde_json::from_str(&v)?;
                Ok(Some(parsed))
            }
            None => Ok(None),
        }
    }

    /// Set a value in cache with TTL
    pub async fn set<T: Serialize>(
        &self,
        key: &str,
        value: &T,
        ttl: Duration,
    ) -> Result<(), CacheError> {
        let mut conn = self.connection.clone();
        let serialized = serde_json::to_string(value)?;
        let _: () = conn.set_ex(key, serialized, ttl.as_secs() as u64).await?;
        Ok(())
    }

    /// Delete a value from cache
    pub async fn delete(&self, key: &str) -> Result<(), CacheError> {
        let mut conn = self.connection.clone();
        let _: i64 = conn.del(key).await?;
        Ok(())
    }

    /// Check if key exists
    pub async fn exists(&self, key: &str) -> Result<bool, CacheError> {
        let mut conn = self.connection.clone();
        let exists: bool = conn.exists(key).await?;
        Ok(exists)
    }

    /// Increment a counter
    pub async fn increment(&self, key: &str, amount: i64) -> Result<i64, CacheError> {
        let mut conn = self.connection.clone();
        let new_value: i64 = conn.incr(key, amount).await?;
        Ok(new_value)
    }

    /// Set expiration on an existing key
    pub async fn expire(&self, key: &str, ttl: Duration) -> Result<bool, CacheError> {
        let mut conn = self.connection.clone();
        let seconds = ttl.as_secs() as i64;
        let result: bool = redis::cmd("EXPIRE")
            .arg(key)
            .arg(seconds)
            .query_async(&mut conn)
            .await?;
        Ok(result)
    }

    /// Get multiple values
    pub async fn mget<T: DeserializeOwned>(
        &self,
        keys: &[String],
    ) -> Result<Vec<Option<T>>, CacheError> {
        let mut conn = self.connection.clone();
        
        let mut results = Vec::new();
        for key in keys {
            let value: Option<String> = conn.get(key).await?;
            match value {
                Some(v) => {
                    let parsed = serde_json::from_str(&v)?;
                    results.push(Some(parsed));
                }
                None => results.push(None),
            }
        }
        Ok(results)
    }
}

#[derive(Debug, thiserror::Error)]
#[allow(dead_code)]
pub enum CacheError {
    #[error("Redis error: {0}")]
    Redis(#[from] RedisError),
    #[error("Serialization error: {0}")]
    Serialization(#[from] serde_json::Error),
}

// Common cache key patterns
#[allow(dead_code)]
pub mod keys {
    pub fn user_session(user_id: &str, session_id: &str) -> String {
        format!("session:{}:{}", user_id, session_id)
    }

    pub fn rate_limit(ip: &str) -> String {
        format!("ratelimit:{}", ip)
    }

    pub fn user_profile(user_id: &str) -> String {
        format!("user:profile:{}", user_id)
    }

    pub fn user_settings(user_id: &str) -> String {
        format!("user:settings:{}", user_id)
    }

    pub fn verification_code(email: &str) -> String {
        format!("verify:{}", email)
    }

    pub fn password_reset(token: &str) -> String {
        format!("password_reset:{}", token)
    }
}
