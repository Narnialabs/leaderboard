/**
 * Data Loader - CSV parsing and leaderboard data loading utilities
 * Uses PapaParse (loaded via CDN in HTML) for CSV parsing
 */

const DATA_BASE = 'output/data';
const DATA_BUILD = '20260616-1';

/**
 * Display labels and metadata for target keys, keyed by dataset.
 * Used by getTargetKeyLabel() to convert pipeline keys to human-readable names.
 */
const TARGET_KEY_META = {
  'deepjeb_3d_2d': {
    'vertical':     { label: 'Vertical Load',             category: 'Load Case',   unit: null },
    'horizontal':   { label: 'Horizontal Load',           category: 'Load Case',   unit: null },
    'diagonal':     { label: 'Diagonal Load',             category: 'Load Case',   unit: null },
    'torsion':      { label: 'Torsional Load',            category: 'Load Case',   unit: null },
    'mode_shape_1': { label: 'Mode Shape 1',              category: 'Modal (FEM)', unit: null },
    'mode_shape_2': { label: 'Mode Shape 2',              category: 'Modal (FEM)', unit: null },
  },
  'drivaernet_3d_2d_centerplane': {
    'pressure+velocity': { label: 'Pressure + Velocity (Center Plane)', category: 'CFD Field', unit: null },
    'pressure':      { label: 'Surface Pressure',          category: 'CFD Field',   unit: 'Pa'  },
    'velocity':      { label: 'Velocity Field',            category: 'CFD Field',   unit: 'm/s' },
    'pv_coupled':    { label: 'Pressure-Velocity Coupled', category: 'CFD Field',   unit: null  },
    'body_pressure': { label: 'Body Surface Pressure',     category: 'CFD Field',   unit: 'Pa'  },
  },
  // milestone9.x canonical 3D-field split datasets — keyed by the coupled summary
  // Target Key the leaderboard/summary actually carries (the per-load-case umbrella
  // entry above stays for the explorer's bin-token labels).
  'deepjeb_3d_2d_vertical':   { 'displacement+von_mises': { label: 'Displacement + von Mises (Vertical Load)',   category: 'Structural (FEA)', unit: null } },
  'deepjeb_3d_2d_horizontal': { 'displacement+von_mises': { label: 'Displacement + von Mises (Horizontal Load)', category: 'Structural (FEA)', unit: null } },
  'deepjeb_3d_2d_torsion':    { 'displacement+von_mises': { label: 'Displacement + von Mises (Torsional Load)',  category: 'Structural (FEA)', unit: null } },
  'deepjeb_3d_2d_diagonal':   { 'displacement+von_mises': { label: 'Displacement + von Mises (Diagonal Load)',   category: 'Structural (FEA)', unit: null } },
  'deepjeb_3d_2d_modal':      { 'mode_shapes': { label: 'Mode Shapes (Modal FEM)', category: 'Modal (FEM)', unit: null } },
  // NOTE: drivaernet/drivaerml surface + volume coupled-summary keys are merged
  // into their full entries below (was a duplicate-object-key shadow that silently
  // dropped these coupled labels, since a later same-named literal entry wins).
  'deepwheel_3d_1d': {
    'mass':   { label: 'Mass',                          category: 'Structural',  unit: 'kg' },
    'mode7':  { label: 'Natural Freq. (Mode 7)',        category: 'Modal (FEM)', unit: 'Hz' },
    'mode11': { label: 'Natural Freq. (Mode 11)',       category: 'Modal (FEM)', unit: 'Hz' },
  },
  'deepwheel_2d_1d': {
    'mass':   { label: 'Mass',                          category: 'Structural',  unit: 'kg' },
    'mode7':  { label: 'Natural Freq. (Mode 7)',        category: 'Modal (FEM)', unit: 'Hz' },
    'mode11': { label: 'Natural Freq. (Mode 11)',       category: 'Modal (FEM)', unit: 'Hz' },
  },
  // milestone9.x split scalar datasets — keyed by the summary's actual dataset name +
  // Target Key (mass / natural_frequencies). natural_frequencies is the coupled mode7+mode11
  // run; its per-mode split lives in the `Component` column (mode_freq_7 / mode_freq_11).
  'deepwheel_3d_1d_mass':  { 'mass': { label: 'Mass', category: 'Structural', unit: 'kg' } },
  'deepwheel_2d_1d_mass':  { 'mass': { label: 'Mass', category: 'Structural', unit: 'kg' } },
  'deepwheel_3d_1d_modal': { 'natural_frequencies': { label: 'Natural Frequencies (Modes 7 & 11)', category: 'Modal (FEM)', unit: 'Hz' } },
  'deepwheel_2d_1d_modal': { 'natural_frequencies': { label: 'Natural Frequencies (Modes 7 & 11)', category: 'Modal (FEM)', unit: 'Hz' } },
  'deepwheel_2d_2d': {
    'depth':  { label: 'Depth Map',                     category: 'Geometry',    unit: null },
  },
  'concrete_1d_1d_strength': {
    'strength': { label: 'Compressive Strength',        category: 'Materials',    unit: 'MPa' },
  },
  'airfoil_1d_1d_noise': {
    'scaled_sound_pressure_db': { label: 'Sound Pressure Level', category: 'Acoustics', unit: 'dB' },
  },
  'cmapss_1dt_1d_rul': {
    'rul':    { label: 'Remaining Useful Life',         category: 'Prognostics',  unit: 'cycles' },
  },
  // milestone9.x split / new datasets (keyed by canonical dataset name).
  'deepwheel_2d_2d_depth': {
    'depth':  { label: 'Depth Map',                     category: 'Geometry',    unit: null },
  },
  'deepjeb_2d_2d_structural': {
    // "Stress" (not "Von Mises Stress") to match the 3D-field Component label —
    // both are von Mises equivalent stress (unified per the filter redesign).
    'stress': { label: 'Stress',                        category: 'Structural (FEA)', unit: 'MPa' },
    'disp':   { label: 'Displacement',                  category: 'Structural (FEA)', unit: 'mm'  },
  },
  'pdebenchdarcy_2d_2d_pressure': {
    'pressure': { label: 'Darcy Pressure',              category: 'PDE (operator)',   unit: null },
  },
  'airfrans_2d_2d_flow': {
    'u':          { label: 'Velocity x',                category: 'RANS Field',  unit: 'm/s' },
    'v':          { label: 'Velocity y',                category: 'RANS Field',  unit: 'm/s' },
    'p_over_rho': { label: 'Pressure / ρ',              category: 'RANS Field',  unit: 'm²/s²' },
    'nu_t':       { label: 'Turbulent Viscosity',       category: 'RANS Field',  unit: 'm²/s' },
  },
  'drivaernet_3d_2d_surface': {
    'pressure':      { label: 'Surface Pressure',       category: 'CFD Field',   unit: 'Pa' },  // published Target Key
    'body_pressure': { label: 'Body Surface Pressure',  category: 'CFD Field',   unit: 'Pa' },
  },
  'drivaerml_3d_2d_surface': {
    'pressure':                   { label: 'Surface Pressure',             category: 'CFD Field', unit: 'Pa' },
    'wallshearstress':            { label: 'Wall Shear Stress',            category: 'CFD Field', unit: 'Pa' },
    'pwss_coupled':               { label: 'Pressure + WSS Coupled',       category: 'CFD Field', unit: null },
    'pressure+wall_shear_stress': { label: 'Pressure + Wall Shear Stress', category: 'CFD Field', unit: null },  // published Target Key
  },
  'drivaerml_3d_3d_volume': {
    'totalpcoeff':    { label: 'Total Pressure Coeff.',      category: 'CFD Volume', unit: null  },
    'velocity':       { label: 'Velocity Field',             category: 'CFD Volume', unit: 'm/s' },
    'vorticity':      { label: 'Vorticity',                  category: 'CFD Volume', unit: '1/s' },
    'volume_coupled': { label: 'Volume Coupled',             category: 'CFD Volume', unit: null  },
    'pressure_coeff+velocity+vorticity': { label: 'Total-p Coeff + Velocity + Vorticity', category: 'CFD Volume', unit: null },  // published Target Key
  },
};

