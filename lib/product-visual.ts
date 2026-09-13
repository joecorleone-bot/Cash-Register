const toyEmoji = ['🧸', '💖', '🐱', '☁️', '🦖', '🐰', '🍓', '🌈'];

export function productEmoji(productId: number) {
  const id = Math.max(1, Math.abs(Math.trunc(Number(productId) || 1)));
  const index = (id - 1) % toyEmoji.length;
  return toyEmoji[index];
}
