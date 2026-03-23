import { Execution, AgentMessage, Decision } from '../shared/types';
import { messageBus } from '../shared/message';
import { rareIntegration } from '../protocols/rare';
import { uniswapIntegration } from '../protocols/uniswap';
import { config } from '../shared/config';
import { logger } from '../utils/logger';
import { RetryableExecutor } from '../utils/helpers';
import { writeSignalArtToFile } from '../utils/signal-art';

/**
 * Executor Agent: Executes autonomous actions
 * Mints NFTs via Rare Protocol, executes swaps via Uniswap
 */
export class ExecutorAgent {
  private nftContract: string | null = null;
  private isInitialized: boolean = false;
  private executionLog: Execution[] = [];
  private mintCooldownMs = config.signals.mintCooldownMs;
  private duplicateSignalWindowMs = config.signals.duplicateSignalWindowMs;
  private lastMintAt: number = 0;
  private recentMintSignatures = new Map<string, number>();

  /**
   * Initialize executor (deploy NFT collection if needed)
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      console.log('🚀 [ExecutorAgent] Initializing...');

      // Initialize Rare CLI
      await rareIntegration.initialize();

      // Use configured contract when available, otherwise deploy a new collection.
      if (config.rare.contractAddress) {
        this.nftContract = config.rare.contractAddress;
      } else if (!this.nftContract) {
        this.nftContract = await rareIntegration.deployCollection(
          'SignalMint Gallery',
          'SMINT',
          10000
        );
        console.log(`✅ Deployed NFT collection: ${this.nftContract}`);
      }

      this.isInitialized = true;
    } catch (error) {
      logger.log('ExecutorAgent', 'initialize', {}, 'failed', String(error));
      throw error;
    }
  }

  /**
   * Process decision and execute actions
   */
  async run(message: AgentMessage): Promise<void> {
    try {
      if (message.type !== 'decision') {
        return;
      }

      const decision = message.payload as Decision;

      console.log(`\n⚙️  [ExecutorAgent] Executing decision: ${decision.type}`);

      if (decision.type === 'MINT') {
        if (!this.canMintFromDecision(decision)) {
          logger.log('ExecutorAgent', 'mint_blocked_by_condition', {
            decisionId: decision.id,
            conditionCheck: decision.conditionCheck,
          }, 'failed');

          const blockedExecution: Execution = {
            id: `exec_mint_blocked_${Date.now()}`,
            type: 'MINT_NFT',
            result: 'failed',
            error: 'Mint blocked: condition check did not pass in ExecutorAgent',
            metadata: {
              decisionId: decision.id,
              conditionCheck: decision.conditionCheck,
            },
            timestamp: new Date(),
            attempts: 1,
          };

          logger.recordExecution(blockedExecution, false);
          this.executionLog.push(blockedExecution);
          await messageBus.sendMessage({
            from: 'ExecutorAgent',
            to: 'VerifierAgent',
            type: 'execution_result',
            payload: blockedExecution,
            timestamp: new Date(),
          });
          return;
        }

        const duplicateReason = this.getDuplicateMintReason(decision);
        if (duplicateReason) {
          logger.log('ExecutorAgent', 'mint_blocked_duplicate', {
            decisionId: decision.id,
            reason: duplicateReason,
          }, 'failed');

          const duplicateBlocked: Execution = {
            id: `exec_mint_duplicate_${Date.now()}`,
            type: 'MINT_NFT',
            result: 'failed',
            error: `Mint blocked: ${duplicateReason}`,
            metadata: {
              decisionId: decision.id,
              signalSnapshot: decision.signalSnapshot,
            },
            timestamp: new Date(),
            attempts: 1,
          };

          logger.recordExecution(duplicateBlocked, false);
          this.executionLog.push(duplicateBlocked);
          await messageBus.sendMessage({
            from: 'ExecutorAgent',
            to: 'VerifierAgent',
            type: 'execution_result',
            payload: duplicateBlocked,
            timestamp: new Date(),
          });
          return;
        }

        // Execute mint + optional swap
        const execution = await this.executeMint(decision);

        if (execution.result === 'success') {
          this.lastMintAt = Date.now();
          const signature = this.buildMintSignature(decision);
          this.recentMintSignatures.set(signature, Date.now());
          this.cleanupMintSignatureCache();
        }

        logger.log('ExecutorAgent', 'execution_completed', {
          type: execution.type,
          txHash: execution.txHash,
          result: execution.result,
        }, 'success');

        logger.recordExecution(execution, execution.result === 'success');
        this.executionLog.push(execution);

        // Send to VerifierAgent
        await messageBus.sendMessage({
          from: 'ExecutorAgent',
          to: 'VerifierAgent',
          type: 'execution_result',
          payload: execution,
          timestamp: new Date(),
        });
      } else if (decision.type === 'SKIP') {
        logger.log('ExecutorAgent', 'skipped', {
          decisionId: decision.id,
          reason: decision.reasoning,
        }, 'success');
      }
    } catch (error) {
      logger.log('ExecutorAgent', 'run', {}, 'failed', String(error));
    }
  }

