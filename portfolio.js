(() => {
  const root = document.documentElement;
  const cursor = document.querySelector('.cursor');
  const canvas = document.getElementById('field');
  const context = canvas?.getContext('2d');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
    (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) ||
    (navigator.deviceMemory && navigator.deviceMemory <= 4);

  let fieldFrameId = null;
  let fieldRunning = false;

  const stopFieldAnimation = () => {
    if (fieldFrameId) {
      cancelAnimationFrame(fieldFrameId);
      fieldFrameId = null;
    }
    fieldRunning = false;
  };

  const startFieldAnimation = () => {
    if (!canvas || !context) return;
    if (fieldRunning) return;
    if (reducedMotion) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (window.innerWidth < 768) return;

    fieldRunning = true;

    const drawField = (time = 0) => {
      if (!context || document.hidden) {
        stopFieldAnimation();
        return;
      }

      const width = window.innerWidth;
      const height = window.innerHeight;
      context.clearRect(0, 0, width, height);
      context.strokeStyle = 'rgba(18, 17, 15, .065)';
      context.lineWidth = 1;
      const step = 56;
      const offset = (time * 0.008) % step;
      for (let x = -step + offset; x < width + step; x += step) {
        context.beginPath(); context.moveTo(x, 0); context.lineTo(x - height * .2, height); context.stroke();
      }
      for (let y = -step; y < height + step; y += step) {
        context.beginPath(); context.moveTo(0, y); context.lineTo(width, y); context.stroke();
      }
      fieldFrameId = requestAnimationFrame(drawField);
    };

    fieldFrameId = requestAnimationFrame(drawField);
  };

  const resizeField = () => {
    if (!canvas || !context) return;
    const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = window.innerWidth * ratio;
    canvas.height = window.innerHeight * ratio;
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);

    if (window.innerWidth < 768) {
      stopFieldAnimation();
    } else {
      startFieldAnimation();
    }
  };

  resizeField();
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopFieldAnimation();
    else startFieldAnimation();
  });
  window.addEventListener('focus', startFieldAnimation);
  window.addEventListener('blur', stopFieldAnimation);
  window.addEventListener('resize', resizeField);

  if (cursor && window.matchMedia('(pointer: fine)').matches) {
    document.addEventListener('mouseover', (event) => {
      if (event.target.closest('a, button, .work-card')) cursor.classList.add('is-hovering');
    });
    document.addEventListener('mouseout', (event) => {
      if (event.target.closest('a, button, .work-card')) cursor.classList.remove('is-hovering');
    });
  }

  const packagesMenuButton = document.getElementById('mobile-menu-btn');
  const packagesMenu = document.getElementById('mobile-menu');
  packagesMenuButton?.addEventListener('click', () => {
    const isOpen = packagesMenu.classList.toggle('open');
    packagesMenuButton.setAttribute('aria-expanded', String(isOpen));
    document.body.classList.toggle('menu-open', isOpen);
  });
  packagesMenu?.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
    packagesMenu.classList.remove('open'); document.body.classList.remove('menu-open'); packagesMenuButton?.setAttribute('aria-expanded', 'false');
  }));

  /* ═══════════════════ البيانات ═══════════════════ */
  const CATEGORY_LABELS = { identity: 'هوية', digital: 'رقمية', culture: 'ثقافية' };
  const CFG = {
    apiKey: "AIzaSyBCP30snA8NGU5PDk6m4Vt_fvYXcxSvem8",
    authDomain: "summ3a-3fe32.firebaseapp.com",
    projectId: "summ3a-3fe32",
    storageBucket: "summ3a-3fe32.firebasestorage.app",
    messagingSenderId: "587094312862",
    appId: "1:587094312862:web:ed31e9cf4e97af846ef88f"
  };
  const PROJECT_CACHE_KEY = 'summ3a:portfolio-projects:v1';
  const PROJECT_LIMIT = 12;
  const AR_NUM = ['٠١','٠٢','٠٣','٠٤','٠٥','٠٦','٠٧','٠٨','٠٩','١٠','١١','١٢'];

  const FALLBACK_PROJECTS = [
    { id:'play-pause', title:'PLAY / PAUSE', subtitle:'تجربة منتج', category:'digital', tag:'رقمي / ٢٠٢٦', field:'تجربة منتج', services:['بحث','تجربة مستخدم','واجهة'], year:'٢٠٢٦',
      description:'عالم رقمي مرح يحوّل الحنين إلى تجربة تفاعلية نابضة بالحياة. أعدنا تخيّل وحدة ألعاب كلاسيكية كمنصة حديثة تستجيب للمس والصوت والحركة.\nبنينا نظامًا بصريًا مرنًا يسمح للعلامة بالنمو عبر المنصات، من الشاشة الصغيرة إلى التركيبات المكانية الكبيرة.\nكل تفصيلة كانت مدروسة: إيقاع الحركة، صوت الضغطة، ولمعة البلاستيك المُعاد إحياؤها رقمياً.',
      gallery:['https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1400&q=85','https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=900&q=85','https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?auto=format&fit=crop&w=900&q=85'] },
    { id:'orbital', title:'ORBITAL', subtitle:'عالم بصري للعلامة', category:'identity', tag:'هوية / ٢٠٢٥', field:'هوية علامة تجارية', services:['استراتيجية','هوية','عالم بصري'], year:'٢٠٢٥',
      description:'هوية مرنة لشركة تبني طاقة أنظف من أجل الغد. مدارة حول فكرة المدار: حركة دائمة، توازن هادئ، وطاقة لا تتوقف.\nترجمنا الفكرة إلى نظام بصري متكامل من الشعار إلى لوحات الألوان وحركة العلامة على الشاشات.',
      gallery:['https://images.unsplash.com/photo-1549490349-8643362247b5?auto=format&fit=crop&w=1400&q=85','https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=900&q=85','https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=900&q=85'] },
    { id:'afterimage', title:'AFTERIMAGE', subtitle:'نظام معرض فني', category:'culture', tag:'ثقافي / ٢٠٢٥', field:'تجربة ثقافية', services:['فكرة','إخراج فني','تركيب'], year:'٢٠٢٥',
      description:'نظام معرض يتغير باستمرار مع حركة الجمهور داخله. كل زائر يترك أثراً، وكل أثر يولّد صورة جديدة لا تتكرر.\nصممنا التركيب ليكون حواراً بين الضوء والمساحة والذاكرة الجماعية للحاضرين.',
      gallery:['https://images.unsplash.com/photo-1531058020387-3be344556be6?auto=format&fit=crop&w=1400&q=85','https://images.unsplash.com/photo-1561214115-f2f134cc4912?auto=format&fit=crop&w=900&q=85','https://images.unsplash.com/photo-1577083552431-6e5fd01aa342?auto=format&fit=crop&w=900&q=85'] },
    { id:'soft-signal', title:'SOFT SIGNAL', subtitle:'تجربة ويب', category:'digital', tag:'رقمي / ٢٠٢٤', field:'تجربة ويب', services:['محتوى','تصميم تفاعلي','تطوير'], year:'٢٠٢٤',
      description:'تجربة ويب هادئة وملموسة تجعل الأنظمة المعقدة أقرب إلى الإنسان. نبني الواجهة كأنها تنفس: إيقاع بطيء، مساحات واسعة، وضوء ناعم.\nالنتيجة لوحة تحكم تقرأها كقصة، لا كمصفوفة بيانات.',
      gallery:['https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=1400&q=85','https://images.unsplash.com/photo-1557682250-33bd709cbe85?auto=format&fit=crop&w=900&q=85','https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?auto=format&fit=crop&w=900&q=85'] }
  ];

  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
  const toArr = (v) => Array.isArray(v) ? v : String(v || '').split(/[\n\u00B7,]/).map((s) => s.trim()).filter(Boolean);
  const placeholderSvg = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='600' viewBox='0 0 800 600'%3E%3Crect width='800' height='600' fill='%23171717'/%3E%3Ccircle cx='400' cy='300' r='120' fill='%23f68720' opacity='0.22'/%3E%3C/svg%3E";

  function optimizeImageUrl(url) {
    if (!url || typeof url !== 'string') return '';
    const value = url.trim();
    if (!value) return '';

    try {
      const parsed = new URL(value);
      if (parsed.hostname.includes('1drv.ms') || parsed.hostname.includes('onedrive.live.com')) {
        if (!parsed.searchParams.has('download')) {
          parsed.searchParams.set('download', '1');
        }
        const requestedWidth = Number.parseInt(parsed.searchParams.get('width'), 10);
        const requestedHeight = Number.parseInt(parsed.searchParams.get('height'), 10);
        const maxWidth = 1400;
        if (requestedWidth > maxWidth) {
          const ratio = requestedHeight > 0 ? requestedHeight / requestedWidth : 1;
          parsed.searchParams.set('width', String(maxWidth));
          parsed.searchParams.set('height', String(Math.max(1, Math.round(maxWidth * ratio))));
        }
        return parsed.toString();
      }

      if (parsed.hostname.includes('images.unsplash.com')) {
        parsed.searchParams.set('auto', 'format');
        parsed.searchParams.set('fit', 'crop');
        parsed.searchParams.set('q', '80');
        parsed.searchParams.set('w', '900');
        if (!parsed.searchParams.has('h')) parsed.searchParams.set('h', '900');
        return parsed.toString();
      }
      return value;
    } catch (error) {
      return value;
    }
  }

  function isVideoMedia(url) {
    if (!url || typeof url !== 'string') return false;
    const value = url.trim().toLowerCase();
    if (!value) return false;
      return /(youtube\.com|youtu\.be|vimeo\.com|\.mp4(\?|$)|\.webm(\?|$)|\.ogg(\?|$)|\.mov(\?|$)|\.m4v(\?|$)|video\/)/i.test(value);
  }

  function getVideoEmbed(url) {
    if (!url || typeof url !== 'string') return '';
    const value = url.trim();
    if (!value) return '';

    const ytMatch = value.match(/(?:youtube\.com\/watch\?v=|youtube\.com\/embed\/|youtu\.be\/)([A-Za-z0-9_-]{11})/i);
    if (ytMatch) {
      const id = ytMatch[1];
      return '<div class="case-video-wrap"><iframe src="https://www.youtube.com/embed/' + id + '?rel=0" title="Video" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe></div>';
    }

    const vimeoMatch = value.match(/vimeo\.com\/(\d+)/i);
    if (vimeoMatch) {
      const id = vimeoMatch[1];
      return '<div class="case-video-wrap"><iframe src="https://player.vimeo.com/video/' + id + '" title="Video" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe></div>';
    }

    return '<div class="case-video-wrap"><video class="case-video" controls playsinline preload="metadata" src="' + esc(value) + '"></video></div>';
  }

  function masonryUrl(url) {
    try {
      const parsed = new URL(url);
      if (parsed.hostname.includes('images.unsplash.com')) { parsed.search = 'auto=format&w=900&q=80'; return parsed.toString(); }
    } catch (error) {}
    return url;
  }
  function lightboxUrl(url) {
    try {
      const parsed = new URL(url);
      if (parsed.hostname.includes('images.unsplash.com')) { parsed.search = 'auto=format&w=1600&q=85'; return parsed.toString(); }
      if (parsed.hostname.includes('1drv.ms') || parsed.hostname.includes('onedrive.live.com')) {
        parsed.searchParams.set('download', '1');
        parsed.searchParams.delete('width');
      }
    } catch (error) {}
    return url;
  }

  function renderGalleryMedia(url) {
    const value = String(url || '').trim();
    if (!value) return '';
    if (isVideoMedia(value)) return '<figure class="g-item g-video">' + getVideoEmbed(value) + '</figure>';
    const thumb = masonryUrl(value);
    const full = lightboxUrl(value);
    return '<figure class="g-item"><img class="lazy-img" data-lb="' + esc(full) + '" src="' + esc(placeholderSvg) + '" data-src="' + esc(thumb) + '" alt="" loading="lazy" decoding="async"></figure>';
  }

  function mapDoc(id, d) {
    return {
      id,
      title: d.title || 'بدون عنوان',
      subtitle: d.subtitle || '',
      category: d.category || 'digital',
      tag: d.tag || '',
      field: d.field || CATEGORY_LABELS[d.category] || 'مشروع إبداعي',
      services: toArr(d.services),
      year: d.year || '',
      cover: optimizeImageUrl(d.coverImage || d.cover || ''),
      description: d.description || '',
      beforeImage: optimizeImageUrl(d.beforeImage || ''),
      afterImage: optimizeImageUrl(d.afterImage || ''),
      gallery: toArr(d.galleryImages || d.gallery).map(optimizeImageUrl),
      tools: toArr(d.tools),
      color: d.color || '',
      format: d.format || {},
      blocks: Array.isArray(d.blocks) ? d.blocks : [],
      order: typeof d.order === 'number' ? d.order : 999
    };
  }

  /* ═══════════════════ الشبكة ═══════════════════ */
  const workGrid = document.querySelector('.work-grid');

  function cardHTML(p, index = 0) {
    const coverUrl = optimizeImageUrl(p.cover || '');
    const isAboveFold = index < 3 && coverUrl;
    const imageAttrs = isAboveFold
      ? `src="${esc(coverUrl)}" alt="${esc(p.title)}" loading="eager" decoding="async" fetchpriority="high"`
      : `src="${esc(placeholderSvg)}" data-src="${esc(coverUrl)}" alt="${esc(p.title)}" loading="lazy" decoding="async" fetchpriority="low"`;
    return `<article class="work-card reveal is-dynamic" data-category="${esc(p.category)}" data-color="${esc(p.color || '')}" tabindex="0" role="button" aria-label="${esc(p.title)}">
      <div class="work-image">
        <img class="lazy-img${isAboveFold ? ' is-loaded' : ''}" ${imageAttrs}>
        <span class="work-tag">${esc(p.tag || ((CATEGORY_LABELS[p.category] || '') + (p.year ? ' / ' + p.year : '')))}</span>
        <span class="work-arrow"><i data-lucide="arrow-up-right"></i></span>
      </div>
      <div class="work-meta"><strong>${esc(p.title)}</strong><span>${esc(p.subtitle)}</span></div>
    </article>`;
  }

  function revealEl(el) {
    if (window.gsap && window.ScrollTrigger) {
      gsap.to(el, { scrollTrigger: { trigger: el, start: 'top 88%' }, y: 0, opacity: 1, duration: .9, ease: 'power3.out' });
    } else { el.style.opacity = '1'; el.style.transform = 'none'; }
  }

  function loadLazyImages(root = document) {
    const images = root.querySelectorAll('img[data-src]');
    if (!images.length) return;

    const loadImage = (img) => {
      const src = img.dataset.src;
      if (!src) return;
      img.addEventListener('load', () => img.classList.add('is-loaded'), { once: true });
      img.src = src;
      img.removeAttribute('data-src');
    };

    // Images inside the open project modal are visible immediately. Do not
    // wait for an observer tick or native lazy loading after the dialog opens.
    if (root.closest?.('.project-modal')) {
      images.forEach((img) => {
        img.loading = 'eager';
        img.fetchPriority = 'low';
        loadImage(img);
      });
      return;
    }

    if (!('IntersectionObserver' in window)) {
      images.forEach((img) => {
        loadImage(img);
      });
      return;
    }

    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const img = entry.target;
        loadImage(img);
        obs.unobserve(img);
      });
    }, { rootMargin: '200px 0px' });

    images.forEach((img) => observer.observe(img));
  }

  async function loadProjects() {
    const renderProjects = (list) => {
      if (!list.length) return;
      workGrid.innerHTML = list.map(cardHTML).join('');
      const cards = workGrid.querySelectorAll('.work-card');
      cards.forEach((card, i) => { card._project = list[i]; });
      window.lucide?.createIcons();
      workGrid.querySelectorAll('.work-card').forEach(revealEl);
      loadLazyImages(workGrid);
      if (window.ScrollTrigger) ScrollTrigger.refresh();
    };

    try {
      const cached = JSON.parse(localStorage.getItem(PROJECT_CACHE_KEY) || 'null');
      if (Array.isArray(cached) && cached.length) renderProjects(cached);
    } catch (error) {
      localStorage.removeItem(PROJECT_CACHE_KEY);
    }

    try {
      if (typeof firebase === 'undefined') return;
      firebase.initializeApp(CFG);
      const db = firebase.firestore();
      const snap = await db.collection('projects').limit(PROJECT_LIMIT).get();
      const list = [];
      snap.forEach((doc) => {
        const data = doc.data();
        if (data.published === false) return;
        list.push(mapDoc(doc.id, data));
      });
      list.sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
      if (!list.length) return;
      renderProjects(list);
      try {
        const cacheable = list.map(({ id, title, subtitle, category, tag, field, year, cover, color, order }) =>
          ({ id, title, subtitle, category, tag, field, year, cover, color, order }));
        localStorage.setItem(PROJECT_CACHE_KEY, JSON.stringify(cacheable));
      } catch (error) { /* Storage may be unavailable or full. */ }
    } catch (err) {
      console.warn('تعذّر تحميل الأعمال من الخادم، سيتم عرض الأعمال الافتراضية.', err);
    }
  }

  /* ربط بيانات المشروع بكل بطاقة (الديناميكية تحمل _project جاهزة) */
  function resolveProject(card) {
    if (card._project) return card._project;
    const title = card.dataset.project || card.querySelector('strong')?.textContent.trim();
    const fallback = FALLBACK_PROJECTS.find((p) => p.title === title) || {
      title: title || 'عمل مختار',
      subtitle: card.querySelector('.work-meta span')?.textContent.trim() || '',
      category: card.dataset.category || 'digital',
      tag: card.querySelector('.work-tag')?.textContent.trim() || '',
      cover: card.querySelector('img')?.src || '',
      description: 'تجربة رقمية مدروسة بُنيت بعناية وقصد.',
      services: ['استراتيجية', 'تصميم', 'تقنية'],
      gallery: []
    };

    card._project = {
      ...fallback,
      cover: optimizeImageUrl(fallback.cover || ''),
      gallery: Array.isArray(fallback.gallery) ? fallback.gallery.map(optimizeImageUrl) : []
    };
    return card._project;
  }

  const warmedProjectIds = new Set();

  function preloadProjectMedia(project) {
    if (!project || warmedProjectIds.has(project.id)) return;
    warmedProjectIds.add(project.id);

    const urls = [project.cover, project.beforeImage, project.afterImage];
    (Array.isArray(project.gallery) ? project.gallery : []).forEach((url) => urls.push(url));
    (Array.isArray(project.blocks) ? project.blocks : []).forEach((block) => {
      if (!block) return;
      urls.push(block.src, block.a, block.b);
      if (Array.isArray(block.imgs)) block.imgs.forEach((url) => urls.push(url));
    });

    [...new Set(urls.filter(Boolean).map(optimizeImageUrl))].slice(0, 6).forEach((url) => {
      const image = new Image();
      image.decoding = 'async';
      image.fetchPriority = 'low';
      image.src = url;
    });
  }

  /* ═══════════════════ الفلاتر ═══════════════════ */
  document.querySelectorAll('.filter').forEach((filter) => {
    filter.addEventListener('click', () => {
      document.querySelectorAll('.filter').forEach((item) => item.classList.remove('active'));
      filter.classList.add('active');
      const category = filter.dataset.filter;
      document.querySelectorAll('.work-card').forEach((card) => {
        card.classList.toggle('is-hidden', category !== 'all' && card.dataset.category !== category);
      });
    });
  });

  /* ═══════════════════ النافذة (أسلوب Behance) ═══════════════════ */
  const modal = document.querySelector('.project-modal');
  const caseContent = document.getElementById('case-content');
  const modalImage = document.getElementById('modal-image');
  const modalNumber = document.getElementById('modal-number');
  const modalHeroTitle = document.getElementById('modal-hero-title');
  const modalHeroSubtitle = document.getElementById('modal-hero-subtitle');
  const modalHeroField = document.getElementById('modal-hero-field');
  const modalHeroYear = document.getElementById('modal-hero-year');
  let currentIndex = -1;

  const hMap = { sm:'ch-sm',md:'ch-md',lg:'ch-lg',full:'ch-full' };
  const gcMap = { auto:'',two:'gc-two',single:'gc-single' };

  function renderBlocksCase(p) {
    const hero = modal.querySelector('.case-hero');
    const panel = modal.querySelector('.modal-panel');
    let textOrder = 'image'; let sections = [];
    p.blocks.forEach(b => {
      if (b.t==='cover') {
        hero.className = 'case-hero '+(hMap[b.h]||'ch-md');
        modalImage.src = optimizeImageUrl(b.src || '');
        modalImage.loading = 'eager';
        modalImage.fetchPriority = 'high';
      }
      else if (b.t==='title') textOrder = 'text';
    });

    function renderBlock(b) {
      if (b.t==='title') {
        const fw = b.weight==='light'?400:b.weight==='bold'?900:b.weight==='medium'?650:700;
        const fs = b.size==='sm'?'clamp(1.3rem,3.5vw,2.8rem)':b.size==='lg'?'clamp(1.9rem,6.4vw,5.8rem)':'clamp(1.6rem,4.8vw,4.6rem)';
        const dir = b.dir ? 'direction:'+b.dir+';' : '';
        return '<div id="modal-title" class="block-title" style="text-align:'+b.align+';font-size:'+fs+';font-weight:'+fw+';'+dir+'">'+b.x+'</div>';
      }
      if (b.t==='lede') {
        const fw = b.weight==='bold'?700:b.weight==='light'?400:500;
        const fs = b.size==='sm'?'14.5px':b.size==='lg'?'1.45rem':'clamp(1.05rem,1.6vw,1.3rem)';
        const dir = b.dir ? 'direction:'+b.dir+';' : '';
        return '<div class="block-lede" style="text-align:'+b.align+';font-size:'+fs+';font-weight:'+fw+';'+dir+'">'+b.x+'</div>';
      }
      if (b.t==='para') {
        const plainText = String(b.x || '').replace(/<[^>]*>/g, '').trim();
        if (plainText === 'الفكرة المحورية:' || plainText === 'الفكرة المحورية') return '';
        const fw = b.weight==='bold'?700:400;
        const fs = b.size==='sm'?'14.5px':b.size==='lg'?'19px':'16.5px';
        const dir = b.dir ? 'direction:'+b.dir+';' : '';
        return '<div class="block-para" style="text-align:'+b.align+';font-size:'+fs+';font-weight:'+fw+';'+dir+'">'+b.x+'</div>';
      }
      if (b.t==='image' && b.src) {
        const w = Math.max(30, Math.min(100, parseInt(b.w,10)||100));
        const caption = b.caption ? '<p class="block-caption" style="text-align:'+(b.align||'center')+'">'+b.caption+'</p>' : '';
        if (b.fit === 'full') {
          return '<div class="block-image block-image-full"><img class="lazy-img" style="width:100%;height:auto" src="'+esc(placeholderSvg)+'" data-src="'+esc(optimizeImageUrl(b.src))+'" alt="" loading="lazy" decoding="async"></div>'+caption;
        }
        if (b.fit === 'cover') {
          const r = (typeof b.r === 'string' && b.r.indexOf('-') > 0) ? b.r : '4-3';
          return '<div class="block-image block-image-cover r-'+r+'" style="max-width:'+w+'%;margin-left:auto;margin-right:auto"><img class="lazy-img" style="width:100%;height:100%" src="'+esc(placeholderSvg)+'" data-src="'+esc(optimizeImageUrl(b.src))+'" alt="" loading="lazy" decoding="async">'+caption+'</div>';
        }
        return '<div class="block-image block-image-contain" style="max-width:'+w+'%;margin-left:auto;margin-right:auto"><img class="lazy-img" style="width:100%;height:auto" src="'+esc(placeholderSvg)+'" data-src="'+esc(optimizeImageUrl(b.src))+'" alt="" loading="lazy" decoding="async">'+caption+'</div>';
      }
      if (b.t==='video' && b.src) {
        const src = String(b.src).trim();
        const isGif = /\.gif(\?|$)/i.test(src) || /^data:image\/gif/i.test(src);
        const w = Math.max(30, Math.min(100, parseInt(b.w,10)||100));
        const caption = b.caption ? '<p class="block-caption" style="text-align:'+(b.align||'center')+'">'+b.caption+'</p>' : '';
        if (isGif) {
          if (b.fit === 'full') {
            return '<div class="block-video block-video-full"><img class="lazy-img" style="width:100%;height:auto" src="'+esc(placeholderSvg)+'" data-src="'+esc(src)+'" alt="" loading="lazy" decoding="async"></div>'+caption;
          }
          if (b.fit === 'cover') {
            const r = (typeof b.r === 'string' && b.r.indexOf('-') > 0) ? b.r : '16-9';
            return '<div class="block-video block-video-cover r-'+r+'" style="max-width:'+w+'%;margin-left:auto;margin-right:auto"><img class="lazy-img" style="width:100%;height:100%" src="'+esc(placeholderSvg)+'" data-src="'+esc(src)+'" alt="" loading="lazy" decoding="async">'+caption+'</div>';
          }
          return '<div class="block-video block-video-contain" style="max-width:'+w+'%;margin-left:auto;margin-right:auto"><img class="lazy-img" style="width:100%;height:auto" src="'+esc(placeholderSvg)+'" data-src="'+esc(src)+'" alt="" loading="lazy" decoding="async">'+caption+'</div>';
        }
        const embed = isVideoMedia(src) ? getVideoEmbed(src) : '<video class="block-video-el" src="'+esc(src)+'" controls playsinline preload="metadata"></video>';
        if (b.fit === 'full') {
          return '<div class="block-video block-video-full">'+embed+'</div>'+caption;
        }
        if (b.fit === 'cover') {
          const r = (typeof b.r === 'string' && b.r.indexOf('-') > 0) ? b.r : '16-9';
          return '<div class="block-video block-video-cover r-'+r+'" style="max-width:'+w+'%;margin-left:auto;margin-right:auto">'+embed+caption+'</div>';
        }
        return '<div class="block-video block-video-contain" style="max-width:'+w+'%;margin-left:auto;margin-right:auto">'+embed+caption+'</div>';
      }
      if (b.t==='gallery' && b.imgs?.length) {
        const gc = gcMap[b.cols]||'';
        const many = b.imgs.length>2&&!gc?' is-many':'';
        return '<div class="case-section-title"><span>من داخل المشروع</span></div><div class="case-gallery masonry '+gc+many+'">'+b.imgs.map(g => renderGalleryMedia(g)).join('')+'</div>';
      }
      if (b.t==='stats' && b.items?.length) {
        const items = b.items.filter(it => String(it?.n ?? '').trim() !== '').map(it => {
          const num = esc(String(it.n));
          const suffix = it.suffix ? '<span class="stat-suffix">'+esc(it.suffix)+'</span>' : '';
          const label = it.label ? '<div class="stat-label">'+esc(it.label)+'</div>' : '';
          return '<div class="stat-item"><div class="stat-num"><span class="stat-count" data-count="'+num+'">0</span>'+suffix+'</div>'+label+'</div>';
        }).join('');
        if (!items) return '';
        return '<div class="block-stats">'+items+'</div>';
      }
      if (b.t==='ba' && b.a && b.b) return '<div class="ba-slider" style="--ba-pct:50%"><img class="ba-before lazy-img" src="'+esc(placeholderSvg)+'" data-src="'+esc(optimizeImageUrl(b.a))+'" alt="قبل" loading="lazy" decoding="async"><img class="ba-after lazy-img" src="'+esc(placeholderSvg)+'" data-src="'+esc(optimizeImageUrl(b.b))+'" alt="بعد" loading="lazy" decoding="async"><div class="ba-edge-before"></div><div class="ba-edge-after"></div><div class="ba-handle"></div><span class="ba-label ba-lbl-before">قبل</span><span class="ba-label ba-lbl-after">بعد</span><span class="ba-hint"><span class="ba-hint-icon">⇔</span> اسحب للمقارنة</span></div>';
      if (b.t==='imgtext') {
        const dir = b.side==='left' ? 'ltr' : 'rtl';
        const ratio = (b.ratio==='16/9'||b.ratio==='4/3'||b.ratio==='3/4'||b.ratio==='1/1') ? b.ratio : '4/3';
        const stack = b.stack||'img-first';
        const eyebrow = b.eyebrow ? '<div class="it-eyebrow">'+b.eyebrow+'</div>' : '';
        const heading = b.heading ? '<h3 class="it-heading">'+b.heading+'</h3>' : '';
        const body = b.text ? '<div class="it-copy">'+b.text+'</div>' : '';
        const copy = eyebrow+heading+body;
        if (!copy) return '';
        const media = b.src ? '<figure class="it-media" style="--it-ratio:'+ratio+'"><img class="lazy-img" src="'+esc(placeholderSvg)+'" data-src="'+esc(optimizeImageUrl(b.src))+'" alt="" loading="lazy" decoding="async"></figure>' : '';
        return '<div class="block-imgtext'+(b.src ? '' : ' no-media')+'" style="direction:'+dir+'" data-stack="'+stack+'">'+media+'<div class="it-content">'+copy+'</div></div>';
      }
      return '';
    }

    if (textOrder==='text') { p.blocks.forEach(b => { const h = renderBlock(b); if (h) sections.push(h); }); }
    else { p.blocks.forEach(b => { const h = renderBlock(b); if (h) sections.push(h); }); }

    if (!sections.length) { sections.push('<h2 class="block-title">'+esc(p.title)+'</h2>'); if (p.subtitle) sections.push('<p class="block-lede">'+esc(p.subtitle)+'</p>'); }
    panel.insertBefore(caseContent, hero);
    caseContent.innerHTML = sections.join('') + '<a href="#contact" class="cta-link case-cta">اطلب مشروعًا مشابهًا <span>↗</span></a>';
    requestAnimationFrame(() => loadLazyImages(caseContent));
    caseContent.querySelector('.case-cta')?.addEventListener('click', (e) => { e.preventDefault(); closeProject(); document.getElementById('contact')?.scrollIntoView({behavior:'smooth'}); });
    initCaseInteractions(caseContent);
  }
  function buildCase(p) {
    if (Array.isArray(p.blocks) && p.blocks.length) return renderBlocksCase(p);
    const f = p.format || {};
    const hero = modal.querySelector('.case-hero');
    const panel = modal.querySelector('.modal-panel');
    const ch = ['sm', 'md', 'lg', 'full'].includes(f.coverHeight) ? f.coverHeight : 'md';
    hero.classList.remove('ch-sm', 'ch-md', 'ch-lg', 'ch-full');
    hero.classList.add('ch-' + ch);
    if (f.layout === 'text') panel.insertBefore(caseContent, hero);
    else panel.insertBefore(hero, caseContent);

    const ta = f.titleAlign === 'right' ? 'right' : f.titleAlign === 'left' ? 'left' : 'center';
    const da = f.descAlign === 'right' ? 'right' : f.descAlign === 'left' ? 'left' : 'center';
    const ts = f.titleSize === 'lg' ? ' ts-lg' : '';
    const tw = f.titleWeight === 'medium' ? ' tw-md' : f.titleWeight === 'light' ? ' tw-lt' : '';
    const dz = f.descSize === 'sm' ? ' dz-sm' : f.descSize === 'lg' ? ' dz-lg' : '';
    const dw = f.descWeight === 'bold' ? ' dw-b' : '';
    const gc = f.galleryCols === 'two' ? ' gc-two' : f.galleryCols === 'single' ? ' gc-single' : '';
    const align = (v) => ` style="text-align:${v}"`;

    const paras = String(p.description || '').split(/\n+/).map((t) => t.trim()).filter(Boolean)
      .map((t) => `<p>${esc(t)}</p>`).join('');
    const ba = (p.beforeImage && p.afterImage && f.showBeforeAfter !== false)
      ? `<div class="ba-slider" style="--ba-pct:50%"><img class="ba-before" src="${esc(p.beforeImage)}" alt="قبل" loading="lazy"><img class="ba-after" src="${esc(p.afterImage)}" alt="بعد" loading="lazy"><div class="ba-edge-before"></div><div class="ba-edge-after"></div><div class="ba-handle"></div><span class="ba-label ba-lbl-before">قبل</span><span class="ba-label ba-lbl-after">بعد</span><span class="ba-hint"><span class="ba-hint-icon">⇔</span> اسحب للمقارنة</span></div>`
      : '';
    const gal = (p.gallery.length && f.showGallery !== false)
      ? `<div class="case-section-title"><span>من داخل المشروع</span><small class="mono">تفاصيل مختارة</small></div>
         <div class="case-gallery${gc}${p.gallery.length > 2 && !gc ? ' is-many' : ''}">${p.gallery.map((g) => renderGalleryMedia(g)).join('')}</div>`
      : '';
    caseContent.innerHTML = `
      <h2 id="modal-title" class="${(ts + tw).trim()}"${align(ta)}>${esc(p.title)}</h2>
      ${p.subtitle ? `<p class="case-lede${dz}${dw}"${align(da)}>${esc(p.subtitle)}</p>` : ''}
      ${paras ? `<div class="case-paragraphs${dz}${dw}"${align(da)}>${paras}</div>` : ''}
      ${f.showFacts === false ? '' : `
      <div class="case-facts">
        <div><span>المجال</span><strong>${esc(p.field || '-')}</strong></div>
        <div><span>الخدمات</span><strong>${esc(p.services.join(' · ') || '-')}</strong></div>
        <div><span>السنة</span><strong>${esc(p.year || '-')}</strong></div>
      </div>`}
      ${(p.tools && p.tools.length) ? `<div class="case-tools"><span class="mono">الأدوات المستخدمة</span><div class="case-chip-row">${p.tools.map((t) => `<span class="case-chip">${esc(t)}</span>`).join('')}</div></div>` : ''}
      ${ba}${gal}
      ${f.showCta === false ? '' : `<a href="#contact" class="cta-link case-cta">اطلب مشروعًا مشابهًا <span>↗</span></a>`}`;
    requestAnimationFrame(() => loadLazyImages(caseContent));
    caseContent.querySelector('.case-cta')?.addEventListener('click', (e) => {
      e.preventDefault(); closeProject();
      document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
    });
    initCaseInteractions(caseContent);
  }

  function openProject(card) {
    closeLightbox();
    const p = resolveProject(card);
    const cards = [...document.querySelectorAll('.work-card')];
    currentIndex = cards.indexOf(card);
    modalImage.src = optimizeImageUrl(p.cover || card.querySelector('img')?.src || '');
    modalImage.loading = 'eager';
    modalImage.fetchPriority = 'high';
    modalImage.alt = p.title;
    modalHeroTitle.textContent = p.title || '';
    modalHeroSubtitle.textContent = p.subtitle || '';
    modalHeroField.textContent = p.field || CATEGORY_LABELS[p.category] || '';
    modalHeroYear.textContent = p.year || '';
    modalNumber.textContent = p.number || AR_NUM[currentIndex] || '٠١';
    buildCase(p);
    const projectColor = /^#[0-9a-f]{6}$/i.test(card.dataset.color || '') ? card.dataset.color : '#ef6b32';
    root.style.setProperty('--orange', projectColor);
    root.style.setProperty('--project-bg', projectColor);
    modal.classList.add('is-open');
    if (!modal.open) modal.showModal();
    requestAnimationFrame(() => loadLazyImages(caseContent));
    setTimeout(() => { if (window.ScrollTrigger) ScrollTrigger.refresh(); }, 350);
    document.body.classList.add('menu-open');
    modal.querySelector('.modal-close')?.focus();
    modal.querySelector('.modal-panel')?.scrollTo(0, 0);
  }

  const closeProject = () => {
    if (!modal) return;
    closeLightbox();
    modal.classList.remove('is-open');
    if (modal.open) modal.close();
    document.body.classList.remove('menu-open');
  };

  function initBaSliders(root) {
    root.querySelectorAll('.ba-slider').forEach(slider => {
      let dragging = false;
      const update = (e) => {
        const rect = slider.getBoundingClientRect();
        const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
        const pct = Math.max(2, Math.min(98, (x / rect.width) * 100));
        slider.style.setProperty('--ba-pct', pct + '%');
      };
      const onMove = (e) => { if (dragging) { e.preventDefault(); update(e); } };
      const onEnd = () => { dragging = false; document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onEnd); document.removeEventListener('touchmove', onMove); document.removeEventListener('touchend', onEnd); };
      slider.addEventListener('mousedown', (e) => { dragging = true; update(e); document.addEventListener('mousemove', onMove); document.addEventListener('mouseup', onEnd); });
      slider.addEventListener('touchstart', (e) => { dragging = true; update(e); document.addEventListener('touchmove', onMove, {passive:false}); document.addEventListener('touchend', onEnd); }, {passive:true});
    });
  }

  /* ═══════════════════ عدّاد الأرقام (GSAP + ScrollTrigger) ═══════════════════ */
  function formatStatValue(v, dec) {
    const fixed = dec > 0 ? Number(v).toFixed(dec) : String(Math.round(v));
    return fixed.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }
  function statDecimalPlaces(raw) {
    const s = String(raw || '0');
    const m = s.match(/\.(\d+)/);
    return m ? Math.min(2, m[1].length) : 0;
  }
  function initStatCounters(root) {
    const counts = root.querySelectorAll('.stat-count');
    if (!counts.length) return;
    if (window.ScrollTrigger) {
      ScrollTrigger.getAll().forEach((st) => { if (st.trigger && root.contains(st.trigger)) st.kill(); });
    }
    const scroller = modal?.querySelector('.modal-panel') || window;
    counts.forEach((el) => {
      const raw = el.dataset.count;
      const target = parseFloat(String(raw).replace(/,/g, '').replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d))) || 0;
      const dec = statDecimalPlaces(raw);
      const apply = (v) => { el.textContent = formatStatValue(v, dec); };
      if (!window.gsap || !window.ScrollTrigger || reducedMotion) { apply(target); return; }
      const obj = { v: 0 };
      gsap.to(obj, {
        v: target,
        duration: 2,
        ease: 'power2.out',
        scrollTrigger: { trigger: el, start: 'top 85%', once: true, scroller },
        onUpdate: () => apply(obj.v)
      });
    });
    if (window.ScrollTrigger) ScrollTrigger.refresh();
  }

  /* ═══════════════════ Lightbox (معرض Masonry) ═══════════════════ */
  let lbItems = [];
  let lbIndex = 0;
  function ensureLightbox() {
    let lb = document.querySelector('.lb-overlay');
    if (lb) return lb;
    lb = document.createElement('div');
    lb.className = 'lb-overlay';
    lb.innerHTML =
      '<div class="lb-backdrop" data-lb-close></div>' +
      '<figure class="lb-stage"><img alt="" loading="lazy"></figure>' +
      '<button class="lb-btn lb-close" aria-label="إغلاق" data-lb-close>✕</button>' +
      '<button class="lb-btn lb-prev" aria-label="السابق">‹</button>' +
      '<button class="lb-btn lb-next" aria-label="التالي">›</button>' +
      '<div class="lb-count"></div>';
    lb.querySelector('[data-lb-close]')?.addEventListener('click', closeLightbox);
    lb.querySelector('.lb-prev').addEventListener('click', (e) => { e.stopPropagation(); lbGo(-1); });
    lb.querySelector('.lb-next').addEventListener('click', (e) => { e.stopPropagation(); lbGo(1); });
    lb.querySelector('.lb-stage').addEventListener('click', (e) => e.stopPropagation());
    (() => {
      let x0 = 0, y0 = 0;
      lb.addEventListener('touchstart', (e) => { const t = e.changedTouches[0]; x0 = t.clientX; y0 = t.clientY; }, { passive: true });
      lb.addEventListener('touchend', (e) => {
        const t = e.changedTouches[0];
        const dx = t.clientX - x0, dy = t.clientY - y0;
        if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy)) lbGo(dx < 0 ? 1 : -1);
      }, { passive: true });
    })();
    if (modal) modal.appendChild(lb); else document.body.appendChild(lb);
    return lb;
  }
  function lbShow() {
    const lb = ensureLightbox();
    if (!lbItems.length) return;
    const img = lb.querySelector('.lb-stage img');
    img.src = lbItems[lbIndex];
    lb.querySelector('.lb-count').textContent = (lbIndex + 1) + ' / ' + lbItems.length;
    lb.classList.add('is-open');
    document.body.classList.add('lb-open');
  }
  function closeLightbox() {
    const lb = document.querySelector('.lb-overlay');
    if (lb) { lb.classList.remove('is-open'); lb.querySelector('.lb-stage img').src = ''; }
    document.body.classList.remove('lb-open');
  }
  function lbGo(dir) {
    if (!lbItems.length) return;
    lbIndex = (lbIndex + dir + lbItems.length) % lbItems.length;
    lbShow();
  }
  function openLightboxFromGallery(galleryEl, clickedImg) {
    const imgs = [...galleryEl.querySelectorAll('img[data-lb]')];
    if (!imgs.length) return;
    const full = clickedImg.dataset.lb || clickedImg.src;
    lbItems = imgs.map((img) => img.dataset.lb || img.src);
    lbIndex = lbItems.indexOf(full);
    if (lbIndex < 0) lbIndex = 0;
    lbShow();
  }
  function initCaseInteractions(root) {
    initBaSliders(root);
    initStatCounters(root);
    root.querySelectorAll('.case-gallery.masonry').forEach((gallery) => {
      gallery.addEventListener('click', (e) => {
        const img = e.target.closest('img[data-lb]');
        if (img) openLightboxFromGallery(gallery, img);
      });
    });
  }

  workGrid?.addEventListener('click', (e) => {
    const card = e.target.closest('.work-card');
    if (card) openProject(card);
  });
  workGrid?.addEventListener('pointerover', (e) => {
    const card = e.target.closest('.work-card');
    if (card) preloadProjectMedia(resolveProject(card));
  });
  workGrid?.addEventListener('touchstart', (e) => {
    const card = e.target.closest('.work-card');
    if (card) preloadProjectMedia(resolveProject(card));
  }, { passive: true });
  workGrid?.addEventListener('focusin', (e) => {
    const card = e.target.closest('.work-card');
    if (card) preloadProjectMedia(resolveProject(card));
  });
  workGrid?.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const card = e.target.closest('.work-card');
    if (card) { e.preventDefault(); openProject(card); }
  });
  modal?.querySelectorAll('[data-close-modal]').forEach((element) => element.addEventListener('click', closeProject));
  document.addEventListener('keydown', (e) => {
    if (!modal?.open) return;
    const lb = document.querySelector('.lb-overlay');
    const lbOpen = lb && lb.classList.contains('is-open');
    if (lbOpen) {
      if (e.key === 'Escape') { e.preventDefault(); closeLightbox(); return; }
      if (e.key === 'ArrowLeft') { e.preventDefault(); lbGo(-1); return; }
      if (e.key === 'ArrowRight') { e.preventDefault(); lbGo(1); return; }
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') { e.preventDefault(); return; }
      return;
    }
    if (e.key === 'Escape') { return; }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      const cards = [...document.querySelectorAll('.work-card:not(.is-hidden)')];
      if (cards.length < 2) return;
      const dir = e.key === 'ArrowLeft' ? 1 : -1;
      const next = cards[(cards.indexOf(workGrid.querySelector('.work-card[data-current]')) + dir + cards.length) % cards.length];
      openProject(cards[(Math.max(currentIndex, 0) + dir + cards.length) % cards.length] || next);
    }
  });

  window.addEventListener('scroll', () => {
    const progress = document.querySelector('.project-progress span');
    if (progress) progress.style.width = `${(window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100}%`;
  }, { passive: true });

  const revealElements = document.querySelectorAll('.reveal');
  if (reducedMotion || !window.gsap || !window.ScrollTrigger) {
    revealElements.forEach((element) => { element.style.opacity = '1'; element.style.transform = 'none'; });
  } else {
    gsap.registerPlugin(ScrollTrigger);
    gsap.from('.hero-title span', { y: 90, opacity: 0, stagger: .1, duration: 1.25, ease: 'power4.out' });
    gsap.from('.hero-top > *, .hero-bottom > *', { y: 20, opacity: 0, stagger: .12, duration: .8, delay: .35, ease: 'power2.out' });
    revealElements.forEach((element) => gsap.to(element, { scrollTrigger: { trigger: element, start: 'top 84%' }, y: 0, opacity: 1, duration: .9, ease: 'power3.out' }));
  }

  loadLazyImages(document);
  loadProjects();
})();
