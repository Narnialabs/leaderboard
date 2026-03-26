/**
 * Data Loader - CSV parsing and leaderboard data loading utilities
 * Uses PapaParse (loaded via CDN in HTML) for CSV parsing
 */

const DATA_BASE = 'output/data';

const LEADERBOARD_PATHS = {
  'dimension_2d/generation': 'dimension_2d/generation',
  'dimension_3d/generation': 'dimension_3d/generation',
  'dimension_3d/evaluation': 'dimension_3d/evaluation',
};

const SIZES = ['S', 'M', 'L', 'XL'];

/**
 * Load and parse a CSV file
 * @param {string} path - Relative path from visualization/
 * @returns {Promise<Array>} Parsed CSV rows as objects
 */
async function loadCSV(path) {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`Failed to load ${path}: ${response.status}`);
  const text = (await response.text()).replace(/^\uFEFF/, ''); // strip BOM
  return new Promise((resolve, reject) => {
    Papa.parse(text, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (results) => resolve(results.data),
      error: (err) => reject(err),
    });
  });
}

/**
 * Map a dataset id (e.g. 'deepjeb_2d_2d') to the leaderboard subdirectory key (e.g. 'deepjeb')
 */
function datasetToLeaderboardKey(datasetId) {
  if (!datasetId) return null;
  const DATASET_KEY_MAP = {
    'deepjeb_2d_2d':    'deepjeb',
    'drivaernet_2d_2d': 'drivaernet',
    'deepjeb_3d_3d':    'deepjeb',
    'drivaernet_3d_3d': 'drivaernet',
    'deepjeb_3d_2d':    'deepjeb',
    'drivaernet_3d_2d': 'drivaernet',
  };
  return DATASET_KEY_MAP[datasetId] || null;
}

/**
 * Load leaderboard CSV for a specific dimension/task/size (and optionally dataset)
 * @param {string} category - e.g. 'dimension_2d/generation'
 * @param {string} size - 'S', 'M', 'L', or 'XL'
 * @param {string} [dataset] - optional dataset id, e.g. 'deepjeb_2d_2d'
 */
async function loadLeaderboard(category, size, dataset, targetKey) {
  const dsKey = datasetToLeaderboardKey(dataset);
  if (dsKey && targetKey) {
    const path = `${DATA_BASE}/leaderboard/${category}/${dsKey}/${targetKey}/Leaderboard_${size}_${dsKey}_${targetKey}.csv`;
    return loadCSV(path);
  }
  if (dsKey) {
    const path = `${DATA_BASE}/leaderboard/${category}/${dsKey}/Leaderboard_${size}_${dsKey}.csv`;
    return loadCSV(path);
  }
  const path = `${DATA_BASE}/leaderboard/${category}/Leaderboard_${size}.csv`;
  return loadCSV(path);
}

/**
 * Load metric rankings for a specific dimension/task/size (and optionally dataset)
 * @param {string} [dataset] - optional dataset id, e.g. 'deepjeb_2d_2d'
 */
async function loadMetricsRanking(category, size, dataset, targetKey) {
  const dsKey = datasetToLeaderboardKey(dataset);
  if (dsKey && targetKey) {
    const path = `${DATA_BASE}/leaderboard/${category}/${dsKey}/${targetKey}/Leaderboard_${size}_${dsKey}_${targetKey}_metrics.csv`;
    return loadCSV(path);
  }
  if (dsKey) {
    const path = `${DATA_BASE}/leaderboard/${category}/${dsKey}/Leaderboard_${size}_${dsKey}_metrics.csv`;
    return loadCSV(path);
  }
  const path = `${DATA_BASE}/leaderboard/${category}/Leaderboard_${size}_metrics.csv`;
  return loadCSV(path);
}

/**
 * Load BenchRank details for a specific dimension/task
 */
async function loadBenchRankDetails(category) {
  const path = `${DATA_BASE}/leaderboard/${category}/BenchRank_Details.csv`;
  return loadCSV(path);
}

/**
 * Get available sizes for a category by checking which files exist
 */
