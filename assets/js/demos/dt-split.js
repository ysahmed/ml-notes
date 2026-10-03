/* Demo A — pick the split: purity explorer (Gini index) */
(function () {
  'use strict';
  var cv = document.getElementById('cv-dt-split');
  if (!cv || typeof Plot === 'undefined') return;

  // fixed strip: class 0 piles left, class 1 piles right, they overlap in the middle
  var rnd = mulberry32(11), pts = [];
  for (var i = 0; i < 13; i++) pts.push({ x: 0.05 + rnd() * 0.54, c: 0, jy: rnd() });
  for (var k = 0; k < 13; k++) pts.push({ x: 0.41 + rnd() * 0.54, c: 1, jy: rnd() });
  pts.sort(function (a, b) { return a.x - b.x; });

  function gini(counts, n) {
    if (!n) return 0;
    var s = 0;
    for (var i = 0; i < 2; i++) { var p = counts[i] / n; s += p * p; }
    return 1 - s;
  }
  function side(t) {
    var L = [0, 0], R = [0, 0];
    pts.forEach(function (p) { (p.x < t ? L : R)[p.c]++; });
    return { L: L, R: R, nL: L[0] + L[1], nR: R[0] + R[1] };
  }
  function weighted(t) {
    var s = side(t);
    return (s.nL * gini(s.L, s.nL) + s.nR * gini(s.R, s.nR)) / pts.length;
  }

  // the algorithm's job: try every threshold (midpoints of sorted x), keep the best
  var xs = pts.map(function (p) { return p.x; }), cands = [];
  for (var m = 0; m < xs.length - 1; m++) cands.push((xs[m] + xs[m + 1]) / 2);
  var bestT = 0.5, bestW = Infinity;
  cands.forEach(function (t) {
    var w = weighted(t);
    if (w < bestW - 1e-9) { bestW = w; bestT = t; }
  });

  var state = { t: 0.5 };
  var slider = document.getElementById('dt-split-pos');
  var elL = document.getElementById('dt-split-left');
  var elR = document.getElementById('dt-split-right');
  var elW = document.getElementById('dt-split-weighted');
  var btnBest = document.getElementById('dt-split-best');

  var plot = new Plot(cv, {
    range: { xmin: 0, xmax: 1, ymin: 0, ymax: 1.18 },
    height: 260,
    draw: function (p) {
      var col = p.colors, t = state.t, s = side(t);
      var gl = gini(s.L, s.nL), gr = gini(s.R, s.nR);
      var w = weighted(t);

      // proportion bars: width = group size, internal split = class mix
      var y0 = 0.06, y1 = 0.30;
      if (s.nL) {
        var fL = s.L[0] / s.nL;
        p.cell(0, t * fL, y0, y1, col.accent, 0.85);
        p.cell(t * fL, t, y0, y1, col.accent2, 0.85);
      }
      if (s.nR) {
        var fR = s.R[0] / s.nR;
        p.cell(t, t + (1 - t) * fR, y0, y1, col.accent, 0.85);
        p.cell(t + (1 - t) * fR, 1, y0, y1, col.accent2, 0.85);
      }

      // the two candidate thresholds
      p.vline(bestT, { color: col.axis, width: 1.6, dash: [5, 4] });
      p.text('best', bestT + 0.012, y1 + 0.1, { font: '11px system-ui', color: col.axis });
      p.vline(t, { color: col.accent, width: 2.4 });

      // the dots
      pts.forEach(function (pt) {
        p.dot(pt.x, 0.72 + pt.jy * 0.3, {
          r: 5.2, color: pt.c === 0 ? col.accent : col.accent2,
          ring: col.surface, ringWidth: 1.4
        });
      });

      p.text('left: ' + s.nL + ' dots · gini ' + gl.toFixed(2),
             Math.max(t / 2, 0.001), 0.44,
             { font: '11.5px system-ui', color: col.fg, align: t < 0.22 ? 'left' : 'center' });
      p.text('right: ' + s.nR + ' dots · gini ' + gr.toFixed(2),
             t + (1 - t) / 2, 0.44,
             { font: '11.5px system-ui', color: col.fg, align: (1 - t) < 0.26 ? 'right' : 'center' });
      p.text('feature value →', 0.5, 1.13, { font: '11.5px system-ui', color: col.axis, align: 'center' });

      var atBest = Math.abs(t - bestT) < 0.012;
      elL.innerHTML = 'left gini: <b>' + gl.toFixed(2) + '</b>';
      elR.innerHTML = 'right gini: <b>' + gr.toFixed(2) + '</b>';
      elW.innerHTML = atBest
        ? 'weighted gini: <b>' + w.toFixed(3) + '</b> — best split!'
        : 'weighted gini: <b>' + w.toFixed(3) + '</b> (best ' + bestW.toFixed(3) + ')';
    }
  });

  slider.addEventListener('input', function () {
    state.t = Number(slider.value) / 100;
    plot.render();
  });
  btnBest.addEventListener('click', function () {
    state.t = Math.round(bestT * 100) / 100;
    slider.value = Math.round(state.t * 100);
    plot.render();
  });
})();
