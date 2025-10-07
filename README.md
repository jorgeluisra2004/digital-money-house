
# 💳 Digital Money House — Web Wallet Platform

> **Digital Money House (DMH)** is a digital wallet built with **Next.js 15+**, **TailwindCSS**, and **Supabase**.  
> It includes secure authentication, account balances, transaction activity, payments, and integrated dashboards for a complete financial experience.

---

## 🏗️ Project Overview

Digital Money House is designed as a **progressive web wallet** that allows users to:

- 💰 View and manage balances in real time.
- 🔁 Load and withdraw funds securely.
- 💳 Manage physical and virtual cards.
- 📊 Track transactions and filter by date or amount.
- 🧾 Pay for services directly from the wallet.
- 👤 Manage profiles, authentication, and sessions.
- ✅ Experience end-to-end tested reliability (Playwright + Selenium).

It is also part of the **Imnoba ecosystem**, the digital network connecting real estate, automotive, and financial platforms.

---

## 🧱 Tech Stack

| Layer | Technology |
|-------|-------------|
| Frontend | Next.js 15+, React, TailwindCSS, Framer Motion |
| Backend | Supabase (PostgreSQL + Auth + Storage + RLS) |
| Auth | Custom AuthContext + Supabase session persistence |
| Security | JWT (via jose) + Row-Level Security (RLS) |
| Testing | Jest, React Testing Library, Playwright, Selenium (Maven) |
| Deployment | Vercel (serverless) + Docker (local/prod) |
| CI/CD | GitLab CI + Playwright reports |
| Languages | TypeScript, JavaScript, Java (QA suite) |

---

## 📁 Folder Structure

```
DIGITAL-MONEY-HOUSE/
├── .next/                     # Next.js build output
├── coverage/                  # Jest coverage reports
├── docs/                      # Documentation (infra, testing, etc.)
├── e2e/                       # End-to-end tests (Playwright)
│   ├── utils/                 # Mock APIs and runtime helpers
│   ├── actividad.spec.ts
│   ├── cargar-dinero.spec.ts
│   ├── sprint4-servicios.spec.ts
│   └── ...snapshots
├── public/                    # Static assets
├── qa/                        # Selenium QA suite (Java)
│   └── src/test/java/com/dmh/selenium/
│       ├── pages/             # Page Object Models
│       ├── smoke/             # Smoke test classes
│       └── support/           # Base and failure utilities
├── src/
│   ├── app/                   # Next.js App Router structure
│   │   ├── api/
│   │   ├── login/
│   │   ├── register/
│   │   ├── providers/
│   │   ├── layout.jsx
│   │   ├── page.tsx
│   │   └── shell.jsx
│   ├── components/            # Shared UI components (Navbar, Sidebar, etc.)
│   ├── context/               # AuthContext and providers
│   ├── lib/                   # Supabase and utility libraries
│   ├── utils/                 # Helper functions and hooks
│   └── globals.css            # Global styles (Tailwind + brand tokens)
├── test-results/              # Playwright results
├── Dockerfile                 # Multi-stage Docker build
├── docker-compose.yml         # Local environment orchestration
├── .gitlab-ci.yml             # CI/CD configuration
├── jest.config.js             # Unit testing configuration
├── playwright.config.ts       # E2E testing configuration
├── README.md                  # You are here
└── package.json               # Project manifest
```

---

## 🧭 Main Routes

| Route | Description |
|-------|--------------|
| `/home` | Dashboard with balance overview and shortcuts |
| `/actividad` | Transaction history, filters, pagination |
| `/perfil` | User data and preferences |
| `/cargar-dinero` | Deposit flow with validations and feedback |
| `/pagar-servicios` | Payment module for basic services |
| `/tarjetas` | Card management interface |

---

## 🎨 Design System

- **Font:** [Poppins](https://fonts.google.com/specimen/Poppins)
- **Primary Color:** `--dmh-lime: #C0FD35`
- **Background:** `--dmh-black: #1F1F1F`
- **Light variant:** `--white: #FFFFFF`
- **Consistent UI:** Shared color tokens via `globals.css`
- **Animations:** Framer Motion transitions (buttons, modals, lists)
- **Dark Mode Ready:** Colors use CSS variables for automatic theme matching

---

## 🔐 Environment Variables

```ini
# Supabase
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# JWT / Auth
JWT_SECRET=...

# Testing / Flags
NEXT_PUBLIC_E2E=false
NEXT_PUBLIC_ENV=dev

# Deployment
VERCEL_ENV=production
```

> **Note:** Never expose your `SUPABASE_SERVICE_ROLE_KEY` in the client.

---

## 🧪 Testing Suite

### ✅ Unit & Component Testing
- Framework: Jest + React Testing Library
- Command:
  ```bash
  npm run test:unit
  ```

### 🧭 End-to-End (E2E)
- Framework: Playwright
- Tests located in `/e2e`
- Run with:
  ```bash
  npm run test:e2e
  ```
- Generates HTML reports in `/playwright-report`

### 🧩 QA Automation (Selenium)
- Located in `/qa/selenium`
- Uses Maven + Java 17
- Example:
  ```bash
  cd qa/selenium
  mvn -q -Dtest=*Smoke* -DHEADLESS=true test
  ```

---

## 🐳 Docker Setup

### Build Image
```bash
docker build -t dmh-wallet:latest .
```

### Run Container
```bash
docker run -p 3000:3000   -e NEXT_PUBLIC_SUPABASE_URL=...   -e NEXT_PUBLIC_SUPABASE_ANON_KEY=...   -e SUPABASE_SERVICE_ROLE_KEY=...   -e JWT_SECRET=...   dmh-wallet:latest
```

---

## 🚀 Deployment (Vercel)

1. Connect the repository on **[Vercel](https://vercel.com/)**.  
2. Configure environment variables (Production, Preview, Development).  
3. Deploy directly from `main` or GitLab CI/CD.  

> The app auto-builds using Next.js incremental static regeneration (ISR).

---

## 📊 CI/CD Pipeline (GitLab)

- **Stages:** Install → Test → Lint → E2E → Deploy  
- **Artifacts:** Coverage, Playwright reports, Docker images  
- Configured via `.gitlab-ci.yml`  
- Example:
  ```yaml
  stages:
    - install
    - test
    - deploy
  ```

---

## 📘 Documentation

| File | Purpose |
|------|----------|
| `docs/infraestructura.md` | Local, prod, and CI/CD infrastructure |
| `docs/testing/plan.md` | QA test plan with coverage matrix |
| `qa/casos_prueba.xlsx` | Manual test cases (linked to smoke tests) |

---

## 💡 Development Guidelines

- Use `use client` at the top of all client components.  
- Respect design tokens in `globals.css`.  
- Avoid direct calls to Supabase in layouts — use `getSupabaseClient()` from `lib`.  
- Run `npm run lint` before committing.  
- All commits must pass **tests + lint + format**.  

---

## 👥 Authors

Jorge Luis Rodriguez  

---