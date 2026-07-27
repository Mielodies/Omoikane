export function showConfetti() {
  const container = document.createElement('div');
  container.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:99999;';
  document.body.appendChild(container);
  const colors = ['#a855f7','#ec4899','#f59e0b','#22c55e','#3b82f6','#ef4444'];
  for (let i = 0; i < 50; i++) {
    const el = document.createElement('div');
    const size = Math.random() * 8 + 4;
    el.style.cssText = `position:absolute;width:${size}px;height:${size}px;background:${colors[Math.floor(Math.random()*colors.length)]};left:${Math.random()*100}%;top:-10px;border-radius:${Math.random()>0.5?'50%':'2px'};animation:confetti-fall ${Math.random()*2+1}s ease-out forwards;animation-delay:${Math.random()*0.5}s;`;
    container.appendChild(el);
  }
  setTimeout(() => container.remove(), 4000);
}
