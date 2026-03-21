/**
 * Mint 3 NFTs on-chain via Rare CLI (same image pipeline as the agent).
 * Requires: rare CLI, AGENT_PRIVATE_KEY, RARE_RPC_URL, RARE_CONTRACT_ADDRESS, dotenv optional.
 *
 * Run: npm run mint:three
 */
import dotenv from "dotenv";
dotenv.config();

import path from "path";
import { config } from "../shared/config";
import { rareIntegration } from "../protocols/rare";
import { logger } from "../utils/logger";
import type { Decision } from "../shared/types";
import { writeSignalArtToFile } from "../utils/signal-art";

function sampleDecision(id: string, confidence: number): Decision {
  return {
    id,
    signalId: `signal_${id}`,
    type: "MINT",
    confidence,
    reasoning: "Manual triple mint for style check",
    estimatedCost: "0.05",
    conditionCheck: {
      metric: "ETH_PRICE",
      operator: ">",
      currentValue: 2488.52,
      threshold: 2100,
      passed: true,
    },
    timestamp: new Date(),
  };
}

async function main(): Promise<void> {
  const contract = config.rare.contractAddress?.trim();
  if (!contract) {
    console.error("Set RARE_CONTRACT_ADDRESS in .env (your ERC-721 collection).");
    process.exit(1);
  }

  const pk = config.agent.privateKey?.trim();
  if (!pk || pk.includes("YOUR") || pk.length < 32) {
    console.error("Set AGENT_PRIVATE_KEY in .env to a funded wallet for Rare / gas.");
    process.exit(1);
  }

  const cwd = process.cwd();
  const stamp = Date.now();

  const samples: Array<{ bgIdx: number; confidence: number }> = [
    { bgIdx: 6, confidence: 0.42 },
    { bgIdx: 7, confidence: 0.72 },
    { bgIdx: 4, confidence: 0.72 },
  ];

  console.log("Initializing Rare CLI…");
  await rareIntegration.initialize();

  for (let i = 0; i < samples.length; i++) {
    const s = samples[i];
    const decisionId = `mint_three_${stamp}_${i + 1}`;
    const decision = sampleDecision(decisionId, s.confidence);
    const nftName = `Market Signal style #${i + 1} ${stamp}`;
    const description = `SignalMint style preview mint ${i + 1} of 3.`;

    const imagePath = writeSignalArtToFile(decision, nftName, {
      cwd,
      fileName: `mint-three-${stamp}-${i + 1}.svg`,
      forceBackgroundIndex: s.bgIdx,
    });

    console.log(`\nMinting ${i + 1}/3 → ${path.basename(imagePath)} …`);

    const result = await rareIntegration.mintNFT(contract, nftName, description, imagePath, {
      Preview_Set: "triple_style_check",
      Index: String(i + 1),
    });

    logger.recordExecution(
      {
        id: `mint_three_${stamp}_${i}`,
        type: "MINT_NFT",
        txHash: result.txHash,
        result: "success",
        metadata: { ...result, contract, decisionId },
        timestamp: new Date(),
        attempts: 1,
      },
      true
    );

    console.log(`  tokenId=${result.tokenId} tx=${result.txHash}`);
  }

  const logPath = logger.saveLog(`agent_log_mint_three_${stamp}.json`);
  console.log(`\n✅ Saved log: ${logPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