/**
 * Return human-readable label for a target key, falling back to the raw key.
 */
function getTargetKeyLabel(datasetId, key) {
  return TARGET_KEY_META[datasetId]?.[key]?.label ?? key;
}

// ── Dataset registry (discipline / coupling / component·axis facets) ──
// Static snapshot of common/utils/dataset_registry.to_json(), emitted by
// scripts/export_dataset_registry_json.py and refreshed at publish time by
// copy_csv_data.py. data-loader.js cannot import the Python source, so it
// fetches this JSON once and caches it. Every consumer degrades gracefully to
// the prior behaviour when the file is absent or a dataset is unregistered
// (e.g. legacy CSVs published before a rename), so this never hard-breaks.
let _datasetRegistry = null;
let _datasetRegistryPromise = null;

async function loadDatasetRegistry() {
  if (_datasetRegistry) return _datasetRegistry;
  if (_datasetRegistryPromise) return _datasetRegistryPromise;
  _datasetRegistryPromise = (async () => {
    try {
      const resp = await fetch(`${DATA_BASE}/dataset_registry.json?v=${DATA_BUILD}`);
      _datasetRegistry = resp.ok ? await resp.json() : {};
    } catch {
      _datasetRegistry = {};
    }
    return _datasetRegistry;
  })();
  return _datasetRegistryPromise;
}

// Synchronous accessor — returns {} until loadDatasetRegistry() has resolved.
function datasetRegistry() {
  return _datasetRegistry || {};
}

function getDatasetMeta(datasetId) {
  return datasetRegistry()[datasetId] || null;
}

// Human-readable label for the discipline (engineering-framing) facet.
const DISCIPLINE_LABEL = {
  structural:   'Structural',
  modal:        'Modal',
  aerodynamics: 'Aerodynamics',
  porous_flow:  'Porous Flow',
  acoustics:    'Acoustics',
  prognostics:  'Prognostics',
  materials:    'Materials',
  geometry:     'Geometry',
};

function getDiscipline(datasetId) {
  return getDatasetMeta(datasetId)?.discipline ?? null;
}

function disciplineLabel(datasetId) {
  const d = getDiscipline(datasetId);
  return d ? (DISCIPLINE_LABEL[d] || d) : '';
}

const SIZES = ['S', 'M', 'L', 'XL'];

// Branch types for BenchRank leaderboards
const BRANCH_QUALITY = 'quality';
const BRANCH_QUALITY_EFFICIENCY = 'quality_efficiency';

/**
 * Get filename prefix for a branch type
 * @param {string} branch - 'quality' or 'quality_efficiency'
 */
function branchPrefix(branch) {
  if (branch === BRANCH_QUALITY) return 'Quality_';
  return 'Quality_Efficiency_';
}

/**
 * Load and parse a CSV file
 * @param {string} path - Relative path from visualization/
 * @returns {Promise<Array>} Parsed CSV rows as objects
 *
 * In-memory cache keyed by the ?v=DATA_BUILD-busted URL. DATA_BUILD is constant
 * for a page session, so a given URL's content is immutable within that session
 * (a republish bumps DATA_BUILD \u2192 new key \u2192 cache miss; a page reload starts a
 * fresh cache). This makes category switches that revisit an already-loaded CSV
 * \u2014 back/forward navigation, generation\u21C4prediction toggling, and same-category
 * hash changes (which still go through loadAllData\u2192loadSummaryMetrics) \u2014 instant
 * instead of re-fetching + re-parsing every time. The promise (not the parsed
 * rows) is cached so concurrent callers dedupe to one fetch; failures are evicted
 * so a transient error retries on the next call. Callers must not mutate the
 * returned array in place (none do \u2014 all sorts copy via [...data]).
 */
const _csvCache = {};
function loadCSV(path) {
  const url = path + (path.includes('?') ? '&' : '?') + 'v=' + DATA_BUILD;
  if (_csvCache[url]) return _csvCache[url];
  const p = (async () => {
    // No `cache: 'no-cache'`: the URL already carries ?v=DATA_BUILD, so the browser's
    // default HTTP cache is safe — a republish bumps DATA_BUILD → new URL → cache miss
    // → fresh fetch, while an unchanged build serves from disk cache with ZERO network
    // (the previous no-cache forced a conditional 304 round-trip on every page
    // navigation/reload even when nothing changed). Relies on DATA_BUILD being bumped
    // on each data republish — which the publish flow already does.
    const response = await fetch(url);
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
  })();
  _csvCache[url] = p;
  p.catch(() => { delete _csvCache[url]; });  // don't cache failures \u2014 allow retry
  return p;
}

/**
 * Map a dataset id (e.g. 'deepjeb_2d_2d') to the leaderboard subdirectory key (e.g. 'deepjeb')
 */
// Mirror benchmark_C.sanitize_filename(): non [\w-] chars → "_", collapse runs,
// trim. Used for the per-target / per-component leaderboard path segments so the
// website's lookup matches the dirs/filenames Step C writes. Identity for
// single-token keys (mass, pressure, vertical, pv_coupled…).
function sanitizeForPath(s) {
  return String(s).replace(/[^\w\-]/g, '_').replace(/_+/g, '_').replace(/^_+|_+$/g, '');
}

