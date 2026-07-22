/**
 * viz-common.js — shared 3D-prediction viewer constants.
 *
 * Extracted (milestone9.x dedup) from the previously-triplicated copies in
 * benchmark.html (EVAL3D_CHANNELS), explorer.html (EVAL_CHANNELS) and
 * analysis.html (CHS), which were byte-identical apart from a trailing comma.
 * Loaded as a plain <script> BEFORE each page's inline script, so these globals
 * are available to every render function. Pages keep their local alias names
 * (const EVAL_CHANNELS = EVAL3D_CHANNELS; const CHS = EVAL3D_CHANNELS;) so the
 * existing call sites stay unchanged.
 *
 * NOTE: the per-page colormap helpers (turboColormap / infernoColormap / colorByField)
 * and the .bin path builders are intentionally NOT consolidated here yet —
 * benchmark.html defines the colormaps twice with different return scales (8-bit
 * vs float [0,1]), so merging them needs a per-call-site scale audit + visual
 * verification in a browser. Left as a follow-up.
 */

// ── 3D Pred Channel Config ──
// Keyed by split dataset id → { bin_target_key → channels }. The bin target_key is the
// fine-grained token (load case / mode shape / coupled variant) the bins are stored
// under — NOT the summary `Target Key` (a coupled label like displacement+stress that
// cannot distinguish mode_shape_1/2). Viewer groups derive the token from these keys.
const EVAL3D_CHANNELS = {
  'deepjeb_3d_2d_vertical':   { 'vertical':   ['displacement_x', 'displacement_y', 'displacement_z', 'stress'] },
  'deepjeb_3d_2d_horizontal': { 'horizontal': ['displacement_x', 'displacement_y', 'displacement_z', 'stress'] },
  'deepjeb_3d_2d_diagonal':   { 'diagonal':   ['displacement_x', 'displacement_y', 'displacement_z', 'stress'] },
  'deepjeb_3d_2d_torsion':    { 'torsion':    ['displacement_x', 'displacement_y', 'displacement_z', 'stress'] },
  'deepjeb_3d_2d_modal':      { 'mode_shape_1': ['mode_x', 'mode_y', 'mode_z'],
                                'mode_shape_2': ['mode_x', 'mode_y', 'mode_z'] },
  'drivaernet_3d_2d_centerplane': { 'pv_coupled': ['pressure', 'velocity_x', 'velocity_y', 'velocity_z'] },
  'drivaerml_3d_2d_surface':  { 'pwss_coupled': ['pressure', 'wss_x', 'wss_y', 'wss_z'] },
  'drivaerml_3d_3d_volume':   { 'volume_coupled': ['totalpcoeff', 'velocity_x', 'velocity_y', 'velocity_z',
                                                   'vorticity_x', 'vorticity_y', 'vorticity_z'] },
  'drivaernet_3d_2d_surface': { 'body_pressure': ['body_pressure'] },
};

// ── Shared 3D-viewer camera elevation (one knob for every point-cloud viewer) ──
// All generation/prediction point-cloud viewers across benchmark/explorer/analysis
// look slightly DOWN at the cloud from this elevation above the horizon. Tuned
// between the old near-horizon angle (~7°) and a steeper 30° three-quarter — 18°
// is the readable middle. Each camera keeps its azimuth and its target distance;
// only the elevation changes, so framing/fill is unchanged. Change VIEW_ELEV_DEG
// here and every viewer (incl. centerplane/wake/volume + scalar previews) follows.
const VIEW_ELEV_DEG = 18;
const VIEW_ELEV_SIN = Math.sin(VIEW_ELEV_DEG * Math.PI / 180); // ≈ 0.309 — vertical = dist·SIN
const VIEW_ELEV_COS = Math.cos(VIEW_ELEV_DEG * Math.PI / 180); // ≈ 0.951 — horizontal-back = dist·COS

// Re-aim an original camera-offset vector (vx,vy,vz) to VIEW_ELEV_DEG elevation,
// preserving its magnitude and its x:z azimuth (heading), then scale by `s`
// (default 1). Returns the {x,y,z} offset to add to the target. Used by the
// generation viewers, which frame via a fixed direction vector × a scale factor.
function viewCamVec(vx, vy, vz, s) {
  s = (s == null) ? 1 : s;
  const dist = Math.hypot(vx, vy, vz);
  const h = Math.hypot(vx, vz) || 1;
  const horiz = dist * VIEW_ELEV_COS;
  return { x: s * horiz * vx / h, y: s * dist * VIEW_ELEV_SIN, z: s * horiz * vz / h };
}

