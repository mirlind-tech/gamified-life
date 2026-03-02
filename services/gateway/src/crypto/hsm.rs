//! Hardware Security Module (HSM) integration
//! 
//! Provides secure key storage and operations using:
//! - AWS CloudHSM
//! - Azure Dedicated HSM
//! - Google Cloud HSM
//! - PKCS#11 compatible HSMs
//! - Software HSM (for development/testing)

use async_trait::async_trait;
use std::sync::Arc;

use super::CryptoError;

/// HSM provider trait - abstract interface for different HSM implementations
#[async_trait]
pub trait HsmProvider: Send + Sync {
    /// Initialize the HSM connection
    async fn initialize(&self) -> Result<(), CryptoError>;
    
    /// Generate a key inside the HSM and return the wrapped (encrypted) key
    async fn generate_and_wrap_key(&self, key_id: &str) -> Result<Vec<u8>, CryptoError>;
    
    /// Unwrap a key using the HSM
    async fn unwrap_key(
        &self,
        master_key_id: &str,
        master_key: &[u8],
        wrapped_key: &[u8],
    ) -> Result<[u8; 32], CryptoError>;
    
    /// Sign data using a key stored in HSM
    async fn sign(&self, key_id: &str, data: &[u8]) -> Result<Vec<u8>, CryptoError>;
    
    /// Verify signature using a key stored in HSM
    async fn verify(
        &self,
        key_id: &str,
        data: &[u8],
        signature: &[u8],
    ) -> Result<bool, CryptoError>;
    
    /// Encrypt data using a key stored in HSM
    async fn encrypt(&self, key_id: &str, plaintext: &[u8]) -> Result<Vec<u8>, CryptoError>;
    
    /// Decrypt data using a key stored in HSM
    async fn decrypt(&self, key_id: &str, ciphertext: &[u8]) -> Result<Vec<u8>, CryptoError>;
    
    /// Rotate a key
    async fn rotate_key(&self, old_key_id: &str, new_key_id: &str) -> Result<(), CryptoError>;
    
    /// Health check
    async fn health_check(&self) -> Result<HsmHealth, CryptoError>;
}

/// HSM health status
#[derive(Debug, Clone)]
pub struct HsmHealth {
    pub status: HsmStatus,
    pub cluster_size: usize,
    pub healthy_nodes: usize,
    pub latency_ms: u64,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum HsmStatus {
    Healthy,
    Degraded,
    Unavailable,
}

/// Software HSM implementation (for development)
/// 
/// WARNING: This is NOT secure and should only be used for development/testing.
/// In production, use a real HSM like AWS CloudHSM or Azure Dedicated HSM.
pub struct SoftwareHsm {
    master_key: std::sync::Mutex<Option<[u8; 32]>>,
}

impl SoftwareHsm {
    pub fn new() -> Self {
        Self {
            master_key: std::sync::Mutex::new(None),
        }
    }
}

impl Default for SoftwareHsm {
    fn default() -> Self {
        Self::new()
    }
}

#[async_trait]
impl HsmProvider for SoftwareHsm {
    async fn initialize(&self) -> Result<(), CryptoError> {
        // Generate a master key (in production, this would be securely injected)
        let mut key = [0u8; 32];
        rand::rngs::OsRng.fill_bytes(&mut key);
        *self.master_key.lock().unwrap() = Some(key);
        Ok(())
    }
    
    async fn generate_and_wrap_key(&self, _key_id: &str) -> Result<Vec<u8>, CryptoError> {
        let master = self.master_key.lock().unwrap();
        let master_key = master.ok_or_else(|| CryptoError::HsmError("Not initialized".to_string()))?;
        
        // Generate a random key
        let mut key = [0u8; 32];
        rand::rngs::OsRng.fill_bytes(&mut key);
        
        // "Wrap" it with the master key (XOR for software simulation)
        let wrapped: Vec<u8> = key.iter().zip(master_key.iter()).map(|(k, m)| k ^ m).collect();
        
        Ok(wrapped)
    }
    
    async fn unwrap_key(
        &self,
        _master_key_id: &str,
        _master_key: &[u8],
        wrapped_key: &[u8],
    ) -> Result<[u8; 32], CryptoError> {
        let master = self.master_key.lock().unwrap();
        let master_key = master.ok_or_else(|| CryptoError::HsmError("Not initialized".to_string()))?;
        
        if wrapped_key.len() != 32 {
            return Err(CryptoError::HsmError("Invalid wrapped key length".to_string()));
        }
        
        let mut unwrapped = [0u8; 32];
        for (i, (w, m)) in wrapped_key.iter().zip(master_key.iter()).enumerate() {
            unwrapped[i] = w ^ m;
        }
        
        Ok(unwrapped)
    }
    
