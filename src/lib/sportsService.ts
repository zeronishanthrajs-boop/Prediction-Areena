import { query, queryOne, execute } from './db';
import { SportsEvent, SportsPrediction } from './types';
import { WalletService } from './walletService';
import crypto from 'crypto';

export class SportsService {
  /**
   * Get list of sports events with category filter
   */
  static async getEvents(category?: string): Promise<SportsEvent[]> {
    if (category && category !== 'ALL') {
      return await query<SportsEvent>('SELECT * FROM sports_events WHERE category = ? ORDER BY start_time ASC', [category]);
    }
    return await query<SportsEvent>('SELECT * FROM sports_events ORDER BY start_time ASC');
  }

  /**
   * Place a sports prediction
   */
  static async placeSportsPrediction(params: {
    userId: string;
    eventId: string;
    selectedOption: string;
    stake: number;
  }): Promise<{ success: boolean; prediction?: SportsPrediction; error?: string }> {
    const { userId, eventId, selectedOption, stake } = params;

    if (stake < 100) {
      return { success: false, error: 'Minimum sports prediction stake is 100 Practice Coins' };
    }

    const event = await queryOne<SportsEvent>('SELECT * FROM sports_events WHERE id = ?', [eventId]);
    if (!event) return { success: false, error: 'Event not found' };

    if (event.status === 'RESOLVED') {
      return { success: false, error: 'This event has already concluded' };
    }

    let multiplier = 1.85;
    if (selectedOption === event.team_a) multiplier = event.team_a_multiplier;
    else if (selectedOption === event.team_b) multiplier = event.team_b_multiplier;
    else if (selectedOption === 'DRAW' && event.draw_multiplier) multiplier = event.draw_multiplier;

    // Deduct stake atomically
    const debit = await WalletService.mutateBalance({
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

    await execute(`
      INSERT INTO sports_predictions (id, user_id, event_id, selected_option, stake, multiplier, result, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 'PENDING', ?)
    `, [id, userId, eventId, selectedOption, stake, multiplier, now]);

    // Update participant count
    await execute('UPDATE sports_events SET total_participants = total_participants + 1 WHERE id = ?', [eventId]);

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
  static async getUserSportsPredictions(userId: string): Promise<SportsPrediction[]> {
    return await query<SportsPrediction>(`
      SELECT sp.*, se.title as event_title, se.team_a, se.team_b, se.category
      FROM sports_predictions sp
      JOIN sports_events se ON sp.event_id = se.id
      WHERE sp.user_id = ?
      ORDER BY sp.created_at DESC
      LIMIT 20
    `, [userId]);
  }
}
