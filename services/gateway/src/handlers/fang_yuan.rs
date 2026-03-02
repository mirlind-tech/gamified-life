//! Fang Yuan Mindset API handlers

use actix_web::{HttpRequest, HttpResponse, web};
use serde::Deserialize;
use serde_json::json;
use sqlx::{PgPool, Row};
use uuid::Uuid;

use crate::handlers::auth::get_request_id;
use crate::services::AuthService;

/// Fang Yuan principles data
const PRINCIPLES: &[(i32, &str, &str, i32)] = &[
    (
        1,
        "Strength is the Only Virtue",
        "True power comes from within. Cultivate your strength above all else.",
        0,
    ),
    (
        2,
        "Detach from Emotion",
        "Emotions cloud judgment. Make decisions based on logic and benefit.",
        0,
    ),
    (
        3,
        "Sacrifice Present for Future",
        "Small sacrifices today create massive gains tomorrow. Delay gratification.",
        0,
    ),
    (
        4,
        "Be Ruthless with Yourself",
        "Hold yourself to the highest standards. Never accept mediocrity.",
        500,
    ),
    (
        5,
        "Only the Useful Matter",
        "Evaluate everything by utility. Discard what doesn't serve your goals.",
        1000,
    ),
    (
        6,
        "Regret is for the Weak",
        "Learn from mistakes but never dwell. Forward motion only.",
        1500,
    ),
    (
        7,
        "Think 10 Moves Ahead",
        "Anticipate consequences. Plan your path with precision.",
        2000,
    ),
    (
        8,
        "Pain is the Price",
        "Growth requires discomfort. Embrace the struggle.",
        2500,
    ),
    (
        9,
        "The World is for Exploitation",
        "Resources exist to be used. Find opportunities everywhere.",
        3000,
    ),
    (
        10,
        "Adapt and Overcome",
        "Flexibility is strength. Adjust tactics while maintaining objectives.",
        3500,
    ),
    (
        11,
        "No Permanent Enemies",
        "Alliances are temporary tools. Relationships serve purpose.",
        4000,
    ),
    (
        12,
        "Always Keep Hidden Cards",
        "Never reveal your full strength. Mystery is power.",
        5000,
    ),
];

/// Quiz questions for each principle
const QUIZ_QUESTIONS: &[(i32, &str, &[(&str, &str, bool)])] = &[
    (
        1,
        "What is the core virtue according to Fang Yuan?",
        &[
            ("a", "Kindness", false),
            ("b", "Strength", true),
            ("c", "Wisdom", false),
            ("d", "Wealth", false),
        ],
    ),
    (
        2,
        "How should decisions be made?",
        &[
            ("a", "Based on emotions", false),
            ("b", "Based on logic and benefit", true),
            ("c", "Based on others' opinions", false),
            ("d", "Based on tradition", false),
        ],
    ),
    (
        3,
        "What is the key to future gains?",
        &[
            ("a", "Immediate gratification", false),
            ("b", "Luck", false),
            ("c", "Sacrificing present comfort", true),
            ("d", "Waiting for opportunities", false),
        ],
    ),
];

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

/// Get user's XP total
async fn get_user_xp(pool: &PgPool, user_id: Uuid) -> i32 {
    sqlx::query_scalar::<_, i64>(
        "SELECT COALESCE(SUM(xp_total), 0) FROM gamification_stats WHERE user_id = $1",
    )
    .bind(user_id)
    .fetch_one(pool)
    .await
    .map(|v| v as i32)
    .unwrap_or(0)
}

/// Get all principles with unlock status
pub async fn get_principles(
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

    let user_xp = get_user_xp(pool.get_ref(), user_id).await;

    // Initialize principles progress
    for (num, _, _, _) in PRINCIPLES {
        let _ = sqlx::query(
            "INSERT INTO fang_yuan_progress (user_id, principle_number, unlocked) VALUES ($1, $2, false) ON CONFLICT DO NOTHING"
        )
        .bind(user_id)
        .bind(num)
        .execute(pool.get_ref())
        .await;
    }

    // Auto-unlock based on XP
    let _ = sqlx::query(
        r#"
        UPDATE fang_yuan_progress 
        SET unlocked = true, unlocked_at = COALESCE(unlocked_at, NOW())
        WHERE user_id = $1 AND principle_number <= 3
        "#,
    )
    .bind(user_id)
    .execute(pool.get_ref())
    .await;

    // Unlock principles based on XP thresholds
    for (num, _, _, xp_required) in PRINCIPLES {
        if user_xp >= *xp_required && *num > 3 {
            let _ = sqlx::query(
                "UPDATE fang_yuan_progress SET unlocked = true, unlocked_at = COALESCE(unlocked_at, NOW()) WHERE user_id = $1 AND principle_number = $2"
            )
            .bind(user_id)
            .bind(num)
            .execute(pool.get_ref())
            .await;
        }
    }

    // Fetch progress
    let progress = sqlx::query(
        "SELECT principle_number, unlocked, quiz_score FROM fang_yuan_progress WHERE user_id = $1 ORDER BY principle_number"
    )
    .bind(user_id)
    .fetch_all(pool.get_ref())
    .await;

    let progress_map: std::collections::HashMap<i32, (bool, i32)> = match progress {
        Ok(rows) => rows
            .iter()
            .map(|row| {
                let num = row.try_get::<i32, _>("principle_number").unwrap_or(0);
                let unlocked = row.try_get::<bool, _>("unlocked").unwrap_or(false);
                let score = row.try_get::<i32, _>("quiz_score").unwrap_or(0);
                (num, (unlocked, score))
            })
            .collect(),
        Err(_) => std::collections::HashMap::new(),
    };

    let principles: Vec<_> = PRINCIPLES
        .iter()
        .map(|(num, title, desc, xp_req)| {
            let (unlocked, quiz_score) = progress_map.get(num).copied().unwrap_or((false, 0));
            json!({
                "number": num,
                "title": title,
                "description": desc,
                "xpRequired": xp_req,
                "unlocked": unlocked || *num <= 3,
                "quizScore": quiz_score,
                "quizPassed": quiz_score >= 70
            })
        })
        .collect();

    HttpResponse::Ok().json(json!({
        "status": "success",
        "data": {
            "principles": principles,
            "userXp": user_xp,
            "principlesUnlocked": principles.iter().filter(|p| p["unlocked"].as_bool().unwrap_or(false)).count()
        },
        "meta": { "request_id": request_id }
    }))
}

