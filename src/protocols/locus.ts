import { logger } from '../utils/logger';

export class LocusIntegration {
    async fundAgent(amount: string): Promise<string> {
        logger.log('LocusIntegration', 'fundAgent', { amount, status: 'mocked' }, 'success');
        return '0xLocusMockTx...';
    }

    async setSpendLimit(limit: string): Promise<void> {
        logger.log('LocusIntegration', 'setSpendLimit', { limit }, 'success');
    }
}

export const locusIntegration = new LocusIntegration();
