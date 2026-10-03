/* Demo B — grow the tree: depth slider, axis-aligned boxes, train vs test */
(function () {
  'use strict';
  var cv = document.getElementById('cv-dt-depth');
  if (!cv || typeof Plot === 'undefined') return;

  var rnd = mulberry32(47);
  function gen(n, cx, cy, c, into) {
    for (var i = 0; i < n; i++) {
      into.push({ x: cx + gauss(rnd), y: cy + gauss(rnd), c: c });
    }
  }
  var train = [], test = [];
  gen(120, -0.85, 0.75, 0, train); gen(120, 0.85, -0.75, 1, train);
  gen(400, -0.85, 0.75, 0, test); gen(400, 0.85, -0.75, 1, test);

  function gini(counts, n) {
    if (!n) return 0;
    var s = 0;
    for (var i = 0; i < 2; i++) { var p = counts[i] / n; s += p * p; }
    return 1 - s;
  }

  function build(data, depth, maxDepth) {
    var n = data.length, counts = [0, 0];
    data.forEach(function (p) { counts[p.c]++; });
    var pred = counts[1] > counts[0] ? 1 : 0;
    if (depth >= maxDepth || n < 4 || counts[0] === 0 || counts[1] === 0) {
      return { leaf: true, pred: pred };
    }
    var parentG = gini(counts, n), best = null, bestGain = 1e-9;
    ['x', 'y'].forEach(function (f) {
      var sorted = data.slice().sort(function (a, b) { return a[f] - b[f]; });
      var cl = [0, 0];
      for (var i = 1; i < n; i++) {
        cl[sorted[i - 1].c]++;
        if (sorted[i][f] === sorted[i - 1][f]) continue;
        var nl = i, nr = n - i;
        if (nl < 2 || nr < 2) continue;
        var cr = [counts[0] - cl[0], counts[1] - cl[1]];
        var gain = parentG - (nl * gini(cl, nl) + nr * gini(cr, nr)) / n;
        if (gain > bestGain) {
          bestGain = gain;
          best = { f: f, thr: (sorted[i][f] + sorted[i - 1][f]) / 2 };
        }
      }
    });
    if (!best) return { leaf: true, pred: pred };
    var L = [], R = [];
    data.forEach(function (p) { (p[best.f] < best.thr ? L : R).push(p); });
    if (!L.length || !R.length) return { leaf: true, pred: pred };
    return {
      leaf: false, f: best.f, thr: best.thr,
      left: build(L, depth + 1, maxDepth), right: build(R, depth + 1, maxDepth)
    };
  }

  function predict(tree, p) {
    while (!tree.leaf) tree = p[tree.f] < tree.thr ? tree.left : tree.right;
    return tree.pred;
  }
  function accuracy(tree, data) {
    var ok = 0;
    data.forEach(function (p) { if (predict(tree, p) === p.c) ok++; });
    return 100 * ok / data.length;
  }
  function countLeaves(tree) {
    return tree.leaf ? 1 : countLeaves(tree.left) + countLeaves(tree.right);
  }

  var MAXD = 12, trees = [];
  for (var d = 1; d <= MAXD; d++) trees[d] = build(train, 0, d);

  var state = { depth: 3 };
  var slider = document.getElementById('dt-depth');
  var elD = document.getElementById('dt-depth-d');
  var elL = document.getElementById('dt-depth-leaves');
  var elTr = document.getElementById('dt-depth-train');
  var elTe = document.getElementById('dt-depth-test');

  var plot = new Plot(cv, {
    range: { xmin: -4.4, xmax: 4.4, ymin: -4.4, ymax: 4.4 },
    height: 380,
    xlabel: 'feature 1',
    ylabel: 'feature 2',
    draw: function (p) {
      var col = p.colors, tree = trees[state.depth];

      var G = 46, sx = (p.range.xmax - p.range.xmin) / G, sy = (p.range.ymax - p.range.ymin) / G;
      for (var i = 0; i < G; i++) {
        for (var j = 0; j < G; j++) {
          var pc = predict(tree, {
            x: p.range.xmin + (i + 0.5) * sx,
            y: p.range.ymin + (j + 0.5) * sy
          });
          p.cell(p.range.xmin + i * sx, p.range.xmin + (i + 1) * sx,
                 p.range.ymin + j * sy, p.range.ymin + (j + 1) * sy,
                 pc === 1 ? col.accent2 : col.accent, 0.1);
        }
      }

      p.axes();

      train.forEach(function (pt) {
        var wrong = predict(tree, pt) !== pt.c;
        p.dot(pt.x, pt.y, {
          r: 4.4, color: pt.c === 0 ? col.accent : col.accent2,
          ring: wrong ? col.fg : col.surface, ringWidth: wrong ? 2.4 : 1.4
        });
      });

      elD.innerHTML = 'max depth: <b>' + state.depth + '</b>';
      elL.innerHTML = 'leaf boxes: <b>' + countLeaves(tree) + '</b>';
      elTr.innerHTML = 'train: <b>' + accuracy(tree, train).toFixed(1) + '%</b>';
      elTe.innerHTML = 'test: <b>' + accuracy(tree, test).toFixed(1) + '%</b>';
    }
  });

  slider.addEventListener('input', function () {
    state.depth = Number(slider.value);
    plot.render();
  });
})();
