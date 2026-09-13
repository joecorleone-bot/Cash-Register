const toyEmoji = ['🧸', '💖', '🐱', '☁️', '🦖', '🐰', '🍓', '🌈'];

export function productEmoji(productId: number) {
  const index = Math.abs(Number(productId) || 0) % toyEmoji.length;
  return toyEmoji[index];
}
