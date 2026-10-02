/* Demo 4 — log loss vs squared error, and the "push" each one gives */
(function () {
  'use strict';
  var cv = document.getElementById('cv-loss');
  if (!cv || typeof Plot === 'undefined') return;

  var y = 1;                 // the true label being graded
  var showPush = false;
  var read = document.getElementById('loss-read');
  var btn = document.getElementById('loss-slope');
  var sel = document.getElementById('loss-y');

  function clampP(p) { return Math.min(Math.max(p, 1e-6), 1 - 1e-6); }

  function costLog(p) {
    p = clampP(p);
    return -(y * Math.log(p) + (1 - y) * Math.log(1 - p));
  }
  function costMse(p) { return (p - y) * (p - y); }

  // How strongly each loss pushes the model's raw score z (this is the gradient).
  function pushLog(p) { return p - y; }
  function pushMse(p) { return 2 * (p - y) * p * (1 - p); }

  function fmt(v) { return (v > 0 ? '+' : '') + v.toFixed(3); }

  function drawArrow(p, x, y, dx, color) {
    if (Math.abs(dx) < 0.004) return;
    var c = p.ctx;
    var x0 = p.xToPx(x), y0 = p.yToPx(y), x1 = p.xToPx(x + dx);
    var dir = dx > 0 ? 1 : -1;
    c.save();
    c.strokeStyle = color;
    c.fillStyle = color;
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(x0, y0);
    c.lineTo(x1, y0);
    c.stroke();
    c.beginPath();
    c.moveTo(x1, y0);
    c.lineTo(x1 - dir * 7, y0 - 4.5);
    c.lineTo(x1 - dir * 7, y0 + 4.5);
    c.closePath();
    c.fill();
    c.restore();
  }

  var plot = new Plot(cv, {
    range: { xmin: 0, xmax: 1, ymin: 0, ymax: 4.4 },
    height: 330,
    xlabel: 'probability the model predicts for the true label',
    ylabel: 'cost charged',
    draw: function (p) {
      var col = p.colors;
      p.axes();

      p.fnLine(costMse, { color: col.accent2, width: 2.4, samples: 320 }, 0.004, 0.996);
      p.fnLine(costLog, { color: col.accent, width: 2.6, samples: 320 }, 0.004, 0.996);

      p.text('log loss (ours)', 0.62, Math.min(costLog(0.62), 4.1), { color: col.accent, base: 'bottom' });
      p.text('squared error', 0.3, costMse(0.3) + 0.28, { color: col.accent2, base: 'bottom' });

      var ptr = p.pointer && p.pointer.inside ? p.pointer : { x: 0.5, y: 0 };
      var pc = Math.min(Math.max(ptr.x, 0.004), 0.996);

      if (showPush) {
        // arrows show the size and direction of the learning push at this point
        drawArrow(p, pc, costLog(pc), -pushLog(pc) * 0.22, col.accent);
        drawArrow(p, pc, costMse(pc), -pushMse(pc) * 0.22, col.accent2);
      }

      p.vline(pc, { color: col.axis, width: 1, dash: [3, 4] });
      p.dot(pc, costMse(pc), { r: 4.5, color: col.accent2, ring: col.surface });
      p.dot(pc, costLog(pc), { r: 4.5, color: col.accent, ring: col.surface });

      p.badge([
        'p = ' + pc.toFixed(2) + ' (truth: y = ' + y + ')',
        'log loss: ' + costLog(pc).toFixed(3) + (showPush ? '   push: ' + fmt(pushLog(pc)) : ''),
        'squared:  ' + costMse(pc).toFixed(3) + (showPush ? '   push: ' + fmt(pushMse(pc)) : '')
      ], pc, costLog(pc));
    }
  });

  function updateRead() {
    var p = plot.pointer;
    if (!p || !p.inside) { read.innerHTML = 'hover to compare →'; return; }
    var pc = Math.min(Math.max(p.x, 0.004), 0.996);
    read.innerHTML = 'p = <b>' + pc.toFixed(2) + '</b> · log <b>' + costLog(pc).toFixed(2) +
      '</b> vs squared <b>' + costMse(pc).toFixed(2) + '</b>' +
      (showPush ? ' · push <b>' + fmt(pushLog(pc)) + '</b> vs <b>' + fmt(pushMse(pc)) + '</b>' : '');
  }

  cv.addEventListener('pointermove', updateRead);
  cv.addEventListener('pointerleave', function () { read.innerHTML = 'hover to compare →'; });

  sel.addEventListener('change', function (e) { y = Number(e.target.value); plot.render(); updateRead(); });

  btn.addEventListener('click', function () {
    showPush = !showPush;
    btn.setAttribute('aria-pressed', String(showPush));
    btn.textContent = showPush ? 'Hide learning push' : 'Show learning push';
    plot.render();
    updateRead();
  });
})();
