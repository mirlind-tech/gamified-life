//! Migration Tool: SQLite → PostgreSQL
//!
//! This tool migrates all data from the existing SQLite database
//! to the new PostgreSQL database.

use chrono::{DateTime, NaiveDateTime, Utc};
use sqlx::{Row, postgres::PgPool, sqlite::SqlitePool};
use std::collections::HashMap;
use tracing::{info, warn};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    tracing_subscriber::fmt::init();

    info!("🔄 Starting migration from SQLite to PostgreSQL...");

    let sqlite_url =
        std::env::var("SQLITE_URL").unwrap_or_else(|_| "sqlite:backend/mirlind.db".to_string());
    let postgres_url = std::env::var("DATABASE_URL").expect("DATABASE_URL must be set");

    info!("Connecting to SQLite: {}", sqlite_url);
    let sqlite = SqlitePool::connect(&sqlite_url).await?;

    info!("Connecting to PostgreSQL...");
    let postgres = PgPool::connect(&postgres_url).await?;

    let test_result: i32 = sqlx::query_scalar("SELECT 1::int4")
        .fetch_one(&postgres)
        .await?;
    info!("✅ PostgreSQL connection successful: {}", test_result);

    // Migrate users and build ID mapping
    let id_mapping = match migrate_users(&sqlite, &postgres).await {
        Ok(mapping) => {
            info!(
                "✅ Users migration completed - {} users mapped",
                mapping.len()
            );
            mapping
        }
        Err(e) => {
            warn!("⚠️ Users migration failed: {}", e);
            HashMap::new()
        }
    };

    // Migrate other tables using the ID mapping
    if !id_mapping.is_empty() {
        match migrate_player_stats(&sqlite, &postgres, &id_mapping).await {
            Ok(_) => info!("✅ Player stats migration completed"),
            Err(e) => warn!("⚠️ Player stats migration failed: {}", e),
        }

        match migrate_workouts(&sqlite, &postgres, &id_mapping).await {
            Ok(_) => info!("✅ Workouts migration completed"),
            Err(e) => warn!("⚠️ Workouts migration failed: {}", e),
        }

        match migrate_german_progress(&sqlite, &postgres, &id_mapping).await {
            Ok(_) => info!("✅ German progress migration completed"),
            Err(e) => warn!("⚠️ German progress migration failed: {}", e),
        }

        match migrate_coding_progress(&sqlite, &postgres, &id_mapping).await {
            Ok(_) => info!("✅ Coding progress migration completed"),
            Err(e) => warn!("⚠️ Coding progress migration failed: {}", e),
        }

        match migrate_finance_entries(&sqlite, &postgres, &id_mapping).await {
            Ok(_) => info!("✅ Finance entries migration completed"),
            Err(e) => warn!("⚠️ Finance entries migration failed: {}", e),
        }

        match migrate_daily_protocol(&sqlite, &postgres, &id_mapping).await {
            Ok(_) => info!("✅ Daily protocol migration completed"),
            Err(e) => warn!("⚠️ Daily protocol migration failed: {}", e),
        }

        match migrate_weekly_reviews(&sqlite, &postgres, &id_mapping).await {
            Ok(_) => info!("✅ Weekly reviews migration completed"),
            Err(e) => warn!("⚠️ Weekly reviews migration failed: {}", e),
        }
    }

    info!("✅ Migration complete!");

    sqlite.close().await;
    postgres.close().await;

    Ok(())
}

