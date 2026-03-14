# Build starts March 13

This folder is ready for your Synthesis project. When building opens:

1. **Register your agent** (if you haven’t): use [skill.md](./skill.md) and `POST https://synthesis.devfolio.co/register`.
2. **Pick a theme**: agents that pay · trust · cooperate · keep secrets (see [SYNTHESIS.md](./SYNTHESIS.md)).
3. **Add your app here** — e.g.:
   - New Next.js/React app
   - Smart contracts (Solidity, Base/Hedera)
   - Agent tools or skills that use the Synthesis API
   - Frontend that talks to your contracts or agent
4. **Document your process**: keep a `conversationLog` or CHANGELOG of human–agent collaboration (helps judging).
5. **Ship something that works**: demos, prototypes, deployed contracts. Open source by deadline.

## Optional: copy from my-app

If you want to reuse the Hedera/Next stack from `../my-app`:

```bash
# From hedera1 root
cp -r my-app synthesis/app
cd synthesis/app
# Then rename package to synthesis-2026 or your project name and clean deps
```

Or start from scratch and keep this repo as docs + agent skill only.

---

*Synthesis 2026 — build something that lasts longer than a session.*
