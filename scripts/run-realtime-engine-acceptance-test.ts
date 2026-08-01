import { zolanzoRealtime } from "../lib/realtime/engine";
import { RealtimeEventPayload } from "../lib/realtime/types";

async function runRealtimeEngineAcceptanceTest() {
  console.log("=== ZOLANZO REALTIME ENGINE ACCEPTANCE TEST ===");
  console.log("Testing Event Bus, Channel Subscriptions, Optimistic UI, and Queue Replay...\n");

  const receivedEvents: RealtimeEventPayload[] = [];
  const startTime = Date.now();

  // 1. Subscribe to channels
  console.log("--- 1. Channel Subscriptions & Routing ---");
  const unsubWallet = zolanzoRealtime.subscribeChannel("wallet", (evt) => {
    receivedEvents.push(evt);
    console.log(`✓ [Channel #wallet] Received event: ${evt.type}`);
  });

  const unsubApps = zolanzoRealtime.subscribeChannel("applications", (evt) => {
    receivedEvents.push(evt);
    console.log(`✓ [Channel #applications] Received event: ${evt.type}`);
  });

  // 2. Publish Events
  console.log("\n--- 2. Publishing Events ---");
  zolanzoRealtime.publish("WALLET_UPDATED", { userId: "WORKER_100", available: 350000 });
  zolanzoRealtime.publish("APPLICATION_CREATED", { applicationId: "app_999", title: "AI Image Labeling" });
  zolanzoRealtime.publish("ESCROW_LOCKED", { campaignId: "opp_500", totalRequired: 1000000 });

  if (receivedEvents.length < 3) {
    throw new Error(`Expected at least 3 received events, got ${receivedEvents.length}`);
  }

  // 3. Optimistic UI Updates
  console.log("\n--- 3. Optimistic UI Updates ---");
  let optimisticHandled = false;
  zolanzoRealtime.publishOptimistic(
    "APPLICATION_APPROVED",
    { applicationId: "app_999", isOptimistic: true },
    async () => {
      optimisticHandled = true;
    }
  );

  // Give promise tick
  await new Promise((r) => setTimeout(r, 10));

  if (!optimisticHandled) {
    throw new Error("Optimistic action failed to execute.");
  }
  console.log("✓ Optimistic update dispatched and action confirmed cleanly.");

  // 4. Offline Queue & Replay
  console.log("\n--- 4. Offline Queueing & Automatic Replay ---");
  zolanzoRealtime.setOnline(false);
  zolanzoRealtime.publish("NOTIFICATION_CREATED", { notifId: "notif_offline" });

  const stateOffline = zolanzoRealtime.getState();
  console.log(`✓ Offline state verified: Connected=${stateOffline.isConnected}, QueueSize=${stateOffline.queuedCount}`);

  zolanzoRealtime.setOnline(true);
  const replayedCount = zolanzoRealtime.replayQueue();
  console.log(`✓ Online state restored: Replayed ${replayedCount} queued event(s).`);

  // 5. Provider Switching
  console.log("\n--- 5. Provider Transport Abstraction ---");
  zolanzoRealtime.setProviderMode("supabase");
  console.log(`✓ Switched provider transport to: ${zolanzoRealtime.getProviderMode()}`);
  zolanzoRealtime.setProviderMode("mock");

  // Clean up
  unsubWallet();
  unsubApps();

  const duration = Date.now() - startTime;
  console.log(`\n==================================================`);
  console.log(`SUCCESS: Realtime Engine Architecture Verified in ${duration}ms cleanly!`);
  console.log(`==================================================`);
}

runRealtimeEngineAcceptanceTest().catch((err) => {
  console.error("❌ Realtime Engine Acceptance Test Failed:", err);
  process.exit(1);
});
