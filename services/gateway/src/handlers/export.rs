//! Data export API handlers

use actix_web::{HttpRequest, HttpResponse, web};
use chrono::{DateTime, Utc};
use serde::Deserialize;
use serde_json::json;
use sqlx::{PgPool, Row};
use uuid::Uuid;

use crate::handlers::auth::get_request_id;
use crate::services::AuthService;

/// Extract user ID from JWT token in request
fn extract_user_id(req: &HttpRequest, auth_service: &AuthService) -> Option<Uuid> {
    let token = req
        .headers()
        .get("authorization")
        .and_then(|h| h.to_str().ok())
        .and_then(|h| h.strip_prefix("Bearer "));

    token.and_then(|t| {
        auth_service
            .validate_token(t)
            .ok()
            .and_then(|claims| Uuid::parse_str(&claims.sub).ok())
    })
}

/// Export query parameters
#[derive(Debug, Deserialize)]
pub struct ExportQuery {
    pub start_date: Option<String>,
    pub end_date: Option<String>,
    pub format: Option<String>, // json, csv
}

/// Export all user data
pub async fn export_data(
    req: HttpRequest,
    pool: web::Data<PgPool>,
    auth_service: web::Data<AuthService>,
    query: web::Query<ExportQuery>,
) -> HttpResponse {
    let request_id = get_request_id(&req);

    let user_id = match extract_user_id(&req, &auth_service) {
        Some(id) => id,
        None => {
            return HttpResponse::Unauthorized().json(json!({
                "status": "error",
                "error": { "code": "UNAUTHORIZED", "message": "Authentication required" }
            }));
        }
    };

    // Parse date range
    let start_date = query
        .start_date
        .as_ref()
        .and_then(|d| DateTime::parse_from_rfc3339(&format!("{}T00:00:00Z", d)).ok())
        .map(|d| d.with_timezone(&Utc))
        .unwrap_or_else(|| Utc::now() - chrono::Duration::days(30));

    let end_date = query
        .end_date
        .as_ref()
        .and_then(|d| DateTime::parse_from_rfc3339(&format!("{}T23:59:59Z", d)).ok())
        .map(|d| d.with_timezone(&Utc))
        .unwrap_or_else(|| Utc::now());

    let format = query.format.as_deref().unwrap_or("json");

    // Gather all user data
    let export_data = match gather_user_data(&pool, user_id, start_date, end_date).await {
        Ok(data) => data,
        Err(e) => {
            tracing::error!("Failed to gather export data: {}", e);
            return HttpResponse::InternalServerError().json(json!({
                "status": "error",
                "error": { "code": "EXPORT_ERROR", "message": "Failed to gather data" }
            }));
        }
    };

    match format {
        "csv" => {
            // For CSV, we export workouts as a simple example
            let csv = generate_csv_export(&export_data);
            HttpResponse::Ok()
                .content_type("text/csv")
                .insert_header(("Content-Disposition", "attachment; filename=export.csv"))
                .body(csv)
        }
        _ => {
            // Default JSON format
            HttpResponse::Ok().json(json!({
                "status": "success",
                "data": {
                    "export": export_data,
                    "generated_at": Utc::now().to_rfc3339(),
                    "date_range": {
                        "start": start_date.to_rfc3339(),
                        "end": end_date.to_rfc3339()
                    }
                },
                "meta": { "request_id": request_id }
            }))
        }
    }
}

