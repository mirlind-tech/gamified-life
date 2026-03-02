//! Tech Stack Curriculum API handlers

use actix_web::{HttpRequest, HttpResponse, web};
use serde::Deserialize;
use serde_json::json;
use sqlx::{PgPool, Row};
use uuid::Uuid;

use crate::handlers::auth::get_request_id;
use crate::services::AuthService;

/// The 10 tech skills curriculum data
const CURRICULUM_DATA: &[TechSkillData] = &[
    TechSkillData {
        key: "javascript",
        name: "JavaScript",
        description: "Core language for web development",
        category: "frontend",
        estimated_hours: 30,
        icon: "⚡",
        color: "#F7DF1E",
        modules: &[
            ("fundamentals", "Variables & Types", 2, 1),
            ("operators", "Operators & Control Flow", 2, 1),
            ("functions", "Functions Basics", 3, 1),
            ("scope", "Scope & Closures", 4, 2),
            ("async", "Asynchronous JavaScript", 5, 2),
            ("dom", "DOM Manipulation", 4, 3),
            ("es6", "ES6+ Features", 3, 3),
            ("higher_order", "Higher-Order Functions", 3, 3),
        ],
    },
    TechSkillData {
        key: "typescript",
        name: "TypeScript",
        description: "Typed superset of JavaScript",
        category: "frontend",
        estimated_hours: 12,
        icon: "📘",
        color: "#3178C6",
        modules: &[
            ("types", "Basic Types", 3, 1),
            ("interfaces", "Interfaces & Types", 3, 1),
            ("generics", "Generics", 3, 2),
            ("config", "TS Config & Setup", 3, 2),
        ],
    },
    TechSkillData {
        key: "react",
        name: "React",
        description: "UI library for building interfaces",
        category: "frontend",
        estimated_hours: 25,
        icon: "⚛️",
        color: "#61DAFB",
        modules: &[
            ("jsx", "JSX & Components", 5, 1),
            ("hooks", "Hooks (useState, useEffect)", 5, 1),
            ("state", "State Management", 5, 2),
            ("router", "React Router", 5, 2),
            ("testing", "Testing React Apps", 5, 3),
        ],
    },
    TechSkillData {
        key: "nodejs",
        name: "Node.js",
        description: "JavaScript runtime for backend",
        category: "backend",
        estimated_hours: 20,
        icon: "🟢",
        color: "#339933",
        modules: &[
            ("basics", "Node Basics", 3, 1),
            ("express", "Express Framework", 4, 1),
            ("middleware", "Middleware & Auth", 4, 2),
            ("security", "Security Best Practices", 4, 2),
            ("async_node", "Async Patterns", 3, 3),
            ("streams", "Streams & Buffers", 2, 3),
        ],
    },
    TechSkillData {
        key: "postgresql",
        name: "PostgreSQL",
        description: "Relational database system",
        category: "database",
        estimated_hours: 15,
        icon: "🐘",
        color: "#336791",
        modules: &[
            ("schema", "Schema Design", 4, 1),
            ("queries", "SQL Queries", 4, 1),
            ("relations", "Relations & Joins", 4, 2),
            ("optimization", "Optimization", 3, 3),
        ],
    },
    TechSkillData {
        key: "git",
        name: "Git",
        description: "Version control system",
        category: "tools",
        estimated_hours: 10,
        icon: "🌿",
        color: "#F05032",
        modules: &[
            ("basics", "Git Basics", 2, 1),
            ("branching", "Branching & Merging", 3, 1),
            ("rebase", "Rebase & History", 3, 2),
            ("workflows", "Git Workflows", 2, 3),
        ],
    },
    TechSkillData {
        key: "docker",
        name: "Docker",
        description: "Containerization platform",
        category: "devops",
        estimated_hours: 12,
        icon: "🐳",
        color: "#2496ED",
        modules: &[
            ("containers", "Containers & Images", 4, 1),
            ("compose", "Docker Compose", 4, 2),
            ("volumes", "Volumes & Networks", 2, 2),
            ("deploy", "Deployment", 2, 3),
        ],
    },
    TechSkillData {
        key: "system_design",
        name: "System Design",
        description: "Designing scalable systems",
        category: "architecture",
        estimated_hours: 20,
        icon: "🏗️",
        color: "#FF6B6B",
        modules: &[
            ("architecture", "Architecture Patterns", 5, 1),
            ("scalability", "Scalability", 5, 2),
            ("microservices", "Microservices", 5, 2),
            ("patterns", "Design Patterns", 5, 3),
        ],
    },
    TechSkillData {
        key: "rust",
        name: "Rust",
        description: "Systems programming language",
        category: "languages",
        estimated_hours: 25,
        icon: "🦀",
        color: "#000000",
        modules: &[
            ("ownership", "Ownership & Borrowing", 8, 1),
            ("structs", "Structs & Enums", 5, 1),
            ("lifetimes", "Lifetimes", 5, 2),
            ("async_rust", "Async Rust", 7, 3),
        ],
    },
    TechSkillData {
        key: "python",
        name: "Python",
        description: "General-purpose programming",
        category: "languages",
        estimated_hours: 20,
        icon: "🐍",
        color: "#3776AB",
        modules: &[
            ("syntax", "Python Syntax", 4, 1),
            ("data_science", "Data Science Basics", 6, 2),
            ("django", "Django Framework", 6, 2),
            ("scripting", "Scripting & Automation", 4, 3),
        ],
    },
];

