//! Vector Store - User-isolated embeddings storage
//! 
//! Uses Qdrant or similar for efficient similarity search
//! Each user has their own isolated namespace

use std::collections::HashMap;
use std::path::Path;

/// Vector store entry
#[derive(Debug, Clone)]
pub struct VectorEntry {
    pub id: String,
    pub content: String,
    pub embedding: Vec<f32>,
    pub category: String,
    pub timestamp: u64,
    pub metadata: HashMap<String, String>,
}

/// Search result
#[derive(Debug, Clone)]
pub struct SearchResult {
    pub id: String,
    pub content: String,
    pub score: f32,
    pub category: String,
}

/// Vector store for user-isolated embeddings
pub struct VectorStore {
    /// Base path for storage
    base_path: String,
    /// In-memory cache per user (simplified - would use Qdrant/Weaviate in production)
    cache: std::sync::Mutex<HashMap<String, Vec<VectorEntry>>>,
}

impl VectorStore {
    /// Create a new vector store
    pub async fn new(base_path: &str) -> Result<Self, super::AiError> {
        // Create directory if it doesn't exist
        tokio::fs::create_dir_all(base_path).await
            .map_err(|e| super::AiError::VectorStoreError(e.to_string()))?;
        
        Ok(Self {
            base_path: base_path.to_string(),
            cache: std::sync::Mutex::new(HashMap::new()),
        })
    }
    
    /// Upsert a vector entry
    pub async fn upsert(
        &self,
        user_id: &str,
        content: &str,
        embedding: &[f32],
        category: &str,
    ) -> Result<String, super::AiError> {
        let id = format!("{}_{}", user_id, uuid::Uuid::new_v4());
        
        let entry = VectorEntry {
            id: id.clone(),
            content: content.to_string(),
            embedding: embedding.to_vec(),
            category: category.to_string(),
            timestamp: chrono::Utc::now().timestamp() as u64,
            metadata: HashMap::new(),
        };
        
        // Add to cache
        {
            let mut cache = self.cache.lock().unwrap();
            let user_entries = cache.entry(user_id.to_string()).or_default();
            
            // Remove old entry with same content if exists
            user_entries.retain(|e| e.content != content);
            user_entries.push(entry);
        }
        
        // Persist to disk
        self.persist(user_id).await?;
        
        Ok(id)
    }
    
    /// Search for similar vectors
    pub async fn search(
        &self,
        user_id: &str,
        query_embedding: &[f32],
        limit: usize,
    ) -> Result<Vec<SearchResult>, super::AiError> {
        let cache = self.cache.lock().unwrap();
        
        let user_entries = cache.get(user_id)
            .cloned()
            .unwrap_or_default();
        
        // Calculate cosine similarity for all entries
        let mut scored: Vec<(f32, &VectorEntry)> = user_entries
            .iter()
            .map(|entry| {
                let score = cosine_similarity(query_embedding, &entry.embedding);
                (score, entry)
            })
            .collect();
        
        // Sort by score descending
        scored.sort_by(|a, b| b.0.partial_cmp(&a.0).unwrap());
        
        // Return top results
        let results: Vec<SearchResult> = scored
            .into_iter()
            .take(limit)
            .map(|(score, entry)| SearchResult {
                id: entry.id.clone(),
                content: entry.content.clone(),
                score,
                category: entry.category.clone(),
            })
            .collect();
        
        Ok(results)
    }
    
    /// Delete entries by category
    pub async fn delete_by_category(
        &self,
        user_id: &str,
        category: &str,
    ) -> Result<usize, super::AiError> {
        let mut cache = self.cache.lock().unwrap();
        
        if let Some(entries) = cache.get_mut(user_id) {
            let before = entries.len();
            entries.retain(|e| e.category != category);
            let deleted = before - entries.len();
            
            drop(cache);
            self.persist(user_id).await?;
            
            Ok(deleted)
        } else {
            Ok(0)
        }
    }
    
