//! Model management and loading
//! 
//! Handles different model formats (GGUF, ONNX, Candle native)

use std::path::Path;

/// Supported model formats
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ModelFormat {
    /// Candle native format
    Candle,
    /// GGUF format (llama.cpp compatible)
    Gguf,
    /// ONNX format
    Onnx,
    /// SafeTensors format
    SafeTensors,
}

/// Model metadata
#[derive(Debug, Clone)]
pub struct ModelInfo {
    pub name: String,
    pub path: String,
    pub format: ModelFormat,
    pub size_mb: usize,
    pub parameters: String,
    pub context_length: usize,
}

/// Model registry
pub struct ModelRegistry {
    models_dir: String,
}

impl ModelRegistry {
    /// Create new registry
    pub fn new(models_dir: &str) -> Self {
        Self {
            models_dir: models_dir.to_string(),
        }
    }
    
    /// List available models
    pub fn list_models(&self) -> Vec<ModelInfo> {
        let mut models = vec![];
        
        let path = Path::new(&self.models_dir);
        if let Ok(entries) = std::fs::read_dir(path) {
            for entry in entries.flatten() {
                let path = entry.path();
                if path.is_dir() {
                    if let Some(info) = self.scan_model_dir(&path) {
                        models.push(info);
                    }
                }
            }
        }
        
        models
    }
    
    /// Scan a model directory
    fn scan_model_dir(&self, path: &Path) -> Option<ModelInfo> {
        let name = path.file_name()?.to_str()?.to_string();
        
        // Detect format based on files present
        let format = if path.join("model.gguf").exists() {
            ModelFormat::Gguf
        } else if path.join("model.onnx").exists() {
            ModelFormat::Onnx
        } else if path.join("model.safetensors").exists() {
            ModelFormat::SafeTensors
        } else {
            ModelFormat::Candle
        };
        
        // Get size
        let size_mb = self.dir_size(path) / 1024 / 1024;
        
        Some(ModelInfo {
            name,
            path: path.to_str()?.to_string(),
            format,
            size_mb,
            parameters: "Unknown".to_string(),
            context_length: 4096,
        })
    }
    
    /// Calculate directory size
    fn dir_size(&self, path: &Path) -> usize {
        let mut total = 0;
        
        if let Ok(entries) = std::fs::read_dir(path) {
            for entry in entries.flatten() {
                let metadata = entry.metadata();
                if let Ok(meta) = metadata {
                    if meta.is_file() {
                        total += meta.len() as usize;
                    } else if meta.is_dir() {
                        total += self.dir_size(&entry.path());
                    }
                }
            }
        }
        
        total
    }
    
    /// Get model by name
    pub fn get_model(&self, name: &str) -> Option<ModelInfo> {
        let path = Path::new(&self.models_dir).join(name);
        self.scan_model_dir(&path)
    }
}

/// Model loader trait
pub trait ModelLoader: Send + Sync {
    /// Load model from path
    fn load(&self, path: &str) -> Result<Box<dyn Model>, ModelError>;
    
    /// Check if this loader can handle the format
    fn can_load(&self, path: &str) -> bool;
}

/// Model trait for inference
pub trait Model: Send + Sync {
    /// Generate next token
    fn forward(&mut self, tokens: &[u32], pos: usize) -> Result<Vec<f32>, ModelError>;
    
    /// Get vocabulary size
    fn vocab_size(&self) -> usize;
    
    /// Get context length
    fn context_length(&self) -> usize;
    
    /// Tokenize text
    fn tokenize(&self, text: &str) -> Result<Vec<u32>, ModelError>;
    
    /// Detokenize tokens
    fn detokenize(&self, tokens: &[u32]) -> Result<String, ModelError>;
    
    /// Get EOS token
    fn eos_token(&self) -> u32;
}

/// Model errors
#[derive(Debug, thiserror::Error)]
pub enum ModelError {
    #[error("Model not found: {0}")]
    NotFound(String),
    #[error("Invalid format: {0}")]
    InvalidFormat(String),
    #[error("Load error: {0}")]
    LoadError(String),
    #[error("Inference error: {0}")]
    InferenceError(String),
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),
}
