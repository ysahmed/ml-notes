/* Demo 5 — gradient descent animated on a 2D loss surface */
(function () {
  'use strict';
  var cv = document.getElementById('cv-descent');
  if (!cv || typeof Plot === 'undefined') return;

  var sig = function (z) { return 1 / (1 + Math.exp(-z)); };

  // data: two blobs centered on the origin (so the bias can stay at 0)
  var data = (function () {
    var rnd = mulberry32(5), pts = [], i;
    for (i = 0; i < 50; i++) pts.push({ x1: -1.6 + gauss(rnd), x2: -1.6 + gauss(rnd), y: 0 });
    for (i = 0; i < 50; i++) pts.push({ x1: 1.6 + gauss(rnd), x2: 1.6 + gauss(rnd), y: 1 });
    return pts;
  })();

  function lossAt(w1, w2) {
    var s = 0;
    for (var i = 0; i < data.length; i++) {
      var z = w1 * data[i].x1 + w2 * data[i].x2;
      s += Math.log(1 + Math.exp(z)) - data[i].y * z;   // numerically safe log loss
    }
    return s / data.length;
  }
  function gradAt(w1, w2) {
    var g1 = 0, g2 = 0;
    for (var i = 0; i < data.length; i++) {
      var e = sig(w1 * data[i].x1 + w2 * data[i].x2) - data[i].y;
      g1 += e * data[i].x1;
      g2 += e * data[i].x2;
    }
    return [g1 / data.length, g2 / data.length];
  }

  // ---- pre-computed loss landscape (60 x 60 grid over [-6, 6]) ----
  var N = 60, LO = -6, HI = 6;
  var grid = [], lmin = Infinity, lmax = -Infinity, i, j;
  for (i = 0; i < N; i++) {
    grid[i] = [];
    for (j = 0; j < N; j++) {
      var v = lossAt(LO + (HI - LO) * i / (N - 1), LO + (HI - LO) * j / (N - 1));
      grid[i][j] = v;
      if (v < lmin) lmin = v;
      if (v > lmax) lmax = v;
    }
  }
  var lcap = lmin + (lmax - lmin) * 0.55;   // stretch contrast near the valley

  function cssVarRGB(name, fb) {
    var s = getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fb;
    var m = s.match(/^#?([0-9a-f]{6})$/i);
    if (m) {
      var n = parseInt(m[1], 16);
      return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    }
    return fb;
  }

  // ---- state ----
  var seed = 3;
  var st = { w: [0, 0], path: [], iter: 0, playing: false, lr: 0.17 };

  function currentLR() {
    var v = Number(document.getElementById('des-lr').value);
    return 0.05 * Math.pow(40, v / 100);   // 0.05 … 2.0
  }

  function reset() {
    seed += 1;
    var rnd = mulberry32(seed * 977);
    st.w = [(rnd() - 0.5) * 11, (rnd() - 0.5) * 11];
    st.path = [st.w.slice()];
    st.iter = 0;
    plot.render();
  }

  function step() {
    var g = gradAt(st.w[0], st.w[1]);
    st.w[0] -= st.lr * g[0];
    st.w[1] -= st.lr * g[1];
    st.iter++;
    st.path.push(st.w.slice());
    return Math.hypot(g[0], g[1]);
  }

  var elInfo = document.getElementById('des-info');
  var btnPlay = document.getElementById('des-play');

  function info() {
    elInfo.innerHTML = 'iter <b>' + st.iter + '</b> · cost <b>' +
      lossAt(st.w[0], st.w[1]).toFixed(4) + '</b> · η <b>' + st.lr.toFixed(2) + '</b>';
  }

  var plot = new Plot(cv, {
    range: { xmin: LO, xmax: HI, ymin: LO, ymax: HI },
    height: 400,
    xlabel: 'weight w₁',
    ylabel: 'weight w₂',
    draw: function (p) {
      var col = p.colors;
      var low = cssVarRGB('--plot-low', '#1d4ed8');
      var high = cssVarRGB('--plot-high', '#e7efff');

      // loss landscape as a heatmap (saturated = cheap valley)
      var stepX = (HI - LO) / N, stepY = (HI - LO) / N;
      for (var a = 0; a < N; a++) {
        for (var b = 0; b < N; b++) {
          var t = (grid[a][b] - lmin) / (lcap - lmin);
          if (t > 1) t = 1;
          t = Math.pow(t, 0.85);
          var rgb = [
            Math.round(low[0] + (high[0] - low[0]) * t),
            Math.round(low[1] + (high[1] - low[1]) * t),
            Math.round(low[2] + (high[2] - low[2]) * t)
          ];
          p.cell(LO + a * stepX, LO + (a + 1) * stepX,
                 LO + b * stepY, LO + (b + 1) * stepY,
                 'rgb(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ')');
        }
      }

      p.axes();

      // the path taken: dark core with a light halo so it reads on any shade
      if (st.path.length > 1) {
        p.line(st.path, { color: col.surface, width: 5 });
        p.line(st.path, { color: col.fg, width: 2 });
      }
      st.path.forEach(function (q, idx) {
        if (idx % 5 === 0) p.dot(q[0], q[1], { r: 2.6, color: col.fg, ring: false });
      });
      p.dot(st.w[0], st.w[1], { r: 6, color: col.accent2, ring: col.surface, ringWidth: 2.5 });

      p.text('the valley', 0.6, 0.6, { color: col.fg, align: 'center', bg: col.surface });
      info();
    }
  });

  // ---- controls ----
  btnPlay.addEventListener('click', function () {
    st.playing = !st.playing;
    btnPlay.textContent = st.playing ? '❚❚ Pause' : '▶ Play';
    btnPlay.setAttribute('aria-pressed', String(st.playing));
    if (st.playing) loop();
  });
  document.getElementById('des-step').addEventListener('click', function () {
    st.playing = false;
    btnPlay.textContent = '▶ Play';
    btnPlay.setAttribute('aria-pressed', 'false');
    step();
    plot.render();
  });
  document.getElementById('des-reset').addEventListener('click', function () {
    st.playing = false;
    btnPlay.textContent = '▶ Play';
    btnPlay.setAttribute('aria-pressed', 'false');
    reset();
  });
  document.getElementById('des-lr').addEventListener('input', function () {
    st.lr = currentLR();
    info();
  });

  function loop() {
    if (!st.playing) return;
    var gn = 0;
    for (var m = 0; m < 2 && st.iter < 900; m++) gn = step();
    plot.render();
    if (gn < 2e-3 || st.iter >= 900) {
      st.playing = false;
      btnPlay.textContent = '▶ Play';
      btnPlay.setAttribute('aria-pressed', 'false');
      return;
    }
    requestAnimationFrame(loop);
  }

  st.lr = currentLR();
  reset();
})();
