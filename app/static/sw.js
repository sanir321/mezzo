// Mezzo High-Fidelity Audio Decryption Service Worker
importScripts('./sw-decrypter.js?v=mezzo-v1');

self.addEventListener('install', (event) => {
    event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});
