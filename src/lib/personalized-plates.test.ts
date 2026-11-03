import { describe, expect, it } from 'vitest';
import { buildPlate, type FoodHistory } from './personalized-plates';
const row: FoodHistory = { food_name: 'Arroz branco cozido', meal: 'lunch', log_date: '2026-11-02', quantity_g: 100, calories: 128, protein_g: 2.5, carbs_g: 28.1, fat_g: .2 };
describe('personalized plates', () => {
  it('uses foods eaten by the user for that meal', () => {
    expect(buildPlate([row], 'lunch', 2000, 800, '2026-11-03')?.items[0]?.name).toBe('Arroz branco cozido');
    expect(buildPlate([row], 'breakfast', 2000, 800, '2026-11-03')?.familiar).toBe(false);
  });
  it('never exceeds calories left', () => { expect(buildPlate([row], 'lunch', 2000, 100, '2026-11-03')?.calories).toBeLessThanOrEqual(100); });
  it('does not offer additional food after the goal', () => { expect(buildPlate([row], 'lunch', 2000, 0, '2026-11-03')).toBeNull(); });
});