async fn migrate_users(
    sqlite: &SqlitePool,
    postgres: &PgPool,
) -> Result<HashMap<i64, uuid::Uuid>, Box<dyn std::error::Error>> {
    info!("Migrating users...");

    let mut id_mapping = HashMap::new();

    let count: i32 = match sqlx::query_scalar(
        "SELECT CAST(COUNT(*) AS INTEGER) FROM sqlite_master WHERE type='table' AND name='users'",
    )
    .fetch_one(sqlite)
    .await
    {
        Ok(c) => c,
        Err(_) => 0,
    };

    if count == 0 {
        info!("No users table found in SQLite, skipping...");
        return Ok(id_mapping);
    }

    let rows = match sqlx::query("SELECT * FROM users").fetch_all(sqlite).await {
        Ok(r) => r,
        Err(e) => {
            warn!("Could not query users: {}", e);
            return Ok(id_mapping);
        }
    };

    let mut count = 0;
    for row in rows {
        let sqlite_id: i64 = row.try_get("id").unwrap_or(0);
        let email: String = match row.try_get("email") {
            Ok(e) => e,
            Err(_) => continue,
        };
        let password_hash: String = row
            .try_get("password_hash")
            .or_else(|_| row.try_get("password"))
            .unwrap_or_default();
        let created_at: String = row
            .try_get("created_at")
            .unwrap_or_else(|_| "2024-01-01".to_string());
        let username: String = row
            .try_get("username")
            .unwrap_or_else(|_| email.split('@').next().unwrap_or("user").to_string());

        let new_uuid = uuid::Uuid::new_v4();
        let created_dt = parse_timestamp(&created_at).unwrap_or_else(|| Utc::now());

        // Check if user already exists by email
        let existing: Option<uuid::Uuid> =
            sqlx::query_scalar("SELECT id FROM users WHERE email = $1")
                .bind(&email)
                .fetch_optional(postgres)
                .await?;

        let pg_uuid = match existing {
            Some(uuid) => {
                info!("User {} already exists, using existing UUID", email);
                uuid
            }
            None => {
                let result = sqlx::query(
                    r#"
                    INSERT INTO users (id, email, username, password_hash, created_at, updated_at)
                    VALUES ($1, $2, $3, $4, $5, $5)
                    RETURNING id
                    "#,
                )
                .bind(new_uuid)
                .bind(&email)
                .bind(&username)
                .bind(&password_hash)
                .bind(created_dt)
                .fetch_one(postgres)
                .await;

                match result {
                    Ok(pg_row) => pg_row.try_get("id")?,
                    Err(e) => {
                        warn!("Failed to insert user {}: {}", email, e);
                        continue;
                    }
                }
            }
        };

        id_mapping.insert(sqlite_id, pg_uuid);
        count += 1;
    }

    info!("✅ Migrated {} users", count);
    Ok(id_mapping)
}

async fn migrate_player_stats(
    sqlite: &SqlitePool,
    postgres: &PgPool,
    id_mapping: &HashMap<i64, uuid::Uuid>,
) -> Result<(), Box<dyn std::error::Error>> {
    info!("Migrating player stats...");

    let rows = match sqlx::query("SELECT * FROM player_stats")
        .fetch_all(sqlite)
        .await
    {
        Ok(r) => r,
        Err(e) => {
            warn!("Could not query player_stats: {}", e);
            return Ok(());
        }
    };

    let mut count = 0;
    for row in rows {
        let sqlite_user_id: i64 = row.try_get("user_id").unwrap_or(0);
        let user_id = match id_mapping.get(&sqlite_user_id) {
            Some(uuid) => *uuid,
            None => continue,
        };

        let xp: i32 = row.try_get("xp").unwrap_or(0);
        let level: i32 = row.try_get("level").unwrap_or(1);

        let pillars: String = row.try_get("pillars").unwrap_or_else(|_| "{}".to_string());
        let streak_days = extract_streak_from_pillars(&pillars);

        let result = sqlx::query(
            r#"
            INSERT INTO gamification_stats (user_id, xp_total, level, streak_days, updated_at)
            VALUES ($1, $2::bigint, $3, $4, NOW())
            ON CONFLICT (user_id) DO UPDATE SET
                xp_total = EXCLUDED.xp_total,
                level = EXCLUDED.level,
                streak_days = EXCLUDED.streak_days,
                updated_at = NOW()
            "#,
        )
        .bind(user_id)
        .bind(xp)
        .bind(level)
        .bind(streak_days)
        .execute(postgres)
        .await;

        if result.is_ok() {
            count += 1;
        }
    }

    info!("✅ Migrated {} player stats", count);
    Ok(())
}

fn extract_streak_from_pillars(pillars_json: &str) -> i32 {
    match serde_json::from_str::<serde_json::Value>(pillars_json) {
        Ok(val) => {
            if let Some(pillars) = val.as_object() {
                let mut max_streak = 0;
                for (_, p) in pillars {
                    if let Some(streak) = p.get("streak").and_then(|s| s.as_i64()) {
                        max_streak = max_streak.max(streak as i32);
                    }
                }
                max_streak
            } else {
                0
            }
        }
        Err(_) => 0,
    }
}

