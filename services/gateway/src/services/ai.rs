use chrono::Utc;
use reqwest::Client;
use serde::{Deserialize, Serialize};
use serde_json::{Value, json};
use sqlx::{PgPool, Row};
use uuid::Uuid;

use crate::config::AiCoreConfig;

const DEFAULT_SYSTEM_PROMPT: &str = "You are a focused execution coach for life operations. \
Use the provided context, keep answers concrete, and end with one immediate next action.";

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChatTurn {
    pub role: String,
    pub content: String,
}

#[derive(Debug, Clone, Serialize)]
pub struct ChatResult {
    pub reply: String,
    pub model: String,
}

#[derive(Debug, Clone, Serialize)]
pub struct MemoryUpsertResult {
    pub id: String,
    pub dimensions: usize,
}

#[derive(Debug, Clone, Serialize)]
pub struct MemoryHit {
    pub id: String,
    pub score: f64,
    pub text: String,
    pub payload: Value,
}

#[derive(Debug, Clone, Serialize)]
pub struct RagResult {
    pub answer: String,
    pub model: String,
    pub contexts: Vec<String>,
}

#[derive(Debug, Clone, Serialize)]
pub struct TranscriptionResult {
    pub text: String,
    pub language: Option<String>,
    pub provider: String,
}

