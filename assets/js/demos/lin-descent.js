/* Demo 3 — gradient descent on (slope, intercept) space */
(function () {
  'use strict';
  var cv = document.getElementById('cv-lindescent');
  if (!cv || typeof Plot === 'undefined') return;

  // data: a noisy straight line, y = 1.3x + 2
  var data = (function () {
    var rnd = mulberry32(5), pts = [];
    for (var i = 0; i < 14; i++) {
      var x = 0.5 + rnd() * 9.5;
      pts.push({ x: x, y: 1.3 * x + 2 + gauss(rnd) * 2 });
    }
    return pts;
  })();

  var M0 = -1.5, M1 = 4, B0 = -8, B1 = 12;   // view window in (slope, intercept)

  function lossAt(m, b) {
    var s = 0;
    for (var i = 0; i < data.length; i++) {
      var e = m * data[i].x + b - data[i].y;
      s += e * e;
    }
    return s / data.length;
  }
  function gradAt(m, b) {
    var gm = 0, gb = 0;
    for (var i = 0; i < data.length; i++) {
      var e = m * data[i].x + b - data[i].y;
      gm += e * data[i].x;
      gb += e;
    }
    return [2 * gm / data.length, 2 * gb / data.length];
  }

  // loss landscape grid
  var N = 60, grid = [], lmin = Infinity, lmax = -Infinity, i, j;
  for (i = 0; i < N; i++) {
    grid[i] = [];
    for (j = 0; j < N; j++) {
      var v = lossAt(M0 + (M1 - M0) * i / (N - 1), B0 + (B1 - B0) * j / (N - 1));
      grid[i][j] = v;
      if (v < lmin) lmin = v;
      if (v > lmax) lmax = v;
    }
  }
  var lcap = lmin + (lmax - lmin) * 0.55;

  function cssVarRGB(name, fb) {
    var s = getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fb;
    var m = s.match(/^#?([0-9a-f]{6})$/i);
    if (m) { var n = parseInt(m[1], 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
    return fb;
  }

  var seed = 11;
  var st = { m: 0, b: 0, path: [], iter: 0, playing: false, lr: 0.005 };

  function currentLR() {
    var v = Number(document.getElementById('lindes-lr').value);
    return 0.0005 * Math.pow(40, v / 100);   // 0.0005 … 0.02
  }

  function reset() {
    seed += 1;
    var rnd = mulberry32(seed * 613);
    st.m = -1 + rnd() * 4.4;
    st.b = -6 + rnd() * 15;
    st.path = [[st.m, st.b]];
    st.iter = 0;
    plot.render();
  }

  function step() {
    var g = gradAt(st.m, st.b);
    st.m -= st.lr * g[0];
    st.b -= st.lr * g[1];
    st.iter++;
    st.path.push([st.m, st.b]);
    return Math.hypot(g[0], g[1]);
  }

  var elInfo = document.getElementById('lindes-info');
  var elEq = document.getElementById('lindes-eq');
  var btnPlay = document.getElementById('lindes-play');

  function info() {
    elInfo.innerHTML = 'iter <b>' + st.iter + '</b> · MSE <b>' +
      lossAt(st.m, st.b).toFixed(4) + '</b> · η <b>' + st.lr.toFixed(4) + '</b>';
    elEq.innerHTML = 'ŷ = <b>' + st.m.toFixed(2) + '</b>x ' +
      (st.b < 0 ? '− ' : '+ ') + Math.abs(st.b).toFixed(2);
  }

  var plot = new Plot(cv, {
    range: { xmin: M0, xmax: M1, ymin: B0, ymax: B1 },
    height: 400,
    xlabel: 'slope (weight w)',
    ylabel: 'intercept (bias b)',
    draw: function (p) {
      var col = p.colors;
      var low = cssVarRGB('--plot-low', '#1d4ed8');
      var high = cssVarRGB('--plot-high', '#e7efff');
      var stepX = (M1 - M0) / N, stepY = (B1 - B0) / N;

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
          p.cell(M0 + a * stepX, M0 + (a + 1) * stepX,
                 B0 + b * stepY, B0 + (b + 1) * stepY,
                 'rgb(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ')');
        }
      }

      p.axes();

      if (st.path.length > 1) {
        p.line(st.path, { color: col.surface, width: 5 });
        p.line(st.path, { color: col.fg, width: 2 });
      }
      st.path.forEach(function (q, idx) {
        if (idx % 5 === 0) p.dot(q[0], q[1], { r: 2.6, color: col.fg, ring: false });
      });
      p.dot(st.m, st.b, { r: 6, color: col.accent2, ring: col.surface, ringWidth: 2.5 });

      // the true line lives at slope 1.3, intercept 2 — mark the bullseye
      p.dot(1.3, 2, { r: 5, color: col.good, ring: col.surface, ringWidth: 2 });
      p.text('best line', 1.3, 2, { color: col.good, base: 'bottom', align: 'center' });

      info();
    }
  });

  btnPlay.addEventListener('click', function () {
    st.playing = !st.playing;
    btnPlay.textContent = st.playing ? '❚❚ Pause' : '▶ Play';
    btnPlay.setAttribute('aria-pressed', String(st.playing));
    if (st.playing) loop();
  });
  document.getElementById('lindes-step').addEventListener('click', function () {
    st.playing = false;
    btnPlay.textContent = '▶ Play';
    btnPlay.setAttribute('aria-pressed', 'false');
    step();
    plot.render();
  });
  document.getElementById('lindes-reset').addEventListener('click', function () {
    st.playing = false;
    btnPlay.textContent = '▶ Play';
    btnPlay.setAttribute('aria-pressed', 'false');
    reset();
  });
  document.getElementById('lindes-lr').addEventListener('input', function () {
    st.lr = currentLR();
    info();
  });

  function loop() {
    if (!st.playing) return;
    var gn = 0;
    for (var m = 0; m < 2 && st.iter < 1200; m++) gn = step();
    plot.render();
    if (gn < 1e-3 || st.iter >= 1200) {
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
