// // /* ============================================================
// //    sw.js — Cinémathèque Service Worker (Local-Friendly)

// //    A Service Worker runs in the background, separate from the
// //    main page. It can intercept every network request the page
// //    makes and decide whether to serve a cached version or fetch
// //    from the network.

// //    This SW does three things:
// //    1. install  — caches the app's core files on first load
// //    2. activate — cleans up old caches from previous versions
// //    3. fetch    — serves cached responses or falls back to network
// // ============================================================
// // SERVICE WORKER - sw.js
// // Handles offline caching and saving movies
// // ============================================================ */

// const CACHE_VERSION = "v2";
// const CACHE_NAME = `cinematheque-cache-${CACHE_VERSION}`;
// const IMAGE_CACHE_NAME = `movie-posters-${CACHE_VERSION}`;
// const OFFLINE_URL = "./offline.html";

// // Files cache on install
// const STATIC_ASSETS = [
//   "/",
//   "./indexs.html",
//   "./mains.js",
//   "./mains.css",
//   "./offline.html",
// ];

// // ============================================================
// // 1. INSTALL EVENT - Cache static assets
// // ============================================================

// self.addEventListener("install", (event) => {
//   console.log("[Service Worker] Installing...");

//   event.waitUntil(
//     cache
//       .open(CACHE_NAME)
//       .then((cache) => {
//         console.log("[Service Worker] Caching static assets");
//         return cache.addAll(STATIC_ASSETS);
//       })
//       .then(() => {
//         console.log("[Service Worker] Installation complete");
//         return self.skipWaiting(); // Activate worker immediately
//       })
//       .catch((error) => {
//         console.log("[Service Worker] Installation failed:", error);
//       }),
//   );
// });

// // ============================================================
// // 2. ACTIVATE EVENT - Clean up old caches
// // ============================================================

// self.addEventListener("activate", (event) => {
//   console.log("[Service Worker] Activating...");

//   event.waitUntil(
//     caches
//       .keys()
//       .then((cacheNames) => {
//         // Delete old caches (not matching current version)
//         const deletePromises = cacheNames.map((cacheName) => {
//           if (cacheName !== CACHE_NAME && cacheName !== IMAGE_CACHE_NAME) {
//             console.log("[Service Worker] Deleting old caches:", cacheName);
//             return caches.delete(cacheName);
//           }
//         });
//         return Promise.all(deletePromises);
//       })
//       .then(() => {
//         console.log("[Service Worker] Claiming clients");
//         return self.clients.claim(); //Take control of all pages
//       }),
//   );
// });

// // ============================================================
// // 3. FETCH EVENT - Handle all network requests
// // ============================================================

// self.addEventListener("fetch", (event) => {
//   const request = event.request;
//   const url = new URL(request.url);
// });

// // ============================================================
// // 3a. Handle API requests (TMDB API)
// // ============================================================

// if (url.hostname === "api.themoviedb.org") {
//   event.respondWith(handleApiRequest(request));
// }

// // ==============================================================
// // 3b. Handle image requests (TMDB posters)
// // ==============================================================

// if (url.hostname === "image.tmdb.org") {
//   event.respondWith(handleImageRequest(request));
//   return; // Exit early to avoid falling through to default fetch
// }

// // ==============================================================
// // 3c. Handle page navigation (HTML requests)
// // ==============================================================

// if (request.mode === "navigate") {
//   event.requestWith(handleImageRequest(request));
//   return; // Exit early to avoid falling through to default fetch
// }

// // ============================================================
// // 3d. Handle all other requests (CSS, JS, etc.)
// // ============================================================

// event.respondWith(StaticAssestRequest(request));

// // ============================================================
// // 4. REQUEST HANDLERS
// // ============================================================

// // 4a. Handle API Requests (Network First)
// async function handleApiRequest(request) {
//   try {
//     // Try network first
//     const response = await fetch(request);

//     // Cache successful API response of offline use
//     if (response.ok) {
//       const cache = await caches.open(CACHE_NAME);
//       cache.put(request, response.clone());
//     }
//     return response;
//   } catch (error) {
//     // If network fails, try cache
//     const cachedResponse = await caches.match(request);
//     if (cachedResponse) {
//       console.log("[Service Worker] Serving API from cache:", request.url);
//       return cachedResponse;
//     }
//     // If nothing in cache, return error
//     console.error("[Service Worker] Serving API request failed:", request.url);
//     return new Response(
//       JSON.stringify({
//         error: "Your offline. please connect to the internet.",
//       }),
//       { status: 503, headers: { "Content-Type": "application/json" } },
//     );
//   }
// }

