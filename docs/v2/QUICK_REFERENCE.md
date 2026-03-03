# Mirlind Life OS - Quick Reference

> TL;DR for developers

---

## Project Commands

### Build
```bash
# Add Rust to PATH (PowerShell)
$env:PATH += ";$env:USERPROFILE\.cargo\bin"

# Check code
cargo check -p shared-types
cargo check -p gateway

# Build
cargo build -p shared-types
cargo build -p gateway

# Build release
cargo build -p gateway --release

# Run
cargo run -p gateway
```

### Test
```bash
# Run all tests
cargo test

# Run specific package
cargo test -p shared-types

# Watch mode
cargo watch -p gateway -x run
```

### Database
```bash
# Start PostgreSQL
docker run -d --name postgres -p 5432:5432 -e POSTGRES_PASSWORD=postgres postgres:16

# Start Redis
docker run -d --name redis -p 6379:6379 redis:7-alpine

# Run migrations
cargo run --bin migrate
```

---

## API Endpoints

### Public (No Auth)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/version` | GET | Version info |
| `/api/v1/auth/register` | POST | Register user |
| `/api/v1/auth/login` | POST | Login user |
| `/api/v1/auth/refresh` | POST | Refresh token |

### Protected (Auth Required)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/user/me` | GET | Current user |
| `/api/v1/ws` | WS | WebSocket |

---

## Environment Variables

```bash
# Required
JWT_SECRET=your-secret-key
DATABASE_URL=postgres://user:pass@localhost:5432/mirlind
REDIS_URL=redis://localhost:6379

# Optional (defaults provided)
GATEWAY_HOST=127.0.0.1
GATEWAY_PORT=3000
JWT_EXPIRATION_HOURS=24
RATE_LIMIT_REQUESTS=100
```

---

## Architecture Decisions

| Decision | Choice | Reason |
|----------|--------|--------|
| Language | Rust | Performance + Safety |
| Web Framework | Actix-web | Fastest Rust framework |
| Database | PostgreSQL | Reliable, feature-rich |
| Cache | Redis | Speed + Pub/Sub |
| Vector DB | Qdrant | Rust-native |
| Messaging | Matrix | Open, E2EE |
| Blockchain | Substrate | Customizable |
| Frontend | Next.js | React ecosystem |
| Mobile | Flutter | Cross-platform |
| Desktop | Tauri | Rust core |

---

## File Structure

```
gamified-life/
├── Cargo.toml              # Workspace root
├── .env                    # Environment variables
├── services/
│   └── gateway/            # API Gateway
│       ├── src/
│       │   ├── main.rs
│       │   ├── config.rs
│       │   ├── handlers/
│       │   ├── middleware/
│       │   ├── services/
│       │   └── routes.rs
│       └── Cargo.toml
├── shared/
│   └── types/              # Common types
│       ├── src/
│       │   ├── lib.rs
│       │   ├── auth.rs
│       │   ├── user.rs
│       │   ├── messaging.rs
│       │   ├── finance.rs
│       │   └── ai.rs
│       └── Cargo.toml
├── infrastructure/
│   ├── k8s/                # Kubernetes manifests
│   ├── terraform/          # IaC
│   └── scripts/            # Deployment scripts
├── apps/
│   ├── web/                # Next.js frontend
│   ├── desktop/            # Tauri app
│   └── mobile/             # Flutter app
└── docs/v2/                # Documentation
    ├── ARCHITECTURE_V2.md
    ├── TRANSFORMATION_ROADMAP.md
    ├── PHASES_DETAILED.md
    └── QUICK_REFERENCE.md (this file)
```

---

## Troubleshooting

### Error: `link.exe not found`
**Fix**: Install Visual Studio Build Tools
```powershell
winget install Microsoft.VisualStudio.2022.BuildTools
```

### Error: `could not find native static library`
**Fix**: Install OpenSSL
```powershell
# Windows
choco install openssl

# Or with vcpkg
vcpkg install openssl:x64-windows-static
```

### Error: `DATABASE_URL not set`
**Fix**: Create .env file
```bash
cp .env.example .env
# Edit .env with your database URL
```

---

## Performance Targets

| Metric | Target | Current |
|--------|--------|---------|
| Gateway latency | < 10ms p99 | TBD |
| Auth response | < 50ms | TBD |
| WebSocket conn | 1M+ | TBD |
| DB queries | < 5ms | TBD |
| Build time | < 2 min | TBD |
| Binary size | < 20 MB | TBD |

---

## Support

- Issues: GitHub Issues
- Discussions: GitHub Discussions
- Security: security@mirlind.io

---

*Last updated: February 22, 2026*
