(function() {
    var today = new Date().toISOString().slice(0, 10);
    var key = 'visited_' + today;
    if (localStorage.getItem(key)) return;
    try {
        if (typeof firebase === 'undefined') return;
        var app = firebase.initializeApp({
            apiKey: "AIzaSyBCP30snA8NGU5PDk6m4Vt_fvYXcxSvem8",
            authDomain: "summ3a-3fe32.firebaseapp.com",
            projectId: "summ3a-3fe32",
            storageBucket: "summ3a-3fe32.firebasestorage.app",
            messagingSenderId: "587094312862",
            appId: "1:587094312862:web:ed31e9cf4e97af846ef88f"
        }, 'tracker');
        var db = firebase.firestore(app);
        db.collection('visitors').doc(today).set({
            count: firebase.firestore.FieldValue.increment(1)
        }, { merge: true }).then(function() {
            localStorage.setItem(key, '1');
        }).catch(function(){});
    } catch(e) {}
})();