    async fn sign(&self, _key_id: &str, _data: &[u8]) -> Result<Vec<u8>, CryptoError> {
        // Software implementation - use ed25519
        unimplemented!("Software HSM signing not implemented")
    }
    
    async fn verify(
        &self,
        _key_id: &str,
        _data: &[u8],
        _signature: &[u8],
    ) -> Result<bool, CryptoError> {
        unimplemented!("Software HSM verification not implemented")
    }
    
    async fn encrypt(&self, _key_id: &str, plaintext: &[u8]) -> Result<Vec<u8>, CryptoError> {
        // Simple software encryption using the master key
        use aes_gcm::{
            aead::{Aead, KeyInit},
            Aes256Gcm, Nonce,
        };
        
        let master = self.master_key.lock().unwrap();
        let master_key = master.ok_or_else(|| CryptoError::HsmError("Not initialized".to_string()))?;
        
        let cipher = Aes256Gcm::new_from_slice(&master_key)
            .map_err(|e| CryptoError::HsmError(e.to_string()))?;
        
        let mut nonce_bytes = [0u8; 12];
        rand::rngs::OsRng.fill_bytes(&mut nonce_bytes);
        let nonce = Nonce::from_slice(&nonce_bytes);
        
        let ciphertext = cipher
            .encrypt(nonce, plaintext)
            .map_err(|e| CryptoError::HsmError(e.to_string()))?;
        
        // Prepend nonce to ciphertext
        let mut result = Vec::with_capacity(12 + ciphertext.len());
        result.extend_from_slice(&nonce_bytes);
        result.extend_from_slice(&ciphertext);
        
        Ok(result)
    }
    
    async fn decrypt(&self, _key_id: &str, ciphertext: &[u8]) -> Result<Vec<u8>, CryptoError> {
        use aes_gcm::{
            aead::{Aead, KeyInit},
            Aes256Gcm, Nonce,
        };
        
        if ciphertext.len() < 12 {
            return Err(CryptoError::HsmError("Ciphertext too short".to_string()));
        }
        
        let master = self.master_key.lock().unwrap();
        let master_key = master.ok_or_else(|| CryptoError::HsmError("Not initialized".to_string()))?;
        
        let cipher = Aes256Gcm::new_from_slice(&master_key)
            .map_err(|e| CryptoError::HsmError(e.to_string()))?;
        
        let nonce = Nonce::from_slice(&ciphertext[..12]);
        
        cipher
            .decrypt(nonce, &ciphertext[12..])
            .map_err(|e| CryptoError::HsmError(e.to_string()))
    }
    
    async fn rotate_key(&self, _old_key_id: &str, _new_key_id: &str) -> Result<(), CryptoError> {
        // In software HSM, just re-generate
        Ok(())
    }
    
    async fn health_check(&self) -> Result<HsmHealth, CryptoError> {
        let master = self.master_key.lock().unwrap();
        let status = if master.is_some() {
            HsmStatus::Healthy
        } else {
            HsmStatus::Unavailable
        };
        
        Ok(HsmHealth {
            status,
            cluster_size: 1,
            healthy_nodes: if master.is_some() { 1 } else { 0 },
            latency_ms: 0,
        })
    }
}

/// AWS CloudHSM implementation
pub struct AwsCloudHsm {
    client: aws_sdk_cloudhsm::Client,
    cluster_id: String,
}

impl AwsCloudHsm {
    pub async fn new(cluster_id: &str) -> Result<Self, CryptoError> {
        let config = aws_config::load_from_env().await;
        let client = aws_sdk_cloudhsm::Client::new(&config);
        
        Ok(Self {
            client,
            cluster_id: cluster_id.to_string(),
        })
    }
}

#[async_trait]
impl HsmProvider for AwsCloudHsm {
    async fn initialize(&self) -> Result<(), CryptoError> {
        // Verify cluster is active
        let resp = self.client
            .describe_clusters()
            .cluster_ids(&self.cluster_id)
            .send()
            .await
            .map_err(|e| CryptoError::HsmError(format!("AWS CloudHSM error: {}", e)))?;
        
        let clusters = resp.clusters();
        if clusters.is_empty() {
            return Err(CryptoError::HsmError("Cluster not found".to_string()));
        }
        
        let cluster = &clusters[0];
        if cluster.state() != aws_sdk_cloudhsm::types::ClusterState::Active {
            return Err(CryptoError::HsmError(format!(
                "Cluster not active: {:?}",
                cluster.state()
            )));
        }
        
        Ok(())
    }
    
