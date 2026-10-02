/* Demo C — Gaussian NB decision boundary with a prior slider */
(function () {
  'use strict';
  var cv = document.getElementById('cv-nb-bound');
  if (!cv || typeof Plot === 'undefined') return;

  function gen() {
    var rnd = mulberry32(59), pts = [];
    for (var i = 0; i < 55; i++) {
      pts.push({ x: -1.2 + gauss(rnd) * 1.25, y: -0.9 + gauss(rnd) * 0.95, c: 0 });
      pts.push({ x: 1.3 + gauss(rnd) * 1.05, y: 1.1 + gauss(rnd) * 1.3, c: 1 });
    }
    return pts;
  }

  // "training" = counting means and spreads (that's the whole fit)
  function fit(pts) {
    var out = [0, 1].map(function (c) {
      var xs = pts.filter(function (p) { return p.c === c; });
      var n = xs.length;
      var mx = xs.reduce(function (s, p) { return s + p.x; }, 0) / n;
      var my = xs.reduce(function (s, p) { return s + p.y; }, 0) / n;
      var vx = xs.reduce(function (s, p) { return s + (p.x - mx) * (p.x - mx); }, 0) / n;
      var vy = xs.reduce(function (s, p) { return s + (p.y - my) * (p.y - my); }, 0) / n;
      return { mx: mx, my: my, sx: Math.sqrt(vx), sy: Math.sqrt(vy), n: n };
    });
    return out;
  }

  var pts = gen();
  var model = fit(pts);
  var state = { prior: 0.5 };

  var slider = document.getElementById('nb-prior');
  var elPrior = document.getElementById('nb-bound-prior');

  function logL(c, x, y) {                       // naive: multiply per-axis densities
    var m = model[c];
    var zx = (x - m.mx) / m.sx, zy = (y - m.my) / m.sy;
    return -0.5 * (zx * zx + zy * zy) - Math.log(m.sx * m.sy * 2 * Math.PI);
  }

  function pSpam(x, y) {                         // class 1 probability
    var l1 = logL(1, x, y) + Math.log(state.prior);
    var l0 = logL(0, x, y) + Math.log(1 - state.prior);
    return 1 / (1 + Math.exp(-(l1 - l0)));
  }

  var plot = new Plot(cv, {
    range: { xmin: -4.5, xmax: 4.5, ymin: -4.5, ymax: 4.5 },
    height: 380,
    xlabel: 'feature 1',
    ylabel: 'feature 2',
    draw: function (p) {
      var col = p.colors;

      var G = 46, stepX = (p.range.xmax - p.range.xmin) / G, stepY = (p.range.ymax - p.range.ymin) / G;
      for (var i = 0; i < G; i++) {
        for (var j = 0; j < G; j++) {
          var x = p.range.xmin + (i + 0.5) * stepX, y = p.range.ymin + (j + 0.5) * stepY;
          var pr = pSpam(x, y);
          p.cell(p.range.xmin + i * stepX, p.range.xmin + (i + 1) * stepX,
                 p.range.ymin + j * stepY, p.range.ymin + (j + 1) * stepY,
                 pr > 0.5 ? col.accent2 : col.accent,
                 0.05 + 0.4 * Math.abs(2 * pr - 1));
        }
      }

      p.axes();

      pts.forEach(function (pt) {
        p.dot(pt.x, pt.y, {
          r: 4.6, color: pt.c === 0 ? col.accent : col.accent2,
          ring: col.surface, ringWidth: 1.4
        });
      });

      if (p.pointer && p.pointer.inside) {
        var pr = pSpam(p.pointer.x, p.pointer.y);
        p.badge([
          'P(class 1 | x) = ' + (pr * 100).toFixed(1) + '%',
          'P(class 0 | x) = ' + ((1 - pr) * 100).toFixed(1) + '%'
        ], p.pointer.x, p.pointer.y);
      }

      elPrior.innerHTML = 'prior (class 1) = <b>' + Math.round(state.prior * 100) + '%</b>';
    }
  });

  slider.addEventListener('input', function () {
    state.prior = Number(slider.value) / 100;
    plot.render();
  });
})();
