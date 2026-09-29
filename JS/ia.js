/* Rival de la computadora: fácil (azar), medio (gana/bloquea), difícil (negamax con poda) */
(function (w) {
  'use strict';
  const T = w.TTT;
  const azar = a => a[Math.floor(Math.random() * a.length)];

  function heuristica(e) {
    const yo = e.turno, el = T.otro(yo);
    let s = e.t[4] === yo ? 3 : e.t[4] === el ? -3 : 0;
    for (const l of T.LINEAS) {
      let a = 0, b = 0;
      for (const i of l) { if (e.t[i] === yo) a++; else if (e.t[i] === el) b++; }
      if (!b && a) s += a === 2 ? 10 : 1;
      if (!a && b) s -= b === 2 ? 10 : 1;
    }
    return s;
  }

  function neg(e, prof, a, b, cfg) {
    if (T.ganador(e.t)) return -(1000 + prof);
    if (prof === 0) return heuristica(e);
    const ms = T.movs(e, cfg);
    if (!ms.length) {
      const e2 = { t: e.t, col: e.col, turno: T.otro(e.turno) };
      if (!T.movs(e2, cfg).length) return 0;
      return -neg(e2, prof - 1, -b, -a, cfg);
    }
    let mejor = -Infinity;
    for (const m of ms) {
      const v = -neg(T.aplicar(e, m), prof - 1, -b, -a, cfg);
      if (v > mejor) mejor = v;
      if (mejor > a) a = mejor;
      if (a >= b) break;
    }
    return mejor;
  }

  T.ia = (e, cfg, nivel) => {
    const ms = T.movs(e, cfg);
    if (!ms.length) return null;
    if (nivel === 'facil') return azar(ms);
    if (nivel === 'medio') {
      const gana = ms.filter(m => T.ganador(T.aplicar(e, m).t));
      if (gana.length) return azar(gana);
      const seguras = ms.filter(m => {
        const e2 = T.aplicar(e, m);
        return !T.movs(e2, cfg).some(r => T.ganador(T.aplicar(e2, r).t));
      });
      return azar(seguras.length ? seguras : ms);
    }
    const prof = cfg.modo === 'clasico' ? 9 : 8;
    let mejor = -Infinity, cand = [];
    for (const m of ms) {
      const v = -neg(T.aplicar(e, m), prof - 1, -Infinity, Infinity, cfg);
      if (v > mejor) { mejor = v; cand = [m]; } else if (v === mejor) cand.push(m);
    }
    return azar(cand);
  };
})(typeof window !== 'undefined' ? window : globalThis);
