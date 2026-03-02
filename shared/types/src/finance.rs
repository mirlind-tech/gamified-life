use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};

use crate::{Id, Timestamp};

/// Wallet structure
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Wallet {
    pub id: Id,
    pub user_id: Id,
    pub wallet_type: WalletType,
    pub name: String,
    pub address: String,
    pub blockchain: Blockchain,
    pub balances: Vec<Balance>,
    pub total_value_usd: Decimal,
    pub created_at: Timestamp,
    pub is_default: bool,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum WalletType {
    SelfCustody,   // User controls keys
    SmartContract, // MPC or multisig
    Lightning,     // Bitcoin Lightning
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum Blockchain {
    Bitcoin,
    Ethereum,
    Solana,
    Polygon,
    Arbitrum,
    Base,
    Optimism,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Balance {
    pub token: Token,
    pub amount: Decimal,
    pub value_usd: Decimal,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Token {
    pub symbol: String,
    pub name: String,
    pub decimals: u8,
    pub contract_address: Option<String>,
    pub is_native: bool,
    pub logo_url: Option<String>,
    pub price_usd: Decimal,
    pub price_change_24h: Decimal,
}

/// Transaction structure
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Transaction {
    pub id: Id,
    pub wallet_id: Id,
    pub tx_hash: String,
    pub blockchain: Blockchain,
    pub transaction_type: TransactionType,
    pub status: TransactionStatus,
    pub from_address: String,
    pub to_address: String,
    pub amount: Decimal,
    pub token: Token,
    pub fee: Decimal,
    pub fee_token: String,
    pub memo: Option<String>,
    pub confirmations: u64,
    pub block_number: Option<u64>,
    pub created_at: Timestamp,
    pub completed_at: Option<Timestamp>,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum TransactionType {
    Send,
    Receive,
    Swap,
    Stake,
    Unstake,
    ContractInteraction,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum TransactionStatus {
    Pending,
    Confirmed,
    Failed,
    Cancelled,
}

/// Send transaction request
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SendTransactionRequest {
    pub wallet_id: Id,
    pub to_address: String,
    pub amount: Decimal,
    pub token_symbol: String,
    pub memo: Option<String>,
    pub password: Option<String>, // For encryption
}

/// Swap request
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SwapRequest {
    pub wallet_id: Id,
    pub from_token: String,
    pub to_token: String,
    pub amount: Decimal,
    pub slippage_tolerance: Decimal, // e.g., 0.01 for 1%
}

/// Swap quote
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SwapQuote {
    pub from_token: String,
    pub to_token: String,
    pub from_amount: Decimal,
    pub to_amount: Decimal,
    pub exchange_rate: Decimal,
    pub price_impact: Decimal,
    pub fee: Decimal,
    pub route: Vec<String>,
    pub valid_until: Timestamp,
}

/// Payment request (for requesting money)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PaymentRequest {
    pub id: Id,
    pub user_id: Id,
    pub requester_wallet_id: Id,
    pub amount: Decimal,
    pub token_symbol: String,
    pub description: Option<String>,
    pub status: PaymentRequestStatus,
    pub created_at: Timestamp,
    pub expires_at: Option<Timestamp>,
    pub paid_at: Option<Timestamp>,
    pub transaction_id: Option<Id>,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum PaymentRequestStatus {
    Pending,
    Paid,
    Expired,
    Cancelled,
}

/// Create payment request
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreatePaymentRequest {
    pub wallet_id: Id,
    pub amount: Decimal,
    pub token_symbol: String,
    pub description: Option<String>,
    pub expires_in_hours: Option<u32>,
}

/// Portfolio summary
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Portfolio {
    pub user_id: Id,
    pub total_value_usd: Decimal,
    pub total_change_24h: Decimal,
    pub total_change_24h_pct: Decimal,
    pub assets: Vec<PortfolioAsset>,
    pub wallets: Vec<WalletSummary>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PortfolioAsset {
    pub token: Token,
    pub total_balance: Decimal,
    pub value_usd: Decimal,
    pub allocation_pct: Decimal,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WalletSummary {
    pub id: Id,
    pub name: String,
    pub blockchain: Blockchain,
    pub address: String,
    pub total_value_usd: Decimal,
}

/// Yield/Vault position
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VaultPosition {
    pub id: Id,
    pub wallet_id: Id,
    pub vault_name: String,
    pub protocol: String,
    pub deposited_amount: Decimal,
    pub current_amount: Decimal,
    pub token_symbol: String,
    pub apy: Decimal,
    pub earned_rewards: Decimal,
    pub deposited_at: Timestamp,
    pub last_harvest_at: Timestamp,
}

/// Transaction history filter
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TransactionFilter {
    pub wallet_id: Option<Id>,
    pub blockchain: Option<Blockchain>,
    pub transaction_type: Option<TransactionType>,
    pub status: Option<TransactionStatus>,
    pub from_date: Option<Timestamp>,
    pub to_date: Option<Timestamp>,
}

/// Gas price estimate
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GasEstimate {
    pub blockchain: Blockchain,
    pub slow: GasLevel,
    pub standard: GasLevel,
    pub fast: GasLevel,
    pub estimated_confirmation_time: u64, // seconds
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GasLevel {
    pub gas_price: Decimal,
    pub max_fee: Decimal,
    pub total_cost_usd: Decimal,
}
