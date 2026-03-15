# SignalMint — data & API

## Data flow

- **`lib/types.ts`** — Shared types: `Mint`, `MarketSignal`, `MintsResponse`, `SignalsResponse`.
- **`lib/data.ts`** — Data layer: `getMints()`, `getSignals()`. Currently mock data; replace with Rare Protocol subgraph/RPC when ready.
- **`app/api/mints/route.ts`** — `GET /api/mints` → returns `{ mints, total }`.
- **`app/api/signals/route.ts`** — `GET /api/signals` → returns `{ signals, updatedAt }`.
- **Gallery** (`app/gallery/page.tsx`) — Server component; calls `getMints()` and renders the list.
- **Mint** (`app/mint/page.tsx`) — Server component; calls `getSignals()` and shows “Live signals” plus the mint flow.

## Swapping to real data

1. **Mints** — In `lib/data.ts`, replace `getMints()` with:
   - Rare Protocol subgraph (if available), or
   - Contract reads (e.g. `tokenURI`, enumerate tokens) via viem/ethers and an RPC URL in env.
2. **Signals** — In `lib/data.ts`, replace `getSignals()` with:
   - Auction/bid metrics from the same subgraph or chain (e.g. active auctions, bid counts, volume).

## Env (for future RPC)

- `RPC_URL` — Ethereum/Base RPC for contract reads.
- `RARE_CONTRACT` — Rare Protocol NFT contract address (when you have it).
