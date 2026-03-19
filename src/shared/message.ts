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
}

export const messageBus = new MessageBus();
