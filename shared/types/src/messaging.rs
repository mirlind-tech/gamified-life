use serde::{Deserialize, Serialize};

use crate::{Id, Timestamp};

/// Message content types
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum MessageType {
    Text,
    Image,
    Video,
    Audio,
    File,
    Location,
    Contact,
    System,
    Encrypted,
}

/// Message structure
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Message {
    pub id: Id,
    pub conversation_id: Id,
    pub sender_id: Id,
    pub message_type: MessageType,
    pub content: MessageContent,
    pub encrypted_payload: Option<String>, // For E2EE
    pub reply_to: Option<Id>,
    pub edited_at: Option<Timestamp>,
    pub created_at: Timestamp,
    pub delivered_at: Option<Timestamp>,
    pub read_at: Option<Timestamp>,
    pub reactions: Vec<Reaction>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", content = "data", rename_all = "snake_case")]
pub enum MessageContent {
    Text {
        text: String,
        entities: Vec<TextEntity>,
    },
    Image {
        url: String,
        width: u32,
        height: u32,
        caption: Option<String>,
    },
    Video {
        url: String,
        duration: u32,
        thumbnail_url: String,
    },
    Audio {
        url: String,
        duration: u32,
        waveform: Option<Vec<u8>>,
    },
    File {
        url: String,
        name: String,
        size: u64,
        mime_type: String,
    },
    Location {
        latitude: f64,
        longitude: f64,
        name: Option<String>,
    },
    Contact {
        user_id: Id,
        name: String,
        phone: Option<String>,
    },
    System {
        event: SystemEvent,
    },
    Encrypted {
        ciphertext: String,
    },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TextEntity {
    pub offset: usize,
    pub length: usize,
    #[serde(rename = "type")]
    pub entity_type: EntityType,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum EntityType {
    Mention,
    Hashtag,
    Url,
    Email,
    Bold,
    Italic,
    Code,
    Pre,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Reaction {
    pub user_id: Id,
    pub emoji: String,
    pub created_at: Timestamp,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum SystemEvent {
    UserJoined,
    UserLeft,
    UserRemoved,
    GroupCreated,
    GroupNameChanged,
    GroupAvatarChanged,
    CallStarted,
    CallEnded { duration_seconds: u32 },
}

/// Send message request
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SendMessageRequest {
    pub conversation_id: Id,
    pub message_type: MessageType,
    pub content: MessageContent,
    pub reply_to: Option<Id>,
    pub encrypted_payload: Option<String>,
    pub temp_id: Option<String>, // Client-side temporary ID
}

/// Conversation/Chat structure
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Conversation {
    pub id: Id,
    pub conversation_type: ConversationType,
    pub name: Option<String>,
    pub avatar_url: Option<String>,
    pub participants: Vec<Participant>,
    pub last_message: Option<MessagePreview>,
    pub unread_count: u32,
    pub created_at: Timestamp,
    pub updated_at: Timestamp,
    pub settings: ConversationSettings,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum ConversationType {
    Direct,
    Group,
    Channel,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Participant {
    pub user_id: Id,
    pub role: ParticipantRole,
    pub joined_at: Timestamp,
    pub last_read_message_id: Option<Id>,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum ParticipantRole {
    Member,
    Admin,
    Owner,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConversationSettings {
    pub disappearing_messages: Option<u32>, // Hours until deletion
    pub only_admins_can_post: bool,
    pub join_by_invite_only: bool,
}

impl Default for ConversationSettings {
    fn default() -> Self {
        Self {
            disappearing_messages: None,
            only_admins_can_post: false,
            join_by_invite_only: true,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MessagePreview {
    pub id: Id,
    pub sender_id: Id,
    pub preview_text: String,
    pub created_at: Timestamp,
}

/// Create conversation request
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateConversationRequest {
    pub conversation_type: ConversationType,
    pub name: Option<String>,
    pub participant_ids: Vec<Id>,
    pub initial_message: Option<String>,
}

/// Update conversation request
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateConversationRequest {
    pub name: Option<String>,
    pub avatar_url: Option<String>,
    pub settings: Option<ConversationSettings>,
}

/// Message list with pagination
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MessagesList {
    pub messages: Vec<Message>,
    pub has_more: bool,
    pub next_cursor: Option<String>,
}

/// Conversation list
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConversationsList {
    pub conversations: Vec<Conversation>,
    pub total_unread: u32,
}

/// Typing indicator
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TypingIndicator {
    pub conversation_id: Id,
    pub user_id: Id,
    pub action: TypingAction,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum TypingAction {
    Typing,
    RecordingVoice,
    UploadingPhoto,
    Stopped,
}

/// Call signaling for WebRTC
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum CallSignal {
    Offer {
        call_id: Id,
        sdp: String,
        call_type: CallType,
    },
    Answer {
        call_id: Id,
        sdp: String,
    },
    IceCandidate {
        call_id: Id,
        candidate: String,
        sdp_mid: Option<String>,
        sdp_mline_index: Option<u32>,
    },
    Hangup {
        call_id: Id,
        reason: HangupReason,
    },
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum CallType {
    Voice,
    Video,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum HangupReason {
    Ended,
    Declined,
    Missed,
    Busy,
    Error,
}

/// E2EE Key bundle
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct KeyBundle {
    pub user_id: Id,
    pub device_id: String,
    pub identity_key: String,
    pub signed_pre_key: SignedPreKey,
    pub one_time_pre_keys: Vec<OneTimePreKey>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SignedPreKey {
    pub key_id: u32,
    pub public_key: String,
    pub signature: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OneTimePreKey {
    pub key_id: u32,
    pub public_key: String,
}
