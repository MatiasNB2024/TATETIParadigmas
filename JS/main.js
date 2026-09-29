/* Interfaz y control de partida */
(function () {
  'use strict';
  const T = window.TTT, S = window.Sonido;
  const $ = s => document.querySelector(s);
  const DEF = { modo: 'reglamento', diag: true, rival: 'dificil', nombreX: 'Jugador 1', nombreO: 'Jugador 2', sonido: true };
  const leer = (k, d) => { try { return Object.assign({}, d, JSON.parse(localStorage.getItem(k))); } catch (e) { return Object.assign({}, d); } };
  const guardar = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* almacenamiento no disponible */ } };
  const MARCA = {
    X: '<svg viewBox="0 0 100 100" aria-hidden="true"><path pathLength="1" d="M24 24 L76 76"/><path class="b" pathLength="1" d="M76 24 L24 76"/></svg>',
    O: '<svg viewBox="0 0 100 100" aria-hidden="true"><path pathLength="1" d="M50 22 C68 20 80 36 78 52 C76 70 60 80 44 76 C28 72 20 56 24 42 C27 30 38 24 50 22"/></svg>'
  };

  let cfg = leer('tateti.cfg', DEF);
  let score = leer('tateti.score', { X: 0, O: 0, E: 0, inicia: 'X', hist: [] });
  let g, ver = 0;
  const celdas = [];

  const esCompu = x => cfg.rival !== 'humano' && x === 'O';
  const nombre = x => (esCompu(x) ? 'Compu' : (x === 'X' ? cfg.nombreX : cfg.nombreO) || x);
  const clave = e => e.t.map(c => c || '-').join('') + e.turno;

  function nueva() {
    ver++;
    g = { e: T.vacio(score.inicia), fin: null, linea: null, sel: null, ultimo: null, reps: {}, pila: [], aviso: '', pensando: false };
    g.reps[clave(g.e)] = 1;
    render();
    turnoCompu();
  }

  function msg(t) { g.aviso = t; render(); }

  function clic(i) {
    if (g.fin || g.pensando || esCompu(g.e.turno)) return;
    const e = g.e, ms = T.movs(e, cfg);
    if (T.colocando(e, cfg)) {
      const m = ms.find(m => m.h === i);
      return m ? jugar(m) : msg('Esa casilla está ocupada.');
    }
    if (e.t[i] === e.turno) { g.sel = g.sel === i ? null : i; g.aviso = ''; return render(); }
    if (g.sel == null) return msg('Elegí una de tus fichas para moverla.');
    const m = ms.find(m => m.d === g.sel && m.h === i);
    return m ? jugar(m) : msg('Movela a una casilla vacía vecina.');
  }

  function jugar(m) {
    g.pila.push({ e: g.e, reps: Object.assign({}, g.reps), ultimo: g.ultimo });
    let e = T.aplicar(g.e, m);
    g.ultimo = m.h; g.sel = null; g.aviso = '';
    if (cfg.sonido) (m.d == null ? S.poner : S.mover)();
    const r = T.evaluar(e, cfg);
    if (r.fin === 'gana') { g.e = e; g.linea = r.linea; g.fin = { tipo: 'gana', quien: r.quien }; return terminar(); }
    if (r.fin === 'empate') { g.e = e; g.fin = { tipo: 'empate', motivo: 'Ninguno puede mover.' }; return terminar(); }
    if (r.pasa) { g.aviso = nombre(e.turno) + ' no tiene movimientos y pasa el turno.'; e = r.estado; }
    g.e = e;
    const k = clave(e);
    g.reps[k] = (g.reps[k] || 0) + 1;
    if (g.reps[k] >= 3) { g.fin = { tipo: 'empate', motivo: 'La posición se repitió tres veces.' }; return terminar(); }
    render();
    turnoCompu();
  }

  function terminar() {
    const f = g.fin;
    if (f.tipo === 'gana') { score[f.quien]++; if (cfg.sonido) S.gana(); } else { score.E++; if (cfg.sonido) S.empate(); }
    const txt = f.tipo === 'gana' ? 'Ganó ' + nombre(f.quien) + ' (' + f.quien + ')' : 'Empate';
    score.hist.unshift(txt + (cfg.modo === 'clasico' ? ' · clásico' : ''));
    score.hist = score.hist.slice(0, 8);
    guardar('tateti.score', score);
    render();
  }

  function turnoCompu() {
    if (g.fin || !esCompu(g.e.turno)) return;
    const v = ++ver;
    g.pensando = true; render();
    setTimeout(() => {
      if (v !== ver || g.fin) return;
      const m = T.ia(g.e, cfg, cfg.rival);
      if (!m) return;
      if (m.d == null) { g.pensando = false; return jugar(m); }
      g.sel = m.d; render();
      setTimeout(() => { if (v !== ver || g.fin) return; g.pensando = false; jugar(m); }, 380);
    }, 450 + Math.random() * 250);
  }

  function deshacer() {
    if (g.fin || !g.pila.length) return;
    ver++; g.pensando = false;
    let p = g.pila.pop();
    if (cfg.rival !== 'humano' && esCompu(p.e.turno) && g.pila.length) p = g.pila.pop();
    g.e = p.e; g.reps = p.reps; g.ultimo = p.ultimo; g.sel = null; g.aviso = '';
    render();
    turnoCompu();
  }

  function render() {
    const e = g.e, activo = !g.fin, ms = activo ? T.movs(e, cfg) : [];
    const colocando = activo && T.colocando(e, cfg), humano = activo && !esCompu(e.turno) && !g.pensando;
    const dest = new Set(!colocando && g.sel != null ? ms.filter(m => m.d === g.sel).map(m => m.h) : []);
    const movibles = new Set(!colocando && humano ? ms.map(m => m.d) : []);
    celdas.forEach((b, i) => {
      const v = e.t[i];
      b.className = 'celda' + (v ? ' ' + v : '') + (g.sel === i ? ' sel' : '') + (dest.has(i) ? ' dest' : '') + (movibles.has(i) ? ' movible' : '');
      if (b._v !== v) { b.innerHTML = v ? MARCA[v] : ''; b._v = v; }
      b.setAttribute('aria-label', 'Fila ' + (Math.floor(i / 3) + 1) + ', columna ' + (i % 3 + 1) + ': ' + (v ? 'ficha ' + v : 'vacía'));
    });

    $('#nomX').textContent = nombre('X') + ' (X)'; $('#nomO').textContent = nombre('O') + ' (O)';
    $('#ptsX').textContent = score.X; $('#ptsO').textContent = score.O; $('#ptsE').textContent = score.E;
    $('#jugX').classList.toggle('activo', activo && e.turno === 'X');
    $('#jugO').classList.toggle('activo', activo && e.turno === 'O');
    const fichas = x => (cfg.modo === 'clasico' ? '' : 'Por colocar: ' + (3 - e.col[x]));
    $('#fichasX').textContent = fichas('X'); $('#fichasO').textContent = fichas('O');
    $('#modoTxt').textContent = (cfg.modo === 'clasico' ? 'Modo clásico' : 'Modo reglamento: 3 fichas y movimiento') + ' · ' + ({ humano: '2 jugadores', facil: 'contra la compu (fácil)', medio: 'contra la compu (media)', dificil: 'contra la compu (difícil)' })[cfg.rival];

    let est;
    if (g.fin) est = g.fin.tipo === 'gana' ? '¡Ganó ' + nombre(g.fin.quien) + '!' : 'Empate';
    else if (g.pensando) est = nombre(e.turno) + ' está pensando…';
    else if (colocando) est = 'Turno de ' + nombre(e.turno) + ': poné una ficha';
    else est = 'Turno de ' + nombre(e.turno) + (g.sel != null ? ': elegí a dónde moverla' : ': elegí una ficha para mover');
    $('#estado').textContent = est;
    $('#aviso').textContent = g.fin && g.fin.motivo ? g.fin.motivo : g.aviso;
    $('#bDeshacer').disabled = !!g.fin || !g.pila.length;

    const h = $('#hist');
    h.innerHTML = score.hist.length ? score.hist.map(t => '<li>' + t.replace(/</g, '&lt;') + '</li>').join('') : '<li class="vacio">Todavía no se jugó ninguna.</li>';
    dibujarLinea();
  }

  function dibujarLinea() {
    const s = $('#linea');
    if (!g.fin || !g.linea) { s.innerHTML = ''; s.dataset.l = ''; return; }
    if (s.dataset.l === g.linea.join()) return;
    s.dataset.l = g.linea.join();
    const c = i => [(i % 3) * 100 + 50, Math.floor(i / 3) * 100 + 50];
    const a = c(g.linea[0]), b = c(g.linea[2]), dx = b[0] - a[0], dy = b[1] - a[1], k = 0.2;
    s.innerHTML = '<line class="' + g.fin.quien + '" pathLength="1" x1="' + (a[0] - dx * k) + '" y1="' + (a[1] - dy * k) + '" x2="' + (b[0] + dx * k) + '" y2="' + (b[1] + dy * k) + '"/>';
  }

  /* ---------- Inicio y eventos ---------- */
  const tab = $('#tablero');
  for (let i = 0; i < 9; i++) {
    const b = document.createElement('button');
    b.type = 'button'; b.addEventListener('click', () => clic(i));
    tab.appendChild(b); celdas.push(b);
  }
  tab.addEventListener('keydown', ev => {
    const d = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -3, ArrowDown: 3 }[ev.key];
    const i = celdas.indexOf(document.activeElement);
    if (d && i > -1) {
      const n = i + d;
      if (n >= 0 && n < 9 && !(Math.abs(d) === 1 && Math.floor(n / 3) !== Math.floor(i / 3))) { celdas[n].focus(); ev.preventDefault(); }
    }
  });

  $('#bNueva').addEventListener('click', () => { if (g.fin) { score.inicia = T.otro(score.inicia); guardar('tateti.score', score); } nueva(); });
  $('#bDeshacer').addEventListener('click', deshacer);
  $('#bReset').addEventListener('click', () => { score = { X: 0, O: 0, E: 0, inicia: 'X', hist: [] }; guardar('tateti.score', score); nueva(); });
  $('#bReglas').addEventListener('click', () => $('#dlgReglas').showModal());
  $('#bCerrarReglas').addEventListener('click', () => $('#dlgReglas').close());

  const dlg = $('#dlgAjustes'), f = $('#fAjustes');
  $('#bAjustes').addEventListener('click', () => {
    f.rival.value = cfg.rival; f.modo.value = cfg.modo; f.diag.value = cfg.diag ? '1' : '0';
    f.nombreX.value = cfg.nombreX; f.nombreO.value = cfg.nombreO; f.sonido.checked = cfg.sonido;
    dlg.showModal();
  });
  $('#bCancelar').addEventListener('click', () => dlg.close('cancel'));
  dlg.addEventListener('close', () => {
    if (dlg.returnValue !== 'ok') return;
    const n = { rival: f.rival.value, modo: f.modo.value, diag: f.diag.value === '1', sonido: f.sonido.checked,
      nombreX: f.nombreX.value.trim() || 'Jugador 1', nombreO: f.nombreO.value.trim() || 'Jugador 2' };
    const cambia = n.rival !== cfg.rival || n.modo !== cfg.modo || n.diag !== cfg.diag;
    cfg = n; guardar('tateti.cfg', cfg); S.on = cfg.sonido;
    if (cambia) score = { X: 0, O: 0, E: 0, inicia: 'X', hist: [] };
    guardar('tateti.score', score);
    nueva();
  });

  S.on = cfg.sonido;
  nueva();
})();