    /// Get all entries for a user
    pub async fn get_user_entries(&self, user_id: &str) -> Result<Vec<VectorEntry>, super::AiError> {
        let cache = self.cache.lock().unwrap();
        
        Ok(cache
            .get(user_id)
            .cloned()
            .unwrap_or_default())
    }
    
    /// Clear all entries for a user
    pub async fn clear_user(&self, user_id: &str) -> Result<(), super::AiError> {
        let mut cache = self.cache.lock().unwrap();
        cache.remove(user_id);
        
        // Delete file
        let path = format!("{}/{}.json", self.base_path, user_id);
        let _ = tokio::fs::remove_file(path).await;
        
        Ok(())
    }
    
    /// Persist user data to disk
    async fn persist(&self, user_id: &str) -> Result<(), super::AiError> {
        let cache = self.cache.lock().unwrap();
        
        if let Some(entries) = cache.get(user_id) {
            let path = format!("{}/{}.json", self.base_path, user_id);
            let json = serde_json::to_string(entries)
                .map_err(|e| super::AiError::VectorStoreError(e.to_string()))?;
            
            tokio::fs::write(path, json).await
                .map_err(|e| super::AiError::VectorStoreError(e.to_string()))?;
        }
        
        Ok(())
    }
    
    /// Load user data from disk
    pub async fn load(&self, user_id: &str) -> Result<(), super::AiError> {
        let path = format!("{}/{}.json", self.base_path, user_id);
        
        if Path::new(&path).exists() {
            let json = tokio::fs::read_to_string(path).await
                .map_err(|e| super::AiError::VectorStoreError(e.to_string()))?;
            
            let entries: Vec<VectorEntry> = serde_json::from_str(&json)
                .map_err(|e| super::AiError::VectorStoreError(e.to_string()))?;
            
            let mut cache = self.cache.lock().unwrap();
            cache.insert(user_id.to_string(), entries);
        }
        
        Ok(())
    }
}

/// Cosine similarity between two vectors
fn cosine_similarity(a: &[f32], b: &[f32]) -> f32 {
    if a.len() != b.len() {
        return 0.0;
    }
    
    let dot_product: f32 = a.iter().zip(b.iter()).map(|(x, y)| x * y).sum();
    let norm_a: f32 = a.iter().map(|x| x * x).sum::<f32>().sqrt();
    let norm_b: f32 = b.iter().map(|x| x * x).sum::<f32>().sqrt();
    
    if norm_a == 0.0 || norm_b == 0.0 {
        return 0.0;
    }
    
    dot_product / (norm_a * norm_b)
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[tokio::test]
    async fn test_vector_store() {
        let store = VectorStore::new("./test_vectors").await.unwrap();
        
        // Insert vectors
        let embedding1 = vec![1.0, 0.0, 0.0];
        let id1 = store.upsert("user1", "test content 1", &embedding1, "test").await.unwrap();
        
        let embedding2 = vec![0.0, 1.0, 0.0];
        let _id2 = store.upsert("user1", "test content 2", &embedding2, "test").await.unwrap();
        
        // Search
        let query = vec![0.9, 0.1, 0.0];
        let results = store.search("user1", &query, 5).await.unwrap();
        
        assert!(!results.is_empty());
        assert_eq!(results[0].id, id1); // Should find closest match
        
        // Cleanup
        store.clear_user("user1").await.unwrap();
        let _ = tokio::fs::remove_dir_all("./test_vectors").await;
    }
    
    #[test]
    fn test_cosine_similarity() {
        let a = vec![1.0, 0.0, 0.0];
        let b = vec![1.0, 0.0, 0.0];
        assert!((cosine_similarity(&a, &b) - 1.0).abs() < 0.001);
        
        let c = vec![0.0, 1.0, 0.0];
        assert!((cosine_similarity(&a, &c)).abs() < 0.001); // Orthogonal
        
        let d = vec![-1.0, 0.0, 0.0];
        assert!((cosine_similarity(&a, &d) + 1.0).abs() < 0.001); // Opposite
    }
}
