// Lightweight URL hash ↔ state synchronization
// Persists filter state in the URL hash so refresh preserves selections.

function pushHashState(obj) {
  var params = new URLSearchParams();
  for (var k in obj) {
    if (obj[k] != null && obj[k] !== '') params.set(k, String(obj[k]));
  }
  var hash = params.toString();
  if (hash !== window.location.hash.slice(1)) {
    history.replaceState(null, '', '#' + hash);
  }
}

function readHashState() {
  var hash = window.location.hash.slice(1);
  if (!hash) return {};
  var params = new URLSearchParams(hash);
  var obj = {};
  params.forEach(function(v, k) { obj[k] = v; });
  return obj;
}
