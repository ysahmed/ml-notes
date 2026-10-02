/* Demo 6 — L2 / L1 regularization shrinking a noisy feature */
(function () {
  'use strict';
  var cv = document.getElementById('cv-regularization');
  if (!cv || typeof Plot === 'undefined') return;

  var COOL = [59, 130, 246];
  var WARM = [245, 158, 11];
  var sig = function (z) { return 1 / (1 + Math.exp(-z)); };

  function hexOf(rgb, a) {
    return 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',' + a + ')';
  }
  function mix(a, b, t) {
    return [Math.round(a[0] + (b[0] - a[0]) * t),
            Math.round(a[1] + (b[1] - a[1]) * t),
            Math.round(a[2] + (b[2] - a[2]) * t)];
  }

  // feature 1 is genuinely useful, feature 2 is pure noise
  var data = (function () {
    var rnd = mulberry32(99), pts = [];
    for (var i = 0; i < 90; i++) {
      var label = i % 2;
      pts.push({
        x1: (label ? 1.4 : -1.4) + gauss(rnd) * 1.0,
        x2: gauss(rnd) * 1.7,
        y: label
      });
    }
    return pts;
  })();

  var st = { w: [0, 0], b: 0, iter: 0, anim: null, type: 'l2', lam: 0.02 };

  var elW = document.getElementById('reg-weights');
  var elAcc = document.getElementById('reg-acc');
  var elLam = document.getElementById('reg-lambda-val');
  var slider = document.getElementById('reg-lambda');

  function lambdaFromSlider() {
    var v = Number(slider.value);
    return Math.pow(v / 100, 2) * 0.5;   // 0 … 0.5
  }

  function oneIter(lr) {
    var d = data, n = d.length;
    var g1 = 0, g2 = 0, gb = 0;
    for (var i = 0; i < n; i++) {
      var e = sig(st.w[0] * d[i].x1 + st.w[1] * d[i].x2 + st.b) - d[i].y;
      g1 += e * d[i].x1;
      g2 += e * d[i].x2;
      gb += e;
    }
    g1 /= n; g2 /= n; gb /= n;

    if (st.type === 'l2') {
      g1 += st.lam * st.w[0];
      g2 += st.lam * st.w[1];
    } else if (st.type === 'l1') {
      g1 += st.lam * Math.sign(st.w[0]);
      g2 += st.lam * Math.sign(st.w[1]);
    }
    st.w[0] -= lr * g1;
    st.w[1] -= lr * g2;
    st.b -= lr * gb;
    st.iter++;
  }

  function accuracy() {
    var ok = 0;
    for (var i = 0; i < data.length; i++) {
      var z = st.w[0] * data[i].x1 + st.w[1] * data[i].x2 + st.b;
      if ((sig(z) >= 0.5 ? 1 : 0) === data[i].y) ok++;
    }
    return ok / data.length;
  }

  function retrain() {
    if (st.anim) cancelAnimationFrame(st.anim);
    var rnd = mulberry32(7 + st.iter);
    st.w = [(rnd() - 0.5), (rnd() - 0.5)];
    st.b = 0;
    st.iter = 0;
    var tick = function () {
      for (var k = 0; k < 7 && st.iter < 700; k++) oneIter(0.5);
      plot.render();
      if (st.iter < 700) st.anim = requestAnimationFrame(tick);
      else st.anim = null;
    };
    st.anim = requestAnimationFrame(tick);
  }

  function drawWeightBars(p) {
    // small panel showing the two weights (zero = middle of the bar)
    var c = p.ctx, col = p.colors;
    var panelW = 170, panelH = 74;
    var x = p.w - panelW - 12, y = 12;
    c.save();
    c.globalAlpha = 0.96;
    c.fillStyle = col.surface;
    c.strokeStyle = col.axis;
    c.lineWidth = 1;
    c.beginPath();
    c.roundRect ? c.roundRect(x, y, panelW, panelH, 8) : c.rect(x, y, panelW, panelH);
    c.fill();
    c.stroke();

    var labels = ['w₁ (good feature)', 'w₂ (noise feature)'];
    var cols = ['#3b82f6', '#f59e0b'];
    var maxW = Math.max(2, Math.abs(st.w[0]), Math.abs(st.w[1]));
    var barX = x + 14, barW = panelW - 28, mid = barX + barW / 2;

    for (var i = 0; i < 2; i++) {
      var by = y + 24 + i * 24;
      c.fillStyle = col.grid;
      c.fillRect(barX, by + 5, barW, 3);              // track
      c.strokeStyle = col.axis;
      c.beginPath(); c.moveTo(mid, by); c.lineTo(mid, by + 13); c.stroke(); // zero mark
      var frac = st.w[i] / maxW;
      c.fillStyle = cols[i];
      c.fillRect(Math.min(mid, mid + frac * barW / 2), by + 2,
                 Math.abs(frac * barW / 2), 9);
      c.fillStyle = col.fg;
      c.font = '10.5px system-ui, sans-serif';
      c.textAlign = 'left';
      c.textBaseline = 'middle';
      c.fillText(labels[i], barX, by - 3);
    }
    c.restore();
  }

  var plot = new Plot(cv, {
    range: { xmin: -4.2, xmax: 4.2, ymin: -4.2, ymax: 4.2 },
    height: 400,
    xlabel: 'feature 1 (informative)',
    ylabel: 'feature 2 (noise)',
    draw: function (p) {
      var col = p.colors;
      var w = st.w, b = st.b;

      var G = 44, stepX = (p.range.xmax - p.range.xmin) / G, stepY = (p.range.ymax - p.range.ymin) / G;
      for (var i = 0; i < G; i++) {
        for (var j = 0; j < G; j++) {
          var x0 = p.range.xmin + i * stepX, y0 = p.range.ymin + j * stepY;
          var prob = sig(w[0] * (x0 + stepX / 2) + w[1] * (y0 + stepY / 2) + b);
          var rgb = mix(COOL, WARM, prob);
          p.cell(x0, x0 + stepX, y0, y0 + stepY, hexOf(rgb, 0.10 + 0.42 * Math.abs(2 * prob - 1)));
        }
      }

      p.axes();

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

      data.forEach(function (d) {
        p.dot(d.x1, d.x2, {
          r: 4.2,
          color: d.y === 0 ? '#3b82f6' : '#f59e0b',
          ring: col.surface,
          ringWidth: 1.5
        });
      });

      drawWeightBars(p);

      elW.innerHTML = 'weights: <b>(' + w[0].toFixed(2) + ', ' + w[1].toFixed(2) + ')</b>';
      elAcc.innerHTML = 'accuracy: <b>' + Math.round(accuracy() * 100) + '%</b>';
    }
  });

  document.getElementById('reg-type').addEventListener('change', function (e) {
    st.type = e.target.value;
    retrain();
  });
  slider.addEventListener('input', function () {
    st.lam = lambdaFromSlider();
    elLam.textContent = st.lam.toFixed(3);
    retrain();
  });

  st.lam = lambdaFromSlider();
  elLam.textContent = st.lam.toFixed(3);

  // first run: train instantly so the figure is complete when reached
  var rnd0 = mulberry32(7);
  st.w = [(rnd0() - 0.5), (rnd0() - 0.5)];
  for (var k = 0; k < 700; k++) oneIter(0.5);
  plot.render();
})();
