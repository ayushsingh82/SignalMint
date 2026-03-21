# SignalMint

## Description

SignalMint is an autonomous, production-style multi-agent system that turns live market intelligence into onchain NFT actions.

Instead of a single-script bot, SignalMint is built as a coordinated runtime with explicit responsibilities, verifiable execution, and protocol-level receipts.

The system runs a full closed loop:

1. Discover: collect market context from multiple live sources.
2. Decide: score confidence and determine mint/skip outcome.
3. Execute: run mint operations using protocol tooling.
4. Verify: confirm outcomes and write tamper-resistant receipts.

Core runtime agents:

1. Scout Agent: gathers price, sentiment, and market state.
2. Analyst Agent: converts signals into structured decisions.
3. Executor Agent: performs protocol actions and mint operations.
4. Verifier Agent: validates results and persists logs to IPFS.

Repository contents:

1. Next.js application for feed/gallery visualization.
2. TypeScript autonomous runtime for continuous agent execution.
3. Protocol adapters for execution, identity, orchestration, and storage.

## Features

1. Multi-agent autonomous loop with clean role separation.
2. Live signal fusion from price, market sentiment, and external context sources.
3. Deterministic decision policy using confidence and threshold constraints.
4. Real onchain mint execution through Rare Protocol tooling.
5. External orchestration visibility through OpenServ workflow triggers.
6. Safe wallet and delegated-session operations through Zyfai SDK.
7. Identity and receipts alignment through ERC-8004-compatible design.
8. Persistent evidence logs and metadata artifacts written to IPFS.
9. Practical operator controls via environment config and runtime guards.
10. Reproducible health checks for protocol-level verification.

## Protocols Used (and Why)

### 1. Rare Protocol

Used for the core action of the product: minting NFTs onchain.

Why this matters:

1. It converts agent decisions into publicly verifiable blockchain outcomes.
2. It gives a clear execution artifact (transaction hash + token id) for judging.
3. It makes the project outcome-driven, not only model-driven.

### 2. OpenServ

Used for external workflow orchestration and webhook-triggered execution of agent events.

Why this matters:

1. Agent communication is observable outside local process memory.
2. Workflow graph structure (trigger-task-edge) is verifiable in a dashboard.
3. The system can be inspected and debugged as an orchestration pipeline, not a black box.

### 3. Zyfai

Used for safe-wallet lifecycle, session key activation, and portfolio/position access.

Why this matters:

1. Enables treasury-style agent operations with controlled delegated execution.
2. Separates signing/auth concerns from business decision logic.
3. Supports long-running agent behavior without manual transaction babysitting.

### 4. Uniswap

Used as a live market intelligence source in the Scout/Analyst signal path.

Why this matters:

1. Adds real-time market signal quality.
2. Reduces dependency on a single upstream pricing source.
3. Grounds decisions in current execution-market conditions.

### 5. CoinMarketCap, NewsAPI, Polymarket

Used as complementary context channels: macro pricing, narrative sentiment, and prediction-market direction.

Why this matters:

1. Improves decision robustness through multi-source confirmation.
2. Reduces overreaction to noisy single-provider spikes.
3. Produces richer, explainable decision metadata in logs.

### 6. ERC-8004

Used for agent identity and receipts-oriented interoperability.

Why this matters:

1. Identity is explicit and auditable.
2. Helps align autonomous actions with a verifiable agent model.
3. Strengthens trust and traceability for judge review.

### 7. Pinata + Filecoin/IPFS

Used for persistent storage of execution logs and metadata artifacts.

Why this matters:

1. Makes post-run evidence immutable and shareable.
2. Preserves receipts beyond ephemeral runtime logs.
3. Improves reproducibility and auditability of autonomous runs.

## Future Scope

1. Adaptive strategy engine:
	- Move from static thresholds to dynamic policy adaptation from historical outcomes.
2. Multi-chain execution planner:
	- Select mint and settlement routes by gas, latency, and liquidity context.
3. Stronger verifier evidence bundles:
	- Attach structured proofs, workflow trace IDs, and signed result snapshots.
4. Policy and governance controls:
	- Add execution budgets, risk caps, and supervised override windows.
5. Replayable observability:
	- Full per-cycle decision replay with event timeline and protocol receipts.
6. Advanced evaluation harness:
	- Benchmark decision quality over large historical windows and live drift periods.

## Architecture Summary

SignalMint is organized around an event-driven runtime plus protocol adapters.

1. Runtime orchestration:
	- Agent entrypoint initializes services and starts autonomous cycles.
2. Internal communication:
	- Message bus coordinates event handoff across agents.
3. External observability:
	- OpenServ mirrors key agent events through workflow-trigger execution.
4. Execution receipts:
	- Verifier writes persistent logs and artifacts for post-run proof.

## Why this is not a dummy demo

SignalMint is built to be judged by outcomes, not claims.

1. Decisions create real execution attempts.
2. Successful runs produce real mint transactions.
3. Logs include structured decision context and outcomes.
4. OpenServ workflow health can be queried directly.
5. Zyfai wallet/session state can be validated with SDK checks.

## Quick Start

### 1) Install

```bash
npm install
```

### 2) Configure

Copy [.env.example](.env.example) to `.env` and set at least:

