/* Lógica pura del Ta Te Ti (sin DOM). Estado: {t:[9], turno:'X'|'O', col:{X,O}} */
(function (w) {
  'use strict';
  const T = {};
  T.LINEAS = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
  T.otro = x => (x === 'X' ? 'O' : 'X');
  T.vacio = turno => ({ t: Array(9).fill(null), turno, col: { X: 0, O: 0 } });

  T.vecinos = (i, diag) => {
    const r = Math.floor(i / 3), c = i % 3, out = [];
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
      if (!dr && !dc) continue;
      if (!diag && dr && dc) continue;
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < 3 && nc >= 0 && nc < 3) out.push(nr * 3 + nc);
    }
    return out;
  };

  // ¿El jugador de turno está en fase de colocar fichas?
  T.colocando = (e, cfg) => cfg.modo === 'clasico' || e.col[e.turno] < 3;

  // Movimientos legales: {h} = colocar en h; {d,h} = mover de d a h
  T.movs = (e, cfg) => {
    const ms = [];
    if (T.colocando(e, cfg)) {
      e.t.forEach((v, h) => { if (!v) ms.push({ h }); });
      return ms;
    }
    e.t.forEach((v, d) => {
      if (v === e.turno) T.vecinos(d, cfg.diag).forEach(h => { if (!e.t[h]) ms.push({ d, h }); });
    });
    return ms;
  };

  T.aplicar = (e, m) => {
    const t = e.t.slice(), col = { X: e.col.X, O: e.col.O };
    if (m.d == null) col[e.turno]++; else t[m.d] = null;
    t[m.h] = e.turno;
    return { t, turno: T.otro(e.turno), col };
  };

  T.ganador = t => {
    for (const l of T.LINEAS) if (t[l[0]] && t[l[0]] === t[l[1]] && t[l[1]] === t[l[2]]) return { quien: t[l[0]], linea: l };
    return null;
  };

  // Resultado después de una jugada: {fin:'gana'|'empate'} | {pasa:true, estado} | {}
  T.evaluar = (e, cfg) => {
    const g = T.ganador(e.t);
    if (g) return { fin: 'gana', quien: g.quien, linea: g.linea };
    if (T.movs(e, cfg).length) return {};
    const e2 = { t: e.t, col: e.col, turno: T.otro(e.turno) };
    if (T.movs(e2, cfg).length) return { pasa: true, estado: e2 };
    return { fin: 'empate' };
  };

  w.TTT = T;
})(typeof window !== 'undefined' ? window : globalThis);
