use sqlx::{PgPool, Postgres, Transaction};
use std::sync::Arc;

/// Database service wrapping PostgreSQL connection pool
#[derive(Debug, Clone)]
#[allow(dead_code)]
pub struct DatabaseService {
    pool: Arc<PgPool>,
}

#[allow(dead_code)]
impl DatabaseService {
    /// Create new database service
    pub async fn new(database_url: &str) -> Result<Self, sqlx::Error> {
        let pool = PgPool::connect(database_url).await?;

        // Verify connection
        sqlx::query("SELECT 1").fetch_one(&pool).await?;

        Ok(Self {
            pool: Arc::new(pool),
        })
    }

    /// Get a reference to the pool
    pub fn pool(&self) -> &PgPool {
        &self.pool
    }

    /// Begin a transaction
    pub async fn begin_transaction(&self) -> Result<Transaction<'static, Postgres>, sqlx::Error> {
        self.pool.begin().await
    }

    /// Run migrations (placeholder - actual migrations should be run separately)
    pub async fn migrate(&self) -> Result<(), sqlx::Error> {
        // In production, use sqlx migrate
        // sqlx::migrate!("./migrations").run(&self.pool).await?;
        Ok(())
    }
}

#[derive(Debug, thiserror::Error)]
#[allow(dead_code)]
pub enum DatabaseError {
    #[error("Database error: {0}")]
    Sqlx(#[from] sqlx::Error),
    #[error("Record not found")]
    NotFound,
    #[error("Duplicate record")]
    Duplicate,
}
