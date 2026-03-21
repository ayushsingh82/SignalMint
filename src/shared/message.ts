import { EventEmitter } from 'events';
import { AgentMessage } from './types';

/**
 * Central message bus for inter-agent communication
 */
export class MessageBus extends EventEmitter {
  private messageQueue: AgentMessage[] = [];
  private messageHistory: AgentMessage[] = [];

  async sendMessage(message: AgentMessage): Promise<void> {
    this.messageQueue.push(message);
    this.messageHistory.push(message);
    
    console.log(`[MessageBus] ${message.from} → ${message.to}: ${message.type}`);
    void this.forwardToOpenServ(message);
    this.emit(message.type, message);
  }

  onMessage(
    type: string,
    handler: (message: AgentMessage) => Promise<void>
  ): void {
    this.on(type, async (message) => {
      try {
        await handler(message);
      } catch (error) {
        console.error(`[MessageBus] Error handling ${type}:`, error);
        throw error;
      }
    });
  }

  getMessageQueue(): AgentMessage[] {
    return this.messageQueue;
  }

  getMessageHistory(): AgentMessage[] {
    return this.messageHistory;
  }

  clearQueue(): void {
    this.messageQueue = [];
  }

  reset(): void {
    this.messageQueue = [];
    this.messageHistory = [];
    this.removeAllListeners();
  }

  private async forwardToOpenServ(message: AgentMessage): Promise<void> {
    try {
      const { openServIntegration } = await import('../protocols/openserv');
      await openServIntegration.sendMessage(
        message.from,
        message.to,
        message.type,
        message.payload as Record<string, unknown>
      );
    } catch {
      // Keep internal agent communication non-blocking even if OpenServ is unavailable.
    }
  }
}

export const messageBus = new MessageBus();
