/**
 * Guest Wallet — client-side only (localStorage).
 * Used for anonymous users trying the game before registering.
 * No server interaction — all operations are purely in-browser.
 */

const GUEST_KEY = 'pa_guest_wallet';
const GUEST_STARTING = 500;

/** Read current guest balance. Returns GUEST_STARTING if not initialised. */
export function getGuestBalance(): number {
  if (typeof window === 'undefined') return GUEST_STARTING;
  try {
    const raw = localStorage.getItem(GUEST_KEY);
    if (raw === null) return GUEST_STARTING;
    const n = parseInt(raw, 10);
    return isNaN(n) ? GUEST_STARTING : Math.max(0, n);
  } catch {
    return GUEST_STARTING;
  }
}

/** Persist a new guest balance value. */
export function setGuestBalance(n: number): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(GUEST_KEY, String(Math.max(0, Math.floor(n))));
  } catch {
    // localStorage blocked — silently ignore
  }
}

/**
 * Initialise guest wallet on first visit.
 * Returns current balance (500 if brand new).
 */
export function initGuestWallet(): number {
  if (typeof window === 'undefined') return GUEST_STARTING;
  try {
    if (localStorage.getItem(GUEST_KEY) === null) {
      localStorage.setItem(GUEST_KEY, String(GUEST_STARTING));
    }
    return getGuestBalance();
  } catch {
    return GUEST_STARTING;
  }
}

/**
 * Attempt to deduct stake from guest balance.
 * Returns true if successful, false if insufficient.
 */
export function deductGuest(stake: number): boolean {
  const current = getGuestBalance();
  if (current < stake) return false;
  setGuestBalance(current - stake);
  return true;
}

/** Credit winnings to guest balance. */
export function creditGuest(amount: number): void {
  setGuestBalance(getGuestBalance() + amount);
}

/** Clear guest wallet after successful registration. */
export function clearGuestWallet(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(GUEST_KEY);
  } catch {
    // ignore
  }
}
