/* Demo A — the query point and its nearest neighbors (distance ranking) */
(function () {
  'use strict';
  var cv = document.getElementById('cv-knn-nbr');
  if (!cv || typeof Plot === 'undefined') return;

  function gen() {
    var rnd = mulberry32(23), pts = [];
    for (var i = 0; i < 17; i++) {
      pts.push({ x: 3.1 + gauss(rnd) * 1.5, y: 6.5 + gauss(rnd) * 1.5, c: 0 });
    }
    for (var j = 0; j < 17; j++) {
      pts.push({ x: 6.9 + gauss(rnd) * 1.5, y: 3.3 + gauss(rnd) * 1.5, c: 1 });
    }
    return pts;
  }

  var K = 5;
  var DEF = { x: 5, y: 5 };
  var state = { pts: gen(), q: { x: DEF.x, y: DEF.y } };

  var elVote = document.getElementById('knnnbr-vote');
  var elDist = document.getElementById('knnnbr-dist');

  function rgba(hex, a) {
    var n = parseInt(hex.slice(1), 16);
    return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' +
           (n & 255) + ',' + a + ')';
  }

  function nearest(q, pts, k) {
    return pts
      .map(function (p) { return { p: p, d: Math.hypot(p.x - q.x, p.y - q.y) }; })
      .sort(function (a, b) { return a.d - b.d; })
      .slice(0, k);
  }

  var plot = new Plot(cv, {
    range: { xmin: 0, xmax: 10, ymin: 0, ymax: 10 },
    height: 340,
    xlabel: 'feature 1',
    ylabel: 'feature 2',
    draw: function (p) {
      var col = p.colors;
      p.axes();

      var nbrs = nearest(state.q, state.pts, K);
      var nearSet = new Set(nbrs.map(function (n) { return n.p; }));
      var votes = [0, 0];
      nbrs.forEach(function (n) { votes[n.p.c]++; });

      // faint distance lines to every point
      state.pts.forEach(function (pt) {
        p.line([[state.q.x, state.q.y], [pt.x, pt.y]], { color: rgba(col.fg, 0.16), width: 1 });
      });

      // strong lines to the k nearest
      nbrs.forEach(function (n) {
        p.line([[state.q.x, state.q.y], [n.p.x, n.p.y]], {
          color: n.p.c === 0 ? col.accent : col.accent2, width: 2.4
        });
      });

      // data points
      state.pts.forEach(function (pt) {
        p.dot(pt.x, pt.y, {
          r: nearSet.has(pt) ? 6 : 4.8,
          color: pt.c === 0 ? col.accent : col.accent2,
          ring: nearSet.has(pt) ? col.surface : col.surface,
          ringWidth: nearSet.has(pt) ? 2.4 : 1.4
        });
      });

      // the query point
      p.dot(state.q.x, state.q.y, { r: 7, color: col.surface, ring: col.fg, ringWidth: 2.6 });
      p.text('you', state.q.x, state.q.y + 0.62, {
        align: 'center', color: col.fg, font: '600 12px system-ui, sans-serif'
      });

      var winner = votes[0] > votes[1] ? 0 : 1;
      p.badge([
        K + ' nearest vote:',
        (winner === 0 ? 'blue' : 'red') + ' wins ' +
          Math.max(votes[0], votes[1]) + '–' + Math.min(votes[0], votes[1])
      ], state.q.x, state.q.y);

      elVote.innerHTML = 'vote → <b>' + (winner === 0 ? 'blue' : 'red') + '</b> (' +
        votes[0] + ' vs ' + votes[1] + ')';
      elDist.innerHTML = 'distances: <b>' +
        nbrs.map(function (n) { return n.d.toFixed(2); }).join(' · ') + '</b>';
    }
  });

  cv.addEventListener('pointermove', function (e) {
    var d = plot.pxToData(e.clientX - cv.getBoundingClientRect().left,
                          e.clientY - cv.getBoundingClientRect().top);
    state.q = { x: Math.min(9.7, Math.max(0.3, d.x)),
                y: Math.min(9.7, Math.max(0.3, d.y)) };
    plot.render();
  });
  cv.addEventListener('pointerleave', function () {
    state.q = { x: DEF.x, y: DEF.y };
    plot.render();
  });
})();