/// Get single principle with quiz
pub async fn get_principle(
    req: HttpRequest,
    path: web::Path<i32>,
    pool: web::Data<PgPool>,
    auth_service: web::Data<AuthService>,
) -> HttpResponse {
    let request_id = get_request_id(&req);
    let principle_num = path.into_inner();

    let user_id = match extract_user_id(&req, &auth_service) {
        Some(id) => id,
        None => {
            return HttpResponse::Unauthorized().json(json!({
                "status": "error",
                "error": { "code": "UNAUTHORIZED", "message": "Authentication required" }
            }));
        }
    };

    let user_xp = get_user_xp(pool.get_ref(), user_id).await;

    let principle = PRINCIPLES
        .iter()
        .find(|(num, _, _, _)| *num == principle_num);

    match principle {
        Some((num, title, desc, xp_req)) => {
            let is_unlocked = user_xp >= *xp_req || *num <= 3;

            // Get quiz questions for this principle
            let quiz = QUIZ_QUESTIONS.iter().find(|(n, _, _)| *n == principle_num);
            let questions: Vec<_> = quiz
                .map(|(_, q, answers)| {
                    json!({
                        "question": q,
                        "answers": answers.iter().map(|(id, text, _)| {
                            json!({ "id": id, "text": text })
                        }).collect::<Vec<_>>()
                    })
                })
                .into_iter()
                .collect();

            HttpResponse::Ok().json(json!({
                "status": "success",
                "data": {
                    "principle": {
                        "number": num,
                        "title": title,
                        "description": desc,
                        "xpRequired": xp_req,
                        "unlocked": is_unlocked,
                        "quiz": questions
                    }
                },
                "meta": { "request_id": request_id }
            }))
        }
        None => HttpResponse::NotFound().json(json!({
            "status": "error",
            "error": { "code": "NOT_FOUND", "message": "Principle not found" },
            "meta": { "request_id": request_id }
        })),
    }
}

/// Submit quiz
#[derive(Debug, Deserialize)]
pub struct QuizSubmitRequest {
    pub principle_number: i32,
    pub answers: Vec<(String, String)>, // (question_id, answer_id)
}

pub async fn submit_quiz(
    req: HttpRequest,
    body: web::Json<QuizSubmitRequest>,
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

    // Calculate score
    let mut correct = 0;
    let total = body.answers.len().max(1);

    for (question_id, answer_id) in &body.answers {
        // Check if answer is correct
        if let Some((_, _, answers)) = QUIZ_QUESTIONS
            .iter()
            .find(|(n, _, _)| n.to_string() == *question_id)
        {
            if let Some((_, _, is_correct)) =
                answers.iter().find(|(id, _, _)| *id == answer_id.as_str())
            {
                if *is_correct {
                    correct += 1;
                }
            }
        }
    }

    let score = (correct as f64 / total as f64 * 100.0) as i32;
    let passed = score >= 70;

    // Save quiz result
    let _ = sqlx::query(
        r#"
        INSERT INTO fang_yuan_progress (user_id, principle_number, quiz_score, quiz_completed_at)
        VALUES ($1, $2, $3, NOW())
        ON CONFLICT (user_id, principle_number) DO UPDATE 
        SET quiz_score = GREATEST(fang_yuan_progress.quiz_score, $3), 
            quiz_completed_at = CASE WHEN $3 > fang_yuan_progress.quiz_score THEN NOW() ELSE fang_yuan_progress.quiz_completed_at END
        "#
    )
    .bind(user_id)
    .bind(body.principle_number)
    .bind(score)
    .execute(pool.get_ref())
    .await;

    HttpResponse::Ok().json(json!({
        "status": "success",
        "data": {
            "score": score,
            "passed": passed,
            "correct": correct,
            "total": total,
            "message": if passed { "Quiz passed! Principle mastered." } else { "Keep studying. Try again." }
        },
        "meta": { "request_id": request_id }
    }))
}

/// Get daily teaching
pub async fn get_daily_teaching(
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

    let user_xp = get_user_xp(pool.get_ref(), user_id).await;

    // Select principle based on timestamp
    let idx = (chrono::Local::now().timestamp() / 86400) as usize;
    let available: Vec<_> = PRINCIPLES
        .iter()
        .filter(|(num, _, _, xp_req)| user_xp >= *xp_req || *num <= 3)
        .collect();

    let principle = available.get(idx % available.len().max(1));

    match principle {
        Some((num, title, desc, _)) => HttpResponse::Ok().json(json!({
            "status": "success",
            "data": {
                "teaching": {
                    "number": num,
                    "title": title,
                    "explanation": desc,
                    "application": format!("Apply '{}' to your daily decisions.", title),
                    "quote": format!("'{}' - The foundation of strength.", title)
                }
            },
            "meta": { "request_id": request_id }
        })),
        None => HttpResponse::Ok().json(json!({
            "status": "success",
            "data": { "teaching": null },
            "meta": { "request_id": request_id }
        })),
    }
}