// // 4b. Handle Image Request (Cache First)
// async function handleImageRequest(request) {
//   try {
//     // Try cache first
//     const cache = await cache.open(IMAGE_CACHE_NAME);
//     const cachedResponse = await cache.match(request);

//     if (cachedResponse) {
//       console.log("[service Worker] Serving image from cache:", request.url);
//       return cachedResponse;
//     }

//     // If not in cache, fetch from network
//     const response = await fetch(request);

//     // Cache the image for a future offline use
//     if (response.ok) {
//       cache.put(request, response.clone());
//     }
//     return response;
//   } catch (error) {
//     console.error("[Service Worker] Image request failed:", request.url);
//     return new Response("Image not available", {
//       status: 404,
//       headers: { "Content-Type": "text/plain" },
//     });
//   }
// }

// //4c Handle Navigation Request (Network First, Fallback to Offline Page)
// async function handleNavigationRequest(request) {
//   try {
//     // Try network first
//     const response = await fetch(request);
//     return response;
//   } catch (error) {
//     console.log("[Service Worker] Offline - serving offline page");

//     // Check if offline page exists in cache
//     const offlineResponse = await caches.match(OFFLINE_PAGE);
//     if (offlineResponse) {
//       return offlineResponse;
//     }

//     // If offline page not cached, try main page
//     const mainPage = await caches.match("/index.html");
//     if (mainPage) {
//       return mainPage;
//     }

//     // Ultimate fallback
//     return new Response(
//       "<h1>You are offline</h1><p>Please connect to the internet.</p>",
//       { status: 503, headers: { "Content-Type": "text/html" } },
//     );
//   }
// }

// // 4d. Handle Static Assets (Cache First)
// async function handleStaticAssetRequest(request) {
//   try {
//     // Try cache first
//     const cachedResponse = await caches.match(request);
//     if (cachedResponse) {
//       return cachedResponse;
//     }

//     // If not in cache, fetch from network
//     const response = await fetch(request);

//     // Cache the asset
//     if (response.ok) {
//       const cache = await caches.open(CACHE_NAME);
//       cache.put(request, response.clone());
//     }

//     return response;
//   } catch (error) {
//     console.error("[Service Worker] Static asset request failed:", request.url);
//     return new Response("Asset not available offline", {
//       status: 404,
//       headers: { "Content-Type": "text/plain" },
//     });
//   }
// }

// // ============================================================
// // 5. MESSAGE EVENT - Handle messages from the main app
// // ============================================================
// self.addEventListener("message", (event) => {
//   const data = event.data;

//   switch (data.action) {
//     case "SAVE_MOVIE":
//       saveMovieForOffline(data.movie)
//         .then(() => {
//           event.ports[0].postMessage({ success: true, movieId: data.movie.id });
//         })
//         .catch((error) => {
//           event.ports[0].postMessage({ success: false, error: error.message });
//         });
//       break;

//     case "GET_SAVED_MOVIES":
//       getSavedMovies()
//         .then((movies) => {
//           event.ports[0].postMessage({ success: true, movies });
//         })
//         .catch((error) => {
//           event.ports[0].postMessage({ success: false, error: error.message });
//         });
//       break;

//     case "DELETE_MOVIE":
//       deleteSavedMovie(data.movieId)
//         .then(() => {
//           event.ports[0].postMessage({ success: true, movieId: data.movieId });
//         })
//         .catch((error) => {
//           event.ports[0].postMessage({ success: false, error: error.message });
//         });
//       break;

//     case "CHECK_SAVED":
//       isMovieSaved(data.movieId)
//         .then((isSaved) => {
//           event.ports[0].postMessage({ success: true, isSaved });
//         })
//         .catch((error) => {
//           event.ports[0].postMessage({ success: false, error: error.message });
//         });
//       break;

//     default:
//       console.log("[Service Worker] Unknown action:", data.action);
//   }
// });

// // ============================================================
// // 6. DATABASE FUNCTIONS (IndexedDB operations)
// // ============================================================

// const DB_NAME = "MovieApp";
// const DB_VERSION = 1;
// const STORE_NAME = "savedMovies";

// function openDatabase() {
//   return new Promise((resolve, reject) => {
//     const request = indexedDB.open(DB_NAME, DB_VERSION);