#[derive(Debug, thiserror::Error)]
pub enum AiCoreError {
    #[error("Upstream request failed: {0}")]
    Http(#[from] reqwest::Error),
    #[error("Database error: {0}")]
    Database(#[from] sqlx::Error),
    #[error("Unexpected upstream response: {0}")]
    InvalidResponse(String),
    #[error("Upstream AI provider error: {0}")]
    Upstream(String),
}

#[derive(Debug, Clone)]
pub struct AiCoreService {
    client: Client,
    config: AiCoreConfig,
}

impl AiCoreService {
    pub fn new(config: AiCoreConfig) -> Self {
        Self {
            client: Client::new(),
            config,
        }
    }

    pub async fn chat(
        &self,
        prompt: &str,
        history: &[ChatTurn],
        model: Option<String>,
        system_prompt: Option<String>,
    ) -> Result<ChatResult, AiCoreError> {
        let model_name = model.unwrap_or_else(|| self.config.ollama_chat_model.clone());
        let endpoint = format!("{}/api/chat", trim_trailing_slash(&self.config.ollama_url));

        let mut messages = vec![json!({
            "role": "system",
            "content": system_prompt.unwrap_or_else(|| DEFAULT_SYSTEM_PROMPT.to_string())
        })];

        for turn in history {
            if turn.content.trim().is_empty() {
                continue;
            }
            let normalized_role = match turn.role.as_str() {
                "user" | "assistant" | "system" => turn.role.clone(),
                _ => "user".to_string(),
            };
            messages.push(json!({
                "role": normalized_role,
                "content": turn.content
            }));
        }

        messages.push(json!({
            "role": "user",
            "content": prompt
        }));

        let response = self
            .client
            .post(endpoint)
            .json(&json!({
                "model": model_name.clone(),
                "messages": messages,
                "stream": false
            }))
            .send()
            .await?;

        if !response.status().is_success() {
            let status = response.status();
            let body = response.text().await.unwrap_or_default();
            return Err(AiCoreError::Upstream(format!(
                "Chat inference failed with status {}: {}",
                status, body
            )));
        }

        let payload: Value = response.json().await?;
        let reply = payload
            .pointer("/message/content")
            .and_then(Value::as_str)
            .or_else(|| payload.get("response").and_then(Value::as_str))
            .map(str::trim)
            .filter(|value| !value.is_empty())
            .map(ToOwned::to_owned)
            .ok_or_else(|| {
                AiCoreError::InvalidResponse(
                    "Missing assistant content in chat response".to_string(),
                )
            })?;

        Ok(ChatResult {
            reply,
            model: model_name,
        })
    }

    pub async fn upsert_memory(
        &self,
        user_id: &str,
        id: Option<String>,
        text: &str,
        metadata: Value,
    ) -> Result<MemoryUpsertResult, AiCoreError> {
        let vector = self.embed_text(text).await?;
        self.ensure_qdrant_collection(vector.len()).await?;

        let record_id = id.unwrap_or_else(|| Uuid::new_v4().to_string());
        let endpoint = format!(
            "{}/collections/{}/points?wait=true",
            trim_trailing_slash(&self.config.qdrant_url),
            self.config.qdrant_collection
        );

        let payload = json!({
            "points": [
                {
                    "id": record_id,
                    "vector": vector,
                    "payload": {
                        "user_id": user_id,
                        "text": text,
                        "metadata": metadata,
                        "created_at": Utc::now().to_rfc3339()
                    }
                }
            ]
        });

        let response = self.client.put(endpoint).json(&payload).send().await?;
        if !response.status().is_success() {
            let status = response.status();
            let body = response.text().await.unwrap_or_default();
            return Err(AiCoreError::Upstream(format!(
                "Memory upsert failed with status {}: {}",
                status, body
            )));
        }

        Ok(MemoryUpsertResult {
            id: record_id,
            dimensions: vector_len_from_payload(&payload),
        })
    }

    pub async fn search_memory(
        &self,
        user_id: &str,
        query: &str,
        limit: usize,
    ) -> Result<Vec<MemoryHit>, AiCoreError> {
        let vector = self.embed_text(query).await?;

        let endpoint = format!(
            "{}/collections/{}/points/search",
            trim_trailing_slash(&self.config.qdrant_url),
            self.config.qdrant_collection
        );

        let response = self
            .client
            .post(endpoint)
            .json(&json!({
                "vector": vector,
                "limit": limit.max(1).min(self.config.qdrant_top_k as usize),
                "with_payload": true,
                "filter": {
                    "must": [
                        {
                            "key": "user_id",
                            "match": {
                                "value": user_id
                            }
                        }
                    ]
                }
            }))
            .send()
            .await?;

        if !response.status().is_success() {
            let status = response.status();
            let body = response.text().await.unwrap_or_default();
            return Err(AiCoreError::Upstream(format!(
                "Memory search failed with status {}: {}",
                status, body
            )));
        }

        let payload: Value = response.json().await?;
        let result = payload
            .get("result")
            .and_then(Value::as_array)
            .cloned()
            .unwrap_or_default();

        let hits = result
            .into_iter()
            .map(|item| {
                let id = item
                    .get("id")
                    .and_then(value_to_string)
                    .unwrap_or_else(|| Uuid::new_v4().to_string());
                let score = item
                    .get("score")
                    .and_then(Value::as_f64)
                    .unwrap_or_default();
                let payload = item.get("payload").cloned().unwrap_or_else(|| json!({}));
                let text = payload
                    .get("text")
                    .and_then(Value::as_str)
                    .unwrap_or_default()
                    .to_string();

                MemoryHit {
                    id,
                    score,
                    text,
                    payload,
                }
            })
            .collect();

        Ok(hits)
    }

    pub async fn rag_query(
        &self,
        pool: &PgPool,
        user_id: &str,
        question: &str,
        limit: usize,
        model: Option<String>,
    ) -> Result<RagResult, AiCoreError> {
        let memory_hits = self.search_memory(user_id, question, limit).await?;
        let db_context = self.collect_user_context(pool, user_id).await;

        let mut contexts: Vec<String> = memory_hits
            .iter()
            .map(|hit| format!("Memory (score {:.3}): {}", hit.score, hit.text))
            .collect();
        contexts.extend(db_context);

        if contexts.is_empty() {
            contexts
                .push("No prior memory records found. Relying on direct user request.".to_string());
        }

        let composed_context = contexts.join("\n");
        let prompt = format!(
            "User question:\n{}\n\nContext:\n{}\n\nReturn a concise answer with concrete steps and one immediate action.",
            question, composed_context
        );

        let response = self
            .chat(&prompt, &[], model, Some(DEFAULT_SYSTEM_PROMPT.to_string()))
            .await?;

        Ok(RagResult {
            answer: response.reply,
            model: response.model,
            contexts,
        })
    }

    pub async fn transcribe(
        &self,
        audio_base64: &str,
        language: Option<&str>,
        prompt: Option<&str>,
    ) -> Result<TranscriptionResult, AiCoreError> {
        let endpoint = self.config.whisper_url.clone();
        let response = self
            .client
            .post(endpoint.clone())
            .json(&json!({
                "model": self.config.whisper_model,
                "audio_base64": audio_base64,
                "language": language,
                "prompt": prompt
            }))
            .send()
            .await?;

        if !response.status().is_success() {
            let status = response.status();
            let body = response.text().await.unwrap_or_default();
            return Err(AiCoreError::Upstream(format!(
                "Whisper transcription failed with status {}: {}",
                status, body
            )));
        }

        let payload: Value = response.json().await?;
        let text = payload
            .get("text")
            .and_then(Value::as_str)
            .or_else(|| payload.get("transcript").and_then(Value::as_str))
            .or_else(|| payload.pointer("/result/text").and_then(Value::as_str))
            .map(str::trim)
            .filter(|value| !value.is_empty())
            .map(ToOwned::to_owned)
            .ok_or_else(|| {
                AiCoreError::InvalidResponse("Whisper response missing transcript text".to_string())
            })?;

        let detected_language = payload
            .get("language")
            .and_then(Value::as_str)
            .map(ToOwned::to_owned)
            .or_else(|| language.map(ToOwned::to_owned));

        Ok(TranscriptionResult {
            text,
            language: detected_language,
            provider: "whisper".to_string(),
        })
    }

    async fn embed_text(&self, text: &str) -> Result<Vec<f32>, AiCoreError> {
        let base = trim_trailing_slash(&self.config.ollama_url);
        let model = self.config.ollama_embedding_model.clone();

        let candidates = vec![
            (
                format!("{}/api/embeddings", base),
                json!({
                    "model": model,
                    "prompt": text
                }),
            ),
            (
                format!("{}/api/embed", base),
                json!({
                    "model": model,
                    "input": text
                }),
            ),
        ];

        for (endpoint, payload) in candidates {
            let response = self.client.post(endpoint).json(&payload).send().await?;

            if !response.status().is_success() {
                continue;
            }

            let value: Value = response.json().await?;
            if let Some(vector) = extract_embedding(&value) {
                return Ok(vector);
            }
        }

        Err(AiCoreError::InvalidResponse(
            "Embedding endpoint returned no vector data".to_string(),
        ))
    }

    async fn ensure_qdrant_collection(&self, dimensions: usize) -> Result<(), AiCoreError> {
        let endpoint = format!(
            "{}/collections/{}",
            trim_trailing_slash(&self.config.qdrant_url),
            self.config.qdrant_collection
        );

        let response = self
            .client
            .put(endpoint)
            .json(&json!({
                "vectors": {
                    "size": dimensions,
                    "distance": "Cosine"
                }
            }))
            .send()
            .await?;

        if response.status().is_success() || response.status().as_u16() == 409 {
            return Ok(());
        }

        let status = response.status();
        let body = response.text().await.unwrap_or_default();
        Err(AiCoreError::Upstream(format!(
            "Failed to ensure Qdrant collection with status {}: {}",
            status, body
        )))
    }

    async fn collect_user_context(&self, pool: &PgPool, user_id: &str) -> Vec<String> {
        let mut contexts = Vec::new();

        if table_exists(pool, "weekly_reviews").await {
            if let Ok(rows) = sqlx::query(
                r#"
                SELECT week_start::text AS week_start, wins, failures, lessons
                FROM weekly_reviews
                WHERE user_id::text = $1
                ORDER BY week_start DESC
                LIMIT 3
                "#,
            )
            .bind(user_id)
            .fetch_all(pool)
            .await
            {
                for row in rows {
                    let week_start = row.try_get::<String, _>("week_start").unwrap_or_default();
                    let wins = row.try_get::<String, _>("wins").unwrap_or_default();
                    let failures = row.try_get::<String, _>("failures").unwrap_or_default();
                    let lessons = row.try_get::<String, _>("lessons").unwrap_or_default();

                    contexts.push(format!(
                        "Weekly review {} -> wins: {}; failures: {}; lessons: {}",
                        week_start, wins, failures, lessons
                    ));
                }
            }
        }

        if table_exists(pool, "outcome_daily_actions").await {
            if let Ok(rows) = sqlx::query(
                r#"
                SELECT action_date::text AS action_date, title, completed
                FROM outcome_daily_actions
                WHERE user_id::text = $1
                ORDER BY action_date DESC, created_at DESC
                LIMIT 8
                "#,
            )
            .bind(user_id)
            .fetch_all(pool)
            .await
            {
                for row in rows {
                    let date = row.try_get::<String, _>("action_date").unwrap_or_default();
                    let title = row.try_get::<String, _>("title").unwrap_or_default();
                    let completed = row.try_get::<bool, _>("completed").unwrap_or(false);
                    contexts.push(format!(
                        "Action {} -> {} [{}]",
                        date,
                        title,
                        if completed { "done" } else { "pending" }
                    ));
                }
            }
        }

        if table_exists(pool, "finance_entries").await {
            if let Ok(rows) = sqlx::query(
                r#"
                SELECT date::text AS date, category, amount
                FROM finance_entries
                WHERE user_id::text = $1
                ORDER BY date DESC
                LIMIT 6
                "#,
            )
            .bind(user_id)
            .fetch_all(pool)
            .await
            {
                for row in rows {
                    let date = row.try_get::<String, _>("date").unwrap_or_default();
                    let category = row.try_get::<String, _>("category").unwrap_or_default();
                    let amount = row.try_get::<f64, _>("amount").unwrap_or_default();
                    contexts.push(format!("Finance {} -> {}: {:.2}", date, category, amount));
                }
            }
        }

        contexts
    }
}

fn trim_trailing_slash(url: &str) -> String {
    url.trim_end_matches('/').to_string()
}

fn extract_embedding(value: &Value) -> Option<Vec<f32>> {
    if let Some(vector) = value.get("embedding").and_then(value_to_f32_vec) {
        return Some(vector);
    }

    if let Some(vectors) = value.get("embeddings").and_then(Value::as_array) {
        return vectors.first().and_then(value_to_f32_vec);
    }

    None
}

fn value_to_f32_vec(value: &Value) -> Option<Vec<f32>> {
    let values = value.as_array()?;
    let mut output = Vec::with_capacity(values.len());
    for entry in values {
        let float = entry.as_f64()? as f32;
        output.push(float);
    }
    Some(output)
}

fn value_to_string(value: &Value) -> Option<String> {
    if let Some(text) = value.as_str() {
        return Some(text.to_string());
    }
    if let Some(number) = value.as_i64() {
        return Some(number.to_string());
    }
    if let Some(number) = value.as_u64() {
        return Some(number.to_string());
    }
    None
}

fn vector_len_from_payload(payload: &Value) -> usize {
    payload
        .pointer("/points/0/vector")
        .and_then(Value::as_array)
        .map(|values| values.len())
        .unwrap_or_default()
}

async fn table_exists(pool: &PgPool, table_name: &str) -> bool {
    let qualified = format!("public.{}", table_name);
    sqlx::query_scalar::<_, bool>("SELECT to_regclass($1) IS NOT NULL")
        .bind(qualified)
        .fetch_one(pool)
        .await
        .unwrap_or(false)
}
