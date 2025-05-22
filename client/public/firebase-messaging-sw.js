// Import the Firebase app and messaging services
importScripts('https://www.gstatic.com/firebasejs/9.22.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.1/firebase-messaging-compat.js');

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBKfx1Vbjaxe47BELhvU29tfmwsKSzv4Ec",
    authDomain: "trade-sentinel.firebaseapp.com",
    projectId: "trade-sentinel",
    storageBucket: "trade-sentinel.appspot.com",
    messagingSenderId: "1019804650909",
    appId: "1:1019804650909:web:907c5358fd2a9b207a3374",
    measurementId: "G-6M6YY17CEM"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Retrieve an instance of Firebase Messaging so that it can handle background
// messages.
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    // Log the full payload to inspect its structure, especially messageId
    console.log('[firebase-messaging-sw.js] Received background message. Payload:', JSON.stringify(payload));

    // Attempt to get a message ID, adjust if the path is different for v9 compat
    const messageId = payload.fcmMessageId || payload.messageId || (payload.data && payload.data.messageId) || 'N/A';
    console.log(`[firebase-messaging-sw.js] Processing messageId: ${messageId}`);

    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: '/sentinel_logo.png' // Ensure you have this icon in your public folder
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});

// If you want to handle notification clicks, you can add a listener for it:
self.addEventListener('notificationclick', function (event) {
    console.log('[firebase-messaging-sw.js] Notification click Received.', event.notification);
    event.notification.close();
    // Add custom logic here e.g. open a specific URL
    // clients.openWindow('/');
}); 