//     request.onupgradeneeded = (event) => {
//       const db = event.target.result;
//       if (!db.objectStoreNames.contains(STORE_NAME)) {
//         const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
//         store.createIndex("title", "title", { unique: false });
//         store.createIndex("rating", "rating", { unique: false });
//         store.createIndex("savedAt", "savedAt", { unique: false });
//       }
//     };

//     request.onsuccess = () => resolve(request.result);
//     request.onerror = () => reject(request.error);
//   });
// }

// async function saveMovieForOffline(movie) {
//   try {
//     // Save to IndexedDB
//     const db = await openDatabase();
//     const transaction = db.transaction([STORE_NAME], "readwrite");
//     const store = transaction.objectStore(STORE_NAME);

//     await store.put({
//       id: movie.id,
//       title: movie.title,
//       rating: movie.vote_average,
//       year: movie.release_date ? movie.release_date.split("-")[0] : "N/A",
//       overview: movie.overview,
//       poster_path: movie.poster_path,
//       savedAt: new Date().toISOString(),
//     });
//     // Cache the poster image
//     if (movie.poster_path) {
//       const posterUrl = `https://image.tmdb.org/t/p/w500${movie.poster_path}`;
//       const cache = await caches.open(IMAGE_CACHE_NAME);
//       await cache.add(posterUrl);
//     }

//     console.log(`[Service Worker] Saved "${movie.title}" for offline`);
//     return true;
//   } catch (error) {
//     console.error("[Service Worker] Error saving movie:", error);
//     throw error;
//   }
// }
// async function getSavedMovies() {
//   try {
//     const db = await openDatabase();
//     const transaction = db.transaction([STORE_NAME], "readonly");
//     const store = transaction.objectStore(STORE_NAME);
//     const allMovies = await store.getAll();

//     // Add poster blob URLs for each movie
//     for (const movie of allMovies) {
//       if (movie.poster_path) {
//         const posterUrl = `https://image.tmdb.org/t/p/w500${movie.poster_path}`;
//         const cache = await caches.open(IMAGE_CACHE_NAME);
//         const cachedResponse = await cache.match(posterUrl);

//         if (cachedResponse) {
//           const blob = await cachedResponse.blob();
//           movie.posterBlobUrl = URL.createObjectURL(blob);
//         }
//       }
//     }
//     return allMovies;
//   } catch (error) {
//     console.error("[Service Worker] Error getting saved movies:", error);
//     throw error;
//   }
// }


// async function deleteSavedMovie(movieId) {
//   try {
//     const db = await openDatabase();
//     const transaction = db.transaction([STORE_NAME], "readwrite");
//     const store = transaction.objectStore(STORE_NAME);
//     await store.delete(movieId);
//     console.log(`[Service Worker] Deleted movie: ${movieId}`);
//     return true;
//   } catch (error) {
//     console.error("[Service Worker] Error deleting movie:", error);
//     throw error;
//   }
// }
// async function isMovieSaved(movieId) {
//   try {
//     const db = await openDatabase();
//     const transaction = db.transaction([STORE_NAME], "readonly");
//     const store = transaction.objectStore(STORE_NAME);
//     const movie = await store.get(movieId);
//     return !!movie;
//   } catch (error) {
//     console.error("[Service Worker] Error checking saved status:", error);
//     return false;
//   }
// }




// ============================================================
// SERVICE WORKER - sw.js
// Handles offline caching and saving movies
// ============================================================

const CACHE_VERSION = 'v2';
const CACHE_NAME = `cinematheque-${CACHE_VERSION}`;
const IMAGE_CACHE_NAME = `movie-posters-${CACHE_VERSION}`;
const OFFLINE_PAGE = './offline.html';

// Files to cache on install
const STATIC_ASSETS = [
  '/',
  './index.html',
  './main.css',
  './main.js',
  './offline.html'
];

// ============================================================
// 1. INSTALL EVENT - Cache static assets
// ============================================================
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[Service Worker] Installation complete');
        return self.skipWaiting(); // Activate immediately
      })
      .catch((error) => {
        console.error('[Service Worker] Installation failed:', error);
      })
  );
});

// ============================================================
// 2. ACTIVATE EVENT - Clean up old caches
// ============================================================
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        // Delete old caches (not matching current version)
        const deletePromises = cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== IMAGE_CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        });
        return Promise.all(deletePromises);
      })
      .then(() => {
        console.log('[Service Worker] Claiming clients');
        return self.clients.claim(); // Take control of all pages
      })
  );
});

