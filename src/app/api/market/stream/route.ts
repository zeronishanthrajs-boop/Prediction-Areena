import { marketEngine } from '@/lib/marketEngine';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const targetMarketId = searchParams.get('marketId') || 'ai-index';

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      const sendTick = () => {
        try {
          const state = marketEngine.getMarketState(targetMarketId);
          if (!state) return;

          const now = Date.now();
          const timeRemaining = Math.max(0, Math.ceil((state.activeRound.end_time - now) / 1000));
          const lockRemaining = Math.max(0, Math.ceil((state.activeRound.lock_time - now) / 1000));

          const payload = {
            marketId: targetMarketId,
            price: state.currentPrice,
            previousPrice: state.previousPrice,
            activeRound: state.activeRound,
            timeRemaining,
            lockRemaining,
            isLocked: state.activeRound.status === 'LOCKED',
            timestamp: now,
          };

          const message = `data: ${JSON.stringify(payload)}\n\n`;
          controller.enqueue(encoder.encode(message));
        } catch {
          // Stream might be closed by client
          clearInterval(interval);
        }
      };

      // Send initial tick immediately
      sendTick();

      // Send updates every 500ms
      const interval = setInterval(sendTick, 500);

      // Clean up when client disconnects
      request.signal.addEventListener('abort', () => {
        clearInterval(interval);
        try {
          controller.close();
        } catch {}
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  });
}
