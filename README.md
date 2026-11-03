# NIFTY 50 Quantitative Microstructure & Sector Co-Dependency Radar

An institutional-grade, real-time analytics cockpit for the **NIFTY 50 Index** and its 50 constituent companies. Built to reveal index microstructure, sector capital rotation, cross-sector elasticities, and anomalous constituent volatility without any automated trading execution.

---

## 🎯 Core Features

### 1. Mathematical Microstructure Point Contribution
NIFTY 50 is an exact linear combination of its 50 constituent stocks:
$$\text{Point Impact}_i = \text{Spot} \times \left(\frac{\text{Weight}_i}{100}\right) \times \left(\frac{\Delta\%_i}{100}\right)$$
- Tracks real-time net positive driver points vs negative draggers.
- Calculates dynamic free-float advancing vs declining weight percentages.

### 2. Sector Co-Dependency & Spillover Engine
- **Cross-Sector Elasticities**: Structural intraday elasticity coefficients across all 15 official NSE sectors.
- **Regime Detection**:
  - `UNIFORM_BETA_EXPANSION` / `CONTRACTION`: Synchronized institutional tide ($\rho > 0.70$).
  - `INTERNAL_SECTOR_ROTATION`: Capital shifting out of Financials into Defensives (IT/FMCG/Pharma), absorbing index shocks.
  - `FRAGMENTED_CHOP`: High sector dispersion with no clear directional trend.
- **Cascading Spillover Projection**: Calculates expected index drag when lead sectors experience sharp momentum shifts.

### 3. Continuous Volatility-Scaled Prediction Levels
- Anchored to continuous India VIX volatility scaling:
  $$\text{1-Sigma Daily Move} = \text{Spot} \times \left(\frac{\text{VIX}}{100}\right) \times \frac{1}{\sqrt{252}}$$
- Displays $R_1, R_2 (+1\sigma, +2\sigma)$ and $S_1, S_2 (-1\sigma, -2\sigma)$ volatility bands.

### 4. 4-Signal Multi-Confirmation Engine
- **Top-5 Heavyweights Hegemony**: Tracks the combined momentum of HDFCBANK, RELIANCE, ICICIBANK, INFY, and TCS (~42% index weight).
- **Free-Float Weight Breadth**: Advancing vs Declining weight disparity.
- **Core Sector Synchrony**: Financials, IT, and Energy alignment.
- **1-Sigma Volatility Absorption**: Measures if current net points represent an overextended move.

### 5. Microstructure Anomaly & News Scanner
- Automatically flags stocks moving $> 2.2\%$ or contributing $> 12$ net index points (`SUPER BULLISH` / `SUPER BEARISH`).
- Detects **Sector Decoupling**: Stocks moving opposite to their parent sector by $> 1.8\%$, indicating strong company-specific news.
- Provides 1-click direct inspection links to:
  - **NSE Official Corporate Filings & Announcements**
  - **Google Finance News & Events**
  - **TradingView Technical Charts**

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ (tested on Node.js 24)
- npm or pnpm

### Installation
```bash
git clone https://github.com/Anshdeep-Singh/nifty-analysis.git
cd nifty-analysis
npm install
```

### Running Locally
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the cockpit.

---

## 🛡️ Architecture
- **Framework**: Next.js 16 (App Router, Turbopack)
- **Styling**: Tailwind CSS v4 (Dark Cockpit Theme)
- **Icons**: Lucide React
- **Data Engine**: Sub-second in-memory cache with multi-tier failover (Kite REST API -> Public Exchange Feeds -> Authentic Reference Snapshot).
