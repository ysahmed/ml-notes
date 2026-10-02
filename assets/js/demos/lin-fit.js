/* Demo 1 — best-fit line with visible residuals (the misses we minimize) */
(function () {
  'use strict';
  var cv = document.getElementById('cv-linfit');
  if (!cv || typeof Plot === 'undefined') return;

  function gen() {
    var rnd = mulberry32(17), pts = [];
    for (var i = 0; i < 22; i++) {
      var x = 600 + rnd() * 1900;                     // house size in sq ft
      pts.push({ x: x, y: 0.115 * x - 15 + gauss(rnd) * 16 });  // price in $1000s
    }
    return pts;
  }

  var state = { pts: gen(), hover: null };

  var elEq = document.getElementById('linfit-eq');
  var elR2 = document.getElementById('linfit-r2');

  function fit(pts) {
    var n = pts.length, sx = 0, sy = 0, sxx = 0, sxy = 0;
    pts.forEach(function (p) { sx += p.x; sy += p.y; sxx += p.x * p.x; sxy += p.x * p.y; });
    var den = n * sxx - sx * sx;
    var m = den === 0 ? 0 : (n * sxy - sx * sy) / den;
    var b = (sy - m * sx) / n;
    var mean = sy / n;
    var ssTot = 0, ssRes = 0;
    pts.forEach(function (p) {
      var yh = m * p.x + b;
      ssTot += (p.y - mean) * (p.y - mean);
      ssRes += (p.y - yh) * (p.y - yh);
    });
    return { m: m, b: b, r2: ssTot === 0 ? 1 : 1 - ssRes / ssTot };
  }

  var plot = new Plot(cv, {
    range: { xmin: 400, xmax: 2700, ymin: -20, ymax: 330 },
    height: 340,
    xlabel: 'size (sq ft)',
    ylabel: 'price ($1000s)',
    draw: function (p) {
      var col = p.colors;
      var f = fit(state.pts);
      p.axes();

      // residuals: the vertical distance from each point down/up to the line
      state.pts.forEach(function (pt) {
        var yh = f.m * pt.x + f.b;
        var hot = state.hover === pt;
        p.line([[pt.x, pt.y], [pt.x, yh]],
          { color: col.accent2, width: hot ? 2.6 : 1.2, dash: hot ? [] : [4, 4] });
      });

      p.line([[p.range.xmin, f.m * p.range.xmin + f.b],
              [p.range.xmax, f.m * p.range.xmax + f.b]],
             { color: col.fg, width: 2.6 });

      state.pts.forEach(function (pt) {
        p.dot(pt.x, pt.y, {
          r: state.hover === pt ? 6 : 4.6,
          color: '#3b82f6',
          ring: state.hover === pt ? col.accent2 : col.surface,
          ringWidth: state.hover === pt ? 2.5 : 1.5
        });
      });

      if (state.hover) {
        var pt = state.hover;
        var yh = f.m * pt.x + f.b;
        p.badge([
          'size: ' + Math.round(pt.x) + ' sq ft',
          'real price: ' + pt.y.toFixed(1),
          'line says: ' + yh.toFixed(1),
          'miss (residual): ' + (pt.y >= yh ? '+' : '') + (pt.y - yh).toFixed(1)
        ], pt.x, pt.y);
      }

      elEq.innerHTML = 'line: ŷ = <b>' + f.m.toFixed(3) + '</b>x ' +
        (f.b < 0 ? '− ' : '+ ') + Math.abs(f.b).toFixed(2);
      elR2.innerHTML = 'R² = <b>' + f.r2.toFixed(3) + '</b>';
    }
  });

  function nearest(e) {
    var r = cv.getBoundingClientRect();
    var mx = e.clientX - r.left, my = e.clientY - r.top;
    var best = null, bestD = 15;
    state.pts.forEach(function (pt) {
      var dx = plot.xToPx(pt.x) - mx, dy = plot.yToPx(pt.y) - my;
      var d = Math.hypot(dx, dy);
      if (d < bestD) { bestD = d; best = pt; }
    });
    return best;
  }

  cv.addEventListener('pointermove', function (e) {
    var h = nearest(e);
    if (h !== state.hover) { state.hover = h; plot.render(); }
  });
  cv.addEventListener('pointerleave', function () {
    state.hover = null; plot.render();
  });
  // click the canvas to add your own data point
  cv.addEventListener('click', function (e) {
    var d = plot.pxToData(e.clientX - cv.getBoundingClientRect().left,
                          e.clientY - cv.getBoundingClientRect().top);
    if (!d.inside || state.pts.length > 60) return;
    state.pts.push({ x: d.x, y: d.y });
    plot.render();
  });

  document.getElementById('linfit-reset').addEventListener('click', function () {
    state.pts = gen();
    state.hover = null;
    plot.render();
  });
})();