1. AGENT_PRIVATE_KEY
2. AGENT_ADDRESS
3. RARE_CHAIN, RARE_RPC_URL, RARE_CONTRACT_ADDRESS
4. UNISWAP_API_KEY
5. OPENSERV_API_KEY
6. ZYFAI_API_KEY, ZYFAI_PRIVATE_KEY, ZYFAI_USER_EOA, ZYFAI_CHAIN

### 3) Run app

```bash
npm run dev
```

### 4) Run autonomous runtime

```bash
npm run agent:build
npm run agent:dev
```

## Operator Notes

### Zyfai EOA requirement

Zyfai requires a valid EOA for `ZYFAI_USER_EOA` on the configured chain.

1. If agent wallet is valid EOA:
	- Reuse AGENT private key/address.
2. If not:
	- Use a dedicated Zyfai EOA key/address pair.

Recommended: `ZYFAI_CHAIN=base`.

### OpenServ worker requirement

OpenServ workflow tasks require an executable worker agent.

1. `OPENSERV_WORKER_AGENT_ID` is optional.
2. Default runtime worker id is `3`.

## Health Checks (judge-friendly)

### Zyfai health check

```bash
node -e 'require("dotenv").config(); const {ZyfaiSDK}=require("@zyfai/sdk"); (async()=>{ const chainId=process.env.ZYFAI_CHAIN==="arbitrum"?42161:(process.env.ZYFAI_CHAIN==="plasma"?9745:8453); const sdk=new ZyfaiSDK({apiKey:process.env.ZYFAI_API_KEY,referralSource:"signalmint"}); await sdk.connectAccount(process.env.ZYFAI_PRIVATE_KEY,chainId); const user=process.env.ZYFAI_USER_EOA; const wallet=await sdk.getSmartWalletAddress(user,chainId); if(wallet.isDeployed===false){ await sdk.deploySafe(user,chainId,"conservative"); } const session=await sdk.createSessionKey(user,chainId); const positions=await sdk.getPositions(user,chainId); console.log(JSON.stringify({user,chainId,safeAddress:wallet.address,safeDeployed:wallet.isDeployed,sessionActive:(session.alreadyActive===true)||(session.sessionActivation!=null),positionsOk:positions.success===true},null,2)); })().catch((e)=>{ console.error("zyfai_check_failed",String(e)); process.exit(1); });'
```

Expected:

1. `safeDeployed: true`
2. `sessionActive: true`
3. `positionsOk: true`

### OpenServ health check

```bash
node -e 'require("dotenv").config(); const {PlatformClient}=require("@openserv-labs/client"); (async()=>{ const c=new PlatformClient(); await c.authenticate(process.env.AGENT_PRIVATE_KEY); const all=await c.workflows.list(); const wf=all.find((w)=>w.name==="SignalMint System"); if(wf==null){ throw new Error("SignalMint System not found"); } const full=await c.workflows.get({id:wf.id}); const result=await c.triggers.fireWebhook({workflowId:Number(wf.id),triggerName:"signalmint-webhook",input:{source:"health-check",at:new Date().toISOString()}}); console.log(JSON.stringify({workflowId:wf.id,status:full.status,triggers:(full.triggers||[]).length,tasks:(full.tasks||[]).length,edges:(full.edges||[]).length,webhookCallOk:result!=null},null,2)); })().catch((e)=>{ console.error("openserv_check_failed",String(e)); process.exit(1); });'
```

Expected:

1. `status: "running"`
2. `triggers: 1`
3. `tasks: 1`
4. `edges: 1`
5. `webhookCallOk: true`

## Repository Guide

1. Agent runtime entry: [src/agents/main.ts](src/agents/main.ts)
2. Protocol adapters: [src/protocols](src/protocols)
3. Message bus: [src/shared/message.ts](src/shared/message.ts)
4. App routes and pages: [src/app](src/app)
5. Additional data/API notes: [src/README.md](src/README.md)

## Supporting Docs

1. [md/PROTOCOL_LABS_TRACK_CHECKLIST.md](md/PROTOCOL_LABS_TRACK_CHECKLIST.md)
2. [md/BUILD_AN_AGENT.md](md/BUILD_AN_AGENT.md)
3. [md/SYNTHESIS.md](md/SYNTHESIS.md)
4. [md/skill.md](md/skill.md)

SignalMint is designed to be credible under scrutiny: measurable behavior, real protocol calls, and verifiable receipts.

## Quick Start

### 1) Install

```bash
npm install
```

### 2) Configure

Copy [.env.example](.env.example) to `.env` and set at least:

- AGENT_PRIVATE_KEY
- AGENT_ADDRESS
- RARE_CHAIN, RARE_RPC_URL, RARE_CONTRACT_ADDRESS
- UNISWAP_API_KEY
- OPENSERV_API_KEY
- ZYFAI_API_KEY, ZYFAI_PRIVATE_KEY, ZYFAI_USER_EOA, ZYFAI_CHAIN

### 3) Run app

```bash
npm run dev
```

### 4) Run autonomous runtime

```bash
npm run agent:build
npm run agent:dev
```

## Docs

- [md/PROTOCOL_LABS_TRACK_CHECKLIST.md](md/PROTOCOL_LABS_TRACK_CHECKLIST.md)
- [md/BUILD_AN_AGENT.md](md/BUILD_AN_AGENT.md)
- [md/SYNTHESIS.md](md/SYNTHESIS.md)
- [md/skill.md](md/skill.md)
- [src/README.md](src/README.md)
