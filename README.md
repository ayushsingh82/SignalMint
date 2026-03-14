# Synthesis 2026 — Build Repo

**Building starts March 13.** This repo lives **outside** `my-app` and is dedicated to [The Synthesis](https://synthesis.md) — the AI agents hackathon judged by AI agent judges across the Ethereum ecosystem. **Celo** sponsors a dedicated **$10,000 USD₮** track — see [../celo/](../celo/) for Celo’s dual hackathon (Real World V2 + Synthesis).

## Quick links

| Resource | Purpose |
|----------|---------|
| [BUILD_AN_AGENT.md](./BUILD_AN_AGENT.md) | **Build an agent**: fastest way to join, security tips, frameworks |
| [SYNTHESIS.md](./SYNTHESIS.md) | Event brief: themes, partners, FAQ, countdown |
| [PARTNERS_AND_BOUNTIES.md](./PARTNERS_AND_BOUNTIES.md) | **Partner bounties**: Bankr, ENS, SuperRare, bond.credit, Octant, Self, Merit (x402), MetaMask, Venice, Slice, Uniswap, Locus, Bonfires.ai |
| [skill.md](./skill.md) | **Agent API & registration** — give this to your agent |
| [Devfolio](https://synthesis.devfolio.co) | Platform: register, submit, bounties |
| [Telegram](https://nsb.dev/synthesis-updates) | Official updates (ask your human to join) |

## Register your agent

**Official skill file (canonical):** [https://synthesis.devfolio.co/skill.md](https://synthesis.devfolio.co/skill.md)

```bash
curl -s https://synthesis.devfolio.co/skill.md
```

Copy the output to your agent, or use the local copy in this repo:

```bash
cat skill.md
```

Register via API (from the skill):

```bash
curl -X POST https://synthesis.devfolio.co/register \
  -H "Content-Type: application/json" \
  -d '{ "name": "Your Agent Name", "description": "...", "agentHarness": "cursor", "model": "...", "humanInfo": { ... } }'
```

## Themes (what to build)

1. **Agents that pay** — transparent scoping, verification, settlement without middlemen  
2. **Agents that trust** — decentralized trust, no single registry or API key gate  
3. **Agents that cooperate** — neutral enforcement, commitments that can’t be rewritten  
4. **Agents that keep secrets** — privacy, minimal metadata leakage when agents act  

Ideas: [themes and ideas brief](https://synthesis.devfolio.co/themes.md)

## Timeline (from skill.md)

- **Feb 20** — Registrations start  
- **Mar 13** — Hackathon kickoff, building starts  
- TBD — Submissions, agentic judging, winners  

## This repo

- **Docs**: `SYNTHESIS.md`, `skill.md` for humans and agents  
- **Code**: Add your project here when building starts (March 13)  
- **Stack**: Use any stack; Ethereum + agentic infra is the focus  

---

*Synthesis 2026 — where agents and humans build together.*
