# SAETA Frontend v2

Modern municipal emergency operations frontend for the **SAETA** platform. Built with **Angular 22 (Zoneless + Signals)**, **Tailwind CSS v4**, and **Feature-Based Architecture**.

---

## Architecture Highlights

- **Full Zoneless**: Pure signal-based change detection via `provideZonelessChangeDetection()`—zero `zone.js` overhead and instant reactivity.
- **Feature-Based Structure**: Self-contained feature folders with pages and domain models.
- **Dual Layout System**:
  - **Exposed Layout (`AuthLayoutComponent`)**: Minimalist, high-focus public layout for login and authentication flows.
  - **Protected Layout (`AdminLayoutComponent`)**: Administrative layout featuring collapsible responsive sidebar, dynamic header, role badges, and signal-managed session control.
- **Functional Security**:
  - `authGuard`: Protects administrative routes and redirects unauthenticated users to `/auth/login`.
  - `publicGuard`: Redirects already authenticated users directly to `/dashboard`.
  - `authInterceptor`: Automatically attaches JWT Bearer token to outgoing HTTP requests via modern `provideHttpClient(withFetch())`.
- **Reusable UI Components**: Standalone signal-powered components (`ButtonComponent`, `BadgeComponent`).

---

## Project Structure

```text
src/app/
├── core/                              # Core singleton services, guards, interceptors, models
│   ├── auth/
│   │   ├── auth.guard.ts              # Signal-based functional guards (authGuard, publicGuard)
│   │   ├── auth.service.ts            # Signal-based session state (currentUser, token, isAuthenticated)
│   │   └── auth.interceptor.ts        # HTTP fetch interceptor injecting Bearer token
│   └── models/
│       └── user.model.ts              # Domain interfaces and role types
├── shared/                            # Reusable UI components and primitives
│   └── ui/
│       ├── button/                    # Reusable button with variants (primary, secondary, danger)
│       └── badge/                     # Reusable status indicator badge
├── layouts/                           # Application-wide shell layouts
│   ├── auth-layout/                   # Exposed public container (Login)
│   └── admin-layout/                  # Protected administrative shell (Sidebar, Header, Main)
├── features/                          # Feature modules
│   ├── auth/                          # Login page and authentication flows
│   └── dashboard/                     # Executive overview and stats monitoring
├── app.config.ts                      # Zoneless & HTTP configuration
└── app.routes.ts                      # Lazy-loaded route hierarchy
```

---

## Getting Started

### 1. Installation

```bash
npm install
```

### 2. Development Server

```bash
npm start
# or
npm run start
```
Navigate to `http://localhost:4200/`. The app automatically reloads on code changes.

### 3. Production Build

```bash
npm run build
```
Build artifacts are generated in `dist/saeta-frontend-v2/` in ~1.2 seconds.

### 4. Running Tests

```bash
# Run unit tests via Vitest
npm test -- --watch=false

# Run tests in watch mode
npm test
```
