//! Enterprise-grade cryptography module
//! 
//! Features:
//! - End-to-end encryption (X25519 + AES-256-GCM)
//! - Zero-knowledge proof verification
//! - HSM integration for key operations
//! - Formal verification helpers

use aes_gcm::{
    aead::{Aead, KeyInit},
    Aes256Gcm, Nonce,
};
use argon2::{self, Config, ThreadMode, Variant};
use ed25519_dalek::{Signature, Signer, SigningKey, Verifier, VerifyingKey};
use rand::rngs::OsRng;
use rand::RngCore;
use sha2::{Digest, Sha256};
use x25519_dalek::{EphemeralSecret, PublicKey as X25519PublicKey, SharedSecret, StaticSecret};

pub mod hsm;
pub mod zk;

/// Size constants
pub const KEY_SIZE: usize = 32;
pub const NONCE_SIZE: usize = 12;
pub const TAG_SIZE: usize = 16;

/// Encrypted data container
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct EncryptedContainer {
    /// Ciphertext
    pub ciphertext: Vec<u8>,
    /// Nonce/IV
    pub nonce: [u8; NONCE_SIZE],
    /// Authentication tag (included in ciphertext for AES-GCM)
    pub version: u8,
}

/// Key pair for E2E encryption
#[derive(Debug)]
pub struct E2EKeyPair {
    /// Private key (X25519)
    pub private_key: StaticSecret,
    /// Public key (X25519)
    pub public_key: X25519PublicKey,
}

impl E2EKeyPair {
    /// Generate a new random keypair
    pub fn generate() -> Self {
        let private_key = StaticSecret::random_from_rng(OsRng);
        let public_key = X25519PublicKey::from(&private_key);
        
        Self {
            private_key,
            public_key,
        }
    }

    /// Derive shared secret with another public key
    pub fn derive_shared_secret(&self, other_public: &X25519PublicKey) -> SharedSecret {
        self.private_key.diffie_hellman(other_public)
    }

    /// Export public key as bytes
    pub fn public_key_bytes(&self) -> [u8; 32] {
        self.public_key.to_bytes()
    }
}

/// Encrypt data using AES-256-GCM
pub fn encrypt(data: &[u8], key: &[u8; 32]) -> Result<EncryptedContainer, CryptoError> {
    let cipher = Aes256Gcm::new_from_slice(key)
        .map_err(|_| CryptoError::InvalidKey)?;
    
    let mut nonce_bytes = [0u8; NONCE_SIZE];
    OsRng.fill_bytes(&mut nonce_bytes);
    let nonce = Nonce::from_slice(&nonce_bytes);
    
    let ciphertext = cipher
        .encrypt(nonce, data)
        .map_err(|_| CryptoError::EncryptionFailed)?;
    
    Ok(EncryptedContainer {
        ciphertext,
        nonce: nonce_bytes,
        version: 1,
    })
}

/// Decrypt data using AES-256-GCM
pub fn decrypt(container: &EncryptedContainer, key: &[u8; 32]) -> Result<Vec<u8>, CryptoError> {
    if container.version != 1 {
        return Err(CryptoError::UnsupportedVersion);
    }
    
    let cipher = Aes256Gcm::new_from_slice(key)
        .map_err(|_| CryptoError::InvalidKey)?;
    
    let nonce = Nonce::from_slice(&container.nonce);
    
    cipher
        .decrypt(nonce, container.ciphertext.as_ref())
        .map_err(|_| CryptoError::DecryptionFailed)
}

/// Derive encryption key from password using Argon2id
pub fn derive_key_from_password(password: &[u8], salt: &[u8]) -> Result<[u8; 32], CryptoError> {
    let config = Config {
        variant: Variant::Argon2id,
        version: argon2::Version::Version13,
        mem_cost: 65536,  // 64 MB
        time_cost: 3,     // 3 iterations
        lanes: 4,         // 4 parallel lanes
        thread_mode: ThreadMode::Parallel,
        secret: &[],
        ad: &[],
        hash_length: 32,
    };
    
    let mut key = [0u8; 32];
    argon2::hash_raw(password, salt, &config)
        .map_err(|_| CryptoError::KeyDerivationFailed)?
        .iter()
        .enumerate()
        .for_each(|(i, b)| key[i] = *b);
    
    Ok(key)
}

/// Hash data using SHA-256
pub fn hash(data: &[u8]) -> [u8; 32] {
    let mut hasher = Sha256::new();
    hasher.update(data);
    hasher.finalize().into()
}

/// Generate random bytes
pub fn random_bytes<const N: usize>() -> [u8; N] {
    let mut bytes = [0u8; N];
    OsRng.fill_bytes(&mut bytes);
    bytes
}

/// Generate a secure random nonce
pub fn generate_nonce() -> [u8; NONCE_SIZE] {
    random_bytes::<NONCE_SIZE>()
}

/// Derive a key from a shared secret using HKDF-like construction
pub fn derive_key_from_shared_secret(shared_secret: &SharedSecret, context: &[u8]) -> [u8; 32] {
    let mut hasher = Sha256::new();
    hasher.update(shared_secret.as_bytes());
    hasher.update(context);
    hasher.finalize().into()
}

