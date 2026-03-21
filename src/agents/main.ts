import { scoutAgent } from './scout';
import { analystAgent } from './analyst';
import { executorAgent } from './executor';
import { verifierAgent } from './verifier';
import { messageBus } from '../shared/message';
import { config } from '../shared/config';
import { logger } from '../utils/logger';

/**
 * Signal Mint Autonomous Agent System
 * 
 * Main event loop:
 * 1. Scout detects market signals (price spikes, trends)
 * 2. Analyst makes decisions based on signals
 * 3. Executor performs actions (mint NFTs, swaps)
 * 4. Verifier validates and logs everything to Filecoin
 * 5. Loop repeats autonomously
 */

let isRunning = false;
let cycleCount = 0;

/**
 * Initialize and start the autonomous agent system
 */
async function startAutonomousAgent(): Promise<void> {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║           🚀 SIGNALMINT AUTONOMOUS AGENT SYSTEM 🚀            ║
╚════════════════════════════════════════════════════════════════╝
`);

  console.log('📋 Configuration:');
  console.log(`   Chain: ${config.rare.chain}`);
  console.log(`   Signal Threshold: $${config.signals.ethPriceThreshold}`);
  console.log(`   Confidence Threshold: ${config.signals.confidenceThreshold}`);
  console.log(`   Check Interval: ${config.signals.priceCheckIntervalMs}ms\n`);

  try {
    // Start all agents
    console.log('🔄 Starting agents...\n');
    await analystAgent.start();
    await executorAgent.start();
    await verifierAgent.start();

    console.log('🔗 Wiring advanced protocol integrations...\n');
    const { zyfaiIntegration } = await import('../protocols/zyfai');
    const { openServIntegration } = await import('../protocols/openserv');
    const { erc8004Integration } = await import('../protocols/erc8004');

    try {
      await zyfaiIntegration.getOrCreateWallet();
    } catch (error) {
      logger.log('Main', 'zyfai_bootstrap', {}, 'failed', String(error));
    }

    try {
      await openServIntegration.createSystem('SignalMint System', ['Scout', 'Analyst', 'Executor', 'Verifier']);
    } catch (error) {
      logger.log('Main', 'openserv_bootstrap', {}, 'failed', String(error));
    }

    try {
      await erc8004Integration.registerAgent('ipfs://QmAgentMetadata');
    } catch (error) {
      logger.log('Main', 'erc8004_bootstrap', {}, 'failed', String(error));
    }

    isRunning = true;

    // Scout runs in continuous loop
    console.log('🔍 Starting scout detection loop...\n');
    console.log('━'.repeat(70));

    const scoutInterval = setInterval(async () => {
      try {
        cycleCount++;
        console.log(`\n[Cycle ${cycleCount}] ${new Date().toLocaleTimeString()}`);
        console.log('━'.repeat(70));

        await scoutAgent.run();

        // Print agent statistics
        setTimeout(() => {
          const analystStats = analystAgent.getStats();
          const executorStats = executorAgent.getStats();
          const verifierStats = verifierAgent.getStats();

          console.log('\n📊 Agent Statistics:');
          console.log(
            `   Scout: monitoring (${scoutAgent.getStatus().priceHistorySize} readings)`
          );
          console.log(
            `   Analyst: ${analystStats.decisionsGenerated} decisions (${analystStats.mintsDecided} mints, ${analystStats.skipsDecided} skips)`
          );
          console.log(
            `   Executor: ${executorStats.executionsAttempted} executions (${executorStats.executionsSucceeded} success, ${executorStats.executionsFailed} failed)`
          );
          console.log(
            `   Verifier: ${verifierStats.verified} verified (${verifierStats.successRate.toFixed(0)}% success rate)`
          );
        }, 1000);
      } catch (error) {
        console.error('❌ Scout cycle error:', error);
      }
    }, config.signals.priceCheckIntervalMs);

    // Graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\n\n🛑 Shutting down gracefully...');
      isRunning = false;
      clearInterval(scoutInterval);

      // Save final log
      logger.saveLog();

      console.log('\n✅ SignalMint agent stopped');
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      console.log('\n\n🛑 Shutting down (SIGTERM)...');
      isRunning = false;
      clearInterval(scoutInterval);

      logger.saveLog();
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ Fatal error:', error);
    logger.log('Main', 'fatal_error', {}, 'failed', String(error));
    logger.saveLog();
    process.exit(1);
  }
}

/**
 * Entry point
 */
async function main(): Promise<void> {
  try {
    await startAutonomousAgent();
  } catch (error) {
    console.error('Fatal initialization error:', error);
    process.exit(1);
  }
}

// Run
if (require.main === module) {
  main().catch(console.error);
}

export { startAutonomousAgent };