// ============================================================
// 3. FETCH EVENT - Handle all network requests
// ============================================================
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Browser extensions and non-GET requests are not part of this app's
  // offline cache. Cache Storage only supports http(s) GET requests, so
  // leave these requests for the browser to handle normally.
  if (
    request.method !== 'GET' ||
    (url.protocol !== 'http:' && url.protocol !== 'https:')
  ) {
    return;
  }
  
  // ============================================================
  // 3a. Handle API requests (TMDB API)
  // ============================================================
  if (url.hostname === 'api.themoviedb.org') {
    event.respondWith(handleApiRequest(request));
    return;
  }
  
  // ============================================================
  // 3b. Handle image requests (TMDB posters)
  // ============================================================
  if (url.hostname === 'image.tmdb.org') {
    event.respondWith(handleImageRequest(request));
    return;
  }
  
  // ============================================================
  // 3c. Handle page navigation (HTML requests)
  // ============================================================
  if (request.mode === 'navigate') {
    event.respondWith(handleNavigationRequest(request));
    return;
  }
  
  // ============================================================
  // 3d. Handle all other requests (CSS, JS, etc.)
  // ============================================================
  event.respondWith(handleStaticAssetRequest(request));
});

// ============================================================
// 4. REQUEST HANDLERS
// ============================================================

