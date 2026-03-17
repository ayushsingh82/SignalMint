# How SignalMint Uses the Protocol Labs Tracks

SignalMint (autonomous market-driven art agent: discover → plan → execute → verify → submit, with Rare Protocol + ERC-8004) can compete for **both** Protocol Labs tracks. Below is how we map to each track and what to deliver.

---

## Track 1: Let the Agent Cook — No Humans Required ($8,000)

**Goal:** Fully autonomous agents: discover → plan → execute → verify → submit; no human in the loop for the core loop.

### How SignalMint satisfies it

| Requirement | How we use it |
|-------------|----------------|
| **1. Autonomous Execution** | Agent runs full loop: **Discover** (monitor Rare auctions, prediction-market / Polymarket-style signals) → **Plan** (creative direction from signals) → **Execute** (generate art → IPFS → Rare CLI mint/auction) → **Verify** (bids, settlement, logs) → **Submit** (agent_log.json, gallery). Task decomposition = “which event to mint for”; self-correction = retries on mint/auction failure. |
| **2. Agent Identity (ERC-8004)** | Register agent with ERC-8004 on **Base**; link to operator wallet. **Deliverable:** Include ERC-8004 registration transaction link (e.g. CeloScan/BaseScan) in README and submission. |
| **3. Agent Capability Manifest** | **Deliverable:** Publish `agent.json` with: agent name (SignalMint), operator wallet, ERC-8004 identity, supported tools (Rare CLI, IPFS, data APIs), tech stack, compute constraints, task categories (e.g. `["nft_mint", "auction", "market_signal"]`). |
| **4. Structured Execution Logs** | **Deliverable:** Produce `agent_log.json` per run: decisions (why this event/signal), tool calls (Rare CLI, IPFS), retries, failures, final outputs (mint tx, auction id). Judges can verify autonomous operation from this. |
| **5. Tool Use** | **Real tools:** Rare Protocol CLI (mint, auction, settle), IPFS (artwork), market/data APIs (Polymarket-style, Rare auctions). **Multi-tool:** Rare CLI → execute; IPFS → store; APIs → discover. |
| **6. Safety and Guardrails** | Before mint/auction: validate tx params (amounts, token URI); confirm Rare API outputs; detect unsafe ops (e.g. empty URI); abort or retry safely. Document in README and in agent_log.json (e.g. “validation passed” / “aborted: invalid URI”). |
| **7. Compute Budget Awareness** | Define a compute budget (e.g. max Rare CLI calls per cycle, max iterations). In agent_log.json show resource usage; avoid runaway loops (timeouts, max iterations). |

### Bonus we can highlight

- **ERC-8004 trust signal:** Agent identity on-chain; other agents can verify who minted.
- **Multi-role:** Optional “planner” (reasoning) + “executor” (Rare CLI) + “verifier” (logs) as a simple multi-step agent design.

---

## Track 2: Agents With Receipts — ERC-8004 ($8,004)

**Goal:** Trusted agent systems using ERC-8004: identity, reputation, onchain verifiability, DevSpot compatibility.

### How SignalMint satisfies it

| Requirement | How we use it |
|-------------|----------------|
| **1. ERC-8004 Integration** | Agent registers **ERC-8004 identity** on Base linked to operator wallet. Optionally: use reputation/validation registries if we integrate a second registry (e.g. for “verified minter”). **Deliverable:** Onchain tx(s) for identity registration (and any reputation/validation) with explorer link. |
| **2. Autonomous Agent Architecture** | Same as Track 1: planning (reasoning from signals), execution (Rare CLI, IPFS), verification (logs, settlement), decision loop (which signal → mint). |
| **3. Agent Identity + Operator Model** | One operator wallet; agent’s ERC-8004 identity linked to it; all mints/auctions from that wallet so reputation is attributable. |
| **4. Onchain Verifiability** | **Deliverable:** Links to onchain txs: (a) ERC-8004 registration, (b) NFT deploy/mint (Rare), (c) auction create/settle. All viewable on Base (or chain used by Rare). |
| **5. DevSpot Agent Compatibility** | **Deliverable:** Implement DevSpot Agent Manifest: provide **agent.json** and **agent_log.json** as specified by DevSpot (name, operator, ERC-8004 id, tools, logs with decisions/tool calls/outputs). |

---

## Concrete deliverables (use for both tracks)

1. **ERC-8004 registration**
   - Register agent on Base (or specified chain); get identity id.
   - **Add to README:** “ERC-8004 identity: `<id>`” + link to registration tx (e.g. BaseScan).

2. **agent.json** (Agent Capability Manifest / DevSpot)
   - Fields: `name`, `operator_wallet`, `erc8004_identity`, `supported_tools`, `tech_stack`, `compute_constraints`, `task_categories`.
   - Host in repo (e.g. `synthesis-2/agent.json`) and/or at a stable URL.

3. **agent_log.json** (Structured Execution Logs / DevSpot)
   - Per run or per request: `decisions`, `tool_calls`, `retries`, `failures`, `final_outputs` (mint tx, auction id).
   - Example in repo; optionally link from app (e.g. “Last run log”) or from submission.

4. **README section: “Protocol Labs tracks”**
   - Short bullets: which track(s) we’re entering; link to ERC-8004 tx; link to agent.json and a sample agent_log.json; link to 1–2 onchain mints/auctions.

5. **Safety & compute**
   - One line in README or agent.json: how we validate before irreversible actions and how we enforce compute budget (e.g. max calls, timeouts).

---

## Summary

| Track | Prize | What we do |
|-------|--------|------------|
| **Let the Agent Cook** | $8k (1st $4k, 2nd $2.5k, 3rd $1.5k) | Full autonomous loop, agent.json, agent_log.json, ERC-8004, real tools (Rare, IPFS), guardrails, compute budget. |
| **Agents With Receipts** | $8,004 (1st $4k, 2nd $3k, 3rd $1,004) | ERC-8004 identity + onchain txs, DevSpot agent.json + agent_log.json, verifiable mints/auctions. |

We use **one agent** (SignalMint), **one ERC-8004 identity**, **one agent.json**, and **one agent_log.json** format to satisfy both tracks; submission narrative can emphasize “Let the Agent Cook” for autonomy and “Agents With Receipts” for trust and onchain verifiability.
