/* Demo A — Bayes chaining: prior -> after one positive test -> after two */
(function () {
  'use strict';
  var cv = document.getElementById('cv-nb-bayes');
  if (!cv || typeof Plot === 'undefined') return;

  var prevSlider = document.getElementById('nb-prev');
  var accSlider = document.getElementById('nb-acc');
  var elOut = document.getElementById('nb-bayes-out');

  var state = { prev: 0.01, acc: 0.95 };

  function posterior(prior, acc) {
    var tp = acc * prior;
    var fp = (1 - acc) * (1 - prior);
    return tp + fp === 0 ? 0 : tp / (tp + fp);
  }

  function rgba(hex, a) {
    var n = parseInt(hex.slice(1), 16);
    return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' +
           (n & 255) + ',' + a + ')';
  }

  var plot = new Plot(cv, {
    range: { xmin: 0, xmax: 1, ymin: 0, ymax: 4 },
    height: 280,
    draw: function (p) {
      var col = p.colors;
      var p1 = posterior(state.prev, state.acc);
      var p2 = posterior(p1, state.acc);

      var rows = [
        { y0: 2.75, y1: 3.45, v: state.prev, color: col.axis,
          label: 'Before any test (the prior)' },
        { y0: 1.65, y1: 2.35, v: p1, color: col.accent,
          label: 'After 1st positive test' },
        { y0: 0.55, y1: 1.25, v: p2, color: col.good,
          label: 'After 2nd positive test' }
      ];

      rows.forEach(function (r) {
        p.text(r.label, 0, r.y1 + 0.2, {
          color: col.fg, font: '600 12.5px system-ui, sans-serif'
        });
        p.cell(0, 1, r.y0, r.y1, col.fg, 0.07);            // track
        if (r.v > 0.004) p.cell(0, r.v, r.y0, r.y1, r.color, 0.9);
        var pct = (r.v * 100) < 1 && r.v > 0 ? r.v * 100 : Math.round(r.v * 100);
        var label = (typeof pct === 'number' && pct < 1 && pct > 0)
          ? pct.toFixed(1) + '%' : Math.round(r.v * 100) + '%';
        p.text(label, Math.min(r.v + 0.02, 0.93), (r.y0 + r.y1) / 2, {
          color: col.fg, font: '700 13px system-ui, sans-serif',
          bg: r.v > 0.93 ? col.surface : null
        });
      });

      // 50% guide
      p.vline(0.5, { color: rgba(col.fg, 0.35), width: 1.4, dash: [5, 4] });
      p.text('50%', 0.5, 0.3, { align: 'center', color: rgba(col.fg, 0.7), font: '11px system-ui, sans-serif' });

      elOut.innerHTML = 'prior <b>' + fmt(state.prev) + '</b> → 1st <b>' +
        fmt(p1) + '</b> → 2nd <b>' + fmt(p2) + '</b>';
    }
  });

  function fmt(v) {
    if (v < 0.001) return '<0.1%';
    return (v * 100).toFixed(v < 0.1 ? 1 : 0) + '%';
  }

  prevSlider.addEventListener('input', function () {
    state.prev = Number(prevSlider.value) / 100;
    plot.render();
  });
  accSlider.addEventListener('input', function () {
    state.acc = Number(accSlider.value) / 100;
    plot.render();
  });
})();
