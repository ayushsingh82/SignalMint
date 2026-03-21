import fs from "fs";
import path from "path";
import { ipfsToHttps, isLikelyIpfsUri } from "./ipfs";
import type { Mint } from "./types";

/** One merged Rare mint from agent logs (before metadata fetch). */
interface RareMintRaw {
  txHash: string;
  tokenId: string;
  contract: string;
  timestamp: Date;
  identityId?: string;
  metadataUri?: string;
  metadataGatewayUrl?: string;
  imageIpfsUri?: string;
  signal: string;
}

interface AgentLogFile {
  decisions?: Array<{
    id: string;
    conditionCheck?: {
      metric: string;
      operator: string;
      threshold: number;
    };
    signalSnapshot?: { type: string };
  }>;
  executions?: Array<{
    type: string;
    result: string;
    txHash?: string;
    timestamp: string;
    metadata?: Record<string, unknown>;
  }>;
}

function mergeMintExecutionsFromLog(log: AgentLogFile): Map<string, RareMintRaw> {
  const executions = log.executions ?? [];
  const decisions = log.decisions ?? [];
  const metaByTx = new Map<string, Record<string, unknown>>();

  for (const ex of executions) {
    if (ex.type !== "MINT_NFT" || ex.result !== "success") continue;
    const md = ex.metadata ?? {};
    const tx = String(ex.txHash || md.transactionSent || md.txHash || "").toLowerCase();
    if (!tx.startsWith("0x")) continue;

    const prev = metaByTx.get(tx) ?? {};
    metaByTx.set(tx, { ...prev, ...md });
  }

  const contractFilter = process.env.RARE_CONTRACT_ADDRESS?.toLowerCase();
  const envIdentityId = process.env.ERC8004_AGENT_ID?.trim();
  const out = new Map<string, RareMintRaw>();

  for (const [txHash, meta] of metaByTx) {
    const tokenId = String(meta.tokenId ?? meta.nftMintedTokenId ?? "").trim();
    if (!tokenId) continue;

    const contract = String(
      meta.contractAddress ?? meta.contract ?? process.env.RARE_CONTRACT_ADDRESS ?? ""
    ).trim();
    if (!contract.startsWith("0x")) continue;

    if (contractFilter && contract.toLowerCase() !== contractFilter) continue;

    const metadataUri =
      typeof meta.uri === "string" && isLikelyIpfsUri(meta.uri) ? meta.uri : undefined;
    const metadataGatewayUrl =
      typeof meta.gatewayUrl === "string" && meta.gatewayUrl.startsWith("http")
        ? meta.gatewayUrl
        : undefined;

    const imageIpfsUri =
      typeof meta.ipfsUri === "string" && isLikelyIpfsUri(meta.ipfsUri)
        ? meta.ipfsUri
        : undefined;

    const identityId = String(
      meta.identityId ??
      meta.erc8004IdentityId ??
      meta.agentId ??
      envIdentityId ??
      ""
    ).trim() || undefined;

    // Need at least metadata or image on IPFS to count as Rare/IPFS-backed
    if (!metadataUri && !metadataGatewayUrl && !imageIpfsUri) continue;

    const decisionId = typeof meta.decisionId === "string" ? meta.decisionId : undefined;
    let signal = "Rare Protocol";
    if (decisionId) {
      const dec = decisions.find((d) => d.id === decisionId);
      if (dec?.signalSnapshot?.type) signal = dec.signalSnapshot.type.replace(/_/g, " ");
      else if (dec?.conditionCheck) {
        const c = dec.conditionCheck;
        signal = `${c.metric} ${c.operator} ${c.threshold}`;
      }
    }

    const tsCandidates = executions
      .filter(
        (e) =>
          e.type === "MINT_NFT" &&
          e.result === "success" &&
          String(e.txHash || e.metadata?.txHash || e.metadata?.transactionSent || "").toLowerCase() ===
            txHash
      )
      .map((e) => new Date(e.timestamp).getTime());
    const timestamp = new Date(Math.max(...tsCandidates, 0));

    out.set(txHash, {
      txHash,
      tokenId,
      contract,
      timestamp,
      identityId,
      metadataUri,
      metadataGatewayUrl,
      imageIpfsUri,
      signal,
    });
  }

  return out;
}

