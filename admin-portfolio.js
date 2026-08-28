/* ═══════════════════════════════════════════════════════════
   admin-portfolio.js
   Portfolio management module for admin dashboard
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ═══════════════════════════════════════════════════════
     SECTION 1: CONFIG & STATE
     ═══════════════════════════════════════════════════════ */

  var CAT_LABELS = { digital: 'رقمية', identity: 'هوية', culture: 'ثقافية' };

  var allProjects = [];
  var veProject = null;
  var veBlocks = [];
  var veSelIdx = -1;
  var veUnsaved = false;

  /* ═══════════════════════════════════════════════════════
     SECTION 2: UTILITIES
     ═══════════════════════════════════════════════════════ */

  function esc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function toArr(v) {
    if (Array.isArray(v)) return v;
    return String(v || '').split(/\n|\·|,/).map(function (s) { return s.trim(); }).filter(Boolean);
  }

  function $(id) { return document.getElementById(id); }
  function db() { return firebase.firestore(); }

  /* ═══════════════════════════════════════════════════════
     SECTION 3: IMAGE COMPRESSION
     ═══════════════════════════════════════════════════════ */

  function compressImage(file, callback) {
    var reader = new FileReader();
    reader.onload = function (e) {
      var img = new Image();
      img.onload = function () {
        var MAX = 1400;
        var scale = Math.min(1, MAX / Math.max(img.width, img.height));
        var canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        callback(canvas.toDataURL('image/jpeg', 0.78));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  /* ═══════════════════════════════════════════════════════
     SECTION 4: PROJECT LIST
     ═══════════════════════════════════════════════════════ */

  function loadProjects() {
    var el = $('projects-list');
    if (!el) return;
    el.innerHTML = '<div class="pf-empty"><div style="color:#888">جاري تحميل الأعمال...</div></div>';

    db().collection('projects').get().then(function (snap) {
      allProjects = [];
      snap.forEach(function (d) { allProjects.push({ id: d.id, ...d.data() }); });
      allProjects.sort(function (a, b) { return (a.order ?? 999) - (b.order ?? 999); });
      console.log('[portfolio] loaded ' + allProjects.length + ' projects');
      renderProjectsList();
    }).catch(function (err) {
      console.error('[portfolio] loadProjects error:', err);
      el.innerHTML = '<div class="pf-empty" style="color:#ef4444">' +
        '<div style="font-size:1.5rem;margin-bottom:.5rem">⚠️</div>' +
        '<div>خطأ بالاتصال مع Firebase</div>' +
        '<div class="pf-empty-hint">' + err.message + '</div></div>';
    });
  }

  function renderProjectsList() {
    var el = $('projects-list');
    if (!el) return;

    if (!allProjects.length) {
      el.innerHTML = '<div class="pf-empty">' +
        '<div style="font-size:2rem;margin-bottom:.5rem">🎨</div>' +
        '<div>لا توجد أعمال بعد</div>' +
        '<div class="pf-empty-hint">اضغط "+ إضافة عمل جديد" للبدء — الأعمال الافتراضية تظهر تلقائياً في الموقع</div></div>';
      return;
    }

    el.innerHTML = allProjects.map(function (p) {
      var cover = p.coverImage
        ? '<img src="' + esc(p.coverImage) + '" alt="" loading="lazy" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\'">' +
          '<div class="pf-empty-cover" style="display:none">🖼️</div>'
        : '<div class="pf-empty-cover">🖼️</div>';

      var badge = p.published === false
        ? '<span class="pf-card-badge pf-card-badge--draft">مسودة</span>'
        : '<span class="pf-card-badge pf-card-badge--pub">منشور ✓</span>';

      var galCount = (p.galleryImages || []).length;

      return '<div class="pf-card">' +
        '<div class="pf-card-cover">' + cover + badge + '</div>' +
        '<div class="pf-card-body">' +
          '<div class="pf-card-title">' + esc(p.title || 'بدون عنوان') + '</div>' +
          '<div class="pf-card-subtitle">' + esc(p.subtitle || '') + '</div>' +
          '<div class="pf-card-tags">' +
            '<span class="badge badge-new">' + esc(CAT_LABELS[p.category] || p.category || '-') + '</span>' +
            (p.year ? '<span class="badge badge-contacted">' + esc(p.year) + '</span>' : '') +
            (galCount ? '<span class="badge badge-chat">' + galCount + ' صورة</span>' : '') +
          '</div>' +
          '<div class="pf-card-actions">' +
            '<button onclick="pfOpenEditor(\'' + p.id + '\')" class="btn btn-ghost btn-sm">تعديل</button>' +
            '<button onclick="pfTogglePublish(\'' + p.id + '\')" class="btn btn-ghost btn-sm" title="' + (p.published === false ? 'نشر' : 'إخفاء') + '">' + (p.published === false ? 'نشر' : 'إخفاء') + '</button>' +
            '<button onclick="pfDeleteProject(\'' + p.id + '\')" class="btn btn-ghost btn-sm" style="color:#ef4444;border-color:rgba(239,68,68,.25)">حذف</button>' +
          '</div>' +
        '</div></div>';
    }).join('');
  }

  function quickTogglePublish(id) { pfTogglePublish(id); }
  function deleteProjectDoc(id) { pfDeleteProject(id); }

  function pfTogglePublish(id) {
    var p = allProjects.find(function (x) { return x.id === id; });
    if (!p) return;
    db().collection('projects').doc(id).update({ published: p.published === false }).then(loadProjects);
  }

  function pfDeleteProject(id) {
    if (!confirm('حذف هذا العمل نهائياً؟ سيختفي من صفحة أعمالنا.')) return;
    db().collection('projects').doc(id).delete().then(function () {
      allProjects = allProjects.filter(function (x) { return x.id !== id; });
      loadProjects();
    });
  }

  function cleanAllProjects() {
    if (!confirm('إزالة جميع الصور القديمة (base64) من المشاريع؟\nالصور المحذوفة لن تظهر بالموقع — ستحتاج لإعادة رفعها كروابط.')) return;
    var btn = event.target;
    btn.disabled = true;
    btn.textContent = 'جاري التنظيف...';
    var cleaned = 0;

    db().collection('projects').get().then(function (snap) {
      var jobs = [];
      snap.forEach(function (doc) {
        var d = doc.data();
        var update = {};
        ['coverImage', 'beforeImage', 'afterImage'].forEach(function (k) {
          if (typeof d[k] === 'string' && d[k].startsWith('data:')) { update[k] = ''; cleaned++; }
        });
        if (Array.isArray(d.galleryImages)) {
          var clean = d.galleryImages.filter(function (u) { return typeof u === 'string' && !u.startsWith('data:'); });
          if (clean.length !== d.galleryImages.length) { update.galleryImages = clean; cleaned += d.galleryImages.length - clean.length; }
        }
        if (Array.isArray(d.blocks)) {
          update.blocks = d.blocks.map(function (b) {
            var nb = Object.assign({}, b);
            if (nb.src && nb.src.startsWith('data:')) { nb.src = ''; cleaned++; }
            if (nb.a && nb.a.startsWith('data:')) { nb.a = ''; cleaned++; }
            if (nb.b && nb.b.startsWith('data:')) { nb.b = ''; cleaned++; }
            if (Array.isArray(nb.imgs)) nb.imgs = nb.imgs.filter(function (u) { return !u.startsWith('data:'); });
            return nb;
          });
        }
        if (Object.keys(update).length) jobs.push(db().collection('projects').doc(doc.id).update(update));
      });

      Promise.all(jobs).then(function () {
        btn.disabled = false;
        btn.textContent = '🧹 تنظيف';
        alert('تم التنظيف! ' + cleaned + ' صورة base64 محذوفة.');
        loadProjects();
      }).catch(function (e) { btn.disabled = false; btn.textContent = '🧹 تنظيف'; alert('خطأ: ' + e.message); });
    });
  }

  /* ═══════════════════════════════════════════════════════
     SECTION 5: VISUAL EDITOR — Core
     ═══════════════════════════════════════════════════════ */

  var veHeightOpts = { sm: 'قصيرة', md: 'عادية', lg: 'طويلة', full: 'ملء الشاشة' };
  var veColsOpts = { auto: 'تلقائي', two: 'عمودان', single: 'صورة كاملة' };

  function pfSeedBlocks(p) {
    var b = [];
    if (p.coverImage) b.push({ t: 'cover', src: p.coverImage, h: (p.format && p.format.coverHeight) || 'md' });
    b.push({ t: 'title', x: p.title || '', align: 'center', size: (p.format && p.format.titleSize) || 'md', weight: (p.format && p.format.titleWeight) || 'bold' });
    if (p.subtitle) b.push({ t: 'lede', x: p.subtitle, align: 'center', weight: 'normal', size: 'md' });
    if (p.description) {
      String(p.description).split(/\n+/).filter(Boolean).forEach(function (t) {
        b.push({ t: 'para', x: t.trim(), align: 'center', weight: 'normal', size: 'md' });
      });
    }
    (p.galleryImages || []).forEach(function (src) { b.push({ t: 'image', src: src, h: 'md', caption: '' }); });
    if (p.beforeImage && p.afterImage) b.push({ t: 'ba', a: p.beforeImage, b: p.afterImage });

    if (p.format) {
      var titleBlock = b.find(function (x) { return x.t === 'title'; });
      if (titleBlock) { titleBlock.align = p.format.titleAlign || 'center'; titleBlock.size = p.format.titleSize || 'md'; titleBlock.weight = p.format.titleWeight || 'bold'; }
      var ledeBlock = b.find(function (x) { return x.t === 'lede'; });
      if (ledeBlock) { ledeBlock.align = p.format.descAlign || 'center'; ledeBlock.size = p.format.descSize || 'md'; ledeBlock.weight = p.format.descWeight || 'normal'; }
    }
    if (!b.length) b.push({ t: 'cover', src: '', h: 'md' }, { t: 'title', x: '', align: 'center', size: 'md', weight: 'bold' });
    return b;
  }

  function pfOpenEditor(id) {
    veProject = id ? allProjects.find(function (x) { return x.id === id; }) : null;
    var d = veProject || {};
    veBlocks = (veProject && Array.isArray(d.blocks) && d.blocks.length) ? JSON.parse(JSON.stringify(d.blocks)) : pfSeedBlocks(d);
    veSelIdx = -1;
    veUnsaved = false;

    $('ve-title-input').value = d.title || '';
    $('ve-subtitle').value = d.subtitle || '';
    $('ve-category').value = d.category || 'digital';
    $('ve-field').value = d.field || '';
    $('ve-services').value = Array.isArray(d.services) ? d.services.join(' · ') : (d.services || '');
    $('ve-year').value = d.year || '';
    $('ve-tag').value = d.tag || '';
    $('ve-tools').value = Array.isArray(d.tools) ? d.tools.join(' · ') : (d.tools || '');
    $('ve-order').value = d.order != null ? d.order : '';
    $('ve-published').checked = d.published !== false;
    $('ve-status').textContent = '';
    $('ve-meta-panel').classList.remove('ve-meta-open');

    var cover = d.coverImage || '';
    $('ve-cover-url').value = cover;
    renderCoverPreview(cover);

    pfRender();
    $('ve-overlay').style.display = 'flex';
    document.body.classList.add('menu-open');
  }

  function pfCloseEditor() {
    document.querySelectorAll('.ve-rt-editor').forEach(function (el) { veSyncContenteditable(el); });
    if (veUnsaved && !confirm('لديك تغييرات غير محفوظة. هل تريد الإغلاق؟')) return;
    $('ve-overlay').style.display = 'none';
    $('ve-meta-panel').classList.remove('ve-meta-open');
    document.body.classList.remove('menu-open');
  }

  function renderCoverPreview(src) {
    var prev = $('ve-cover-prev');
    var img = $('ve-cover-prev-img');
    if (!prev || !img) return;
    if (src) {
      img.src = src;
      prev.style.display = 'block';
    } else {
      img.src = '';
      prev.style.display = 'none';
    }
  }
  function pfClearCover() {
    $('ve-cover-url').value = '';
    renderCoverPreview('');
    veUnsaved = true;
  }

  var veCoverLoaded = function (src) {
    $('ve-cover-url').value = src;
    renderCoverPreview(src);
    veUnsaved = true;
  };
  $('ve-cover-url').addEventListener('input', function () { renderCoverPreview(this.value); veUnsaved = true; });
  $('ve-cover-file').addEventListener('change', function () {
    var file = this.files && this.files[0];
    if (!file) return;
    compressImage(file, function (url) { veCoverLoaded(url || ''); });
    this.value = '';
  });

  /* ═══════════════════════════════════════════════════════
     SECTION 6: VISUAL EDITOR — Block Rendering
     ═══════════════════════════════════════════════════════ */

  function pfBlockCtrls(i) {
    return '<div class="ve-ctrls">' +
      '<button class="ve-ctrl ve-drag-handle" draggable="true" title="اسحب لإعادة الترتيب">⠿</button>' +
      '<button class="ve-ctrl" onclick="event.stopPropagation();pfMoveBlock(' + i + ',-1)" title="تحريك لفوق">↑</button>' +
      '<button class="ve-ctrl" onclick="event.stopPropagation();pfMoveBlock(' + i + ',1)" title="تحريك لتحت">↓</button>' +
      '<button class="ve-ctrl" onclick="event.stopPropagation();pfRemoveBlock(' + i + ')" title="حذف" style="color:#f87171">✕</button>' +
      '</div>';
  }

  function pfBlockTitle(b, i) {
    var fs = b.size==='sm'?'clamp(1.3rem,3.5vw,2.8rem)':b.size==='lg'?'clamp(1.9rem,6.4vw,5.8rem)':'clamp(1.6rem,4.8vw,4.6rem)';
    var fw = b.weight==='light'?400:b.weight==='bold'?900:b.weight==='medium'?650:700;
    var ph = 'عنوان المشروع...';
    return '<div class="ve-b-title" id="ve-ed-wrap-' + i + '">' +
      '<div class="ve-rt-editor" id="ve-ed-' + i + '" data-i="' + i + '" contenteditable="true" data-placeholder="' + ph + '" ' +
      'style="font-size:' + fs + ';font-weight:' + fw + ';text-align:' + b.align + ';direction:' + (b.dir || 'rtl') + '">' +
      (b.x || '') + '</div></div>';
  }

  function pfBlockLede(b, i) {
    var sz = b.size === 'sm' ? '.85rem' : b.size === 'lg' ? '1.3rem' : '1.05rem';
    var fw = b.weight === 'bold' ? 700 : 500;
    var ph = 'سطر تمهيدي...';
    return '<div class="ve-b-lede" id="ve-ed-wrap-' + i + '">' +
      '<div class="ve-rt-editor" id="ve-ed-' + i + '" data-i="' + i + '" contenteditable="true" data-placeholder="' + ph + '" ' +
      'style="font-size:' + sz + ';font-weight:' + fw + ';text-align:' + b.align + ';direction:' + (b.dir || 'rtl') + ';color:#aaa">' +
      (b.x || '') + '</div></div>';
  }

  function pfBlockPara(b, i) {
    var sz = b.size === 'sm' ? '.85rem' : b.size === 'lg' ? '1.15rem' : '1rem';
    var fw = b.weight === 'bold' ? 700 : 400;
    var ph = 'اكتب الفقرة هنا...';
    return '<div class="ve-b-para" id="ve-ed-wrap-' + i + '">' +
      '<div class="ve-rt-editor" id="ve-ed-' + i + '" data-i="' + i + '" contenteditable="true" data-placeholder="' + ph + '" ' +
      'style="font-size:' + sz + ';font-weight:' + fw + ';text-align:' + b.align + ';direction:' + (b.dir || 'rtl') + ';color:#999;line-height:2;white-space:pre-wrap">' +
      (b.x || '') + '</div></div>';
  }

  function pfBlockImage(b, i) {
    var imgContent = b.src
      ? '<img src="' + esc(b.src) + '" alt="" style="width:100%;height:auto;display:block">'
      : '<span class="ve-b-image-empty">اضغط لرفع صورة أو صق رابط</span>';

    var heightOpts = Object.keys(veHeightOpts).map(function (k) {
      return '<option value="' + k + '"' + (b.h === k ? ' selected' : '') + '>' + veHeightOpts[k] + '</option>';
    }).join('');

    return '<div class="ve-b-image" style="padding:' + (b.src ? 0 : '') + '">' + imgContent + '</div>' +
      '<div class="ve-img-panel">' +
        '<input type="file" accept="image/*" id="ve-file-' + i + '" hidden onchange="pfUploadImg(' + i + ',this.files[0])">' +
        '<button class="ve-img-btn" onclick="document.getElementById(\'ve-file-' + i + '\').click()">📁 رفع من الجهاز</button>' +
        '<input type="text" value="' + esc(b.src) + '" placeholder="رابط مباشر https://..." ' +
          'style="flex:1;min-width:120px" oninput="pfOnImgSrc(' + i + ',this.value)">' +
        '<select onchange="pfOnImgHeight(' + i + ',this.value)">' + heightOpts + '</select>' +
        '<div class="ve-img-align-btns">' +
          '<button class="ve-img-albtn' + ((b.align||'center')==='right'?' active':'') + '" onclick="pfOnImgAlign(' + i + ',\'right\')" title="يمين">◀</button>' +
          '<button class="ve-img-albtn' + ((b.align||'center')==='center'?' active':'') + '" onclick="pfOnImgAlign(' + i + ',\'center\')" title="وسط">▬</button>' +
          '<button class="ve-img-albtn' + ((b.align||'center')==='left'?' active':'') + '" onclick="pfOnImgAlign(' + i + ',\'left\')" title="يسار">▶</button>' +
        '</div>' +
      '</div>' +
      '<div class="ve-img-caption-wrap" id="ve-ed-wrap-cap-' + i + '">' +
        '<div class="ve-rt-editor ve-img-caption-editor" id="ve-ed-cap-' + i + '" data-i="' + i + '" data-cap="1" contenteditable="true" data-placeholder="وصف الصورة (اختياري)...">' +
        (b.caption || '') + '</div></div>';
  }

  function pfBlockGallery(b, i) {
    var thumbs = b.imgs.map(function (s, j) {
      return '<div class="ve-thumb"><img src="' + esc(s) + '" alt="" onerror="this.parentElement.style.display=\'none\'">' +
        '<button onclick="event.stopPropagation();pfRemoveGalleryImg(' + i + ',' + j + ')">✕</button></div>';
    }).join('');

    var colOpts = Object.keys(veColsOpts).map(function (k) {
      return '<option value="' + k + '"' + (b.cols === k ? ' selected' : '') + '>' + veColsOpts[k] + '</option>';
    }).join('');

    return '<div class="ve-b-gallery">' +
      '<div class="ve-gallery-grid">' + (thumbs || '<div class="ve-gallery-empty">لا توجد صور بعد</div>') + '</div>' +
      '<div style="display:flex;flex-wrap:wrap;gap:.4rem;align-items:center">' +
        '<input type="file" accept="image/*" multiple id="ve-gal-' + i + '" hidden onchange="pfUploadGallery(' + i + ',this.files)">' +
        '<button class="ve-img-btn" onclick="document.getElementById(\'ve-gal-' + i + '\').click()">📁 رفع صور</button>' +
        '<button class="ve-img-btn" onclick="pfAddGalleryLink(' + i + ')">🔗 رابط</button>' +
        '<select onchange="pfOnGalleryCols(' + i + ',this.value)" style="border-radius:8px;background:#101010;color:#ddd;border:1px solid #2e2e2e;padding:.35rem .5rem;font-size:.72rem">' + colOpts + '</select>' +
      '</div></div>';
  }

  function pfBlockBA(b, i) {
    var imgA = b.a
      ? '<img src="' + esc(b.a) + '" alt="" class="ve-ba-img">'
      : '<div class="ve-ba-placeholder">صورة قبل</div>';
    var imgB = b.b
      ? '<img src="' + esc(b.b) + '" alt="" class="ve-ba-img">'
      : '<div class="ve-ba-placeholder">صورة بعد</div>';

    return '<div class="ve-b-ba">' +
      '<div class="ve-ba-grid">' +
        '<div class="ve-ba-slot"><div class="ve-ba-label">قبل</div>' + imgA + '</div>' +
        '<div class="ve-ba-slot"><div class="ve-ba-label">بعد</div>' + imgB + '</div>' +
      '</div>' +
      '<div class="ve-img-panel">' +
        '<input type="file" accept="image/*" id="ve-ba-a-' + i + '" hidden onchange="pfUploadImgBA(' + i + ',\'a\',this.files[0])">' +
        '<input type="file" accept="image/*" id="ve-ba-b-' + i + '" hidden onchange="pfUploadImgBA(' + i + ',\'b\',this.files[0])">' +
        '<button class="ve-img-btn" onclick="document.getElementById(\'ve-ba-a-' + i + '\').click()">📁 رفع "قبل"</button>' +
        '<button class="ve-img-btn" onclick="document.getElementById(\'ve-ba-b-' + i + '\').click()">📁 رفع "بعد"</button>' +
      '</div>' +
      '<div class="ve-ba-links">' +
        '<input type="text" value="' + esc(b.a) + '" placeholder="رابط صورة قبل https://..." oninput="pfOnBAInput(' + i + ',\'a\',this.value)">' +
        '<input type="text" value="' + esc(b.b) + '" placeholder="رابط صورة بعد https://..." oninput="pfOnBAInput(' + i + ',\'b\',this.value)">' +
      '</div></div>';
  }

  /* ═══════════════════════════════════════════════════════
     RICH TEXT EDITOR — execCommand-based toolbar
     ═══════════════════════════════════════════════════════ */

  var veSavedSel = null;

  function veSaveSel() {
    var sel = window.getSelection();
    if (sel && sel.rangeCount > 0) veSavedSel = sel.getRangeAt(0);
  }

  function veRestoreSel() {
    if (veSavedSel) {
      var sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(veSavedSel);
    }
  }

  function veExecCmd(cmd, val) {
    veRestoreSel();
    document.execCommand(cmd, false, val || null);
  }

  function veExecBlockType(tag) {
    veRestoreSel();
    veExecCmd('formatBlock', tag);
  }

  function veExecFontSize(val) {
    veRestoreSel();
    veExecCmd('fontSize', val);
  }

  function veExecFontName(val) {
    veRestoreSel();
    veExecCmd('fontName', val);
  }

  function veExecLink() {
    var url = prompt('أدخل الرابط:', 'https://');
    if (url) { veRestoreSel(); veExecCmd('createLink', url); }
  }

  function veBuildToolbar(i) {
    var b = veBlocks[i];
    var ph = b.t === 'title' ? 'عنوان المشروع...' : b.t === 'lede' ? 'سطر تمهيدي...' : 'اكتب الفقرة هنا...';
    return '<div class="ve-rt-toolbar" onclick="event.stopPropagation()">' +
      '<div class="ve-rt-group">' +
        '<select class="ve-rt-select" onchange="veExecBlockType(this.value);this.blur()">' +
          '<option value="p">Paragraph</option>' +
          '<option value="h2">Heading 2</option>' +
          '<option value="h3">Heading 3</option>' +
        '</select>' +
        '<select class="ve-rt-select" onchange="veExecFontName(this.value);this.blur()">' +
          '<option value="sans-serif">Sans-serif</option>' +
          '<option value="serif">Serif</option>' +
          '<option value="monospace">Monospace</option>' +
          '<option value="Tajawal">Tajawal</option>' +
          '<option value="Arial">Arial</option>' +
          '<option value="Helvetica">Helvetica</option>' +
          '<option value="Georgia">Georgia</option>' +
          '<option value="Times New Roman">Times New Roman</option>' +
        '</select>' +
        '<select class="ve-rt-select" onchange="veExecFontSize(this.value);this.blur()">' +
          '<option value="3">14</option>' +
          '<option value="4">16</option>' +
          '<option value="5" selected>20</option>' +
          '<option value="6">24</option>' +
          '<option value="7">32</option>' +
        '</select>' +
      '</div>' +
      '<div class="ve-rt-group">' +
        '<button class="ve-rt-btn" onmousedown="event.preventDefault()" onclick="veExecCmd(\'bold\')" title="غامق"><b>B</b></button>' +
        '<button class="ve-rt-btn" onmousedown="event.preventDefault()" onclick="veExecCmd(\'italic\')" title="مائل"><i>I</i></button>' +
        '<button class="ve-rt-btn" onmousedown="event.preventDefault()" onclick="veExecCmd(\'underline\')" title="تحته خط"><u>U</u></button>' +
        '<button class="ve-rt-btn" onmousedown="event.preventDefault()" onclick="veExecCmd(\'strikeThrough\')" title="يتوسطه خط"><s>S</s></button>' +
      '</div>' +
      '<div class="ve-rt-group">' +
        '<button class="ve-rt-btn" onmousedown="event.preventDefault()" onclick="veExecCmd(\'justifyRight\')" title="يمين">◀</button>' +
        '<button class="ve-rt-btn" onmousedown="event.preventDefault()" onclick="veExecCmd(\'justifyCenter\')" title="وسط">▬</button>' +
        '<button class="ve-rt-btn" onmousedown="event.preventDefault()" onclick="veExecCmd(\'justifyLeft\')" title="يسار">▶</button>' +
      '</div>' +
      '<div class="ve-rt-group">' +
        '<button class="ve-rt-btn" onmousedown="event.preventDefault()" onclick="veExecLink()" title="إدراج رابط">🔗</button>' +
        '<button class="ve-rt-btn" onmousedown="event.preventDefault()" onclick="veExecCmd(\'unlink\')" title="إزالة الرابط">⛓</button>' +
        '<button class="ve-rt-btn" onmousedown="event.preventDefault()" onclick="veExecCmd(\'removeFormat\')" title="مسح التنسيقات">Tx</button>' +
      '</div>' +
    '</div>';
  }

  function veSyncContenteditable(el) {
    var idx = parseInt(el.dataset.i);
    if (isNaN(idx) || !veBlocks[idx]) return;
    if (el.dataset.cap) {
      veBlocks[idx].caption = el.innerHTML;
    } else {
      veBlocks[idx].x = el.innerHTML;
    }
    veUnsaved = true;
  }

  /* ─── Render ─── */
  function pfRender() {
    var canvas = $('ve-canvas');
    if (!canvas) return;

    if (!veBlocks.length) {
      canvas.innerHTML = '<div class="ve-empty-hint">اضغط على زر "+" على اليسار لإضافة العنصر الأول</div>';
      return;
    }

    canvas.innerHTML = veBlocks.map(function (b, i) {
      var inner = '';
      switch (b.t) {
        case 'cover':
          inner = '<div class="ve-b-image" style="padding:0;background:#0a0a0a">' +
            (b.src ? '<img src="' + esc(b.src) + '" alt="" style="width:100%;height:auto;display:block">' : '<span class="ve-b-image-empty">صورة غلاف</span>') +
            '</div>';
          break;
        case 'title': inner = pfBlockTitle(b, i); break;
        case 'lede':  inner = pfBlockLede(b, i); break;
        case 'para':  inner = pfBlockPara(b, i); break;
        case 'image': inner = pfBlockImage(b, i); break;
        case 'gallery': inner = pfBlockGallery(b, i); break;
        case 'ba':    inner = pfBlockBA(b, i); break;
      }
      return '<div class="ve-block" data-i="' + i + '" onclick="pfSelectBlock(' + i + ')">' + pfBlockCtrls(i) + inner + '</div>';
    }).join('');

    canvas.querySelectorAll('.ve-rt-editor').forEach(function (el) {
      el.addEventListener('input', function () { veSyncContenteditable(el); });
      el.addEventListener('mouseup', function () { veSaveSel(); });
      el.addEventListener('keyup', function () { veSaveSel(); });
      el.addEventListener('keydown', function (e) {
        if (e.key === 'Tab') { e.preventDefault(); veExecCmd('insertHTML', '&nbsp;&nbsp;&nbsp;'); }
      });
      el.addEventListener('mousedown', function (e) { e.stopPropagation(); });
      el.addEventListener('click', function (e) { e.stopPropagation(); });
      el.addEventListener('focus', function () {
        veSaveSel();
        var wrap = el.closest('.ve-img-caption-wrap') || el.closest('[id^="ve-ed-wrap"]');
        if (wrap) {
          var existing = wrap.querySelector('.ve-rt-toolbar');
          if (!existing) wrap.insertAdjacentHTML('afterbegin', veBuildToolbar(parseInt(el.dataset.i)));
        }
      });
    });

    if (veSelIdx >= 0 && veSelIdx < veBlocks.length) {
      var b2 = veBlocks[veSelIdx];
      if (b2.t === 'title' || b2.t === 'lede' || b2.t === 'para') {
        var ed = document.getElementById('ve-ed-' + veSelIdx);
        if (ed) ed.focus();
      }
    }

    pfInitDragDrop();
  }

  /* ─── Selection ─── */
  function pfSelectBlock(i) {
    veSelIdx = i;
    document.querySelectorAll('.ve-block').forEach(function (b, idx) {
      b.classList.toggle('ve-sel', idx === i);
    });

    document.querySelectorAll('.ve-rt-toolbar').forEach(function (t) { t.remove(); });

    var block = veBlocks[i];
    if (block.t === 'title' || block.t === 'lede' || block.t === 'para') {
      var wrap = document.getElementById('ve-ed-wrap-' + i);
      if (wrap) {
        var existing = wrap.querySelector('.ve-rt-toolbar');
        if (!existing) wrap.insertAdjacentHTML('afterbegin', veBuildToolbar(i));
      }
      var ed = document.getElementById('ve-ed-' + i);
      if (ed) {
        ed.focus();
        setTimeout(veSaveSel, 10);
      }
    }
  }

  var dragSrcIdx = -1;

  function pfInitDragDrop() {
    var blocks = document.querySelectorAll('#ve-canvas .ve-block');
    var handles = document.querySelectorAll('#ve-canvas .ve-drag-handle');

    handles.forEach(function (handle) {
      handle.addEventListener('dragstart', function (e) {
        var block = handle.closest('.ve-block');
        dragSrcIdx = parseInt(block.dataset.i);
        block.classList.add('ve-dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', dragSrcIdx);
      });

      handle.addEventListener('dragend', function () {
        dragSrcIdx = -1;
        document.querySelectorAll('.ve-block').forEach(function (b) {
          b.classList.remove('ve-dragging');
          b.classList.remove('ve-drag-over-top');
          b.classList.remove('ve-drag-over-bottom');
        });
        document.querySelectorAll('.ve-drop-indicator').forEach(function (el) { el.remove(); });
      });
    });

    blocks.forEach(function (block) {
      block.addEventListener('dragover', function (e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        var targetIdx = parseInt(block.dataset.i);
        if (targetIdx === dragSrcIdx) return;

        var rect = block.getBoundingClientRect();
        var midY = rect.top + rect.height / 2;

        document.querySelectorAll('.ve-block').forEach(function (b) {
          b.classList.remove('ve-drag-over-top');
          b.classList.remove('ve-drag-over-bottom');
        });
        document.querySelectorAll('.ve-drop-indicator').forEach(function (el) { el.remove(); });

        var indicator = document.createElement('div');
        indicator.className = 've-drop-indicator';

        if (e.clientY < midY) {
          block.classList.add('ve-drag-over-top');
          block.parentNode.insertBefore(indicator, block);
        } else {
          block.classList.add('ve-drag-over-bottom');
          block.parentNode.insertBefore(indicator, block.nextSibling);
        }
      });

      block.addEventListener('dragleave', function () {
        block.classList.remove('ve-drag-over-top');
        block.classList.remove('ve-drag-over-bottom');
        block.querySelectorAll('.ve-drop-indicator').forEach(function (el) { el.remove(); });
      });

      block.addEventListener('drop', function (e) {
        e.preventDefault();
        var fromIdx = dragSrcIdx;
        var toIdx = parseInt(block.dataset.i);
        if (fromIdx < 0 || fromIdx === toIdx) return;

        var rect = block.getBoundingClientRect();
        var midY = rect.top + rect.height / 2;
        if (e.clientY >= midY) toIdx++;

        var moved = veBlocks.splice(fromIdx, 1)[0];
        if (fromIdx < toIdx) toIdx--;
        veBlocks.splice(toIdx, 0, moved);

        if (veSelIdx === fromIdx) veSelIdx = toIdx;
        else if (fromIdx < veSelIdx && toIdx >= veSelIdx) veSelIdx--;
        else if (fromIdx > veSelIdx && toIdx <= veSelIdx) veSelIdx++;

        veUnsaved = true;
        pfRender();
        pfSelectBlock(toIdx);
      });
    });
  }

  /* ═══════════════════════════════════════════════════════
     SECTION 7: VISUAL EDITOR — Block Operations
     ═══════════════════════════════════════════════════════ */

  function pfAddBlock(type) {
    var defaults = {
      title:   { t: 'title', x: '', align: 'center', size: 'md', weight: 'bold' },
      lede:    { t: 'lede', x: '', align: 'center', size: 'md', weight: 'normal' },
      para:    { t: 'para', x: '', align: 'center', size: 'md', weight: 'normal' },
      image:   { t: 'image', src: '', h: 'md', caption: '', align: 'center' },
      gallery: { t: 'gallery', imgs: [], cols: 'auto' },
      ba:      { t: 'ba', a: '', b: '' }
    };
    var def = Object.assign({}, defaults[type]);
    if (!def) return;

    if (type === 'title' || type === 'lede') {
      var existing = veBlocks.findIndex(function (b) { return b.t === 'title'; });
      var idx = type === 'title' ? (existing >= 0 ? existing : 0) : (existing >= 0 ? existing + 1 : veBlocks.length);
      veBlocks.splice(Math.min(idx, veBlocks.length), 0, def);
      veSelIdx = Math.min(idx, veBlocks.length - 1);
    } else {
      veBlocks.push(def);
      veSelIdx = veBlocks.length - 1;
    }

    veUnsaved = true;
    pfRender();
    requestAnimationFrame(function () { pfSelectBlock(Math.max(0, veSelIdx)); });
  }

  function pfRemoveBlock(i) {
    veBlocks.splice(i, 1);
    if (veSelIdx >= veBlocks.length) veSelIdx = veBlocks.length - 1;
    veUnsaved = true;
    pfRender();
  }

  function pfMoveBlock(i, dir) {
    var j = i + dir;
    if (j < 0 || j >= veBlocks.length) return;
    var tmp = veBlocks[i];
    veBlocks[i] = veBlocks[j];
    veBlocks[j] = tmp;
    pfRender();
    pfSelectBlock(j);
    veUnsaved = true;
  }

  /* ═══════════════════════════════════════════════════════
     SECTION 8: VISUAL EDITOR — Media Uploads
     ═══════════════════════════════════════════════════════ */

  function pfUploadImg(i, file) {
    if (!file) return;
    veBlocks[i].src = '⏳ جاري الرفع...';
    pfRender();
    compressImage(file, function (url) { veBlocks[i].src = url || ''; veUnsaved = true; pfRender(); });
  }

  function pfUploadGallery(i, files) {
    Array.from(files || []).forEach(function (f) {
      compressImage(f, function (url) { veBlocks[i].imgs.push(url); veUnsaved = true; pfRender(); });
    });
  }

  function pfUploadImgBA(i, side, file) {
    if (!file) return;
    compressImage(file, function (url) { veBlocks[i][side] = url; veUnsaved = true; pfRender(); });
  }

  /* ═══════════════════════════════════════════════════════
     SECTION 9: VISUAL EDITOR — Inline Input Handlers
     ═══════════════════════════════════════════════════════ */

  function pfOnBlockInput(i, text) { veBlocks[i].x = text; veUnsaved = true; }
  function pfOnImgSrc(i, val) { veBlocks[i].src = val; pfRender(); }
  function pfOnImgHeight(i, val) { veBlocks[i].h = val; pfRender(); }
  function pfOnImgCaption(i, val) { veBlocks[i].caption = val; veUnsaved = true; }
  function pfOnImgAlign(i, val) { veBlocks[i].align = val; veUnsaved = true; pfRender(); }
  function pfOnGalleryCols(i, val) { veBlocks[i].cols = val; pfRender(); }
  function pfOnBAInput(i, side, val) { veBlocks[i][side] = val; pfRender(); }

  function pfAddGalleryLink(i) {
    var url = prompt('صق رابط الصورة:');
    if (url && url.trim()) { veBlocks[i].imgs.push(url.trim()); veUnsaved = true; pfRender(); }
  }

  function pfRemoveGalleryImg(i, j) {
    veBlocks[i].imgs.splice(j, 1);
    veUnsaved = true;
    pfRender();
  }

  /* ═══════════════════════════════════════════════════════
     SECTION 10: VISUAL EDITOR — Save
     ═══════════════════════════════════════════════════════ */

  function pfSave(publish) {
    var title = $('ve-title-input').value.trim();
    if (!title) { alert('اسم المشروع مطلوب'); return; }

    document.querySelectorAll('.ve-rt-editor').forEach(function (el) { veSyncContenteditable(el); });

    var statusEl = $('ve-status');
    statusEl.textContent = 'جاري الحفظ...';
    statusEl.style.color = '#888';

    var blocks = veBlocks.map(function (b) { return Object.assign({}, b); });

    var panelCover = ($('ve-cover-url').value || '').trim();
    var coverBlockIdx = blocks.findIndex(function (b) { return b.t === 'cover'; });
    if (panelCover) {
      if (coverBlockIdx >= 0) {
        blocks[coverBlockIdx].src = panelCover;
      } else {
        blocks.unshift({ t: 'cover', src: panelCover, h: (veProject && veProject.format && veProject.format.coverHeight) || 'md' });
      }
    } else if (coverBlockIdx >= 0) {
      blocks.splice(coverBlockIdx, 1);
    }
    var coverBlock = blocks.find(function (b) { return b.t === 'cover'; });
    var titleBlock = blocks.find(function (b) { return b.t === 'title'; });
    var ledeBlock = blocks.find(function (b) { return b.t === 'lede'; });
    var galBlock = blocks.find(function (b) { return b.t === 'gallery'; });
    var baBlock = blocks.find(function (b) { return b.t === 'ba'; });
    var allImgs = blocks.filter(function (b) { return b.t === 'image'; }).map(function (b) { return b.src; }).filter(Boolean);

    var data = {
      title: title,
      subtitle: $('ve-subtitle').value.trim(),
      category: $('ve-category').value,
      field: $('ve-field').value.trim(),
      services: $('ve-services').value.trim(),
      year: $('ve-year').value.trim(),
      tag: $('ve-tag').value.trim(),
      tools: $('ve-tools').value.split('·').map(function (s) { return s.trim(); }).filter(Boolean),
      order: parseInt($('ve-order').value) || 0,
      blocks: blocks,
      coverImage: ($('ve-cover-url').value.trim()) || (coverBlock && coverBlock.src) || (veProject && veProject.coverImage) || '',
      beforeImage: baBlock ? baBlock.a : '',
      afterImage: baBlock ? baBlock.b : '',
      galleryImages: galBlock ? galBlock.imgs.filter(Boolean) : allImgs,
      published: publish ? true : $('ve-published').checked,
      format: (veProject && veProject.format) || {}
    };

    if (coverBlock) data.format.coverHeight = coverBlock.h;
    if (titleBlock) { data.format.titleAlign = titleBlock.align; data.format.titleSize = titleBlock.size; data.format.titleWeight = titleBlock.weight; }
    if (ledeBlock) { data.format.descAlign = ledeBlock.align; data.format.descSize = ledeBlock.size; data.format.descWeight = ledeBlock.weight; }
    if (galBlock) data.format.galleryCols = galBlock.cols;

    var estimateKB = Math.round(JSON.stringify(data).length / 1024);
    if (estimateKB > 950) {
      statusEl.textContent = '❌ الحجم كبير جداً (' + estimateKB + 'KB)';
      statusEl.style.color = '#ef4444';
      alert('البيانات أكبر من الحد المسموح Firebase (1MB).\nقلّل عدد الصور أو استخدم روابط خارجية.');
      return;
    }

    var fail = function (e) { statusEl.textContent = '❌ خطأ: ' + e.message; statusEl.style.color = '#ef4444'; };
    var done = function () {
      statusEl.textContent = '✓ تم الحفظ والنشر';
      statusEl.style.color = '#22c55e';
      veUnsaved = false;
      veProject = Object.assign({}, veProject, data);
      loadProjects();
    };

    if (veProject && veProject.id) {
      db().collection('projects').doc(veProject.id).get().then(function (snap) {
        var existing = snap.data() || {};
        var cleanUpdate = {};
        ['coverImage', 'beforeImage', 'afterImage'].forEach(function (k) {
          if (typeof existing[k] === 'string' && existing[k].startsWith('data:')) cleanUpdate[k] = '';
        });
        if (Array.isArray(existing.galleryImages)) {
          var clean = existing.galleryImages.filter(function (u) { return typeof u === 'string' && !u.startsWith('data:'); });
          if (clean.length !== existing.galleryImages.length) cleanUpdate.galleryImages = clean;
        }
        if (Array.isArray(existing.blocks)) {
          cleanUpdate.blocks = existing.blocks.map(function (b) {
            var nb = Object.assign({}, b);
            if (nb.src && nb.src.startsWith('data:')) nb.src = '';
            if (nb.a && nb.a.startsWith('data:')) nb.a = '';
            if (nb.b && nb.b.startsWith('data:')) nb.b = '';
            if (Array.isArray(nb.imgs)) nb.imgs = nb.imgs.filter(function (u) { return !u.startsWith('data:'); });
            return nb;
          });
        }
        if (Object.keys(cleanUpdate).length) {
          return db().collection('projects').doc(veProject.id).update(cleanUpdate)
            .then(function () { return db().collection('projects').doc(veProject.id).set(data, { merge: true }); })
            .then(done).catch(fail);
        }
        return db().collection('projects').doc(veProject.id).set(data, { merge: true }).then(done).catch(fail);
      }).catch(fail);
    } else {
      data.createdAt = new Date().toISOString();
      db().collection('projects').add(data).then(function (d) {
        veProject = Object.assign({ id: d.id }, data);
        allProjects.push(Object.assign({ id: d.id }, data));
        done();
      }).catch(fail);
    }
  }

  /* ═══════════════════════════════════════════════════════
     SECTION 11: EVENT LISTENERS
     ═══════════════════════════════════════════════════════ */

  document.addEventListener('click', function (e) {
    var canvas = $('ve-canvas');
    if (canvas && !canvas.contains(e.target) && !e.target.closest('.ve-rt-toolbar')) {
      document.querySelectorAll('.ve-rt-editor').forEach(function (el) { veSyncContenteditable(el); });
    }
  });

  document.addEventListener('selectionchange', function () {
    var active = document.activeElement;
    if (active && active.classList && active.classList.contains('ve-rt-editor')) {
      veSaveSel();
    }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      var overlay = $('ve-overlay');
      if (overlay && overlay.style.display === 'flex') pfCloseEditor();
    }
  });

  /* ═══════════════════════════════════════════════════════
     SECTION 12: PUBLIC API (global functions for HTML)
     ═══════════════════════════════════════════════════════ */

  window.pfOpenEditor = pfOpenEditor;
  window.pfCloseEditor = pfCloseEditor;
  window.pfSave = pfSave;
  window.pfAddBlock = pfAddBlock;
  window.pfTogglePublish = pfTogglePublish;
  window.pfDeleteProject = pfDeleteProject;
  window.pfSelectBlock = pfSelectBlock;
  window.pfRemoveBlock = pfRemoveBlock;
  window.pfMoveBlock = pfMoveBlock;
  window.pfOnImgSrc = pfOnImgSrc;
  window.pfOnImgHeight = pfOnImgHeight;
  window.pfOnImgCaption = pfOnImgCaption;
  window.pfOnImgAlign = pfOnImgAlign;
  window.pfOnGalleryCols = pfOnGalleryCols;
  window.pfOnBAInput = pfOnBAInput;
  window.pfAddGalleryLink = pfAddGalleryLink;
  window.pfRemoveGalleryImg = pfRemoveGalleryImg;
  window.pfUploadImg = pfUploadImg;
  window.pfUploadGallery = pfUploadGallery;
  window.pfUploadImgBA = pfUploadImgBA;
  window.pfOnBlockInput = pfOnBlockInput;
  window.pfOnImgSrc = pfOnImgSrc;
  window.pfOnImgHeight = pfOnImgHeight;
  window.pfOnImgCaption = pfOnImgCaption;
  window.pfOnImgAlign = pfOnImgAlign;
  window.pfOnGalleryCols = pfOnGalleryCols;
  window.pfOnBAInput = pfOnBAInput;
  window.pfAddGalleryLink = pfAddGalleryLink;
  window.pfRemoveGalleryImg = pfRemoveGalleryImg;
  window.pfUploadImg = pfUploadImg;
  window.pfUploadGallery = pfUploadGallery;
  window.pfUploadImgBA = pfUploadImgBA;
  window.veExecCmd = veExecCmd;
  window.veExecBlockType = veExecBlockType;
  window.veExecFontSize = veExecFontSize;
  window.veExecFontName = veExecFontName;
  window.veExecLink = veExecLink;
  window.loadProjects = loadProjects;
  window.quickTogglePublish = quickTogglePublish;
  window.deleteProjectDoc = deleteProjectDoc;
  window.cleanAllProjects = cleanAllProjects;

  $('ve-title-input').addEventListener('input', function () { veUnsaved = true; });

})();
