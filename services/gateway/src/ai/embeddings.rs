//! Embedding generation for RAG
//! 
//! Uses small, fast embedding models suitable for on-device inference

use candle_core::{Device, Tensor};

/// Generate embeddings for text
pub async fn generate(text: &str, device: &Device) -> Result<Vec<f32>, super::AiError> {
    // In production, this would use a real embedding model like:
    // - sentence-transformers/all-MiniLM-L6-v2
    // - nomic-embed-text-v1
    // - BAAI/bge-small-en-v1.5
    
    // Simplified: generate deterministic pseudo-embeddings for demonstration
    let normalized = text.to_lowercase();
    let mut embedding = vec![0.0f32; 384]; // Standard embedding size
    
    // Simple hash-based embedding (NOT for production)
    for (i, chunk) in normalized.as_bytes().chunks(3).enumerate() {
        let idx = i % 384;
        for byte in chunk {
            embedding[idx] += *byte as f32 / 255.0;
        }
    }
    
    // Normalize
    let norm: f32 = embedding.iter().map(|x| x * x).sum::<f32>().sqrt();
    if norm > 0.0 {
        for x in &mut embedding {
            *x /= norm;
        }
    }
    
    let _ = device;
    
    Ok(embedding)
}

/// Batch generate embeddings
pub async fn generate_batch(texts: &[String], device: &Device) -> Result<Vec<Vec<f32>>, super::AiError> {
    let mut embeddings = Vec::with_capacity(texts.len());
    
    for text in texts {
        embeddings.push(generate(text, device).await?);
    }
    
    Ok(embeddings)
}

/// Cosine similarity between embeddings
pub fn similarity(a: &[f32], b: &[f32]) -> f32 {
    if a.len() != b.len() {
        return 0.0;
    }
    
    let dot: f32 = a.iter().zip(b.iter()).map(|(x, y)| x * y).sum();
    let norm_a: f32 = a.iter().map(|x| x * x).sum::<f32>().sqrt();
    let norm_b: f32 = b.iter().map(|x| x * x).sum::<f32>().sqrt();
    
    if norm_a == 0.0 || norm_b == 0.0 {
        return 0.0;
    }
    
    dot / (norm_a * norm_b)
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[tokio::test]
    async fn test_generate() {
        let device = Device::Cpu;
        
        let emb1 = generate("Hello world", &device).await.unwrap();
        let emb2 = generate("Hello world", &device).await.unwrap();
        let emb3 = generate("Different text", &device).await.unwrap();
        
        assert_eq!(emb1.len(), 384);
        
        // Same text should produce same embedding
        assert_eq!(emb1, emb2);
        
        // Different text should produce different embedding
        assert_ne!(emb1, emb3);
        
        // Similar text should have high similarity
        let sim = similarity(&emb1, &emb2);
        assert!(sim > 0.99);
    }
}
