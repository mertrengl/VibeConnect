# VibeConnect Frontend TODO & Roadmap

## 📌 Project Rules & Guidelines
- [x] Read-only on `vibe-connect.api` (never change API code unless requested).
- [x] All development inside `vibe-connect.fe`.
- [x] Design System: **Obsidian Flux** theme from `DESIGN.md` (Inter & Geist fonts, dark palette, glassmorphic headers).
- [x] Git Commit format: Always use single quotes `'` for commit messages in Turkish (TR).

---

## 🚀 Landing Page
- [x] Bootstrap Next.js (App Router, TypeScript).
- [x] Replicate Google Stitch landing page (`screen.png`) pixel-perfectly.
- [x] Add official logo (`vibe_connect_icon_logo.png`) for navbar, footer, and favicon tab.
- [ ] **[TODO Post-Dashboard]**: When the main chat app dashboard page is fully coded, capture/generate a screenshot of the actual app and replace `/public/screen.png` on the landing page!

---

## 🔐 Auth & Dashboard Roadmap
- [ ] **Auth Pages**: Login (`/login`) & Register (`/register`) connected to `POST /auth/login` and `POST /auth/register`.
- [ ] **Main App Layout**: 3-Pane model (Workspace Rail 72px, Channel Sidebar 280px, Chat Canvas Fluid).
- [ ] **Conversations & Messaging**: Real-time Socket.IO chat connection, messaging endpoints, typing indicators.
