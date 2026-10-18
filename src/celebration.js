const colors = ['#e7ac59', '#d78a83', '#88a98b', '#b5acd2', '#e9cd73'];
export function confetti(container, reducedMotion) {
  if (reducedMotion) return;
  const fragment = document.createDocumentFragment();
  for (let i = 0; i < 42; i++) {
    const piece = document.createElement('i');
    piece.className = 'confetti';
    piece.style.cssText = `--x:${(Math.random() - 0.5) * 700}px;--y:${80 + Math.random() * 240}px;--r:${Math.random() * 680 - 340}deg;--delay:${Math.random() * 0.15}s;background:${colors[i % colors.length]}`;
    fragment.append(piece);
  }
  container.replaceChildren(fragment);
}