  /**
   * Execute minting flow: generate metadata → mint NFT → optionally create auction
   */
  private async executeMint(decision: Decision): Promise<Execution> {
    if (!this.nftContract) {
      throw new Error('NFT contract not initialized');
    }

    try {
      // Generate metadata for the mint
      const nftName = `Market Signal #${Math.floor(Date.now() / 1000)}`;
      const nftDescription =
        `Autonomous mint triggered by market signal. Decision ID: ${decision.id}`;

      const conditionText = decision.conditionCheck
        ? `${decision.conditionCheck.metric} ${decision.conditionCheck.operator} ${decision.conditionCheck.threshold}`
        : 'UNKNOWN_CONDITION';

      const txRefs = [`decision:${decision.id}`];

      const attributes: Record<string, string> = {
        'Signal_Type': 'ETH_PRICE_SPIKE',
        'Condition': conditionText,
        'Confidence': (decision.confidence * 100).toFixed(2),
        'Condition_Passed': String(Boolean(decision.conditionCheck?.passed)),
        'Observed_Value': String(decision.conditionCheck?.currentValue ?? ''),
        'Timestamp': new Date().toISOString(),
        'Tx_Refs': txRefs.join(','),
        'Decision_ID': decision.id,
      };

      // Mint NFT with explicit condition metadata following Rare CLI attribute format.
      console.log(`🎨 Minting NFT: ${nftName}`);
      const imagePath = this.createSignalArt(decision, nftName);

      const mintResult = await RetryableExecutor.execute(async () => {
        return await rareIntegration.mintNFT(
          this.nftContract!,
          nftName,
          nftDescription,
          imagePath,
          attributes
        );
      }, 3);

      console.log(`✅ NFT minted: tokenId=${mintResult.tokenId}, txHash=${mintResult.txHash}`);

      // Optionally create auction
      if (decision.confidence > 0.9) {
        console.log(`🏆 Creating auction for token ${mintResult.tokenId}...`);

        const auctionResult = await RetryableExecutor.execute(async () => {
          return await rareIntegration.createAuction(
            this.nftContract!,
            mintResult.tokenId,
            '0.1', // 0.1 ETH starting price
            86400 // 24 hours
          );
        }, 2);

        console.log(`✅ Auction created: auctionId=${auctionResult.auctionId}`);

        return {
          id: `exec_mint_${Date.now()}`,
          type: 'MINT_NFT',
          txHash: mintResult.txHash,
          result: 'success',
          metadata: {
            tokenId: mintResult.tokenId,
            contract: this.nftContract,
            ipfsUri: mintResult.ipfsUri,
            auctionId: auctionResult.auctionId,
            decisionId: decision.id,
          },
          timestamp: new Date(),
          attempts: 1,
        };
      }

      return {
        id: `exec_mint_${Date.now()}`,
        type: 'MINT_NFT',
        txHash: mintResult.txHash,
        result: 'success',
        metadata: {
          tokenId: mintResult.tokenId,
          contract: this.nftContract,
          ipfsUri: mintResult.ipfsUri,
          decisionId: decision.id,
        },
        timestamp: new Date(),
        attempts: 1,
      };
    } catch (error) {
      const errorMsg = String(error);
      logger.log('ExecutorAgent', 'executeMint', {}, 'failed', errorMsg);

      return {
        id: `exec_mint_${Date.now()}`,
        type: 'MINT_NFT',
        result: 'failed',
        error: errorMsg,
        metadata: { decisionId: decision.id },
        timestamp: new Date(),
        attempts: 1,
      };
    }
  }

