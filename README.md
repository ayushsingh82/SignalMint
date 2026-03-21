# SignalMint

**Autonomous market-driven art agent.** The agent discovers market signals (Rare Protocol auctions, prediction-market events), plans creative direction, executes mints on **Rare Protocol** (SuperRare), and submits verifiable logs. We build it with **Protocol Labs** (Let the Agent Cook + Agents With Receipts) and **SuperRare** (Rare Protocol).

---

## How we build it

### Protocol Labs

- **Let the Agent Cook** — Full autonomous loop: **discover** (monitor Rare auctions, market signals) → **plan** (creative direction from signals) → **execute** (art → IPFS → Rare CLI mint/auction) → **verify** (bids, settlement) → **submit** (agent_log.json). We use real tools: Rare Protocol CLI, IPFS, market/data APIs. Agent has **ERC-8004** identity on Base Sepolia; we ship **agent.json** (capability manifest) and **agent_log.json** (execution logs) for DevSpot compatibility. Safety guardrails and compute budget are documented.
- **Agents With Receipts** — Same agent and loop. **ERC-8004** identity linked to operator wallet; onchain verifiable transactions (identity registration, mints, auctions). All mints and auctions are viewable on-chain; we link to them from the app (Gallery, Feed).

### SuperRare (Rare Protocol)

- **Rare Protocol** ([rare.xyz](https://rare.xyz/)) is the mint layer. The agent uses the **Rare CLI** to deploy ERC-721 collections, mint NFTs (artwork on IPFS), create auctions, and settle. We use **Base Sepolia**, which is supported by Rare Protocol (Mainnet, Sepolia, Base, Base Sepolia). Art is shaped by market data (auction activity, prediction-market outcomes); the Gallery and Feed in the app show mints and drops.

### Stack

| Layer | What we use |
|-------|-------------|
| **Identity** | ERC-8004 on Base Sepolia (agent identity + operator wallet). |
| **Mint / auction** | Rare Protocol ([rare.xyz](https://rare.xyz/)) on Base Sepolia: Rare CLI, ERC-721, IPFS metadata, auctions. |
| **Data** | Market signals (auctions, prediction markets); `getMints()`, `getSignals()` in `lib/data.ts` (mock today; swap for Rare subgraph/RPC). |
| **App** | Next.js + TypeScript. **Gallery** — minted NFTs (date, name from market signal). **Feed** — news/drops (one event per box). |

---

## Run the app

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Run the autonomous agent

```bash
npm install
npm run agent:build
npm run agent:dev
```

The current runtime path is wired to real integrations:

- Rare Protocol CLI mint flow on Sepolia/Base Sepolia config
- Uniswap Trading API quote/swap path
- OpenServ via `@openserv-labs/client` (workflow bootstrap)
- Zyfai via `@zyfai/sdk` (smart wallet + session key)

### Required environment

Copy [.env.example](.env.example) to `.env` and set at minimum:

- `AGENT_PRIVATE_KEY`
- `AGENT_ADDRESS`
- `RARE_CHAIN`, `RARE_RPC_URL`, `RARE_CONTRACT_ADDRESS`
- `UNISWAP_API_KEY`
- `OPENSERV_API_KEY`
- `ZYFAI_API_KEY`

### Zyfai EOA requirement

Zyfai requires an EOA for `userAddress`.

- If your existing agent wallet is a normal EOA, set:
	- `ZYFAI_PRIVATE_KEY=<same as AGENT_PRIVATE_KEY>`
	- `ZYFAI_USER_EOA=<same as AGENT_ADDRESS>`
This keeps the rest of the autonomous loop running even if optional integrations fail at bootstrap.

---

## Links

| Resource | Purpose |
|----------|---------|
| [md/PROTOCOL_LABS_TRACK_CHECKLIST.md](md/PROTOCOL_LABS_TRACK_CHECKLIST.md) | Protocol Labs track mapping: requirements, agent.json, agent_log.json, ERC-8004 |
| [md/BUILD_AN_AGENT.md](md/BUILD_AN_AGENT.md) | Build an agent: frameworks, security |
| [md/SYNTHESIS.md](md/SYNTHESIS.md) | Synthesis event brief |
| [md/skill.md](md/skill.md) | Agent API & registration |
| [src/README.md](src/README.md) | Data flow, swapping to real data |
| [Rare Protocol](https://rare.xyz/) | Mint & auction layer (SuperRare); we use Base Sepolia. |
| [Devfolio](https://synthesis.devfolio.co) | Register, submit, bounties |

---

*SignalMint: art shaped by the market. Built with Protocol Labs + SuperRare.*
