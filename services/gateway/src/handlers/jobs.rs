//! Job Hunt Tracker API handlers

use actix_web::{HttpRequest, HttpResponse, web};
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

/// Create/update job application
#[derive(Debug, Deserialize)]
pub struct JobApplicationRequest {
    pub company_name: String,
    pub job_title: String,
    pub job_description: Option<String>,
    pub location: Option<String>,
    pub salary_range: Option<String>,
    pub status: String,
    pub applied_at: Option<String>, // YYYY-MM-DD
    pub source: Option<String>,
    pub url: Option<String>,
    pub contact_name: Option<String>,
    pub contact_email: Option<String>,
    pub notes: Option<String>,
    pub priority: Option<i32>,
}

/// Create job application
pub async fn create_job(
    req: HttpRequest,
    body: web::Json<JobApplicationRequest>,
    pool: web::Data<PgPool>,
    auth_service: web::Data<AuthService>,
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

    let JobApplicationRequest {
        company_name,
        job_title,
        job_description: _job_description,
        location,
        salary_range,
        status,
        applied_at,
        source: _source,
        url,
        contact_name,
        contact_email: _contact_email,
        notes,
        priority: _priority,
    } = body.into_inner();

    let applied_at = applied_at
        .as_ref()
        .and_then(|d| chrono::NaiveDate::parse_from_str(d, "%Y-%m-%d").ok());

    let result = sqlx::query_scalar::<_, uuid::Uuid>(
        r#"
        INSERT INTO job_applications 
            (user_id, company_name, position_title, location, salary_range, 
             status, applied_at, job_url, contact_person, notes)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING id
        "#,
    )
    .bind(user_id)
    .bind(&company_name)
    .bind(&job_title)
    .bind(&location)
    .bind(&salary_range)
    .bind(&status)
    .bind(applied_at)
    .bind(&url)
    .bind(&contact_name)
    .bind(&notes)
    .fetch_one(pool.get_ref())
    .await;

    match result {
        Ok(id) => HttpResponse::Created().json(json!({
            "status": "success",
            "data": {
                "id": id.to_string(),
                "message": "Job application created"
            },
            "meta": { "request_id": request_id }
        })),
        Err(e) => {
            tracing::error!("Failed to create job: {}", e);
            HttpResponse::InternalServerError().json(json!({
                "status": "error",
                "error": { "code": "DB_ERROR", "message": "Failed to create job application" },
                "meta": { "request_id": request_id }
            }))
        }
    }
}

/// Get all job applications
pub async fn get_jobs(
    req: HttpRequest,
    pool: web::Data<PgPool>,
    auth_service: web::Data<AuthService>,
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

    // Get optional status filter
    let status_filter = req
        .query_string()
        .split('&')
        .find(|p| p.starts_with("status="))
        .and_then(|p| p.split('=').nth(1));

    let jobs = if let Some(status) = status_filter {
        sqlx::query(
            "SELECT * FROM job_applications WHERE user_id = $1 AND status = $2 ORDER BY created_at DESC"
        )
        .bind(user_id)
        .bind(status)
        .fetch_all(pool.get_ref())
        .await
    } else {
        sqlx::query("SELECT * FROM job_applications WHERE user_id = $1 ORDER BY created_at DESC")
            .bind(user_id)
            .fetch_all(pool.get_ref())
            .await
    };

    match jobs {
        Ok(rows) => {
            let jobs: Vec<_> = rows.iter().map(|row| job_row_to_json(row)).collect();

            HttpResponse::Ok().json(json!({
                "status": "success",
                "data": { "jobs": jobs },
                "meta": { "request_id": request_id }
            }))
        }
        Err(e) => {
            tracing::error!("Failed to fetch jobs: {}", e);
            HttpResponse::InternalServerError().json(json!({
                "status": "error",
                "error": { "code": "DB_ERROR", "message": "Failed to fetch jobs" },
                "meta": { "request_id": request_id }
            }))
        }
    }
}