// Size → bucket code for the 3D viewer breadcrumb/path (prediction range 20/50/100/200).
function getEval3DSizeCode(size) {
  const sizeMap = { '20': 'S', '50': 'M', '100': 'L', '200': 'XL' };
  return sizeMap[String(size)] || String(size);
}

// ── 1D scalar-prediction "calibration ribbon" (shared by benchmark / explorer / analysis) ──
// 1D scalar prediction (tabular concrete/airfoil + timeseries CMAPSS RUL) has no per-sample
// geometry, so every page shows the SAME view: test samples sorted by ground truth (a monotone
// GT reference line) with model predictions overlaid as points — deviation off the line = error.
// RUL sorts descending (high→low RUL reads as a degradation timeline); tabular ascending.
// Built from the published JSON shape targets[tk].{pred,gt}. Pages own their Chart registry +
// R²/MAE labels; this just returns the Chart instance so cleanup stays page-local.

// R² + MAE from raw pred/gt arrays (robust if metrics block absent).
function scalar1DStats(gt, pred) {
  const n = Math.min(gt.length, pred.length);
  let mean = 0; for (let i = 0; i < n; i++) mean += gt[i]; mean /= (n || 1);
  let ssRes = 0, ssTot = 0, sumAbs = 0;
  for (let i = 0; i < n; i++) {
    const e = gt[i] - pred[i];
    ssRes += e * e; ssTot += (gt[i] - mean) ** 2; sumAbs += Math.abs(e);
  }
  return { r2: ssTot > 0 ? 1 - ssRes / ssTot : NaN, mae: sumAbs / (n || 1) };
}

// True when a dataset/target is the CMAPSS RUL task (→ degradation-timeline sort order).
function isRulTarget(dataset, targetKey) {
  return /cmapss/.test(dataset || '') || targetKey === 'rul';
}

// Linear-interpolated quantile of a pre-sorted array.
function _q(sorted, q) {
  if (!sorted.length) return NaN;
  const pos = (sorted.length - 1) * q, lo = Math.floor(pos), hi = Math.ceil(pos);
  return lo === hi ? sorted[lo] : sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo);
}

// Leaderboard-rank → colour on a green(best)→amber→red(worst) HSL ramp.
function rankColor(rank, total, alpha) {
  const t = total > 1 ? Math.max(0, Math.min(1, (rank - 1) / (total - 1))) : 0;  // 0 = best
  const hue = 150 - 150 * t;  // 150 green → 0 red
  return `hsla(${hue.toFixed(0)}, 78%, 58%, ${alpha == null ? 0.95 : alpha})`;
}

