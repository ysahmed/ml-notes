/* Demo 4 — when a straight line is the wrong shape (underfitting) */
(function () {
  'use strict';
  var cv = document.getElementById('cv-curve');
  if (!cv || typeof Plot === 'undefined') return;

  var data = (function () {
    var rnd = mulberry32(43), pts = [];
    for (var i = 0; i < 30; i++) {
      var x = rnd() * 10;
      pts.push({ x: x, y: 0.32 * (x - 5) * (x - 5) + 3.5 + gauss(rnd) * 2.6 });
    }
    return pts;
  })();

  var mode = 'line';   // 'line' | 'curve'

  function fitLine(pts) {
    var n = pts.length, sx = 0, sy = 0, sxx = 0, sxy = 0;
    pts.forEach(function (p) { sx += p.x; sy += p.y; sxx += p.x * p.x; sxy += p.x * p.y; });
    var den = n * sxx - sx * sx;
    var m = den === 0 ? 0 : (n * sxy - sx * sy) / den;
    var b = (sy - m * sx) / n;
    return function (x) { return m * x + b; };
  }

  // least-squares fit of y = a·x² + b·x + c via the normal equations
  function solve3(A, rhs) {
    var n = 3, i, j, k;
    for (i = 0; i < n; i++) {
      var piv = i;
      for (k = i + 1; k < n; k++) if (Math.abs(A[k][i]) > Math.abs(A[piv][i])) piv = k;
      var tr = A[i]; A[i] = A[piv]; A[piv] = tr;
      var tv = rhs[i]; rhs[i] = rhs[piv]; rhs[piv] = tv;
      var d = A[i][i];
      if (Math.abs(d) < 1e-12) return null;
      for (j = i; j < n; j++) A[i][j] /= d;
      rhs[i] /= d;
      for (k = 0; k < n; k++) {
        if (k === i) continue;
        var f = A[k][i];
        for (j = i; j < n; j++) A[k][j] -= f * A[i][j];
        rhs[k] -= f * rhs[i];
      }
    }
    return rhs;
  }

  function fitQuad(pts) {
    var sx = 0, sy = 0, sx2 = 0, sx3 = 0, sx4 = 0, sxy = 0, sx2y = 0;
    pts.forEach(function (p) {
      var x = p.x, x2 = x * x;
      sx += x; sy += p.y; sx2 += x2; sx3 += x2 * x; sx4 += x2 * x2;
      sxy += x * p.y; sx2y += x2 * p.y;
    });
    var sol = solve3(
      [[sx4, sx3, sx2], [sx3, sx2, sx], [sx2, sx, pts.length]],
      [sx2y, sxy, sy]
    );
    if (!sol) return null;
    return function (x) { return sol[0] * x * x + sol[1] * x + sol[2]; };
  }

  function r2(pts, f) {
    var mean = 0;
    pts.forEach(function (p) { mean += p.y; });
    mean /= pts.length;
    var ssTot = 0, ssRes = 0;
    pts.forEach(function (p) {
      ssTot += (p.y - mean) * (p.y - mean);
      ssRes += (p.y - f(p.x)) * (p.y - f(p.x));
    });
    return ssTot === 0 ? 1 : 1 - ssRes / ssTot;
  }

  var lineFn = fitLine(data);
  var quadFn = fitQuad(data) || lineFn;

  var elR2 = document.getElementById('curve-r2');

  var plot = new Plot(cv, {
    range: { xmin: -1, xmax: 11, ymin: -5, ymax: 24 },
    height: 340,
    xlabel: 'feature x',
    ylabel: 'target y',
    draw: function (p) {
      var col = p.colors;
      var active = mode === 'line' ? lineFn : quadFn;
      var other = mode === 'line' ? quadFn : lineFn;

      p.axes();

      // the model you're NOT using, drawn faintly for comparison
      p.fnLine(other, { color: col.axis, width: 1.6, dash: [6, 5] });
      p.fnLine(active, { color: col.accent, width: 2.8 });

      p.points(data.map(function (q) { return [q.x, q.y]; }), { color: '#f59e0b', r: 4.4 });

      p.text(mode === 'line' ? 'straight line (active)' : 'straight line',
        9.6, lineFn(9.6), { color: mode === 'line' ? col.accent : col.axis, align: 'right', base: 'bottom' });
      p.text(mode === 'curve' ? 'quadratic curve (active)' : 'quadratic curve',
        5, quadFn(5) - 2.2, { color: mode === 'curve' ? col.accent : col.axis, align: 'center', base: 'bottom' });

      var rLine = r2(data, lineFn), rQuad = r2(data, quadFn);
      elR2.innerHTML = 'R² line: <b>' + rLine.toFixed(2) + '</b> · R² curve: <b>' +
        rQuad.toFixed(2) + '</b>';
    }
  });

  document.getElementById('curve-model').addEventListener('change', function (e) {
    mode = e.target.value;
    plot.render();
  });
})();
