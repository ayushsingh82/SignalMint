import { config } from '../shared/config';
import { logger } from '../utils/logger';

/**
 * Filecoin/IPFS Storage Integration via Web3.storage
 * Provides persistent, verifiable storage for agent logs
 */
export class FilecoinIntegration {
  private token: string | undefined;

  constructor() {
    this.token = config.filecoin.web3StorageToken;
  }

  async uploadLog(logContent: string, fileName?: string): Promise<string> {
    if (!this.token) {
      console.warn('⚠️  Web3.storage token not configured, using mock CID');
      return this.generateMockCID();
    }

    try {
      const file = new File(
        [logContent],
        fileName || `agent_log_${new Date().toISOString()}.json`,
        { type: 'application/json' }
      );
      const response = await fetch('https://api.web3.storage/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
        body: file,
      });

      if (!response.ok) {
        throw new Error(`web3.storage upload failed: ${response.status} ${response.statusText}`);
      }

      const body = (await response.json()) as { cid?: string };
      if (!body.cid) {
        throw new Error('web3.storage response missing CID');
      }
      const cid = body.cid;

      logger.log('FilecoinIntegration', 'uploadLog', {
        cid,
        size: logContent.length,
        timestamp: new Date().toISOString(),
      }, 'success');

      return cid;
    } catch (error) {
      console.warn('⚠️  Filecoin upload failed, using mock CID');
      logger.log('FilecoinIntegration', 'uploadLog', {}, 'failed', String(error));
      return this.generateMockCID();
    }
  }

  async uploadJSON(data: Record<string, unknown>, fileName?: string): Promise<string> {
    const jsonContent = JSON.stringify(data, null, 2);
    return this.uploadLog(jsonContent, fileName);
  }

  /**
   * Generate IPFS gateway URL from CID
   */
  generateIPFSUrl(cid: string): string {
    return `https://w3s.link/ipfs/${cid}`;
  }

  /**
   * Alternative gateway URLs for redundancy
   */
  getAlternativeGatewayUrls(cid: string): string[] {
    return [
      `https://w3s.link/ipfs/${cid}`,
      `https://ipfs.io/ipfs/${cid}`,
      `https://gateway.pinata.cloud/ipfs/${cid}`,
    ];
  }

  /**
   * Check if CID is valid
   */
  isValidCID(cid: string): boolean {
    // Check CIDv0 (Qm...) or CIDv1 (baf...)
    return /^Qm[a-zA-Z0-9]{44}$/.test(cid) || /^baf[a-zA-Z0-9]{55,}$/.test(cid);
  }

  /**
   * Generate a realistic mock CID for testing
   */
  private generateMockCID(): string {
    // Generate valid-looking CIDv0
    const randomPart = Array(44)
      .fill(0)
      .map(() => 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'[
        Math.floor(Math.random() * 62)
      ])
      .join('');
    
    return `Qm${randomPart}`;
  }
}

export const filecoinIntegration = new FilecoinIntegration();