/// Get single job application
pub async fn get_job(
    req: HttpRequest,
    path: web::Path<String>,
    pool: web::Data<PgPool>,
    auth_service: web::Data<AuthService>,
) -> HttpResponse {
    let request_id = get_request_id(&req);
    let job_id = path.into_inner();

    let user_id = match extract_user_id(&req, &auth_service) {
        Some(id) => id,
        None => {
            return HttpResponse::Unauthorized().json(json!({
                "status": "error",
                "error": { "code": "UNAUTHORIZED", "message": "Authentication required" }
            }));
        }
    };

    let job = sqlx::query("SELECT * FROM job_applications WHERE id = $1 AND user_id = $2")
        .bind(&job_id)
        .bind(user_id)
        .fetch_optional(pool.get_ref())
        .await;

    match job {
        Ok(Some(row)) => HttpResponse::Ok().json(json!({
            "status": "success",
            "data": { "job": job_row_to_json(&row) },
            "meta": { "request_id": request_id }
        })),
        Ok(None) => HttpResponse::NotFound().json(json!({
            "status": "error",
            "error": { "code": "NOT_FOUND", "message": "Job application not found" },
            "meta": { "request_id": request_id }
        })),
        Err(e) => {
            tracing::error!("Failed to fetch job: {}", e);
            HttpResponse::InternalServerError().json(json!({
                "status": "error",
                "error": { "code": "DB_ERROR", "message": "Failed to fetch job" },
                "meta": { "request_id": request_id }
            }))
        }
    }
}

/// Update job application
pub async fn update_job(
    req: HttpRequest,
    path: web::Path<String>,
    body: web::Json<JobApplicationRequest>,
    pool: web::Data<PgPool>,
    auth_service: web::Data<AuthService>,
) -> HttpResponse {
    let request_id = get_request_id(&req);
    let job_id = path.into_inner();

    let user_id = match extract_user_id(&req, &auth_service) {
        Some(id) => id,
        None => {
            return HttpResponse::Unauthorized().json(json!({
                "status": "error",
                "error": { "code": "UNAUTHORIZED", "message": "Authentication required" }
            }));
        }
    };

    let JobApplicationRequest {
        company_name,
        job_title,
        job_description: _job_description,
        location,
        salary_range,
        status,
        applied_at,
        source: _source,
        url,
        contact_name,
        contact_email: _contact_email,
        notes,
        priority: _priority,
    } = body.into_inner();

    let applied_at = applied_at
        .as_ref()
        .and_then(|d| chrono::NaiveDate::parse_from_str(d, "%Y-%m-%d").ok());

    let result = sqlx::query(
        r#"
        UPDATE job_applications SET
            company_name = $1, position_title = $2, location = $3,
            salary_range = $4, status = $5, applied_at = $6, job_url = $7,
            contact_person = $8, notes = $9, updated_at = NOW()
        WHERE id = $10 AND user_id = $11
        "#,
    )
    .bind(&company_name)
    .bind(&job_title)
    .bind(&location)
    .bind(&salary_range)
    .bind(&status)
    .bind(applied_at)
    .bind(&url)
    .bind(&contact_name)
    .bind(&notes)
    .bind(&job_id)
    .bind(user_id)
    .execute(pool.get_ref())
    .await;

    match result {
        Ok(res) if res.rows_affected() > 0 => HttpResponse::Ok().json(json!({
            "status": "success",
            "data": { "message": "Job application updated" },
            "meta": { "request_id": request_id }
        })),
        Ok(_) => HttpResponse::NotFound().json(json!({
            "status": "error",
            "error": { "code": "NOT_FOUND", "message": "Job application not found" },
            "meta": { "request_id": request_id }
        })),
        Err(e) => {
            tracing::error!("Failed to update job: {}", e);
            HttpResponse::InternalServerError().json(json!({
                "status": "error",
                "error": { "code": "DB_ERROR", "message": "Failed to update job" },
                "meta": { "request_id": request_id }
            }))
        }
    }
}

