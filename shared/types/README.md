# Shared Types

Common types used across all Mirlind Life OS services.

## Modules

| Module | Description |
|--------|-------------|
| `auth` | Authentication types (JWT, sessions, permissions) |
| `user` | User profiles, settings, preferences |
| `messaging` | Conversations, messages, E2EE |
| `finance` | Wallets, transactions, DeFi |
| `ai` | AI conversations, RAG, memory |
| `common` | Pagination, timestamps, utilities |
| `error` | Standard error responses |

## Usage

```rust
use shared_types::{AuthRequest, User, ApiResponse, ApiError};

// Creating a response
let response = ApiResponse::success(user);

// Error handling
let error = ApiError::new("UNAUTHORIZED", "Invalid credentials");
```

## Dependencies

- `serde` - Serialization
- `chrono` - DateTime handling
- `uuid` - Unique identifiers
- `rust_decimal` - Precise decimal arithmetic
- `validator` - Input validation
- `thiserror` - Error types