struct TechSkillData {
    key: &'static str,
    name: &'static str,
    description: &'static str,
    category: &'static str,
    estimated_hours: i32,
    icon: &'static str,
    color: &'static str,
    modules: &'static [(&'static str, &'static str, i32, i32)], // (key, title, hours, phase)
}

/// Extract user ID from JWT token
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

/// Initialize curriculum data in database
async fn init_curriculum_data(pool: &PgPool) -> Result<(), sqlx::Error> {
    for (skill_index, skill) in CURRICULUM_DATA.iter().enumerate() {
        // Keep the DB seed in sync with the in-code curriculum definition.
        let skill_id: Uuid = sqlx::query_scalar(
            r#"
            INSERT INTO tech_skills (
                skill_key,
                name,
                description,
                category,
                estimated_hours,
                icon,
                color,
                sort_order
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            ON CONFLICT (skill_key) DO UPDATE SET
                name = EXCLUDED.name,
                description = EXCLUDED.description,
                category = EXCLUDED.category,
                estimated_hours = EXCLUDED.estimated_hours,
                icon = EXCLUDED.icon,
                color = EXCLUDED.color,
                sort_order = EXCLUDED.sort_order
            RETURNING id
            "#,
        )
        .bind(skill.key)
        .bind(skill.name)
        .bind(skill.description)
        .bind(skill.category)
        .bind(skill.estimated_hours)
        .bind(skill.icon)
        .bind(skill.color)
        .bind(skill_index as i32)
        .fetch_one(pool)
        .await?;

        // Insert modules
        for (idx, (mod_key, title, hours, phase)) in skill.modules.iter().enumerate() {
            let _ = sqlx::query(
                r#"
                INSERT INTO tech_modules (skill_id, module_key, title, estimated_hours, phase, sort_order, topics)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                ON CONFLICT (skill_id, module_key) DO NOTHING
                "#
            )
            .bind(skill_id)
            .bind(mod_key)
            .bind(title)
            .bind(hours)
            .bind(phase)
            .bind(idx as i32)
            .bind(json!([format!("{} topic 1", title), format!("{} topic 2", title)]))
            .execute(pool)
            .await;
        }
    }
    Ok(())
}

/// Get all skills
pub async fn get_skills(
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

    // Initialize curriculum data
    if let Err(e) = init_curriculum_data(pool.get_ref()).await {
        tracing::warn!("Failed to init curriculum: {}", e);
    }

    // Initialize user progress
    let _ = init_user_progress(pool.get_ref(), user_id).await;

    // Get skills with user progress
    let skills = sqlx::query(
        r#"
        SELECT 
            ts.id, ts.skill_key, ts.name, ts.description, ts.category, 
            ts.estimated_hours, ts.icon, ts.color,
            COALESCE(us.overall_progress, 0) as progress,
            COALESCE(us.hours_total, 0) as hours_spent,
            COALESCE(us.status, 'not_started') as user_status
        FROM tech_skills ts
        LEFT JOIN user_skill_summary us ON us.skill_id = ts.id AND us.user_id = $1
        ORDER BY ts.sort_order
        "#,
    )
    .bind(user_id)
    .fetch_all(pool.get_ref())
    .await;

    match skills {
        Ok(rows) => {
            let skills: Vec<_> = rows
                .iter()
                .map(|row| {
                    json!({
                        "id": row.try_get::<uuid::Uuid, _>("id").unwrap_or_default().to_string(),
                        "key": row.try_get::<String, _>("skill_key").unwrap_or_default(),
                        "name": row.try_get::<String, _>("name").unwrap_or_default(),
                        "description": row.try_get::<String, _>("description").unwrap_or_default(),
                        "category": row.try_get::<String, _>("category").unwrap_or_default(),
                        "estimated_hours": row.try_get::<i32, _>("estimated_hours").unwrap_or(0),
                        "icon": row.try_get::<String, _>("icon").unwrap_or_default(),
                        "color": row.try_get::<String, _>("color").unwrap_or_default(),
                        "progress": row.try_get::<i32, _>("progress").unwrap_or(0),
                        "hours_spent": row.try_get::<i32, _>("hours_spent").unwrap_or(0),
                        "status": row.try_get::<String, _>("user_status").unwrap_or_default()
                    })
                })
                .collect();

            HttpResponse::Ok().json(json!({
                "status": "success",
                "data": { 
                    "skills": skills,
                    "total_hours": skills.iter().map(|s| s["estimated_hours"].as_i64().unwrap_or(0)).sum::<i64>(),
                    "completed_hours": skills.iter().map(|s| s["hours_spent"].as_i64().unwrap_or(0)).sum::<i64>()
                },
                "meta": { "request_id": request_id }
            }))
        }
        Err(e) => {
            tracing::error!("Failed to fetch skills: {}", e);
            HttpResponse::InternalServerError().json(json!({
                "status": "error",
                "error": { "code": "DB_ERROR", "message": "Failed to fetch skills" },
                "meta": { "request_id": request_id }
            }))
        }
    }
}

/// Get skill with modules
pub async fn get_skill_detail(
    req: HttpRequest,
    path: web::Path<String>,
    pool: web::Data<PgPool>,
    auth_service: web::Data<AuthService>,
) -> HttpResponse {
    let request_id = get_request_id(&req);
    let skill_key = path.into_inner();

    let user_id = match extract_user_id(&req, &auth_service) {
        Some(id) => id,
        None => {
            return HttpResponse::Unauthorized().json(json!({
                "status": "error",
                "error": { "code": "UNAUTHORIZED", "message": "Authentication required" }
            }));
        }
    };

    // Get skill
    let skill = sqlx::query(
        r#"
        SELECT ts.*, COALESCE(us.overall_progress, 0) as progress
        FROM tech_skills ts
        LEFT JOIN user_skill_summary us ON us.skill_id = ts.id AND us.user_id = $1
        WHERE ts.skill_key = $2
        "#,
    )
    .bind(user_id)
    .bind(&skill_key)
    .fetch_optional(pool.get_ref())
    .await;

    match skill {
        Ok(Some(row)) => {
            let skill_id: Uuid = row.try_get("id").unwrap_or_default();

            // Get modules with user progress
            let modules = sqlx::query(
                r#"
                SELECT 
                    tm.*,
                    COALESCE(utp.status, 'locked') as user_status,
                    COALESCE(utp.hours_spent, 0) as hours_spent,
                    utp.completed_at
                FROM tech_modules tm
                LEFT JOIN user_tech_progress utp ON utp.module_id = tm.id AND utp.user_id = $1
                WHERE tm.skill_id = $2
                ORDER BY tm.phase, tm.sort_order
                "#,
            )
            .bind(user_id)
            .bind(skill_id)
            .fetch_all(pool.get_ref())
            .await;

            let modules_json = match modules {
                Ok(mod_rows) => mod_rows.iter().map(|m| {
                    json!({
                        "id": m.try_get::<uuid::Uuid, _>("id").unwrap_or_default().to_string(),
                        "key": m.try_get::<String, _>("module_key").unwrap_or_default(),
                        "title": m.try_get::<String, _>("title").unwrap_or_default(),
                        "description": m.try_get::<String, _>("description").unwrap_or_default(),
                        "estimated_hours": m.try_get::<i32, _>("estimated_hours").unwrap_or(0),
                        "phase": m.try_get::<i32, _>("phase").unwrap_or(1),
                        "topics": m.try_get::<serde_json::Value, _>("topics").unwrap_or(json!([])),
                        "status": m.try_get::<String, _>("user_status").unwrap_or_default(),
                        "hours_spent": m.try_get::<i32, _>("hours_spent").unwrap_or(0),
                        "completed_at": m.try_get::<Option<chrono::DateTime<chrono::Utc>>, _>("completed_at").ok().flatten().map(|d| d.to_rfc3339())
                    })
                }).collect::<Vec<_>>(),
                Err(_) => vec![]
            };

            HttpResponse::Ok().json(json!({
                "status": "success",
                "data": {
                    "skill": {
                        "id": skill_id.to_string(),
                        "key": skill_key,
                        "name": row.try_get::<String, _>("name").unwrap_or_default(),
                        "description": row.try_get::<String, _>("description").unwrap_or_default(),
                        "category": row.try_get::<String, _>("category").unwrap_or_default(),
                        "estimated_hours": row.try_get::<i32, _>("estimated_hours").unwrap_or(0),
                        "icon": row.try_get::<String, _>("icon").unwrap_or_default(),
                        "color": row.try_get::<String, _>("color").unwrap_or_default(),
                        "progress": row.try_get::<i32, _>("progress").unwrap_or(0)
                    },
                    "modules": modules_json
                },
                "meta": { "request_id": request_id }
            }))
        }
        Ok(None) => HttpResponse::NotFound().json(json!({
            "status": "error",
            "error": { "code": "NOT_FOUND", "message": "Skill not found" },
            "meta": { "request_id": request_id }
        })),
        Err(e) => {
            tracing::error!("Failed to fetch skill: {}", e);
            HttpResponse::InternalServerError().json(json!({
                "status": "error",
                "error": { "code": "DB_ERROR", "message": "Failed to fetch skill" },
                "meta": { "request_id": request_id }
            }))
        }
    }
}

/// Update module progress
#[derive(Debug, Deserialize)]
pub struct UpdateProgressRequest {
    pub status: String, // locked, available, in_progress, completed
    pub hours_spent: Option<i32>,
    pub notes: Option<String>,
}

pub async fn update_module_progress(
    req: HttpRequest,
    path: web::Path<Uuid>,
    body: web::Json<UpdateProgressRequest>,
    pool: web::Data<PgPool>,
    auth_service: web::Data<AuthService>,
) -> HttpResponse {
    let request_id = get_request_id(&req);
    let module_id = path.into_inner();

    let user_id = match extract_user_id(&req, &auth_service) {
        Some(id) => id,
        None => {
            return HttpResponse::Unauthorized().json(json!({
                "status": "error",
                "error": { "code": "UNAUTHORIZED", "message": "Authentication required" }
            }));
        }
    };

    let completed_at = if body.status == "completed" {
        Some(chrono::Utc::now())
    } else {
        None
    };

    let result = sqlx::query(
        r#"
        INSERT INTO user_tech_progress (user_id, module_id, status, hours_spent, notes, completed_at)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (user_id, module_id) DO UPDATE 
        SET status = $3, hours_spent = $4, notes = $5, completed_at = COALESCE($6, user_tech_progress.completed_at)
        "#
    )
    .bind(user_id)
    .bind(&module_id)
    .bind(&body.status)
    .bind(body.hours_spent.unwrap_or(0))
    .bind(body.notes.as_ref().unwrap_or(&"".to_string()))
    .bind(completed_at)
    .execute(pool.get_ref())
    .await;

    match result {
        Ok(_) => {
            // Update skill summary
            let _ = update_skill_summary(pool.get_ref(), user_id, &module_id).await;

            HttpResponse::Ok().json(json!({
                "status": "success",
                "data": {
                    "module_id": module_id,
                    "status": body.status,
                    "message": "Progress updated"
                },
                "meta": { "request_id": request_id }
            }))
        }
        Err(e) => {
            tracing::error!("Failed to update progress: {}", e);
            HttpResponse::InternalServerError().json(json!({
                "status": "error",
                "error": { "code": "DB_ERROR", "message": "Failed to update progress" },
                "meta": { "request_id": request_id }
            }))
        }
    }
}

/// Initialize user progress for all modules
async fn init_user_progress(pool: &PgPool, user_id: Uuid) -> Result<(), sqlx::Error> {
    // Create progress entries for all modules
    sqlx::query(
        r#"
        INSERT INTO user_tech_progress (user_id, module_id, status)
        SELECT $1, tm.id, 'locked'
        FROM tech_modules tm
        WHERE NOT EXISTS (
            SELECT 1 FROM user_tech_progress utp 
            WHERE utp.user_id = $1 AND utp.module_id = tm.id
        )
        "#,
    )
    .bind(user_id)
    .execute(pool)
    .await?;

    // Unlock first modules of each skill
    sqlx::query(
        r#"
        UPDATE user_tech_progress utp
        SET status = 'available'
        FROM tech_modules tm
        JOIN tech_skills ts ON tm.skill_id = ts.id
        WHERE utp.module_id = tm.id
        AND utp.user_id = $1
        AND tm.sort_order = 0
        AND utp.status = 'locked'
        "#,
    )
    .bind(user_id)
    .execute(pool)
    .await?;

    // Create skill summaries
    sqlx::query(
        r#"
        INSERT INTO user_skill_summary (user_id, skill_id)
        SELECT $1, ts.id
        FROM tech_skills ts
        WHERE NOT EXISTS (
            SELECT 1 FROM user_skill_summary us 
            WHERE us.user_id = $1 AND us.skill_id = ts.id
        )
        "#,
    )
    .bind(user_id)
    .execute(pool)
    .await?;

    Ok(())
}

/// Update skill summary after module change
async fn update_skill_summary(
    pool: &PgPool,
    user_id: Uuid,
    module_id: &Uuid,
) -> Result<(), sqlx::Error> {
    sqlx::query(
        r#"
        UPDATE user_skill_summary us
        SET 
            overall_progress = (
                SELECT COUNT(*) FILTER (WHERE status = 'completed') * 100 / NULLIF(COUNT(*), 0)
                FROM user_tech_progress utp
                JOIN tech_modules tm ON utp.module_id = tm.id
                WHERE tm.skill_id = us.skill_id AND utp.user_id = us.user_id
            ),
            hours_total = (
                SELECT COALESCE(SUM(hours_spent), 0)
                FROM user_tech_progress utp
                JOIN tech_modules tm ON utp.module_id = tm.id
                WHERE tm.skill_id = us.skill_id AND utp.user_id = us.user_id
            ),
            status = CASE 
                WHEN (
                    SELECT COUNT(*) FILTER (WHERE status = 'completed')
                    FROM user_tech_progress utp
                    JOIN tech_modules tm ON utp.module_id = tm.id
                    WHERE tm.skill_id = us.skill_id AND utp.user_id = us.user_id
                ) = (
                    SELECT COUNT(*) FROM tech_modules WHERE skill_id = us.skill_id
                ) THEN 'completed'
                WHEN (
                    SELECT COUNT(*) FILTER (WHERE status IN ('in_progress', 'completed'))
                    FROM user_tech_progress utp
                    JOIN tech_modules tm ON utp.module_id = tm.id
                    WHERE tm.skill_id = us.skill_id AND utp.user_id = us.user_id
                ) > 0 THEN 'in_progress'
                ELSE 'not_started'
            END,
            updated_at = NOW()
        WHERE us.user_id = $1 AND us.skill_id = (
            SELECT skill_id FROM tech_modules WHERE id = $2
        )
        "#,
    )
    .bind(user_id)
    .bind(module_id)
    .execute(pool)
    .await?;

    Ok(())
}

/// Get curriculum overview/stats
pub async fn get_curriculum_stats(
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

    // Ensure data is initialized
    let _ = init_curriculum_data(pool.get_ref()).await;
    let _ = init_user_progress(pool.get_ref(), user_id).await;

    let stats = sqlx::query(
        r#"
        SELECT 
            (SELECT COUNT(*) FROM tech_skills) as total_skills,
            (SELECT COUNT(*) FROM tech_modules) as total_modules,
            (SELECT COUNT(*) FROM user_tech_progress WHERE user_id = $1 AND status = 'completed') as completed_modules,
            (SELECT COALESCE(SUM(hours_spent), 0) FROM user_tech_progress WHERE user_id = $1) as hours_total,
            (SELECT COUNT(*) FROM user_skill_summary WHERE user_id = $1 AND status = 'completed') as skills_completed
        "#
    )
    .bind(user_id)
    .fetch_one(pool.get_ref())
    .await;

    match stats {
        Ok(row) => {
            let total_modules: i64 = row.try_get("total_modules").unwrap_or(0);
            let completed: i64 = row.try_get("completed_modules").unwrap_or(0);
            let progress = if total_modules > 0 {
                (completed as f64 / total_modules as f64 * 100.0) as i32
            } else {
                0
            };

            HttpResponse::Ok().json(json!({
                "status": "success",
                "data": {
                    "total_skills": row.try_get::<i64, _>("total_skills").unwrap_or(0),
                    "total_modules": total_modules,
                    "completed_modules": completed,
                    "skills_completed": row.try_get::<i64, _>("skills_completed").unwrap_or(0),
                    "hours_total": row.try_get::<i64, _>("hours_total").unwrap_or(0),
                    "overall_progress": progress,
                    "estimated_total_hours": CURRICULUM_DATA.iter().map(|s| s.estimated_hours).sum::<i32>()
                },
                "meta": { "request_id": request_id }
            }))
        }
        Err(e) => {
            tracing::error!("Failed to fetch stats: {}", e);
            HttpResponse::InternalServerError().json(json!({
                "status": "error",
                "error": { "code": "DB_ERROR", "message": "Failed to fetch stats" },
                "meta": { "request_id": request_id }
            }))
        }
    }
}
