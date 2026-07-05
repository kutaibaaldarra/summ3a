(function () {
  // island-core.js — simplified and less nested version
  const DEFAULT_LINKS = './island-links.json';
  const DEFAULT_DATA = './island-data.json';
  const FALLBACK_LINKS = [
    { label: 'ابدأ الآن', href: 'questionnaire.html', target: '_self', color: '#f68720' },
    { label: 'الباقات', href: 'packages.html', target: '_self', color: '#f97316' },
    { label: 'النتائج', href: 'results.html', target: '_self', color: '#14b8a6' },
    { label: 'استبيان', href: 'questionnaire.html#start', target: '_self', color: '#3b82f6' },
    { label: 'الشروط', href: 'terms.html', target: '_self', color: '#a855f7' }
  ];

  function safeQuery(sel, ctx = document) {
    try { return ctx.querySelector(sel); }
    catch (e) { console.warn('safeQuery error', e); return null; }
  }

  function fetchJSON(url) {
    return fetch(url).then(res => (res.ok ? res.json() : Promise.reject(new Error(res.statusText || 'Fetch error'))));
  }

  function createLinkEl(link, compact = false) {
    const a = document.createElement('a');
    a.href = link.href || '#';
    a.textContent = link.label || link.href || 'link';
    a.className = 'island-quick-link';
    a.setAttribute('role', 'link');
    a.setAttribute('aria-label', link.label || link.href || 'link');
    if (link.target) a.target = link.target;
    a.style.display = 'inline-flex';
    a.style.alignItems = 'center';
    a.style.gap = '6px';
    a.style.borderRadius = '999px';
    a.style.fontWeight = '700';
    a.style.textDecoration = 'none';
    a.style.color = '#111';
    a.style.background = link.color || 'rgba(255,255,255,0.92)';
    a.style.marginLeft = '6px';
    if (compact) {
      a.style.padding = '4px 6px';
      a.style.fontSize = '0.72rem';
      a.style.minWidth = '32px';
      a.style.maxWidth = '120px';
      a.style.whiteSpace = 'nowrap';
      a.style.overflow = 'hidden';
      a.style.textOverflow = 'ellipsis';
    } else {
      a.style.padding = '6px 8px';
      a.style.fontSize = '0.78rem';
    }
    a.dataset.islandLink = '1';
    return a;
  }

  function attachBasicHandlers(el, link) {
    el.setAttribute('tabindex', '0');
    el.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter' || ev.key === ' ') el.click();
    });
    el.addEventListener('click', (ev) => {
      try {
        if (globalThis && typeof globalThis.dispatchEvent === 'function') {
          globalThis.dispatchEvent(new CustomEvent('island.link.click', { detail: { label: link.label, href: link.href } }));
        }
      } catch (err) { console.warn(err); }
    });
  }

  function setOverflowState(cta, overflow, open = false) {
    if (!cta || !overflow) return;
    cta.setAttribute('aria-expanded', String(!!open));
    overflow.style.display = open ? 'block' : 'none';
    overflow.setAttribute('aria-hidden', String(!open));
    overflow.classList.toggle('open', !!open);
  }

  function navigateWithGsap(href) {
    if (!href) return;
    if (!globalThis.gsap) {
      globalThis.location.href = href;
      return;
    }
    try {
      const panel = document.getElementById('island-panel');
      const tl = globalThis.gsap.timeline({ onComplete: () => { globalThis.location.href = href; } });
      if (panel?.classList.contains('open')) {
        tl.to(panel, { opacity: 0, y: -8, duration: 0.18 });
      }
      tl.to(globalThis, { duration: 0.36, scrollTo: { y: 0 } });
    } catch (err) {
      console.warn('gsap navigation failed', err);
      globalThis.location.href = href;
    }
  }

  function appendToMainNav(links, options) {
    try {
      const mainNav = document.querySelector('#main-header .header-nav');
      if (!mainNav || options.renderToMainNav === false) return;
      const existing = Array.from(mainNav.querySelectorAll('a')).map(a => ({ href: a.getAttribute('href'), text: (a.textContent || '').trim() }));
      links.forEach(l => {
        const href = l.href || '#';
        let label = l.label || href;
        if (/^(ابدأ|ابدأ الآن)$/i.test(String(label).trim()) && /questionnaire/i.test(href)) {
          label = 'استبيان';
        }
        const exists = existing.some(e => e.href === href || e.text === label);
        if (exists) return;
        const a = document.createElement('a');
        a.href = href;
        a.textContent = label;
        if (l.target) {
          a.target = l.target;
        }
        a.className = 'header-nav-link plain';
        a.setAttribute('tabindex', '0');
        a.addEventListener('click', (ev) => {
          if (href.startsWith('#')) {
            ev.preventDefault();
            const target = document.querySelector(href);
            if (target) target.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        });
        mainNav.appendChild(a);
      });
    } catch (err) { console.warn('island-core: appendToMainNav error', err); }
  }

  const IslandCore = {
    links: [], data: [], options: {},
    async initIsland(opts = {}) {
      this.options = opts || {};
      this.links = await (async () => {
        try {
          const list = await fetchJSON(this.options.linksUrl || DEFAULT_LINKS);
          return list || [];
        } catch (err) {
          console.warn('island-core: failed to load links, using fallback', err);
          return FALLBACK_LINKS.slice();
        }
      })();
      this.data = await (async () => {
        try {
          const d = await fetchJSON(this.options.dataUrl || DEFAULT_DATA);
          return d || [];
        } catch (err) {
          console.warn('island-core: failed to load island data', err);
          return [];
        }
      })();
      this.renderHeaderLinks();
      this.renderPanelLinks();
      appendToMainNav(this.links, this.options);
    },
    renderHeaderLinks() {
      const headerContainer = document.getElementById('island-links-header');
      if (!headerContainer) return;
      headerContainer.setAttribute('role', 'navigation');
      headerContainer.setAttribute('aria-label', 'quick island links');
      headerContainer.style.display = 'flex';
      headerContainer.style.alignItems = 'center';
      const compact = !!this.options.compact;
      this.links.forEach(l => {
        const el = createLinkEl(l, compact);
        attachBasicHandlers(el, l);
        el.addEventListener('click', (ev) => {
          const href = l.href || '';
          if (href.startsWith('#')) {
            ev.preventDefault();
            const target = document.querySelector(href);
            if (target) target.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
          }
          if (href) {
            ev.preventDefault();
            navigateWithGsap(href);
          }
        });
        headerContainer.appendChild(el);
      });

      // Render mobile dropdown links
      const dropdown = document.getElementById('island-links-dropdown');
      if (dropdown) {
        dropdown.innerHTML = '';
        this.links.forEach(l => {
          const a = document.createElement('a');
          a.href = l.href || '#';
          a.textContent = l.label || l.href;
          a.style.display = 'block';
          a.style.padding = '10px 14px';
          a.style.color = 'rgba(255,255,255,0.75)';
          a.style.fontSize = '13px';
          a.style.fontWeight = '600';
          a.style.textDecoration = 'none';
          a.style.borderRadius = '10px';
          a.style.textAlign = 'right';
          a.style.whiteSpace = 'nowrap';
          a.addEventListener('click', (ev) => {
            ev.preventDefault();
            dropdown.classList.remove('open');
            const btn = document.getElementById('island-links-btn');
            if (btn) btn.setAttribute('aria-expanded', 'false');
            if (l.href) navigateWithGsap(l.href);
          });
          dropdown.appendChild(a);
        });
      }

      // Toggle dropdown on mobile button click
      const btn = document.getElementById('island-links-btn');
      if (btn && dropdown) {
        btn.addEventListener('click', (ev) => {
          ev.stopPropagation();
          const isOpen = dropdown.classList.contains('open');
          dropdown.classList.toggle('open', !isOpen);
          btn.setAttribute('aria-expanded', String(!isOpen));
        });
        document.addEventListener('click', (ev) => {
          if (!dropdown.contains(ev.target) && !btn.contains(ev.target)) {
            dropdown.classList.remove('open');
            btn.setAttribute('aria-expanded', 'false');
          }
        });
      }
    },
    renderPanelLinks() {
      const panelContainer = document.getElementById('island-links-panel');
      if (panelContainer) {
        panelContainer.innerHTML = '';
        this.links.forEach(l => {
          const a = createLinkEl(l, false);
          a.classList.add('panel-quick-link');
          attachBasicHandlers(a, l);
          a.style.display = 'block';
          a.style.padding = '8px 10px';
          a.style.borderRadius = '8px';
          a.style.background = 'rgba(255,255,255,0.92)';
          a.style.color = '#111';
          a.style.fontWeight = '700';
          a.style.textDecoration = 'none';
          a.addEventListener('click', (ev) => {
            const href = l.href || '';
            const panel = document.getElementById('island-panel');
            if (panel?.classList.contains('open')) {
              const toggle = document.getElementById('island-toggle');
              if (toggle && typeof toggle.click === 'function') {
                toggle.click();
              } else {
                panel.classList.remove('open');
              }
            }
            if (href) {
              ev.preventDefault();
              navigateWithGsap(href);
            }
          });
          panelContainer.appendChild(a);
        });
      }
    },
    renderLinks(containerSelector) {
      const container = safeQuery(containerSelector);
      if (container) {
        this.links.forEach(l => container.appendChild(createLinkEl(l)));
      }
    }
  };

  globalThis.islandCore = IslandCore;

  document.addEventListener('click', (e) => {
    const cta = document.getElementById('island-cta');
    const overflow = document.getElementById('island-links-overflow');
    if (!cta || !overflow) return;
    const headerMobileBtn = document.getElementById('mobile-menu-btn');
    const mobileOverlay = document.getElementById('mobile-menu-overlay');
    if (cta.contains(e.target) || e.target === cta) {
      setOverflowState(cta, overflow, cta.getAttribute('aria-expanded') !== 'true');
      e.stopPropagation();
      return;
    }
    if (headerMobileBtn && (headerMobileBtn.contains(e.target) || e.target === headerMobileBtn)) {
      if (mobileOverlay) {
        mobileOverlay.classList.toggle('open');
      }
      e.stopPropagation();
      return;
    }
    if (!overflow.contains(e.target)) setOverflowState(cta, overflow, false);
  });

})();
