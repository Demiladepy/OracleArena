# Deploying SDS Publisher to Render

Long-running Background Worker that mirrors Oracle Arena on-chain events to Somnia Data Streams (SDS). The frontend reads SDS records for live race views and stats.

## Prerequisites

- [Render](https://render.com) account (HackHazards workspace credits recommended)
- GitHub repo connected to Render (OAuth)
- Deployer wallet funded with **≥5 STT** on Somnia testnet (`0x0C503557CC81701037240e982c9520Aa1ffca4Cc`)
- SDS schemas registered once (see step 0)

## One-time: register schemas (local)

Run **once** from your machine before first Render deploy (or after adding a new schema):

```bash
cd apps/sds-publisher
cp .env.example .env
# Set SDS_PUBLISHER_PRIVATE_KEY in .env
pnpm install
pnpm sds-publish:setup-schemas
```

Expected output: `All schemas already registered` on subsequent runs (idempotent).

Registered schemas (5):

- `oracle-arena:bounties:v1`
- `oracle-arena:submissions:v1`
- `oracle-arena:resolvers:v1`
- `oracle-arena:settlements:v1`
- `oracle-arena:appeals:v1`

## Steps

### 1. Create the worker

1. Go to [https://dashboard.render.com](https://dashboard.render.com)
2. Click **New +** → **Blueprint** (if using `render.yaml`) **or** **Background Worker**
3. Connect the **OracleArena** GitHub repository
4. If using Blueprint: Render detects `render.yaml` at repo root and pre-fills fields
5. If manual setup:

| Field | Value |
|-------|-------|
| Name | `oracle-arena-sds-publisher` |
| Region | Oregon (US) |
| Branch | `main` |
| Root Directory | `.` (monorepo root) |
| Runtime | Node |
| Build Command | `corepack enable && pnpm install --frozen-lockfile && pnpm --filter @oracle-arena/sds-publisher build` |
| Start Command | `pnpm --filter @oracle-arena/sds-publisher start` |
| Plan | **Starter** (~$7/mo; ~$2 for judging week with HackHazards credits) |

### 2. Set environment variables

On the worker dashboard → **Environment**:

| Key | Value | Notes |
|-----|-------|-------|
| `NODE_ENV` | `production` | |
| `SOMNIA_RPC_URL` | `https://api.infra.testnet.somnia.network` | |
| `SDS_PUBLISHER_PRIVATE_KEY` | deployer private key | **Mark as Secret** |
| `BOUNTY_BOARD_ADDRESS` | `0xc8fb5757A922eCFd8294C3Aac7fb78BA7D71e290` | optional (defaults in config) |
| `CONSENSUS_ENGINE_ADDRESS` | `0xB2495D336d59D193Fa2463b95248dE240aBfe6df` | optional |
| `SETTLEMENT_ADDRESS` | `0x1036E3837418695A6731405B8EBf954834508B5c` | optional |
| `RESOLVER_REGISTRY_ADDRESS` | `0x0AcEF373884b7843592904e74F87ABD46ca035CF` | optional |

**Important:** set `SDS_PUBLISHER_PRIVATE_KEY` as a **Secret**, not a plain env var.

### 3. Deploy

1. Click **Create Background Worker** (or **Apply** for Blueprint)
2. Build takes ~2–4 minutes (`pnpm install` at monorepo root)
3. Open **Logs** — expected startup lines:

```
Publisher running as: 0x0C503557CC81701037240e982c9520Aa1ffca4Cc
Publisher wallet balance: X.XXXX STT
Schema oracle-arena:bounties:v1: registered=true
...
Watching contracts:
  BountyBoard: 0xc8fb5757...
Listening for events — worker will stay alive until stopped
```

### 4. Verify it's running

1. Logs show no fatal errors and the worker stays **Live**
2. Post a small test bounty on your Vercel `/post` page (≥0.1 STT)
3. Within ~30s, Render logs should show:

```
[event] BountyPosted detected: bountyId=X
[sds] bounty X status=0 tx=0x...
```

4. On the bounty race page, SDS badge may show after the frontend polls (15s interval)

### 5. Monitor through judging (June 6–10)

- Render dashboard → **Logs** for live tail
- Render auto-restarts crashed workers (typically 1–2 min)
- If repeated crashes, check:
  - Wallet balance (keep **>5 STT**)
  - RPC rate limits (Somnia testnet)
  - Schema registration (`registered=false` warnings at startup)

## Limitations (acceptable for hackathon)

- **No backfill on restart:** events during downtime are not republished to SDS. Data remains on-chain and in the explorer; frontend falls back to RPC polling.
- **AppealLayer:** `appeals:v1` schema is registered, but the publisher does **not** yet watch `AppealOpened` / `AppealResolved` events.
- **Health endpoint:** listens on `127.0.0.1:9090` inside the worker (not publicly exposed on Render). Use Render logs for monitoring.

## Cost

| Item | Estimate |
|------|----------|
| Render Starter | ~$7/mo prorated → **~$2** for judging week (HackHazards credits) |
| Gas (SDS publishes) | ~fraction STT per event; budget **~3 STT** for 4–7 days |

## Rollback

Suspend the worker in Render (stops billing for compute, keeps config). Frontend continues to work via on-chain RPC — SDS badge may disappear for new events.

## Local test before Render

```bash
cd apps/sds-publisher
pnpm install
SOMNIA_RPC_URL=https://api.infra.testnet.somnia.network \
SDS_PUBLISHER_PRIVATE_KEY=<your-key> \
pnpm start
```

Leave running 2 minutes, post a bounty via `/post`, confirm `[event] BountyPosted detected` in terminal.
