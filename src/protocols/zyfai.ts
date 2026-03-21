import { ZyfaiSDK } from '@zyfai/sdk';
import { config } from '../shared/config';
import { logger } from '../utils/logger';
import { Wallet } from 'ethers';

export class ZyfaiIntegration {
    private sdk: ZyfaiSDK | null = null;
    private isInitialized = false;

    constructor() {
        // SDK instance is created lazily in initialize() once env is loaded.
    }

    async initialize(): Promise<void> {
        if (this.isInitialized) return;

        const apiKey = config.zyfai?.apiKey;
        if (!apiKey) {
            throw new Error('ZYFAI_API_KEY missing');
        }

        const chainId = this.getChainId('base');
        this.sdk = new ZyfaiSDK({
            apiKey,
            referralSource: 'signalmint',
        });
        await this.sdk.connectAccount(this.getSignerPrivateKey(), chainId);

        logger.log('ZyfaiIntegration', 'initialize', { status: 'ready' }, 'success');
        this.isInitialized = true;
    }

    async getOrCreateWallet(): Promise<string> {
        await this.initialize();
        const agentAddress = this.getEoaAddress();
        const chainId = this.getChainId('base');
        const sdk = this.getSdk();

        const walletInfo = await sdk.getSmartWalletAddress(agentAddress, chainId);
        let deployed = walletInfo.isDeployed;
        if (!deployed) {
            try {
                await sdk.deploySafe(agentAddress, chainId, 'conservative');
                deployed = true;
            } catch (error) {
                const message = String(error);
                if (message.includes('is not an EOA')) {
                    throw new Error(
                        `Zyfai requires an EOA for userAddress. Set ZYFAI_USER_EOA in .env to a valid EOA on ${chainId}.`
                    );
                }
                throw error;
            }
        }

        await sdk.createSessionKey(agentAddress, chainId);
        const user = await sdk.getUserDetails();
        if (!user.hasActiveSessionKey) {
            await sdk.createSessionKey(agentAddress, chainId);
        }

        logger.log('ZyfaiIntegration', 'getOrCreateWallet', { wallet: walletInfo.address, deployed }, 'success');
        return walletInfo.address;
    }

    async deposit(tokenAmt: string, chain: string = 'base'): Promise<string> {
        await this.initialize();
        const sdk = this.getSdk();
        const chainId = this.getChainId(chain);
        const userAddress = this.getEoaAddress();
        await this.getOrCreateWallet();

        const response = await sdk.depositFunds(userAddress, chainId, tokenAmt, 'USDC');
        const txHash = response.txHash;

        logger.log('ZyfaiIntegration', 'deposit', { amount: tokenAmt, chain, txHash }, 'success');
        return txHash;
    }

    async getYieldBalance(chain: string = 'base'): Promise<{ principal: string, yield: string }> {
        await this.initialize();
        const sdk = this.getSdk();
        const chainId = this.getChainId(chain);
        const userAddress = this.getEoaAddress();

        const smartWallet = await this.getOrCreateWallet();
        const positions = await sdk.getPositions(userAddress, chainId);
        const principal = this.sumPositionAmounts(positions.portfolio?.positions || []);
        const earnings = await sdk.getOnchainEarnings(smartWallet);
        const totalYield = Number(earnings.data?.totalEarningsByToken?.USDC || '0');

        const balance = {
            principal: principal.toString(),
            yield: totalYield.toString(),
        };
        logger.log('ZyfaiIntegration', 'getYieldBalance', { chain, ...balance }, 'success');
        return balance;
    }

    async withdrawYield(amount: string, chain: string = 'base'): Promise<string> {
        await this.initialize();
        const sdk = this.getSdk();
        const chainId = this.getChainId(chain);
        const userAddress = this.getEoaAddress();
        await this.getOrCreateWallet();

        const response = await sdk.withdrawFunds(userAddress, chainId, amount, 'USDC');
        const txHash = response.txHash;
        if (!txHash) throw new Error('Zyfai withdraw response missing tx hash');

        logger.log('ZyfaiIntegration', 'withdrawYield', { amount, chain, txHash }, 'success');
        return txHash;
    }

    private getSdk(): ZyfaiSDK {
        if (!this.sdk) {
            throw new Error('Zyfai SDK not initialized');
        }
        return this.sdk;
    }

    private getChainId(chain: string): 8453 | 42161 | 9745 {
        switch (chain.toLowerCase()) {
            case 'base':
                return 8453;
            case 'arbitrum':
                return 42161;
            case 'plasma':
                return 9745;
            default:
                throw new Error(`Unsupported Zyfai chain: ${chain}`);
        }
    }

    private sumPositionAmounts(positions: Array<{ amount?: string }>): number {
        let sum = 0;
        for (const position of positions) {
            const value = Number(position.amount || '0');
            if (Number.isFinite(value)) {
                sum += value;
            }
        }
        return sum;
    }

    private getEoaAddress(): string {
        return config.zyfai?.userEoa || new Wallet(this.getSignerPrivateKey()).address;
    }

    private getSignerPrivateKey(): string {
        return config.zyfai?.privateKey || config.agent.privateKey;
    }
}

export const zyfaiIntegration = new ZyfaiIntegration();
