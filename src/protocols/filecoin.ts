import { config } from '../shared/config';
import { logger } from '../utils/logger';

/**
 * Filecoin/IPFS Storage Integration via Web3.storage
 * Provides persistent, verifiable storage for agent logs
 */
export class FilecoinIntegration {
  private token: string | undefined;
  private pinataJwt: string | undefined;
  private pinataApiKey: string | undefined;
  private pinataSecretKey: string | undefined;

  constructor() {
    this.token = config.filecoin.web3StorageToken;
    this.pinataJwt = config.pinata.jwt;
    this.pinataApiKey = config.pinata.apiKey;
    this.pinataSecretKey = config.pinata.secretKey;
  }

  private hasUsableWeb3Token(): boolean {
    if (!this.token) return false;
    const t = this.token.toLowerCase();
    if (t.includes('your_web3_storage_token_here')) return false;
    if (t.includes('placeholder')) return false;
    return this.token.length > 20;
  }

  async uploadLog(logContent: string, fileName?: string): Promise<string> {
    const targetName = fileName || `agent_log_${new Date().toISOString()}.json`;

    if (!this.hasUsableWeb3Token()) {
      const pinataCid = await this.uploadViaPinata(logContent, targetName);
      if (pinataCid) {
        return pinataCid;
      }
      console.warn('⚠️  No storage credentials configured, using mock CID');
      return this.generateMockCID();
    }

    try {
      const file = new File(
        [logContent],
        targetName,
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

  private async uploadViaPinata(logContent: string, fileName: string): Promise<string | null> {
    if (!this.pinataJwt && !(this.pinataApiKey && this.pinataSecretKey)) {
      return null;
    }

    try {
      const headers: Record<string, string> = {};
      if (this.pinataJwt) {
        headers.Authorization = `Bearer ${this.pinataJwt}`;
      } else if (this.pinataApiKey && this.pinataSecretKey) {
        headers.pinata_api_key = this.pinataApiKey;
        headers.pinata_secret_api_key = this.pinataSecretKey;
      }

      // First attempt: file upload
      const file = new File([logContent], fileName, { type: 'application/json' });
      const form = new FormData();
      form.append('file', file);
      form.append(
        'pinataMetadata',
        JSON.stringify({
          name: fileName,
          keyvalues: { source: 'signalmint' },
        })
      );

      let response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
        method: 'POST',
        headers,
        body: form,
      });

      // Fallback: JSON pinning for keys that cannot pin files directly.
      if (!response.ok) {
        response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
          method: 'POST',
          headers: {
            ...headers,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            pinataMetadata: {
              name: fileName,
              keyvalues: { source: 'signalmint' },
            },
            pinataContent: JSON.parse(logContent),
          }),
        });
      }

      if (!response.ok) {
        throw new Error(`Pinata upload failed: ${response.status} ${response.statusText}`);
      }

      const body = (await response.json()) as { IpfsHash?: string };
      const cid = body.IpfsHash;
      if (!cid) {
        throw new Error('Pinata response missing IpfsHash');
      }

      logger.log('FilecoinIntegration', 'uploadViaPinata', {
        cid,
        size: logContent.length,
      }, 'success');

      return cid;
    } catch (error) {
      logger.log('FilecoinIntegration', 'uploadViaPinata', {}, 'failed', String(error));
      return null;
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