async function getAvailableSizes(category) {
  const available = [];
  for (const size of SIZES) {
    try {
      const path = `${DATA_BASE}/leaderboard/${category}/Leaderboard_${size}.csv`;
      const resp = await fetch(path, { method: 'HEAD' });
      if (resp.ok) available.push(size);
    } catch {
      // skip
    }
  }
  return available.length > 0 ? available : SIZES;
}

/**
 * Detect metric columns from leaderboard data
 * Separates resource metrics from quality metrics
 */
function getMetricColumns(headers) {
  const skip = ['Rank', 'Model', 'Total Score'];
  const resourceMetrics = [];
  const qualityMetrics = [];

  headers.forEach(h => {
    const clean = h.replace(/^\uFEFF/, '').trim();
    if (skip.some(s => clean === s || clean.startsWith(s))) return;
    if (h.includes('Parameters') || h.includes('Training Time') || h.includes('Inference Time')) {
      resourceMetrics.push(h);
    } else {
      qualityMetrics.push(h);
    }
  });

  return { resourceMetrics, qualityMetrics, allMetrics: [...resourceMetrics, ...qualityMetrics] };
}

/**
 * Determine if a metric is "higher is better" based on arrow in column name
 */
function isHigherBetter(columnName) {
  return columnName.includes('↑');
}

/**
 * Get best/worst values for each metric column across all rows
 */
function getMetricRanges(data, metricColumns) {
  const ranges = {};
  metricColumns.forEach(col => {
    const values = data.map(row => parseFloat(row[col])).filter(v => !isNaN(v));
    const higher = isHigherBetter(col);
    ranges[col] = {
      min: Math.min(...values),
      max: Math.max(...values),
      best: higher ? Math.max(...values) : Math.min(...values),
      worst: higher ? Math.min(...values) : Math.max(...values),
      higherBetter: higher,
    };
  });
  return ranges;
}

/**
 * Normalize a value within a range to [0, 1] where 1 = best
 */
function normalizeMetric(value, range) {
  if (range.max === range.min) return 0.5;
  const raw = (value - range.min) / (range.max - range.min);
  return range.higherBetter ? raw : 1 - raw;
}

/**
 * Get a heatmap color for a normalized value [0, 1]
 * 0 = worst (red-ish), 1 = best (green)
 */
function getHeatmapColor(normalized) {
  if (isNaN(normalized)) return 'rgba(255,255,255,0.5)';
  // green(best) → yellow(mid) → red(worst), no blue
  let r, g, b;
  if (normalized >= 0.5) {
    // yellow → green (0.5 → 1.0)
    const t = (normalized - 0.5) * 2; // 0→1
    r = Math.round(234 * (1 - t) + 34 * t);  // 234→34
    g = Math.round(179 * (1 - t) + 197 * t);  // 179→197
    b = Math.round(8 * (1 - t) + 94 * t);     // 8→94
  } else {
    // red → yellow (0.0 → 0.5)
    const t = normalized * 2; // 0→1
    r = Math.round(239 * (1 - t) + 234 * t);  // 239→234
    g = Math.round(68 * (1 - t) + 179 * t);   // 68→179
    b = Math.round(68 * (1 - t) + 8 * t);     // 68→8
  }
  return `rgb(${r}, ${g}, ${b})`;
}

/**
 * Format a number for display
 */
function formatMetricValue(value, columnName) {
  if (value === null || value === undefined || isNaN(value)) return '-';
  if (columnName.includes('Parameters')) return value.toFixed(2) + 'M';
  if (columnName.includes('Time')) return value.toFixed(2);
  if (columnName.includes('MAPE')) return value.toFixed(2);
  if (Math.abs(value) >= 100) return value.toFixed(1);
  if (Math.abs(value) >= 1) return value.toFixed(4);
  return value.toFixed(4);
}

// ── Summary Metrics Loading ──

const INFERENCE_BASE = 'output/data/inference';

const SUMMARY_METRICS_PATHS = {
  'dimension_2d/generation': 'dimension_2d/generation',
  'dimension_3d/generation': 'dimension_3d/generation',
  'dimension_3d/evaluation': 'dimension_3d/evaluation',
};