/// Sign data using Ed25519
pub fn sign(data: &[u8], signing_key: &SigningKey) -> Signature {
    signing_key.sign(data)
}

/// Verify signature using Ed25519
pub fn verify(data: &[u8], signature: &Signature, verifying_key: &VerifyingKey) -> Result<(), CryptoError> {
    verifying_key
        .verify(data, signature)
        .map_err(|_| CryptoError::InvalidSignature)
}

/// Encrypt a message for a specific recipient
pub fn encrypt_e2e(
    message: &[u8],
    sender_keypair: &E2EKeyPair,
    recipient_public: &X25519PublicKey,
) -> Result<E2EMessage, CryptoError> {
    // Derive shared secret
    let shared_secret = sender_keypair.derive_shared_secret(recipient_public);
    
    // Derive encryption key
    let key = derive_key_from_shared_secret(&shared_secret, b"e2e_message_v1");
    
    // Encrypt message
    let encrypted = encrypt(message, &key)?;
    
    Ok(E2EMessage {
        sender_public: sender_keypair.public_key_bytes(),
        encrypted,
    })
}

/// Decrypt an E2E message
pub fn decrypt_e2e(
    message: &E2EMessage,
    recipient_private: &StaticSecret,
) -> Result<Vec<u8>, CryptoError> {
    // Reconstruct sender public key
    let sender_public = X25519PublicKey::from(message.sender_public);
    
    // Derive shared secret
    let shared_secret = recipient_private.diffie_hellman(&sender_public);
    
    // Derive encryption key
    let key = derive_key_from_shared_secret(&shared_secret, b"e2e_message_v1");
    
    // Decrypt
    decrypt(&message.encrypted, &key)
}

/// E2E encrypted message structure
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct E2EMessage {
    /// Sender's public key (X25519)
    pub sender_public: [u8; 32],
    /// Encrypted content
    pub encrypted: EncryptedContainer,
}

/// Crypto errors
#[derive(Debug, thiserror::Error)]
pub enum CryptoError {
    #[error("Invalid key")]
    InvalidKey,
    #[error("Encryption failed")]
    EncryptionFailed,
    #[error("Decryption failed")]
    DecryptionFailed,
    #[error("Unsupported version")]
    UnsupportedVersion,
    #[error("Key derivation failed")]
    KeyDerivationFailed,
    #[error("Invalid signature")]
    InvalidSignature,
    #[error("HSM error: {0}")]
    HsmError(String),
    #[error("ZK proof error: {0}")]
    ZkError(String),
}

/// Master key encryption key (for HSM operations)
pub struct MasterKey {
    /// Key identifier
    pub key_id: String,
    /// Encrypted key material (stored in HSM)
    pub encrypted_key: Vec<u8>,
}

impl MasterKey {
    /// Create a new master key (key material generated in HSM)
    pub async fn create_in_hsm(hsm: &dyn hsm::HsmProvider, key_id: &str) -> Result<Self, CryptoError> {
        let encrypted_key = hsm.generate_and_wrap_key(key_id).await?;
        
        Ok(Self {
            key_id: key_id.to_string(),
            encrypted_key,
        })
    }
    
    /// Unwrap a data encryption key using the master key
    pub async fn unwrap_key(
        &self,
        hsm: &dyn hsm::HsmProvider,
        wrapped_key: &[u8],
    ) -> Result<[u8; 32], CryptoError> {
        hsm.unwrap_key(&self.key_id, &self.encrypted_key, wrapped_key).await
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_e2e_encryption() {
        // Generate keypairs for Alice and Bob
        let alice = E2EKeyPair::generate();
        let bob = E2EKeyPair::generate();
        
        // Alice encrypts message for Bob
        let message = b"Hello, Bob! This is secret.";
        let encrypted = encrypt_e2e(message, &alice, &bob.public_key).unwrap();
        
        // Bob decrypts the message
        let decrypted = decrypt_e2e(&encrypted, &bob.private_key).unwrap();
        
        assert_eq!(message.to_vec(), decrypted);
    }

    #[test]
    fn test_symmetric_encryption() {
        let key = random_bytes::<32>();
        let plaintext = b"Secret message";
        
        let encrypted = encrypt(plaintext, &key).unwrap();
        let decrypted = decrypt(&encrypted, &key).unwrap();
        
        assert_eq!(plaintext.to_vec(), decrypted);
    }

    #[test]
    fn test_key_derivation() {
        let password = b"my_secure_password";
        let salt = random_bytes::<16>();
        
        let key1 = derive_key_from_password(password, &salt).unwrap();
        let key2 = derive_key_from_password(password, &salt).unwrap();
        
        assert_eq!(key1, key2);
        
        // Different salt = different key
        let salt2 = random_bytes::<16>();
        let key3 = derive_key_from_password(password, &salt2).unwrap();
        
        assert_ne!(key1, key3);
    }
}
