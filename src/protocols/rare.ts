import { execSync } from 'child_process';
import { config } from '../shared/config';
import { logger } from '../utils/logger';
import { Validator, RetryableExecutor } from '../utils/helpers';

type RareParsedOutput = Record<string, unknown> & {
  txHash?: string;
  tokenId?: number | string;
  ipfsUri?: string;
  contractAddress?: string;
  auctionId?: number | string;
  tokens?: unknown[];
  transactionHash?: string;
  hash?: string;
  contract?: string;
  collectionAddress?: string;
  tokenUri?: string;
  uri?: string;
};

/**
 * Rare Protocol CLI Integration for NFT operations
 * Handles minting, auctions, and collection management
 */
export class RareIntegration {
  private chain: string;
  private rpcUrl: string;
  private isInitialized: boolean = false;

  constructor() {
    this.chain = config.rare.chain;
    this.rpcUrl = config.rare.rpcUrl;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Configure Rare CLI with agent wallet
      this.executeCommand(
        `rare configure --chain ${this.chain} --private-key ${config.agent.privateKey} --rpc-url ${this.rpcUrl}`
      );

      logger.log('RareIntegration', 'initialized', {
        chain: this.chain,
        configured: true,
      }, 'success');

      this.isInitialized = true;
    } catch (error) {
      logger.log('RareIntegration', 'initialize', {}, 'failed', String(error));
      throw error;
    }
  }

  async deployCollection(
    name: string,
    symbol: string,
    maxTokens?: number
  ): Promise<string> {
    if (!this.isInitialized) await this.initialize();

    return RetryableExecutor.execute(async () => {
      Validator.validateMintParams({ name, description: symbol });

      let cmd = `rare deploy erc721 "${name}" "${symbol}"`;
      if (maxTokens) {
        cmd += ` --max-tokens ${maxTokens}`;
      }

      const output = this.executeCommand(cmd);
      const result = this.parseOutput(output);

      logger.log('RareIntegration', 'deployCollection', {
        name,
        symbol,
        contractAddress: result.contractAddress,
      }, 'success');

      logger.recordExecution({
        id: `deploy_${Date.now()}`,
        type: 'DEPLOY_COLLECTION',
        result: 'success',
        metadata: result,
        timestamp: new Date(),
        attempts: 1,
      }, true);

      return String(result.contractAddress || '');
    }, 3);
  }

  async mintNFT(
    contractAddress: string,
    name: string,
    description: string,
    imagePath: string,
    attributes: Record<string, string> = {}
  ): Promise<{ txHash: string; tokenId: number; ipfsUri: string }> {
    if (!this.isInitialized) await this.initialize();

    return RetryableExecutor.execute(async () => {
      Validator.validateMintParams({
        contractAddress,
        name,
        description,
      });

      let cmd = `rare mint --contract ${contractAddress} ` +
        `--name "${name}" --description "${description}" ` +
        `--image ${imagePath}`;

      // Add attributes
      for (const [key, value] of Object.entries(attributes)) {
        cmd += ` --attribute "${key}=${value}"`;
      }

      const output = this.executeCommand(cmd);
      const result = this.parseOutput(output);

      logger.log('RareIntegration', 'mintNFT', {
        contract: contractAddress,
        tokenId: result.tokenId,
        txHash: result.txHash,
        ipfsUri: result.ipfsUri,
      }, 'success');

      logger.recordExecution({
        id: `mint_${Date.now()}`,
        type: 'MINT_NFT',
        txHash: String(result.txHash || ''),
        result: 'success',
        metadata: result,
        timestamp: new Date(),
        attempts: 1,
      }, true);

      return {
        txHash: String(result.txHash || ''),
        tokenId: Number(result.tokenId || 0),
        ipfsUri: String(result.ipfsUri || ''),
      };
    }, 3);
  }

  async createAuction(
    contractAddress: string,
    tokenId: number,
    startingPrice: string,
    durationSeconds: number = 86400
  ): Promise<{ txHash: string; auctionId: number }> {
    if (!this.isInitialized) await this.initialize();

    return RetryableExecutor.execute(async () => {
      if (!Validator.isValidEthereumAddress(contractAddress)) {
        throw new Error('Invalid contract address');
      }

      const cmd = `rare auction create --contract ${contractAddress} ` +
        `--token-id ${tokenId} --starting-price ${startingPrice} ` +
        `--duration ${durationSeconds}`;

      const output = this.executeCommand(cmd);
      const result = this.parseOutput(output);

      logger.log('RareIntegration', 'createAuction', {
        contract: contractAddress,
        tokenId,
        startingPrice,
        auctionId: result.auctionId,
        txHash: result.txHash,
      }, 'success');

      logger.recordExecution({
        id: `auction_${Date.now()}`,
        type: 'CREATE_AUCTION',
        txHash: String(result.txHash || ''),
        result: 'success',
        metadata: result,
        timestamp: new Date(),
        attempts: 1,
      }, true);

      return {
        txHash: String(result.txHash || ''),
        auctionId: Number(result.auctionId || 0),
      };
    }, 3);
  }

  async getAuctionStatus(
    contractAddress: string,
    tokenId: number
  ): Promise<RareParsedOutput> {
    if (!this.isInitialized) await this.initialize();

    try {
      const cmd = `rare auction status --contract ${contractAddress} --token-id ${tokenId}`;
      const output = this.executeCommand(cmd);
      return this.parseOutput(output);
    } catch (error) {
      logger.log('RareIntegration', 'getAuctionStatus', { contractAddress, tokenId }, 'failed', String(error));
      throw error;
    }
  }

  async settleAuction(
    contractAddress: string,
    tokenId: number
  ): Promise<{ txHash: string }> {
    if (!this.isInitialized) await this.initialize();

    return RetryableExecutor.execute(async () => {
      const cmd = `rare auction settle --contract ${contractAddress} --token-id ${tokenId}`;
      const output = this.executeCommand(cmd);
      const result = this.parseOutput(output);

      logger.log('RareIntegration', 'settleAuction', {
        contract: contractAddress,
        tokenId,
        txHash: result.txHash,
      }, 'success');

      return { txHash: String(result.txHash || '') };
    }, 3);
  }

  async searchOwnTokens(limit: number = 10): Promise<unknown[]> {
    if (!this.isInitialized) await this.initialize();

    try {
      const cmd = `rare search tokens --mine --take ${limit}`;
      const output = this.executeCommand(cmd);
      const result = this.parseOutput(output);
      return result.tokens || [];
    } catch (error) {
      logger.log('RareIntegration', 'searchOwnTokens', {}, 'failed', String(error));
      throw error;
    }
  }

  private executeCommand(cmd: string): string {
    try {
      console.log(`\n🔧 Executing: ${cmd}`);
      const output = execSync(cmd, {
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe'],
      });
      return output.trim();
    } catch (error: unknown) {
      const err = error as { stderr?: string | Buffer; stdout?: string | Buffer };
      const errorMsg = err.stderr?.toString() || err.stdout?.toString() || String(error);
      console.error(`❌ Command failed: ${errorMsg}`);
      throw new Error(`Rare CLI error: ${errorMsg}`);
    }
  }

  private parseOutput(output: string): RareParsedOutput {
    try {
      // Try parsing as JSON first
      const parsed = JSON.parse(output);
      return this.normalizeParsedOutput(parsed);
    } catch {
      // If not JSON, try to extract key-value pairs
      const result: Record<string, unknown> = {};
      const lines = output.split('\n');

      for (const line of lines) {
        if (line.includes(':')) {
          const idx = line.indexOf(':');
          const key = line.slice(0, idx).trim();
          const value = line.slice(idx + 1).trim();
          result[this.camelCase(key)] = value;
        }
      }

      const txHashMatch = output.match(/0x[a-fA-F0-9]{64}/);
      if (txHashMatch) {
        result.txHash = txHashMatch[0];
      }

      const tokenIdMatch = output.match(/token\s*id\s*[:=]?\s*(\d+)/i) || output.match(/tokenId\s*[:=]?\s*(\d+)/i);
      if (tokenIdMatch) {
        result.tokenId = Number(tokenIdMatch[1]);
      }

      const contractMatch = output.match(/contract\s*[:=]?\s*(0x[a-fA-F0-9]{40})/i);
      if (contractMatch) {
        result.contractAddress = contractMatch[1];
      }

      const deployedMatch = output.match(/deployed\s+at\s*[:=]?\s*(0x[a-fA-F0-9]{40})/i);
      if (deployedMatch) {
        result.contractAddress = deployedMatch[1];
      }

      const ipfsMatch = output.match(/ipfs:\/\/[A-Za-z0-9]+/i);
      if (ipfsMatch) {
        result.ipfsUri = ipfsMatch[0];
      }

      return this.normalizeParsedOutput(result as RareParsedOutput);
    }
  }

  private normalizeParsedOutput(input: RareParsedOutput): RareParsedOutput {
    const out = { ...input };
    if (typeof out.tokenId === 'string' && /^\d+$/.test(out.tokenId)) {
      out.tokenId = Number(out.tokenId);
    }

    out.txHash = out.txHash || out.transactionHash || out.hash;
    out.contractAddress = out.contractAddress || out.contract || out.collectionAddress;
    out.ipfsUri = out.ipfsUri || out.tokenUri || out.uri;
    return out;
  }

  private camelCase(str: string): string {
    return str.toLowerCase().replace(/[^a-z0-9]+(.)/g, (_, chr) => chr.toUpperCase());
  }
}

export const rareIntegration = new RareIntegration();
