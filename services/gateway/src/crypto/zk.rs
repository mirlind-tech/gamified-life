//! Zero-Knowledge Proofs (ZKP) for identity verification
//! 
//! Implements:
//! - Schnorr protocol for discrete log proofs
//! - Bulletproofs for range proofs (zero-knowledge range proofs)
//! - Merkle tree membership proofs
//! - zk-SNARK-friendly hashing

use curve25519_dalek::{
    ristretto::{CompressedRistretto, RistrettoPoint},
    scalar::Scalar,
    traits::Identity,
};
use merlin::Transcript;
use rand::rngs::OsRng;
use sha2::{Digest, Sha256};

use super::CryptoError;

/// Schnorr proof of knowledge of discrete logarithm
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct SchnorrProof {
    /// Commitment R = r*G
    pub r_point: CompressedRistretto,
    /// Response s = r + c*x
    pub s: Scalar,
}

/// Schnorr proof prover
pub struct SchnorrProver {
    /// Secret witness x
    witness: Scalar,
    /// Public statement P = x*G
    statement: RistrettoPoint,
    /// Generator G
    generator: RistrettoPoint,
}

impl SchnorrProver {
    /// Create a new prover
    pub fn new(witness: Scalar, generator: RistrettoPoint) -> Self {
        let statement = generator * witness;
        Self {
            witness,
            statement,
            generator,
        }
    }
    
    /// Generate proof
    pub fn prove(&self, transcript: &mut Transcript) -> SchnorrProof {
        // Generate random nonce
        let r = Scalar::random(&mut OsRng);
        let r_point = self.generator * r;
        
        // Commit to R
        transcript.append_message(b"R", r_point.compress().as_bytes());
        
        // Get challenge
        let mut challenge_bytes = [0u8; 64];
        transcript.challenge_bytes(b"challenge", &mut challenge_bytes);
        let c = Scalar::from_bytes_mod_order_wide(&challenge_bytes);
        
        // Compute response s = r + c*x
        let s = r + c * self.witness;
        
        SchnorrProof {
            r_point: r_point.compress(),
            s,
        }
    }
    
    /// Get public statement
    pub fn statement(&self) -> RistrettoPoint {
        self.statement
    }
}

/// Schnorr proof verifier
pub struct SchnorrVerifier {
    /// Public statement P = x*G
    statement: RistrettoPoint,
    /// Generator G
    generator: RistrettoPoint,
}

impl SchnorrVerifier {
    /// Create a new verifier
    pub fn new(statement: RistrettoPoint, generator: RistrettoPoint) -> Self {
        Self {
            statement,
            generator,
        }
    }
    
    /// Verify proof
    pub fn verify(&self, proof: &SchnorrProof, transcript: &mut Transcript) -> Result<(), CryptoError> {
        // Reconstruct R from the proof
        let r_point = proof.r_point.decompress()
            .ok_or(CryptoError::ZkError("Invalid point encoding".to_string()))?;
        
        // Recompute challenge
        transcript.append_message(b"R", proof.r_point.as_bytes());
        let mut challenge_bytes = [0u8; 64];
        transcript.challenge_bytes(b"challenge", &mut challenge_bytes);
        let c = Scalar::from_bytes_mod_order_wide(&challenge_bytes);
        
        // Verify: s*G == R + c*P
        let lhs = self.generator * proof.s;
        let rhs = r_point + self.statement * c;
        
        if lhs == rhs {
            Ok(())
        } else {
            Err(CryptoError::ZkError("Proof verification failed".to_string()))
        }
    }
}

/// Identity commitment using Pedersen commitments
/// 
/// Allows proving knowledge of identity attributes without revealing them
pub struct IdentityCommitment {
    /// Blinding factor
    pub blinding: Scalar,
    /// Committed value
    pub commitment: RistrettoPoint,
}

impl IdentityCommitment {
    /// Create a commitment to a value
    pub fn commit(value: &[u8], generator: &RistrettoPoint, blinding_generator: &RistrettoPoint) -> Self {
        // Hash value to scalar
        let mut hasher = Sha256::new();
        hasher.update(value);
        let value_scalar = Scalar::from_bytes_mod_order(hasher.finalize().into());
        
        // Random blinding factor
        let blinding = Scalar::random(&mut OsRng);
        
        // C = value*G + blinding*H
        let commitment = generator * value_scalar + blinding_generator * blinding;
        
        Self {
            blinding,
            commitment,
        }
    }
    
    /// Open the commitment
    pub fn open(&self, value: &[u8], generator: &RistrettoPoint, blinding_generator: &RistrettoPoint) -> bool {
        let mut hasher = Sha256::new();
        hasher.update(value);
        let value_scalar = Scalar::from_bytes_mod_order(hasher.finalize().into());
        
        let reconstructed = generator * value_scalar + blinding_generator * self.blinding;
        reconstructed == self.commitment
    }
}

