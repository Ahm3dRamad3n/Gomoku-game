const CACHE_NAME = 'Gomoku-cache-v1'; 
const urlsToCache = [
  './',             
  './Gomoku.html',   
  './manifest.json', 
  './icons/icon-192x192.png', 
  './icons/icon-512x512.png'
];

// حدث التثبيت: يتم تشغيله عند تثبيت الـ Service Worker لأول مرة
self.addEventListener('install', event => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Caching app shell');
        // إضافة جميع الملفات المحددة إلى ذاكرة التخزين المؤقت
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting()) // تفعيل الـ Service Worker الجديد فوراً
      .catch(error => {
          console.error('Service Worker: Failed to cache app shell:', error);
      })
  );
});

// حدث التفعيل: يتم تشغيله عند تفعيل الـ Service Worker (بعد التثبيت أو التحديث)
self.addEventListener('activate', event => {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        // حذف أي ذاكرة تخزين مؤقت قديمة غير مطابقة للاسم الحالي
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log('Service Worker: Clearing old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim()) // التحكم في الصفحات المفتوحة فوراً
  );
});

// حدث الجلب (Fetch): يتم تشغيله عند قيام الصفحة بطلب أي مورد (HTML, CSS, JS, صور, ...)
self.addEventListener('fetch', event => {
  console.log('Service Worker: Fetching', event.request.url);
  event.respondWith(
    // محاولة إيجاد الطلب في ذاكرة التخزين المؤقت أولاً
    caches.match(event.request)
      .then(response => {
        // إذا وجد في الـ Cache، قم بإرجاعه
        if (response) {
          return response;
        }
        // إذا لم يوجد، قم بجلبه من الشبكة
        return fetch(event.request).then(
          networkResponse => {
            // (اختياري) يمكنك تخزين الاستجابة الجديدة في الـ Cache هنا إذا أردت تحديثها
            // لكن القالب الأساسي يركز على خدمة الملفات المخزنة أثناء التثبيت
            return networkResponse;
          }
        ).catch(error => {
            console.error('Service Worker: Fetch failed:', error);
            // يمكنك هنا إرجاع صفحة خطأ مخصصة للعمل دون اتصال إذا فشل الجلب
        });
      })
  );
});
