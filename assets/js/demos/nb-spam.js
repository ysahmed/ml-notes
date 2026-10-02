/* Demo B — spam filter: word chips, posterior gauge, Laplace collapse */
(function () {
  'use strict';
  var cv = document.getElementById('cv-nb-spam');
  if (!cv || typeof Plot === 'undefined') return;

  // word -> [spamCount, hamCount] across a small mail corpus
  var WORDS = {
    free:      [6, 1],
    wire:      [5, 1],
    urgent:    [5, 0],
    guarantee: [5, 1],
    click:     [4, 1],
    meeting:   [0, 5],
    lunch:     [0, 6],
    tomorrow:  [2, 3]
  };
  var PRIOR = 0.4;                 // 40% of mail is spam
  var V = Object.keys(WORDS).length;

  var state = { on: { free: true, wire: true, meeting: true }, laplace: true };

  var elPost = document.getElementById('nb-spam-post');
  var elLog = document.getElementById('nb-spam-log');
  var elLap = document.getElementById('nb-spam-lap');

  function totals(cls) {
    var s = 0;
    for (var w in WORDS) s += WORDS[w][cls];
    return s;
  }
  var TOT = [totals(0), totals(1)];

  function logP(w, cls) {
    var c = WORDS[w][cls];
    if (state.laplace) return Math.log((c + 1) / (TOT[cls] + V));
    if (c === 0) return -Infinity;
    return Math.log(c / TOT[cls]);
  }

  function posterior() {
    var lpS = Math.log(PRIOR), lpH = Math.log(1 - PRIOR);
    for (var w in state.on) {
      if (!state.on[w]) continue;
      lpS += logP(w, 0);
      lpH += logP(w, 1);
      if (lpS === -Infinity && lpH === -Infinity) return { p: 0, lp: -Infinity, dead: true };
    }
    if (lpS === -Infinity) return { p: 0, lp: lpS, dead: true };
    if (lpH === -Infinity) return { p: 1, lp: lpS, dead: false };
    var m = Math.max(lpS, lpH);
    var p = Math.exp(lpS - m) / (Math.exp(lpS - m) + Math.exp(lpH - m));
    return { p: p, lp: lpS, dead: false };
  }

  var plot = new Plot(cv, {
    range: { xmin: 0, xmax: 1, ymin: 0, ymax: 1 },
    height: 140,
    draw: function (p) {
      var col = p.colors;
      var r = posterior();
      var pH = 1 - r.p;

      // split gauge
      p.cell(0, 1, 0.3, 0.8, col.fg, 0.06);
      if (pH > 0.002) p.cell(0, pH, 0.3, 0.8, col.accent, 0.85);
      if (r.p > 0.002) p.cell(pH, 1, 0.3, 0.8, col.accent2, 0.85);
      p.vline(0.5, { color: col.fg, width: 1.6, dash: [5, 4] });

      p.text('P(ham | words)', 0.015, 0.93, { color: col.accent, font: '600 12.5px system-ui, sans-serif' });
      p.text('P(spam | words)', 0.985, 0.93, { align: 'right', color: col.accent2, font: '600 12.5px system-ui, sans-serif' });

      var lp = r.lp === -Infinity ? '−∞' : r.lp.toFixed(1);
      p.text('spam: ' + (r.p * 100 < 0.1 && r.p > 0 ? '<0.1' : (r.p * 100).toFixed(r.p < 0.1 ? 1 : 0)) + '%',
        pH + (r.p > 0.12 ? 0.02 : -0.02), 0.55,
        { align: r.p > 0.12 ? 'left' : 'right', color: col.fg, font: '700 14px system-ui, sans-serif' });

      if (r.dead) {
        elPost.innerHTML = 'P(spam|words) = <b>0%</b> — one zero count killed the whole product';
        elLog.innerHTML = 'ln numerator = <b>−∞</b>';
      } else {
        elPost.innerHTML = 'P(spam|words) = <b>' +
          (r.p < 0.001 ? r.p.toExponential(1) : (r.p * 100).toFixed(1) + '%') + '</b>';
        elLog.innerHTML = 'ln P(spam, words) = <b>' + lp + '</b> (stays readable)';
      }
    }
  });

  // word chips
  var chips = document.getElementById('nb-word-chips');
  chips.addEventListener('click', function (e) {
    var b = e.target.closest('button[data-w]');
    if (!b) return;
    var w = b.getAttribute('data-w');
    state.on[w] = !state.on[w];
    b.setAttribute('aria-pressed', String(!!state.on[w]));
    plot.render();
  });
  chips.querySelectorAll('button[data-w]').forEach(function (b) {
    b.setAttribute('aria-pressed', String(!!state.on[b.getAttribute('data-w')]));
  });

  elLap.addEventListener('click', function () {
    state.laplace = !state.laplace;
    elLap.setAttribute('aria-pressed', String(state.laplace));
    elLap.textContent = state.laplace ? 'Laplace smoothing: on' : 'Laplace smoothing: off';
    plot.render();
  });
})();