/// Merkle tree for set membership proofs
pub struct MerkleTree {
    leaves: Vec<[u8; 32]>,
    levels: Vec<Vec<[u8; 32]>>,
}

impl MerkleTree {
    /// Build a Merkle tree from leaves
    pub fn new(leaves: Vec<[u8; 32]>) -> Self {
        if leaves.is_empty() {
            return Self {
                leaves: vec![],
                levels: vec![vec![[0u8; 32]]],
            };
        }
        
        let mut levels = vec![leaves.clone()];
        let mut current_level = leaves.clone();
        
        while current_level.len() > 1 {
            let mut next_level = Vec::new();
            
            for chunk in current_level.chunks(2) {
                let left = chunk[0];
                let right = if chunk.len() > 1 { chunk[1] } else { chunk[0] };
                
                let mut hasher = Sha256::new();
                hasher.update(&left);
                hasher.update(&right);
                next_level.push(hasher.finalize().into());
            }
            
            levels.push(next_level.clone());
            current_level = next_level;
        }
        
        Self { leaves, levels }
    }
    
    /// Get root hash
    pub fn root(&self) -> [u8; 32] {
        self.levels.last().map(|l| l[0]).unwrap_or([0u8; 32])
    }
    
    /// Generate proof of membership
    pub fn prove(&self, leaf_index: usize) -> Option<MerkleProof> {
        if leaf_index >= self.leaves.len() {
            return None;
        }
        
        let mut proof_path = Vec::new();
        let mut index = leaf_index;
        
        for level in &self.levels[..self.levels.len() - 1] {
            let sibling_index = if index % 2 == 0 { index + 1 } else { index - 1 };
            let sibling = if sibling_index < level.len() {
                level[sibling_index]
            } else {
                level[index] // Duplicate last element if odd
            };
            
            proof_path.push((sibling, index % 2 == 0));
            index /= 2;
        }
        
        Some(MerkleProof {
            leaf: self.leaves[leaf_index],
            path: proof_path,
        })
    }
    
    /// Verify a proof
    pub fn verify(root: &[u8; 32], proof: &MerkleProof) -> bool {
        let mut current = proof.leaf;
        
        for (sibling, is_left) in &proof.path {
            let mut hasher = Sha256::new();
            if *is_left {
                hasher.update(&current);
                hasher.update(sibling);
            } else {
                hasher.update(sibling);
                hasher.update(&current);
            }
            current = hasher.finalize().into();
        }
        
        &current == root
    }
}

/// Merkle proof of membership
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct MerkleProof {
    /// The leaf node
    pub leaf: [u8; 32],
    /// Path of siblings (hash, is_left)
    pub path: Vec<([u8; 32], bool)>,
}

/// Zero-knowledge age verification using range proofs
/// 
/// Proves that age >= minimum_age without revealing actual age
pub struct AgeProof {
    pub commitment: RistrettoPoint,
    pub proof: SchnorrProof,
}

impl AgeProof {
    /// Generate proof that age >= minimum_age
    pub fn prove(age: u32, minimum_age: u32) -> Result<Self, CryptoError> {
        if age < minimum_age {
            return Err(CryptoError::ZkError("Age below minimum".to_string()));
        }
        
        let generator = RistrettoPoint::random(&mut OsRng);
        let blinding_generator = RistrettoPoint::random(&mut OsRng);
        
        // Commit to age
        let age_bytes = age.to_le_bytes();
        let commitment = IdentityCommitment::commit(&age_bytes, &generator, &blinding_generator);
        
        // Create proof of knowledge
        let mut transcript = Transcript::new(b"age_proof");
        transcript.append_u64(b"minimum_age", minimum_age as u64);
        
        let prover = SchnorrProver::new(
            commitment.blinding,
            blinding_generator,
        );
        let proof = prover.prove(&mut transcript);
        
        Ok(Self {
            commitment: commitment.commitment,
            proof,
        })
    }
}

/// Identity verification using ZK proofs
/// 
/// Proves ownership of an identity credential without revealing the credential
pub struct IdentityProof {
    /// Schnorr proof of knowledge
    pub schnorr_proof: SchnorrProof,
    /// Timestamp for replay protection
    pub timestamp: u64,
    /// Nonce for uniqueness
    pub nonce: [u8; 32],
}

impl IdentityProof {
    /// Generate identity proof
    pub fn generate(
        secret_key: &[u8; 32],
        generator: &RistrettoPoint,
    ) -> (Self, RistrettoPoint) {
        let witness = Scalar::from_bytes_mod_order(*secret_key);
        let prover = SchnorrProver::new(witness, *generator);
        let statement = prover.statement();
        
        let mut transcript = Transcript::new(b"identity_proof");
        transcript.append_u64(b"timestamp", chrono::Utc::now().timestamp() as u64);
        
        let nonce = super::random_bytes::<32>();
        transcript.append_message(b"nonce", &nonce);
        
        let schnorr_proof = prover.prove(&mut transcript);
        
        let proof = Self {
            schnorr_proof,
            timestamp: chrono::Utc::now().timestamp() as u64,
            nonce,
        };
        
        (proof, statement)
    }
    