function datasetToLeaderboardKey(datasetId) {
  if (!datasetId) return null;
  // Mirror benchmark_C.dataset_short_name(): strip dimension tokens (\d+d) so
  // the key matches the per-dataset leaderboard directory Step C emits. The
  // milestone9.x split datasets carry a descriptor token that is NOT a
  // dimension, so the prior hardcoded family-only map (deepjeb_3d_2d→'deepjeb')
  // pointed at stale umbrella dirs and returned null for every split name
  // (deepjeb_3d_2d_modal, drivaernet_3d_2d_centerplane, deepwheel_3d_1d_mass…),
  // breaking the per-dataset drill-down. Deriving the key here keeps it in
  // lock-step with Step C: deepjeb_3d_2d_modal→'deepjeb_modal',
  // drivaernet_3d_2d_centerplane→'drivaernet_centerplane', while generation
  // datasets still collapse to the family name (deepjeb_2d_2d→'deepjeb').
  const parts = String(datasetId).split('_').filter(p => !/^\d+d$/i.test(p));
  return parts.length ? parts.join('_') : String(datasetId);
}

/**
 * Load leaderboard CSV for a specific dimension/task/size (and optionally dataset/targetKey/component)
 * @param {string} category - e.g. 'dimension_2d/generation'
 * @param {string} size - 'S', 'M', 'L', or 'XL'
 * @param {string} [dataset] - optional dataset id, e.g. 'deepjeb_2d_2d'
 * @param {string} [targetKey] - optional target key
 * @param {string} [component] - optional component (e.g. 'disp_x'); only honored when dataset+targetKey are set
 * @param {string} [branch='quality'] - 'quality' or 'quality_efficiency'
 */
async function loadLeaderboard(category, size, dataset, targetKey, component, branch = BRANCH_QUALITY) {
  const dsKey = datasetToLeaderboardKey(dataset);
  const prefix = branchPrefix(branch);
  // Step C sanitizes targetKey/component for its dirs+filenames (sanitizeForPath),
  // so the comma-joined modal target "mode_shape_1,mode_shape_2" lives under
  // ".../mode_shape_1_mode_shape_2/". Sanitize here too; identity for single-token keys.
  const tkS = targetKey ? sanitizeForPath(targetKey) : targetKey;
  const cmpS = component ? sanitizeForPath(component) : component;
  if (dsKey && targetKey && component) {
    const path = `${DATA_BASE}/leaderboard/${category}/${branch}/${dsKey}/${tkS}/${cmpS}/${prefix}Leaderboard_${size}_${dsKey}_${tkS}_${cmpS}.csv`;
    return loadCSV(path);
  }
  if (dsKey && targetKey) {
    const path = `${DATA_BASE}/leaderboard/${category}/${branch}/${dsKey}/${tkS}/${prefix}Leaderboard_${size}_${dsKey}_${tkS}.csv`;
    return loadCSV(path);
  }
  if (dsKey) {
    const path = `${DATA_BASE}/leaderboard/${category}/${branch}/${dsKey}/${prefix}Leaderboard_${size}_${dsKey}.csv`;
    return loadCSV(path);
  }
  const path = `${DATA_BASE}/leaderboard/${category}/${branch}/${prefix}Leaderboard_${size}.csv`;
  return loadCSV(path);
}

/**
 * Load metric rankings for a specific dimension/task/size (and optionally dataset/targetKey/component)
 * @param {string} [dataset] - optional dataset id, e.g. 'deepjeb_2d_2d'
 * @param {string} [component] - optional component (e.g. 'disp_x'); only honored when dataset+targetKey are set
 * @param {string} [branch='quality'] - 'quality' or 'quality_efficiency'
 */
async function loadMetricsRanking(category, size, dataset, targetKey, component, branch = BRANCH_QUALITY) {
  const dsKey = datasetToLeaderboardKey(dataset);
  const prefix = branchPrefix(branch);
  const tkS = targetKey ? sanitizeForPath(targetKey) : targetKey;
  const cmpS = component ? sanitizeForPath(component) : component;
  if (dsKey && targetKey && component) {
    const path = `${DATA_BASE}/leaderboard/${category}/${branch}/${dsKey}/${tkS}/${cmpS}/${prefix}Leaderboard_${size}_${dsKey}_${tkS}_${cmpS}_metrics.csv`;
    return loadCSV(path);
  }
  if (dsKey && targetKey) {
    const path = `${DATA_BASE}/leaderboard/${category}/${branch}/${dsKey}/${tkS}/${prefix}Leaderboard_${size}_${dsKey}_${tkS}_metrics.csv`;
    return loadCSV(path);
  }
  if (dsKey) {
    const path = `${DATA_BASE}/leaderboard/${category}/${branch}/${dsKey}/${prefix}Leaderboard_${size}_${dsKey}_metrics.csv`;
    return loadCSV(path);
  }
  const path = `${DATA_BASE}/leaderboard/${category}/${branch}/${prefix}Leaderboard_${size}_metrics.csv`;
  return loadCSV(path);
}

/**
 * Load BenchRank details for a specific dimension/task
 * @param {string} [branch='quality'] - 'quality' or 'quality_efficiency'
 */
async function loadBenchRankDetails(category, branch = BRANCH_QUALITY) {
  const prefix = branchPrefix(branch);
  const path = `${DATA_BASE}/leaderboard/${category}/${branch}/${prefix}BenchRank_Details.csv`;
  return loadCSV(path);
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
 * Determine decimal places for an entire column based on its max absolute value.
 * All cells in the same column use the same decimals for visual consistency.
 */
function getColumnDecimals(colMax) {
  if (colMax >= 100)  return 2;
  if (colMax >= 1)    return 3;
  if (colMax >= 0.01) return 4;
  return 6;
}

/**
 * Format a number for display.
 * @param {number} value - the cell value
 * @param {string} columnName - metric column name
 * @param {object} [colRange] - optional {min, max} from getMetricRanges(); when provided, decimals are column-consistent
 */
function formatMetricValue(value, columnName, colRange) {
  if (value === null || value === undefined || isNaN(value)) return '-';
  if (columnName.includes('Parameters')) return value.toFixed(2) + 'M';
  if (columnName.includes('Time')) return value.toFixed(2);
  var colMax = colRange ? Math.max(Math.abs(colRange.min), Math.abs(colRange.max)) : Math.abs(value);
  var decimals = getColumnDecimals(colMax);
  return value.toFixed(decimals);
}

// ── Summary Metrics Loading ──

const INFERENCE_BASE = 'output/data/inference';

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
  // Warm the dataset registry alongside the summary load so discipline labels
  // are available by first render; failure is swallowed inside the loader.
  const [data] = await Promise.all([loadCSV(path), loadDatasetRegistry()]);
  return data;
}

/**
 * Extract unique filter values from summary_metrics data
 */