const SCALE_MAP = {
  'Small': 'S',
  'Medium': 'M',
  'Large': 'L',
  'Extra Large': 'XL',
};

const SCALE_LABELS = { 'S': 'Small', 'M': 'Medium', 'L': 'Large', 'XL': 'Extra Large' };

/**
 * Load summary_metrics.csv for a specific inference category
 */
async function loadSummaryMetrics(category) {
  const path = `${INFERENCE_BASE}/${category}/summary_metrics.csv`;
  return loadCSV(path);
}

/**
 * Extract unique filter values from summary_metrics data
 */
function extractFilterOptions(data) {
  const models = [...new Set(data.map(r => r['Model Name']))].sort();
  const datasets = [...new Set(data.map(r => r['Dataset']))].sort();
  const scales = [...new Set(data.map(r => r['Data Scale']))];
  const sizes = [...new Set(data.map(r => r['Data Size']))].sort((a, b) => a - b);
  const targetKeys = [...new Set(data.map(r => r['Target Key']).filter(Boolean))].sort();
  const dimensions = [...new Set(data.map(r => r['Dimension']).filter(Boolean))].sort();

  // Map scales to S/M/L/XL codes
  const sizeCodes = scales.map(s => SCALE_MAP[s]).filter(Boolean);

  return { models, datasets, scales, sizes, sizeCodes, targetKeys, dimensions };
}

/**
 * Filter summary metrics data by criteria
 */
function filterSummaryData(data, filters) {
  return data.filter(row => {
    if (filters.dataset && row['Dataset'] !== filters.dataset) return false;
    if (filters.dataScale && row['Data Scale'] !== filters.dataScale) return false;
    if (filters.targetKey && row['Target Key'] !== filters.targetKey) return false;
    if (filters.dimension && row['Dimension'] !== filters.dimension) return false;
    if (filters.model && row['Model Name'] !== filters.model) return false;
    return true;
  });
}

/**
 * Get summary metric columns (excludes metadata columns)
 */
function getSummaryMetricColumns(headers) {
  const skip = ['Model Name', 'Domain', 'Task', 'Parameters (M)', 'Resolution',
                'Dataset', 'Data Scale', 'Data Size', 'Target Key', 'Dimension'];
  const resourceMetrics = [];
  const qualityMetrics = [];

  headers.forEach(h => {
    const clean = h.replace(/^\uFEFF/, '').trim();
    if (skip.includes(clean)) return;
    if (clean.includes('Parameters') || clean.includes('Training Time') || clean.includes('Inference Time')) {
      resourceMetrics.push(h);
    } else {
      qualityMetrics.push(h);
    }
  });

  return { resourceMetrics, qualityMetrics, allMetrics: [...resourceMetrics, ...qualityMetrics] };
}

// ── Target Key Ordering ──

const TARGET_KEY_ABSOLUTE_ORDER = [
  'vertical', 'horizontal', 'torsion', 'diagonal',
  'mode_shape_1', 'mode_shape_2',
  'pressure', 'velocity', 'pv_coupled',
];

const TARGET_KEY_ORDER = {
  'deepjeb_3d_2d': ['vertical', 'horizontal', 'torsion', 'diagonal', 'mode_shape_1', 'mode_shape_2'],
  'drivaernet_3d_2d': ['pressure', 'velocity', 'pv_coupled'],
};

/**
 * Map target key → required dataset id (null means any dataset)
 */
const TARGET_KEY_DATASET_MAP = {
  'vertical': 'deepjeb_3d_2d',
  'horizontal': 'deepjeb_3d_2d',
  'torsion': 'deepjeb_3d_2d',
  'diagonal': 'deepjeb_3d_2d',
  'mode_shape_1': 'deepjeb_3d_2d',
  'mode_shape_2': 'deepjeb_3d_2d',
  'pressure': 'drivaernet_3d_2d',
  'velocity': 'drivaernet_3d_2d',
  'pv_coupled': 'drivaernet_3d_2d',
};

const DIMENSION_ORDER = [
  'disp_x', 'disp_y', 'disp_z', 'stress',
  'mode_x', 'mode_y', 'mode_z',
  'velocity_x', 'velocity_y', 'velocity_z', 'pressure',
];