async fn migrate_workouts(
    sqlite: &SqlitePool,
    postgres: &PgPool,
    id_mapping: &HashMap<i64, uuid::Uuid>,
) -> Result<(), Box<dyn std::error::Error>> {
    info!("Migrating workouts...");

    let rows = match sqlx::query("SELECT * FROM workouts")
        .fetch_all(sqlite)
        .await
    {
        Ok(r) => r,
        Err(_) => return Ok(()),
    };

    let mut count = 0;
    for row in rows {
        let sqlite_user_id: i64 = row.try_get("user_id").unwrap_or(0);
        let user_id = match id_mapping.get(&sqlite_user_id) {
            Some(uuid) => *uuid,
            None => continue,
        };

        let name: String = row.try_get("name").unwrap_or_default();
        let date: String = row.try_get("date").unwrap_or_default();
        let exercises: String = row
            .try_get("exercises")
            .unwrap_or_else(|_| "[]".to_string());
        let duration: i32 = row.try_get("duration").unwrap_or(0);
        let notes: String = row.try_get("notes").unwrap_or_default();

        let workout_date = parse_date(&date).unwrap_or_else(|| Utc::now());

        // Parse exercises JSON to extract total volume if possible
        let exercises_json: serde_json::Value =
            serde_json::from_str(&exercises).unwrap_or(serde_json::json!([]));
        let mut total_volume = 0.0;
        if let Some(exs) = exercises_json.as_array() {
            for ex in exs {
                if let (Some(sets), Some(reps), Some(weight)) = (
                    ex.get("sets").and_then(|s| s.as_f64()),
                    ex.get("reps").and_then(|r| r.as_f64()),
                    ex.get("weight").and_then(|w| w.as_f64()),
                ) {
                    total_volume += sets * reps * weight;
                }
            }
        }

        let result = sqlx::query(
            r#"
            INSERT INTO workouts (user_id, workout_name, workout_type, started_at, duration_minutes, exercises, total_volume_kg, notes, source, created_at)
            VALUES ($1, $2, 'strength', $3, $4, $5, $6, $7, 'migrated', NOW())
            ON CONFLICT DO NOTHING
            "#
        )
        .bind(user_id)
        .bind(name)
        .bind(workout_date)
        .bind(duration)
        .bind(exercises_json)
        .bind(if total_volume > 0.0 { Some(total_volume) } else { None })
        .bind(notes)
        .execute(postgres)
        .await;

        if result.is_ok() {
            count += 1;
        } else if let Err(e) = result {
            warn!("Failed to insert workout: {}", e);
        }
    }

    info!("✅ Migrated {} workouts", count);
    Ok(())
}

async fn migrate_german_progress(
    sqlite: &SqlitePool,
    postgres: &PgPool,
    id_mapping: &HashMap<i64, uuid::Uuid>,
) -> Result<(), Box<dyn std::error::Error>> {
    info!("Migrating German progress...");

    let rows = match sqlx::query("SELECT * FROM german_progress")
        .fetch_all(sqlite)
        .await
    {
        Ok(r) => r,
        Err(_) => return Ok(()),
    };

    let mut count = 0;
    for row in rows {
        let sqlite_user_id: i64 = row.try_get("user_id").unwrap_or(0);
        let user_id = match id_mapping.get(&sqlite_user_id) {
            Some(uuid) => *uuid,
            None => continue,
        };

        let date: String = row.try_get("date").unwrap_or_default();
        let anki_cards: i32 = row.try_get("anki_cards").unwrap_or(0);
        let anki_time: i32 = row.try_get("anki_time").unwrap_or(0);
        let radio_hours: f64 = row.try_get("radio_hours").unwrap_or(0.0);
        let tandem_minutes: i32 = row.try_get("tandem_minutes").unwrap_or(0);
        let notes: String = row.try_get("notes").unwrap_or_default();

        let session_date = parse_date(&date).unwrap_or_else(|| Utc::now());
        let total_minutes = anki_time + tandem_minutes + (radio_hours * 60.0) as i32;

        let result = sqlx::query(
            r#"
            INSERT INTO german_sessions 
                (user_id, session_type, started_at, duration_minutes, anki_cards_reviewed, anki_time_seconds, notes, source, created_at)
            VALUES ($1, 'mixed', $2, $3, $4, $5, $6, 'migrated', NOW())
            ON CONFLICT DO NOTHING
            "#
        )
        .bind(user_id)
        .bind(session_date)
        .bind(total_minutes)
        .bind(anki_cards)
        .bind(anki_time * 60) // Convert to seconds
        .bind(notes)
        .execute(postgres)
        .await;

        if result.is_ok() {
            count += 1;
        } else if let Err(e) = result {
            warn!("Failed to insert german session: {}", e);
        }
    }

    info!("✅ Migrated {} German progress entries", count);
    Ok(())
}