function extractFilterOptions(data) {
  const models = [...new Set(data.map(r => r['Model Name']))].sort();
  // Use canonical dataset order (deepjeb → deepwheel → drivaernet) instead
  // of plain alphabetic so 2D/3D variants stay grouped by family on filter
  // pills. See sortDatasets() below for the rank table.
  const datasets = sortDatasets([...new Set(data.map(r => r['Dataset']))]);
  const scales = [...new Set(data.map(r => r['Data Scale']))];
  const sizes = [...new Set(data.map(r => r['Data Size']))].sort((a, b) => a - b);
  const targetKeys = [...new Set(data.map(r => r['Target Key']).filter(Boolean))].sort();
  const dimensions = [...new Set(data.map(r => r['Component']).filter(Boolean))].sort();

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
    // umbrella = friendly source family; matches every split dataset under it
    // (used by scenario-type Target=All, where no single dataset is pinned).
    if (filters.umbrella && datasetUmbrella(row['Dataset']) !== filters.umbrella) return false;
    if (filters.dataScale && row['Data Scale'] !== filters.dataScale) return false;
    if (filters.targetKey && row['Target Key'] !== filters.targetKey) return false;
    if (filters.dimension && row['Component'] !== filters.dimension) return false;
    if (filters.axis && row['Axis'] !== filters.axis) return false;
    if (filters.model && row['Model Name'] !== filters.model) return false;
    return true;
  });
}

/**
 * Get summary metric columns (excludes metadata columns)
 */
