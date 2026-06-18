(function () {
  'use strict';

  const INDEX_URL = './docs.json';
  const MAX_RESULTS = 12;
  const STOP_WORDS = new Set([
    'a', 'an', 'and', 'are', 'as', 'at', 'be', 'but', 'by', 'for', 'from',
    'has', 'have', 'in', 'into', 'is', 'it', 'its', 'not', 'of', 'on', 'or',
    'that', 'the', 'their', 'this', 'to', 'was', 'were', 'with', 'you', 'your'
  ]);

  document.addEventListener('DOMContentLoaded', () => {
    init().catch(reportError);
  });

  async function init() {
    const resultsEl = document.getElementById('results-container');
    if (!resultsEl) return;

    const params = new URLSearchParams(location.search);
    const query = (params.get('query') || '').trim();

    const header = document.createElement('h2');
    header.textContent = query ? `Results for "${query}"` : 'Enter a query above';
    resultsEl.appendChild(header);
    if (!query) return;

    if (location.protocol === 'file:') {
      throw new Error('Search requires the local server because the index is loaded from docs.json.');
    }

    const docs = await loadDocs(INDEX_URL);
    const hits = searchDocs(docs, query);
    renderResults(resultsEl, hits, query);
  }

  async function loadDocs(url) {
    const response = await fetch(url, { cache: 'force-cache' });
    if (!response.ok) {
      throw new Error(`Could not load the search index: HTTP ${response.status}`);
    }
    return response.json();
  }

  function searchDocs(docs, query) {
    const normalizedQuery = normalize(query);
    const terms = tokenize(query);
    if (!terms.length) return [];

    return docs
      .map(doc => scoreDoc(doc, normalizedQuery, terms))
      .filter(hit => hit.score > 0)
      .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title))
      .slice(0, MAX_RESULTS);
  }

  function scoreDoc(doc, normalizedQuery, terms) {
    const title = doc.title || '';
    const tags = Array.isArray(doc.tags) ? doc.tags.join(' ') : '';
    const excerpt = doc.excerpt || '';
    const content = doc.content || '';
    const haystacks = {
      title: normalize(title),
      tags: normalize(tags),
      excerpt: normalize(excerpt),
      content: normalize(content)
    };

    let score = 0;
    let coverage = 0;
    const matchedTerms = new Set();

    if (haystacks.title === normalizedQuery) score += 180;
    if (haystacks.title.includes(normalizedQuery)) score += 90;
    if (haystacks.excerpt.includes(normalizedQuery)) score += 38;
    if (haystacks.content.includes(normalizedQuery)) score += 24;

    terms.forEach(term => {
      const titleHits = countOccurrences(haystacks.title, term);
      const tagHits = countOccurrences(haystacks.tags, term);
      const excerptHits = countOccurrences(haystacks.excerpt, term);
      const contentHits = countOccurrences(haystacks.content, term);
      const partialTitle = titleHits === 0 && hasPartialWord(haystacks.title, term);
      const partialContent = contentHits === 0 && hasPartialWord(haystacks.content, term);

      if (titleHits || tagHits || excerptHits || contentHits || partialTitle || partialContent) {
        coverage += 1;
        matchedTerms.add(term);
      }

      score += titleHits * 42;
      score += tagHits * 34;
      score += excerptHits * 13;
      score += Math.min(contentHits, 8) * 5;
      if (partialTitle) score += 18;
      if (partialContent) score += 3;
    });

    const coverageRatio = coverage / terms.length;
    score *= 0.45 + coverageRatio;
    if (coverage === terms.length && terms.length > 1) score += 28;
    if (coverage === 1 && terms.length > 2) score *= 0.55;

    return {
      ...doc,
      score,
      matchedTerms: [...matchedTerms],
      snippet: buildSnippet(doc, terms)
    };
  }

  function renderResults(resultsEl, hits, query) {
    if (!hits.length) {
      const p = document.createElement('p');
      p.textContent = `No matches for "${query}". Try fewer or broader terms.`;
      resultsEl.appendChild(p);
      return;
    }

    const list = document.createElement('ul');
    list.className = 'result-list';
    hits.forEach(hit => list.appendChild(renderItem(hit)));
    resultsEl.appendChild(list);
  }

  function renderItem(hit) {
    const li = document.createElement('li');
    li.className = 'result';

    const a = document.createElement('a');
    a.href = sanitizeURL(hit.url);
    a.textContent = hit.title || '(untitled)';

    const meta = document.createElement('div');
    meta.className = 'meta';
    const bits = [];
    if (hit.date) bits.push(new Date(hit.date).toLocaleDateString());
    if (Array.isArray(hit.tags) && hit.tags.length) bits.push(hit.tags.join(', '));
    if (hit.matchedTerms.length) bits.push(`matched: ${hit.matchedTerms.join(', ')}`);
    meta.textContent = bits.join(' / ');

    const snippet = document.createElement('p');
    snippet.innerHTML = highlight(escapeHtml(hit.snippet || hit.excerpt || ''), hit.matchedTerms);

    li.appendChild(a);
    if (meta.textContent) li.appendChild(meta);
    li.appendChild(snippet);
    return li;
  }

  function buildSnippet(doc, terms) {
    const source = collapseWhitespace(doc.content || doc.excerpt || '');
    const normalizedSource = normalize(source);
    const firstMatch = terms
      .map(term => normalizedSource.indexOf(term))
      .filter(index => index >= 0)
      .sort((a, b) => a - b)[0];

    if (firstMatch === undefined) {
      return trimToSentence(source, 220);
    }

    const start = Math.max(0, firstMatch - 90);
    const end = Math.min(source.length, firstMatch + 190);
    const prefix = start > 0 ? '...' : '';
    const suffix = end < source.length ? '...' : '';
    return `${prefix}${source.slice(start, end).trim()}${suffix}`;
  }

  function trimToSentence(text, length) {
    const clean = collapseWhitespace(text);
    if (clean.length <= length) return clean;
    return `${clean.slice(0, length).trim()}...`;
  }

  function tokenize(value) {
    return normalize(value)
      .split(/\s+/)
      .map(term => term.replace(/^[^a-z0-9]+|[^a-z0-9]+$/g, ''))
      .filter(term => term.length > 1 && !STOP_WORDS.has(term));
  }

  function normalize(value) {
    return String(value || '')
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  }

  function collapseWhitespace(value) {
    return String(value || '').replace(/\s+/g, ' ').trim();
  }

  function countOccurrences(text, term) {
    if (!text || !term) return 0;
    const re = new RegExp(`\\b${escapeRegex(term)}\\b`, 'g');
    return (text.match(re) || []).length;
  }

  function hasPartialWord(text, term) {
    return term.length > 3 && text.includes(term);
  }

  function highlight(escapedText, terms) {
    let out = escapedText;
    terms
      .filter(term => term.length > 1)
      .sort((a, b) => b.length - a.length)
      .forEach(term => {
        const re = new RegExp(`(${escapeRegex(term)})`, 'ig');
        out = out.replace(re, '<mark>$1</mark>');
      });
    return out;
  }

  function escapeHtml(value) {
    return String(value || '').replace(/[&<>"']/g, c => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    })[c]);
  }

  function escapeRegex(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function sanitizeURL(url) {
    if (typeof url === 'string' &&
        (url.startsWith('/') || url.startsWith('./') || url.startsWith('../') || /^https?:\/\//i.test(url))) {
      return url;
    }
    return '#';
  }

  function reportError(err) {
    console.error('[search]', err);
    const resultsEl = document.getElementById('results-container');
    if (!resultsEl) return;

    const p = document.createElement('p');
    p.textContent = `Could not load the search index (${err.message}).`;
    resultsEl.appendChild(p);
  }
})();
