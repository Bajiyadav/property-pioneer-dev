/* global importScripts, firebase */
// Scripts for firebase and firebase messaging
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");

// Initialize the Firebase app in the service worker
// Replace these with your actual config from the Firebase Console
firebase.initializeApp({
  apiKey: "AIzaSyCbl8a2JTDVQ6QUFdAIraK6eTc5ot2P4NM",
  authDomain: "seedha-properties.firebaseapp.com",
  projectId: "seedha-properties",
  storageBucket: "seedha-properties.firebasestorage.app",
  messagingSenderId: "233905431391",
  appId: "1:233905431391:web:b2055cf0a3bf0c0dce8cea",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log("[firebase-messaging-sw.js] Received background message ", payload);

  const notificationTitle = payload.notification?.title || "New Notification";
  const notificationOptions = {
    body: payload.notification?.body,
    icon: "/favicon.ico",
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