/// Delete job application
pub async fn delete_job(
    req: HttpRequest,
    path: web::Path<String>,
    pool: web::Data<PgPool>,
    auth_service: web::Data<AuthService>,
) -> HttpResponse {
    let request_id = get_request_id(&req);
    let job_id = path.into_inner();

    let user_id = match extract_user_id(&req, &auth_service) {
        Some(id) => id,
        None => {
            return HttpResponse::Unauthorized().json(json!({
                "status": "error",
                "error": { "code": "UNAUTHORIZED", "message": "Authentication required" }
            }));
        }
    };

    let result = sqlx::query("DELETE FROM job_applications WHERE id = $1 AND user_id = $2")
        .bind(&job_id)
        .bind(user_id)
        .execute(pool.get_ref())
        .await;

    match result {
        Ok(res) if res.rows_affected() > 0 => HttpResponse::Ok().json(json!({
            "status": "success",
            "data": { "message": "Job application deleted" },
            "meta": { "request_id": request_id }
        })),
        _ => HttpResponse::NotFound().json(json!({
            "status": "error",
            "error": { "code": "NOT_FOUND", "message": "Job application not found" },
            "meta": { "request_id": request_id }
        })),
    }
}

/// Get job pipeline stats
pub async fn get_job_stats(
    req: HttpRequest,
    pool: web::Data<PgPool>,
    auth_service: web::Data<AuthService>,
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

    // Get counts by status
    let counts: Vec<(String, i64)> = sqlx::query_as(
        "SELECT status, COUNT(*) FROM job_applications WHERE user_id = $1 GROUP BY status",
    )
    .bind(user_id)
    .fetch_all(pool.get_ref())
    .await
    .unwrap_or_default();

    let mut pipeline = json!({
        "saved": 0, "applied": 0, "interview": 0,
        "offer": 0, "rejected": 0, "withdrawn": 0
    });

    for (status, count) in counts {
        if let Some(obj) = pipeline.as_object_mut() {
            obj.insert(status, json!(count));
        }
    }

    // Get total applied
    let total_applied: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM job_applications WHERE user_id = $1 AND status != 'saved'",
    )
    .bind(user_id)
    .fetch_one(pool.get_ref())
    .await
    .unwrap_or(0);

    // Get total interviews
    let total_interviews: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM job_interviews WHERE application_id IN (
            SELECT id FROM job_applications WHERE user_id = $1
        )",
    )
    .bind(user_id)
    .fetch_one(pool.get_ref())
    .await
    .unwrap_or(0);

    // Get goals
    let goals = sqlx::query(
        "SELECT target_applications, target_interviews, deadline_date FROM job_hunt_goals WHERE user_id = $1"
    )
    .bind(user_id)
    .fetch_optional(pool.get_ref())
    .await;

    let (target_apps, target_interviews, deadline) = match goals {
        Ok(Some(row)) => (
            row.try_get::<i32, _>("target_applications").unwrap_or(60),
            row.try_get::<i32, _>("target_interviews").unwrap_or(8),
            row.try_get::<chrono::NaiveDate, _>("deadline_date").ok(),
        ),
        _ => (60, 8, None),
    };

    // Calculate pace
    let days_remaining = deadline
        .map(|d| {
            d.signed_duration_since(chrono::Local::now().date_naive())
                .num_days()
        })
        .unwrap_or(180);

    let apps_needed = target_apps - total_applied as i32;
    let interviews_needed = target_interviews - total_interviews as i32;

    let daily_pace = if days_remaining > 0 {
        apps_needed as f64 / days_remaining as f64
    } else {
        0.0
    };

    let weekly_pace = daily_pace * 7.0;

    HttpResponse::Ok().json(json!({
        "status": "success",
        "data": {
            "pipeline": pipeline,
            "totals": {
                "total_applied": total_applied,
                "total_interviews": total_interviews,
                "target_applications": target_apps,
                "target_interviews": target_interviews
            },
            "pace": {
                "daily_applications_needed": round_to_2(daily_pace),
                "weekly_applications_needed": round_to_2(weekly_pace),
                "days_remaining": days_remaining,
                "applications_remaining": apps_needed.max(0),
                "interviews_remaining": interviews_needed.max(0)
            },
            "deadline": deadline.map(|d| d.to_string())
        },
        "meta": { "request_id": request_id }
    }))
}

