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
  var veUploadCache = {};

  /* ═══════════════════════════════════════════════════════
     SECTION 2: UTILITIES
     ═══════════════════════════════════════════════════════ */

  function esc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function $(id) { return document.getElementById(id); }
  function db() { return firebase.firestore(); }

  function collectStorageImageUrls(project) {
    var urls = {};
    if (!project || typeof project !== 'object') return urls;
    var add = function (value) {
      if (typeof value !== 'string' || !value || value.indexOf('data:') === 0) return;
      if (/firebasestorage\.googleapis\.com|firebasestorage\.app|storage\.googleapis\.com/i.test(value)) urls[value] = true;
    };
    ['coverImage', 'beforeImage', 'afterImage'].forEach(function (key) { add(project[key]); });
    (Array.isArray(project.galleryImages) ? project.galleryImages : []).forEach(add);
    (Array.isArray(project.blocks) ? project.blocks : []).forEach(function (block) {
      add(block.src);
      add(block.a);
      add(block.b);
      (Array.isArray(block.imgs) ? block.imgs : []).forEach(add);
    });
    return urls;
  }

  function deleteRemovedStorageImages(previous, next, projectId) {
    var oldUrls = collectStorageImageUrls(previous);
    var newUrls = collectStorageImageUrls(next);
    var removed = Object.keys(oldUrls).filter(function (url) { return !newUrls[url]; });
    if (!removed.length || !window.firebase || !firebase.storage) return Promise.resolve();

    return db().collection('projects').get().then(function (snap) {
      var stillUsed = {};
      snap.forEach(function (doc) {
        if (doc.id === projectId) return;
        Object.keys(collectStorageImageUrls(doc.data())).forEach(function (url) { stillUsed[url] = true; });
      });
      return Promise.all(removed.filter(function (url) { return !stillUsed[url]; }).map(function (url) {
        try {
          return firebase.storage().refFromURL(url).delete().catch(function (error) {
            console.warn('تعذر حذف ملف الصورة من Storage', url, error);
          });
        } catch (error) {
          console.warn('رابط Storage غير صالح للحذف', url, error);
          return Promise.resolve();
        }
      }));
    });
  }

  function normalizeRemoteImageUrl(url) {
    if (!url || typeof url !== 'string') return '';
    var value = url.trim();
    if (!value) return '';

    try {
      var parsed = new URL(value);
      if (parsed.hostname.includes('1drv.ms') || parsed.hostname.includes('onedrive.live.com')) {
        if (!parsed.searchParams.has('download')) parsed.searchParams.set('download', '1');
        return parsed.toString();
      }
      return value;
    } catch (e) {
      return value;
    }
  }

  function getFileUploadKey(file) {
    if (!file || typeof file !== 'object') return '';
    return [file.name || '', file.size || '', file.lastModified || '', file.type || ''].join(':');
  }

  function shouldSkipRepeatedUpload(file, currentValue) {
    var key = getFileUploadKey(file);
    if (!key) return false;
    var current = String(currentValue || '').trim();
    if (current && veUploadCache[key] === current) return true;
    return false;
  }

  function rememberUploadedFile(file, value) {
    var key = getFileUploadKey(file);
    if (!key) return;
    veUploadCache[key] = String(value || '').trim();
  }

  function isFirebaseStorageUrl(value) {
    return typeof value === 'string' && /firebasestorage\.googleapis\.com|firebasestorage\.app|storage\.googleapis\.com/i.test(value);
  }

  function deleteStorageUrlIfExists(url) {
    if (!url || !isFirebaseStorageUrl(url) || !window.firebase || !firebase.storage) return Promise.resolve(false);
    return firebase.storage().refFromURL(url).delete().then(function () { return true; }).catch(function (error) {
      console.warn('تعذر حذف الملف من Firebase Storage:', url, error);
      return false;
    });
  }

  /* ═══════════════════════════════════════════════════════
     SECTION 3: IMAGE COMPRESSION
     ═══════════════════════════════════════════════════════ */

  function compressImage(file, callback) {
    if (!file || !file.type || !file.type.startsWith('image/')) {
      callback('');
      return;
    }

    var statusEl = $('ve-status');
    if (statusEl) {
      statusEl.textContent = 'جاري ضغط الصورة...';
      statusEl.style.color = '#f59e0b';
    }

    var reader = new FileReader();
    reader.onload = function (e) {
      var img = new Image();
      img.onload = function () {
        var MAX = 1000;
        var quality = 0.72;
        var scale = Math.min(1, MAX / Math.max(img.width, img.height));
        var canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        var ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        canvas.toBlob(function (blob) {
          if (blob) {
            finishCompressedImage(blob, statusEl, callback);
            return;
          }

          // Older browsers may not support WebP encoding.
          canvas.toBlob(function (fallbackBlob) {
            finishCompressedImage(fallbackBlob, statusEl, callback);
          }, 'image/jpeg', quality);
        }, 'image/webp', 0.78);
      };
      img.onerror = function () {
        if (statusEl) {
          statusEl.textContent = '❌ فشل قراءة الصورة';
          statusEl.style.color = '#ef4444';
        }
        callback('');
      };
      img.src = e.target.result;
    };
    reader.onerror = function () {
      if (statusEl) {
        statusEl.textContent = '❌ فشل فتح الملف';
        statusEl.style.color = '#ef4444';
      }
      callback('');
    };
    reader.readAsDataURL(file);
  }

  function finishCompressedImage(blob, statusEl, callback) {
    if (!blob) { callback(''); return; }
    var completed = false;
    var finish = function (url) {
      if (completed) return;
      completed = true;
      callback(url || '');
    };
    var fail = function () {
      if (statusEl) {
        statusEl.textContent = '❌ فشل رفع الصورة — تأكد من اتصال الإنترنت';
        statusEl.style.color = '#ef4444';
      }
      finish('');
    };
    if (window.firebase && firebase.storage) {
      uploadBlobToStorage(blob, function (url) {
        if (statusEl) {
          statusEl.textContent = '✓ تم رفع الصورة';
          statusEl.style.color = '#22c55e';
        }
        finish(url);
      }, fail, statusEl);
    } else {
      fail();
    }
  }

  function uploadBlobToStorage(blob, callback, fallback, statusEl) {
    var settled = false;
    var settleFallback = function () {
      if (settled) return;
      settled = true;
      fallback();
    };
    var timeoutId = window.setTimeout(function () {
      console.warn('storage upload timed out');
      if (statusEl) {
        statusEl.textContent = '❌ انتهت مهلة الرفع — تحقق من الإنترنت';
        statusEl.style.color = '#ef4444';
      }
      settleFallback();
    }, 15000);
    try {
      var storage = firebase.storage();
      var extension = blob.type === 'image/webp' ? 'webp' : 'jpg';
      var name = 'projects/' + Date.now() + '-' + Math.random().toString(36).slice(2, 8) + '.' + extension;
      var task = storage.ref(name).put(blob, { contentType: blob.type });
      task.on('state_changed', function (snapshot) {
        if (!statusEl || !snapshot.totalBytes) return;
        var percent = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
        statusEl.textContent = 'جاري رفع الصورة... ' + percent + '%';
      }, function (err) {
        console.warn('storage upload failed, falling back to base64', err);
        window.clearTimeout(timeoutId);
        settleFallback();
      }, function () {
        task.snapshot.ref.getDownloadURL().then(function (url) {
          window.clearTimeout(timeoutId);
          if (settled) return;
          settled = true;
          callback(url);
        }).catch(function () {
          window.clearTimeout(timeoutId);
          settleFallback();
        });
      });
    } catch (e) {
      window.clearTimeout(timeoutId);
      settleFallback();
    }
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

  function pfTogglePublish(id) {
    var p = allProjects.find(function (x) { return x.id === id; });
    if (!p) return;
    db().collection('projects').doc(id).update({ published: p.published === false }).then(loadProjects);
  }

  function pfDeleteProject(id) {
    if (!confirm('حذف هذا العمل نهائياً؟ سيختفي من صفحة أعمالنا.')) return;
    var projectRef = db().collection('projects').doc(id);
    projectRef.get().then(function (snap) {
      var existing = snap.data() || {};
      return projectRef.delete().then(function () {
        return deleteRemovedStorageImages(existing, {}, id);
      });
    }).then(function () {
      allProjects = allProjects.filter(function (x) { return x.id !== id; });
      loadProjects();
    }).catch(function (error) {
      alert('تعذر حذف المشروع: ' + error.message);
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

  function veAddTool(tool) {
    var field = $('ve-tools-field');
    if (!field) return;
    var value = (field.value || '').trim();
    var tools = value ? value.split(/·|,|\n/).map(function (item) { return item.trim(); }).filter(Boolean) : [];
    var nextTool = String(tool || '').trim();
    if (!nextTool) return;
    if (tools.indexOf(nextTool) === -1) tools.push(nextTool);
    field.value = tools.join(' · ');
    field.dispatchEvent(new Event('input', { bubbles: true }));
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
    $('ve-tools-field').value = Array.isArray(d.tools) ? d.tools.join(' · ') : (d.tools || '');
    $('ve-order').value = d.order != null ? d.order : '';
    $('ve-color').value = /^#[0-9a-f]{6}$/i.test(d.color || '') ? d.color : '#ef6b32';
    $('ve-color-value').textContent = $('ve-color').value;
    applyVeAccentColor($('ve-color').value);
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
    var safeSrc = normalizeRemoteImageUrl(src || '');
    if (safeSrc) {
      img.src = safeSrc;
      prev.style.display = 'block';
    } else {
      img.src = '';
      prev.style.display = 'none';
    }
  }
  function pfClearCover() {
    var currentUrl = ($('ve-cover-url').value || '').trim();
    if (currentUrl) {
      var shouldDelete = confirm('هل تريد حذف الصورة نهائياً؟\nسيتم حذف الملف أيضاً من Firebase Storage إذا كان موجوداً هناك.');
      if (shouldDelete) {
        deleteStorageUrlIfExists(currentUrl).catch(function () {});
      } else {
        return;
      }
    }

    $('ve-cover-url').value = '';
    renderCoverPreview('');
    veUnsaved = true;
  }

  var veCoverLoaded = function (src) {
    var safeSrc = normalizeRemoteImageUrl(src || '');
    $('ve-cover-url').value = safeSrc;
    renderCoverPreview(safeSrc);
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

  function pfBlockInsertAfter(i) {
    var blockTypeOptions = [
      ['title', 'عنوان'],
      ['lede', 'سطر تمهيدي'],
      ['para', 'فقرة'],
      ['image', 'صورة'],
      ['gallery', 'معرض صور'],
      ['ba', 'قبل/بعد'],
      ['imgtext', 'صورة + نص'],
      ['stats', 'إحصائيات']
    ];

    var menuItems = blockTypeOptions.map(function (type) {
      return '<button type="button" class="ve-add-item" data-type="' + type[0] + '" data-index="' + (i + 1) + '">' + type[1] + '</button>';
    }).join('');

    return '<div class="ve-insert-between">' +
      '<button type="button" class="ve-add-between">＋ إضافة</button>' +
      '<div class="ve-add-menu">' + menuItems + '</div>' +
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

    var w = Math.max(30, Math.min(100, parseInt(b.w, 10) || 100));

    return '<div class="ve-b-image">' + imgContent + '</div>' +
      '<div class="ve-img-panel">' +
        '<input type="file" accept="image/*" id="ve-file-' + i + '" hidden onchange="pfUploadImg(' + i + ',this.files[0])">' +
        '<button class="ve-img-btn" onclick="document.getElementById(\'ve-file-' + i + '\').click()">📁 رفع من الجهاز</button>' +
        '<input type="text" value="' + esc(b.src) + '" placeholder="رابط مباشر https://..." ' +
          'style="flex:1;min-width:120px" oninput="pfOnImgSrc(' + i + ',this.value)">' +
        '<label class="ve-ctl-label">عرض الصورة <b id="ve-w-val-' + i + '">' + w + '%</b></label>' +
        '<input type="range" min="30" max="100" step="5" value="' + w + '" oninput="pfOnImgWidth(' + i + ',this.value)" style="flex:1">' +
        '<select onchange="pfOnImgFit(' + i + ',this.value)">' +
          '<option value="full"' + (b.fit === 'full' ? ' selected' : '') + '>حافة إلى حافة (ملء عرض الصفحة)</option>' +
          '<option value="contain"' + (b.fit !== 'cover' && b.fit !== 'full' ? ' selected' : '') + '>الأبعاد كاملة (بلا قص)</option>' +
          '<option value="cover"' + (b.fit === 'cover' ? ' selected' : '') + '>ملء الإطار (يقص لنسبة ثابتة)</option>' +
        '</select>' +
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
      var media = '';
      if (/\.(mp4|webm|ogg|mov|m4v)(\?|$)/i.test(String(s || '')) || /youtube\.com|youtu\.be|vimeo\.com/i.test(String(s || '')) || /video\//i.test(String(s || ''))) {
        media = '<video src="' + esc(s) + '" controls playsinline preload="metadata" style="width:100%;height:100%;object-fit:cover"></video>';
      } else {
        media = '<img src="' + esc(s) + '" alt="" onerror="this.parentElement.style.display=\'none\'">';
      }
      return '<div class="ve-thumb">' + media + '<button onclick="event.stopPropagation();pfRemoveGalleryImg(' + i + ',' + j + ')">✕</button></div>';
    }).join('');

    var colOpts = Object.keys(veColsOpts).map(function (k) {
      return '<option value="' + k + '"' + (b.cols === k ? ' selected' : '') + '>' + veColsOpts[k] + '</option>';
    }).join('');

    return '<div class="ve-b-gallery">' +
      '<div class="ve-gallery-grid">' + (thumbs || '<div class="ve-gallery-empty">لا توجد صور بعد</div>') + '</div>' +
      '<div class="ve-upload-actions">' +
        '<input type="file" accept="image/*" multiple id="ve-gal-' + i + '" hidden onchange="pfUploadGallery(' + i + ',this.files)">' +
        '<button class="ve-img-btn" onclick="document.getElementById(\'ve-gal-' + i + '\').click()">📁 رفع صور</button>' +
        '<button class="ve-img-btn" onclick="event.stopPropagation();pfAddGalleryVideo(' + i + ')">🎬 فيديو</button>' +
        '<button class="ve-img-btn" onclick="event.stopPropagation();pfAddGalleryLink(' + i + ')">🔗 رابط</button>' +
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
    var w = Math.max(30, Math.min(100, parseInt(b.w, 10) || 100));

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
        '<label class="ve-ctl-label">عرض المقارنة <b id="ve-ba-w-val-' + i + '">' + w + '%</b></label>' +
        '<input type="range" min="30" max="100" step="5" value="' + w + '" oninput="pfOnBAWidth(' + i + ',this.value)" style="flex:1">' +
        '<select onchange="pfOnBAFit(' + i + ',this.value)">' +
          '<option value="full"' + (b.fit === 'full' ? ' selected' : '') + '>حافة إلى حافة (ملء عرض الصفحة)</option>' +
          '<option value="contain"' + (b.fit !== 'cover' && b.fit !== 'full' ? ' selected' : '') + '>الأبعاد كاملة (بلا قص)</option>' +
          '<option value="cover"' + (b.fit === 'cover' ? ' selected' : '') + '>ملء الإطار (يقص لنسبة ثابتة)</option>' +
        '</select>' +
      '</div>' +
      '<div class="ve-ba-links">' +
        '<input type="text" value="' + esc(b.a) + '" placeholder="رابط صورة قبل https://..." oninput="pfOnBAInput(' + i + ',\'a\',this.value)">' +
        '<input type="text" value="' + esc(b.b) + '" placeholder="رابط صورة بعد https://..." oninput="pfOnBAInput(' + i + ',\'b\',this.value)">' +
      '</div></div>';
  }

  function pfBlockImgText(b, i) {
    var ratio = (b.ratio==='16/9'||b.ratio==='4/3'||b.ratio==='3/4'||b.ratio==='1/1') ? b.ratio : '4/3';
    var imgContent = b.src
      ? '<img src="' + esc(b.src) + '" alt="" style="width:100%;height:100%;object-fit:cover;display:block">'
      : '<span class="ve-b-image-empty">اضغط لرفع صورة</span>';

    var sync = function (prop) {
      return 'contenteditable="true" data-i="' + i + '" ' +
        'data-imgtextprop="' + prop + '" onmousedown="event.stopPropagation()" ' +
        'onclick="event.stopPropagation()"';
    };

    var ratioOpts = '<option value="4/3"' + (ratio === '4/3' ? ' selected' : '') + '>نسبة 4:3</option>' +
      '<option value="16/9"' + (ratio === '16/9' ? ' selected' : '') + '>نسبة 16:9</option>' +
      '<option value="3/4"' + (ratio === '3/4' ? ' selected' : '') + '>نسبة 3:4</option>' +
      '<option value="1/1"' + (ratio === '1/1' ? ' selected' : '') + '>نسبة 1:1</option>';

    var stackOpts = '<option value="img-first"' + (b.stack !== 'text-first' ? ' selected' : '') + '>صورة أولاً</option>' +
                    '<option value="text-first"' + (b.stack === 'text-first' ? ' selected' : '') + '>نص أولاً</option>';

    return '<div class="ve-b-imgtext" onclick="event.stopPropagation()">' +
      '<div class="ve-imgtext-row" data-stack="' + esc(b.stack || 'img-first') + '" style="grid-template-columns:1fr 1fr;direction:' + (b.side==='left'?'ltr':'rtl') + '" data-ratio="' + ratio + '">' +
        '<div class="ve-imgtext-img">' + imgContent + '</div>' +
        '<div class="ve-imgtext-text">' +
          '<div class="ve-it-eyebrow ve-rt-editor" ' + sync('eyebrow') + ' data-placeholder="سطر صغير (كيكر)..." >' + (b.eyebrow || '') + '</div>' +
          '<div class="ve-it-heading ve-rt-editor" ' + sync('heading') + ' data-placeholder="العنوان الكبير..." >' + (b.heading || '') + '</div>' +
          '<div class="ve-it-body ve-rt-editor" ' + sync('text') + ' data-placeholder="اكتب النص هنا...">' + (b.text || '') + '</div>' +
        '</div>' +
      '</div>' +
      '<div class="ve-imgtext-panel">' +
        '<input type="file" accept="image/*" id="ve-it-file-' + i + '" hidden onchange="pfUploadImgText(' + i + ',this.files[0])">' +
        '<button class="ve-img-btn" onclick="document.getElementById(\'ve-it-file-' + i + '\').click()">📁 رفع من الجهاز</button>' +
        '<input type="text" value="' + esc(b.src) + '" placeholder="رابط الصورة https://..." oninput="pfOnImgTextSrc(' + i + ',this.value)">' +
        '<select onchange="pfOnImgTextRatio(' + i + ',this.value)">' + ratioOpts + '</select>' +
        '<select onchange="pfOnImgTextSide(' + i + ',this.value)">' +
          '<option value="right"' + (b.side !== 'left' ? ' selected' : '') + '>صورة يمين</option>' +
          '<option value="left"' + (b.side === 'left' ? ' selected' : '') + '>صورة يسار</option>' +
        '</select>' +
        '<select onchange="pfOnImgTextStack(' + i + ',this.value)">' + stackOpts + '</select>' +
      '</div></div>';
  }

  function arabicToLatin(str) {
    return String(str).replace(/[٠-٩]/g, function (d) { return String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)); });
  }

  function pfBlockStats(b, i) {
    var items = Array.isArray(b.items) && b.items.length ? b.items : [{ n: '', suffix: '', label: '' }];

    var rows = items.map(function (it, j) {
      var numVal = it.n || '';
      var sufVal = it.suffix || '';
      var lblVal = it.label || '';
      if (/[٠-٩]/.test(numVal)) numVal = arabicToLatin(numVal);
      return '<div class="ve-stat-row">' +
        '<input type="text" inputmode="decimal" value="' + esc(numVal) + '" placeholder="الرقم: 120" ' +
          'oninput="pfOnStatField(' + i + ',' + j + ',\'n\',this.value)" class="ve-stat-n">' +
        '<input type="text" value="' + esc(sufVal) + '" placeholder="اللاحقة: +" ' +
          'oninput="pfOnStatField(' + i + ',' + j + ',\'suffix\',this.value)" class="ve-stat-s">' +
        '<input type="text" value="' + esc(lblVal) + '" placeholder="التسمية: مشروع مكتمل" ' +
          'oninput="pfOnStatField(' + i + ',' + j + ',\'label\',this.value)" class="ve-stat-l">' +
        '<button class="ve-ctrl" onclick="event.stopPropagation();pfRemoveStat(' + i + ',' + j + ')" title="حذف" style="color:#f87171">✕</button>' +
      '</div>';
    }).join('');

    return '<div class="ve-b-stats" onclick="event.stopPropagation()">' +
      '<div class="ve-stat-title">أرقام المشروع</div>' +
      '<div class="ve-stats-row">' + rows + '</div>' +
      '<button class="ve-img-btn" onclick="event.stopPropagation();pfAddStat(' + i + ')">➕ إضافة رقم</button>' +
    '</div>';
  }

  function pfOnStatField(i, j, field, val) {
    if (!veBlocks[i] || !Array.isArray(veBlocks[i].items)) return;
    if (!veBlocks[i].items[j]) veBlocks[i].items[j] = { n: '', suffix: '', label: '' };
    veBlocks[i].items[j][field] = val;
    veUnsaved = true;
  }
  function pfAddStat(i) {
    if (!veBlocks[i]) return;
    if (!Array.isArray(veBlocks[i].items)) veBlocks[i].items = [];
    veBlocks[i].items.push({ n: '', suffix: '', label: '' });
    veUnsaved = true;
    pfRender();
  }
  function pfRemoveStat(i, j) {
    if (!veBlocks[i] || !Array.isArray(veBlocks[i].items)) return;
    veBlocks[i].items.splice(j, 1);
    veUnsaved = true;
    pfRender();
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

  function veEditorFromSel() {
    var sel = window.getSelection();
    if (!sel || !sel.rangeCount) return null;
    var node = sel.getRangeAt(0).commonAncestorContainer;
    if (node && node.nodeType === 3) node = node.parentElement;
    return (node && node.closest) ? node.closest('.ve-rt-editor') : null;
  }

  function veExecForeColor(hex) {
    veRestoreSel();
    document.execCommand('foreColor', false, hex || '');
    var editor = veEditorFromSel();
    if (!editor) return;
    editor.querySelectorAll('font[color]').forEach(function (f) {
      var s = document.createElement('span');
      s.style.color = f.getAttribute('color');
      while (f.firstChild) s.appendChild(f.firstChild);
      f.parentNode.replaceChild(s, f);
    });
    veSyncContenteditable(editor);
  }

  function veExecClearColor() {
    veRestoreSel();
    var editor = veEditorFromSel();
    if (!editor) return;
    var range = window.getSelection() && window.getSelection().rangeCount ? window.getSelection().getRangeAt(0) : null;
    editor.querySelectorAll('font[color], span[style*="color"]').forEach(function (el) {
      if (range && !range.intersectsNode(el)) return;
      if (el.tagName === 'FONT') el.removeAttribute('color');
      else el.style.color = '';
      var empty = el.tagName === 'FONT' ? el.attributes.length === 0 : !el.style.length && el.attributes.length === 0;
      if (empty) {
        var frag = document.createDocumentFragment();
        while (el.firstChild) frag.appendChild(el.firstChild);
        el.parentNode.replaceChild(frag, el);
      }
    });
    veSyncContenteditable(editor);
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
        '<input type="color" class="ve-rt-color" value="#12110f" title="لون النص" onmousedown="event.stopPropagation();veSaveSel()" oninput="veExecForeColor(this.value)">' +
        '<button class="ve-rt-btn" onmousedown="event.preventDefault();veSaveSel()" onclick="veExecClearColor()" title="إزالة اللون"><s style="color:#f68720">A</s></button>' +
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
    } else if (el.dataset.imgtextprop) {
      veBlocks[idx][el.dataset.imgtextprop] = el.innerHTML;
    } else if (el.dataset.it) {
      veBlocks[idx].text = el.innerHTML;
    } else {
      veBlocks[idx].x = el.innerHTML;
    }
    veUnsaved = true;
  }

  /* ─── Render ─── */
  function pfRender() {
    var canvas = $('ve-canvas');
    if (!canvas) return;

    canvas.querySelectorAll('.ve-rt-editor').forEach(function (el) { veSyncContenteditable(el); });

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
        case 'imgtext': inner = pfBlockImgText(b, i); break;
        case 'stats': inner = pfBlockStats(b, i); break;
      }
      return '<div class="ve-block" data-i="' + i + '" onclick="pfSelectBlock(' + i + ')">' + pfBlockCtrls(i) + inner + pfBlockInsertAfter(i) + '</div>';
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
        var wrap = el.closest('.ve-img-caption-wrap') || el.closest('[id^="ve-ed-wrap"]') || el.closest('.ve-imgtext-text');
        if (wrap) {
          var existing = wrap.querySelector('.ve-rt-toolbar');
          if (!existing) wrap.insertAdjacentHTML('afterbegin', veBuildToolbar(parseInt(el.dataset.i)));
        }
      });
    });

    if (veSelIdx >= 0 && veSelIdx < veBlocks.length) {
      canvas.querySelectorAll('.ve-block').forEach(function (b, idx) { b.classList.toggle('ve-sel', idx === veSelIdx); });
      var b2 = veBlocks[veSelIdx];
      if (b2.t === 'title' || b2.t === 'lede' || b2.t === 'para') {
        var ed = document.getElementById('ve-ed-' + veSelIdx);
        if (ed) ed.focus();
      }
    }

    canvas.querySelectorAll('.ve-add-between').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        var wrap = btn.closest('.ve-insert-between');
        if (wrap) wrap.classList.toggle('open');
      });
    });

    canvas.querySelectorAll('.ve-add-item').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        var wrap = btn.closest('.ve-insert-between');
        if (wrap) wrap.classList.remove('open');
        var type = btn.getAttribute('data-type');
        var idx = parseInt(btn.getAttribute('data-index'), 10);
        if (type) pfInsertBlock(type, idx);
      });
    });

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

  function pfInsertBlock(type, index) {
    var defaults = {
      title:   { t: 'title', x: '', align: 'center', size: 'md', weight: 'bold' },
      lede:    { t: 'lede', x: '', align: 'center', size: 'md', weight: 'normal' },
      para:    { t: 'para', x: '', align: 'center', size: 'md', weight: 'normal' },
      image:   { t: 'image', src: '', w: 100, fit: 'contain', caption: '', align: 'center' },
      gallery: { t: 'gallery', imgs: [], cols: 'auto', frame: false },
      ba:      { t: 'ba', a: '', b: '', w: 100, fit: 'contain' },
      imgtext: { t: 'imgtext', src: '', eyebrow: '', heading: '', text: '', side: 'right', ratio: '4/3', stack: 'img-first' },
      stats:   { t: 'stats', items: [{ n: '', suffix: '', label: '' }] },
    };
    var def = Object.assign({}, defaults[type]);
    if (!def) return;

    var insertAt = Number.isInteger(index) ? index : veBlocks.length;
    insertAt = Math.max(0, Math.min(insertAt, veBlocks.length));

    if (type === 'title' || type === 'lede') {
      var existing = veBlocks.findIndex(function (b) { return b.t === 'title'; });
      if (type === 'title' && existing >= 0) insertAt = existing;
      if (type === 'lede' && existing >= 0) insertAt = Math.min(existing + 1, veBlocks.length);
    }

    veBlocks.splice(insertAt, 0, def);
    veSelIdx = insertAt;
    veUnsaved = true;
    pfRender();
    requestAnimationFrame(function () { pfSelectBlock(Math.max(0, veSelIdx)); });
  }

  function pfAddBlock(type) {
    pfInsertBlock(type, veBlocks.length);
  }

  function pfRemoveBlock(i) {
    var removed = veBlocks[i];
    if (!removed) return;

    var urlsToDelete = [];
    if (removed.t === 'image' && removed.src && isFirebaseStorageUrl(removed.src)) urlsToDelete.push(removed.src);
    if (removed.t === 'ba') {
      if (removed.a && isFirebaseStorageUrl(removed.a)) urlsToDelete.push(removed.a);
      if (removed.b && isFirebaseStorageUrl(removed.b)) urlsToDelete.push(removed.b);
    }

    if (urlsToDelete.length) {
      var ok = confirm('هل تريد حذف الصورة/الصور المحددة نهائياً؟\nسيتم حذفها من Firebase Storage أيضاً.');
      if (!ok) return;
      Promise.all(urlsToDelete.map(function (url) { return deleteStorageUrlIfExists(url); }));
    }

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
    if (shouldSkipRepeatedUpload(file, veBlocks[i] && veBlocks[i].src)) {
      return;
    }
    veBlocks[i].src = '⏳ جاري الرفع...';
    pfRender();
    compressImage(file, function (url) {
      var finalUrl = url || '';
      veBlocks[i].src = finalUrl;
      rememberUploadedFile(file, finalUrl);
      veUnsaved = true;
      pfRender();
    });
  }

  function pfUploadGallery(i, files) {
    var arr = Array.from(files || []).slice(0, 12);
    var idx = 0;
    function next() {
      if (idx >= arr.length) return;
      var file = arr[idx];
      if (shouldSkipRepeatedUpload(file, veBlocks[i].imgs[idx])) {
        idx++;
        next();
        return;
      }
      compressImage(file, function (url) {
        if (url) {
          veBlocks[i].imgs.push(url);
          rememberUploadedFile(file, url);
        }
        veUnsaved = true;
        idx++;
        pfRender();
        next();
      });
    }
    next();
  }

  function pfAddGalleryVideo(i) {
    var url = prompt('صق رابط الفيديو أو رابط YouTube/Vimeo/MP4:');
    if (url && url.trim()) { veBlocks[i].imgs.push(url.trim()); veUnsaved = true; pfRender(); }
  }

  function pfUploadImgBA(i, side, file) {
    if (!file) return;
    if (shouldSkipRepeatedUpload(file, veBlocks[i] && veBlocks[i][side])) {
      return;
    }
    compressImage(file, function (url) {
      var finalUrl = url || '';
      veBlocks[i][side] = finalUrl;
      rememberUploadedFile(file, finalUrl);
      veUnsaved = true;
      pfRender();
    });
  }

  /* ═══════════════════════════════════════════════════════
     SECTION 9: VISUAL EDITOR — Inline Input Handlers
     ═══════════════════════════════════════════════════════ */

  function applyVeAccentColor(value) {
    if (!value || !/^#[0-9a-f]{6}$/i.test(value)) return;
    document.documentElement.style.setProperty('--ve-accent-color', value);
    var topbar = $('ve-topbar');
    if (topbar) topbar.style.borderBottomColor = value;
  }

  function pfOnColorInput(value) {
    if (!/^#[0-9a-f]{6}$/i.test(value)) return;
    if ($('ve-color')) $('ve-color').value = value;
    $('ve-color-value').textContent = value;
    applyVeAccentColor(value);
    veUnsaved = true;
  }
  function pfOnImgSrc(i, val) { veBlocks[i].src = val; pfRender(); }
  function pfOnImgWidth(i, val) {
    veBlocks[i].w = parseInt(val, 10) || 100;
    var lbl = document.getElementById('ve-w-val-' + i);
    if (lbl) lbl.textContent = veBlocks[i].w + '%';
    veUnsaved = true;
  }
  function pfOnImgFit(i, val) { veBlocks[i].fit = val; veUnsaved = true; pfRender(); }
  function pfOnImgAlign(i, val) { veBlocks[i].align = val; veUnsaved = true; pfRender(); }
  function pfOnGalleryCols(i, val) { veBlocks[i].cols = val; pfRender(); }
  function pfOnBAInput(i, side, val) { veBlocks[i][side] = val; pfRender(); }
  function pfOnBAWidth(i, val) {
    veBlocks[i].w = parseInt(val, 10) || 100;
    var lbl = document.getElementById('ve-ba-w-val-' + i);
    if (lbl) lbl.textContent = veBlocks[i].w + '%';
    veUnsaved = true;
  }
  function pfOnBAFit(i, val) { veBlocks[i].fit = val; veUnsaved = true; pfRender(); }

  function pfUploadImgText(i, file) {
    if (!file) return;
    pfSyncBlockEditors(i);
    compressImage(file, function (url) { veBlocks[i].src = url || ''; veUnsaved = true; pfRender(); });
  }
  function pfSyncBlockEditors(i) {
    document.querySelectorAll('.ve-rt-editor[data-i="' + i + '"]').forEach(function (el) { veSyncContenteditable(el); });
  }
  function pfOnImgTextSrc(i, val) { pfSyncBlockEditors(i); veBlocks[i].src = val; veUnsaved = true; pfRender(); }
  function pfOnImgTextRatio(i, val) { pfSyncBlockEditors(i); veBlocks[i].ratio = val; veUnsaved = true; pfRender(); }
  function pfOnImgTextSide(i, val) { pfSyncBlockEditors(i); veBlocks[i].side = val; veUnsaved = true; pfRender(); }
  function pfOnImgTextStack(i, val) { pfSyncBlockEditors(i); veBlocks[i].stack = val; veUnsaved = true; pfRender(); }

  function pfAddGalleryLink(i) {
    var url = prompt('صق رابط الصورة:');
    if (url && url.trim()) { veBlocks[i].imgs.push(url.trim()); veUnsaved = true; pfRender(); }
  }

  function pfRemoveGalleryImg(i, j) {
    var target = veBlocks[i] && veBlocks[i].imgs && veBlocks[i].imgs[j];
    if (target && isFirebaseStorageUrl(target)) {
      var ok = confirm('هل تريد حذف هذه الصورة نهائياً؟\nسيتم حذفها من Firebase Storage أيضاً.');
      if (!ok) return;
      deleteStorageUrlIfExists(target).catch(function () {});
    }

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
      tools: $('ve-tools-field').value.split('·').map(function (s) { return s.trim(); }).filter(Boolean),
      color: $('ve-color').value,
      order: parseInt($('ve-order').value) || 0,
      blocks: blocks,
      // Do not restore a deleted cover from the previous Firestore document.
      coverImage: normalizeRemoteImageUrl(($('ve-cover-url').value.trim()) || (coverBlock && coverBlock.src) || ''),
      beforeImage: normalizeRemoteImageUrl(baBlock ? baBlock.a : ''),
      afterImage: normalizeRemoteImageUrl(baBlock ? baBlock.b : ''),
      // Gallery images already live in blocks; keep the legacy field only for old-format projects.
      galleryImages: (galBlock ? [] : allImgs).map(function (u) { return normalizeRemoteImageUrl(u); }).filter(Boolean),
      published: publish ? true : $('ve-published').checked,
      format: (veProject && veProject.format) || {}
    };

    if (coverBlock) data.format.coverHeight = coverBlock.h;
    if (titleBlock) { data.format.titleAlign = titleBlock.align; data.format.titleSize = titleBlock.size; data.format.titleWeight = titleBlock.weight; }
    if (ledeBlock) { data.format.descAlign = ledeBlock.align; data.format.descSize = ledeBlock.size; data.format.descWeight = ledeBlock.weight; }
    if (galBlock) data.format.galleryCols = galBlock.cols;

    var serializedData = JSON.stringify(data);
    var estimateBytes = window.TextEncoder ? new TextEncoder().encode(serializedData).length : serializedData.length;
    var estimateKB = Math.round(estimateBytes / 1024);
    if (estimateBytes > 900 * 1024) {
      statusEl.textContent = '❌ الحجم كبير جداً (' + estimateKB + 'KB)';
      statusEl.style.color = '#ef4444';
      alert('حجم البيانات الفعلي ' + estimateKB + 'KB.\nاحذف الصور القديمة أو استخدم روابط صور خارجية؛ الحد الآمن أقل من 1MB بسبب بيانات Firestore الإضافية.');
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
        if (existing.createdAt) data.createdAt = existing.createdAt;
        return db().collection('projects').doc(veProject.id).set(data)
          .then(function () {
            return deleteRemovedStorageImages(existing, data, veProject.id);
          })
          .then(done).catch(fail);
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
  window.pfInsertBlock = pfInsertBlock;
  window.pfAddBlock = pfAddBlock;
  window.pfTogglePublish = pfTogglePublish;
  window.pfDeleteProject = pfDeleteProject;
  window.pfSelectBlock = pfSelectBlock;
  window.pfRemoveBlock = pfRemoveBlock;
  window.pfMoveBlock = pfMoveBlock;
  window.pfOnImgSrc = pfOnImgSrc;
  window.pfOnImgWidth = pfOnImgWidth;
  window.pfOnImgFit = pfOnImgFit;
  window.pfOnImgAlign = pfOnImgAlign;
  window.pfOnGalleryCols = pfOnGalleryCols;
  window.pfOnBAInput = pfOnBAInput;
  window.pfOnBAWidth = pfOnBAWidth;
  window.pfOnBAFit = pfOnBAFit;
  window.pfAddGalleryLink = pfAddGalleryLink;
  window.pfRemoveGalleryImg = pfRemoveGalleryImg;
  window.pfUploadImg = pfUploadImg;
  window.pfUploadGallery = pfUploadGallery;
  window.pfUploadImgBA = pfUploadImgBA;
  window.pfOnColorInput = pfOnColorInput;
  window.pfClearCover = pfClearCover;
  window.pfUploadImgText = pfUploadImgText;
  window.pfOnImgTextSrc = pfOnImgTextSrc;
  window.pfOnImgTextRatio = pfOnImgTextRatio;
  window.pfOnImgTextSide = pfOnImgTextSide;
  window.pfOnImgTextStack = pfOnImgTextStack;
  window.pfOnStatField = pfOnStatField;
  window.pfAddStat = pfAddStat;
  window.pfRemoveStat = pfRemoveStat;
  window.veExecCmd = veExecCmd;
  window.veExecBlockType = veExecBlockType;
  window.veExecFontSize = veExecFontSize;
  window.veExecFontName = veExecFontName;
  window.veExecLink = veExecLink;
  window.veExecForeColor = veExecForeColor;
  window.veExecClearColor = veExecClearColor;
  window.veSaveSel = veSaveSel;
  window.loadProjects = loadProjects;
  window.cleanAllProjects = cleanAllProjects;

  $('ve-title-input').addEventListener('input', function () { veUnsaved = true; });

})();
