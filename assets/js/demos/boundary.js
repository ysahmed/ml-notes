/* Demo 3 — probability heatmap + decision boundary of a trained model */
(function () {
  'use strict';
  var cv = document.getElementById('cv-boundary');
  if (!cv || typeof Plot === 'undefined') return;

  var COOL = [59, 130, 246];   // tint for "probably no"
  var WARM = [245, 158, 11];   // tint for "probably yes"

  function hexOf(rgb, a) {
    return 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',' + a + ')';
  }
  function mix(a, b, t) {
    return [Math.round(a[0] + (b[0] - a[0]) * t),
            Math.round(a[1] + (b[1] - a[1]) * t),
            Math.round(a[2] + (b[2] - a[2]) * t)];
  }
  var sig = function (z) { return 1 / (1 + Math.exp(-z)); };

  function genData(kind) {
    var seeds = { easy: 11, hard: 23, rotate: 37 };
    var rnd = mulberry32(seeds[kind] || 11);
    var pts = [];
    var i;
    function blob(cx, cy, sd, n, label) {
      for (i = 0; i < n; i++) {
        pts.push({ x1: cx + gauss(rnd) * sd, x2: cy + gauss(rnd) * sd, y: label });
      }
    }
    if (kind === 'easy') {
      blob(-1.6, -1.6, 0.85, 55, 0);
      blob(1.6, 1.6, 0.85, 55, 1);
    } else if (kind === 'hard') {
      blob(-0.9, -0.9, 1.7, 60, 0);
      blob(0.9, 0.9, 1.7, 60, 1);
    } else {
      blob(-1.8, 1.5, 0.85, 55, 0);
      blob(1.8, -1.5, 0.85, 55, 1);
    }
    return pts;
  }

  var state = { kind: 'easy', data: genData('easy'), w: [0, 0], b: 0, iter: 0, anim: null };

  var elAcc = document.getElementById('bd-acc');
  var elW = document.getElementById('bd-weights');

  function resetWeights() {
    var rnd = mulberry32(1 + state.iter + state.data.length);
    state.w = [(rnd() - 0.5), (rnd() - 0.5)];
    state.b = 0;
    state.iter = 0;
  }

  function oneIter(lr) {
    var d = state.data, n = d.length;
    var w = state.w, e1 = 0, e2 = 0, eb = 0;
    for (var i = 0; i < n; i++) {
      var z = w[0] * d[i].x1 + w[1] * d[i].x2 + state.b;
      var e = sig(z) - d[i].y;
      e1 += e * d[i].x1;
      e2 += e * d[i].x2;
      eb += e;
    }
    w[0] -= lr * e1 / n;
    w[1] -= lr * e2 / n;
    state.b -= lr * eb / n;
    state.iter++;
  }

  function accuracy() {
    var d = state.data, ok = 0;
    for (var i = 0; i < d.length; i++) {
      var z = state.w[0] * d[i].x1 + state.w[1] * d[i].x2 + state.b;
      if ((sig(z) >= 0.5 ? 1 : 0) === d[i].y) ok++;
    }
    return ok / d.length;
  }

  function trainInstant() {
    resetWeights();
    for (var k = 0; k < 500; k++) oneIter(0.6);
  }

  function trainAnimated() {
    if (state.anim) cancelAnimationFrame(state.anim);
    resetWeights();
    var tick = function () {
      for (var k = 0; k < 7 && state.iter < 500; k++) oneIter(0.6);
      plot.render();
      if (state.iter < 500) state.anim = requestAnimationFrame(tick);
      else state.anim = null;
    };
    state.anim = requestAnimationFrame(tick);
  }

  var plot = new Plot(cv, {
    range: { xmin: -4.2, xmax: 4.2, ymin: -4.2, ymax: 4.2 },
    height: 400,
    xlabel: 'feature 1',
    ylabel: 'feature 2',
    draw: function (p) {
      var col = p.colors;
      var w = state.w, b = state.b;

      // 1) background tint = probability of class 1
      var G = 46;
      var stepX = (p.range.xmax - p.range.xmin) / G;
      var stepY = (p.range.ymax - p.range.ymin) / G;
      for (var i = 0; i < G; i++) {
        for (var j = 0; j < G; j++) {
          var x0 = p.range.xmin + i * stepX;
          var y0 = p.range.ymin + j * stepY;
          var prob = sig(w[0] * (x0 + stepX / 2) + w[1] * (y0 + stepY / 2) + b);
          var rgb = mix(COOL, WARM, prob);
          var alpha = 0.10 + 0.42 * Math.abs(2 * prob - 1);
          p.cell(x0, x0 + stepX, y0, y0 + stepY, hexOf(rgb, alpha));
        }
      }

      p.axes();

      // 2) decision boundary where w·x + b = 0 (drawn with a halo for contrast)
      var linePts = null;
      if (Math.abs(w[1]) > 1e-6) {
        linePts = [[p.range.xmin, -(w[0] * p.range.xmin + b) / w[1]],
                   [p.range.xmax, -(w[0] * p.range.xmax + b) / w[1]]];
      } else if (Math.abs(w[0]) > 1e-6) {
        var xv = -b / w[0];
        linePts = [[xv, p.range.ymin], [xv, p.range.ymax]];
      }
      if (linePts) {
        p.line(linePts, { color: col.surface, width: 6 });
        p.line(linePts, { color: col.fg, width: 2.4 });
      }

      // 3) the data
      state.data.forEach(function (d) {
        p.dot(d.x1, d.x2, {
          r: 4.4,
          color: d.y === 0 ? '#3b82f6' : '#f59e0b',
          ring: col.surface,
          ringWidth: 1.5
        });
      });

      elAcc.innerHTML = 'accuracy: <b>' + Math.round(accuracy() * 100) + '%</b>';
      elW.innerHTML = 'weights: <b>(' + w[0].toFixed(2) + ', ' + w[1].toFixed(2) + ')</b> · b = ' + b.toFixed(2);
    }
  });

  document.getElementById('bd-data').addEventListener('change', function (e) {
    state.kind = e.target.value;
    state.data = genData(state.kind);
    trainAnimated();
  });
  document.getElementById('bd-retrain').addEventListener('click', trainAnimated);

  trainInstant();
  plot.render();
})();
