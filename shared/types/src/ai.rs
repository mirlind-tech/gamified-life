use serde::{Deserialize, Serialize};

use crate::{Id, Timestamp};

/// AI conversation/session
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AiConversation {
    pub id: Id,
    pub user_id: Id,
    pub title: String,
    pub model: AiModel,
    pub messages: Vec<AiMessage>,
    pub context: ConversationContext,
    pub created_at: Timestamp,
    pub updated_at: Timestamp,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum AiModel {
    LocalLlama3,
    LocalMistral,
    LocalPhi4,
    RemoteGpt4,
    RemoteClaude,
    SpecializedCode,
    SpecializedAnalysis,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AiMessage {
    pub id: Id,
    pub role: MessageRole,
    pub content: String,
    pub tokens_used: Option<u32>,
    pub created_at: Timestamp,
    pub sources: Vec<RetrievedSource>, // For RAG
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum MessageRole {
    System,
    User,
    Assistant,
    Tool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RetrievedSource {
    pub document_id: Id,
    pub document_title: String,
    pub relevance_score: f32,
    pub excerpt: String,
}

/// Context for AI conversations
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConversationContext {
    pub user_preferences: UserAiPreferences,
    pub active_topics: Vec<String>,
    pub user_facts: Vec<String>, // Learned facts about user
    pub current_goals: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserAiPreferences {
    pub response_style: ResponseStyle,
    pub verbosity: VerbosityLevel,
    pub memory_enabled: bool,
    pub proactivity_level: ProactivityLevel,
    pub expertise_areas: Vec<String>,
    pub language_preference: String,
}

impl Default for UserAiPreferences {
    fn default() -> Self {
        Self {
            response_style: ResponseStyle::Balanced,
            verbosity: VerbosityLevel::Normal,
            memory_enabled: true,
            proactivity_level: ProactivityLevel::Medium,
            expertise_areas: vec![],
            language_preference: "en".to_string(),
        }
    }
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum ResponseStyle {
    Concise,
    Balanced,
    Detailed,
    Socratic,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum VerbosityLevel {
    Minimal,
    Normal,
    Verbose,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum ProactivityLevel {
    Low,    // Only responds when asked
    Medium, // Occasionally offers suggestions
    High,   // Proactively helps with goals
}

/// Send message to AI request
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AiChatRequest {
    pub conversation_id: Option<Id>,
    pub message: String,
    pub model: Option<AiModel>,
    pub attachments: Vec<AiAttachment>,
    pub enable_rag: bool,
    pub streaming: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AiAttachment {
    pub attachment_type: AttachmentType,
    pub content: String,
    pub mime_type: String,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum AttachmentType {
    Text,
    Image,
    Document,
    Code,
    Url,
}

/// AI response (non-streaming)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AiChatResponse {
    pub conversation_id: Id,
    pub message: AiMessage,
    pub suggested_actions: Vec<SuggestedAction>,
    pub context_used: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum SuggestedAction {
    CreateReminder {
        title: String,
        due_date: Timestamp,
    },
    CreateTask {
        title: String,
        description: String,
    },
    SendMessage {
        recipient: String,
        content: String,
    },
    ScheduleEvent {
        title: String,
        start_time: Timestamp,
    },
    SearchKnowledge {
        query: String,
    },
    ExecuteCode {
        code: String,
        language: String,
    },
}

/// Streaming response chunk
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AiStreamChunk {
    pub conversation_id: Id,
    pub chunk: String,
    pub is_done: bool,
    pub message_id: Option<Id>,
}

/// Document for RAG
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Document {
    pub id: Id,
    pub user_id: Id,
    pub title: String,
    pub content: String,
    pub document_type: DocumentType,
    pub source: DocumentSource,
    pub metadata: DocumentMetadata,
    pub embeddings: Option<Vec<f32>>,
    pub created_at: Timestamp,
    pub updated_at: Timestamp,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum DocumentType {
    Note,
    Journal,
    Plan,
    CodeSnippet,
    Bookmark,
    File,
    Conversation,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum DocumentSource {
    UserCreated,
    Imported { source_url: String },
    AiGenerated,
    EmailImport,
    MessageExport,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DocumentMetadata {
    pub tags: Vec<String>,
    pub category: Option<String>,
    pub importance: u8, // 1-5
    pub related_documents: Vec<Id>,
}

/// Memory entry (learned facts about user)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MemoryEntry {
    pub id: Id,
    pub user_id: Id,
    pub fact: String,
    pub fact_type: FactType,
    pub confidence: f32, // 0.0 - 1.0
    pub source: String,  // Where was this learned
    pub created_at: Timestamp,
    pub last_accessed_at: Timestamp,
    pub access_count: u32,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum FactType {
    Preference,
    Goal,
    Habit,
    Relationship,
    Work,
    Skill,
    Value,
    Event,
    Other,
}

/// Vector search request
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VectorSearchRequest {
    pub query: String,
    pub filters: Option<SearchFilters>,
    pub limit: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SearchFilters {
    pub document_types: Option<Vec<DocumentType>>,
    pub date_from: Option<Timestamp>,
    pub date_to: Option<Timestamp>,
    pub tags: Option<Vec<String>>,
}

/// Vector search result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VectorSearchResult {
    pub document: Document,
    pub score: f32,
    pub matched_excerpt: String,
}

/// AI-generated content
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GeneratedContent {
    pub content_type: ContentType,
    pub title: String,
    pub content: String,
    pub outline: Vec<String>,
    pub suggested_tags: Vec<String>,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum ContentType {
    Document,
    Plan,
    Summary,
    Code,
    Email,
    Message,
    Analysis,
}

/// Generate content request
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GenerateContentRequest {
    pub prompt: String,
    pub content_type: ContentType,
    pub context: Option<String>,
    pub style_preferences: Option<String>,
    pub length_hint: Option<String>,
}

/// AI task/agent execution
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentTask {
    pub id: Id,
    pub user_id: Id,
    pub task_type: AgentTaskType,
    pub description: String,
    pub status: TaskStatus,
    pub parameters: serde_json::Value,
    pub result: Option<serde_json::Value>,
    pub created_at: Timestamp,
    pub started_at: Option<Timestamp>,
    pub completed_at: Option<Timestamp>,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum AgentTaskType {
    Research,
    Schedule,
    CodeReview,
    DocumentAnalysis,
    EmailDraft,
    PlanGeneration,
    DataVisualization,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum TaskStatus {
    Pending,
    InProgress,
    Completed,
    Failed,
    Cancelled,
}
