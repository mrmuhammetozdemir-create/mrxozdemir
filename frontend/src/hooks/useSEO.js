import { useEffect } from 'react';

const cache = {};

/**
 * Fetches SEO settings for a page from the DB and applies them to document.head.
 * @param {string} pageId  - e.g. "home", "e-konut", "mega-projects"
 * @param {object} fallback - default values if DB doesn't have settings yet
 */
export function useSEO(pageId, fallback = {}) {
  useEffect(() => {
    const apply = (s) => {
      if (!s) return;
      if (s.title)          document.title = s.title;
      setMeta('description', s.description);
      setMeta('keywords',    s.keywords);
      setMeta('robots',      s.robots || 'index,follow');
      // Open Graph
      setOG('og:title',       s.og_title       || s.title);
      setOG('og:description', s.og_description || s.description);
      setOG('og:type',        'website');
      if (s.og_image) setOG('og:image', s.og_image);
      // Twitter card
      setMeta('twitter:card',        'summary_large_image');
      setMeta('twitter:title',       s.og_title  || s.title);
      setMeta('twitter:description', s.og_description || s.description);
    };

    // Apply fallback immediately so there's no flash
    if (fallback.title) apply(fallback);

    // Check cache
    if (cache[pageId]) { apply(cache[pageId]); return; }

    const API_BASE = process.env.REACT_APP_BACKEND_URL;
    fetch(`${API_BASE}/api/seo`)
      .then(r => r.json())
      .then(all => {
        if (all[pageId]) {
          cache[pageId] = all[pageId];
          apply(all[pageId]);
        }
      })
      .catch(() => {});
  }, [pageId]); // eslint-disable-line react-hooks/exhaustive-deps
}

function setMeta(name, content) {
  if (!content) return;
  let el = document.querySelector(`meta[name="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('name', name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setOG(property, content) {
  if (!content) return;
  let el = document.querySelector(`meta[property="${property}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('property', property);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}
