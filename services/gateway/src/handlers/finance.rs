//! Finance API handlers

use actix_web::{HttpRequest, HttpResponse, web};
use serde::Deserialize;
use serde_json::{Value, json};
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

/// Query params for finance endpoints
#[derive(Debug, Deserialize)]
pub struct DateRangeQuery {
    pub start_date: Option<String>,
    pub end_date: Option<String>,
}

#[derive(Debug, Clone)]
struct FinanceProfileRecord {
    monthly_income: f64,
    monthly_fixed_costs: f64,
    food_budget: f64,
    discretionary_budget: f64,
    savings_goal_amount: f64,
    savings_goal_target_date: String,
    current_savings: f64,
    monthly_savings_target: f64,
    fixed_costs_breakdown: Value,
    updated_at: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpsertFinanceProfileRequest {
    pub monthly_income: Option<f64>,
    pub monthly_fixed_costs: Option<f64>,
    pub food_budget: Option<f64>,
    pub discretionary_budget: Option<f64>,
    pub savings_goal_amount: Option<f64>,
    pub savings_goal_target_date: Option<String>,
    pub current_savings: Option<f64>,
    pub monthly_savings_target: Option<f64>,
    pub fixed_costs_breakdown: Option<Value>,
}

fn default_fixed_costs_breakdown() -> Value {
    json!({
        "rent": 620,
        "phone_internet": 70,
        "gym": 32,
        "laptop_insurance": 5,
        "ai_subscription": 20,
        "kosovo_apartment": 700
    })
}

fn default_finance_profile() -> FinanceProfileRecord {
    FinanceProfileRecord {
        monthly_income: 2000.0,
        monthly_fixed_costs: 1447.0,
        food_budget: 320.0,
        discretionary_budget: 0.0,
        savings_goal_amount: 6000.0,
        savings_goal_target_date: "2027-08-31".to_string(),
        current_savings: 1400.0,
        monthly_savings_target: 233.0,
        fixed_costs_breakdown: default_fixed_costs_breakdown(),
        updated_at: None,
    }
}

fn parse_fixed_costs_breakdown(value: Option<String>) -> Value {
    value
        .and_then(|text| serde_json::from_str::<Value>(&text).ok())
        .filter(|parsed| parsed.is_object())
        .unwrap_or_else(default_fixed_costs_breakdown)
}

fn profile_to_json(profile: &FinanceProfileRecord) -> Value {
    json!({
        "monthly_income": profile.monthly_income,
        "monthly_fixed_costs": profile.monthly_fixed_costs,
        "food_budget": profile.food_budget,
        "discretionary_budget": profile.discretionary_budget,
        "savings_goal_amount": profile.savings_goal_amount,
        "savings_goal_target_date": profile.savings_goal_target_date,
        "current_savings": profile.current_savings,
        "monthly_savings_target": profile.monthly_savings_target,
        "fixed_costs_breakdown": profile.fixed_costs_breakdown,
        "updated_at": profile.updated_at
    })
}

async fn load_finance_profile(
    pool: &PgPool,
    user_id: Uuid,
) -> Result<Option<FinanceProfileRecord>, sqlx::Error> {
    let row = sqlx::query(
        r#"
        SELECT
            monthly_income::float8 AS monthly_income,
            monthly_fixed_costs::float8 AS monthly_fixed_costs,
            food_budget::float8 AS food_budget,
            discretionary_budget::float8 AS discretionary_budget,
            savings_goal_amount::float8 AS savings_goal_amount,
            savings_goal_target_date::text AS savings_goal_target_date,
            current_savings::float8 AS current_savings,
            monthly_savings_target::float8 AS monthly_savings_target,
            fixed_costs_breakdown::text AS fixed_costs_breakdown,
            updated_at::text AS updated_at
        FROM finance_profiles
        WHERE user_id = $1
        LIMIT 1
        "#,
    )
    .bind(user_id)
    .fetch_optional(pool)
    .await?;

    Ok(row.map(|row| {
        let defaults = default_finance_profile();

        FinanceProfileRecord {
            monthly_income: row
                .try_get::<Option<f64>, _>("monthly_income")
                .ok()
                .flatten()
                .unwrap_or(defaults.monthly_income),
            monthly_fixed_costs: row
                .try_get::<Option<f64>, _>("monthly_fixed_costs")
                .ok()
                .flatten()
                .unwrap_or(defaults.monthly_fixed_costs),
            food_budget: row
                .try_get::<Option<f64>, _>("food_budget")
                .ok()
                .flatten()
                .unwrap_or(defaults.food_budget),
            discretionary_budget: row
                .try_get::<Option<f64>, _>("discretionary_budget")
                .ok()
                .flatten()
                .unwrap_or(defaults.discretionary_budget),
            savings_goal_amount: row
                .try_get::<Option<f64>, _>("savings_goal_amount")
                .ok()
                .flatten()
                .unwrap_or(defaults.savings_goal_amount),
            savings_goal_target_date: row
                .try_get::<Option<String>, _>("savings_goal_target_date")
                .ok()
                .flatten()
                .unwrap_or(defaults.savings_goal_target_date),
            current_savings: row
                .try_get::<Option<f64>, _>("current_savings")
                .ok()
                .flatten()
                .unwrap_or(defaults.current_savings),
            monthly_savings_target: row
                .try_get::<Option<f64>, _>("monthly_savings_target")
                .ok()
                .flatten()
                .unwrap_or(defaults.monthly_savings_target),
            fixed_costs_breakdown: parse_fixed_costs_breakdown(
                row.try_get::<Option<String>, _>("fixed_costs_breakdown")
                    .ok()
                    .flatten(),
            ),
            updated_at: row
                .try_get::<Option<String>, _>("updated_at")
                .ok()
                .flatten(),
        }
    }))
}

/// Get finance profile used by the dashboard budget/savings views
pub async fn get_profile(
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

    let profile = match load_finance_profile(pool.get_ref(), user_id).await {
        Ok(Some(profile)) => profile,
        Ok(None) => default_finance_profile(),
        Err(error) => {
            tracing::warn!("Failed to load finance profile: {}", error);
            default_finance_profile()
        }
    };

    HttpResponse::Ok().json(json!({
        "status": "success",
        "data": { "profile": profile_to_json(&profile) },
        "meta": { "request_id": request_id }
    }))
}

/// Create or update finance profile settings
pub async fn upsert_profile(
    req: HttpRequest,
    body: web::Json<UpsertFinanceProfileRequest>,
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

    let existing = match load_finance_profile(pool.get_ref(), user_id).await {
        Ok(Some(profile)) => profile,
        Ok(None) => default_finance_profile(),
        Err(error) => {
            tracing::warn!("Failed to load finance profile for update: {}", error);
            default_finance_profile()
        }
    };

    let goal_target_date = body
        .savings_goal_target_date
        .clone()
        .unwrap_or_else(|| existing.savings_goal_target_date.clone());

    let parsed_target_date = match chrono::NaiveDate::parse_from_str(&goal_target_date, "%Y-%m-%d")
    {
        Ok(date) => date,
        Err(_) => {
            return HttpResponse::BadRequest().json(json!({
                "status": "error",
                "error": { "code": "INVALID_DATE", "message": "Invalid savings goal target date" },
                "meta": { "request_id": request_id }
            }));
        }
    };

    let profile = FinanceProfileRecord {
        monthly_income: body.monthly_income.unwrap_or(existing.monthly_income),
        monthly_fixed_costs: body
            .monthly_fixed_costs
            .unwrap_or(existing.monthly_fixed_costs),
        food_budget: body.food_budget.unwrap_or(existing.food_budget),
        discretionary_budget: body
            .discretionary_budget
            .unwrap_or(existing.discretionary_budget),
        savings_goal_amount: body
            .savings_goal_amount
            .unwrap_or(existing.savings_goal_amount),
        savings_goal_target_date: goal_target_date,
        current_savings: body.current_savings.unwrap_or(existing.current_savings),
        monthly_savings_target: body
            .monthly_savings_target
            .unwrap_or(existing.monthly_savings_target),
        fixed_costs_breakdown: body
            .fixed_costs_breakdown
            .clone()
            .filter(|value| value.is_object())
            .unwrap_or(existing.fixed_costs_breakdown),
        updated_at: None,
    };

    let result = sqlx::query(
        r#"
        INSERT INTO finance_profiles (
            user_id,
            monthly_income,
            monthly_fixed_costs,
            food_budget,
            discretionary_budget,
            savings_goal_amount,
            savings_goal_target_date,
            current_savings,
            monthly_savings_target,
            fixed_costs_breakdown
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb)
        ON CONFLICT (user_id) DO UPDATE SET
            monthly_income = EXCLUDED.monthly_income,
            monthly_fixed_costs = EXCLUDED.monthly_fixed_costs,
            food_budget = EXCLUDED.food_budget,
            discretionary_budget = EXCLUDED.discretionary_budget,
            savings_goal_amount = EXCLUDED.savings_goal_amount,
            savings_goal_target_date = EXCLUDED.savings_goal_target_date,
            current_savings = EXCLUDED.current_savings,
            monthly_savings_target = EXCLUDED.monthly_savings_target,
            fixed_costs_breakdown = EXCLUDED.fixed_costs_breakdown,
            updated_at = NOW()
        RETURNING updated_at::text AS updated_at
        "#,
    )
    .bind(user_id)
    .bind(profile.monthly_income)
    .bind(profile.monthly_fixed_costs)
    .bind(profile.food_budget)
    .bind(profile.discretionary_budget)
    .bind(profile.savings_goal_amount)
    .bind(parsed_target_date)
    .bind(profile.current_savings)
    .bind(profile.monthly_savings_target)
    .bind(profile.fixed_costs_breakdown.to_string())
    .fetch_one(pool.get_ref())
    .await;

    match result {
        Ok(row) => {
            let response_profile = FinanceProfileRecord {
                updated_at: row
                    .try_get::<Option<String>, _>("updated_at")
                    .ok()
                    .flatten(),
                ..profile
            };

            HttpResponse::Ok().json(json!({
                "status": "success",
                "data": { "profile": profile_to_json(&response_profile) },
                "meta": { "request_id": request_id }
            }))
        }
        Err(error) => {
            tracing::error!("Failed to upsert finance profile: {}", error);
            HttpResponse::InternalServerError().json(json!({
                "status": "error",
                "error": { "code": "DB_ERROR", "message": "Failed to save finance profile" },
                "meta": { "request_id": request_id }
            }))
        }
    }
}

/// Get finance entries
pub async fn get_finance(
    req: HttpRequest,
    query: web::Query<DateRangeQuery>,
    pool: web::Data<PgPool>,
    auth_service: web::Data<AuthService>,
) -> HttpResponse {
    let request_id = get_request_id(&req);
    let DateRangeQuery {
        start_date: _start_date,
        end_date: _end_date,
    } = query.into_inner();

    let user_id = match extract_user_id(&req, &auth_service) {
        Some(id) => id,
        None => {
            return HttpResponse::Unauthorized().json(json!({
                "status": "error",
                "error": { "code": "UNAUTHORIZED", "message": "Authentication required" }
            }));
        }
    };

    let entries = sqlx::query(
        r#"
        SELECT 
            id, 
            COALESCE(category, 'other') as category, 
            COALESCE(amount, 0)::float8 as amount, 
            COALESCE(entry_type, 'expense') as entry_type, 
            COALESCE(description, '') as description, 
            COALESCE(entry_date::text, CURRENT_DATE::text) as entry_date
        FROM finance_entries
        WHERE user_id = $1
        ORDER BY entry_date DESC, created_at DESC
        LIMIT 100
        "#,
    )
    .bind(user_id)
    .fetch_all(pool.get_ref())
    .await;

    match entries {
        Ok(rows) => {
            let entries: Vec<_> = rows
                .iter()
                .map(|row| {
                    let id: uuid::Uuid = row.try_get("id").unwrap_or_else(|_| uuid::Uuid::nil());
                    let category: String = row.try_get("category").unwrap_or_default();
                    let amount: f64 = row.try_get("amount").unwrap_or(0.0);
                    let entry_type: String = row.try_get("entry_type").unwrap_or_default();
                    let description: String = row.try_get("description").unwrap_or_default();
                    let date: String = row.try_get("entry_date").unwrap_or_default();

                    json!({
                        "id": id.to_string(),
                        "category": category,
                        "amount": amount,
                        "type": entry_type,
                        "description": description,
                        "date": date
                    })
                })
                .collect();

            HttpResponse::Ok().json(json!({
                "status": "success",
                "data": { "entries": entries },
                "meta": { "request_id": request_id }
            }))
        }
        Err(e) => {
            tracing::warn!("Failed to get finance entries: {}", e);
            HttpResponse::Ok().json(json!({
                "status": "success",
                "data": { "entries": Vec::<serde_json::Value>::new() },
                "meta": { "request_id": request_id }
            }))
        }
    }
}

/// Get finance summary
pub async fn get_summary(
    req: HttpRequest,
    query: web::Query<DateRangeQuery>,
    pool: web::Data<PgPool>,
    auth_service: web::Data<AuthService>,
) -> HttpResponse {
    let request_id = get_request_id(&req);
    let DateRangeQuery {
        start_date: _start_date,
        end_date: _end_date,
    } = query.into_inner();

    let user_id = match extract_user_id(&req, &auth_service) {
        Some(id) => id,
        None => {
            return HttpResponse::Unauthorized().json(json!({
                "status": "error",
                "error": { "code": "UNAUTHORIZED", "message": "Authentication required" }
            }));
        }
    };

    // Calculate totals
    let totals = sqlx::query(
        r#"
        SELECT
            COALESCE(SUM(CASE WHEN entry_type = 'income' THEN amount ELSE 0 END), 0)::float8 AS income,
            COALESCE(SUM(CASE WHEN entry_type = 'expense' THEN amount ELSE 0 END), 0)::float8 AS expenses
        FROM finance_entries
        WHERE user_id = $1
        "#
    )
    .bind(user_id)
    .fetch_one(pool.get_ref())
    .await;

    let (total_income, total_expenses) = match totals {
        Ok(row) => {
            let income: f64 = row.try_get("income").unwrap_or(0.0);
            let expenses: f64 = row.try_get("expenses").unwrap_or(0.0);
            (income, expenses)
        }
        Err(e) => {
            tracing::warn!("Failed to calculate finance summary: {}", e);
            (0.0, 0.0)
        }
    };

    HttpResponse::Ok().json(json!({
        "status": "success",
        "data": {
            "summary": {
                "income": total_income,
                "expenses": total_expenses,
                "balance": total_income - total_expenses,
                "savings_rate": if total_income > 0.0 { (total_income - total_expenses) / total_income } else { 0.0 }
            }
        },
        "meta": { "request_id": request_id }
    }))
}

/// Create finance entry (income or expense)
#[derive(Debug, Deserialize)]
pub struct CreateFinanceRequest {
    pub amount: f64,
    pub category: String,
    #[serde(default)]
    pub entry_type: String, // "income" or "expense"
    pub description: Option<String>,
    pub date: String,
}

pub async fn create_finance_entry(
    req: HttpRequest,
    body: web::Json<CreateFinanceRequest>,
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

    // Validate amount
    if body.amount <= 0.0 {
        return HttpResponse::BadRequest().json(json!({
            "status": "error",
            "error": { "code": "INVALID_AMOUNT", "message": "Amount must be greater than 0" },
            "meta": { "request_id": request_id }
        }));
    }

    // Validate date
    let entry_date = match chrono::NaiveDate::parse_from_str(&body.date, "%Y-%m-%d") {
        Ok(d) => d,
        Err(_) => {
            return HttpResponse::BadRequest().json(json!({
                "status": "error",
                "error": { "code": "INVALID_DATE", "message": "Invalid date format" },
                "meta": { "request_id": request_id }
            }));
        }
    };

    // Default to "expense" if not specified
    let entry_type = if body.entry_type.is_empty() {
        "expense"
    } else {
        &body.entry_type
    };

    let result = sqlx::query_scalar::<_, uuid::Uuid>(
        r#"
        INSERT INTO finance_entries 
            (id, user_id, category, amount, entry_type, description, entry_date, created_at)
        VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, NOW())
        RETURNING id
        "#,
    )
    .bind(user_id)
    .bind(&body.category)
    .bind(body.amount)
    .bind(entry_type)
    .bind(body.description.clone().unwrap_or_default())
    .bind(entry_date)
    .fetch_one(pool.get_ref())
    .await;

    match result {
        Ok(id) => HttpResponse::Created().json(json!({
            "status": "success",
            "data": {
                "id": id.to_string(),
                "amount": body.amount,
                "category": body.category,
                "type": entry_type,
                "message": "Entry created successfully"
            },
            "meta": { "request_id": request_id }
        })),
        Err(e) => {
            tracing::error!("Failed to create finance entry: {}", e);
            HttpResponse::InternalServerError().json(json!({
                "status": "error",
                "error": { "code": "DB_ERROR", "message": "Failed to save entry" },
                "meta": { "request_id": request_id }
            }))
        }
    }
}

/// Get finance caps
#[derive(Debug, Deserialize)]
pub struct MonthQuery {
    pub month: Option<String>,
}

pub async fn get_caps(req: HttpRequest, query: web::Query<MonthQuery>) -> HttpResponse {
    let request_id = get_request_id(&req);
    let MonthQuery { month: _month } = query.into_inner();

    HttpResponse::Ok().json(json!({
        "status": "success",
        "data": { "caps": [] },
        "meta": { "request_id": request_id }
    }))
}