/// Gather all user data for export
async fn gather_user_data(
    pool: &PgPool,
    user_id: Uuid,
    start_date: DateTime<Utc>,
    end_date: DateTime<Utc>,
) -> Result<serde_json::Value, sqlx::Error> {
    // Get user info
    let user = sqlx::query("SELECT id, email, username, created_at FROM users WHERE id = $1")
        .bind(user_id)
        .fetch_one(pool)
        .await?;

    // Get gamification stats
    let stats = sqlx::query(
        "SELECT xp_total, level, streak_days FROM gamification_stats WHERE user_id = $1",
    )
    .bind(user_id)
    .fetch_optional(pool)
    .await?;

    // Get workouts
    let workouts = sqlx::query(
        "SELECT id, workout_name, duration_minutes, total_volume_kg, notes, created_at 
         FROM workouts WHERE user_id = $1 AND created_at BETWEEN $2 AND $3 ORDER BY created_at",
    )
    .bind(user_id)
    .bind(start_date)
    .bind(end_date)
    .fetch_all(pool)
    .await?;

    // Get coding sessions
    let coding = sqlx::query(
        "SELECT id, project_name, duration_minutes, commits_made, notes, created_at 
         FROM coding_sessions WHERE user_id = $1 AND created_at BETWEEN $2 AND $3 ORDER BY created_at"
    )
    .bind(user_id)
    .bind(start_date)
    .bind(end_date)
    .fetch_all(pool)
    .await?;

    // Get German sessions
    let german = sqlx::query(
        "SELECT id, session_type, duration_minutes, anki_cards_reviewed, anki_time_seconds, notes, created_at 
         FROM german_sessions WHERE user_id = $1 AND created_at BETWEEN $2 AND $3 ORDER BY created_at"
    )
    .bind(user_id)
    .bind(start_date)
    .bind(end_date)
    .fetch_all(pool)
    .await?;

    // Get daily protocol
    let protocol = sqlx::query(
        "SELECT id, protocol_date, protocol_score, german_completed, gym_completed, coding_completed, notes 
         FROM daily_protocol WHERE user_id = $1 AND protocol_date BETWEEN $2::date AND $3::date ORDER BY protocol_date"
    )
    .bind(user_id)
    .bind(start_date)
    .bind(end_date)
    .fetch_all(pool)
    .await?;

    // Get finance entries
    let finance = sqlx::query(
        "SELECT id, category, amount, entry_type, description, entry_date 
         FROM finance_entries WHERE user_id = $1 AND entry_date BETWEEN $2::date AND $3::date ORDER BY entry_date"
    )
    .bind(user_id)
    .bind(start_date)
    .bind(end_date)
    .fetch_all(pool)
    .await?;

    // Build export JSON
    Ok(json!({
        "user": {
            "id": user.try_get::<Uuid, _>("id")?.to_string(),
            "email": user.try_get::<String, _>("email")?,
            "username": user.try_get::<String, _>("username")?,
            "member_since": user.try_get::<DateTime<Utc>, _>("created_at").ok().map(|d| d.to_rfc3339()),
        },
        "stats": stats.map(|s| json!({
            "xp": s.try_get::<i64, _>("xp_total").unwrap_or(0),
            "level": s.try_get::<i32, _>("level").unwrap_or(1),
            "streak_days": s.try_get::<i32, _>("streak_days").unwrap_or(0),
        })).unwrap_or(json!({})),
        "workouts": workouts.iter().map(|w| json!({
            "id": w.try_get::<Uuid, _>("id").unwrap_or_default().to_string(),
            "name": w.try_get::<String, _>("workout_name").unwrap_or_default(),
            "duration_minutes": w.try_get::<i32, _>("duration_minutes").unwrap_or(0),
            "volume_kg": w.try_get::<Option<f64>, _>("total_volume_kg").unwrap_or(None),
            "notes": w.try_get::<Option<String>, _>("notes").unwrap_or(None),
            "date": w.try_get::<DateTime<Utc>, _>("created_at").ok().map(|d| d.to_rfc3339()),
        })).collect::<Vec<_>>(),
        "coding_sessions": coding.iter().map(|c| json!({
            "id": c.try_get::<Uuid, _>("id").unwrap_or_default().to_string(),
            "project": c.try_get::<String, _>("project_name").unwrap_or_default(),
            "duration_minutes": c.try_get::<i32, _>("duration_minutes").unwrap_or(0),
            "commits": c.try_get::<Option<i32>, _>("commits_made").unwrap_or(None),
            "notes": c.try_get::<Option<String>, _>("notes").unwrap_or(None),
            "date": c.try_get::<DateTime<Utc>, _>("created_at").ok().map(|d| d.to_rfc3339()),
        })).collect::<Vec<_>>(),
        "german_sessions": german.iter().map(|g| json!({
            "id": g.try_get::<Uuid, _>("id").unwrap_or_default().to_string(),
            "type": g.try_get::<String, _>("session_type").unwrap_or_default(),
            "duration_minutes": g.try_get::<i32, _>("duration_minutes").unwrap_or(0),
            "anki_cards": g.try_get::<Option<i32>, _>("anki_cards_reviewed").unwrap_or(None),
            "anki_time_seconds": g.try_get::<Option<i32>, _>("anki_time_seconds").unwrap_or(None),
            "notes": g.try_get::<Option<String>, _>("notes").unwrap_or(None),
            "date": g.try_get::<DateTime<Utc>, _>("created_at").ok().map(|d| d.to_rfc3339()),
        })).collect::<Vec<_>>(),
        "protocol_entries": protocol.iter().map(|p| json!({
            "id": p.try_get::<Uuid, _>("id").unwrap_or_default().to_string(),
            "date": p.try_get::<chrono::NaiveDate, _>("protocol_date").ok().map(|d| d.to_string()),
            "score": p.try_get::<i32, _>("protocol_score").unwrap_or(0),
            "german_completed": p.try_get::<bool, _>("german_completed").unwrap_or(false),
            "gym_completed": p.try_get::<bool, _>("gym_completed").unwrap_or(false),
            "coding_completed": p.try_get::<bool, _>("coding_completed").unwrap_or(false),
            "notes": p.try_get::<Option<String>, _>("notes").unwrap_or(None),
        })).collect::<Vec<_>>(),
        "finance_entries": finance.iter().map(|f| json!({
            "id": f.try_get::<Uuid, _>("id").unwrap_or_default().to_string(),
            "category": f.try_get::<String, _>("category").unwrap_or_default(),
            "amount": f.try_get::<f64, _>("amount").unwrap_or(0.0),
            "type": f.try_get::<String, _>("entry_type").unwrap_or_default(),
            "description": f.try_get::<String, _>("description").unwrap_or_default(),
            "date": f.try_get::<chrono::NaiveDate, _>("entry_date").ok().map(|d| d.to_string()),
        })).collect::<Vec<_>>(),
    }))
}