/**
 * Get available target keys for a given dataset from data (custom ordered)
 */
function getTargetKeysForDataset(data, dataset) {
  const unique = [...new Set(
    data.filter(r => r['Dataset'] === dataset)
        .map(r => r['Target Key'])
        .filter(Boolean)
  )];
  const order = TARGET_KEY_ORDER[dataset];
  if (order) {
    return order.filter(tk => unique.includes(tk));
  }
  return unique.sort();
}

/**
 * Get all target keys across all datasets, ordered by absolute order
 */
function getAllTargetKeysOrdered(data) {
  const unique = [...new Set(
    data.map(r => r['Target Key']).filter(Boolean)
  )];
  return TARGET_KEY_ABSOLUTE_ORDER.filter(tk => unique.includes(tk));
}

/**
 * Get available dimensions for a given dataset + target key from data (custom ordered)
 */
function getDimensionsForTargetKey(data, dataset, targetKey) {
  const unique = [...new Set(
    data.filter(r => {
      if (dataset && r['Dataset'] !== dataset) return false;
      if (targetKey && r['Target Key'] !== targetKey) return false;
      return true;
    }).map(r => r['Dimension']).filter(Boolean)
  )];
  return unique.sort((a, b) => {
    const ai = DIMENSION_ORDER.indexOf(a);
    const bi = DIMENSION_ORDER.indexOf(b);
    if (ai !== -1 && bi !== -1) return ai - bi;
    if (ai !== -1) return -1;
    if (bi !== -1) return 1;
    return a.localeCompare(b);
  });
}

// ── Display Name Mappings ──

const MODEL_DISPLAY = {
  'gan':             { name: 'GAN (Basic)',  type: 'GAN (Basic)' },
  'vae':             { name: 'VAE (Basic)',  type: 'VAE (Basic)' },
  'dcgan':           { name: 'DCGAN',        type: 'GAN (Deep CNN)' },
  'lsgan':           { name: 'LSGAN',        type: 'GAN (Loss Function)' },
  'wgan_cp':         { name: 'WGAN-CP',      type: 'GAN (Wasserstein)' },
  'wgan_gp':         { name: 'WGAN-GP',      type: 'GAN (W. Penalty)' },
  'r1gan':           { name: 'R1GAN',        type: 'GAN (Regularized)' },
  'ddpm':            { name: 'DDPM',         type: 'Diffusion' },
  'vqvae':           { name: 'VQVAE',        type: 'VAE' },
  'transolver_pp':   { name: 'Transolver++', type: 'Transformer' },
  'abupt':           { name: 'AB-UPT',       type: 'Transformer' },
  'gan3d':           { name: '3D-GAN',       type: 'GAN' },
  'deepsdf':         { name: 'DeepSDF',      type: 'Implicit (SDF)' },
  'pointflow':       { name: 'PointFlow',    type: 'Flow (Normalizing)' },
  'shapegf':         { name: 'ShapeGF',      type: 'Score-based' },
  'atlasnet':        { name: 'AtlasNet',     type: 'Auto-Decoder' },
  'diffusionpointcloud': { name: 'Diffusion3D', type: 'Diffusion' },
  'pointnet':        { name: 'PointNet',     type: 'PointNet' },
  'regdgcnn':        { name: 'RegDGCNN',     type: 'GNN (DGCNN)' },
  'transolver':      { name: 'Transolver',   type: 'Transformer' },
};

const DATASET_DISPLAY = {
  'deepjeb_2d_2d': 'DeepJEB',
  'drivaernet_2d_2d': 'DrivAerNet',
  'deepjeb_3d_3d': 'DeepJEB',
  'drivaernet_3d_3d': 'DrivAerNet',
  'deepjeb_3d_2d': 'DeepJEB',
  'drivaernet_3d_2d': 'DrivAerNet',
};

function displayModelName(id) {
  const key = (id || '').toLowerCase();
  return MODEL_DISPLAY[key]?.name || id;
}

function displayModelType(id) {
  const key = (id || '').toLowerCase();
  return MODEL_DISPLAY[key]?.type || '';
}

function displayDataset(id) {
  return DATASET_DISPLAY[id] || id;
}

