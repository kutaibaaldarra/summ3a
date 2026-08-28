(() => {
  const root = document.documentElement;
  const cursor = document.querySelector('.cursor');
  const canvas = document.getElementById('field');
  const context = canvas?.getContext('2d');

  const resizeField = () => {
    if (!canvas || !context) return;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = window.innerWidth * ratio;
    canvas.height = window.innerHeight * ratio;
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
  };

  const drawField = (time = 0) => {
    if (!context) return;
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
    requestAnimationFrame(drawField);
  };

  resizeField();
  drawField();
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
  const toArr = (v) => Array.isArray(v) ? v : String(v || '').split(/\n|\·|,/).map((s) => s.trim()).filter(Boolean);

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
      cover: d.coverImage || d.cover || '',
      description: d.description || '',
      beforeImage: d.beforeImage || '',
      afterImage: d.afterImage || '',
      gallery: toArr(d.galleryImages || d.gallery),
      color: d.color || '',
      format: d.format || {},
      blocks: Array.isArray(d.blocks) ? d.blocks : [],
      order: typeof d.order === 'number' ? d.order : 999
    };
  }

  /* ═══════════════════ الشبكة ═══════════════════ */
  const workGrid = document.querySelector('.work-grid');

  function cardHTML(p) {
    return `<article class="work-card reveal is-dynamic" data-category="${esc(p.category)}" tabindex="0" role="button" aria-label="${esc(p.title)}">
      <div class="work-image">
        <img src="${esc(p.cover)}" alt="${esc(p.title)}" loading="lazy">
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

  async function loadProjects() {
    try {
      if (typeof firebase === 'undefined') return;
      firebase.initializeApp(CFG);
      const db = firebase.firestore();
      const snap = await db.collection('projects').get();
      const list = [];
      snap.forEach((doc) => {
        const data = doc.data();
        if (data.published === false) return;
        list.push(mapDoc(doc.id, data));
      });
      list.sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
      if (!list.length) return;
      workGrid.innerHTML = list.map(cardHTML).join('');
      const cards = workGrid.querySelectorAll('.work-card');
      cards.forEach((card, i) => { card._project = list[i]; });
      window.lucide?.createIcons();
      workGrid.querySelectorAll('.work-card').forEach(revealEl);
      if (window.ScrollTrigger) ScrollTrigger.refresh();
    } catch (err) {
      console.warn('تعذّر تحميل الأعمال من الخادم، سيتم عرض الأعمال الافتراضية.', err);
    }
  }

  /* ربط بيانات المشروع بكل بطاقة (الديناميكية تحمل _project جاهزة) */
  function resolveProject(card) {
    if (card._project) return card._project;
    const title = card.dataset.project || card.querySelector('strong')?.textContent.trim();
    card._project = FALLBACK_PROJECTS.find((p) => p.title === title) || {
      title: title || 'عمل مختار',
      subtitle: card.querySelector('.work-meta span')?.textContent.trim() || '',
      category: card.dataset.category || 'digital',
      tag: card.querySelector('.work-tag')?.textContent.trim() || '',
      cover: card.querySelector('img')?.src || '',
      description: 'تجربة رقمية مدروسة بُنيت بعناية وقصد.',
      services: ['استراتيجية', 'تصميم', 'تقنية'],
      gallery: []
    };
    return card._project;
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
  let currentIndex = -1;

  const hMap = { sm:'ch-sm',md:'ch-md',lg:'ch-lg',full:'ch-full' };
  const gcMap = { auto:'',two:'gc-two',single:'gc-single' };

  function renderBlocksCase(p) {
    const hero = modal.querySelector('.case-hero');
    const panel = modal.querySelector('.modal-panel');
    let textOrder = 'image'; let sections = [];
    p.blocks.forEach(b => {
      if (b.t==='cover') { hero.className = 'case-hero '+(hMap[b.h]||'ch-md'); modalImage.src = b.src||''; }
      else if (b.t==='title') textOrder = 'text';
    });

    function renderBlock(b) {
      if (b.t==='title') {
        const fw = b.weight==='light'?400:b.weight==='bold'?900:b.weight==='medium'?650:700;
        const fs = b.size==='sm'?'clamp(1.3rem,3.5vw,2.8rem)':b.size==='lg'?'clamp(1.9rem,6.4vw,5.8rem)':'clamp(1.6rem,4.8vw,4.6rem)';
        const dir = b.dir ? 'direction:'+b.dir+';' : '';
        return '<h2 id="modal-title" class="block-title" style="text-align:'+b.align+';font-size:'+fs+';font-weight:'+fw+';'+dir+'">'+b.x+'</h2>';
      }
      if (b.t==='lede') {
        const fw = b.weight==='bold'?700:b.weight==='light'?400:500;
        const fs = b.size==='sm'?'14.5px':b.size==='lg'?'1.45rem':'clamp(1.05rem,1.6vw,1.3rem)';
        const dir = b.dir ? 'direction:'+b.dir+';' : '';
        return '<p class="block-lede" style="text-align:'+b.align+';font-size:'+fs+';font-weight:'+fw+';'+dir+'">'+b.x+'</p>';
      }
      if (b.t==='para') {
        const fw = b.weight==='bold'?700:400;
        const fs = b.size==='sm'?'14.5px':b.size==='lg'?'19px':'16.5px';
        const dir = b.dir ? 'direction:'+b.dir+';' : '';
        return '<p class="block-para" style="text-align:'+b.align+';font-size:'+fs+';font-weight:'+fw+';'+dir+'">'+b.x+'</p>';
      }
      if (b.t==='image' && b.src) return '<div class="block-image ch-'+(b.h||'md')+'"><img src="'+esc(b.src)+'" alt="" loading="lazy">'+(b.caption?'<p class="block-caption" style="text-align:'+(b.align||'center')+'">'+esc(b.caption)+'</p>':'')+'</div>';
      if (b.t==='gallery' && b.imgs?.length) {
        const gc = gcMap[b.cols]||'';
        const many = b.imgs.length>2&&!gc?' is-many':'';
        return '<div class="case-section-title"><span>من داخل المشروع</span></div><div class="case-gallery '+gc+many+'">'+b.imgs.map(g=>'<img src="'+esc(g)+'" alt="" loading="lazy">').join('')+'</div>';
      }
      if (b.t==='ba' && b.a && b.b) return '<div class="ba-slider" style="--ba-pct:50%"><img class="ba-before" src="'+esc(b.a)+'" alt="قبل" loading="lazy"><img class="ba-after" src="'+esc(b.b)+'" alt="بعد" loading="lazy"><div class="ba-edge-before"></div><div class="ba-edge-after"></div><div class="ba-handle"></div><span class="ba-label ba-lbl-before">قبل</span><span class="ba-label ba-lbl-after">بعد</span><span class="ba-hint"><span class="ba-hint-icon">⇔</span> اسحب للمقارنة</span></div>';
      return '';
    }

    if (textOrder==='text') { p.blocks.forEach(b => { const h = renderBlock(b); if (h) sections.push(h); }); }
    else { p.blocks.forEach(b => { const h = renderBlock(b); if (h) sections.push(h); }); }

    if (!sections.length) { sections.push('<h2 class="block-title">'+esc(p.title)+'</h2>'); if (p.subtitle) sections.push('<p class="block-lede">'+esc(p.subtitle)+'</p>'); }
    panel.insertBefore(caseContent, hero);
    caseContent.innerHTML = sections.join('') + '<a href="#contact" class="cta-link case-cta">اطلب مشروعًا مشابهًا <span>↗</span></a>';
    caseContent.querySelector('.case-cta')?.addEventListener('click', (e) => { e.preventDefault(); closeProject(); document.getElementById('contact')?.scrollIntoView({behavior:'smooth'}); });
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
         <div class="case-gallery${gc}${p.gallery.length > 2 && !gc ? ' is-many' : ''}">${p.gallery.map((g) => `<img src="${esc(g)}" alt="" loading="lazy">`).join('')}</div>`
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
      ${ba}${gal}
      ${f.showCta === false ? '' : `<a href="#contact" class="cta-link case-cta">اطلب مشروعًا مشابهًا <span>↗</span></a>`}`;
    caseContent.querySelector('.case-cta')?.addEventListener('click', (e) => {
      e.preventDefault(); closeProject();
      document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
    });
    initBaSliders(caseContent);
  }

  function openProject(card) {
    const p = resolveProject(card);
    const cards = [...document.querySelectorAll('.work-card')];
    currentIndex = cards.indexOf(card);
    modalImage.src = p.cover || card.querySelector('img')?.src || '';
    modalImage.alt = p.title;
    modalNumber.textContent = p.number || AR_NUM[currentIndex] || '٠١';
    buildCase(p);
    root.style.setProperty('--orange', card.dataset.color || '#ef6b32');
    modal.classList.add('is-open');
    if (!modal.open) modal.showModal();
    document.body.classList.add('menu-open');
    modal.querySelector('.modal-close')?.focus();
    modal.querySelector('.modal-panel')?.scrollTo(0, 0);
  }

  const closeProject = () => {
    if (!modal) return;
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

  workGrid?.addEventListener('click', (e) => {
    const card = e.target.closest('.work-card');
    if (card) openProject(card);
  });
  workGrid?.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const card = e.target.closest('.work-card');
    if (card) { e.preventDefault(); openProject(card); }
  });
  modal?.querySelectorAll('[data-close-modal]').forEach((element) => element.addEventListener('click', closeProject));
  document.addEventListener('keydown', (e) => {
    if (!modal?.open) return;
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
  if (window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
    gsap.from('.hero-title span', { y: 90, opacity: 0, stagger: .1, duration: 1.25, ease: 'power4.out' });
    gsap.from('.hero-top > *, .hero-bottom > *', { y: 20, opacity: 0, stagger: .12, duration: .8, delay: .35, ease: 'power2.out' });
    revealElements.forEach((element) => gsap.to(element, { scrollTrigger: { trigger: element, start: 'top 84%' }, y: 0, opacity: 1, duration: .9, ease: 'power3.out' }));
  } else {
    revealElements.forEach((element) => { element.style.opacity = '1'; element.style.transform = 'none'; });
  }

  loadProjects();
})();