/// Set job hunt goals
#[derive(Debug, Deserialize)]
pub struct JobGoalsRequest {
    pub target_applications: i32,
    pub target_interviews: i32,
    pub deadline_date: String, // YYYY-MM-DD
}

pub async fn set_goals(
    req: HttpRequest,
    body: web::Json<JobGoalsRequest>,
    pool: web::Data<PgPool>,
    auth_service: web::Data<AuthService>,
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

    let deadline = match chrono::NaiveDate::parse_from_str(&body.deadline_date, "%Y-%m-%d") {
        Ok(d) => d,
        Err(_) => {
            return HttpResponse::BadRequest().json(json!({
                "status": "error",
                "error": { "code": "INVALID_DATE", "message": "Invalid date format" },
                "meta": { "request_id": request_id }
            }));
        }
    };

    let result = sqlx::query(
        r#"
        INSERT INTO job_hunt_goals (user_id, target_applications, target_interviews, deadline_date)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (user_id) DO UPDATE 
        SET target_applications = $2, target_interviews = $3, deadline_date = $4
        "#,
    )
    .bind(user_id)
    .bind(body.target_applications)
    .bind(body.target_interviews)
    .bind(deadline)
    .execute(pool.get_ref())
    .await;

    match result {
        Ok(_) => HttpResponse::Ok().json(json!({
            "status": "success",
            "data": {
                "target_applications": body.target_applications,
                "target_interviews": body.target_interviews,
                "deadline_date": body.deadline_date,
                "message": "Goals updated"
            },
            "meta": { "request_id": request_id }
        })),
        Err(e) => {
            tracing::error!("Failed to set goals: {}", e);
            HttpResponse::InternalServerError().json(json!({
                "status": "error",
                "error": { "code": "DB_ERROR", "message": "Failed to set goals" },
                "meta": { "request_id": request_id }
            }))
        }
    }
}

/// Helper function to convert job row to JSON
fn job_row_to_json(row: &sqlx::postgres::PgRow) -> serde_json::Value {
    json!({
        "id": row.try_get::<uuid::Uuid, _>("id").unwrap_or_default().to_string(),
        "company_name": row.try_get::<String, _>("company_name").unwrap_or_default(),
        "job_title": row.try_get::<String, _>("position_title").unwrap_or_default(),
        "location": row.try_get::<Option<String>, _>("location").unwrap_or(None),
        "salary_range": row.try_get::<Option<String>, _>("salary_range").unwrap_or(None),
        "status": row.try_get::<String, _>("status").unwrap_or_default(),
        "applied_at": row.try_get::<Option<chrono::DateTime<chrono::Utc>>, _>("applied_at").ok().flatten().map(|d| d.to_rfc3339()),
        "url": row.try_get::<Option<String>, _>("job_url").unwrap_or(None),
        "contact_name": row.try_get::<Option<String>, _>("contact_person").unwrap_or(None),
        "notes": row.try_get::<Option<String>, _>("notes").unwrap_or(None),
        "created_at": row.try_get::<chrono::DateTime<chrono::Utc>, _>("created_at").ok().map(|d| d.to_rfc3339()),
        "updated_at": row.try_get::<chrono::DateTime<chrono::Utc>, _>("updated_at").ok().map(|d| d.to_rfc3339())
    })
}

fn round_to_2(num: f64) -> f64 {
    (num * 100.0).round() / 100.0
}
