import { config } from '../shared/config';
import { logger } from '../utils/logger';

export class ERC8004Integration {
    private identityRegistry: string;
    private reputationRegistry: string;

    constructor() {
        this.identityRegistry = config.erc8004?.identityRegistry || '0x0000000000000000000000000000000000000000';
        this.reputationRegistry = config.erc8004?.reputationRegistry || '0x0000000000000000000000000000000000000000';
    }

    async registerAgent(agentURI: string): Promise<number> {
        // Mocking the ethers contract call since we don't have the ABI locally
        const mockAgentId = Math.floor(Math.random() * 1000) + 1;
        logger.log('ERC8004Integration', 'registerAgent', { agentURI, agentId: mockAgentId }, 'success');
        return mockAgentId;
    }

    async giveFeedback(
        agentId: number,
        score: number,
        tag1: string,
        tag2: string = '',
        feedbackURI: string = ''
    ): Promise<string> {
        // Product decision: no wallet connect / no human scoring flow.
        // We intentionally block reputation writes from this app.
        logger.log(
            'ERC8004Integration',
            'giveFeedback_blocked',
            { agentId, score, tag1, tag2, feedbackURI, reason: 'feedback_disabled_no_wallet_connect' },
            'failed',
            'Feedback writes are disabled. SignalMint uses ERC-8004 identity registration only.'
        );
        throw new Error('ERC-8004 feedback is disabled (no wallet connect / no human scoring flow).');
    }

    async getAgentWallet(agentId: number): Promise<string> {
        // Return the configured agent address
        return config.agent.address || '0x0000000000000000000000000000000000000000';
    }
}

export const erc8004Integration = new ERC8004Integration();
