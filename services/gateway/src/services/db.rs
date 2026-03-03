//! Database service with SQLx streaming and modern patterns

use sqlx::{PgPool, postgres::PgRow};
use std::pin::Pin;
use futures::Stream;
use tracing::{info, instrument};
use uuid::Uuid;

use crate::models::User;

/// Database service with streaming support
#[derive(Clone)]
pub struct DatabaseService {
    pool: PgPool,
}

impl DatabaseService {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    /// Stream users efficiently for large datasets
    /// Uses SQLx 0.8.x streaming with TryStreamExt
    #[instrument(skip(self), level = "debug")]
    pub fn stream_users(
        &self,
        limit: i64,
    ) -> Pin<Box<dyn Stream<Item = Result<User, sqlx::Error>> + Send + '_>> {
        Box::pin(
            sqlx::query_as::<_, User>(
                "SELECT id, email, username, created_at, updated_at FROM users LIMIT $1"
            )
            .bind(limit)
            .fetch(&self.pool)
        )
    }

    /// Stream raw rows for custom processing
    #[instrument(skip(self), level = "debug")]
    pub fn stream_user_rows(
        &self,
    ) -> Pin<Box<dyn Stream<Item = Result<PgRow, sqlx::Error>> + Send + '_>> {
        Box::pin(
            sqlx::query("SELECT * FROM users ORDER BY created_at DESC")
                .fetch(&self.pool)
        )
    }

    /// Paginated query with keyset pagination (efficient for large tables)
    #[instrument(skip(self), level = "debug")]
    pub async fn get_users_paginated(
        &self,
        after_id: Option<Uuid>,
        page_size: i64,
    ) -> Result<Vec<User>, sqlx::Error> {
        let users = match after_id {
            Some(id) => {
                sqlx::query_as::<_, User>(
                    r#"
                    SELECT id, email, username, created_at, updated_at 
                    FROM users 
                    WHERE id > $1 
                    ORDER BY id 
                    LIMIT $2
                    "#
                )
                .bind(id)
                .bind(page_size)
                .fetch_all(&self.pool)
                .await?
            }
            None => {
                sqlx::query_as::<_, User>(
                    r#"
                    SELECT id, email, username, created_at, updated_at 
                    FROM users 
                    ORDER BY id 
                    LIMIT $1
                    "#
                )
                .bind(page_size)
                .fetch_all(&self.pool)
                .await?
            }
        };
        
        info!("Retrieved {} users (paginated)", users.len());
        Ok(users)
    }

    /// Batch operations with transaction
    #[instrument(skip(self), level = "debug")]
    pub async fn batch_update_user_status(
        &self,
        user_ids: &[Uuid],
        status: &str,
    ) -> Result<u64, sqlx::Error> {
        let mut tx = self.pool.begin().await?;
        
        let mut updated = 0;
        for id in user_ids {
            let result = sqlx::query("UPDATE users SET status = $1, updated_at = NOW() WHERE id = $2")
                .bind(status)
                .bind(id)
                .execute(&mut *tx)
                .await?;
            updated += result.rows_affected();
        }
        
        tx.commit().await?;
        info!("Batch updated {} users to status '{}'", updated, status);
        Ok(updated)
    }

    /// Query with JSON aggregation (PostgreSQL native)
    #[instrument(skip(self), level = "debug")]
    pub async fn get_users_with_stats_json(&self) -> Result<serde_json::Value, sqlx::Error> {
        let result = sqlx::query_scalar::<_, serde_json::Value>(
            r#"
            SELECT json_agg(
                json_build_object(
                    'id', u.id,
                    'email', u.email,
                    'username', u.username,
                    'stats', json_build_object(
                        'xp', COALESCE(ps.xp, 0),
                        'level', COALESCE(ps.level, 1),
                        'streak', COALESCE(ps.streak_days, 0)
                    )
                )
            )
            FROM users u
            LEFT JOIN player_stats ps ON u.id = ps.user_id
            "#
        )
        .fetch_one(&self.pool)
        .await?;
        
        Ok(result)
    }

    /// Efficient existence check
    #[instrument(skip(self), level = "debug")]
    pub async fn user_exists(&self, email: &str) -> Result<bool, sqlx::Error> {
        let exists: bool = sqlx::query_scalar("SELECT EXISTS(SELECT 1 FROM users WHERE email = $1)")
            .bind(email)
            .fetch_one(&self.pool)
            .await?;
        
        Ok(exists)
    }

}

/// Collect a stream of results into a vector with timeout
pub async fn collect_stream_with_timeout<T, S>(
    mut stream: S,
    timeout_secs: u64,
) -> Result<Vec<T>, Box<dyn std::error::Error + Send + Sync>>
where
    S: Stream<Item = Result<T, sqlx::Error>> + Send + Unpin,
    T: Send + 'static,
{
    use tokio::time::{timeout, Duration};
    use futures::StreamExt;
    
    let mut results = Vec::new();
    
    while let Some(row) = timeout(Duration::from_secs(timeout_secs), stream.next()).await
        .map_err(|e| Box::new(e) as Box<dyn std::error::Error + Send + Sync>)? 
    {
        results.push(row.map_err(|e| Box::new(e) as Box<dyn std::error::Error + Send + Sync>)?);
    }
    
    Ok(results)
}
