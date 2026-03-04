// apps/api/src/common/helpers/rank.helper.ts

export function calculateRank(points: number): string {
  let rank = 'Novato';
  if (points > 50) rank = 'Bronce';
  if (points > 150) rank = 'Plata';
  if (points > 300) rank = 'Oro';
  if (points > 500) rank = 'Platino';
  if (points > 1000) rank = 'LEGENDARIO';
  return rank;
}