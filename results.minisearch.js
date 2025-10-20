(function () {
  'use strict';

  // ---- configuration ----
  const INDEX_URL = './docs.json'; // keep next to results.html

  // ---- bootstrap ----
  document.addEventListener('DOMContentLoaded', () => {
    init().catch(err => reportError(err));
  });

  // ---- main ----
  async function init() {
    const resultsEl = document.getElementById('results-container');
    if (!resultsEl) {
      console.warn('[search] #results-container not found');
      return;
    }

    const params = new URLSearchParams(location.search);
    const q = (params.get('query') || '').trim();

    const header = document.createElement('h2');
    header.textContent = q ? `Results for “${q}”` : 'Enter a query above';
    resultsEl.appendChild(header);
    if (!q) return;

    // Guard against file:// protocol
    if (location.protocol === 'file:') {
      throw new Error(
        "Cannot load search index from file://.\n\n👉 Start a local server:\n   python3 -m http.server 8080\nand open:\n   http://localhost:8080/results.html"
      );
    }

    // Make sure MiniSearch exists
    await ensureMiniSearch();

    const docs = await loadDocs(INDEX_URL);
    const mini = buildIndex(docs);
    const hits = mini.search(q, {
      fuzzy: 0.2,
      prefix: true,
      combineWith: 'AND'
    });

    renderResults(resultsEl, hits, q);
  }

  // ---- dynamic MiniSearch loader ----
  async function ensureMiniSearch() {
    if (typeof window.MiniSearch !== 'undefined') return;

    const cdns = [
      'https://unpkg.com/minisearch@6.3.0/dist/umd/index.min.js',
      'https://cdn.jsdelivr.net/npm/minisearch@6.3.0/dist/umd/index.min.js'
    ];

    for (const src of cdns) {
      try {
        await loadScript(src);
        if (typeof window.MiniSearch !== 'undefined') return;
      } catch (e) {
        console.warn('[search] Failed to load MiniSearch from', src);
      }
    }

    throw new Error(
      'MiniSearch could not be loaded from CDN.\nDownload it manually from https://unpkg.com/minisearch and include it with:\n<script defer src="./minisearch.min.js"></script> before this script.'
    );
  }

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = src;
      s.defer = true;
      s.onload = resolve;
      s.onerror = () => reject(new Error('Failed to load ' + src));
      document.head.appendChild(s);
    });
  }

  // ---- data loading ----
  async function loadDocs(url) {
    const r = await fetch(url, { cache: 'force-cache' });
    if (!r.ok) throw new Error(`Failed to load index: HTTP ${r.status} ${r.statusText}`);
    try {
      return await r.json();
    } catch {
      throw new Error('Index is not valid JSON.');
    }
  }

  // ---- index ----
  function buildIndex(docs) {
    const mini = new window.MiniSearch({
      fields: ['title', 'tags', 'content'],
      storeFields: ['id', 'title', 'url', 'excerpt', 'date', 'tags'],
      searchOptions: {
        boost: { title: 3, tags: 2, content: 1 },
        fuzzy: 0.2,
        prefix: true,
        combineWith: 'AND'
      }
    });
    mini.addAll(docs);
    return mini;
  }

  // ---- rendering ----
  function renderResults(resultsEl, hits, q) {
    if (!hits || !hits.length) {
      const p = document.createElement('p');
      p.textContent = `No matches for “${q}”. Try fewer or broader terms.`;
      resultsEl.appendChild(p);
      return;
    }

    const list = document.createElement('ul');
    list.style.listStyle = 'none';
    list.style.padding = '0';
    hits.forEach(hit => list.appendChild(renderItem(hit, q)));
    resultsEl.appendChild(list);
  }

  function renderItem(hit, q) {
    const li = document.createElement('li');
    li.style.margin = '1.1rem 0';

    const a = document.createElement('a');
    a.href = sanitizeURL(hit.url);
    a.textContent = hit.title || '(untitled)';
    a.style.textDecoration = 'none';
    a.style.color = 'inherit';

    const meta = document.createElement('div');
    meta.className = 'meta';
    const bits = [];
    if (hit.date) bits.push(new Date(hit.date).toLocaleDateString());
    if (Array.isArray(hit.tags) && hit.tags.length) bits.push(hit.tags.join(', '));
    meta.textContent = bits.join(' · ');

    const snippet = document.createElement('p');
    snippet.innerHTML = highlight(escapeHtml(hit.excerpt || ''), q);

    li.appendChild(a);
    if (meta.textContent) li.appendChild(meta);
    li.appendChild(snippet);
    return li;
  }

  // ---- helpers ----
  function escapeHtml(s) {
    return (s || '').replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[c]);
  }

  function escapeRegex(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function highlight(escapedText, query) {
    const terms = String(query).toLowerCase().split(/\s+/).filter(Boolean)
      .sort((a, b) => b.length - a.length);
    let out = escapedText;
    for (const t of terms) {
      const re = new RegExp(`(${escapeRegex(t)})`, 'ig');
      out = out.replace(re, '<mark>$1</mark>');
    }
    return out;
  }

  function sanitizeURL(url) {
    try {
      if (typeof url === 'string' &&
          (url.startsWith('/') || /^https?:\/\//i.test(url) ||
           url.startsWith('./') || url.startsWith('../'))) {
        return url;
      }
    } catch {}
    return '#';
  }

  function reportError(err) {
    console.error('[search] ', err);
    const resultsEl = document.getElementById('results-container');
    if (resultsEl) {
      const p = document.createElement('p');
      p.textContent = `⚠️ Could not load the search index (${err.message}).`;
      resultsEl.appendChild(p);
    }
  }

})();