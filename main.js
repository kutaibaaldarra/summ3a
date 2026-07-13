/**
 * ═══════════════════════════════════════════════════════════════
 *                    سمعة — Main Application
 * ═══════════════════════════════════════════════════════════════
 *
 * Sections:
 *   1.  Initialization & Plugins
 *   2.  DOM References & State
 *   3.  GSAP Process Engine Animations
 *   4.  Island Header (morph/dissolve/eye-tracking)
 *   5.  Scroll & Section Detection
 *   6.  GSAP ScrollTrigger Animations
 *   7.  Testimonial Carousel
 *   8.  Why Choose Section (Scroll-pinned / Auto-rotate)
 *   9.  Orbit Engine (Glass Canvas)
 *  10.  Trusted-By Marquee (infinite scroll)
 *  11.  Services Marquee (drag & swipe)
 *  12.  FAQ Accordion
 *  13.  Development Notice Modal
 *  14.  Utilities & Performance
 * ═══════════════════════════════════════════════════════════════
 */

document.addEventListener('DOMContentLoaded', () => {

    // ═══════════════════════════════════════════════════════════
    //  1. INITIALIZATION & PLUGINS
    // ═══════════════════════════════════════════════════════════

    try {
        if (globalThis.islandCore && typeof globalThis.islandCore.initIsland === 'function') {
            globalThis.islandCore.initIsland({ linksUrl: './island-links.json', compact: true });
        }
    } catch (e) { console.warn('islandCore init failed', e); }

    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
        gsap.registerPlugin(ScrollTrigger);
    }

    // ═══════════════════════════════════════════════════════════
    //  2. DOM REFERENCES & STATE
    // ═══════════════════════════════════════════════════════════

    const header = document.getElementById('main-header');
    const headerFull = header.querySelector('.header-full');
    const headerIsland = header.querySelector('.header-island');
    const islandQuestion = document.getElementById('island-question');
    const taskDots = document.querySelectorAll('.task-dot');
    const panel = document.getElementById('island-panel');
    const panelList = document.getElementById('panel-list');
    const panelDetail = document.getElementById('panel-detail');
    const detailTitle = document.getElementById('detail-title');
    const detailSteps = document.getElementById('detail-steps');
    const toggleBtn = document.getElementById('island-toggle') || {
        addEventListener: () => {}, contains: () => false,
        classList: { add: () => {}, remove: () => {} }, focus: () => {}
    };
    const panelClose = document.getElementById('panel-close');
    const leftEye = document.getElementById('eye-left');
    const rightEye = document.getElementById('eye-right');
    const canvas = document.getElementById('dissolve-canvas');
    const ctx = canvas ? canvas.getContext('2d') : null;
    const mobileMenu = document.getElementById('mobile-menu-overlay');
    const sections = document.querySelectorAll('[data-process]');

    header.classList.remove('is-expanded');

    let isIslandMode = false;
    let isDissolving = false;
    let panelOpen = false;
    let currentIndex = 0;
    let particles = [];
    let targetX = 0;
    let targetY = 0;
    let currentEyeX = 0;
    let currentEyeY = 0;
    let animEyesRAF = null;
    let sectionScrollRAF = null;
    let lastIdx = -1;
    let cachedHeaderRect = null;
    let headerRectTimer = null;

    const steps = [
        { question: 'سمعة! شريكك الإبداعي في التسويق 🚀', color: '#f68720', tasks: ['نقدم حلول تسويق متكاملة', 'ندير حسابات السوشال ميديا', 'نصمم هويات بصرية فريدة', 'نحلل البيانات ونحسن الأداء'] },
        { question: 'تبغى تزيد مبيعاتك؟ 📈', color: '#22c55e', tasks: ['نحدد جمهورك المستهدف بدقة', 'نصمم حملات إعلانية ذكية', 'نحسن مسار التحويل', 'نقيس العائد على الاستثمار'] },
        { question: 'نحتاج نعرف جمهورك أولاً 🔍', color: '#3b82f6', tasks: ['نجمع بيانات السلوك الشرائي', 'نحلل اهتمامات الجمهور', 'نحدد أفضل أوقات النشر', 'نخرج بتقارير تحليلية شاملة'] },
        { question: 'نصمم لك هوية تسويقية متكاملة 🎨', color: '#a855f7', tasks: ['نصمم الهوية البصرية', 'نطور استراتيجية المحتوى', 'ننتج فيديوهات وتصاميم', 'نبني دليل العلامة التجارية'] },
        { question: 'نطلق حملتك باقتدار 🚀', color: '#ec4899', tasks: ['نخطط للإطلاق على كل المنصات', 'نشغل الحملات الإعلانية', 'نراقب الأداء لحظياً', 'نحسن النتائج باستمرار'] },
        { question: 'نحسن ونطور بلا توقف 📊', color: '#eab308', tasks: ['نحلل تقارير الأداء', 'نجري اختبارات A/B', 'نعدل الاستراتيجية للنتائج', 'نضمن تحسن مستمر في العائد'] }
    ];

    // ═══════════════════════════════════════════════════════════
    //  3. GSAP PROCESS ENGINE ANIMATIONS
    // ═══════════════════════════════════════════════════════════

    if (typeof gsap !== 'undefined') {
        const continuousTweens = [];

        function pauseProcessAnims() {
            continuousTweens.forEach(t => t.pause());
        }

        function resumeProcessAnims() {
            continuousTweens.forEach(t => t.resume());
        }

        // Glass core entrance
        gsap.fromTo('.glass-core-dark',
            { scale: 0.8, opacity: 0 },
            { scale: 1, opacity: 1, duration: 1, ease: 'elastic.out(1, 0.5)', delay: 0.5 }
        );

        // Data trace paths fade-in
        gsap.fromTo("path[stroke='url(#copper)']",
            { opacity: 0, strokeWidth: 0 },
            { opacity: 0.5, strokeWidth: 2, duration: 1, ease: 'power2.out', stagger: 0.03, delay: 0.1 }
        );

        // Continuous stroke-dash animations (in/out flows)
        gsap.utils.toArray('.data-flow-in').forEach((path, i) => {
            continuousTweens.push(gsap.fromTo(path,
                { strokeDashoffset: 64 },
                { strokeDashoffset: -64, duration: 1.2, ease: 'none', repeat: -1, delay: i * 0.2 }
            ));
        });

        gsap.utils.toArray('.data-flow-out').forEach((path, i) => {
            continuousTweens.push(gsap.fromTo(path,
                { strokeDashoffset: 64 },
                { strokeDashoffset: -64, duration: 1.2, ease: 'none', repeat: -1, delay: i * 0.15 + 0.3 }
            ));
        });

        // SVG circle pulse
        if (document.querySelector('circle[stroke="#f68720"], circle[stroke="#10b981"]')) {
            continuousTweens.push(gsap.to('circle[stroke="#f68720"], circle[stroke="#10b981"]', {
                scale: 1.3, opacity: 0.6, duration: 0.8, ease: 'power2.inOut', yoyo: true, repeat: -1,
                stagger: { each: 0.1, from: 'random' }
            }));
        }

        // Mini-card icon hover effects
        document.querySelectorAll('.mini-card').forEach((card, index) => {
            const icon = card.querySelector('.card-icon');
            let idleTween = null;
            if (!icon) return;

            card.addEventListener('mouseenter', () => {
                if (idleTween) { idleTween.kill(); idleTween = null; }
                gsap.killTweensOf(icon);
                gsap.to(icon, { rotation: 360, scale: 1.3, duration: 0.6, ease: 'back.out(1.7)' });
            });

            card.addEventListener('mouseleave', () => {
                gsap.to(icon, { rotation: 0, scale: 1, duration: 0.4, ease: 'power2.out', onComplete: () => {
                    idleTween = gsap.to(icon, { scale: 1.1, duration: 0.8, ease: 'power2.inOut', yoyo: true, repeat: -1, delay: index * 0.3 });
                }});
            });
        });

        // CPU core continuous animations
        continuousTweens.push(gsap.to('.cpu-ring', { rotation: 360, duration: 30, ease: 'none', repeat: -1, transformOrigin: 'center center' }));
        continuousTweens.push(gsap.to('.zap-icon', { scale: 1.2, opacity: 0.7, duration: 0.5, ease: 'power2.inOut', yoyo: true, repeat: -1 }));

        // CPU core hover interactions
        const cpuCore = document.getElementById('cpu-core');
        if (cpuCore) {
            cpuCore.addEventListener('click', () => {
                gsap.to('.cpu-inner', { scale: 0.95, duration: 0.1, yoyo: true, repeat: 1, ease: 'power2.inOut' });
                gsap.to('.glass-core-dark', { boxShadow: '0 0 60px rgba(246, 135, 32, 0.5)', duration: 0.3, yoyo: true, repeat: 1 });
            });
            cpuCore.addEventListener('mouseenter', () => {
                gsap.to('.cpu-ring', { scale: 1.1, borderColor: '#f68720', duration: 0.4, ease: 'power2.out' });
                gsap.to('.cpu-inner', { rotation: 90, boxShadow: '0 0 30px rgba(246, 135, 32, 0.5)', duration: 0.5, ease: 'back.out(1.7)' });
            });
            cpuCore.addEventListener('mouseleave', () => {
                gsap.to('.cpu-ring', { scale: 1, borderColor: 'rgba(246, 135, 32, 0.4)', duration: 0.4, ease: 'power2.out' });
                gsap.to('.cpu-inner', { rotation: 0, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', duration: 0.5, ease: 'power2.out' });
            });
        }

        // Pause process tweens when off-screen
        const processSection = document.getElementById('process');
        if (processSection) {
            const processObserver = new IntersectionObserver((entries) => {
                entries[0].isIntersecting ? resumeProcessAnims() : pauseProcessAnims();
            }, { threshold: 0.05 });
            processObserver.observe(processSection);
            pauseProcessAnims();
        }

        // Pause AI card-icon tweens when off-screen
        const aiSection = document.getElementById('ai-strategy');
        if (aiSection) {
            const cardIconTweens = [];
            aiSection.querySelectorAll('.card-icon').forEach(icon => {
                cardIconTweens.push(gsap.to(icon, { scale: 1.1, duration: 0.8, ease: 'power2.inOut', yoyo: true, repeat: -1 }));
            });
            const aiObserver = new IntersectionObserver((entries) => {
                cardIconTweens.forEach(t => entries[0].isIntersecting ? t.resume() : t.pause());
            }, { threshold: 0.05 });
            aiObserver.observe(aiSection);
            cardIconTweens.forEach(t => t.pause());
        }
    }

    // ═══════════════════════════════════════════════════════════
    //  4. ISLAND HEADER (morph / dissolve / eye-tracking)
    // ═══════════════════════════════════════════════════════════

    // Build panel list items
    steps.forEach((step, i) => {
        const item = document.createElement('div');
        item.className = 'panel-item';
        item.innerHTML = `<span class="dot-indicator" style="background:${step.color}"></span><span>${step.question.replace(/[\u{1F50D}\u{1F4CA}\u{1F3A8}\u{26A1}\u{1F680}\u{1F4C8}]/gu, '')}</span>`;
        item.addEventListener('click', () => showDetail(i));
        panelList.appendChild(item);
    });

    function showDetail(index = 0) {
        currentIndex = index;
        const step = steps[index];
        detailTitle.textContent = step.question;
        detailSteps.innerHTML = step.tasks.map(t => `<li>${t}</li>`).join('');
        panelDetail.classList.add('show');
        updateActiveDot(index);
        updateQuestion(index);
        panelList.querySelectorAll('.panel-item').forEach((el, i) => {
            el.style.background = i === index ? 'rgba(255,255,255,0.08)' : 'transparent';
        });
    }

    function updateQuestion(index = 0) {
        if (typeof gsap !== 'undefined' && questionTween) { questionTween.kill(); }
        islandQuestion.textContent = steps[index].question;
    }

    let questionTween = null;

    function updateActiveDot(index = 0) {
        taskDots.forEach((d, i) => d.classList.toggle('active', i === index));
    }

    function setSection(index = 0) {
        steps.forEach((_, i) => header.classList.remove('section-' + i));
        header.classList.add('section-' + index);
    }

    // Panel open/close
    function openPanel() {
        panelOpen = true;
        panel.classList.add('open');
        toggleBtn.classList.add('active');
        panelDetail.classList.remove('show');
        if (currentIndex >= 0) showDetail(currentIndex);
    }

    function closePanel() {
        panelOpen = false;
        panel.classList.remove('open');
        toggleBtn.classList.remove('active');
    }

    toggleBtn.addEventListener('click', () => panelOpen ? closePanel() : openPanel());
    panelClose.addEventListener('click', closePanel);
    document.addEventListener('click', (e) => {
        if (panelOpen && !panel.contains(e.target) && !toggleBtn.contains(e.target)) closePanel();
    });

    // Task dots interactions
    taskDots.forEach((dot, i) => {
        dot.addEventListener('mouseenter', () => {
            if (isIslandMode) {
                const r = header.getBoundingClientRect();
                const el = dot.getBoundingClientRect();
                const dx = (el.left + el.width / 2 - (r.left + r.width / 2)) / r.width;
                const dy = (el.top + el.height / 2 - (r.top + r.height / 2)) / r.height;
                targetX = Math.max(-0.6, Math.min(0.6, dx)) * 4;
                targetY = Math.max(-0.4, Math.min(0.4, dy)) * 3;
            }
        });
        dot.addEventListener('mouseleave', () => { targetX = 0; targetY = 0; });
        dot.addEventListener('click', () => {
            showDetail(i);
            if (!panelOpen) openPanel();
            const s = document.querySelector(`[data-process="${i}"]`);
            if (s) s.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
    });

    // Mouse tracking for eye movement (with rect caching)
    document.addEventListener('mousemove', (e) => {
        if (!isIslandMode) return;
        if (!cachedHeaderRect) {
            cachedHeaderRect = header.getBoundingClientRect();
            clearTimeout(headerRectTimer);
            headerRectTimer = setTimeout(() => { cachedHeaderRect = null; }, 200);
        }
        const r = cachedHeaderRect;
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        const dx = (e.clientX - cx) / r.width;
        const dy = (e.clientY - cy) / r.height;
        targetX = Math.max(-0.6, Math.min(0.6, dx)) * 4;
        targetY = Math.max(-0.4, Math.min(0.4, dy)) * 3;
        startEyeLoop();
    });

    // Eye animation loop
    function animEyes() {
        if (!isIslandMode && targetX === 0 && targetY === 0) {
            animEyesRAF = null;
            return;
        }
        currentEyeX += (targetX - currentEyeX) * 0.08;
        currentEyeY += (targetY - currentEyeY) * 0.08;
        if (leftEye) leftEye.style.transform = `translate(${currentEyeX}px,${currentEyeY}px)`;
        if (rightEye) rightEye.style.transform = `translate(${currentEyeX}px,${currentEyeY}px)`;
        animEyesRAF = requestAnimationFrame(animEyes);
    }

    function startEyeLoop() {
        if (!animEyesRAF) animEyesRAF = requestAnimationFrame(animEyes);
    }

    // Dissolve transition (header → island mode)
    function triggerDissolve() {
        if (isDissolving) return;
        isDissolving = true;
        const tl = (typeof gsap !== 'undefined')
            ? gsap.timeline({ onComplete: () => { setSection(0); isDissolving = false; isIslandMode = true; updateQuestion(0); updateActiveDot(0); } })
            : { to: () => {}, call: () => {} };
        const logo = headerFull.querySelector('.header-logo');
        const navItems = headerFull.querySelectorAll('.header-nav a');
        const menuBtn = headerFull.querySelector('.header-menu-btn');

        if (typeof gsap === 'undefined') {
            header.classList.add('island');
        } else {
            header.style.transition = 'none';
            tl.to(logo, { x: -120 - Math.random() * 60, y: -40 - Math.random() * 30, rotation: -10 + Math.random() * 20, opacity: 0, scale: 0.6, duration: 0.3, ease: 'power2.in' }, 0);
            navItems.forEach((item, i) => {
                const a = (i / navItems.length) * Math.PI * 2;
                const d = 80 + Math.random() * 100;
                tl.to(item, { x: Math.cos(a) * d, y: Math.sin(a) * d - 30, rotation: -10 + Math.random() * 20, opacity: 0, scale: 0.5, duration: 0.25, ease: 'power2.in' }, 0.015 * i);
            });
            tl.to(menuBtn, { x: 50 + Math.random() * 40, y: -30 - Math.random() * 20, opacity: 0, scale: 0.5, duration: 0.25, ease: 'power2.in' }, 0.03);
            tl.call(() => header.classList.add('island'), [], 0.28);
            tl.call(() => { header.style.transition = ''; }, [], 0.29);
            tl.call(startEyeLoop, [], 0.28);
        }

        // Spawn dissolve particles
        if (ctx) {
            const hdrRect = header.getBoundingClientRect();
            const cx = hdrRect.left + hdrRect.width / 2;
            const cy = hdrRect.top + hdrRect.height / 2;
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            canvas.style.width = '100%';
            canvas.style.height = '100%';
            canvas.style.left = '0';
            canvas.style.top = '0';

            for (let i = 0; i < 40; i++) {
                const a = Math.random() * 6.2832;
                const s = 60 + Math.random() * 180;
                const sp = Math.random() > 0.5;
                const r = Math.random();
                let color;
                if (r < 0.35) color = '#f68720';
                else if (r < 0.6) color = '#ffd700';
                else if (r < 0.8) color = '#fff';
                else color = '#ff6b35';

                particles.push({
                    x: cx + (Math.random() - 0.5) * hdrRect.width * 0.8,
                    y: cy + (Math.random() - 0.5) * hdrRect.height * 0.8,
                    vx: Math.cos(a) * s * (0.2 + Math.random() * 0.8),
                    vy: Math.sin(a) * s * (0.2 + Math.random() * 0.8),
                    size: 2 + Math.random() * 5,
                    alpha: 0.9 + Math.random() * 0.1,
                    color, life: 1, isSpark: sp
                });
            }
            canvas.classList.add('active');
            requestAnimationFrame(animParticleFrame);
        }
    }

    function animParticleFrame() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        let alive = false;
        for (let i = 0; i < particles.length; i++) {
            const p = particles[i];
            p.x += p.vx * 0.016;
            p.y += p.vy * 0.016;
            p.vx *= 0.95;
            p.vy *= 0.95;
            p.vy += 10 * 0.016;
            p.life -= p.isSpark ? 0.03 : 0.015;
            p.alpha = Math.max(0, p.life * 0.8);
            if (p.life > 0) {
                alive = true;
                ctx.globalAlpha = p.alpha;
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size * p.life * (p.isSpark ? 1.2 : 1), 0, 6.2832);
                ctx.fill();
            }
        }
        if (alive) {
            requestAnimationFrame(animParticleFrame);
        } else {
            canvas.classList.remove('active');
            particles = [];
        }
    }

    // Morph back from island mode
    function morphBack() {
        if (!isIslandMode) return;
        isIslandMode = false;
        targetX = 0;
        targetY = 0;
        const logo = headerFull.querySelector('.header-logo');
        const navItems = headerFull.querySelectorAll('.header-nav a');
        const menuBtn = headerFull.querySelector('.header-menu-btn');

        if (typeof gsap === 'undefined') {
            header.classList.remove('island');
            header.classList.remove('is-expanded');
        } else {
            gsap.to(headerIsland, { opacity: 0, scale: 0.88, duration: 0.15, ease: 'power2.in', onComplete: () => gsap.set(headerIsland, { clearProps: 'opacity,transform' }) });
            steps.forEach((_, i) => header.classList.remove('section-' + i));
            header.classList.remove('island', 'is-expanded');
            gsap.set(header, { clearProps: 'transform,top,left,boxShadow,width' });
            gsap.set(logo, { clearProps: 'transform,opacity' });
            navItems.forEach(item => gsap.set(item, { clearProps: 'transform,opacity' }));
            gsap.set(menuBtn, { clearProps: 'transform,opacity' });
        }
        if (panelOpen) closePanel();
    }

    // ═══════════════════════════════════════════════════════════
    //  5. SCROLL & SECTION DETECTION
    // ═══════════════════════════════════════════════════════════

    function handleSectionScroll(idx) {
        lastIdx = idx;
        if (!isIslandMode) return;
        updateQuestion(idx);
        updateActiveDot(idx);
        setSection(idx);
    }

    function handleSectionScrollRAF() {
        sectionScrollRAF = null;
        const sy = globalThis.scrollY;

        // Dissolve / morph transitions based on scroll position
        if (sy > 120 && !isIslandMode && !isDissolving) {
            triggerDissolve();
        } else if (sy <= 50 && isIslandMode) {
            morphBack();
        }

        // Detect which section is in view
        if (isIslandMode) {
            for (let i = 0; i < sections.length; i++) {
                const r = sections[i].getBoundingClientRect();
                if (r.top < globalThis.innerHeight * 0.4 && r.bottom > globalThis.innerHeight * 0.4) {
                    const idx = Number.parseInt(sections[i].dataset.process, 10);
                    if (idx !== lastIdx) handleSectionScroll(idx);
                    break;
                }
            }
        }
    }

    globalThis.addEventListener('scroll', () => {
        if (sectionScrollRAF !== null) return;
        sectionScrollRAF = requestAnimationFrame(handleSectionScrollRAF);
    }, { passive: true });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (panelOpen) closePanel();
            if (mobileMenu && mobileMenu.classList.contains('open')) mobileMenu.classList.remove('open');
        }
    });

    // Mobile menu close handlers
    const mobileMenuClose = document.getElementById('mobile-menu-close');
    if (mobileMenuClose && mobileMenu) {
        mobileMenuClose.addEventListener('click', () => mobileMenu.classList.remove('open'));
    }
    if (mobileMenu) {
        mobileMenu.querySelectorAll('a').forEach(a => {
            a.addEventListener('click', () => mobileMenu.classList.remove('open'));
        });
    }

    // ═══════════════════════════════════════════════════════════
    //  6. GSAP SCROLL TRIGGER ANIMATIONS
    // ═══════════════════════════════════════════════════════════

    const isMobile = window.innerWidth <= 768;

    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined' && !isMobile) {
        // Batch scroll-animate elements
        ScrollTrigger.batch('.scroll-animate', {
            onEnter: (batch) => {
                gsap.fromTo(batch,
                    { opacity: 0, y: 50, scale: 0.97 },
                    { opacity: 1, y: 0, scale: 1, duration: 0.9, ease: 'power3.out', stagger: 0.12, overwrite: true }
                );
            },
            start: 'top 88%',
            once: true
        });

        // Hero entrance timeline
        const heroTl = gsap.timeline({ defaults: { ease: 'power3.out' } });
        heroTl
            .fromTo('.absolute-left', { opacity: 0, x: -60, scale: 0.95 }, { opacity: 1, x: 0, scale: 1, duration: 1 }, 0)
            .fromTo('.absolute-right', { opacity: 0, x: 60, scale: 0.95 }, { opacity: 1, x: 0, scale: 1, duration: 1 }, 0.15)
            .fromTo('.become-pro', { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.8 }, 0.3);

        // Hero parallax on scroll
        gsap.to('.absolute-left', { y: -30, scrollTrigger: { trigger: '.hero-section', start: 'top top', end: 'bottom top', scrub: 1 } });
        gsap.to('.absolute-right', { y: -20, scrollTrigger: { trigger: '.hero-section', start: 'top top', end: 'bottom top', scrub: 1 } });
        gsap.to('.become-pro', { y: -15, scrollTrigger: { trigger: '.hero-section', start: 'top top', end: 'bottom top', scrub: 1.5 } });

        // FAQ section reveal
        const faqSection = document.querySelector('#faq');
        if (faqSection) {
            const faqTl = gsap.timeline({ scrollTrigger: { trigger: faqSection, start: 'top 80%', once: true } });
            const faqSub = faqSection.querySelector('.text-center span');
            const faqTitle = faqSection.querySelector('.text-center h2');
            const faqItems = faqSection.querySelectorAll('.faq-item');
            if (faqSub) faqTl.fromTo(faqSub, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }, 0);
            if (faqTitle) faqTl.fromTo(faqTitle, { opacity: 0, y: 30, scale: 0.95 }, { opacity: 1, y: 0, scale: 1, duration: 0.7, ease: 'back.out(1.4)' }, 0.15);
            if (faqItems.length) {
                faqTl.fromTo(faqItems,
                    { opacity: 0, y: 40, x: -30, rotationX: 8 },
                    { opacity: 1, y: 0, x: 0, rotationX: 0, duration: 0.6, ease: 'back.out(1.2)', stagger: 0.12 },
                    0.35
                );
            }
        }

        // CTA section reveal
        ScrollTrigger.create({
            trigger: '.cta-glass-card, .cta-section',
            start: 'top 80%',
            once: true,
            onEnter: () => {
                gsap.fromTo('.cta-glass-card, .cta-section',
                    { opacity: 0, scale: 0.92, y: 40 },
                    { opacity: 1, scale: 1, y: 0, duration: 1, ease: 'power3.out' }
                );
            }
        });

        // Footer reveal
        const footerEl = document.querySelector('.footer-animate');
        if (footerEl) {
            ScrollTrigger.create({
                trigger: footerEl,
                start: 'top 90%',
                once: true,
                onEnter: () => {
                    gsap.fromTo(footerEl.querySelectorAll('.footer-section'),
                        { opacity: 0, y: 30 },
                        { opacity: 1, y: 0, duration: 0.7, ease: 'power2.out', stagger: 0.1 }
                    );
                }
            });
        }

        // Process section content reveal
        ScrollTrigger.batch('#process [data-process] .section-content', {
            onEnter: (batch) => {
                batch.forEach((el) => {
                    const num = el.querySelector('.section-number');
                    const tl = gsap.timeline();
                    tl.fromTo(el, { opacity: 0, y: 50 }, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }, 0);
                    if (num) tl.fromTo(num, { scale: 0.4, opacity: 0, rotation: -10 }, { scale: 1, opacity: 1, rotation: 0, duration: 0.6, ease: 'back.out(2)' }, 0.15);
                });
            },
            start: 'top 80%',
            once: true
        });
    } else {
        // Mobile fallback: show everything immediately
        document.querySelectorAll('.scroll-animate').forEach(el => {
            el.style.opacity = '1';
            el.style.transform = 'translateY(0)';
        });
        const footerEl = document.querySelector('.footer-animate');
        if (footerEl) footerEl.classList.add('visible');
    }

    // ═══════════════════════════════════════════════════════════
    //  7. TESTIMONIAL CAROUSEL
    // ═══════════════════════════════════════════════════════════

    document.querySelectorAll('.testimonial-carousel').forEach(carousel => {
        const cards = carousel.querySelectorAll('.tcard');
        let idx = 0;
        let carouselInterval = null;

        function rotateCards() {
            cards.forEach((c, i) => {
                c.classList.remove('active', 'left', 'right');
                if (i === idx) c.classList.add('active');
                else if (i === (idx + 1) % cards.length) c.classList.add('right');
                else c.classList.add('left');
            });
            idx = (idx + 1) % cards.length;
        }

        rotateCards();

        const carouselObs = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                if (!carouselInterval) carouselInterval = setInterval(rotateCards, 3000);
            } else {
                if (carouselInterval) { clearInterval(carouselInterval); carouselInterval = null; }
            }
        }, { threshold: 0.1 });
        carouselObs.observe(carousel);
    });

    // Testimonials island notification
    const testimonialsSection = document.getElementById('testimonials');
    if (testimonialsSection && header) {
        const testimonialObs = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    header.classList.add('island-expanded');
                    const notifTitle = header.querySelector('.island-notif-title');
                    const notifDesc = header.querySelector('.island-notif-desc');
                    if (notifTitle) notifTitle.textContent = 'ابدأ رحلتك';
                    if (notifDesc) notifDesc.textContent = 'وكن واحداً منهم';
                } else {
                    header.classList.remove('island-expanded');
                }
            });
        }, { threshold: 0.3 });
        testimonialObs.observe(testimonialsSection);
    }

    // ═══════════════════════════════════════════════════════════
    //  8. WHY CHOOSE SECTION (Scroll-pinned / Auto-rotate)
    // ═══════════════════════════════════════════════════════════

    const whySection = document.getElementById('why-choose');
    if (whySection) {
        const whySlides = whySection.querySelectorAll('.why-slide');
        const whyTexts = whySection.querySelectorAll('.why-text-slide');
        const totalSlides = whySlides.length;
        let whyIdx = 0;
        let whyInterval = null;
        let whyScrollTrigger = null;

        function setWhySlide(i) {
            whySlides.forEach((s, j) => s.classList.toggle('active', j === i));
            whyTexts.forEach((t, j) => t.classList.toggle('active', j === i));
        }

        function startWhyAuto() {
            if (whyInterval) return;
            whyInterval = setInterval(() => {
                whyIdx = (whyIdx + 1) % totalSlides;
                setWhySlide(whyIdx);
            }, 3500);
        }

        function stopWhyAuto() {
            if (whyInterval) { clearInterval(whyInterval); whyInterval = null; }
        }

        function destroyWhyScrollTrigger() {
            if (whyScrollTrigger) { whyScrollTrigger.kill(); whyScrollTrigger = null; }
            whySection.querySelectorAll('.pin-spacer').forEach(p => p.remove());
        }

        function updateWhyScroll() {
            const rect = whySection.getBoundingClientRect();
            const STICKY_TOP = 70;
            if (rect.top > STICKY_TOP) {
                if (whyIdx !== 0) { setWhySlide(0); whyIdx = 0; }
                return;
            }
            const stickyEnd = -(rect.height - window.innerHeight);
            if (rect.top < stickyEnd) {
                if (whyIdx !== totalSlides - 1) { setWhySlide(totalSlides - 1); whyIdx = totalSlides - 1; }
                return;
            }
            const scrolled = STICKY_TOP - rect.top;
            const totalScroll = STICKY_TOP - stickyEnd;
            const scrollProgress = Math.min(1, Math.max(0, scrolled / totalScroll));
            const idx = Math.min(totalSlides - 1, Math.max(0, Math.floor(scrollProgress * totalSlides)));
            if (idx !== whyIdx) { whyIdx = idx; setWhySlide(idx); }
        }

        function initWhyMode() {
            const mobile = window.innerWidth <= 768;
            destroyWhyScrollTrigger();
            window.removeEventListener('scroll', updateWhyScroll);
            stopWhyAuto();
            whyIdx = 0;
            setWhySlide(0);

            if (mobile) {
                startWhyAuto();
            } else if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
                whyScrollTrigger = ScrollTrigger.create({
                    trigger: whySection,
                    start: 'top top',
                    end: '+=200%',
                    pin: '.why-sticky-content',
                    pinSpacing: true,
                    anticipatePin: 1,
                    snap: { snapTo: 1 / (totalSlides - 1), duration: { min: 0.15, max: 0.3 }, delay: 0, ease: 'power1.inOut' },
                    onUpdate: function(self) {
                        const idx = Math.min(totalSlides - 1, Math.max(0, Math.round(self.progress * (totalSlides - 1))));
                        if (idx !== whyIdx) { whyIdx = idx; setWhySlide(idx); }
                    }
                });
            } else {
                window.addEventListener('scroll', updateWhyScroll, { passive: true });
                updateWhyScroll();
            }
        }

        initWhyMode();
        let whyResizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(whyResizeTimer);
            whyResizeTimer = setTimeout(initWhyMode, 150);
        });
    }

    // ═══════════════════════════════════════════════════════════
    //  9. ORBIT ENGINE (Glass Canvas)
    // ═══════════════════════════════════════════════════════════

    const orbitNodes = document.querySelectorAll('.icon-node');
    const stepId = document.getElementById('stepId');
    const stepTitle = document.getElementById('stepTitle');
    const stepText = document.getElementById('stepText');
    const mainWheel = document.getElementById('wheel');

    const orbitSteps = [
        { id: '01', title: 'تحليل ذكي', text: 'نفهم جمهورك بعمق ونحلل سلوكهم الرقمي لنحوّل كل نقرة إلى قرار شرائي حقيقي ومدروس.' },
        { id: '02', title: 'بناء رقمي', text: 'نصمم هوية بصرية فريدة وننتج قوالب ومحتوى إبداعي يجذب جمهورك ويبني حضورك الرقمي.' },
        { id: '03', title: 'تدفق مباشر', text: 'نطلق حملاتك على المنصات المناسبة ونراقب الأداء لحظة بلحظة لضمان أفضل النتائج.' }
    ];

    let currentNode = 0;

    function switchOrbitNode(index = 0) {
        if (index === currentNode) return;
        currentNode = index;
        const step = orbitSteps[index];

        if (typeof gsap === 'undefined') {
            stepId.textContent = step.id;
            stepTitle.textContent = step.title;
            stepText.textContent = step.text;
        } else {
            gsap.to([stepId, stepTitle, stepText], {
                opacity: 0, y: -10, duration: 0.25, stagger: 0.05,
                onComplete: () => {
                    stepId.textContent = step.id;
                    stepTitle.textContent = step.title;
                    stepText.textContent = step.text;
                    gsap.to([stepId, stepTitle, stepText], { opacity: 1, y: 0, duration: 0.35, stagger: 0.05, ease: 'back.out(1.7)' });
                }
            });
        }

        orbitNodes.forEach((node, i) => {
            node.classList.toggle('active-glow', i === index);
            node.classList.toggle('opacity-20', i !== index);
        });

        const rotations = [0, -120, 120];
        if (mainWheel && typeof gsap !== 'undefined') {
            gsap.to(mainWheel, { rotation: rotations[index], duration: 0.8, ease: 'back.out(1.7)', transformOrigin: 'center center' });
        }
    }

    orbitNodes.forEach((node, i) => {
        node.addEventListener('click', () => switchOrbitNode(i));
        node.addEventListener('mouseenter', () => {
            if (typeof gsap !== 'undefined') gsap.to(node, { scale: 1.1, duration: 0.2, ease: 'power2.out' });
        });
        node.addEventListener('mouseleave', () => {
            if (typeof gsap !== 'undefined') gsap.to(node, { scale: 1, duration: 0.2, ease: 'power2.out' });
        });
    });

    // Auto-rotate orbit when visible
    const orbitSection = document.querySelector('.glass-canvas');
    let orbitInterval = null;

    function startOrbitInterval() {
        if (orbitInterval) return;
        orbitInterval = setInterval(() => switchOrbitNode((currentNode + 1) % 3), 4000);
    }

    function stopOrbitInterval() {
        if (orbitInterval) { clearInterval(orbitInterval); orbitInterval = null; }
    }

    if (orbitSection) {
        const orbitObs = new IntersectionObserver((entries) => {
            entries[0].isIntersecting ? startOrbitInterval() : stopOrbitInterval();
        }, { threshold: 0.1 });
        orbitObs.observe(orbitSection);
    }

    // Refresh ScrollTrigger after orbit setup
    if (typeof ScrollTrigger !== 'undefined' && typeof ScrollTrigger.refresh === 'function') {
        ScrollTrigger.refresh();
    }

    // ═══════════════════════════════════════════════════════════
    //  10. TRUSTED-BY MARQUEE (infinite seamless scroll)
    // ═══════════════════════════════════════════════════════════

    const mc = document.querySelector('.trusted-carousel');
    const mt = mc ? mc.querySelector('.animate-scroll') : null;

    if (mt && mc) {
        const halfW = mt.scrollWidth / 2;
        let pos = 0;
        const speed = 0.5;
        let paused = false;

        mc.addEventListener('mouseenter', () => paused = true);
        mc.addEventListener('mouseleave', () => paused = false);

        (function marqueeLoop() {
            if (!paused) {
                pos -= speed;
                if (pos <= -halfW) pos += halfW;
                mt.style.transform = 'translateX(' + pos + 'px)';
            }
            requestAnimationFrame(marqueeLoop);
        })();
    }

    // ═══════════════════════════════════════════════════════════
    //  11. SERVICES MARQUEE (drag & swipe)
    // ═══════════════════════════════════════════════════════════

    const marqueeContainer = document.getElementById('servicesMarquee');
    const marquee = marqueeContainer ? marqueeContainer.querySelector('.marquee') : null;
    const marqueeTrack = marquee ? marquee.querySelector('.marquee-track') : null;

    if (marquee && marqueeTrack) {
        let isDown = false;
        let startX = 0;
        let currentX = 0;
        let velocity = 0;
        let lastX = 0;
        let lastTime = 0;

        const maxWidth = marqueeTrack.scrollWidth;
        const viewWidth = marquee.clientWidth;
        const maxScroll = Math.max(0, maxWidth - viewWidth);

        function applyTransform(x) {
            const clampedX = Math.max(0, Math.min(x, maxScroll));
            marqueeTrack.style.transform = 'translateX(' + (-clampedX) + 'px)';
            currentX = clampedX;
        }

        function applyInertia() {
            marqueeTrack.style.transition = 'transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
            applyTransform(currentX + velocity * 150);
        }

        // Mouse events
        marquee.addEventListener('mousedown', (e) => {
            isDown = true;
            marquee.style.cursor = 'grabbing';
            marqueeTrack.style.transition = 'none';
            startX = e.pageX;
            lastX = startX;
            lastTime = Date.now();
            velocity = 0;
        });

        marquee.addEventListener('mousemove', (e) => {
            if (!isDown) return;
            e.preventDefault();
            const now = Date.now();
            const timeDelta = now - lastTime;
            if (timeDelta > 0) velocity = (e.pageX - lastX) / timeDelta;
            applyTransform(currentX - (e.pageX - startX));
            lastX = e.pageX;
            lastTime = now;
        });

        marquee.addEventListener('mouseleave', () => { if (isDown) { isDown = false; marquee.style.cursor = 'grab'; applyInertia(); } });
        marquee.addEventListener('mouseup', () => { if (!isDown) return; isDown = false; marquee.style.cursor = 'grab'; applyInertia(); });

        // Touch events
        marquee.addEventListener('touchstart', (e) => {
            isDown = true;
            marqueeTrack.style.transition = 'none';
            startX = e.touches[0].pageX;
            lastX = startX;
            lastTime = Date.now();
            velocity = 0;
        });

        marquee.addEventListener('touchmove', (e) => {
            if (!isDown) return;
            const now = Date.now();
            const timeDelta = now - lastTime;
            if (timeDelta > 0) velocity = (e.touches[0].pageX - lastX) / timeDelta;
            applyTransform(currentX - (e.touches[0].pageX - startX));
            lastX = e.touches[0].pageX;
            lastTime = now;
        });

        marquee.addEventListener('touchend', () => { if (!isDown) return; isDown = false; applyInertia(); });
        marquee.addEventListener('touchcancel', () => { if (!isDown) return; isDown = false; applyInertia(); });
    }

    // ═══════════════════════════════════════════════════════════
    //  12. FAQ ACCORDION
    // ═══════════════════════════════════════════════════════════

    function closeFaqItem(openItem) {
        openItem.classList.remove('active');
        openItem.querySelector('.faq-btn').setAttribute('aria-expanded', 'false');
    }

    function handleFaqClick(btn) {
        const item = btn.closest('.faq-item');
        const isActive = item.classList.contains('active');
        document.querySelectorAll('.faq-item.active').forEach(closeFaqItem);
        if (!isActive) {
            item.classList.add('active');
            btn.setAttribute('aria-expanded', 'true');
        }
    }

    document.querySelectorAll('.faq-btn').forEach(btn => {
        btn.addEventListener('click', () => handleFaqClick(btn));
    });

    // ═══════════════════════════════════════════════════════════
    //  13. DEVELOPMENT NOTICE MODAL
    // ═══════════════════════════════════════════════════════════

    const islandCta = document.getElementById('island-cta');
    const devNoticeBackdrop = document.getElementById('devNoticeBackdrop');
    const devNoticeModal = document.getElementById('devNoticeModal');
    const devNoticeClose = document.getElementById('devNoticeClose');

    if (devNoticeBackdrop) {
        function closeDevNotice() {
            if (devNoticeModal) {
                devNoticeModal.classList.add('closing');
                setTimeout(() => {
                    devNoticeBackdrop.classList.remove('active');
                    devNoticeModal.classList.remove('closing');
                    document.body.style.overflow = 'auto';
                }, 400);
            }
        }

        // Auto-open on page load
        setTimeout(() => {
            devNoticeBackdrop.classList.add('active');
            document.body.style.overflow = 'hidden';
        }, 800);

        if (islandCta) {
            islandCta.addEventListener('click', () => {
                devNoticeBackdrop.classList.add('active');
                document.body.style.overflow = 'hidden';
            });
        }

        devNoticeClose.addEventListener('click', closeDevNotice);
        devNoticeBackdrop.addEventListener('click', (e) => {
            if (e.target === devNoticeBackdrop) closeDevNotice();
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && devNoticeBackdrop.classList.contains('active')) closeDevNotice();
        });
    }

    // ═══════════════════════════════════════════════════════════
    //  14. UTILITIES & PERFORMANCE
    // ═══════════════════════════════════════════════════════════

    // Lucide icons
    if (typeof lucide !== 'undefined') lucide.createIcons();

    // Pre-paint heavy sections during idle time
    function prePaintHeavy() {
        const ps = document.getElementById('process');
        if (ps) void ps.offsetHeight;
        const cs = document.querySelector('.challenge-section');
        if (cs) void cs.offsetHeight;
    }

    if (typeof requestIdleCallback !== 'undefined') {
        requestIdleCallback(prePaintHeavy, { timeout: 3000 });
    } else {
        setTimeout(prePaintHeavy, 800);
    }

});