function getSummaryMetricColumns(headers) {
  const skip = ['Model Name', 'Domain', 'Task', 'Parameters (M)', 'Resolution',
                'Dataset', 'Data Scale', 'Data Size', 'Target Key', 'Component', 'Axis'];
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

const TARGET_KEY_ORDER = {
  'deepjeb_3d_2d': ['vertical', 'horizontal', 'torsion', 'diagonal', 'mode_shape_1', 'mode_shape_2'],
  // 'pressure+velocity' is the coupled Target Key the summary actually carries
  // (components pressure + velocity x/y/z). The bare velocity/pressure/pv_coupled/
  // body_pressure tokens are pre-rename leftovers, filtered out if absent from data.
  'drivaernet_3d_2d_centerplane': ['pressure+velocity', 'velocity', 'pressure', 'pv_coupled', 'body_pressure'],
  // NOTE: coupled/modal datasets below (drivaerml surface/volume, deepwheel/deepjeb modal)
  // are intentionally NOT listed here — their published `Target Key` label is currently in a
  // transitional dual state (e.g. pwss_coupled vs pressure+wall_shear_stress, mode7_mode11 vs
  // natural_frequencies) pending the full regen, so a hardcoded order risks an empty filter.
  // They fall back to getTargetKeysForDataset()'s unique.sort(), which is robust to either label.
  'deepjeb_2d_2d_structural': ['stress', 'disp'],
  'pdebenchdarcy_2d_2d_pressure': ['pressure'],
  'airfrans_2d_2d_flow': ['u', 'v', 'p_over_rho', 'nu_t'],
  'deepwheel_3d_1d': ['mass', 'mode7', 'mode11'],
  'deepwheel_3d_1d_mass': ['mass'],
  'deepwheel_3d_1d_modal': ['natural_frequencies'],
  'deepwheel_2d_1d': ['mass', 'mode7', 'mode11'],
  'deepwheel_2d_1d_mass': ['mass'],
  'deepwheel_2d_1d_modal': ['natural_frequencies'],
  'deepwheel_2d_2d': ['depth'],
  'deepwheel_2d_2d_depth': ['depth'],
  'concrete_1d_1d_strength': ['strength'],
  'airfoil_1d_1d_noise': ['scaled_sound_pressure_db'],
  'cmapss_1dt_1d_rul': ['rul'],
};

const DIMENSION_ORDER = [
  // milestone9.x summary `Component` vocabulary (physical quantity; the x/y/z
  // split now lives in the separate `Axis` column, so components are axis-free).
  'displacement', 'von_mises',
  'mode_shape_1', 'mode_shape_2',
  'pressure', 'wall_shear_stress', 'body_pressure',
  'totalpcoeff', 'velocity', 'vorticity',
  // scalar quantities (deepwheel_*_1d) — mass first, then numeric mode order (7 before 11),
  // so the Target=All scalar gallery strips order as mass → mode7 → mode11 (filter order).
  'mass',
  'mode_freq_7', 'mode_freq_11',
  // legacy explorer channel tokens (axis baked into the name) — kept so any
  // pre-migration Component values still sort ahead of the alphabetic fallback.
  'disp_x', 'disp_y', 'disp_z', 'stress',
  'mode_x', 'mode_y', 'mode_z',
  'velocity_x', 'velocity_y', 'velocity_z',
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
 * Get available dimensions for a given dataset + target key from data (custom ordered)
 */
function getDimensionsForTargetKey(data, dataset, targetKey) {
  if (isAirfransLike(dataset)) return [...AIRFRANS_COMPONENTS];   // velocity/pressure/turbulence (channels → components)
  const unique = [...new Set(
    data.filter(r => {
      if (dataset && r['Dataset'] !== dataset) return false;
      if (targetKey && r['Target Key'] !== targetKey) return false;
      return true;
    }).map(r => r['Component']).filter(Boolean)
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
  'gan3d':           { name: '3D-GAN',       type: 'GAN' },
  'deepsdf':         { name: 'DeepSDF',      type: 'Implicit (SDF)' },
  'pointflow':       { name: 'PointFlow',    type: 'Flow (Normalizing)' },
  'shapegf':         { name: 'ShapeGF',      type: 'Score-based' },
  'atlasnet':        { name: 'AtlasNet',     type: 'Auto-Decoder' },
  'diffusionpointcloud': { name: 'Diffusion3D', type: 'Diffusion' },
  'pointnet':        { name: 'PointNet',     type: 'PointNet' },
  'regdgcnn':        { name: 'RegDGCNN',     type: 'GNN (DGCNN)' },
  'transolver':      { name: 'Transolver',   type: 'Transformer' },
  'geofno':          { name: 'GeoFNO',       type: 'Fourier Neural Operator' },
  'linearno':        { name: 'LinearNO',     type: 'Neural Operator (Linear Attn)' },
  'linearno_big':    { name: 'LinearNO-Big', type: 'Neural Operator (Linear Attn)' },
  'geotransolver':   { name: 'GeoTransolver', type: 'Transformer (Geo)' },
  'domino':          { name: 'DoMINO',       type: 'Neural Operator' },

  // 3D scalar prediction (DeepWheel · mass/mode7/mode11) — paper-default + small variants
  'pointnet_scalar':                { name: 'PointNet',                type: 'PointNet' },
  'pointnet2_scalar':               { name: 'PointNet++',              type: 'PointNet++' },
  'pointnet2_lite_scalar':          { name: 'PointNet++ Lite',         type: 'PointNet++' },
  'dgcnn_scalar':                   { name: 'DGCNN',                   type: 'GNN (DGCNN)' },
  'pct_scalar':                     { name: 'PCT',                     type: 'Transformer' },
  'pct_small_scalar':               { name: 'PCT-Small',               type: 'Transformer' },
  'point_transformer_scalar':       { name: 'Point Transformer',       type: 'Transformer' },
  'point_transformer_small_scalar': { name: 'Point Transformer-Small', type: 'Transformer' },
  'pointmlp_scalar':                { name: 'PointMLP',                type: 'MLP' },
  'pointmlp_elite_scalar':          { name: 'PointMLP-Elite',          type: 'MLP' },

  // 2D scalar prediction (DeepWheel)
  'simplecnn':       { name: 'SimpleCNN',       type: 'CNN (Basic)' },
  'resnet18':        { name: 'ResNet-18',       type: 'CNN (Pretrained)' },
  'resnet34':        { name: 'ResNet-34',       type: 'CNN (Pretrained)' },
  'efficientnet_b0': { name: 'EfficientNet-B0', type: 'CNN (Pretrained)' },
  'convnext_tiny':   { name: 'ConvNeXt-Tiny',   type: 'CNN (Pretrained)' },
  'densenet121':     { name: 'DenseNet-121',    type: 'CNN (Pretrained)' },
  'vit_tiny':        { name: 'ViT-Tiny',        type: 'Transformer' },

  // 2D field prediction (DeepWheel · depth)
  'unet_simple':     { name: 'U-Net',           type: 'U-Net (Basic)' },
  'resnet_unet':     { name: 'ResNet-UNet',     type: 'U-Net (Pretrained)' },
  'attention_unet':  { name: 'Attention U-Net', type: 'U-Net (Attention)' },
  'unetpp':          { name: 'U-Net++',         type: 'U-Net (Nested)' },
  'segformer_b0':    { name: 'SegFormer-B0',    type: 'Transformer' },
  'fpn_resnet18':    { name: 'FPN (ResNet-18)', type: 'FPN' },
  'glpn':            { name: 'GLPN',            type: 'DPT (Depth)' },
  'dpt_hybrid':      { name: 'DPT-Hybrid',      type: 'DPT (Depth)' },

  // 1D scalar prediction — tabular (concrete / airfoil)
  'mlp':              { name: 'MLP',              type: 'MLP' },
  'ft_transformer':   { name: 'FT-Transformer',   type: 'Tabular Transformer' },
  'node':             { name: 'NODE',             type: 'Tabular (Oblivious Trees)' },
  'tabnet':           { name: 'TabNet',           type: 'Tabular (Attentive)' },
  'tabpfn':           { name: 'TabPFN',           type: 'Foundation (In-Context)' },
  'xgboost':          { name: 'XGBoost',          type: 'GBDT' },
  'lightgbm':         { name: 'LightGBM',         type: 'GBDT' },
  'random_forest':    { name: 'Random Forest',    type: 'Bagged Trees' },
  'gaussian_process': { name: 'Gaussian Process', type: 'GP' },
  'ridge':            { name: 'Ridge',            type: 'Linear' },
  // 1D scalar prediction — timeseries RUL (CMAPSS)
  'lstm_rul':         { name: 'LSTM',             type: 'RNN' },
  'bilstm_rul':       { name: 'BiLSTM',           type: 'RNN' },
  'dcnn_rul':         { name: 'DCNN',             type: 'CNN (1D)' },
  'tcn':              { name: 'TCN',              type: 'CNN (Dilated)' },
  'cnn_lstm':         { name: 'CNN-LSTM',         type: 'Hybrid (CNN+LSTM)' },
  'dast':             { name: 'DAST',             type: 'Transformer' },
};

const DATASET_DISPLAY = {
  'deepjeb_2d_2d': 'DeepJEB',
  'drivaernet_2d_2d': 'DrivAerNet',
  'deepjeb_3d_3d': 'DeepJEB',
  'drivaernet_3d_3d': 'DrivAerNet',
  'deepjeb_3d_2d': 'DeepJEB',
  'deepjeb_3d_2d_vertical': 'DeepJEB',
  'deepjeb_3d_2d_horizontal': 'DeepJEB',
  'deepjeb_3d_2d_torsion': 'DeepJEB',
  'deepjeb_3d_2d_diagonal': 'DeepJEB',
  'deepjeb_3d_2d_modal': 'DeepJEB',
  'drivaernet_3d_2d_centerplane': 'DrivAerNet',
  'drivaernet_3d_2d_surface': 'DrivAerNet',   // milestone9.x: re-derived from retired drivaernet_pressure_3d_3d
  'drivaernet_3d_3d_surface': 'DrivAerNet',   // pre-rename id still used by the published inference tree
  'drivaerml_3d_2d_surface': 'DrivAerML',
  'drivaerml_3d_3d_surface': 'DrivAerML',     // pre-rename id still used by the published inference tree
  'drivaerml_3d_3d_volume': 'DrivAerML',
  'deepwheel_3d_1d': 'DeepWheel',
  'deepwheel_3d_1d_mass': 'DeepWheel',
  'deepwheel_3d_1d_modal': 'DeepWheel',
  'deepwheel_3d_3d': 'DeepWheel',
  'deepwheel_2d_1d': 'DeepWheel',
  'deepwheel_2d_1d_mass': 'DeepWheel',
  'deepwheel_2d_1d_modal': 'DeepWheel',
  'deepwheel_2d_2d': 'DeepWheel',
  'deepwheel_2d_2d_depth': 'DeepWheel',
  'deepjeb_2d_2d_structural': 'DeepJEB',
  'pdebenchdarcy_2d_2d_pressure': 'PDEBench-Darcy',
  'airfrans_2d_2d_flow': 'AirfRANS',
  'concrete_1d_1d_strength': 'Concrete',
  'airfoil_1d_1d_noise': 'Airfoil',
  'cmapss_1dt_1d_rul': 'CMAPSS',
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

// Canonical dataset order: DeepJEB → DeepWheel → DrivAerNet. CSV rows arrive
// in Step-B insertion order (deepjeb → drivaernet → deepwheel for 3D Gen),
// which leaks into any `[...new Set(...)]` of `r['Dataset']`. Pass the array
// through this helper before rendering buttons / output rows so the visible
// order matches the curated narrative on the site.
// Canonical family order for filter pills / rows. 3D/2D engineering families
// first, then the 1D tabular/timeseries set (airfoil → concrete → cmapss, the
// timeseries one last). Extend here to place a new source.
const _DATASET_RANK = {
  deepjeb: 0, deepwheel: 1, drivaerml: 2, drivaernet: 3,
  airfrans: 4, pdebenchdarcy: 5,
  airfoil: 6, concrete: 7, cmapss: 8,
};
function _datasetFamily(id) {
  const s = (id || '').toLowerCase();
  for (const k of Object.keys(_DATASET_RANK)) if (s.startsWith(k)) return k;
  return '';
}
function sortDatasets(arr) {
  return [...arr].sort((a, b) => {
    const ra = _DATASET_RANK[_datasetFamily(a)];
    const rb = _DATASET_RANK[_datasetFamily(b)];
    if (ra !== rb) return (ra ?? 999) - (rb ?? 999);
    return String(a).localeCompare(String(b));
  });
}

function displayResolution(res, dim) {
  if (!res) return '-';
  if (dim === '3d' && typeof res === 'number') return `${res} points`;
  return String(res);
}

// ════════════════════════════════════════════════════════════════════════
// Filter taxonomy (redesign 2026-06-15): Dataset → Target → Component → Axis
// ════════════════════════════════════════════════════════════════════════
// The summary stores one *split* dataset per engineering problem
// (deepjeb_3d_2d_vertical …). The UI groups those under one friendly
// **umbrella** ("DeepJEB") and exposes the per-problem discriminator as
// **Target**. Target has two flavours, decided purely by the data:
//   · scenario-type — the umbrella spans >1 dataset id; each Target option IS a
//     dataset (load case / region / analysis). label = scenario token.
//   · channel-type  — the umbrella is a single dataset with >1 Target Key
//     column value (airfrans u/v/p/nu_t, 2D-structural stress/disp). label = TK.
// Component (physical quantity) and Axis (x/y/z) are the canonical summary
// columns; Axis drives the per-sample viewer + metrics table only (BenchRank is
// per-component/vector). Everything degrades gracefully for unregistered data.

// Friendly umbrella label (reuse the academic display map).
function datasetUmbrella(id) { return displayDataset(id); }

// Per-dataset scenario token from the registry ('' when none/unregistered).
function datasetScenarioToken(id) { return getDatasetMeta(id)?.scenario || ''; }

// Friendly labels for scenario tokens (the Target pills of scenario-type umbrellas).
const SCENARIO_DISPLAY = {
  vertical: 'Vertical', horizontal: 'Horizontal', torsion: 'Torsion', diagonal: 'Diagonal',
  modal: 'Modal', centerplane: 'Center Plane', surface: 'Surface', volume: 'Volume',
  mass: 'Mass', flow: 'Flow', depth: 'Depth', structural: 'Structural',
  pressure: 'Pressure', strength: 'Strength', noise: 'Noise', rul: 'RUL',
};
function scenarioLabel(tok) {
  if (!tok) return tok;
  return SCENARIO_DISPLAY[tok] || (tok.charAt(0).toUpperCase() + tok.slice(1));
}

// Canonical order for scenario-type Target pills (engineering reading order, not
// alphabetic). Cross-umbrella total order chosen so each umbrella's subset comes
// out right: deepjeb vertical→…→modal; drivaernet surface→centerplane; drivaerml
// surface→volume; deepwheel mass→modal. Unlisted tokens fall to the end.
const SCENARIO_ORDER = [
  'vertical', 'horizontal', 'diagonal', 'torsion',
  'mass', 'surface', 'volume', 'centerplane', 'modal',
  'flow', 'depth', 'structural', 'pressure', 'strength', 'noise', 'rul',
];
function scenarioRank(tok) {
  const i = SCENARIO_ORDER.indexOf(tok);
  return i === -1 ? SCENARIO_ORDER.length : i;
}

// Friendly Component labels. NOTE: both `von_mises` (3D field) and `stress` (2D
// structural) are the SAME quantity (von Mises equivalent stress) → unified to
// "Stress" with a precise hover; data tokens are untouched.
const COMPONENT_DISPLAY = {
  displacement: 'Displacement', disp: 'Displacement',
  von_mises: 'Stress', stress: 'Stress',
  mode_shape_1: 'Mode Shape 1', mode_shape_2: 'Mode Shape 2',
  pressure: 'Pressure', velocity: 'Velocity', turbulence: 'Turbulence', wall_shear_stress: 'Wall Shear Stress',
  totalpcoeff: 'Total-p Coeff.', vorticity: 'Vorticity', body_pressure: 'Surface Pressure',
  mode_freq_7: 'Mode 7', mode_freq_11: 'Mode 11', mass: 'Mass',
};
const COMPONENT_TOOLTIP = {
  von_mises: 'von Mises equivalent stress', stress: 'von Mises equivalent stress',
};
function componentLabel(tok) { return COMPONENT_DISPLAY[tok] || tok; }
function componentTooltip(tok) { return COMPONENT_TOOLTIP[tok] || ''; }

// Group the dataset ids present in `data` by umbrella, preserving the canonical
// family order. → { order: [umbrella…], byUmbrella: { umbrella: [datasetId…] } }
function umbrellasInData(data) {
  const ids = sortDatasets([...new Set(data.map(r => r['Dataset']).filter(Boolean))]);
  const order = [];
  const byUmbrella = {};
  ids.forEach(id => {
    const u = datasetUmbrella(id);
    if (!byUmbrella[u]) { byUmbrella[u] = []; order.push(u); }
    byUmbrella[u].push(id);
  });
  return { order, byUmbrella };
}

// Target options for an umbrella → [{ key, label, datasetId, targetKey, kind }].
//   kind 'scenario' → umbrella spans >1 dataset id (each is one option)
//   kind 'channel'  → single dataset, options = its Target Key column values
function getTargetsForUmbrella(data, umbrella) {
  const ids = [...new Set(
    data.filter(r => datasetUmbrella(r['Dataset']) === umbrella).map(r => r['Dataset']).filter(Boolean)
  )].sort((a, b) => scenarioRank(datasetScenarioToken(a)) - scenarioRank(datasetScenarioToken(b)));
  if (ids.length > 1) {
    return ids.map(id => {
      const tks = getTargetKeysForDataset(data, id);
      const scen = datasetScenarioToken(id);
      return { key: scen || id, label: scenarioLabel(scen) || id, datasetId: id,
               targetKey: tks[0] || null, kind: 'scenario' };
    });
  }
  const id = ids[0];
  if (!id) return [];
  if (isAirfransLike(id)) {
    // One coupled RANS scenario; its channels (u/v/p_over_rho/nu_t) become
    // Component {Velocity, Pressure, Turbulence} + Axis {x,y} (see airfransChannel).
    return [{ key: 'flow', label: 'Flow', datasetId: id, targetKey: null, kind: 'scenario' }];
  }
  return getTargetKeysForDataset(data, id).map(tk => ({
    key: tk, label: getTargetKeyLabel(id, tk), datasetId: id, targetKey: tk, kind: 'channel',
  }));
}

// Per-umbrella aggregate leaderboard key (for scenario-type Target=All). Mirrors
// what benchmark_C writes for the umbrella roll-up: datasetToLeaderboardKey with
// the scenario token stripped (deepjeb_vertical → "deepjeb", deepwheel_mass →
// "deepwheel", drivaerml_surface/volume → "drivaerml").
function umbrellaLeaderboardKey(data, umbrella) {
  const id = (data.find(r => datasetUmbrella(r['Dataset']) === umbrella) || {})['Dataset'];
  if (!id) return null;
  const dsKey = datasetToLeaderboardKey(id);
  const scen = datasetScenarioToken(id);
  return (scen && dsKey.endsWith('_' + scen)) ? dsKey.slice(0, -(scen.length + 1)) : dsKey;
}

// (Component, Axis) → EVAL3D per-sample viewer channel token (axis-baked vocab:
// disp_x / stress / velocity_y / wss_z …). Returns null for unmapped components.
const _COMPONENT_AXIS_CHANNEL = {
  displacement: a => `disp_${a}`,
  von_mises: () => 'stress',
  mode_shape_1: a => `mode_${a}`,
  mode_shape_2: a => `mode_${a}`,
  pressure: () => 'pressure',
  velocity: a => `velocity_${a}`,
  wall_shear_stress: a => `wss_${a}`,
  totalpcoeff: () => 'totalpcoeff',
  vorticity: a => `vorticity_${a}`,
  body_pressure: () => 'body_pressure',
};
function componentAxisToChannel(component, axis) {
  const fn = _COMPONENT_AXIS_CHANNEL[component];
  return fn ? fn(axis || 'x') : null;
}

// Component → viewer bin-token. For modal the mode_shape IS the bin token; every
// other 3D-field dataset has exactly one bin token in EVAL3D_CHANNELS.
function componentBinToken(datasetId, component) {
  const binMap = (typeof EVAL3D_CHANNELS !== 'undefined') ? EVAL3D_CHANNELS[datasetId] : null;
  if (!binMap) return null;
  if (binMap[component]) return component;
  return Object.keys(binMap)[0] || null;
}

// The viewer channels that belong to a Component (the subset of its bin token's
// channels). Lets the per-sample viewer cycle within e.g. displacement's
// disp_x/y/z without leaking into the sibling stress channel. Falls back to the
// full channel list when the (Component, Axis) vocabulary can't be mapped.
function componentChannels(datasetId, component, axis) {
  const binTk = componentBinToken(datasetId, component);
  const all = (typeof EVAL3D_CHANNELS !== 'undefined' && EVAL3D_CHANNELS[datasetId]
    ? EVAL3D_CHANNELS[datasetId][binTk] : null) || [];
  if (axis) {                                  // a specific axis → pin to one channel
    const one = componentAxisToChannel(component, axis);
    const hit = all.filter(ch => ch === one);
    if (hit.length) return hit;
  }
  const want = new Set(['x', 'y', 'z', null].map(a => componentAxisToChannel(component, a)));
  const sub = all.filter(ch => want.has(ch));
  return sub.length ? sub : all;
}

// Axis options for a (dataset, targetKey, component) from the summary Axis column
// (blank for scalars → []). Ordered x, y, z.
function getAxesFor(data, dataset, targetKey, component) {
  if (isAirfransLike(dataset)) return component === 'velocity' ? ['x', 'y'] : [];   // u→x, v→y; pressure/turbulence scalar
  const axes = [...new Set(
    data.filter(r => (!dataset || r['Dataset'] === dataset)
                  && (!targetKey || r['Target Key'] === targetKey)
                  && (!component || r['Component'] === component))
        .map(r => r['Axis']).filter(Boolean)
  )];
  const order = { x: 0, y: 1, z: 2 };
  return axes.sort((a, b) => (order[a] ?? 9) - (order[b] ?? 9));
}

// ── AirfRANS channel taxonomy ───────────────────────────────────────────
// AirfRANS is ONE coupled RANS flow problem, trained as 4 single-channel runs
// (Target Key = u / v / p_over_rho / nu_t). Present it like a coupled field:
// Target = "Flow" (one scenario) → Component {Velocity, Pressure, Turbulence}
// → Axis {x, y} for Velocity. The per-channel leaderboard + image artifacts
// already exist keyed by the channel, so (Component, Axis) maps straight back
// to it — no data/Step-B/Step-C change, purely a friendlier presentation.
const AIRFRANS_DATASET = 'airfrans_2d_2d_flow';
function isAirfransLike(dataset) { return dataset === AIRFRANS_DATASET; }
const AIRFRANS_COMPONENTS = ['velocity', 'pressure', 'turbulence'];
const _AIRFRANS_CHANNEL = {              // (component, axis) → channel Target Key
  velocity: { x: 'u', y: 'v' },
  pressure: { '': 'p_over_rho' },
  turbulence: { '': 'nu_t' },
};
// Velocity has no combined u+v board, so it always resolves through an axis
// (default x). Component=All (null component) → null → the Flow umbrella board.
function airfransChannel(component, axis) {
  const m = _AIRFRANS_CHANNEL[component];
  if (!m) return null;
  return (component === 'velocity') ? (m[axis || 'x'] || m.x) : (m[''] || null);
}

// ── Metric Categories ──

const CATEGORY_ORDER_GEN = ['Efficiency', 'Fidelity', 'Diversity', 'Structural'];
const CATEGORY_ORDER_PRED = ['Efficiency', 'Absolute Error', 'Relative Error', 'Model Fit', 'Worst-case Error', 'Threshold Accuracy', 'Rank Correlation', 'Directional Accuracy', 'Pattern Quality'];

const CATEGORY_COLORS = {
  'Efficiency':           'rgba(56,189,248,0.12)',
  'Fidelity':             'rgba(52,211,153,0.1)',
  'Diversity':            'rgba(153,97,255,0.1)',
  'Structural':     'rgba(20,184,166,0.1)',
  'Absolute Error':       'rgba(248,113,113,0.1)',
  'Relative Error':       'rgba(251,146,60,0.1)',
  'Model Fit':            'rgba(52,211,153,0.1)',
  'Worst-case Error':     'rgba(244,114,182,0.1)',
  'Threshold Accuracy':   'rgba(132,204,22,0.1)',
  'Rank Correlation':     'rgba(234,179,8,0.1)',
  'Directional Accuracy': 'rgba(56,189,248,0.1)',
  'Pattern Quality':      'rgba(192,132,252,0.1)',
};

const CATEGORY_TEXT_COLORS = {
  'Efficiency':           '#38bdf8',
  'Fidelity':             '#34d399',
  'Diversity':            '#9961FF',
  'Structural':     '#14b8a6',
  'Absolute Error':       '#f87171',
  'Relative Error':       '#fb923c',
  'Model Fit':            '#34d399',
  'Worst-case Error':     '#f472b6',
  'Threshold Accuracy':   '#84cc16',
  'Rank Correlation':     '#eab308',
  'Directional Accuracy': '#38bdf8',
  'Pattern Quality':      '#c084fc',
};

function getMetricCategory(metricName, dim, task) {
  const clean = metricName.replace(/\s*[↑↓]\s*$/,'').trim();
  if (['Parameters (M)','Training Time (s)','Inference Time (s)'].includes(clean)) return 'Efficiency';
  if (task === 'generation') {
    if (['IS','FID','MV-FID','FPD','CD','EMD','PSNR','Precision','Density'].includes(clean)) return 'Fidelity';
    if (['LPIPS','MS-SSIM','F-Score','Recall','Coverage'].includes(clean)) return 'Diversity';
    if (['Manifold-Δ','Uniformity-Δ'].includes(clean)) return 'Structural';
  } else {
    // Prediction (2D field/scalar, 3D field/scalar) shares the regression metric taxonomy
    if (['MAE','RMSE'].includes(clean)) return 'Absolute Error';
    if (['MAPE (%)','Rel-L2','AbsRel','sqRel'].includes(clean)) return 'Relative Error';
    if (['R²','PSNR','SSIM'].includes(clean)) return 'Model Fit';
    if (['MaxAE'].includes(clean)) return 'Worst-case Error';
    if (['δ<1.25','δ<1.25²','δ<1.25³'].includes(clean)) return 'Threshold Accuracy';
    if (['Pearson','Spearman'].includes(clean)) return 'Rank Correlation';
    if (['MAC'].includes(clean)) return 'Directional Accuracy';
    if (['Sign Agree','Extremal Agree'].includes(clean)) return 'Pattern Quality';
  }
  return 'Other';
}

/**
 * Group metrics by category, respecting category order
 * Returns: [{ category, color, textColor, metrics: [metricName, ...] }, ...]
 */
function groupMetricsByCategory(metrics, dim, task) {
  const order = task === 'generation' ? CATEGORY_ORDER_GEN : CATEGORY_ORDER_PRED;
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
    .replace('Training Time', 'Train Time')
    .replace('Inference Time', 'Infer Time')
    .replace('Parameters', 'Params');
}

/**
 * Load per-model publication metadata for analysis.html → Progression.
 * Cached after first call.  Returns the inner `models` map (not the wrapper).
 */
let _modelsMetaCache = null;
async function loadModelsMeta() {
  if (_modelsMetaCache) return _modelsMetaCache;
  const base = `${INFERENCE_BASE.replace('/inference','')}/models_meta.json`;
  // Retry transient failures before surfacing the "Couldn't load data" error
  // card on Progression/Frontier. The fetch can fail when: the file 404s
  // momentarily during a website republish, a read lands mid-write and the JSON
  // parse throws, or the browser cached a 404 from before the file was generated
  // (under the same ?v= key). Each retry appends a unique cache-buster and forces
  // a cache-bypassing reload so a stale cached error response can't keep being
  // served — mirrors the force-refetch approach used for republished 3D tiles.
  let lastErr;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const url = attempt === 0
        ? `${base}?v=${DATA_BUILD}`
        : `${base}?v=${DATA_BUILD}&_r=${Date.now()}_${attempt}`;
      const resp = await fetch(url, attempt === 0 ? undefined : { cache: 'reload' });
      if (!resp.ok) throw new Error(`models_meta.json HTTP ${resp.status}`);
      const j = await resp.json();
      _modelsMetaCache = j.models || {};
      return _modelsMetaCache;
    } catch (e) {
      lastErr = e;
      if (attempt < 2) await new Promise(r => setTimeout(r, 300 * (attempt + 1)));
    }
  }
  throw lastErr;
}

/**
 * Load 3D field per-sample residuals for analysis.html Distribution &
 * Disagreement tabs.  Schema (written by Step B's calculate_per_sample_metrics):
 *   { model, dataset, data_size, target_key, n_samples,
 *     samples: { mae, rmse, mape, rel_l2, max_ae } } — each array length = n_samples.
 * Cached per (model, size, dataset, targetKey) tuple.
 */
const _fieldResidualsCache = {};
async function loadFieldPerSampleResiduals(model, dataSize, dataset, targetKey) {
  const key = `${model}|${dataSize}|${dataset}|${targetKey}`;
  if (_fieldResidualsCache[key]) return _fieldResidualsCache[key];
  // Canonical Step A/B layout: experiments/inference/{cat}/{model}_{size}/{dataset}/.
  // 3d-field split datasets run tokenless, so the run-name carries no target suffix
  // and the child dir is the full dataset id (targetKey lives only in the row data).
  const url = `${INFERENCE_BASE}/dimension_3d/prediction/field/${model}_${dataSize}/${dataset}/per_sample_residuals.json?v=${DATA_BUILD}`;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`per_sample_residuals.json HTTP ${resp.status} (${url})`);
  const j = await resp.json();
  _fieldResidualsCache[key] = j;
  return j;
}

/**
 * Inline error card for failed CSV/JSON fetches.
 * Used by analysis.html categories — keeps a fetch failure scoped to one
 * category container instead of leaving a blank screen.  Style follows the
 * existing site conventions (glass-like card, red accent matching .warn-box).
 */
function renderError(container, msg, retryFn) {
  if (!container) return;
  // Build via DOM (not innerHTML) so caller-supplied `msg` — which may contain
  // URL-derived strings like target keys — cannot inject markup.  The previous
  // template literal also stringified `retryFn`, which lost its closure scope
  // and was a latent XSS sink.  addEventListener fixes both.
  container.textContent = '';
  const card = document.createElement('div');
  card.style.cssText = 'margin:14px 0; padding:14px 18px;' +
    'background: rgba(239,68,68,0.06);' +
    'border: 1px solid rgba(239,68,68,0.18);' +
    'border-radius: 10px;' +
    'color: var(--red-400, #f87171);' +
    'font-size: 13px; line-height: 1.6;';
  const title = document.createElement('div');
  title.style.cssText = 'font-weight: 700; margin-bottom: 4px;';
  title.textContent = "Couldn't load data";
  const body = document.createElement('div');
  body.style.cssText = 'color: rgba(255,255,255,0.55); font-size: 12px;';
  body.textContent = msg || 'Check the browser console for details.';
  card.appendChild(title);
  card.appendChild(body);
  if (typeof retryFn === 'function') {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = 'Retry';
    btn.style.cssText = 'margin-top:10px; padding:5px 14px; border-radius:8px;' +
      'background: rgba(239,68,68,0.12); border: 1px solid rgba(239,68,68,0.3);' +
      'color: #fff; font-size: 12px; font-weight: 600; cursor: pointer;' +
      'transition: transform 0.4s var(--ease-snappy), background 0.25s ease;';
    btn.addEventListener('click', () => { try { retryFn(); } catch (e) { console.error(e); } });
    card.appendChild(btn);
  }
  container.appendChild(card);
}