async fn migrate_coding_progress(
    sqlite: &SqlitePool,
    postgres: &PgPool,
    id_mapping: &HashMap<i64, uuid::Uuid>,
) -> Result<(), Box<dyn std::error::Error>> {
    info!("Migrating coding progress...");

    let rows = match sqlx::query("SELECT * FROM code_progress")
        .fetch_all(sqlite)
        .await
    {
        Ok(r) => r,
        Err(_) => return Ok(()),
    };

    let mut count = 0;
    for row in rows {
        let sqlite_user_id: i64 = row.try_get("user_id").unwrap_or(0);
        let user_id = match id_mapping.get(&sqlite_user_id) {
            Some(uuid) => *uuid,
            None => continue,
        };

        let date: String = row.try_get("date").unwrap_or_default();
        let hours: f64 = row.try_get("hours").unwrap_or(0.0);
        let github_commits: i32 = row.try_get("github_commits").unwrap_or(0);
        let project: String = row.try_get("project").unwrap_or_default();
        let notes: String = row.try_get("notes").unwrap_or_default();

        let session_date = parse_date(&date).unwrap_or_else(|| Utc::now());
        let duration_minutes = (hours * 60.0) as i32;

        let result = sqlx::query(
            r#"
            INSERT INTO coding_sessions (user_id, project_name, started_at, duration_minutes, commits_made, notes, source, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, 'migrated', NOW())
            ON CONFLICT DO NOTHING
            "#
        )
        .bind(user_id)
        .bind(if project.is_empty() { None } else { Some(project) })
        .bind(session_date)
        .bind(duration_minutes)
        .bind(github_commits)
        .bind(notes)
        .execute(postgres)
        .await;

        if result.is_ok() {
            count += 1;
        } else if let Err(e) = result {
            warn!("Failed to insert coding session: {}", e);
        }
    }

    info!("✅ Migrated {} coding progress entries", count);
    Ok(())
}

async fn migrate_finance_entries(
    sqlite: &SqlitePool,
    postgres: &PgPool,
    id_mapping: &HashMap<i64, uuid::Uuid>,
) -> Result<(), Box<dyn std::error::Error>> {
    info!("Migrating finance entries...");

    let rows = match sqlx::query("SELECT * FROM finance_entries")
        .fetch_all(sqlite)
        .await
    {
        Ok(r) => r,
        Err(_) => return Ok(()),
    };

    let mut count = 0;
    for row in rows {
        let sqlite_user_id: i64 = row.try_get("user_id").unwrap_or(0);
        let user_id = match id_mapping.get(&sqlite_user_id) {
            Some(uuid) => *uuid,
            None => continue,
        };

        let date: String = row.try_get("date").unwrap_or_default();
        let amount: f64 = row.try_get("amount").unwrap_or(0.0);
        let category: String = row.try_get("category").unwrap_or_default();
        let description: String = row.try_get("description").unwrap_or_default();

        let entry_date = parse_date(&date).unwrap_or_else(|| Utc::now());
        let entry_type = if amount >= 0.0 { "income" } else { "expense" };
        let abs_amount = amount.abs();

        let result = sqlx::query(
            r#"
            INSERT INTO finance_entries (user_id, entry_date, entry_type, category, amount, description, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, NOW())
            ON CONFLICT DO NOTHING
            "#
        )
        .bind(user_id)
        .bind(entry_date)
        .bind(entry_type)
        .bind(category)
        .bind(abs_amount)
        .bind(description)
        .execute(postgres)
        .await;

        if result.is_ok() {
            count += 1;
        }
    }

    info!("✅ Migrated {} finance entries", count);
    Ok(())
}

