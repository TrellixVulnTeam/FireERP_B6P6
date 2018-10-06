self.importScripts("https://www.gstatic.com/firebasejs/4.6.1/firebase.js");

firebase.initializeApp({
    apiKey: "AIzaSyBcYwKtcFx0pO7UUEUsF94Y0K-x8sn8WDE",
    authDomain: "onsize-4daf9.firebaseapp.com",
    databaseURL: "https://onsize-4daf9.firebaseio.com",
    storageBucket: "onsize-4daf9.appspot.com",
    messagingSenderId: "52544949802"
});

var admin = firebase;

self.addEventListener('message', function(e) {
	if(/^\/caixa\//.test(e.data)){
		self.postMessage('Worker atuando em /caixa/');
	}else{
		self.postMessage('Desconhecido'+e.data);
	}
}, false);