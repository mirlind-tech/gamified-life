//! Inference utilities for AI models
//! 
//! Handles token generation, sampling strategies, and prompt formatting

use candle_core::{Device, Tensor};
use rand::distributions::Distribution;

/// Sampling strategy for token generation
#[derive(Debug, Clone, Copy)]
pub enum SamplingStrategy {
    /// Greedy decoding (always pick highest probability)
    Greedy,
    /// Temperature sampling
    Temperature { temperature: f64 },
    /// Top-p (nucleus) sampling
    TopP { temperature: f64, top_p: f64 },
    /// Top-k sampling
    TopK { temperature: f64, top_k: usize },
}

impl Default for SamplingStrategy {
    fn default() -> Self {
        Self::TopP {
            temperature: 0.7,
            top_p: 0.9,
        }
    }
}

impl SamplingStrategy {
    /// Sample a token from logits
    pub fn sample(&self, logits: &Tensor, device: &Device) -> Result<u32, candle_core::Error> {
        match self {
            Self::Greedy => Self::sample_greedy(logits),
            Self::Temperature { temperature } => {
                Self::sample_temperature(logits, *temperature, device)
            }
            Self::TopP { temperature, top_p } => {
                Self::sample_top_p(logits, *temperature, *top_p, device)
            }
            Self::TopK { temperature, top_k } => {
                Self::sample_top_k(logits, *temperature, *top_k, device)
            }
        }
    }
    
    /// Greedy sampling - pick the most likely token
    fn sample_greedy(logits: &Tensor) -> Result<u32, candle_core::Error> {
        let logits_v = logits.to_vec1::<f32>()?;
        let next_token = logits_v
            .iter()
            .enumerate()
            .max_by(|(_, u), (_, v)| u.total_cmp(v))
            .map(|(i, _)| i as u32)
            .unwrap_or(0);
        Ok(next_token)
    }
    
    /// Temperature sampling
    fn sample_temperature(
        logits: &Tensor,
        temperature: f64,
        device: &Device,
    ) -> Result<u32, candle_core::Error> {
        let prs = Self::softmax(logits, temperature, device)?;
        Self::sample_from_probs(&prs)
    }
    
    /// Top-p (nucleus) sampling
    fn sample_top_p(
        logits: &Tensor,
        temperature: f64,
        top_p: f64,
        device: &Device,
    ) -> Result<u32, candle_core::Error> {
        let mut logits_v = logits.to_vec1::<f32>()?;
        
        // Sort by probability
        let mut indexed: Vec<(usize, f32)> = logits_v.iter().cloned().enumerate().collect();
        indexed.sort_by(|(_, a), (_, b)| b.partial_cmp(a).unwrap());
        
        // Compute softmax
        let max_logit = indexed[0].1;
        let exp_sum: f32 = indexed
            .iter()
            .map(|(_, l)| ((*l - max_logit) as f64 / temperature).exp() as f32)
            .sum();
        
        // Find cutoff
        let mut cumsum = 0.0;
        let mut cutoff_idx = indexed.len();
        for (i, (_, l)) in indexed.iter().enumerate() {
            let prob = ((*l - max_logit) as f64 / temperature).exp() as f32 / exp_sum;
            cumsum += prob;
            if cumsum > top_p as f32 {
                cutoff_idx = i + 1;
                break;
            }
        }
        
        // Mask out tokens below cutoff
        for (idx, _) in indexed.iter().skip(cutoff_idx) {
            logits_v[*idx] = f32::NEG_INFINITY;
        }
        
        let pruned = Tensor::new(logits_v, device)?;
        Self::sample_temperature(&pruned, temperature, device)
    }
    
    /// Top-k sampling
    fn sample_top_k(
        logits: &Tensor,
        temperature: f64,
        top_k: usize,
        device: &Device,
    ) -> Result<u32, candle_core::Error> {
        let mut logits_v = logits.to_vec1::<f32>()?;
        
        // Find top-k indices
        let mut indexed: Vec<(usize, f32)> = logits_v.iter().cloned().enumerate().collect();
        indexed.sort_by(|(_, a), (_, b)| b.partial_cmp(a).unwrap());
        
        // Mask out tokens not in top-k
        let top_k_indices: std::collections::HashSet<usize> = 
            indexed.iter().take(top_k).map(|(i, _)| *i).collect();
        
        for (i, logit) in logits_v.iter_mut().enumerate() {
            if !top_k_indices.contains(&i) {
                *logit = f32::NEG_INFINITY;
            }
        }
        
        let pruned = Tensor::new(logits_v, device)?;
        Self::sample_temperature(&pruned, temperature, device)
    }
    
    /// Softmax with temperature
    fn softmax(logits: &Tensor, temperature: f64, device: &Device) -> Result<Vec<f32>, candle_core::Error> {
        let logits_v = logits.to_vec1::<f32>()?;
        let max_logit = logits_v.iter().cloned().fold(f32::NEG_INFINITY, f32::max);
        
        let exp_vals: Vec<f32> = logits_v
            .iter()
            .map(|l| ((*l - max_logit) as f64 / temperature).exp() as f32)
            .collect();
        
        let sum_exp: f32 = exp_vals.iter().sum();
        let probs: Vec<f32> = exp_vals.iter().map(|e| e / sum_exp).collect();
        
        Ok(probs)
    }
    
