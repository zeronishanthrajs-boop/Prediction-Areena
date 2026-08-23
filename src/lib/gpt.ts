// Google Publisher Tag (GPT) Web Rewarded Ads Client Service

export interface GptRewardPayload {
  amount: number;
  type: string;
}

export interface GptRewardedAdOptions {
  adUnitPath?: string;
  onReady?: () => void;
  onGranted: (reward: GptRewardPayload) => void;
  onDismissed?: () => void;
  onError?: (error: string) => void;
}

declare global {
  interface Window {
    googletag?: {
      cmd: Array<() => void>;
      defineOutOfPageSlot?: (adUnitPath: string, format: unknown) => any;
      pubads?: () => any;
      enableServices?: () => void;
      display?: (slot: any) => void;
      destroySlots?: (slots?: any[]) => boolean;
      enums?: {
        OutOfPageType: {
          REWARDED: unknown;
        };
      };
    };
  }
}

const DEFAULT_REWARDED_AD_UNIT =
  process.env.NEXT_PUBLIC_GPT_REWARDED_AD_UNIT || '/21775744923/example/rewarded';

export class GptRewardedAdService {
  private static isInitialized = false;
  private static activeSlot: any = null;

  /**
   * Initializes the Google Publisher Tag queue and script if not already present
   */
  static init(): void {
    if (typeof window === 'undefined') return;

    window.googletag = window.googletag || ({ cmd: [] } as any);

    if (!this.isInitialized) {
      this.isInitialized = true;
      // Ensure GPT script is loaded
      if (!document.querySelector('script[src*="securepubads.g.doubleclick.net/tag/js/gpt.js"]')) {
        const script = document.createElement('script');
        script.src = 'https://securepubads.g.doubleclick.net/tag/js/gpt.js';
        script.async = true;
        script.crossOrigin = 'anonymous';
        document.head.appendChild(script);
      }
    }
  }

  /**
   * Displays an official Google Rewarded Web Ad with native completion callbacks.
   * If GPT fails to load (e.g. adblocker active) or no fill occurs, safely triggers fallback.
   */
  static showRewardedAd(options: GptRewardedAdOptions): Promise<boolean> {
    return new Promise((resolve) => {
      if (typeof window === 'undefined') {
        resolve(false);
        return;
      }

      this.init();

      const adUnit = options.adUnitPath || DEFAULT_REWARDED_AD_UNIT;
      let rewardGranted = false;
      let timeoutId: NodeJS.Timeout | null = null;

      const triggerFallback = (reason: string) => {
        console.warn(`[GPT Rewarded Ad] Fallback triggered: ${reason}`);
        if (timeoutId) clearTimeout(timeoutId);
        if (options.onError) options.onError(reason);
        resolve(false);
      };

      // Set safety timeout in case GPT is blocked or takes too long to respond
      timeoutId = setTimeout(() => {
        triggerFallback('Ad loading timed out or was blocked by browser');
      }, 7000);

      window.googletag?.cmd.push(() => {
        try {
          const googletag = window.googletag;
          if (!googletag || !googletag.defineOutOfPageSlot || !googletag.enums?.OutOfPageType?.REWARDED) {
            triggerFallback('GPT library not available');
            return;
          }

          // Clean up any existing active slot
          if (this.activeSlot) {
            try {
              googletag.destroySlots?.([this.activeSlot]);
            } catch {
              // Ignore cleanup error
            }
            this.activeSlot = null;
          }

          const rewardedSlot = googletag.defineOutOfPageSlot(
            adUnit,
            googletag.enums.OutOfPageType.REWARDED
          );

          if (!rewardedSlot) {
            triggerFallback('Failed to define rewarded ad slot');
            return;
          }

          this.activeSlot = rewardedSlot;
          const pubads = googletag.pubads?.();

          if (!pubads) {
            triggerFallback('GPT PubAds service unavailable');
            return;
          }

          rewardedSlot.addService(pubads);

          // Event: Rewarded slot is ready to be displayed
          const onSlotReady = (event: any) => {
            if (timeoutId) clearTimeout(timeoutId);
            if (event.slot === rewardedSlot) {
              if (options.onReady) options.onReady();
              if (typeof event.makeRewardedVisible === 'function') {
                event.makeRewardedVisible();
              }
            }
          };

          // Event: User completed watching the rewarded ad
          const onSlotGranted = (event: any) => {
            if (event.slot === rewardedSlot) {
              rewardGranted = true;
              const payload = event.payload || { amount: 1000, type: 'COINS' };
              options.onGranted(payload);
              resolve(true);
            }
          };

          // Event: Rewarded ad modal was closed by user
          const onSlotClosed = (event: any) => {
            if (event.slot === rewardedSlot) {
              if (!rewardGranted && options.onDismissed) {
                options.onDismissed();
              }
              try {
                googletag.destroySlots?.([rewardedSlot]);
              } catch {
                // Ignore
              }
              this.activeSlot = null;
            }
          };

          pubads.addEventListener('rewardedSlotReady', onSlotReady);
          pubads.addEventListener('rewardedSlotGranted', onSlotGranted);
          pubads.addEventListener('rewardedSlotClosed', onSlotClosed);

          googletag.enableServices?.();
          googletag.display?.(rewardedSlot);
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : 'Unknown GPT error';
          triggerFallback(message);
        }
      });
    });
  }
}