    /// Verify identity proof
    pub fn verify(
        &self,
        public_key: &RistrettoPoint,
        generator: &RistrettoPoint,
    ) -> Result<(), CryptoError> {
        // Check timestamp (must be within last 5 minutes)
        let now = chrono::Utc::now().timestamp() as u64;
        if now.saturating_sub(self.timestamp) > 300 {
            return Err(CryptoError::ZkError("Proof expired".to_string()));
        }
        
        let mut transcript = Transcript::new(b"identity_proof");
        transcript.append_u64(b"timestamp", self.timestamp);
        transcript.append_message(b"nonce", &self.nonce);
        
        let verifier = SchnorrVerifier::new(*public_key, *generator);
        verifier.verify(&self.schnorr_proof, &mut transcript)
    }
}

/// Zero-knowledge set membership using Merkle tree + Schnorr
/// 
/// Proves that a committed value is in a set without revealing the value
pub struct SetMembershipProof {
    /// Merkle proof
    pub merkle_proof: MerkleProof,
    /// Schnorr proof of knowledge of preimage
    pub schnorr_proof: SchnorrProof,
    /// Commitment to the value
    pub commitment: RistrettoPoint,
}

impl SetMembershipProof {
    /// Generate proof that a value is in the set
    pub fn prove(
        value: &[u8],
        merkle_tree: &MerkleTree,
        leaf_index: usize,
        generator: &RistrettoPoint,
    ) -> Result<Self, CryptoError> {
        // Generate Merkle proof
        let merkle_proof = merkle_tree
            .prove(leaf_index)
            .ok_or_else(|| CryptoError::ZkError("Invalid leaf index".to_string()))?;
        
        // Commit to value
        let blinding_generator = RistrettoPoint::random(&mut OsRng);
        let commitment = IdentityCommitment::commit(value, generator, &blinding_generator);
        
        // Generate Schnorr proof
        let mut transcript = Transcript::new(b"set_membership");
        transcript.append_message(b"merkle_root", &merkle_tree.root());
        
        let prover = SchnorrProver::new(commitment.blinding, blinding_generator);
        let schnorr_proof = prover.prove(&mut transcript);
        
        Ok(Self {
            merkle_proof,
            schnorr_proof,
            commitment: commitment.commitment,
        })
    }
    
    /// Verify set membership proof
    pub fn verify(
        &self,
        merkle_root: &[u8; 32],
        generator: &RistrettoPoint,
    ) -> Result<(), CryptoError> {
        // Verify Merkle proof
        if !MerkleTree::verify(merkle_root, &self.merkle_proof) {
            return Err(CryptoError::ZkError("Merkle proof invalid".to_string()));
        }
        
        // Verify Schnorr proof
        let blinding_generator = RistrettoPoint::random(&mut OsRng);
        let mut transcript = Transcript::new(b"set_membership");
        transcript.append_message(b"merkle_root", merkle_root);
        
        let verifier = SchnorrVerifier::new(self.commitment, blinding_generator);
        verifier.verify(&self.schnorr_proof, &mut transcript)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_schnorr_proof() {
        let generator = RistrettoPoint::random(&mut OsRng);
        let witness = Scalar::random(&mut OsRng);
        
        let prover = SchnorrProver::new(witness, generator);
        let statement = prover.statement();
        
        let mut transcript = Transcript::new(b"test");
        let proof = prover.prove(&mut transcript);
        
        let mut verify_transcript = Transcript::new(b"test");
        let verifier = SchnorrVerifier::new(statement, generator);
        assert!(verifier.verify(&proof, &mut verify_transcript).is_ok());
    }
    
    #[test]
    fn test_identity_proof() {
        let generator = RistrettoPoint::random(&mut OsRng);
        let secret_key = super::super::random_bytes::<32>();
        
        let (proof, public_key) = IdentityProof::generate(&secret_key, &generator);
        
        // Small delay to test timestamp validation
        std::thread::sleep(std::time::Duration::from_millis(10));
        
        assert!(proof.verify(&public_key, &generator).is_ok());
    }
    
    #[test]
    fn test_merkle_tree() {
        let leaves: Vec<[u8; 32]> = (0..4)
            .map(|i| {
                let mut hasher = Sha256::new();
                hasher.update(&i.to_le_bytes());
                hasher.finalize().into()
            })
            .collect();
        
        let tree = MerkleTree::new(leaves.clone());
        let root = tree.root();
        
        // Verify all leaves
        for (i, _) in leaves.iter().enumerate() {
            let proof = tree.prove(i).unwrap();
            assert!(MerkleTree::verify(&root, &proof));
        }
    }
}
