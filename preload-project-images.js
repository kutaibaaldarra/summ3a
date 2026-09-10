(function () {
  if (window.__projectImagesPreloaded) return;
  window.__projectImagesPreloaded = true;
  var runStarted = false;

  var CFG = {
    apiKey: "AIzaSyBCP30snA8NGU5PDk6m4Vt_fvYXcxSvem8",
    authDomain: "summ3a-3fe32.firebaseapp.com",
    projectId: "summ3a-3fe32",
    storageBucket: "summ3a-3fe32.firebasestorage.app",
    messagingSenderId: "587094312862",
    appId: "1:587094312862:web:ed31e9cf4e97af846ef88f"
  };

  function optimizeImageUrl(url) {
    if (!url || typeof url !== 'string') return '';
    var value = url.trim();
    if (!value) return '';
    try {
      var parsed = new URL(value);
      if (parsed.hostname.includes('1drv.ms') || parsed.hostname.includes('onedrive.live.com')) {
        if (!parsed.searchParams.has('download')) parsed.searchParams.set('download', '1');
        var requestedWidth = Number.parseInt(parsed.searchParams.get('width'), 10);
        var requestedHeight = Number.parseInt(parsed.searchParams.get('height'), 10);
        var maxWidth = 1400;
        if (requestedWidth > maxWidth) {
          var ratio = requestedHeight > 0 ? requestedHeight / requestedWidth : 1;
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

  function collect(d) {
    var urls = [];
    var seen = {};
    function push(u) {
      var o = optimizeImageUrl(u);
      if (o && !seen[o]) { seen[o] = 1; urls.push(o); }
    }
    push(d.coverImage || d.cover || '');
    push(d.beforeImage || '');
    push(d.afterImage || '');
    (Array.isArray(d.galleryImages) ? d.galleryImages : (Array.isArray(d.gallery) ? d.gallery : [])).forEach(push);
    (Array.isArray(d.blocks) ? d.blocks : []).forEach(function (b) {
      if (!b) return;
      push(b.src);
      push(b.a);
      push(b.b);
      if (Array.isArray(b.imgs)) b.imgs.forEach(push);
    });
    return urls;
  }

  function warm(urls) {
    urls.slice(0, 6).forEach(function (url) {
      var img = new Image();
      img.decoding = 'async';
      img.fetchPriority = 'low';
      img.src = url;
    });
  }

  function run() {
    if (runStarted) return;
    runStarted = true;
    if (typeof firebase === 'undefined' || !firebase.firestore) return;
    var db;
    try {
      db = firebase.firestore();
    } catch (e) {
      if (firebase.apps && firebase.apps.length) db = firebase.firestore(firebase.apps[0]);
      else { try { firebase.initializeApp(CFG); db = firebase.firestore(); } catch (e2) { return; } }
    }
    db.collection('projects').get()
      .then(function (snap) {
        var urls = [];
        snap.docs.forEach(function (doc) { urls = urls.concat(collect(doc.data() || {})); });
        warm(urls);
      })
      .catch(function () {});
  }

  function scheduleWarmup() {
    if (window.requestIdleCallback) {
      window.requestIdleCallback(run, { timeout: 3000 });
    } else {
      window.setTimeout(run, 1200);
    }
  }

  if (document.readyState === 'complete') {
    scheduleWarmup();
  } else {
    window.addEventListener('load', scheduleWarmup, { once: true });
  }
})();
