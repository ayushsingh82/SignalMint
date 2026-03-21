/**
 * Writes 3 sample NFT SVGs (different pre-built backgrounds) to logs/nft-images/.
 * Open them in a browser or VS Code to review art before / without on-chain mint.
 *
 * Run: npm run art:preview
 */
import path from "path";
import type { Decision } from "../shared/types";
import { writeSignalArtToFile } from "../utils/signal-art";

function sampleDecision(id: string, confidence: number): Decision {
  return {
    id,
    signalId: `signal_${id}`,
    type: "MINT",
    confidence,
    reasoning: "Style preview",
    estimatedCost: "0",
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
  const cwd = process.cwd();
  const stamp = Date.now();
  // Force three different backgrounds (sorted: 01…08 — jade, crimson, golden)
  const samples: Array<{ label: string; confidence: number; bgIdx: number }> = [
    { label: "Midnight jade", confidence: 0.42, bgIdx: 6 },
    { label: "Crimson nebula", confidence: 0.72, bgIdx: 7 },
    { label: "Golden signal", confidence: 0.72, bgIdx: 4 },
  ];

  console.log("Generating 3 preview NFT SVGs…\n");

  for (let i = 0; i < samples.length; i++) {
    const s = samples[i];
    const decisionId = `preview_style_${stamp}_${i + 1}`;
    const decision = sampleDecision(decisionId, s.confidence);
    const nftName = `SignalMint preview ${i + 1}`;
    const out = writeSignalArtToFile(decision, nftName, {
      cwd,
      fileName: `preview-style-${i + 1}-${stamp}.svg`,
      forceBackgroundIndex: s.bgIdx,
    });
    console.log(`  ${i + 1}. ${s.label}`);
    console.log(`     → ${path.relative(cwd, out)}\n`);
  }

  console.log("Done. Open the files above to compare backgrounds and the bottom plate.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