// Build a predicted-vs-actual (1:1) calibration Chart on `canvas`. x = ground truth,
// y = prediction, dashed y=x diagonal = perfect. Each series → a binned MEDIAN-prediction
// curve (equal-count GT bins): a curve riding the diagonal is accurate; one bending toward
// horizontal is regression-to-mean (weak). Overlaying many models (coloured by rank) shows
// the ranking story in one view; a single model can add raw points + a P25–P75 band.
//   opts.gt, opts.series:[{pred,color,label?}], opts.bins(24)
//   opts.points:bool (faint raw scatter — single-model detail), opts.band:bool (P25–P75)
//   opts.showLegend, opts.legendPosition, opts.xTitle, opts.yTitle, opts.yTickColor, opts.gridColor
function buildScalar1DCalib(canvas, opts) {
  const gt = opts.gt;
  const n = opts.series.reduce((m, s) => Math.min(m, s.pred.length), gt.length);

  // Square-ish value range over GT + all predictions so the diagonal is meaningful.
  let lo = Infinity, hi = -Infinity;
  const bump = v => { if (v < lo) lo = v; if (v > hi) hi = v; };
  for (let i = 0; i < n; i++) bump(gt[i]);
  opts.series.forEach(s => { for (let i = 0; i < n; i++) bump(s.pred[i]); });
  const pad = ((hi - lo) || 1) * 0.04, aMin = lo - pad, aMax = hi + pad;

  const order = Array.from({ length: n }, (_, i) => i).sort((a, b) => gt[a] - gt[b]);
  const nBins = Math.max(4, Math.min(opts.bins || 24, n));
  const soften = (c, a) => (typeof c === 'string' && c.startsWith('hsla')) ? c.replace(/[\d.]+\)$/, a + ')')
                         : (typeof c === 'string' && c.startsWith('rgba')) ? c.replace(/[\d.]+\)$/, a + ')') : c;

  const datasets = [];
  // Diagonal reference (drawn behind).
  datasets.push({ label: '_diag', type: 'line', data: [{ x: aMin, y: aMin }, { x: aMax, y: aMax }],
    borderColor: 'rgba(255,255,255,0.4)', borderDash: [5, 4], borderWidth: 1.2, pointRadius: 0, fill: false, order: 6 });

  const wantMedian = opts.median !== false;  // set median:false for a pure raw scatter
  opts.series.forEach(s => {
    if (opts.points) {
      datasets.push({ label: s.pointsLabel || '_pts', type: 'scatter', data: order.map(i => ({ x: gt[i], y: s.pred[i] })),
        backgroundColor: soften(s.color, '0.45'), borderColor: 'rgba(0,0,0,0)', pointRadius: 2, pointHoverRadius: 4, order: 4 });
    }
    if (!wantMedian && !opts.band) return;   // raw-scatter-only: skip binning
    const med = [], loB = [], hiB = [];
    for (let b = 0; b < nBins; b++) {
      const start = Math.floor(b * n / nBins), end = Math.floor((b + 1) * n / nBins);
      if (end <= start) continue;
      const idxs = order.slice(start, end);
      let gsum = 0; for (const i of idxs) gsum += gt[i];
      const gMid = gsum / idxs.length;
      const vals = idxs.map(i => s.pred[i]).sort((a, b) => a - b);
      med.push({ x: gMid, y: _q(vals, 0.5) });
      if (opts.band) { loB.push({ x: gMid, y: _q(vals, 0.25) }); hiB.push({ x: gMid, y: _q(vals, 0.75) }); }
    }
    if (opts.band) {
      datasets.push({ label: '_lo', type: 'line', data: loB, tension: 0.25, borderColor: 'rgba(0,0,0,0)', pointRadius: 0, fill: false, order: 3 });
      datasets.push({ label: '_band', type: 'line', data: hiB, tension: 0.25, borderColor: 'rgba(0,0,0,0)', backgroundColor: soften(s.color, '0.15'), pointRadius: 0, fill: '-1', order: 3 });
    }
    if (wantMedian) datasets.push({ label: s.label || 'prediction', type: 'line', data: med, tension: 0.25,
      borderColor: s.color, backgroundColor: s.color, borderWidth: 2, pointRadius: opts.points ? 0 : 2, pointHoverRadius: 4, fill: false, order: 2 });
  });

  const grid = opts.gridColor || 'rgba(255,255,255,0.05)';
  const tick = opts.yTickColor || 'rgba(255,255,255,0.4)';
  const axis = (title) => ({ type: 'linear', min: aMin, max: aMax,
    title: title ? { display: true, text: title, color: 'rgba(255,255,255,0.5)', font: { size: 10 } } : { display: false },
    ticks: { color: tick, maxTicksLimit: 6, font: { size: 9 } }, grid: { color: grid } });

  return new Chart(canvas.getContext('2d'), {
    type: 'line',
    data: { datasets },
    options: {
      maintainAspectRatio: false, responsive: true, animation: false, parsing: false,
      interaction: { mode: 'nearest', intersect: false },
      plugins: {
        legend: opts.showLegend
          ? { position: opts.legendPosition || 'right', labels: { color: 'rgba(255,255,255,0.7)', boxWidth: 8, font: { size: 10 }, filter: it => !String(it.text).startsWith('_') } }
          : { display: false },
        tooltip: {
          filter: it => !String(it.dataset.label || '').startsWith('_'),
          callbacks: { label: c => `${c.dataset.label}: pred ${c.parsed.y.toFixed(2)} @ gt ${c.parsed.x.toFixed(2)}` },
        },
      },
      scales: { x: axis(opts.xTitle), y: axis(opts.yTitle) },
    },
  });
}