/// Generate CSV export for workouts
fn generate_csv_export(data: &serde_json::Value) -> String {
    let mut csv = String::from("Date,Type,Name,Duration,Notes\n");

    if let Some(workouts) = data["workouts"].as_array() {
        for workout in workouts {
            let date = workout["date"].as_str().unwrap_or("");
            let name = workout["name"].as_str().unwrap_or("");
            let duration = workout["duration_minutes"].as_i64().unwrap_or(0);
            let notes = workout["notes"].as_str().unwrap_or("").replace('"', "\"\"");

            csv.push_str(&format!(
                "\"{}\",\"Workout\",\"{}\",{},\"{}\"\n",
                date, name, duration, notes
            ));
        }
    }

    if let Some(coding) = data["coding_sessions"].as_array() {
        for session in coding {
            let date = session["date"].as_str().unwrap_or("");
            let project = session["project"].as_str().unwrap_or("");
            let duration = session["duration_minutes"].as_i64().unwrap_or(0);
            let notes = session["notes"].as_str().unwrap_or("").replace('"', "\"\"");

            csv.push_str(&format!(
                "\"{}\",\"Coding\",\"{}\",{},\"{}\"\n",
                date, project, duration, notes
            ));
        }
    }

    if let Some(german) = data["german_sessions"].as_array() {
        for session in german {
            let date = session["date"].as_str().unwrap_or("");
            let session_type = session["type"].as_str().unwrap_or("");
            let duration = session["duration_minutes"].as_i64().unwrap_or(0);

            csv.push_str(&format!(
                "\"{}\",\"German\",\"{}\",{},\"\"\n",
                date, session_type, duration
            ));
        }
    }

    csv
}

/// Get available export formats
pub async fn get_export_formats(req: HttpRequest) -> HttpResponse {
    let request_id = get_request_id(&req);

    HttpResponse::Ok().json(json!({
        "status": "success",
        "data": {
            "formats": [
                { "id": "json", "name": "JSON", "description": "Complete data in JSON format" },
                { "id": "csv", "name": "CSV", "description": "Simplified data for spreadsheets" }
            ]
        },
        "meta": { "request_id": request_id }
    }))
}