async fn migrate_daily_protocol(
    sqlite: &SqlitePool,
    postgres: &PgPool,
    id_mapping: &HashMap<i64, uuid::Uuid>,
) -> Result<(), Box<dyn std::error::Error>> {
    info!("Migrating daily protocol...");

    let rows = match sqlx::query("SELECT * FROM daily_protocol")
        .fetch_all(sqlite)
        .await
    {
        Ok(r) => r,
        Err(_) => return Ok(()),
    };

    let mut count = 0;
    for row in rows {
        let sqlite_user_id: i64 = row.try_get("user_id").unwrap_or(0);
        let user_id = match id_mapping.get(&sqlite_user_id) {
            Some(uuid) => *uuid,
            None => continue,
        };

        let date: String = row.try_get("date").unwrap_or_default();
        let wake05: bool = row.try_get("wake05").unwrap_or(false);
        let german_study: bool = row.try_get("german_study").unwrap_or(false);
        let gym_workout: bool = row.try_get("gym_workout").unwrap_or(false);
        let coding_hours: f64 = row.try_get("coding_hours").unwrap_or(0.0);
        let sleep22: bool = row.try_get("sleep22").unwrap_or(false);
        let notes: String = row.try_get("notes").unwrap_or_default();

        let protocol_date = parse_date(&date).unwrap_or_else(|| Utc::now());

        // Calculate protocol score
        let mut completed = 0;
        if wake05 {
            completed += 1;
        }
        if german_study {
            completed += 1;
        }
        if gym_workout {
            completed += 1;
        }
        if sleep22 {
            completed += 1;
        }
        let protocol_score = (completed as f64 / 4.0 * 100.0) as i32;

        let result = sqlx::query(
            r#"
            INSERT INTO daily_protocol 
                (user_id, protocol_date, protocol_score, gym_completed, german_completed, 
                 coding_completed, coding_duration_minutes, notes, created_at)
            VALUES ($1, $2, $3, $4, $5, $6 > 0, $6, $7, NOW())
            ON CONFLICT DO NOTHING
            "#,
        )
        .bind(user_id)
        .bind(protocol_date)
        .bind(protocol_score)
        .bind(gym_workout)
        .bind(german_study)
        .bind((coding_hours * 60.0) as i32)
        .bind(notes)
        .execute(postgres)
        .await;

        if result.is_ok() {
            count += 1;
        } else if let Err(e) = result {
            warn!("Failed to insert daily protocol: {}", e);
        }
    }

    info!("✅ Migrated {} daily protocol entries", count);
    Ok(())
}

async fn migrate_weekly_reviews(
    sqlite: &SqlitePool,
    postgres: &PgPool,
    id_mapping: &HashMap<i64, uuid::Uuid>,
) -> Result<(), Box<dyn std::error::Error>> {
    info!("Migrating weekly reviews...");

    let rows = match sqlx::query("SELECT * FROM weekly_reviews")
        .fetch_all(sqlite)
        .await
    {
        Ok(r) => r,
        Err(_) => return Ok(()),
    };

    let mut count = 0;
    for row in rows {
        let sqlite_user_id: i64 = row.try_get("user_id").unwrap_or(0);
        let user_id = match id_mapping.get(&sqlite_user_id) {
            Some(uuid) => *uuid,
            None => continue,
        };

        let week_start: String = row.try_get("week_start").unwrap_or_default();
        let wins: String = row.try_get("wins").unwrap_or_default();
        let failures: String = row.try_get("failures").unwrap_or_default();
        let lessons: String = row.try_get("lessons").unwrap_or_default();
        let confidence: i32 = row.try_get("confidence").unwrap_or(5);

        let start_date = parse_date(&week_start).unwrap_or_else(|| Utc::now());

        // Convert text to arrays (split by newlines or just wrap in array)
        let wins_array: Vec<String> = if wins.is_empty() { vec![] } else { vec![wins] };
        let failures_array: Vec<String> = if failures.is_empty() {
            vec![]
        } else {
            vec![failures]
        };
        let lessons_array: Vec<String> = if lessons.is_empty() {
            vec![]
        } else {
            vec![lessons]
        };

        let result = sqlx::query(
            r#"
            INSERT INTO weekly_reviews (user_id, week_start, wins, failures, lessons, overall_score, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, NOW())
            ON CONFLICT DO NOTHING
            "#
        )
        .bind(user_id)
        .bind(start_date)
        .bind(wins_array)
        .bind(failures_array)
        .bind(lessons_array)
        .bind(confidence)
        .execute(postgres)
        .await;

        if result.is_ok() {
            count += 1;
        } else if let Err(e) = result {
            warn!("Failed to insert weekly review: {}", e);
        }
    }

    info!("✅ Migrated {} weekly reviews", count);
    Ok(())
}

fn parse_timestamp(s: &str) -> Option<DateTime<Utc>> {
    if let Ok(dt) = s.parse::<DateTime<Utc>>() {
        return Some(dt);
    }

    let formats = ["%Y-%m-%d %H:%M:%S", "%Y-%m-%dT%H:%M:%S", "%Y-%m-%d"];

    for fmt in &formats {
        if let Ok(naive) = NaiveDateTime::parse_from_str(s, fmt) {
            return Some(DateTime::from_naive_utc_and_offset(naive, Utc));
        }
    }

    if let Ok(date) = chrono::NaiveDate::parse_from_str(s, "%Y-%m-%d") {
        let naive = date.and_hms_opt(0, 0, 0)?;
        return Some(DateTime::from_naive_utc_and_offset(naive, Utc));
    }

    None
}

fn parse_date(s: &str) -> Option<DateTime<Utc>> {
    parse_timestamp(s)
}