// Residual scatter on `canvas` — x = ground truth, y = signed error (pred − GT), with a dashed
// zero line and a binned median-error trend. Naturally wide (unlike the square 1:1 plot), so it
// pairs beside the calibration scatter to fill a row and reveal where a model is biased
// (the trend drifting off zero) across the value range.
//   opts.gt, opts.pred, opts.color, opts.bins(20), opts.trend(true)
//   opts.xTitle, opts.yTitle, opts.yTickColor, opts.gridColor
function buildScalar1DResidualScatter(canvas, opts) {
  const gt = opts.gt, pred = opts.pred;
  const n = Math.min(gt.length, pred.length);
  const soften = (c, a) => (typeof c === 'string' && (c.startsWith('hsla') || c.startsWith('rgba'))) ? c.replace(/[\d.]+\)$/, a + ')') : c;

  let xlo = Infinity, xhi = -Infinity, rmax = 0;
  const pts = [];
  for (let i = 0; i < n; i++) {
    const e = pred[i] - gt[i];
    pts.push({ x: gt[i], y: e });
    if (gt[i] < xlo) xlo = gt[i]; if (gt[i] > xhi) xhi = gt[i];
    if (Math.abs(e) > rmax) rmax = Math.abs(e);
  }
  const xpad = ((xhi - xlo) || 1) * 0.04;
  rmax = (rmax || 1) * 1.08;  // symmetric range so the zero line sits centred

  const datasets = [];
  datasets.push({ label: '_zero', type: 'line', data: [{ x: xlo - xpad, y: 0 }, { x: xhi + xpad, y: 0 }],
    borderColor: 'rgba(255,255,255,0.4)', borderDash: [5, 4], borderWidth: 1.2, pointRadius: 0, fill: false, order: 5 });
  datasets.push({ label: '_res', type: 'scatter', data: pts,
    backgroundColor: soften(opts.color, '0.4'), borderColor: 'rgba(0,0,0,0)', pointRadius: 2, pointHoverRadius: 4, order: 3 });

  if (opts.trend !== false) {
    const order = Array.from({ length: n }, (_, i) => i).sort((a, b) => gt[a] - gt[b]);
    const nBins = Math.max(4, Math.min(opts.bins || 20, n));
    const med = [];
    for (let b = 0; b < nBins; b++) {
      const start = Math.floor(b * n / nBins), end = Math.floor((b + 1) * n / nBins);
      if (end <= start) continue;
      const idxs = order.slice(start, end);
      let g = 0; for (const i of idxs) g += gt[i];
      const vals = idxs.map(i => pred[i] - gt[i]).sort((a, b) => a - b);
      med.push({ x: g / idxs.length, y: _q(vals, 0.5) });
    }
    datasets.push({ label: '_trend', type: 'line', data: med, tension: 0.25,
      borderColor: opts.color, borderWidth: 2, pointRadius: 0, fill: false, order: 4 });
  }

  const grid = opts.gridColor || 'rgba(255,255,255,0.05)';
  const tick = opts.yTickColor || 'rgba(255,255,255,0.4)';
  const mkTitle = t => t ? { display: true, text: t, color: 'rgba(255,255,255,0.5)', font: { size: 10 } } : { display: false };

  return new Chart(canvas.getContext('2d'), {
    type: 'scatter',
    data: { datasets },
    options: {
      maintainAspectRatio: false, responsive: true, animation: false, parsing: false,
      interaction: { mode: 'nearest', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: { filter: it => !String(it.dataset.label || '').startsWith('_'),
          callbacks: { label: c => `error ${c.parsed.y.toFixed(2)} @ gt ${c.parsed.x.toFixed(2)}` } },
      },
      scales: {
        x: { type: 'linear', min: xlo - xpad, max: xhi + xpad, title: mkTitle(opts.xTitle),
             ticks: { color: tick, maxTicksLimit: 6, font: { size: 9 } }, grid: { color: grid } },
        y: { type: 'linear', min: -rmax, max: rmax, title: mkTitle(opts.yTitle),
             ticks: { color: tick, maxTicksLimit: 5, font: { size: 9 } }, grid: { color: grid } },
      },
    },
  });
}

