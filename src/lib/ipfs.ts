/**
 * Resolve ipfs:// and path-style IPFS references to an HTTPS gateway URL.
 */
export function ipfsToHttps(
  uri: string,
  gatewayBase = process.env.IPFS_GATEWAY?.replace(/\/$/, "") || "https://ipfs.io/ipfs"
): string {
  if (!uri || typeof uri !== "string") return uri;
  const trimmed = gatewayBase.replace(/\/$/, "");

  if (uri.startsWith("ipfs://")) {
    const path = uri.slice("ipfs://".length).replace(/^\/+/, "");
    if (path.startsWith("ipfs/")) {
      return `${trimmed}/${path.slice("ipfs/".length)}`;
    }
    return `${trimmed}/${path}`;
  }

  if (uri.startsWith("ipfs/")) {
    return `${trimmed}/${uri.slice("ipfs/".length)}`;
  }

  return uri;
}

export function isLikelyIpfsUri(uri: unknown): uri is string {
  if (typeof uri !== "string") return false;
  if (!uri.startsWith("ipfs://")) return false;
  const rest = uri.slice(7).replace(/^\/+/, "");
  return rest.length >= 10 && rest !== "ipfs";
}
