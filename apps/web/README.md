# Mirlind Protocol Web

Next.js 16 frontend for Mirlind Life OS.

## Development

```bash
# Install dependencies
npm install

# Run dev server
npm run dev  # Runs on http://localhost:3003

# Build
npm run build
```

## Architecture

- **Next.js 16** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** with custom cyberpunk theme
- **Direct API** to Rust Gateway (no proxy)

## Gateway Connection

The web app connects directly to the Rust Gateway at `http://127.0.0.1:3000`.

Ensure the gateway is running:
```bash
cd ../..
cargo run -p gateway
```

## Ports

- Web app: `http://localhost:3003`
- Rust Gateway: `http://localhost:3000`

## Cyberpunk Theme

The app uses a custom CSS-based cyberpunk theme with:
- Neon cyan (#00f5ff) and pink (#ff00ff) accents
- Dark backgrounds (#0a0a0f, #12121a)
- Grid background pattern
- Glow effects and animations
- Scanline overlay

## WSL Development

Run the app from one environment only. Mixing Windows `npx next dev` with WSL `npm run dev`
creates mismatched manifest paths (`C:\...` vs `/mnt/c/...`) and breaks React Server Components.
