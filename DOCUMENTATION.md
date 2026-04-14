# NRZONE ERP - Client & Factory Hive (v2.5)

## Overview
NRZONE ERP is a high-density industrial management system designed for borka/hijab factory operations. It features a unified dashboard for production tracking, worker management, and specialized B2B client interaction.

## Key Features

### 1. B2B Client Hub
- **Location**: Menu > B2B HUB / Client Hub
- **Access**: Role-based access for Admins and Clients.
- **Fabric Tracking (Goj)**: 
    - Dedicated **FABRIC INWARD** button for recording cloth reception from clients.
    - Automated yardage deduction during cutting.
    - Live visibility of "Raw Stock" for clients.
- **Production Status**: Real-time tracking from Order Intake -> Cutting -> Sewing/Stone -> Ready.
- **Financial Ledger**: Automated billing based on production and manual payment entry.

### 2. Personnel Management (Workers)
- **Location**: Settings > Personnel Hub
- **Clear All Workers**: A specialized disaster-recovery button to wipe all worker data for a fresh season start.
- **Unified Registry**: Manage cutting, sewing, stone, and pata workers in a single interface.

### 3. Factory Operations
- **Cutting Panel**: Managed Lot creation and fabric consumption.
- **Factory Panel**: Live assembly line tracking.
- **Inventory Matrix**: Centralized stock for both raw materials and finished goods.

## Deployment
- **Platform**: Vercel (`nrzoone-erp-factory`)
- **Git Branch**: `main`
- **Build Command**: `npm run build`

## Technical Details
- **Architecture**: React + Tailwind CSS (High Contrast Industrial Design).
- **State Management**: `useMasterData` hook (Local Storage + Supabase/Cloud sync).
- **Security**: ID/Password based login with role-level restriction.

---
*Developed by Antigravity for NRZONE Couture.*
