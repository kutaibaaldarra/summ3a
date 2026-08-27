/* ============================================================
   admin-crm.js — العملاء / الطلبات / الإحصائيات
   لوحة تحكم "سمعة" — كود نظيف بدون صور إيموجي
   ============================================================ */
(function () {
    'use strict';

    /* ═══════════════ نصوص الأيقونات (SVG) ═══════════════ */
    var ICONS = {
        users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
        user: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
        package: '<line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>',
        calendar: '<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
        trending: '<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>',
        eye: '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>',
        search: '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
        filter: '<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>',
        download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="3" x2="12" y2="15"/>',
        save: '<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>',
        database: '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>',
        external: '<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>',
        trash: '<polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
        info: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>',
        check: '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>',
        clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
        wallet: '<path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4z"/>',
        message: '<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>',
        phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>',
        mail: '<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>',
        x: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
        bar: '<line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/>',
        pie: '<path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/>',
        refresh: '<polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>',
        layout: '<rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/>',
        star: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
        layers: '<polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>',
        award: '<circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/>',
        plus: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>'
    };

    function svgIcon(inner, size) {
        var s = size || 18;
        return '<svg viewBox="0 0 24 24" width="' + s + '" height="' + s + '" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + inner + '</svg>';
    }
    function ic(name, size) { return ICONS[name] ? svgIcon(ICONS[name], size) : ''; }

    function fillIcons() {
        document.querySelectorAll('[data-ic]').forEach(function (el) {
            var n = el.getAttribute('data-ic');
            if (ICONS[n]) el.innerHTML = svgIcon(ICONS[n], el.getAttribute('data-size') || 18);
        });
    }

    /* ═══════════════ ثوابت ═══════════════ */
    var DB_COLS = { clients: 'leads', orders: 'orders' };
    var STATUS = { new: 'جديد', contacted: 'تم التواصل', interested: 'مهتم', subscribed: 'تم الاشتراك', cancelled: 'ملغي' };
    var STATUS_CLS = { new: 'badge-new', contacted: 'badge-contacted', interested: 'badge-interested', subscribed: 'badge-subscribed', cancelled: 'badge-cancelled' };
    var SOURCE = { questionnaire: 'استبيان', whatsapp: 'واتساب', chat: 'مراسلة' };
    var SOURCE_CLS = { questionnaire: 'badge-questionnaire', whatsapp: 'badge-whatsapp', chat: 'badge-chat' };
    var SRCSRC = { 'فيس بوك': '#1877f2', 'انستغرام': '#e4405f', 'جوجل': '#f68720', 'تيك توك': '#22d3ee', 'X': '#0ea5e9', 'واتساب': '#25d366', 'مباشر': '#22c55e', 'رابط خارجي': '#8b5cf6' };

    /* ═══════════════ حالة التطبيق ═══════════════ */
    var allLeads = [];
    var allOrders = [];
    var allSnapshots = [];
    var visitorDocs = {};
    var clientFilter = { status: 'all' };
    var orderFilter = { status: 'all' };
    var statsRange = 'week';

    /* ═══════════════ أدوات مساعدة ═══════════════ */
    function $(id) { return document.getElementById(id); }
    function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
    function fmtMoney(n) { return (parseFloat(n) || 0).toLocaleString('en-US') + ' ر.س'; }
    function fmtDate(iso) { return iso ? new Date(iso).toLocaleDateString('ar-SA', { day: 'numeric', month: 'short' }) : '-'; }
    function fmtDateFull(iso) { return iso ? new Date(iso).toLocaleDateString('ar-SA', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'; }
    function todayStr() { return new Date().toISOString().slice(0, 10); }
    function waHref(phone) { return phone ? 'https://wa.me/' + phone.replace(/[^0-9]/g, '') : null; }
    function dayLabel(p) { var L = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']; return L[(p + 7) % 7]; }
    function initials(n) { return esc((n || '؟').trim().charAt(0)); }

    /* ═══════════════ تحميل البيانات ═══════════════ */
    function loadData() {
        loadClients();
        loadOrders();
        loadVisitors();
        loadSnapshots();
        setTimeout(saveTodaySnapshot, 4000);
    }

    function activeClients() {
        return allLeads.filter(function (d) { return d.source !== 'checkout' && !d.customerType; });
    }

    function loadClients() {
        db.collection('leads').orderBy('createdAt', 'desc').get().then(function (snap) {
            allLeads = [];
            snap.forEach(function (doc) { allLeads.push(Object.assign({ id: doc.id }, doc.data())); });
            updateStats();
            renderClients();
            loadOrders();
            renderRangeStats();
        }).catch(function (err) {
            var g = $('client-cards');
            if (g) g.innerHTML = '<div class="empty-state">' + ic('info') + 'خطأ في التحميل: ' + esc(err.message) + '</div>';
            loadOrders();
        });
    }

    function loadOrders() {
        db.collection('orders').orderBy('createdAt', 'desc').get().then(function (snap) {
            allOrders = [];
            snap.forEach(function (doc) { allOrders.push(Object.assign({ id: doc.id }, doc.data())); });
            var oldCheckout = allLeads.filter(function (d) { return (d.source === 'checkout' || d.customerType) && !allOrders.some(function (o) { return o.id === d.id; }); });
            allOrders = allOrders.concat(oldCheckout).sort(function (a, b) { return (b.createdAt || '').localeCompare(a.createdAt || ''); });
            renderOrders();
            updateOrderStats();
            renderRangeStats();
        }).catch(function (err) {
            var g = $('order-cards');
            if (g) g.innerHTML = '<div class="empty-state">' + ic('info') + 'خطأ في التحميل: ' + esc(err.message) + '</div>';
        });
    }

    function loadVisitors() {
        var now = new Date();
        var days = [];
        for (var i = 6; i >= 0; i--) days.push(new Date(now.getTime() - i * 864e5).toISOString().slice(0, 10));
        var today = days[6];
        db.collection('visitor_sources').get().then(function (snap) {
            visitorDocs = {};
            snap.forEach(function (doc) { visitorDocs[doc.id] = doc.data(); });
            var dayCounts = days.map(function (d) { return (visitorDocs[d] && visitorDocs[d].count) || 0; });
            var el = $('s-visitors'); if (el) el.textContent = dayCounts[6] || 0;

            var maxVis = Math.max.apply(null, dayCounts.concat([1]));
            var chart = $('visitor-chart');
            if (chart) {
                chart.innerHTML = dayCounts.map(function (c, i) {
                    var pct = Math.max(4, Math.round(c / maxVis * 100));
                    return '<div class="bar-col alt"><div class="bar" style="height:' + pct + '%" title="' + c + '"></div><span class="b-label">' + dayLabel(now.getDay() - 6 + i) + '</span></div>';
                }).join('');
            }
            var dr = $('visitor-date-range');
            if (dr) dr.textContent = days[0] + ' → ' + today;

            renderVisitorSources(days, today);
            renderRangeStats();
        }).catch(function () {});
    }

    function renderVisitorSources(days, today) {
        var list = $('visitor-sources-list');
        if (!list) return;
        var docs = visitorDocs;
        var todayData = docs[today];
        if (!todayData || !todayData.sources) {
            list.innerHTML = '<div class="crm-note" style="border:none">لا توجد بيانات زوار بعد.</div>';
            return;
        }
        var allPlatforms = {};
        days.forEach(function (d) {
            var s = docs[d] && docs[d].sources;
            if (s) Object.keys(s).forEach(function (k) { allPlatforms[k] = 1; });
        });
        var perDay = {};
        var totals = {};
        days.forEach(function (d) {
            var s = (docs[d] && docs[d].sources) || {};
            Object.keys(allPlatforms).forEach(function (k) {
                var v = s[k] || 0;
                totals[k] = (totals[k] || 0) + v;
                if (!perDay[k]) perDay[k] = [];
                perDay[k].push(v);
            });
        });
        var yesterday = docs[days[days.length - 2]] || {};
        list.innerHTML = Object.keys(totals).sort(function (a, b) { return (totals[b] || 0) - (totals[a] || 0); }).map(function (k) {
            var cur = todayData.sources[k] || 0;
            var week = totals[k] || 0;
            var prev = (yesterday.sources && yesterday.sources[k]) || 0;
            var pct = prev > 0 ? Math.round((cur - prev) / prev * 100) : (cur > 0 ? 100 : 0);
            var up = cur >= prev;
            var color = SRCSRC[k] || '#f68720';
            var trend = (cur > 0 || prev > 0) ? '<span class="src-trend" style="color:' + (up ? '#22c55e' : '#ef4444') + '">' + (up ? '▲' : '▼') + ' ' + (pct > 0 ? '+' : '') + pct + '%</span>' : '';
            var vals = perDay[k] || Array(7).fill(0);
            var maxVal = Math.max.apply(null, vals.concat([1]));
            var w = 74, h = 22;
            var pts = vals.map(function (v, i) {
                return (i / (vals.length - 1 || 1) * w).toFixed(1) + ',' + (h - v / maxVal * h).toFixed(1);
            }).join(' ');
            var spark = '<svg width="' + w + '" height="' + h + '" style="margin-top:.25rem"><polyline points="' + pts + '" fill="none" stroke="#f68720" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
            return '<div class="src-chip"><span class="src-dot" style="background:' + color + '"></span>' +
                '<div style="display:flex;flex-direction:column"><b style="font-size:.95rem;color:#fff">' + cur + '</b><span style="font-size:.72rem;color:#888">' + esc(k) + '</span></div>' +
                '<div style="display:flex;flex-direction:column;gap:.1rem;margin-inline-start:auto">' + trend + '<span style="font-size:.68rem;color:#666">الأسبوع: ' + week + '</span></div>' +
                '<div>' + spark + '</div></div>';
        }).join('');
    }

    /* ═══════════════ إحصائيات العملاء ═══════════════ */
    function updateStats() {
        var clients = activeClients();
        var now = new Date();
        var weekAgo = new Date(now.getTime() - 7 * 864e5);
        var week = 0, interested = 0, subscribed = 0;
        var pkgCount = { 'الانطلاقة': 0, 'المحترف': 0, 'النخبة': 0, 'مخصصة': 0 };
        var srcCount = { questionnaire: 0, whatsapp: 0, chat: 0 };
        var days = Array(7).fill(0);

        clients.forEach(function (d) {
            var dt = new Date(d.createdAt);
            if (!isNaN(dt)) {
                if (dt >= weekAgo) week++;
                for (var i = 0; i < 7; i++) {
                    if (dt.toDateString() === new Date(now.getTime() - i * 864e5).toDateString()) days[6 - i]++;
                }
            }
            if (d.status === 'interested') interested++;
            if (d.status === 'subscribed') subscribed++;
            if (d.package && pkgCount[d.package] !== undefined) pkgCount[d.package]++;
            if (d.source && srcCount[d.source] !== undefined) srcCount[d.source]++;
        });

        setText('s-total', clients.length);
        setText('s-week', week);
        setText('s-interested', interested);
        setText('s-subscribed', subscribed);

        var maxPkg = Math.max.apply(null, Object.keys(pkgCount).map(function (k) { return pkgCount[k]; }).concat([1]));
        var pk = $('pkg-chart');
        if (pk) {
            pk.innerHTML = Object.keys(pkgCount).map(function (k) {
                var pct = pkgCount[k] / maxPkg * 100;
                return '<div class="hbar-row"><div class="hbar-head"><span>' + esc(k) + '</span><span class="v">' + pkgCount[k] + '</span></div><div class="hbar"><div class="fill" style="width:' + pct + '%"></div></div></div>';
            }).join('') + '<div class="crm-note" style="border:none">مُصدر الاستبيان: <b style="color:#3b82f6">' + srcCount.questionnaire + '</b> · واتساب: <b style="color:#25d366">' + srcCount.whatsapp + '</b> · مراسلة: <b style="color:#f68720">' + srcCount.chat + '</b></div>';
        }
        var wk = $('week-chart');
        if (wk) {
            var maxDay = Math.max.apply(null, days.concat([1]));
            wk.innerHTML = days.map(function (c, i) {
                var pct = Math.max(4, Math.round(c / maxDay * 100));
                return '<div class="bar-col"><div class="bar" style="height:' + pct + '%" title="' + c + '"></div><span class="b-label">' + dayLabel(now.getDay() - 6 + i) + '</span></div>';
            }).join('');
        }
    }

    function setText(id, v) { var el = $(id); if (el) el.textContent = v; }

    /* ═══════════════ إحصائيات الطلبات ═══════════════ */
    function updateOrderStats() {
        var now = new Date();
        var weekAgo = new Date(now.getTime() - 7 * 864e5);
        var week = 0, revWeek = 0, pending = 0;
        var pkgCount = { 'الانطلاقة': 0, 'المحترف': 0, 'النخبة': 0, 'مخصصة': 0 };
        var days = Array(7).fill(0);

        allOrders.forEach(function (d) {
            var dt = new Date(d.createdAt);
            if (!isNaN(dt)) {
                if (dt >= weekAgo) { week++; revWeek += parseFloat(d.price) || 0; }
                for (var i = 0; i < 7; i++) {
                    if (dt.toDateString() === new Date(now.getTime() - i * 864e5).toDateString()) days[6 - i]++;
                }
            }
            if (d.status === 'new' || d.status === 'contacted') pending++;
            if (d.package) {
                if (pkgCount[d.package] !== undefined) pkgCount[d.package]++;
                else if (d.package === 'VIP' || d.package === 'مخصصة') pkgCount['مخصصة']++;
            }
        });

        setText('o-total', allOrders.length);
        setText('o-week', week);
        setText('o-rev-week', fmtMoney(revWeek));
        setText('o-pending', pending);

        var maxPkg = Math.max.apply(null, Object.keys(pkgCount).map(function (k) { return pkgCount[k]; }).concat([1]));
        var pk = $('opkg-chart');
        if (pk) {
            pk.innerHTML = Object.keys(pkgCount).map(function (k) {
                var pct = pkgCount[k] / maxPkg * 100;
                return '<div class="hbar-row"><div class="hbar-head"><span>' + esc(k) + '</span><span class="v">' + pkgCount[k] + '</span></div><div class="hbar"><div class="fill" style="width:' + pct + '%"></div></div></div>';
            }).join('');
        }
        var wk = $('ord-chart');
        if (wk) {
            var maxDay = Math.max.apply(null, days.concat([1]));
            wk.innerHTML = days.map(function (c, i) {
                var pct = Math.max(4, Math.round(c / maxDay * 100));
                return '<div class="bar-col alt"><div class="bar" style="height:' + pct + '%" title="' + c + '"></div><span class="b-label">' + dayLabel(now.getDay() - 6 + i) + '</span></div>';
            }).join('');
        }
    }

    /* ═══════════════ عرض العملاء (بطاقات منفصلة) ═══════════════ */
    function renderClients() {
        var grid = $('client-cards');
        if (!grid) return;
        var q = $('search-box') ? $('search-box').value.toLowerCase().trim() : '';
        var filtered = activeClients().filter(function (d) {
            if (clientFilter.status !== 'all' && d.status !== clientFilter.status) return false;
            if (!q) return true;
            return [d.name, d.email, d.phone, d.package, d.leadSource].join(' ').toLowerCase().includes(q);
        });
        if (!filtered.length) {
            grid.innerHTML = '<div class="empty-state" style="grid-column:1/-1">' + ic('users', 34) + 'لا يوجد عملاء مطابقون</div>';
            return;
        }
        grid.innerHTML = filtered.map(clientCard).join('');
        var cc = $('client-count');
        if (cc) cc.textContent = '· ' + filtered.length + ' عميل';
    }

    function clientCard(d) {
        var name = d.source === 'chat' ? (d.package || 'استفسار') : (d.name || 'غير معروف');
        var phone = d.phone || '-';
        var wa = waHref(phone);
        var note = (d.source === 'questionnaire' && d.data && d.data.notes) ? d.data.notes : (d.notes || '');
        var sm = d.source === 'questionnaire' ? 'استبيان' : (SOURCE[d.source] || esc(d.source || '-'));
        var sc = SOURCE_CLS[d.source] || 'badge-new';
        return '<div class="crm-card fade-in">' +
            '<div class="crm-head">' +
                '<div class="crm-avatar">' + initials(name) + '</div>' +
                '<div style="flex:1;min-width:0">' +
                    '<div class="crm-name">' + esc(name) + '</div>' +
                    '<div class="crm-sub">' + (d.leadSource ? ic('layers', 12) + ' ' + esc(d.leadSource) : '') + '</div>' +
                '</div>' +
                '<span class="badge ' + (STATUS_CLS[d.status] || 'badge-new') + '">' + (STATUS[d.status] || esc(d.status || 'جديد')) + '</span>' +
            '</div>' +
            '<div class="crm-badges">' +
                '<span class="badge ' + sc + '">' + sm + '</span>' +
                (d.package ? '<span class="badge" style="background:rgba(246,135,32,.10);color:#f68720">' + esc(d.package) + '</span>' : '') +
            '</div>' +
            '<div class="crm-meta">' +
                '<div class="m">' + ic('phone', 14) + '<b>' + esc(phone) + '</b></div>' +
                '<div class="m">' + ic('calendar', 14) + '<b>' + fmtDate(d.createdAt) + '</b></div>' +
                (d.email ? '<div class="m">' + ic('mail', 14) + '<b>' + esc(d.email) + '</b></div>' : '') +
                '<div class="m">' + ic('info', 14) + '<b>' + (d.businessType || d.goals || '—') + '</b></div>' +
            '</div>' +
            (note ? '<div class="crm-note">' + ic('message', 13) + ' ' + esc(note) + '</div>' : '') +
            '<div class="crm-actions">' +
                (wa ? '<a class="icon-btn green" href="' + wa + '" target="_blank" title="واتساب">' + ic('message') + '</a>' : '') +
                '<button class="icon-btn sky" onclick="openModal(\'' + d.id + '\')" title="التفاصيل">' + ic('eye') + '</button>' +
                '<button class="icon-btn red" onclick="deleteLead(\'' + d.id + '\')" title="حذف">' + ic('trash') + '</button>' +
            '</div>' +
        '</div>';
    }

    /* ═══════════════ عرض الطلبات (بطاقات منفصلة) ═══════════════ */
    function renderOrders() {
        var grid = $('order-cards');
        if (!grid) return;
        var q = $('order-search-box') ? $('order-search-box').value.toLowerCase().trim() : '';
        var filtered = allOrders.filter(function (d) {
            if (orderFilter.status !== 'all' && d.status !== orderFilter.status) return false;
            if (!q) return true;
            return [d.name, d.email, d.phone, d.package, d.leadSource].join(' ').toLowerCase().includes(q);
        });
        if (!filtered.length) {
            grid.innerHTML = '<div class="empty-state" style="grid-column:1/-1">' + ic('package', 34) + 'لا توجد طلبات مطابقة</div>';
            return;
        }
        grid.innerHTML = filtered.map(orderCard).join('');
    }

    function orderCard(d) {
        var name = d.name || (d.package || 'غير معروف');
        var wa = waHref(d.phone);
        return '<div class="crm-card fade-in">' +
            '<div class="crm-head">' +
                '<div class="crm-avatar" style="background:linear-gradient(135deg,#3b82f6,#7fb2ff)">' + initials(name) + '</div>' +
                '<div style="flex:1;min-width:0">' +
                    '<div class="crm-name">' + esc(name) + '</div>' +
                    '<div class="crm-sub">' + (d.leadSource ? ic('layers', 12) + ' ' + esc(d.leadSource) : '') + '</div>' +
                '</div>' +
                '<span class="badge ' + (STATUS_CLS[d.status] || 'badge-new') + '">' + (STATUS[d.status] || esc(d.status || 'جديد')) + '</span>' +
            '</div>' +
            '<div class="crm-badges">' +
                '<span class="badge" style="background:rgba(246,135,32,.10);color:#f68720">' + esc(d.package || '-') + '</span>' +
                '<span class="badge" style="background:rgba(34,197,94,.10);color:#22c55e">' + fmtMoney(d.price) + '</span>' +
            '</div>' +
            '<div class="crm-meta">' +
                '<div class="m">' + ic('phone', 14) + '<b>' + esc(d.phone || '-') + '</b></div>' +
                '<div class="m">' + ic('calendar', 14) + '<b>' + fmtDate(d.createdAt) + '</b></div>' +
                (d.email ? '<div class="m">' + ic('mail', 14) + '<b>' + esc(d.email) + '</b></div>' : '') +
                '<div class="m">' + ic('info', 14) + '<b>' + (d.leadSource || '—') + '</b></div>' +
            '</div>' +
            '<div class="crm-actions">' +
                (wa ? '<a class="icon-btn green" href="' + wa + '" target="_blank" title="واتساب">' + ic('message') + '</a>' : '') +
                '<button class="icon-btn sky" onclick="openModal(\'' + d.id + '\')" title="التفاصيل">' + ic('eye') + '</button>' +
                '<button class="icon-btn red" onclick="deleteLead(\'' + d.id + '\')" title="حذف">' + ic('trash') + '</button>' +
            '</div>' +
        '</div>';
    }

    /* ═══════════════ التصفية والبحث ═══════════════ */
    function setFilter(el, key, val) {
        document.querySelectorAll('.filter-btn[data-filter="' + key + '"]').forEach(function (b) { b.classList.remove('active'); });
        el.classList.add('active');
        clientFilter[key] = val;
        renderClients();
    }
    function setOrderFilter(el, key, val) {
        document.querySelectorAll('#order-filters .filter-btn').forEach(function (b) { b.classList.remove('active'); });
        el.classList.add('active');
        orderFilter[key] = val;
        renderOrders();
    }
    function crmSearch() { renderClients(); }
    function ordSearch() { renderOrders(); }

    /* ═══════════════ التفاصيل (مودال) ═══════════════ */
    function openModal(id) {
        var d = allLeads.find(function (x) { return x.id === id; }) || allOrders.find(function (x) { return x.id === id; });
        if (!d) return;
        var isOrder = allOrders.some(function (x) { return x.id === id; });
        var data = d.data || {};
        var fields = [
            ['business-type', 'النشاط التجاري'], ['goals', 'الهدف'], ['platforms', 'المنصات'],
            ['presence', 'الوجود الرقمي'], ['budget', 'الميزانية'], ['timeline', 'البدء'],
            ['brand', 'العلامة التجارية'], ['notes', 'ملاحظات']
        ];
        var answers = fields.filter(function (f) { return data[f[0]]; }).map(function (f) {
            return '<div><div style="color:#888;font-size:.8rem">' + f[1] + '</div><div style="font-weight:700">' + esc(Array.isArray(data[f[0]]) ? data[f[0]].join(' · ') : data[f[0]]) + '</div></div>';
        }).join('');

        var body = $('modal-body');
        body.innerHTML =
            '<div style="display:grid;gap:1rem">' +
                '<div style="display:flex;align-items:center;gap:.75rem">' +
                    '<div class="crm-avatar">' + initials(d.name || (d.package || '?')) + '</div>' +
                    '<div style="flex:1"><b style="font-size:1.1rem">' + esc(d.name || (d.source === 'chat' ? (d.package || 'استفسار') : 'غير معروف')) + '</b><div style="color:#888;font-size:.8rem">' + fmtDateFull(d.createdAt) + '</div></div>' +
                    '<span class="badge ' + (STATUS_CLS[d.status] || 'badge-new') + '">' + (STATUS[d.status] || esc(d.status || 'جديد')) + '</span>' +
                '</div>' +
                '<div style="display:grid;grid-template-columns:1fr 1fr;gap:.75rem">' +
                    '<!-- المصدر --><div class="m" style="display:flex;align-items:center;gap:.4rem">' + ic('layers', 14) + '<div><div style="color:#888;font-size:.75rem">المصدر</div><b>' + (SOURCE[d.source] || esc(d.source || '-')) + '</b></div></div>' +
                    '<!-- مصدر الزائر --><div class="m" style="display:flex;align-items:center;gap:.4rem">' + ic('user', 14) + '<div><div style="color:#888;font-size:.75rem">مصدر الزائر</div><b>' + esc(d.leadSource || '-') + '</b></div></div>' +
                    '<!-- الباقة --><div class="m" style="display:flex;align-items:center;gap:.4rem">' + ic('package', 14) + '<div><div style="color:#888;font-size:.75rem">الباقة</div><b>' + esc(d.package || '-') + '</b></div></div>' +
                    (isOrder ? '<div class="m" style="display:flex;align-items:center;gap:.4rem">' + ic('wallet', 14) + '<div><div style="color:#888;font-size:.75rem">السعر</div><b style="color:#22c55e">' + fmtMoney(d.price) + '</b></div></div>' : '') +
                    '<!-- الجوال --><div class="m" style="display:flex;align-items:center;gap:.4rem">' + ic('phone', 14) + '<div><div style="color:#888;font-size:.75rem">الجوال</div><b dir="ltr" style="text-align:right">' + esc(d.phone || '-') + (d.phone ? ' <a href="' + waHref(d.phone) + '" target="_blank" style="color:#25d366;text-decoration:none">' + ic('message', 14) + '</a>' : '') + '</b></div></div>' +
                    '<div class="m" style="display:flex;align-items:center;gap:.4rem">' + ic('mail', 14) + '<div><div style="color:#888;font-size:.75rem">الإيميل</div><b>' + esc(d.email || '-') + '</b></div></div>' +
                '</div>' +
                (d.source === 'questionnaire' && answers
                    ? '<div style="border-top:1px solid rgba(255,255,255,.06);padding-top:.9rem"><div style="display:grid;grid-template-columns:1fr 1fr;gap:.7rem">' + answers + '</div></div>'
                    : '') +
            '</div>' +
            '<div style="border-top:1px solid rgba(255,255,255,.06);margin-top:1rem;padding-top:1rem;display:flex;gap:1rem;align-items:center;flex-wrap:wrap">' +
                '<div><div style="color:#888;font-size:.8rem;margin-bottom:.3rem">تحديث الحالة</div>' +
                '<select class="status-select" id="modal-status" onchange="updateStatus(\'' + id + '\',this.value)">' +
                    ['new', 'contacted', 'interested', 'subscribed', 'cancelled'].map(function (s) {
                        return '<option value="' + s + '"' + (d.status === s ? ' selected' : '') + '>' + STATUS[s] + '</option>';
                    }).join('') +
                '</select></div>' +
                '<button onclick="deleteLead(\'' + id + '\')" class="btn btn-ghost btn-sm" style="color:#ef4444;border-color:rgba(239,68,68,.25)"><span class="ic">' + ic('trash', 14) + '</span> حذف</button>' +
            '</div>';
        $('modal-overlay').classList.add('open');
    }

    function closeModal() { $('modal-overlay').classList.remove('open'); }

    function updateStatus(id, status) {
        var isOrder = allOrders.some(function (x) { return x.id === id; });
        var col = isOrder ? 'orders' : 'leads';
        db.collection(col).doc(id).update({ status: status }).then(function () {
            var d = isOrder ? allOrders.find(function (x) { return x.id === id; }) : allLeads.find(function (x) { return x.id === id; });
            if (d) d.status = status;
            updateStats(); renderClients(); updateOrderStats(); renderOrders();
        }).catch(function (err) { alert('خطأ: ' + err.message); });
    }

    function deleteLead(id) {
        if (!confirm('حذف هذا السجل نهائياً؟')) return;
        var isOrder = allOrders.some(function (x) { return x.id === id; });
        var col = isOrder ? 'orders' : 'leads';
        db.collection(col).doc(id).delete().then(function () {
            if (isOrder) allOrders = allOrders.filter(function (x) { return x.id !== id; });
            else allLeads = allLeads.filter(function (x) { return x.id !== id; });
            closeModal();
            updateStats(); renderClients(); renderOrders(); updateOrderStats();
        }).catch(function (err) { alert('خطأ: ' + err.message); });
    }

    /* ═══════════════ التصدير ═══════════════ */
    function activeTab() {
        if ($('view-orders').style.display !== 'none') return 'orders';
        if ($('view-stats').style.display !== 'none') return 'stats';
        return 'clients';
    }

    function exportCSV() {
        var tab = activeTab();
        var rows, h, file;
        if (tab === 'orders') {
            if (!allOrders.length) { alert('لا توجد طلبات للتصدير'); return; }
            h = ['الاسم', 'الإيميل', 'الجوال', 'مصدر الزائر', 'الباقة', 'السعر', 'الحالة', 'التاريخ', 'ملاحظات'];
            rows = allOrders.map(function (d) {
                return [d.name || '', d.email || '', d.phone || '', d.leadSource || '', d.package || '', d.price || '', STATUS[d.status] || d.status || 'جديد', d.createdAt || '', d.notes || ''];
            });
            file = 'orders-سمعة-' + todayStr() + '.csv';
        } else {
            var clients = activeClients();
            if (!clients.length) { alert('لا يوجد عملاء للتصدير'); return; }
            h = ['الاسم', 'الإيميل', 'الجوال', 'المصدر', 'مصدر الزائر', 'الباقة', 'الحالة', 'التاريخ', 'ملاحظات'];
            rows = clients.map(function (d) {
                return [d.name || '', d.email || '', d.phone || '', SOURCE[d.source] || d.source || '', d.leadSource || '', d.package || '', STATUS[d.status] || d.status || 'جديد', d.createdAt || '', (d.data && d.data.notes) || d.notes || ''];
            });
            file = 'clients-سمعة-' + todayStr() + '.csv';
        }
        var csv = '\uFEFF' + [h.join(','), rows.map(function (r) { return r.map(function (v) { return '"' + String(v).replace(/"/g, '""') + '"'; }).join(','); }).join('\n')].join('\n');
        var a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
        a.download = file;
        a.click();
    }

    /* ═══════════════ الحذف الكلي ═══════════════ */
    function cleanAllData() {
        if (!confirm('تنبيه: سيتم حذف جميع العملاء والطلبات والاستبيانات والإحصائيات نهائياً!\nهل أنت متأكد؟')) return;
        if (!confirm('تأكيد نهائي: لا يمكن التراجع.\nمتابعة؟')) return;
        var btn = event.target;
        btn.textContent = 'جاري المسح...';
        btn.disabled = true;
        var chains = ['leads', 'orders', 'questionnaires', 'statistics'].reduce(function (p, col) {
            return p.then(function () {
                return db.collection(col).get().then(function (snap) {
                    var batch = db.batch();
                    snap.forEach(function (doc) { batch.delete(doc.ref); });
                    return batch.commit();
                });
            });
        }, Promise.resolve());
        chains.then(function () {
            allLeads = []; allOrders = []; allSnapshots = [];
            updateStats(); renderClients(); renderOrders(); updateOrderStats(); renderSnapshots();
            btn.textContent = 'تم المسح';
            btn.style.background = '#16a34a';
            setTimeout(function () { btn.textContent = 'مسح كل البيانات'; btn.style.background = '#dc2626'; btn.disabled = false; }, 2000);
        }).catch(function (err) {
            alert('خطأ: ' + err.message);
            btn.textContent = 'مسح كل البيانات';
            btn.disabled = false;
        });
    }

    /* ═══════════════ لقطات يومية (قاعدة البيانات) ═══════════════ */
    function buildSnapshot(dstr) {
        var clientsToday = activeClients().filter(function (d) { return (d.createdAt || '').slice(0, 10) === dstr; }).length;
        var ordersToday = allOrders.filter(function (d) { return (d.createdAt || '').slice(0, 10) === dstr; });
        var revToday = ordersToday.reduce(function (s, o) { return s + (parseFloat(o.price) || 0); }, 0);
        var visitorsToday = (visitorDocs[dstr] && visitorDocs[dstr].count) || 0;
        var pkg = {};
        ordersToday.forEach(function (o) { var k = o.package || 'غير محدد'; pkg[k] = (pkg[k] || 0) + 1; });
        return {
            date: dstr,
            clients: clientsToday,
            clientsTotal: activeClients().length,
            orders: ordersToday.length,
            ordersTotal: allOrders.length,
            revenue: Math.round(revToday),
            visitors: visitorsToday,
            packages: pkg,
            updatedAt: new Date().toISOString()
        };
    }

    function saveTodaySnapshot() {
        db.collection('statistics').doc(todayStr()).set(buildSnapshot(todayStr())).catch(function () {});
    }

    function snapshotStats() {
        var btn = event.target;
        btn.textContent = 'جاري الحفظ...';
        btn.disabled = true;
        db.collection('statistics').doc(todayStr()).set(buildSnapshot(todayStr())).then(function () {
            btn.textContent = 'تم الحفظ';
            btn.style.background = '#16a34a';
            setTimeout(function () { btn.textContent = 'حفظ الآن'; btn.style.background = ''; btn.disabled = false; }, 1500);
            loadSnapshots();
        }).catch(function (err) {
            alert('خطأ: ' + err.message);
            btn.textContent = 'حفظ الآن';
            btn.disabled = false;
        });
    }

    function loadSnapshots() {
        db.collection('statistics').orderBy('date', 'desc').limit(120).get().then(function (snap) {
            allSnapshots = [];
            snap.forEach(function (doc) { allSnapshots.push(doc.data()); });
            renderSnapshots();
            renderRangeStats();
        }).catch(function () {});
    }

    function renderSnapshots() {
        var body = $('snapshots-body');
        if (!body) return;
        if (!allSnapshots.length) {
            body.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:2rem;color:#555">لا توجد لقطات محفوظة بعد — الإحصائيات الأسبوعية والشهرية تُحسب تلقائياً من البيانات مباشرة، واللقطة تُحفظ تلقائياً عند فتح اللوحة</td></tr>';
            return;
        }
        body.innerHTML = allSnapshots.map(function (s) {
            var pkgStr = s.packages && Object.keys(s.packages).length
                ? Object.keys(s.packages).map(function (k) { return k + ': ' + s.packages[k]; }).join(' · ')
                : '-';
            return '<tr>' +
                '<td style="color:#f68720;font-weight:700">' + fmtDateFull(s.date) + '</td>' +
                '<td>' + (s.clients || 0) + '</td>' +
                '<td>' + (s.orders || 0) + '</td>' +
                '<td style="color:#22c55e;font-weight:700">' + fmtMoney(s.revenue) + '</td>' +
                '<td style="color:#0ea5e9">' + (s.visitors || 0) + '</td>' +
                '<td style="color:#666;font-size:.75rem">' + esc(pkgStr) + '</td>' +
            '</tr>';
        }).join('');
    }

    /* ═══════════════ الإحصائيات أسبوع / شهر (تُحسب مباشرة من البيانات الحية) ═══════════════ */
    function setStatsRange(r) {
        statsRange = (r === 'month') ? 'month' : 'week';
        $('range-week').classList.toggle('active', statsRange === 'week');
        $('range-month').classList.toggle('active', statsRange === 'month');
        renderRangeStats();
    }

    function liveClientsCount(dstr) {
        return activeClients().filter(function (d) { return (d.createdAt || '').slice(0, 10) === dstr; }).length;
    }
    function liveOrdersCount(dstr) {
        return allOrders.filter(function (d) { return (d.createdAt || '').slice(0, 10) === dstr; });
    }
    function liveVisitorsCount(dstr) {
        return (visitorDocs[dstr] && visitorDocs[dstr].count) || 0;
    }

    function renderRangeStats() {
        var days = statsRange === 'week' ? 7 : 30;
        var clients = 0;
        var orders = 0;
        var rev = 0;
        var vis = 0;
        var now = new Date();
        for (var i = days - 1; i >= 0; i--) {
            var d = new Date(now.getTime() - i * 864e5).toISOString().slice(0, 10);
            clients += liveClientsCount(d);
            var od = liveOrdersCount(d).reduce(function (s, o) { return s + (parseFloat(o.price) || 0); }, 0);
            orders += liveOrdersCount(d).length;
            rev += od;
            vis += liveVisitorsCount(d);
        }

        setText('st-clients-range', clients);
        setText('st-orders-range', orders);
        setText('st-rev-range', fmtMoney(rev));
        setText('st-visitors-range', vis);
        setText('range-subtitle', statsRange === 'week' ? 'آخر 7 أيام' : 'آخر 30 يوماً');

        renderRangeChart();
    }

    function renderRangeChart() {
        var chart = $('range-chart');
        if (!chart) return;
        var counts = statsRange === 'week' ? 7 : 4;
        var buckets = [];
        var now = new Date();
        for (var i = counts - 1; i >= 0; i--) {
            var start, label;
            if (statsRange === 'week') {
                start = new Date(now.getTime() - i * 864e5);
                label = start.toLocaleDateString('ar-SA', { day: 'numeric', month: 'short' });
            } else {
                var yd = new Date(now.getTime() - i * 7 * 864e5);
                start = new Date(yd.getTime() - 6 * 864e5);
                label = start.toLocaleDateString('ar-SA', { day: 'numeric', month: 'short' });
            }
            var s0 = start.toISOString().slice(0, 10);
            var e0 = new Date(start.getTime() + 7 * 864e5).toISOString().slice(0, 10);
            var bs = [];
            for (var t = new Date(s0); t.toISOString().slice(0, 10) < e0; t = new Date(t.getTime() + 864e5)) {
                var td = t.toISOString().slice(0, 10);
                bs.push({ c: liveClientsCount(td), o: liveOrdersCount(td).length });
            }
            buckets.push({
                label: label,
                clients: bs.reduce(function (s, x) { return s + x.c; }, 0),
                orders: bs.reduce(function (s, x) { return s + x.o; }, 0)
            });
        }
        var maxVal = Math.max.apply(null, buckets.map(function (b) { return Math.max(b.clients, b.orders); }).concat([1]));
        chart.innerHTML = buckets.map(function (b) {
            var ch = Math.max(4, Math.round(b.clients / maxVal * 100));
            var oh = Math.max(4, Math.round(b.orders / maxVal * 100));
            return '<div class="bar-col">' +
                '<div class="bar-pair" style="height:' + Math.max(ch, oh) + '%">' +
                    '<i class="a" style="height:' + ch + '%" title="عملاء: ' + b.clients + '"></i>' +
                    '<i class="b" style="height:' + oh + '%" title="طلبات: ' + b.orders + '"></i>' +
                '</div><span class="b-label">' + b.label + '</span></div>';
        }).join('');
        var empty = $('range-chart-empty');
        if (empty) empty.style.display = 'none';
    }

    /* ═══════════════ واجهة عامة ═══════════════ */
    window.ic = ic;
    window.loadData = loadData;
    window.setFilter = setFilter;
    window.setOrderFilter = setOrderFilter;
    window.crmSearch = crmSearch;
    window.ordSearch = ordSearch;
    window.openModal = openModal;
    window.closeModal = closeModal;
    window.updateStatus = updateStatus;
    window.deleteLead = deleteLead;
    window.exportCSV = exportCSV;
    window.cleanAllData = cleanAllData;
    window.snapshotStats = snapshotStats;
    window.setStatsRange = setStatsRange;

    fillIcons();
})();