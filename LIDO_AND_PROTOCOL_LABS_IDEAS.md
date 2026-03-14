# Lido + Protocol Labs Combined Project Ideas

One project can target **both** Lido Labs Foundation and Protocol Labs bounties. Below are combinations that fit each sponsor’s criteria with a single codebase.

---

## Lido tracks (recap)

| Track | Prize | What it wants |
|-------|-------|----------------|
| **stETH Agent Treasury** | $3,000 | Contract primitive: human gives agent a yield-only budget (stETH); agent can only spend yield, not principal; configurable permissions (whitelist, cap, time window). |
| **Vault Position Monitor + Alert Agent** | $2,000 | Agent that watches Lido Earn vaults (EarnETH, EarnUSD), plain-language alerts (Telegram/email), benchmark tracking, MCP-callable vault health. |
| **Lido MCP** | $5,000 | Reference MCP server for Lido: stake, unstake, wrap/unwrap, balance/rewards, governance; dry_run on writes; optional lido.skill.md. |

---

## Protocol Labs tracks (recap)

| Track | Prize | What it wants |
|-------|-------|----------------|
| **Let the Agent Cook** | $8,000 | Fully autonomous agent: discover → plan → execute → verify → submit; ERC-8004 identity; agent.json, agent_log.json; real tools; safety guardrails; compute budget. |
| **Agents With Receipts (ERC-8004)** | $8,004 | Trusted agent systems: ERC-8004 (identity/reputation/validation), onchain verifiability, DevSpot manifest (agent.json, agent_log.json). |

---

## 1. Lido MCP + Let the Agent Cook (strongest combo)

**Concept:** Build the **Lido MCP server** (Lido track) and an **autonomous agent** that uses it (Protocol Labs track). The agent has ERC-8004 identity, runs the full loop (discover → plan → execute → verify → submit), and uses the Lido MCP to stake, query positions, or perform governance.

| Sponsor | How it fits |
|---------|-------------|
| **Lido** | You ship the Lido MCP: stake, unstake, wrap/unwrap, balance, rewards, at least one governance action, dry_run; plus lido.skill.md. |
| **Protocol Labs** | The agent is fully autonomous, uses the MCP as a real tool, has ERC-8004, agent.json, agent_log.json, safety and compute awareness. |

**One-liner:** Autonomous agent that manages Lido positions via your Lido MCP — one codebase, two bounties.

---

## 2. stETH Agent Treasury + Let the Agent Cook

**Concept:** Build the **stETH Agent Treasury** contract (Lido) and an **autonomous agent** (Protocol Labs) whose operating budget is that treasury. The agent discovers tasks, plans, executes (e.g. pay for API/compute from yield), verifies, and logs. Principal stays locked; only yield is spendable.

| Sponsor | How it fits |
|---------|-------------|
| **Lido** | Contract primitive: yield-only spendable balance, principal inaccessible, at least one configurable permission; working demo of agent paying from yield. |
| **Protocol Labs** | Autonomous agent with full decision loop; one of its “real tools” is spending from the treasury; ERC-8004, agent.json, agent_log.json. |

**One-liner:** Autonomous agent whose operating budget is a stETH yield treasury — Lido = primitive, Protocol Labs = agent.

---

## 3. stETH Agent Treasury + Agents With Receipts

**Concept:** Same **stETH Agent Treasury** (Lido). The agent has **ERC-8004 identity**; the treasury is part of its onchain story — “this agent only spends yield” is verifiable on-chain. Add DevSpot manifest and execution logs.

| Sponsor | How it fits |
|---------|-------------|
| **Lido** | stETH Agent Treasury with yield-only spending and permissions. |
| **Protocol Labs** | Trusted agent (ERC-8004), onchain verifiability (identity + treasury usage), DevSpot agent.json / agent_log.json. |

**One-liner:** Trusted agent (ERC-8004) that operates a stETH yield treasury; identity and treasury behavior are verifiable onchain.

---

## 4. Vault Position Monitor + Let the Agent Cook

**Concept:** The **Lido vault monitor** is implemented as a **fully autonomous agent**. It discovers (vault state / benchmark changes), plans (what to tell the user), executes (send Telegram/email alert), verifies (e.g. delivery), and submits (logs). Add ERC-8004, agent.json, agent_log.json; treat vault APIs and Telegram/email as real tools.

| Sponsor | How it fits |
|---------|-------------|
| **Lido** | Agent watches Lido Earn vaults; plain-language alerts; benchmark and allocation tracking; MCP-callable vault health. |
| **Protocol Labs** | Same agent is autonomous (discover → plan → execute → verify → submit), with ERC-8004 and structured logs. |

**One-liner:** Lido vault monitor built as a full autonomous agent with ERC-8004 and execution logs.

---

## 5. Lido MCP + Agents With Receipts

**Concept:** Build the **Lido MCP** (and lido.skill.md). A **trusted agent** (ERC-8004, DevSpot manifest) uses that MCP; its onchain/verifiable actions include Lido staking or governance. Identity and Lido actions form the “receipts.”

| Sponsor | How it fits |
|---------|-------------|
| **Lido** | Lido MCP with stETH/wstETH, governance, dry_run, skill file. |
| **Protocol Labs** | Agent with ERC-8004, onchain verifiability (identity + Lido-related transactions), agent.json, agent_log.json. |

**One-liner:** Trusted agent (ERC-8004) that uses the Lido MCP; identity and Lido actions are verifiable.

---

## Summary table

| Combo | Lido track | Protocol Labs track |
|-------|------------|----------------------|
| **Strongest** | Lido MCP | Let the Agent Cook |
| **Strong** | stETH Agent Treasury | Let the Agent Cook |
| **Strong** | stETH Agent Treasury | Agents With Receipts |
| **Good** | Vault Position Monitor | Let the Agent Cook |
| **Good** | Lido MCP | Agents With Receipts |

---

## Recommended focus

**Best single project:** **Lido MCP + Let the Agent Cook** — build the reference Lido MCP (and lido.skill.md), then build an autonomous agent that uses it. One repo, one demo; clear fit for both Lido and Protocol Labs (Let the Agent Cook).

---

## Bounty quick reference

| Sponsor | Track | Prize (total) |
|--------|-------|----------------|
| **Lido** | stETH Agent Treasury | $3,000 |
| **Lido** | Vault Position Monitor + Alert Agent | $2,000 |
| **Lido** | Lido MCP | $5,000 |
| **Protocol Labs** | Let the Agent Cook | $8,000 |
| **Protocol Labs** | Agents With Receipts (ERC-8004) | $8,004 |

Full criteria and links: [PARTNERS_AND_BOUNTIES.md](./PARTNERS_AND_BOUNTIES.md).
