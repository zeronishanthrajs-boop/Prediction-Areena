import { db } from './db';
import { SportsEvent, SportsPrediction } from './types';
import { WalletService } from './walletService';
import crypto from 'crypto';

export class SportsService {
  /**
   * Get list of sports events with category filter
   */
  static getEvents(category?: string): SportsEvent[] {
    if (category && category !== 'ALL') {
      return db.prepare('SELECT * FROM sports_events WHERE category = ? ORDER BY start_time ASC').all(category) as SportsEvent[];
    }
    return db.prepare('SELECT * FROM sports_events ORDER BY start_time ASC').all() as SportsEvent[];
  }

  /**
   * Place a sports prediction
   */
  static placeSportsPrediction(params: {
    userId: string;
    eventId: string;
    selectedOption: string;
    stake: number;
  }): { success: boolean; prediction?: SportsPrediction; error?: string } {
    const { userId, eventId, selectedOption, stake } = params;

    if (stake < 100) {
      return { success: false, error: 'Minimum sports prediction stake is 100 Practice Coins' };
    }

    const event = db.prepare('SELECT * FROM sports_events WHERE id = ?').get(eventId) as SportsEvent | undefined;
    if (!event) return { success: false, error: 'Event not found' };

    if (event.status === 'RESOLVED') {
      return { success: false, error: 'This event has already concluded' };
    }

    let multiplier = 1.85;
    if (selectedOption === event.team_a) multiplier = event.team_a_multiplier;
    else if (selectedOption === event.team_b) multiplier = event.team_b_multiplier;
    else if (selectedOption === 'DRAW' && event.draw_multiplier) multiplier = event.draw_multiplier;

    // Deduct stake atomically
    const debit = WalletService.mutateBalance({
      userId,
      amount: -stake,
      type: 'PREDICTION_STAKE',
      metadata: { eventId, selectedOption, multiplier, eventTitle: event.title },
    });

    if (!debit.success) {
      return { success: false, error: debit.error || 'Insufficient Practice Coins' };
    }

    const id = `spred-${crypto.randomUUID()}`;
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO sports_predictions (id, user_id, event_id, selected_option, stake, multiplier, result, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 'PENDING', ?)
    `).run(id, userId, eventId, selectedOption, stake, multiplier, now);

    // Update participant count
    db.prepare('UPDATE sports_events SET total_participants = total_participants + 1 WHERE id = ?').run(eventId);

    const prediction: SportsPrediction = {
      id,
      user_id: userId,
      event_id: eventId,
      selected_option: selectedOption,
      stake,
      multiplier,
      result: 'PENDING',
      created_at: now,
    };

    return { success: true, prediction };
  }

  /**
   * Get user's active sports predictions
   */
  static getUserSportsPredictions(userId: string): SportsPrediction[] {
    return db.prepare(`
      SELECT sp.*, se.title as event_title, se.team_a, se.team_b, se.category
      FROM sports_predictions sp
      JOIN sports_events se ON sp.event_id = se.id
      WHERE sp.user_id = ?
      ORDER BY sp.created_at DESC
      LIMIT 20
    `).all(userId) as SportsPrediction[];
  }
}
