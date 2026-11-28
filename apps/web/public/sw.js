/* Service worker minimal Maktabah Al-'Ilmiyyah.
 *
 * Tujuan satu-satunya: memenuhi kriteria pemasangan PWA (aplikasi dapat
 * diunduh/dipasang ke layar utama). Aplikasi ini dinamis — halaman dan API
 * TIDAK PERNAH di-cache di sini; semua permintaan diteruskan ke jaringan
 * apa adanya (network passthrough) agar isi selalu segar.
 */

// Langsung aktif menggantikan service worker lama begitu terpasang.
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // Bersihkan cache versi lama bila pernah ada — mulai sekarang tidak
      // ada cache sama sekali dari service worker ini.
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
      await self.clients.claim();
    })()
  );
});

// Passthrough total: sengaja TIDAK memanggil event.respondWith(), jadi
// peramban mengambil setiap permintaan langsung dari jaringan seperti biasa.
self.addEventListener("fetch", () => {});
