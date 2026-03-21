import { PlatformClient } from '@openserv-labs/client';
import { config } from '../shared/config';
import { logger } from '../utils/logger';

export class OpenServIntegration {
    private authenticated = false;
    private readonly client: PlatformClient;
    private readonly systemIdsByName = new Map<string, string>();

    constructor() {
        this.client = new PlatformClient();
    }

    async createSystem(name: string, agentRoles: string[]): Promise<{ systemId: string; name: string }> {
        try {
            await this.authenticate();

            const cachedId = this.systemIdsByName.get(name);
            if (cachedId) {
                return { systemId: cachedId, name };
            }

            const workflows = await this.client.workflows.list();
            const existing = workflows.find((workflow) => workflow.name === name);

            if (existing) {
                this.systemIdsByName.set(name, String(existing.id));
                logger.log('OpenServIntegration', 'createSystem', { name, agents: agentRoles, systemId: existing.id, reused: true }, 'success');
                return { systemId: String(existing.id), name: existing.name };
            }

            const workflow = await this.client.workflows.create({
                name,
                goal: `SignalMint autonomous system for roles: ${agentRoles.join(', ')}`,
            });

            try {
                await this.client.workflows.setRunning({ id: workflow.id });
            } catch {
                // Some workspaces may already be running or require additional setup.
            }

            this.systemIdsByName.set(name, String(workflow.id));
            logger.log('OpenServIntegration', 'createSystem', { name, agents: agentRoles, systemId: workflow.id }, 'success');
            return { systemId: String(workflow.id), name: workflow.name };
        } catch (error) {
            logger.log('OpenServIntegration', 'createSystem', { name }, 'failed', String(error));
            throw error;
        }
    }

    async sendMessage(from: string, to: string, type: string, payload: Record<string, unknown>): Promise<void> {
        try {
            await this.authenticate();

            const systemId = this.systemIdsByName.values().next().value as string | undefined;
            if (!systemId) {
                throw new Error('OpenServ system not initialized. Call createSystem() first.');
            }

            const workflow = await this.client.workflows.get({ id: systemId });
            const eventLine = `[${new Date().toISOString()}] ${from} -> ${to} (${type}) ${JSON.stringify(payload)}`;
            const existingGoal = workflow.goal || '';
            const nextGoal = `${existingGoal}\n${eventLine}`.trim().slice(-4000);
            await this.client.workflows.update({ id: systemId, goal: nextGoal });

            logger.log('OpenServIntegration', 'sendMessage', { from, to, type }, 'success');
        } catch (error) {
            logger.log('OpenServIntegration', 'sendMessage', { from, to }, 'failed', String(error));
            throw error;
        }
    }

    private async authenticate(): Promise<void> {
        if (this.authenticated) return;
        if (!config.agent.privateKey) {
            throw new Error('AGENT_PRIVATE_KEY missing for OpenServ authentication');
        }
        await this.client.authenticate(config.agent.privateKey);
        this.authenticated = true;
    }
}

export const openServIntegration = new OpenServIntegration();