    /// Sample from probability distribution
    fn sample_from_probs(probs: &[f32]) -> Result<u32, candle_core::Error> {
        let mut rng = rand::thread_rng();
        let dist = rand::distributions::WeightedIndex::new(probs)
            .map_err(|e| candle_core::Error::Msg(e.to_string()))?;
        Ok(dist.sample(&mut rng) as u32)
    }
}

/// Text generation parameters
#[derive(Debug, Clone)]
pub struct GenerationParams {
    /// Maximum number of tokens to generate
    pub max_tokens: usize,
    /// Sampling strategy
    pub sampling: SamplingStrategy,
    /// Stop sequences
    pub stop_sequences: Vec<String>,
    /// Repetition penalty
    pub repetition_penalty: f32,
}

impl Default for GenerationParams {
    fn default() -> Self {
        Self {
            max_tokens: 512,
            sampling: SamplingStrategy::default(),
            stop_sequences: vec!["<|endoftext|>".to_string(), "<|user|>".to_string()],
            repetition_penalty: 1.1,
        }
    }
}

/// Format prompts for different model types
pub struct PromptFormatter;

impl PromptFormatter {
    /// Format for Llama-3
    pub fn llama3(system: &str, user: &str, context: Option<&str>) -> String {
        let mut prompt = format!("<|begin_of_text|><|start_header_id|>system<|end_header_id|>\n\n{}", system);
        
        if let Some(ctx) = context {
            prompt.push_str(&format!("\n\nContext:\n{}", ctx));
        }
        
        prompt.push_str(&format!(
            "<|eot_id|><|start_header_id|>user<|end_header_id|>\n\n{}<|eot_id|><|start_header_id|>assistant<|end_header_id|>\n\n",
            user
        ));
        
        prompt
    }
    
    /// Format for Mistral
    pub fn mistral(system: &str, user: &str, context: Option<&str>) -> String {
        let mut prompt = format!("<s>[INST] <<SYS>>\n{}\n<</SYS>>\n\n", system);
        
        if let Some(ctx) = context {
            prompt.push_str(&format!("Context: {}\n\n", ctx));
        }
        
        prompt.push_str(&format!("{} [/INST]", user));
        
        prompt
    }
    
    /// Format for custom Mirlind Protocol model
    pub fn mirlind(user: &str, context: Option<&str>) -> String {
        let system = "You are the AI Coach for Mirlind Protocol. You help users optimize their life through discipline, tracking their 5 pillars (Body, Mind, German, Code, Finance), and maintaining daily protocols. Be direct, actionable, and data-driven.";
        
        let mut prompt = format!("<|system|>\n{}\n", system);
        
        if let Some(ctx) = context {
            prompt.push_str(&format!("<|context|>\n{}\n", ctx));
        }
        
        prompt.push_str(&format!("<|user|>\n{}\n<|assistant|>\n", user));
        
        prompt
    }
}

/// Repetition penalty logits processor
pub fn apply_repetition_penalty(
    logits: &Tensor,
    prev_tokens: &[u32],
    penalty: f32,
) -> Result<Tensor, candle_core::Error> {
    let device = logits.device();
    let mut logits_v = logits.to_vec1::<f32>()?;
    
    for token_id in prev_tokens {
        let idx = *token_id as usize;
        if idx < logits_v.len() {
            if logits_v[idx] > 0.0 {
                logits_v[idx] /= penalty;
            } else {
                logits_v[idx] *= penalty;
            }
        }
    }
    
    Tensor::new(logits_v, device)
}

/// Check if generated text should stop
pub fn should_stop(text: &str, stop_sequences: &[String]) -> bool {
    stop_sequences.iter().any(|seq| text.contains(seq))
}

#[cfg(test)]
mod tests {
    use super::*;
    use candle_core::Device;
    
    #[test]
    fn test_sampling_greedy() {
        let device = Device::Cpu;
        let logits = Tensor::new(&[0.1f32, 0.5, 0.3, 0.1], &device).unwrap();
        
        let strategy = SamplingStrategy::Greedy;
        let token = strategy.sample(&logits, &device).unwrap();
        
        assert_eq!(token, 1); // Index of highest value
    }
    
    #[test]
    fn test_prompt_formatter() {
        let prompt = PromptFormatter::mirlind("How do I improve discipline?", None);
        assert!(prompt.contains("AI Coach"));
        assert!(prompt.contains("<|user|>"));
        assert!(prompt.contains("<|assistant|>"));
    }
    
    #[test]
    fn test_should_stop() {
        let stop_seqs = vec!["<|end|>".to_string(), "STOP".to_string()];
        
        assert!(should_stop("Hello<|end|>", &stop_seqs));
        assert!(should_stop("STOP now", &stop_seqs));
        assert!(!should_stop("Hello world", &stop_seqs));
    }
}
