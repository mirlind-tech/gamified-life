//! AI Memory management
//! 
//! Handles conversation history and context windows

use std::collections::VecDeque;

/// Conversation message
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct Message {
    pub role: String,
    pub content: String,
    pub timestamp: u64,
}

/// Conversation memory for a user
pub struct ConversationMemory {
    user_id: String,
    messages: VecDeque<Message>,
    max_messages: usize,
    max_tokens: usize,
}

impl ConversationMemory {
    /// Create new conversation memory
    pub fn new(user_id: &str, max_messages: usize, max_tokens: usize) -> Self {
        Self {
            user_id: user_id.to_string(),
            messages: VecDeque::with_capacity(max_messages),
            max_messages,
            max_tokens,
        }
    }
    
    /// Add a message
    pub fn add_message(&mut self, role: &str, content: &str) {
        if self.messages.len() >= self.max_messages {
            self.messages.pop_front();
        }
        
        self.messages.push_back(Message {
            role: role.to_string(),
            content: content.to_string(),
            timestamp: chrono::Utc::now().timestamp() as u64,
        });
    }
    
    /// Get recent messages
    pub fn get_recent(&self, n: usize) -> Vec<&Message> {
        self.messages.iter().rev().take(n).collect::<Vec<_>>().into_iter().rev().collect()
    }
    
    /// Get all messages
    pub fn get_all(&self) -> &VecDeque<Message> {
        &self.messages
    }
    
    /// Clear memory
    pub fn clear(&mut self) {
        self.messages.clear();
    }
    
    /// Format for model input
    pub fn format_for_model(&self) -> String {
        self.messages
            .iter()
            .map(|m| format!("<|{}|>\n{}", m.role, m.content))
            .collect::<Vec<_>>()
            .join("\n")
    }
    
    /// Estimate token count (rough approximation)
    pub fn estimate_tokens(&self) -> usize {
        self.messages.iter().map(|m| m.content.len() / 4).sum()
    }
    
    /// Summarize old messages if exceeding token limit
    pub fn compress_if_needed(&mut self) {
        while self.estimate_tokens() > self.max_tokens && self.messages.len() > 4 {
            // Remove oldest message (except system)
            if let Some(oldest) = self.messages.pop_front() {
                if oldest.role == "system" {
                    self.messages.push_front(oldest);
                }
            }
        }
    }
}

/// Memory manager for all users
pub struct MemoryManager {
    memories: std::collections::HashMap<String, ConversationMemory>,
    default_max_messages: usize,
    default_max_tokens: usize,
}

impl MemoryManager {
    /// Create new memory manager
    pub fn new() -> Self {
        Self {
            memories: std::collections::HashMap::new(),
            default_max_messages: 50,
            default_max_tokens: 4000,
        }
    }
    
    /// Get or create memory for user
    pub fn get_memory(&mut self, user_id: &str) -> &mut ConversationMemory {
        self.memories
            .entry(user_id.to_string())
            .or_insert_with(|| {
                ConversationMemory::new(
                    user_id,
                    self.default_max_messages,
                    self.default_max_tokens,
                )
            })
    }
    
    /// Clear user memory
    pub fn clear_memory(&mut self, user_id: &str) {
        self.memories.remove(user_id);
    }
    
    /// Get all user IDs
    pub fn get_users(&self) -> Vec<String> {
        self.memories.keys().cloned().collect()
    }
}

impl Default for MemoryManager {
    fn default() -> Self {
        Self::new()
    }
}