function readAllRareMintsFromLogs(logDir: string): RareMintRaw[] {
  if (!fs.existsSync(logDir)) return [];

  const files = fs.readdirSync(logDir).filter((f) => f.startsWith("agent_log_") && f.endsWith(".json"));

  const byTx = new Map<string, RareMintRaw>();

  for (const file of files) {
    const full = path.join(logDir, file);
    let raw: string;
    try {
      raw = fs.readFileSync(full, "utf-8");
    } catch {
      continue;
    }
    let log: AgentLogFile;
    try {
      log = JSON.parse(raw) as AgentLogFile;
    } catch {
      continue;
    }

    const merged = mergeMintExecutionsFromLog(log);
    for (const [tx, mint] of merged) {
      const existing = byTx.get(tx);
      if (!existing || mint.timestamp >= existing.timestamp) {
        byTx.set(tx, mint);
      }
    }
  }

  return Array.from(byTx.values()).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}

function nftExplorerUrl(chain: string, contract: string, tokenId: string): string {
  const c = chain.toLowerCase();
  const addr = contract;
  if (c === "sepolia") {
    return `https://sepolia.etherscan.io/nft/${addr}/${tokenId}`;
  }
  if (c === "base-sepolia" || c === "basesepolia") {
    return `https://sepolia.basescan.org/nft/${addr}/${tokenId}`;
  }
  if (c === "base") {
    return `https://basescan.org/nft/${addr}/${tokenId}`;
  }
  return `https://etherscan.io/nft/${addr}/${tokenId}`;
}

interface NftMetadataJson {
  name?: string;
  description?: string;
  image?: string;
}

async function fetchMetadata(
  metadataUrl: string
): Promise<NftMetadataJson | null> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 12_000);
    const res = await fetch(metadataUrl, {
      signal: ctrl.signal,
      headers: { Accept: "application/json" },
      next: { revalidate: 300 },
    });
    clearTimeout(t);
    if (!res.ok) return null;
    return (await res.json()) as NftMetadataJson;
  } catch {
    return null;
  }
}

/**
 * Load Rare mints from agent logs, newest first. Resolves IPFS metadata JSON to get `image` (HTTPS gateway).
 */
export async function getRareMintsFromAgentLogs(options?: {
  limit?: number;
  logDir?: string;
}): Promise<Mint[]> {
  const limit = options?.limit ?? 48;
  const logDir = options?.logDir ?? path.join(process.cwd(), "logs");
  const chain = process.env.RARE_CHAIN || "sepolia";

  const raws = readAllRareMintsFromLogs(logDir).slice(0, limit);

  const enriched = await Promise.all(
    raws.map(async (raw): Promise<Mint> => {
      const metaUrl =
        raw.metadataGatewayUrl ||
        (raw.metadataUri ? ipfsToHttps(raw.metadataUri) : undefined);

      let name = `Market Signal #${raw.tokenId}`;
      let imageUri: string | undefined = raw.imageIpfsUri
        ? ipfsToHttps(raw.imageIpfsUri)
        : undefined;

      if (metaUrl) {
        const json = await fetchMetadata(metaUrl);
        if (json?.name) name = json.name;
        if (json?.image) {
          imageUri = json.image.startsWith("http") ? json.image : ipfsToHttps(json.image);
        }
      }

      const explorerUrl = nftExplorerUrl(chain, raw.contract, raw.tokenId);
      const txExplorer =
        raw.txHash.length > 10
          ? chain === "sepolia"
            ? `https://sepolia.etherscan.io/tx/${raw.txHash}`
            : `https://etherscan.io/tx/${raw.txHash}`
          : undefined;

      return {
        id: raw.txHash,
        name,
        signal: raw.signal,
        status: "minted",
        identityId: raw.identityId,
        imageUri,
        tokenId: raw.tokenId,
        explorerUrl,
        mintedAt: raw.timestamp.toISOString(),
        metadataUri: raw.metadataUri ?? raw.metadataGatewayUrl,
        txHash: raw.txHash,
        txExplorerUrl: txExplorer,
        protocol: "rare",
      };
    })
  );

  return enriched;
}
