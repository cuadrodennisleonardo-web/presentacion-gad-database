# 🏛️ Centralized Municipal Database System — Municipality of Presentacion

A state-of-the-art, high-performance **Municipal Data Aggregation & GAD System** designed for local government units (LGUs). The application supports multi-sector data entry, dynamic custom tables, automated percentage formulas, approval workflows, and interactive analytics dashboards.

---

## ✨ Key Features & Capabilities

### ⚡ 1. Dynamic Tables Engine (7 Category Types)
Superadmins can build, edit, and delete custom data tables dynamically without altering backend code:
1. **Standard Count**: Male/Female gender splits or single-value data entry grids.
2. **Multi-Group Subtables**: Multiple nested sub-tables in a single tab (without percentage formulas).
3. **Percentage & Ratio**: Automated percentage indicators with custom denominators (e.g. Total Households or Total Population).
4. **Budget Allocation**: Currency tracking (PHP ₱) with automated sum statistics.
5. **Project Milestone Tracker**: Infrastructure project budgets, milestone completion dates, and status tracking.
6. **Geo-Spatial Asset Registry**: Facilities and water points registered with GPS Coordinates (Latitude/Longitude) and refuge capacity.
7. **Monthly Time-Series**: Month-by-month tracking (January through December) for seasonal disease outbreaks or agricultural yields.

---

### 🏫 2. Multi-Entity Scope Support
Tables can target different administrative entity scopes:
- **Barangays (18 Barangays)**: Default municipal barangays.
- **Primary Schools (18 Primary / Elementary Schools)**: Specific elementary schools for grade-level metrics (Kinder–Grade 6, SNED, ALS).
- **Secondary Schools (7 High Schools)**: High schools for Junior High (Grades 7–10) and Senior High School strands (STEM, ABM, HUMSS, GAS, TVL).
- **All Municipal Schools (25 Combined Schools)**: Full education sector overview.

---

### 🌿 3. Department Sub-Sector Branching
The **Social Development** sector supports sub-sector branch filtering:
- 🎓 **Education & Youth**
- 🏥 **Health & Nutrition**
- 🤝 **Social Welfare**
- 🏘️ **Housing & Basic Utilities**

Filtering by a sub-sector updates stat cards, native graphs, and dynamic charts to display only relevant metrics.

---

### 📊 4. 100% Dynamic Sectors
The following sectors rely completely on the **Dynamic Tables Engine**:
- **Economic Development**
- **Infrastructure**
- **Local Governance**
- **Justice & Safety**

Superadmins can reference [RECOMMENDED_DYNAMIC_TABLES.md](file:///C:/Users/Admin/Documents/Municipal%20Database/Presentacion%20Database/RECOMMENDED_DYNAMIC_TABLES.md) for suggested indicator fields and short titles.

---

### 🔒 5. Approval & Security Workflows
- **Superadmin Direct Saves**: Direct data mutations with automated audit log notifications.
- **Data Approval Requests**: Multi-level data submission, pending locks, approval approvals, and rejected data resubmissions.
- **CSV / Excel Data Management**: Import and export standard and dynamic table records with header auto-matching.
- **Realtime Sync**: Instant Supabase realtime state updates across active browser tabs.

---

## 🛠️ Technology Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS
- **State & Data**: TanStack Query (React Query v5), Supabase JS Client
- **Backend & Database**: Supabase PostgreSQL, Realtime Subscriptions, Row Level Security (RLS)
- **Visualization**: ApexCharts, Custom MultiSeries SVG Charts

---

## 📁 Workspace Rules & Guidelines

This repository strictly enforces project-wide UI guidelines via [AGENTS.md](file:///C:/Users/Admin/Documents/Municipal%20Database/Presentacion%20Database/AGENTS.md):
- **Strict No Emoji Rule**: Raw emoji characters are prohibited in UI components, dropdown options, subsector labels, badges, and headers. Clean Lucide SVG icons or clean text are used.

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm

### Development
```bash
npm install
npm run dev
```

### Production Build Verification
```bash
npm run build
```

---
*Developed for the Municipality of Presentacion Municipal Gender & Data Aggregation System.*
