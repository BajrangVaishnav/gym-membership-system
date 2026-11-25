# FITDESK — Premium 3D Gym Membership & Operations Platform

**TRAIN HARDER. MANAGE SMARTER.**

> **Live Demo (GitHub Pages)**: `https://bajrangvaishnav.github.io/gym-membership-system/`

FITDESK is a 3D-enhanced gym membership, attendance, and financial operations platform built with React, TypeScript, Vite, Tailwind CSS, Three.js, GSAP ScrollTrigger, and Lenis.

## Features

- **Cinematic 3D Landing Page**:
  - Interactive Three.js studio dumbbell & calibrated weight plate scene with procedural PBR brushed-knurling bump map, PMREM studio reflections, pointer parallax, and scroll-scrubbed rotation.
  - Lightweight SVG fallback when WebGL is unavailable, plus `prefers-reduced-motion` support.
  - Lenis smooth scrolling, GSAP ScrollTrigger staggered reveals, parallax hero backdrop, sticky 3D membership pass showcase, animated counters, and horizontal capability track.
- **Operations Dashboard (`/dashboard`)**:
  - Collapsible desktop sidebar & mobile navigation drawer, global search, branch selector (`Downtown Flagship`, `Westside Studio`, `Marina Athletic`), date range filter (`7d`, `30d`, `90d`, `12m`), actionable notifications, and demo reset.
  - 8 live KPI metrics, interactive Financial Performance & Attendance/Growth bar charts, Peak Hours distribution, Upcoming Expirations with 1-click renewal, and Recent Activity feed.
- **Membership Management (`/dashboard/members`)**:
  - Card & responsive semantic table views, status badges (`Active`, `Expiring Soon`, `Expired`, `Suspended`), advanced filters, member detail modal with history & payment ledger, onboarding modal, and CSV export.
- **Membership Plans (`/dashboard/plans`)**:
  - Monthly, Quarterly, Half-Yearly, Annual, Personal Training, and Corporate tiers with live active subscriber counts, comparison matrix, and plan editor.
- **Attendance & Check-In (`/dashboard/attendance`)**:
  - Pass ID / member verification terminal (blocks Expired or Suspended passes), live in-club floor list with check-out, 7-day attendance & peak-hour charts, frequency leaderboard, and CSV export.
- **Payments & Finance (`/dashboard/payments`)**:
  - Dynamic revenue, renewal, discount, and outstanding balance totals, revenue-by-plan breakdown, payment recording, pending settlement, refunds, printable receipt preview, and CSV export.
- **Browser Persistence**:
  - All state persists automatically in `localStorage` (`fitdesk_state_v2`).

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite 6, Tailwind CSS v4
- **3D & Motion**: Three.js, GSAP (`ScrollTrigger`), Lenis
- **Icons**: Lucide React

## Setup & Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Type-check and build for production
npm run build

# Preview production build
npm run preview
```

## Deploying to GitHub Pages

1. Push the repository to the `main` branch on GitHub (`BajrangVaishnav/gym-membership-system`).
2. In your GitHub repository, open **Settings → Pages** and set **Source** to **GitHub Actions**.
3. The included workflow ([`.github/workflows/deploy.yml`](./.github/workflows/deploy.yml)) builds `dist/` and publishes the live demo automatically to `https://bajrangvaishnav.github.io/gym-membership-system/`.
4. `vite.config.ts` uses `base: './'` and hash routing (`#/dashboard/...`), so all routes and assets work out-of-the-box on both GitHub Pages subpaths and custom domains.

## License

Personal-Use-Only — see [LICENSE](./LICENSE).