function displaySizeLabel(scale, size) {
  const code = SCALE_MAP[scale] || scale;
  return `${code} (${Math.round(size)})`;
}

function displayResolution(res, dim) {
  if (!res) return '-';
  if (dim === '3d' && typeof res === 'number') return `${res} points`;
  return String(res);
}

// ── Metric Categories ──

const CATEGORY_ORDER_2D = ['Efficiency', 'Fidelity', 'Diversity'];
const CATEGORY_ORDER_3D_GEN = ['Efficiency', 'Fidelity', 'Diversity'];
const CATEGORY_ORDER_3D_EVAL = ['Efficiency', 'Absolute Error', 'Relative Error', 'Model Fit', 'Worst-case Error', 'Directional Accuracy'];

const CATEGORY_COLORS = {
  'Efficiency':           'rgba(56,189,248,0.12)',
  'Fidelity':             'rgba(52,211,153,0.1)',
  'Diversity':            'rgba(167,139,250,0.1)',
  'Absolute Error':       'rgba(248,113,113,0.1)',
  'Relative Error':       'rgba(251,146,60,0.1)',
  'Model Fit':            'rgba(52,211,153,0.1)',
  'Worst-case Error':     'rgba(244,114,182,0.1)',
  'Directional Accuracy': 'rgba(56,189,248,0.1)',
};

const CATEGORY_TEXT_COLORS = {
  'Efficiency':           '#38bdf8',
  'Fidelity':             '#34d399',
  'Diversity':            '#a78bfa',
  'Absolute Error':       '#f87171',
  'Relative Error':       '#fb923c',
  'Model Fit':            '#34d399',
  'Worst-case Error':     '#f472b6',
  'Directional Accuracy': '#38bdf8',
};

function getMetricCategory(metricName, dim, task) {
  const clean = metricName.replace(/\s*[↑↓]\s*$/,'').trim();
  if (['Parameters (M)','Training Time (s)','Inference Time (s)'].includes(clean)) return 'Efficiency';
  if (dim === '2d' || (dim === '3d' && task === 'generation')) {
    if (['IS','FID','MV-FID','FPD','CD','EMD','PSNR','Precision','Density'].includes(clean)) return 'Fidelity';
    if (['LPIPS','MS-SSIM','F-Score','Recall','Coverage'].includes(clean)) return 'Diversity';
  }
  if (dim === '3d' && task !== 'generation') {
    if (['MAE','RMSE'].includes(clean)) return 'Absolute Error';
    if (['MAPE (%)','Rel-L2'].includes(clean)) return 'Relative Error';
    if (['R²'].includes(clean)) return 'Model Fit';
    if (['MaxAE'].includes(clean)) return 'Worst-case Error';
    if (['MAC'].includes(clean)) return 'Directional Accuracy';
  }
  return 'Other';
}

/**
 * Group metrics by category, respecting category order
 * Returns: [{ category, color, textColor, metrics: [metricName, ...] }, ...]
 */
function groupMetricsByCategory(metrics, dim, task) {
  const order = dim === '2d' ? CATEGORY_ORDER_2D
    : (task === 'generation' ? CATEGORY_ORDER_3D_GEN : CATEGORY_ORDER_3D_EVAL);
  const groups = {};
  order.forEach(c => groups[c] = []);

  metrics.forEach(m => {
    const cat = getMetricCategory(m, dim, task);
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(m);
  });

  return order
    .filter(c => groups[c] && groups[c].length > 0)
    .map(c => ({
      category: c,
      color: CATEGORY_COLORS[c] || 'transparent',
      textColor: CATEGORY_TEXT_COLORS[c] || 'var(--text-tertiary)',
      metrics: groups[c],
    }));
}

/**
 * Short label for metric headers (strip units/arrows)
 */
function shortMetricLabel(name) {
  return name
    .replace(' (M)','')
    .replace(' (s)','')
    .replace(' (%)','(%)')
    .replace(' ↑','')
    .replace(' ↓','')
    .replace('Training Time', 'Train T.')
    .replace('Inference Time', 'Inf. T.')
    .replace('Parameters', 'Params');
}
