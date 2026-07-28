(function() {
    var today = new Date().toISOString().slice(0, 10);
    var key = 'visited_' + today;
    if (localStorage.getItem(key)) return;
    try {
        if (typeof firebase === 'undefined') return;
        var src = 'مباشر';
        var params = new URLSearchParams(window.location.search);
        if (params.get('utm_source')) src = params.get('utm_source');
        else if (params.get('fbclid')) src = 'فيس بوك';
        else if (params.get('igshid')) src = 'انستغرام';
        else if (document.referrer) {
            var r = document.referrer.toLowerCase();
            if (r.indexOf('facebook') !== -1 || r.indexOf('fb.') !== -1) src = 'فيس بوك';
            else if (r.indexOf('instagram') !== -1) src = 'انستغرام';
            else if (r.indexOf('google') !== -1 || r.indexOf('search') !== -1) src = 'جوجل';
            else if (r.indexOf('tiktok') !== -1) src = 'تيك توك';
            else if (r.indexOf('twitter') !== -1 || r.indexOf('x.com') !== -1) src = 'X';
            else if (r.indexOf('whatsapp') !== -1) src = 'واتساب';
            else src = 'رابط خارجي';
        }
        try {
            var app = firebase.initializeApp({
                apiKey: "AIzaSyBCP30snA8NGU5PDk6m4Vt_fvYXcxSvem8",
                authDomain: "summ3a-3fe32.firebaseapp.com",
                projectId: "summ3a-3fe32",
                storageBucket: "summ3a-3fe32.firebasestorage.app",
                messagingSenderId: "587094312862",
                appId: "1:587094312862:web:ed31e9cf4e97af846ef88f"
            }, 'tracker');
        } catch(e2) {
            // App already exists, use it
            app = firebase.app('tracker');
        }
        var db = firebase.firestore(app);
        var ref = db.collection('visitor_sources').doc(today);
        ref.get().then(function(doc) {
            var data = doc.data() || {};
            var count = (data.count || 0) + 1;
            var sources = data.sources || {};
            sources[src] = (sources[src] || 0) + 1;
            return ref.set({ count: count, sources: sources });
        }).then(function() {
            localStorage.setItem(key, '1');
        }).catch(function(){});
    } catch(e) {}
})();