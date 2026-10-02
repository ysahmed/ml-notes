/* Demo C — the same data, raw vs scaled features (units decide distances) */
(function () {
  'use strict';
  var cv = document.getElementById('cv-knn-scl');
  if (!cv || typeof Plot === 'undefined') return;

  // size in sq ft (300–2400) and age in years (1–30); both features matter
  // for the label, but size's raw numbers are ~70× bigger.
  function gen() {
    var rnd = mulberry32(41), pts = [];
    for (var i = 0; i < 140; i++) {
      var size = 300 + rnd() * 2100;
      var age = 1 + rnd() * 29;
      // steep in size, gentle in age -> one crisp cut by size when unscaled
      var t = 2 * ((size - 300) / 2100) + 0.4 * ((30 - age) / 29);
      pts.push({ x: size, y: age, c: t + gauss(rnd) * 0.14 > 1.05 ? 1 : 0 });
    }
    return pts;
  }

  var RAW = { xmin: 200, xmax: 2500, ymin: 0, ymax: 31 };
  var SCALED = { xmin: 0, xmax: 1, ymin: 0, ymax: 1 };
  var K = 5;
  var state = { pts: gen(), scaled: false, q: { x: 1300, y: 15 } };

  var elRaw = document.getElementById('knnscale-raw');
  var elScl = document.getElementById('knnscale-scaled');
  var elInfo = document.getElementById('knnscale-info');

  function rgba(hex, a) {
    var n = parseInt(hex.slice(1), 16);
    return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' +
           (n & 255) + ',' + a + ')';
  }

  // map a raw point into the space currently on screen
  function show(pt) {
    if (!state.scaled) return pt;
    return { x: (pt.x - 300) / 2100, y: (pt.y - 0) / 30, c: pt.c };
  }
  function toRaw(q) {
    if (!state.scaled) return q;
    return { x: 300 + q.x * 2100, y: q.y * 30 };
  }

  function neighbors(qRaw, k) {
    var sx = state.scaled ? 1 / 2100 : 1, sy = state.scaled ? 1 / 30 : 1;
    return state.pts
      .map(function (p) {
        var dx = (p.x - qRaw.x) * sx, dy = (p.y - qRaw.y) * sy;
        return { p: p, d2: dx * dx + dy * dy };
      })
      .sort(function (a, b) { return a.d2 - b.d2; })
      .slice(0, k);
  }

  var plot = new Plot(cv, {
    range: Object.assign({}, RAW),
    height: 360,
    xlabel: 'size (sq ft)',
    ylabel: 'age (years)',
    draw: function (p) {
      var col = p.colors;
      var k = K;

      // boundary under the current metric
      var G = 40, stepX = (p.range.xmax - p.range.xmin) / G, stepY = (p.range.ymax - p.range.ymin) / G;
      for (var i = 0; i < G; i++) {
        for (var j = 0; j < G; j++) {
          var cellQ = toRaw({ x: p.range.xmin + (i + 0.5) * stepX,
                              y: p.range.ymin + (j + 0.5) * stepY });
          var nbrs = neighbors(cellQ, k), v = [0, 0];
          nbrs.forEach(function (n) { v[n.p.c]++; });
          p.cell(p.range.xmin + i * stepX, p.range.xmin + (i + 1) * stepX,
                 p.range.ymin + j * stepY, p.range.ymin + (j + 1) * stepY,
                 v[0] > v[1] ? col.accent : col.accent2, 0.11);
        }
      }

      p.axes();

      var nbrs = neighbors(state.q, k);
      var nearSet = new Set(nbrs.map(function (n) { return n.p; }));

      // distance lines to the k nearest (in the current metric)
      var qS = show(state.q);
      nbrs.forEach(function (n) {
        var s = show(n.p);
        p.line([[qS.x, qS.y], [s.x, s.y]],
          { color: n.p.c === 0 ? col.accent : col.accent2, width: 2.3 });
      });

      state.pts.forEach(function (pt) {
        var s = show(pt);
        p.dot(s.x, s.y, {
          r: nearSet.has(pt) ? 6.2 : 4.6,
          color: pt.c === 0 ? col.accent : col.accent2,
          ring: col.surface, ringWidth: nearSet.has(pt) ? 2.3 : 1.3
        });
      });

      p.dot(qS.x, qS.y, { r: 7, color: col.surface, ring: col.fg, ringWidth: 2.6 });

      // how much each feature contributes to distance — measured over ALL
      // points, so the number is stable no matter where the query sits
      var sSum = 0, aSum = 0;
      var sc = state.scaled ? 1 / 2100 : 1, sa = state.scaled ? 1 / 30 : 1;
      state.pts.forEach(function (pt) {
        var dx = (pt.x - state.q.x) * sc, dy = (pt.y - state.q.y) * sa;
        sSum += dx * dx;
        aSum += dy * dy;
      });
      var tot = sSum + aSum || 1;
      elInfo.innerHTML = 'every distance is <b>' + Math.round(100 * sSum / tot) +
        '% size</b> · <b>' + Math.round(100 * aSum / tot) + '% age</b>';
    }
  });

  function setMode(scaled) {
    state.scaled = scaled;
    elRaw.setAttribute('aria-pressed', String(!scaled));
    elScl.setAttribute('aria-pressed', String(scaled));
    plot.setRange(Object.assign({}, scaled ? SCALED : RAW));
    plot.o.xlabel = scaled ? 'size (scaled 0–1)' : 'size (sq ft)';
    plot.o.ylabel = scaled ? 'age (scaled 0–1)' : 'age (years)';
    plot.render();
  }

  cv.addEventListener('pointermove', function (e) {
    var d = plot.pxToData(e.clientX - cv.getBoundingClientRect().left,
                          e.clientY - cv.getBoundingClientRect().top);
    var r = toRaw(d);
    state.q = { x: Math.min(2450, Math.max(250, r.x)), y: Math.min(30, Math.max(0.5, r.y)) };
    plot.render();
  });
  cv.addEventListener('pointerleave', function () {
    state.q = { x: 1300, y: 15 };
    plot.render();
  });

  elRaw.addEventListener('click', function () { setMode(false); });
  elScl.addEventListener('click', function () { setMode(true); });
})();