// 4a. Handle API Requests (Network First)
async function handleApiRequest(request) {
  try {
    // Try network first
    const response = await fetch(request);
    
    // Cache successful API responses for offline use
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      await putInCache(cache, request, response.clone());
    }
    
    return response;
  } catch (error) {
    // If network fails, try cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      console.log('[Service Worker] Serving API from cache:', request.url);
      return cachedResponse;
    }
    
    // If nothing in cache, return error
    console.error('[Service Worker] API request failed:', request.url);
    return new Response(
      JSON.stringify({ error: 'You are offline. Please connect to the internet.' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// 4b. Handle Image Requests (Cache First)
async function handleImageRequest(request) {
  try {
    // Try cache first
    const cache = await caches.open(IMAGE_CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      console.log('[Service Worker] Serving image from cache:', request.url);
      return cachedResponse;
    }
    
    // If not in cache, fetch from network
    const response = await fetch(request);
    
    // Cache the image for future offline use
    if (response.ok) {
      await putInCache(cache, request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.error('[Service Worker] Image request failed:', request.url);
    // Return a placeholder image if offline
    return new Response(
      'Image not available offline',
      { status: 404, headers: { 'Content-Type': 'text/plain' } }
    );
  }
}

// 4c. Handle Navigation Requests (Network First, Fallback to Offline Page)
async function handleNavigationRequest(request) {
  try {
    // Try network first
    const response = await fetch(request);
    return response;
  } catch (error) {
    console.log("[Service Worker] Offline - serving offline page");

    // Serve offline.html from cache
    const offlineResponse = await caches.match("./offline.html");
    if (offlineResponse) {
      return offlineResponse;
    }

    // Fallback to cached index.html
    const mainPage = await caches.match("./index.html");
    if (mainPage) {
      return mainPage;
    }

    // Ultimate fallback
    return new Response(
      "<h1>You are offline</h1><p>Please connect to the internet.</p>",
      { status: 503, headers: { "Content-Type": "text/html" } },
    );
  }
}

// 4d. Handle Static Assets (Cache First)
async function handleStaticAssetRequest(request) {
  try {
    // Try cache first
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // If not in cache, fetch from network
    const response = await fetch(request);
    
    // Cache the asset
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      await putInCache(cache, request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.error('[Service Worker] Static asset request failed:', request.url);
    return new Response(
      'Asset not available offline',
      { status: 404, headers: { 'Content-Type': 'text/plain' } }
    );
  }
}

// A failed cache write should never turn a successful network response into
// an app error. This also guards against unsupported request schemes.
async function putInCache(cache, request, response) {
  try {
    await cache.put(request, response);
  } catch (error) {
    console.warn('[Service Worker] Skipped cache write:', request.url, error);
  }
}

// ============================================================
// 5. MESSAGE EVENT - Handle messages from the main app
// ============================================================
self.addEventListener('message', (event) => {
  // Keep the worker alive until the asynchronous reply is sent.
  event.waitUntil(handleMessage(event));
});

async function handleMessage(event) {
  const data = event.data;
  const replyPort = event.ports[0];

  if (!data || !replyPort) {
    return;
  }

  try {
    switch (data.action) {
      case 'SAVE_MOVIE':
        await saveMovieForOffline(data.movie);
        replyPort.postMessage({ success: true, movieId: data.movie.id });
        break;
      case 'GET_SAVED_MOVIES':
        replyPort.postMessage({ success: true, movies: await getSavedMovies() });
        break;
      case 'DELETE_MOVIE':
        await deleteSavedMovie(data.movieId);
        replyPort.postMessage({ success: true, movieId: data.movieId });
        break;
      case 'CHECK_SAVED':
        replyPort.postMessage({ success: true, isSaved: await isMovieSaved(data.movieId) });
        break;
      default:
        console.log('[Service Worker] Unknown action:', data.action);
    }
  } catch (error) {
    replyPort.postMessage({ success: false, error: error.message });
  }
}

// ============================================================
// 6. DATABASE FUNCTIONS (IndexedDB operations)
// ============================================================

const DB_NAME = 'MovieApp';
// This must match the version used by the direct (non-service-worker)
// fallback in main.js. IndexedDB cannot be opened at a lower version.
const DB_VERSION = 2;
const STORE_NAME = 'savedMovies';

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('title', 'title', { unique: false });
        store.createIndex('rating', 'rating', { unique: false });
        store.createIndex('savedAt', 'savedAt', { unique: false });
      }
    };
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function saveMovieForOffline(movie) {
  // ============================================================
  // STEP 1: Save movie data to IndexedDB
  // ============================================================
  try {
    const db = await openDatabase();
    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);

    await store.put({
      id: movie.id,
      title: movie.title,
      rating: movie.vote_average,
      year: movie.release_date ? movie.release_date.split("-")[0] : "N/A",
      overview: movie.overview,
      poster_path: movie.poster_path,
      savedAt: new Date().toISOString(),
    });

    console.log(`[Service Worker] Saved "${movie.title}" to IndexedDB`);
  } catch (error) {
    console.error("[Service Worker] Failed to write to IndexedDB:", error);
    throw error;
  }

  // ============================================================
  // STEP 2: Cache the poster image (using no-cors to bypass CORS)
  // ============================================================
  if (movie.poster_path) {
    try {
      const posterUrl = `https://image.tmdb.org/t/p/w500${movie.poster_path}`;
      const cache = await caches.open(IMAGE_CACHE_NAME);

      // Check if already cached
      const existing = await cache.match(posterUrl);
      if (existing) {
        console.log(
          `[Service Worker] Poster already cached for "${movie.title}"`,
        );
        return true;
      }

      // Fetch with no-cors mode to bypass CORS restrictions
      const response = await fetch(posterUrl, { mode: "no-cors" });

      // no-cors responses are "opaque" - can't be read but CAN be cached
      await cache.put(posterUrl, response);

      console.log(`[Service Worker] Cached poster for "${movie.title}"`);
    } catch (error) {
      console.warn(
        `[Service Worker] Could not cache poster for "${movie.title}":`,
        error.message,
      );
    }
  }

  return true;
}

async function getSavedMovies() {
  try {
    const db = await openDatabase();
    const transaction = db.transaction([STORE_NAME], "readonly");
    const store = transaction.objectStore(STORE_NAME);

    // Wrap the IDBRequest in a Promise
    const allMovies = await new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    // For each movie, set the poster URL
    for (const movie of allMovies) {
      if (movie.poster_path) {
        movie.posterUrl = `https://image.tmdb.org/t/p/w500${movie.poster_path}`;
      }
    }

    return allMovies;
  } catch (error) {
    console.error("[Service Worker] Error getting saved movies:", error);
    throw error;
  }
}

async function deleteSavedMovie(movieId) {
  try {
    const db = await openDatabase();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    await store.delete(movieId);
    console.log(`[Service Worker] Deleted movie: ${movieId}`);
    return true;
  } catch (error) {
    console.error('[Service Worker] Error deleting movie:', error);
    throw error;
  }
}

async function isMovieSaved(movieId) {
  try {
    const db = await openDatabase();
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const movie = await store.get(movieId);
    return !!movie;
  } catch (error) {
    console.error('[Service Worker] Error checking saved status:', error);
    return false;
  }
}
