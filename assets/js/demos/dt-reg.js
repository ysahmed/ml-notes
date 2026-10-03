/* Demo C — regression tree: each leaf is a mean; steps through noisy data */
(function () {
  'use strict';
  var cv = document.getElementById('cv-dt-reg');
  if (!cv || typeof Plot === 'undefined') return;

  var F = function (x) { return 1.25 * Math.sin(2.6 * x) + 0.25 * x; };
  var rnd = mulberry32(83), train = [], test = [];
  for (var i = 0; i < 48; i++) {
    var x = -2 + 4 * rnd();
    train.push([x, F(x) + 0.65 * gauss(rnd)]);
  }
  for (var j = 0; j <= 160; j++) {
    var xt = -2 + 4 * j / 160;
    test.push([xt, F(xt) + 0.5 * gauss(rnd)]);
  }

  function statsOf(pts, idx) {
    var s = 0, s2 = 0, lo = Infinity, hi = -Infinity;
    for (var i = 0; i < idx.length; i++) {
      var v = pts[idx[i]];
      s += v[1]; s2 += v[1] * v[1];
      if (v[0] < lo) lo = v[0];
      if (v[0] > hi) hi = v[0];
    }
    var n = idx.length;
    return { mean: s / n, sse: s2 - (s * s) / n, s: s, s2: s2, n: n, lo: lo, hi: hi };
  }

  // grow best-first: repeatedly split the leaf that removes the most squared error
  function grow(pts, k) {
    var nodes = [{ idx: pts.map(function (_, i) { return i; }) }];
    nodes[0].st = statsOf(pts, nodes[0].idx);
    while (nodes.length < k) {
      var bi = -1, bg = 1e-9, bs = null;
      for (var i2 = 0; i2 < nodes.length; i2++) {
        var nd = nodes[i2];
        if (nd.idx.length < 4) continue;
        var sorted = nd.idx.slice().sort(function (a, b) { return pts[a][0] - pts[b][0]; });
        var sy = 0, sy2 = 0;
        for (var a = 0; a < sorted.length - 1; a++) {
          var ya = pts[sorted[a]][1];
          sy += ya; sy2 += ya * ya;
          if (pts[sorted[a]][0] === pts[sorted[a + 1]][0]) continue;
          var nl = a + 1, nr = sorted.length - nl;
          var thr = (pts[sorted[a]][0] + pts[sorted[a + 1]][0]) / 2;
          var sseL = sy2 - (sy * sy) / nl;
          var rs = nd.st.s - sy, rs2 = nd.st.s2 - sy2;
          var sseR = rs2 - (rs * rs) / nr;
          var gain = nd.st.sse - (sseL + sseR);
          if (gain > bg) {
            bg = gain;
            bs = { i: i2, thr: thr, sorted: sorted.slice(0, nl) };
          }
        }
      }
      if (!bs) break;
      var leftSet = {};
      bs.sorted.forEach(function (id) { leftSet[id] = 1; });
      var parent = nodes[bs.i], L = [], R = [];
      parent.idx.forEach(function (id) { (leftSet[id] ? L : R).push(id); });
      var a1 = { idx: L }, a2 = { idx: R };
      a1.st = statsOf(pts, L); a2.st = statsOf(pts, R);
      nodes.splice(bs.i, 1, a1, a2);
    }
    var leaves = nodes.map(function (nd) { return nd.st; });
    leaves.sort(function (p, q) { return p.lo - q.lo; });
    return leaves;
  }

  function leafOf(leaves, x) {
    for (var i = 0; i < leaves.length; i++) if (x <= leaves[i].hi) return leaves[i];
    return leaves[leaves.length - 1];
  }
  function mse(leaves, pts) {
    var s = 0;
    pts.forEach(function (p) { var e = leafOf(leaves, p[0]).mean - p[1]; s += e * e; });
    return s / pts.length;
  }

  var KMAX = 14, table = [];
  for (var k = 2; k <= KMAX; k++) {
    var leaves = grow(train, k);
    table.push({ k: leaves.length, leaves: leaves, train: mse(leaves, train), test: mse(leaves, test) });
  }
  var best = table.reduce(function (a, b) { return b.test < a.test ? b : a; });

  var state = { k: 6 };
  var slider = document.getElementById('dt-leaves');
  var elK = document.getElementById('dt-reg-leaves');
  var elTr = document.getElementById('dt-reg-train');
  var elTe = document.getElementById('dt-reg-test');
  var elBest = document.getElementById('dt-reg-best');

  var plot = new Plot(cv, {
    range: { xmin: -2.35, xmax: 2.35, ymin: -3.4, ymax: 3.4 },
    height: 330,
    xlabel: 'x',
    ylabel: 'y',
    draw: function (p) {
      var col = p.colors, row = table[state.k - 2];

      p.axes();
      p.fnLine(F, { color: col.axis, width: 1.8, dash: [5, 5] });
      p.points(train, { color: col.accent, r: 4 });

      var steps = [];
      row.leaves.forEach(function (lf, i) {
        if (i) steps.push([lf.lo, row.leaves[i - 1].mean]);
        steps.push([lf.lo, lf.mean]);
        steps.push([lf.hi, lf.mean]);
      });
      p.line(steps, { color: col.accent2, width: 2.6 });

      p.text('true f(x) — never see it', p.range.xmin + 0.1, 3.05,
        { font: '11.5px system-ui', color: col.axis });
      p.text('training points', p.range.xmin + 0.1, -3.1,
        { font: '11.5px system-ui', color: col.accent });
      p.text('tree prediction (leaf means)', p.range.xmax - 0.1, -3.1,
        { font: '11.5px system-ui', color: col.accent2, align: 'right' });

      elK.innerHTML = 'leaves: <b>' + row.k + '</b>';
      elTr.innerHTML = 'train MSE: <b>' + row.train.toFixed(3) + '</b>';
      elTe.innerHTML = 'test MSE: <b>' + row.test.toFixed(3) + '</b>';
      elBest.innerHTML = 'sweet spot: <b>' + best.k + ' leaves</b> (test ' + best.test.toFixed(3) + ')';
    }
  });

  slider.addEventListener('input', function () {
    state.k = Number(slider.value);
    plot.render();
  });
})();