// Residual histogram on `canvas` — distribution of signed error (pred − GT). Bars left of
// zero (under-prediction) are tinted blue, right (over-prediction) pink, so bias reads as a
// shift off-centre and variance as the spread. A symmetric, narrow peak at 0 = the ideal.
//   opts.gt, opts.pred, opts.bins(30), opts.xTitle, opts.yTitle, opts.gridColor
function buildScalar1DResidualHist(canvas, opts) {
  const gt = opts.gt, pred = opts.pred, n = Math.min(gt.length, pred.length);
  let lo = Infinity, hi = -Infinity;
  const err = new Array(n);
  for (let i = 0; i < n; i++) { const e = pred[i] - gt[i]; err[i] = e; if (e < lo) lo = e; if (e > hi) hi = e; }
  const nb = Math.max(8, Math.min(opts.bins || 30, n));
  const w = ((hi - lo) || 1) / nb;
  const counts = new Array(nb).fill(0);
  for (const e of err) { let b = Math.floor((e - lo) / w); if (b < 0) b = 0; if (b >= nb) b = nb - 1; counts[b]++; }
  const centers = Array.from({ length: nb }, (_, b) => lo + (b + 0.5) * w);
  const colors = centers.map(c => c < 0 ? 'rgba(56,189,248,0.6)' : 'rgba(244,114,182,0.6)');
  const grid = opts.gridColor || 'rgba(255,255,255,0.05)';

  return new Chart(canvas.getContext('2d'), {
    type: 'bar',
    data: { labels: centers.map(c => c.toFixed(2)), datasets: [{ data: counts, backgroundColor: colors, borderWidth: 0, barPercentage: 1, categoryPercentage: 1 }] },
    options: {
      maintainAspectRatio: false, responsive: true, animation: false,
      plugins: { legend: { display: false },
        tooltip: { callbacks: { title: items => `err ≈ ${items[0].label}`, label: c => `${c.parsed.y} samples` } } },
      scales: {
        x: { title: { display: true, text: opts.xTitle || 'error (pred − GT)', color: 'rgba(255,255,255,0.5)', font: { size: 10 } },
             ticks: { color: 'rgba(255,255,255,0.4)', maxTicksLimit: 7, font: { size: 8 } }, grid: { display: false } },
        y: { title: { display: true, text: opts.yTitle || 'count', color: 'rgba(255,255,255,0.5)', font: { size: 10 } },
             ticks: { color: 'rgba(255,255,255,0.4)', maxTicksLimit: 4, font: { size: 8 } }, grid: { color: grid } },
      },
    },
  });
}

// Error-by-quantile bars on `canvas` — split the test set into `q` equal-count ground-truth
// bands (default 5) and plot MAE per band, so it's clear WHERE in the value range a model
// struggles (e.g. high error in the tails). Labels show each band's GT range.
//   opts.gt, opts.pred, opts.q(5), opts.color, opts.xTitle, opts.yTitle, opts.gridColor
function buildScalar1DErrorByQuantile(canvas, opts) {
  const gt = opts.gt, pred = opts.pred, n = Math.min(gt.length, pred.length);
  const order = Array.from({ length: n }, (_, i) => i).sort((a, b) => gt[a] - gt[b]);
  const q = Math.max(2, Math.min(opts.q || 5, n));
  const labels = [], maes = [];
  for (let k = 0; k < q; k++) {
    const start = Math.floor(k * n / q), end = Math.floor((k + 1) * n / q);
    if (end <= start) continue;
    const idxs = order.slice(start, end);
    let sa = 0; for (const i of idxs) sa += Math.abs(pred[i] - gt[i]);
    const gmin = gt[order[start]], gmax = gt[order[end - 1]];
    const fmt = v => Math.abs(v) >= 100 ? v.toFixed(0) : v.toFixed(1);
    labels.push(`${fmt(gmin)}–${fmt(gmax)}`); maes.push(sa / idxs.length);
  }
  const grid = opts.gridColor || 'rgba(255,255,255,0.05)';
  return new Chart(canvas.getContext('2d'), {
    type: 'bar',
    data: { labels, datasets: [{ data: maes, backgroundColor: opts.color || 'rgba(153,97,255,0.6)', borderWidth: 0 }] },
    options: {
      maintainAspectRatio: false, responsive: true, animation: false,
      plugins: { legend: { display: false },
        tooltip: { callbacks: { title: items => `GT ${items[0].label}`, label: c => `MAE ${c.parsed.y.toFixed(3)}` } } },
      scales: {
        x: { title: { display: true, text: opts.xTitle || 'ground-truth band', color: 'rgba(255,255,255,0.5)', font: { size: 10 } },
             ticks: { color: 'rgba(255,255,255,0.4)', font: { size: 8 } }, grid: { display: false } },
        y: { beginAtZero: true, title: { display: true, text: opts.yTitle || 'MAE', color: 'rgba(255,255,255,0.5)', font: { size: 10 } },
             ticks: { color: 'rgba(255,255,255,0.4)', maxTicksLimit: 4, font: { size: 8 } }, grid: { color: grid } },
      },
    },
  });
}

// Expose on window for inline handlers that reference these by qualified name.
if (typeof window !== 'undefined') {
  window.EVAL3D_CHANNELS = EVAL3D_CHANNELS;
  window.getEval3DSizeCode = getEval3DSizeCode;
  window.scalar1DStats = scalar1DStats;
  window.isRulTarget = isRulTarget;
  window.rankColor = rankColor;
  window.buildScalar1DCalib = buildScalar1DCalib;
  window.buildScalar1DResidualScatter = buildScalar1DResidualScatter;
  window.buildScalar1DResidualHist = buildScalar1DResidualHist;
  window.buildScalar1DErrorByQuantile = buildScalar1DErrorByQuantile;
}
