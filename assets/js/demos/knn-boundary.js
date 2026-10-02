/* Demo B — decision boundary vs k (overfit → underfit, train vs test) */
(function () {
  'use strict';
  var cv = document.getElementById('cv-knn-bnd');
  if (!cv || typeof Plot === 'undefined') return;

  function gen(seed, n) {
    var rnd = mulberry32(seed), pts = [];
    for (var i = 0; i < n; i++) {
      pts.push({ x: -1.1 + gauss(rnd) * 1.3, y: -1.1 + gauss(rnd) * 1.3, c: 0 });
      pts.push({ x: 1.1 + gauss(rnd) * 1.3, y: 1.1 + gauss(rnd) * 1.3, c: 1 });
    }
    return pts;
  }

  var train = gen(7, 32);   // 64 points
  var test = gen(99, 32);   // 64 points
  var state = { k: 5, hover: null };

  var slider = document.getElementById('knn-k');
  var elK = document.getElementById('knn-bnd-k');
  var elAcc = document.getElementById('knn-bnd-acc');

  function rgba(hex, a) {
    var n = parseInt(hex.slice(1), 16);
    return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' +
           (n & 255) + ',' + a + ')';
  }

  function dist2(a, b) { var dx = a.x - b.x, dy = a.y - b.y; return dx * dx + dy * dy; }

  // majority vote among the k nearest training points
  function vote(q, k) {
    var sorted = train.slice().sort(function (a, b) { return dist2(a, q) - dist2(b, q); });
    var v = [0, 0];
    for (var i = 0; i < k; i++) v[sorted[i].c]++;
    return { winner: v[0] > v[1] ? 0 : 1, sorted: sorted.slice(0, k) };
  }

  function accuracy(pts, k) {
    var hit = 0;
    pts.forEach(function (pt) { if (vote(pt, k).winner === pt.c) hit++; });
    return Math.round(100 * hit / pts.length);
  }

  function updateReadout() {
    var k = state.k;
    elK.innerHTML = 'k = <b>' + k + '</b>';
    elAcc.innerHTML = 'train <b>' + accuracy(train, k) + '%</b> · test <b>' +
      accuracy(test, k) + '%</b>';
  }

  var plot = new Plot(cv, {
    range: { xmin: -4.2, xmax: 4.2, ymin: -4.2, ymax: 4.2 },
    height: 380,
    xlabel: 'feature 1',
    ylabel: 'feature 2',
    draw: function (p) {
      var col = p.colors;
      var k = state.k;

      // decision boundary: color each grid cell by the k-NN vote at its center
      var G = 44, stepX = (p.range.xmax - p.range.xmin) / G, stepY = (p.range.ymax - p.range.ymin) / G;
      for (var i = 0; i < G; i++) {
        for (var j = 0; j < G; j++) {
          var q = { x: p.range.xmin + (i + 0.5) * stepX, y: p.range.ymin + (j + 0.5) * stepY };
          var w = vote(q, k).winner;
          p.cell(p.range.xmin + i * stepX, p.range.xmin + (i + 1) * stepX,
                 p.range.ymin + j * stepY, p.range.ymin + (j + 1) * stepY,
                 w === 0 ? col.accent : col.accent2, 0.11);
        }
      }

      p.axes();

      // training points (filled) and test points (hollow)
      train.forEach(function (pt) {
        p.dot(pt.x, pt.y, {
          r: 4.6, color: pt.c === 0 ? col.accent : col.accent2,
          ring: col.surface, ringWidth: 1.3
        });
      });
      test.forEach(function (pt) {
        p.dot(pt.x, pt.y, {
          r: 4.6, color: col.surface,
          ring: pt.c === 0 ? col.accent : col.accent2, ringWidth: 1.8
        });
      });

      // hover a point: show its k neighbors and the vote it gets
      if (state.hover) {
        var r = vote(state.hover, k);
        r.sorted.forEach(function (n) {
          p.line([[state.hover.x, state.hover.y], [n.x, n.y]], { color: rgba(col.fg, 0.55), width: 1.6 });
          p.dot(n.x, n.y, { r: 6.6, color: n.c === 0 ? col.accent : col.accent2, ring: col.fg, ringWidth: 2.2 });
        });
        p.dot(state.hover.x, state.hover.y, {
          r: 7, color: col.surface, ring: col.fg, ringWidth: 2.8
        });
        p.badge([
          'point class: ' + (state.hover.c === 0 ? 'blue' : 'red'),
          'k=' + k + ' neighbors say: ' + (r.winner === 0 ? 'blue' : 'red')
        ], state.hover.x, state.hover.y);
      }

      updateReadout();
    }
  });

  function nearestHover(e) {
    var r = cv.getBoundingClientRect();
    var mx = e.clientX - r.left, my = e.clientY - r.top;
    var all = train.concat(test), best = null, bestD = 14;
    all.forEach(function (pt) {
      var d = Math.hypot(plot.xToPx(pt.x) - mx, plot.yToPx(pt.y) - my);
      if (d < bestD) { bestD = d; best = pt; }
    });
    return best;
  }

  cv.addEventListener('pointermove', function (e) {
    var h = nearestHover(e);
    if (h !== state.hover) { state.hover = h; plot.render(); }
  });
  cv.addEventListener('pointerleave', function () {
    state.hover = null; plot.render();
  });

  slider.addEventListener('input', function () {
    state.k = Number(slider.value);
    plot.render();
  });
})();
