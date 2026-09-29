/* Sonidos sintetizados con Web Audio (sin archivos externos) */
window.Sonido = (function () {
  let ctx = null;
  const s = { on: true };
  function tono(f, dur, tipo, vol, retraso) {
    if (!s.on) return;
    try {
      ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
      const o = ctx.createOscillator(), g = ctx.createGain(), t0 = ctx.currentTime + (retraso || 0);
      o.type = tipo || 'sine'; o.frequency.value = f;
      g.gain.setValueAtTime(vol || 0.06, t0);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      o.connect(g).connect(ctx.destination);
      o.start(t0); o.stop(t0 + dur);
    } catch (e) { /* sin audio disponible */ }
  }
  s.poner = () => tono(440, 0.09, 'triangle');
  s.mover = () => tono(330, 0.07, 'triangle');
  s.gana = () => [523, 659, 784, 1047].forEach((f, i) => tono(f, 0.16, 'triangle', 0.07, i * 0.11));
  s.empate = () => { tono(260, 0.2, 'sine'); tono(220, 0.3, 'sine', 0.06, 0.18); };
  return s;
})();