  private canMintFromDecision(decision: Decision): boolean {
    if (decision.type !== 'MINT') return false;
    if (!decision.conditionCheck) return false;
    if (!decision.conditionCheck.passed) return false;
    return true;
  }

  private getDuplicateMintReason(decision: Decision): string | null {
    const now = Date.now();
    if (this.lastMintAt && now - this.lastMintAt < this.mintCooldownMs) {
      return `mint cooldown active (${this.mintCooldownMs}ms)`;
    }

    const signature = this.buildMintSignature(decision);
    const lastSeen = this.recentMintSignatures.get(signature);
    if (lastSeen && now - lastSeen < this.duplicateSignalWindowMs) {
      return 'similar market condition already minted recently';
    }

    return null;
  }

  private buildMintSignature(decision: Decision): string {
    const signalType = decision.signalSnapshot?.type || 'UNKNOWN';
    const signalValue = decision.signalSnapshot?.value ?? decision.conditionCheck?.currentValue ?? 0;
    const priceBucket = Math.round(Number(signalValue) / 25) * 25;
    const confidenceBucket = Math.round(decision.confidence * 10);
    return `${signalType}|${priceBucket}|${confidenceBucket}`;
  }

  private cleanupMintSignatureCache(): void {
    const now = Date.now();
    for (const [key, ts] of this.recentMintSignatures.entries()) {
      if (now - ts >= this.duplicateSignalWindowMs) {
        this.recentMintSignatures.delete(key);
      }
    }
  }

  /**
   * Pre-built SVG backgrounds under assets/nft-backgrounds/ (see utils/signal-art.ts).
   */
  private createSignalArt(decision: Decision, nftName: string): string {
    return writeSignalArtToFile(decision, nftName, { cwd: process.cwd() });
  }

  /**
   * Execute optional swap (e.g., swap funds to cover gas)
   */
  async executeSwap(
    tokenIn: string,
    amountIn: string,
    tokenOut: string
  ): Promise<string> {
    try {
      console.log(`💱 Swapping ${amountIn} ${tokenIn} → ${tokenOut}...`);

      const quote = await uniswapIntegration.getQuote(
        tokenIn,
        amountIn,
        tokenOut,
        1 // 1% slippage
      );

      console.log(`📊 Quote: ${amountIn} ${tokenIn} → ${quote.amountOut} ${tokenOut}`);

      const txHash = await uniswapIntegration.executeSwap({
        tokenIn,
        amountIn,
        tokenOut,
        minAmountOut: quote.amountOut,
        slippage: 1,
      });

      console.log(`✅ Swap executed: ${txHash}`);

      return txHash;
    } catch (error) {
      logger.log('ExecutorAgent', 'executeSwap', { tokenIn, amountIn, tokenOut }, 'failed', String(error));
      throw error;
    }
  }

  /**
   * Start executor agent (subscribe to decision messages)
   */
  async start(): Promise<void> {
    await this.initialize();
    messageBus.onMessage('decision', (msg) => this.run(msg));
    console.log('✅ ExecutorAgent started and listening for decisions');
  }

  /**
   * Get executor statistics
   */
  getStats(): {
    executionsAttempted: number;
    executionsSucceeded: number;
    executionsFailed: number;
    nftContract: string | null;
  } {
    const succeeded = this.executionLog.filter((e) => e.result === 'success').length;
    const failed = this.executionLog.filter((e) => e.result === 'failed').length;

    return {
      executionsAttempted: this.executionLog.length,
      executionsSucceeded: succeeded,
      executionsFailed: failed,
      nftContract: this.nftContract,
    };
  }
}

export const executorAgent = new ExecutorAgent();
