import { PlatformClient, triggers } from '@openserv-labs/client';
import { config } from '../shared/config';
import { logger } from '../utils/logger';

export class OpenServIntegration {
    private authenticated = false;
    private readonly client: PlatformClient;
    private readonly systemIdsByName = new Map<string, string>();
    private readonly executableWorkflowIds = new Set<string>();
    private readonly workerAgentId: number;
    private readonly webhookTriggerName = 'signalmint-webhook';
    private readonly processingTaskName = 'process-signal';

    constructor() {
        this.client = new PlatformClient();
        this.workerAgentId = Number(process.env.OPENSERV_WORKER_AGENT_ID || 3);
    }

    async createSystem(name: string, agentRoles: string[]): Promise<{ systemId: string; name: string }> {
        try {
            await this.authenticate();

            const cachedId = this.systemIdsByName.get(name);
            if (cachedId) {
                if (!this.executableWorkflowIds.has(cachedId)) {
                    await this.ensureExecutableWorkflow(cachedId);
                }
                return { systemId: cachedId, name };
            }

            const workflows = await this.client.workflows.list();
            const existing = workflows.find((workflow) => workflow.name === name);

            if (existing) {
                await this.ensureExecutableWorkflow(existing.id);
                this.systemIdsByName.set(name, String(existing.id));
                logger.log('OpenServIntegration', 'createSystem', { name, agents: agentRoles, systemId: existing.id, reused: true }, 'success');
                return { systemId: String(existing.id), name: existing.name };
            }

            const workflow = await this.client.workflows.create({
                name,
                goal: `SignalMint autonomous system for roles: ${agentRoles.join(', ')}`,
                agentIds: [this.workerAgentId],
            });

            await this.ensureExecutableWorkflow(workflow.id);

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

            const systemId = await this.resolveSystemId();
            if (!systemId) {
                throw new Error('OpenServ system not initialized. Call createSystem() first.');
            }

            if (!this.executableWorkflowIds.has(systemId)) {
                await this.ensureExecutableWorkflow(systemId);
            }

            const workflowId = Number(systemId);
            const input = {
                from,
                to,
                type,
                payload,
                timestamp: new Date().toISOString(),
            };
            await this.client.triggers.fireWebhook({
                workflowId,
                triggerName: this.webhookTriggerName,
                input,
            });

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

    private async ensureExecutableWorkflow(workflowId: number | string): Promise<void> {
        const workflowIdStr = String(workflowId);
        await this.client.workflows.sync({
            id: workflowIdStr,
            triggers: [
                {
                    name: this.webhookTriggerName,
                    ...triggers.webhook({ waitForCompletion: true, timeout: 600 }),
                },
            ],
            tasks: [
                {
                    name: this.processingTaskName,
                    agentId: this.workerAgentId,
                    description: 'Process SignalMint orchestration events',
                },
            ],
            edges: [
                {
                    from: `trigger:${this.webhookTriggerName}`,
                    to: `task:${this.processingTaskName}`,
                },
            ],
        });

        await this.ensureTriggerActive(workflowIdStr);

        try {
            await this.client.workflows.setRunning({ id: workflowIdStr });
        } catch (error) {
            const maybeAxios = error as {
                response?: { data?: { message?: string } };
            };
            const responseMessage = maybeAxios.response?.data?.message || '';
            const message = String(error);
            if (!responseMessage.includes('already set to the desired state') && !message.includes('already set to the desired state')) {
                logger.log('OpenServIntegration', 'setRunning', { workflowId: workflowIdStr }, 'failed', message);
            }
        }

        this.executableWorkflowIds.add(workflowIdStr);
    }

    private async ensureTriggerActive(workflowId: string): Promise<void> {
        const triggerList = await this.client.triggers.list({ workflowId });
        const trigger = triggerList.find((item) => item.name === this.webhookTriggerName);
        if (!trigger) {
            throw new Error(`OpenServ trigger '${this.webhookTriggerName}' not found on workflow ${workflowId}`);
        }

        if (trigger.isActive === false) {
            await this.client.triggers.activate({ workflowId, id: trigger.id });
            logger.log('OpenServIntegration', 'activateTrigger', { workflowId, triggerId: trigger.id, name: trigger.name }, 'success');
        }
    }

    private async resolveSystemId(): Promise<string | undefined> {
        const cachedId = this.systemIdsByName.values().next().value as string | undefined;
        if (cachedId) {
            return cachedId;
        }

        const workflows = await this.client.workflows.list();
        const known = workflows.find((workflow) => workflow.name === 'SignalMint System');
        if (!known) {
            return undefined;
        }

        const resolvedId = String(known.id);
        this.systemIdsByName.set(known.name, resolvedId);
        return resolvedId;
    }
}

export const openServIntegration = new OpenServIntegration();