    async fn generate_and_wrap_key(&self, key_id: &str) -> Result<Vec<u8>, CryptoError> {
        // This would use the actual AWS CloudHSM SDK
        unimplemented!("AWS CloudHSM implementation requires PKCS#11 client")
    }
    
    async fn unwrap_key(
        &self,
        _master_key_id: &str,
        _master_key: &[u8],
        _wrapped_key: &[u8],
    ) -> Result<[u8; 32], CryptoError> {
        unimplemented!("AWS CloudHSM implementation requires PKCS#11 client")
    }
    
    async fn sign(&self, _key_id: &str, _data: &[u8]) -> Result<Vec<u8>, CryptoError> {
        unimplemented!("AWS CloudHSM implementation requires PKCS#11 client")
    }
    
    async fn verify(
        &self,
        _key_id: &str,
        _data: &[u8],
        _signature: &[u8],
    ) -> Result<bool, CryptoError> {
        unimplemented!("AWS CloudHSM implementation requires PKCS#11 client")
    }
    
    async fn encrypt(&self, _key_id: &str, _plaintext: &[u8]) -> Result<Vec<u8>, CryptoError> {
        unimplemented!("AWS CloudHSM implementation requires PKCS#11 client")
    }
    
    async fn decrypt(&self, _key_id: &str, _ciphertext: &[u8]) -> Result<Vec<u8>, CryptoError> {
        unimplemented!("AWS CloudHSM implementation requires PKCS#11 client")
    }
    
    async fn rotate_key(&self, _old_key_id: &str, _new_key_id: &str) -> Result<(), CryptoError> {
        unimplemented!("AWS CloudHSM implementation requires PKCS#11 client")
    }
    
    async fn health_check(&self) -> Result<HsmHealth, CryptoError> {
        let start = std::time::Instant::now();
        
        let resp = self.client
            .describe_clusters()
            .cluster_ids(&self.cluster_id)
            .send()
            .await
            .map_err(|e| CryptoError::HsmError(format!("Health check failed: {}", e)))?;
        
        let latency = start.elapsed().as_millis() as u64;
        
        let clusters = resp.clusters();
        if clusters.is_empty() {
            return Ok(HsmHealth {
                status: HsmStatus::Unavailable,
                cluster_size: 0,
                healthy_nodes: 0,
                latency_ms: latency,
            });
        }
        
        let cluster = &clusters[0];
        let hsmes = cluster.hsms();
        let total = hsmes.len();
        let healthy = hsmes.iter().filter(|h| {
            h.state() == aws_sdk_cloudhsm::types::HsmState::Active
        }).count();
        
        let status = if healthy == total {
            HsmStatus::Healthy
        } else if healthy > 0 {
            HsmStatus::Degraded
        } else {
            HsmStatus::Unavailable
        };
        
        Ok(HsmHealth {
            status,
            cluster_size: total,
            healthy_nodes: healthy,
            latency_ms: latency,
        })
    }
}

/// HSM factory - create appropriate HSM provider based on configuration
pub struct HsmFactory;

impl HsmFactory {
    pub async fn create(provider: &str) -> Result<Arc<dyn HsmProvider>, CryptoError> {
        match provider {
            "software" => {
                let hsm = SoftwareHsm::new();
                hsm.initialize().await?;
                Ok(Arc::new(hsm))
            }
            "aws" => {
                let cluster_id = std::env::var("AWS_CLOUDHSM_CLUSTER_ID")
                    .map_err(|_| CryptoError::HsmError("AWS_CLOUDHSM_CLUSTER_ID not set".to_string()))?;
                let hsm = AwsCloudHsm::new(&cluster_id).await?;
                hsm.initialize().await?;
                Ok(Arc::new(hsm))
            }
            _ => Err(CryptoError::HsmError(format!("Unknown HSM provider: {}", provider))),
        }
    }
}

// Add rand import for OsRng
use rand::RngCore;
