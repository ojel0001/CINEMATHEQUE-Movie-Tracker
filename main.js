
// ============================================================
// CINÉMATHÈQUE - MAIN JAVASCRIPT
// ============================================================

const API_KEY = "7207080bb3daaef4e5521be3dca54876";
const imageBaseUrl = "https://image.tmdb.org/t/p/w500";

const searchBtn = document.getElementById("searchBtn");
const keywordInput = document.getElementById("keyword");
const sortSelect = document.getElementById("sortList");
const displayContainer = document.getElementById("displayContainer");
const resultsInfo = document.getElementById("resultsInfo");
const resultsText = document.getElementById("resultsText");

let lastSearchResults = null;
let lastKeyword = "";
let lastViewState = "trending"; // "trending", "search", or "saved"

// ============================================================
// SERVICE WORKER REGISTRATION
// ============================================================

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("./sw.js")
      .then((registration) => {
        console.log("Service Worker registered:", registration.scope);
      })
      .catch((error) => {
        console.log("Service Worker registration failed:", error);
      });
  });
}

// ============================================================
// INITIALIZATION
// ============================================================

window.addEventListener("DOMContentLoaded", () => {
  const searchContainer = document.querySelector(".search-container");
  if (searchContainer && resultsInfo) {
    searchContainer.insertAdjacentElement("afterend", resultsInfo);
  }

  fetchTrendingMovies();
});

// ============================================================
// FETCH TRENDING MOVIES
// ============================================================

async function fetchTrendingMovies() {
  displayContainer.innerHTML = "<p>Loading trending movies...</p>";
  resultsText.textContent = "Discover New Movies";
  lastViewState = "trending";

  try {
    const response = await fetch(
      `https://api.themoviedb.org/3/movie/now_playing?api_key=${API_KEY}&language=en-US&page=1`,
    );

    if (!response.ok) {
      throw new Error("Failed to fetch trending movies");
    }

    const data = await response.json();
    const trendingMovies = data.results.slice(0, 12);

    displayTrendingMovies(trendingMovies);
  } catch (error) {
    console.error("Error fetching trending movies:", error);
    displayContainer.innerHTML =
      "<p>Error loading trending movies. Please try searching for movies instead.</p>";
  }
}

// ============================================================
// DISPLAY TRENDING MOVIES (no save button)
// ============================================================

function displayTrendingMovies(movies) {
  displayContainer.innerHTML = "";

  const moviesGrid = document.createElement("div");
  moviesGrid.classList.add("movies-grid");

  movies.forEach((movie) => {
    const movieCard = document.createElement("div");
    movieCard.classList.add("movie-card");

    const imageUrl = movie.poster_path
      ? `${imageBaseUrl}${movie.poster_path}`
      : "";

    movieCard.innerHTML = `
      <div class="movie-poster">
        <img src="${imageUrl}" alt="${escapeHtml(movie.title)}">
        <div class="movie-poster-overlay"></div>
      </div>
      
      <div class="movie-info">
        <h3 class="movie-title">${escapeHtml(movie.title)}</h3>
        
        <div class="movie-meta">
          <span>${movie.release_date ? movie.release_date.split("-")[0] : "N/A"}</span>
          
          <div class="movie-rating">
            <span class="star">★</span>
            <span>${movie.vote_average ? movie.vote_average.toFixed(1) : "N/A"}</span>
          </div>
        </div>
      </div>
    `;

    movieCard.addEventListener("click", () => {
      getDetails(movie.id);
    });

    moviesGrid.appendChild(movieCard);
  });

  displayContainer.appendChild(moviesGrid);
}

// ============================================================
// SORT SELECT LISTENER
// ============================================================

sortSelect.addEventListener("change", () => {
  if (lastSearchResults && lastSearchResults.length > 0) {
    const sortedResults = sortMovies(lastSearchResults, sortSelect.value);
    displayMovies(sortedResults);
    resultsText.textContent = "Search Results";
    lastViewState = "search";
  }
});

// ============================================================
// SEARCH BUTTON
// ============================================================

searchBtn.addEventListener("click", () => {
  const keyword = keywordInput.value.trim();

  if (keyword === "") {
    displayContainer.innerHTML = "<p>Please enter a movie name.</p>";
    resultsText.textContent = "Discover New Movies";
    return;
  }

  lastKeyword = keyword;
  fetchMovies(keyword);
});

// ============================================================
// SORT MOVIES FUNCTION
// ============================================================

function sortMovies(movies, sortType) {
  const sorted = [...movies];

  switch (sortType) {
    case "popularity":
      return sorted.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));

    case "release-date":
      return sorted.sort((a, b) => {
        const dateA = a.release_date ? new Date(a.release_date) : new Date(0);
        const dateB = b.release_date ? new Date(b.release_date) : new Date(0);
        return dateB - dateA;
      });

    case "vote":
      return sorted.sort(
        (a, b) => (b.vote_average || 0) - (a.vote_average || 0),
      );

    default:
      return sorted;
  }
}

// ============================================================
// FETCH MOVIES (SEARCH)
// ============================================================

async function fetchMovies(keyword) {
  displayContainer.innerHTML = "<p>Loading...</p>";
  resultsText.textContent = "Search Results";
  lastViewState = "search";

  const url = `https://api.themoviedb.org/3/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(keyword)}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error("Failed to fetch movies");
    }

    const data = await response.json();
    lastSearchResults = data.results;

    if (data.results.length === 0) {
      displayContainer.innerHTML =
        "<p>No movies found. Try a different search term.</p>";
      return;
    }

    const sortedResults = sortMovies(lastSearchResults, sortSelect.value);
    displayMovies(sortedResults);
  } catch (error) {
    console.log(error);
    displayContainer.innerHTML = "<p>Error loading movies.</p>";
    resultsText.textContent = "Discover New Movies";
  }
}

// ============================================================
// DISPLAY MOVIES (search results + saved movies - no save button)
// ============================================================

function displayMovies(movies) {
  if (!movies || movies.length === 0) {
    displayContainer.innerHTML = "<p>No movies found.</p>";
    return;
  }

  displayContainer.innerHTML = "";

  const moviesGrid = document.createElement("div");
  moviesGrid.classList.add("movies-grid");

  movies.forEach((movie) => {
    const movieCard = document.createElement("div");
    movieCard.classList.add("movie-card");

    // const imageUrl = movie.posterBlobUrl
    //   ? movie.posterBlobUrl
    //   : movie.poster_path
    //     ? `${imageBaseUrl}${movie.poster_path}`
    //     : "";

    const imageUrl = movie.posterUrl
      ? movie.posterUrl
      : movie.poster_path
        ? `${imageBaseUrl}${movie.poster_path}`
        : "";

    const releaseYear = movie.release_date
      ? movie.release_date.split("-")[0]
      : movie.year || "N/A";

    const rating = movie.vote_average
      ? movie.vote_average.toFixed(1)
      : movie.rating
        ? Number(movie.rating).toFixed(1)
        : "N/A";

    movieCard.innerHTML = `
      <div class="movie-poster">
        <img src="${imageUrl}" alt="${escapeHtml(movie.title)}">
        <div class="movie-poster-overlay"></div>
      </div>
      
      <div class="movie-info">
        <h3 class="movie-title">${escapeHtml(movie.title)}</h3>
        
        <div class="movie-meta">
          <span>${releaseYear}</span>
          
          <div class="movie-rating">
            <span class="star">★</span>
            <span>${rating}</span>
          </div>
        </div>
      </div>
    `;

    movieCard.addEventListener("click", () => {
      getDetails(movie.id);
    });

    moviesGrid.appendChild(movieCard);
  });

  displayContainer.appendChild(moviesGrid);
}

// ============================================================
// FETCH MOVIE DETAILS
// ============================================================

async function getDetails(id) {
  try {
    const response = await fetch(
      `https://api.themoviedb.org/3/movie/${id}?api_key=${API_KEY}`,
    );

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    const data = await response.json();
    await showDetails(data);
  } catch (error) {
    console.error("Failed to display details:", error);
    displayErrorMessage("Failed to display details.");
  }
}

// ============================================================
// SHOW MOVIE DETAILS (with save button using .btn class)
// ============================================================

async function showDetails(data) {
  const alreadySaved = await isMovieSaved(data.id);

  displayContainer.innerHTML = `
    <div class="modal-overlay active">
      <div class="modal-content">
        <div class="modal-header">
          <h2 class="modal-title">${escapeHtml(data.title)}</h2>
          <button class="modal-close" id="backButton">✕</button>
        </div>
        
        <div class="modal-body">
          <div class="modal-layout">
            <div class="modal-poster-container">
              <div class="modal-poster">
                <img 
                  src="${data.poster_path ? imageBaseUrl + data.poster_path : ""}" 
                  alt="${escapeHtml(data.title)}"
                >
              </div>
            </div>
            
            <div class="modal-details">
              <div class="detail-section">
                <div class="detail-header">
                  <div class="detail-line"></div>
                  <span class="detail-label">Overview</span>
                </div>
                
                <p class="overview-text">
                  ${escapeHtml(data.overview) || "No overview available."}
                </p>
              </div>
              
              <div class="detail-section">
                <div class="detail-header">
                  <div class="detail-line"></div>
                  <span class="detail-label">Release Date</span>
                </div>
                
                <p class="detail-content">
                  ${data.release_date || "N/A"}
                </p>
              </div>
              
              <div class="detail-section">
                <div class="detail-header">
                  <div class="detail-line"></div>
                  <span class="detail-label">Vote Average</span>
                </div>
                
                <div class="rating-display">
                  <span class="rating-star">★</span>
                  <span class="rating-value">${data.vote_average ? data.vote_average.toFixed(1) : "N/A"}</span>
                  <span class="rating-max">/ 10</span>
                </div>
              </div>

              <button class="btn" id="saveDetailBtn" data-saved="${alreadySaved}">
                ${alreadySaved ? "Saved Offline" : "Save for Offline"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  const saveDetailBtn = document.getElementById("saveDetailBtn");
  if (saveDetailBtn) {
    saveDetailBtn.addEventListener("click", async (e) => {
      e.stopPropagation();
      const isSaved = saveDetailBtn.dataset.saved === "true";

      if (isSaved) {
        await deleteSavedMovie(data.id);
        saveDetailBtn.textContent = "Save for Offline";
        saveDetailBtn.dataset.saved = "false";
      } else {
        await saveMovieForOffline(data);
        saveDetailBtn.textContent = "Saved Offline";
        saveDetailBtn.dataset.saved = "true";
      }
    });
  }

  const backButton = document.getElementById("backButton");
  if (backButton) {
    backButton.addEventListener("click", () => {
      goBackFromDetails();
    });
  }

  const modalOverlay = document.querySelector(".modal-overlay");
  if (modalOverlay) {
    modalOverlay.addEventListener("click", (e) => {
      if (e.target === modalOverlay) {
        goBackFromDetails();
      }
    });
  }
}

// ============================================================
// HELPER: GO BACK FROM DETAILS
// ============================================================

function goBackFromDetails() {
  if (lastViewState === "saved") {
    showSavedMoviesView();
  } else if (lastSearchResults && lastSearchResults.length > 0) {
    const sortedResults = sortMovies(lastSearchResults, sortSelect.value);
    displayMovies(sortedResults);
    resultsText.textContent = "Search Results";
  } else if (lastKeyword) {
    fetchMovies(lastKeyword);
  } else {
    fetchTrendingMovies();
  }
}

// ============================================================
// ESCAPE HTML
// ============================================================

function escapeHtml(str) {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// ============================================================
// ERROR MESSAGE
// ============================================================

function displayErrorMessage(message) {
  displayContainer.innerHTML = `
    <p class="no-results">${message}</p>
  `;
}

// ============================================================
// OFFLINE SAVE FUNCTIONS
// ============================================================

async function saveMovieForOffline(movie) {
  try {
    if (!navigator.serviceWorker || !navigator.serviceWorker.controller) {
      return await saveMovieDirectly(movie);
    }

    const messageChannel = new MessageChannel();

    return new Promise((resolve, reject) => {
      navigator.serviceWorker.controller.postMessage(
        {
          action: "SAVE_MOVIE",
          movie: movie,
        },
        [messageChannel.port2],
      );

      messageChannel.port1.onmessage = (event) => {
        if (event.data.success) {
          resolve(event.data);
        } else {
          reject(new Error(event.data.error));
        }
      };
    });
  } catch (error) {
    console.error("Error saving movie:", error);
    throw error;
  }
}

async function saveMovieDirectly(movie) {
  const DB_NAME = "MovieApp";
  const DB_VERSION = 2;
  const STORE_NAME = "savedMovies";

  function openDatabase() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
          store.createIndex("title", "title", { unique: false });
          store.createIndex("rating", "rating", { unique: false });
          store.createIndex("savedAt", "savedAt", { unique: false });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

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

  if (movie.poster_path) {
    const posterUrl = `https://image.tmdb.org/t/p/w500${movie.poster_path}`;
    const cache = await caches.open("movie-posters-v1");
    await cache.add(posterUrl);
  }
}

async function getSavedMovies() {
  try {
    if (!navigator.serviceWorker || !navigator.serviceWorker.controller) {
      return await getSavedMoviesDirectly();
    }

    const messageChannel = new MessageChannel();

    return new Promise((resolve, reject) => {
      navigator.serviceWorker.controller.postMessage(
        { action: "GET_SAVED_MOVIES" },
        [messageChannel.port2],
      );

      messageChannel.port1.onmessage = (event) => {
        if (event.data.success) {
          resolve(event.data.movies);
        } else {
          reject(new Error(event.data.error));
        }
      };
    });
  } catch (error) {
    console.error("Error getting saved movies:", error);
    return [];
  }
}

async function getSavedMoviesDirectly() {
  const DB_NAME = "MovieApp";
  const DB_VERSION = 2;
  const STORE_NAME = "savedMovies";

  function openDatabase() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
          store.createIndex("title", "title", { unique: false });
          store.createIndex("rating", "rating", { unique: false });
          store.createIndex("savedAt", "savedAt", { unique: false });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  const db = await openDatabase();
  const transaction = db.transaction([STORE_NAME], "readonly");
  const store = transaction.objectStore(STORE_NAME);
  const allMovies = await store.getAll();

  for (const movie of allMovies) {
    if (movie.poster_path) {
      const posterUrl = `https://image.tmdb.org/t/p/w500${movie.poster_path}`;
      const cache = await caches.open("movie-posters-v1");
      const cachedResponse = await cache.match(posterUrl);

      if (cachedResponse) {
        const blob = await cachedResponse.blob();
        movie.posterBlobUrl = URL.createObjectURL(blob);
      }
    }
  }

  return allMovies;
}

async function isMovieSaved(movieId) {
  try {
    if (!navigator.serviceWorker || !navigator.serviceWorker.controller) {
      return await isMovieSavedDirectly(movieId);
    }

    const messageChannel = new MessageChannel();

    return new Promise((resolve, reject) => {
      navigator.serviceWorker.controller.postMessage(
        {
          action: "CHECK_SAVED",
          movieId: movieId,
        },
        [messageChannel.port2],
      );

      messageChannel.port1.onmessage = (event) => {
        if (event.data.success) {
          resolve(event.data.isSaved);
        } else {
          reject(new Error(event.data.error));
        }
      };
    });
  } catch (error) {
    console.error("Error checking saved status:", error);
    return false;
  }
}

async function isMovieSavedDirectly(movieId) {
  const DB_NAME = "MovieApp";
  const DB_VERSION = 2;
  const STORE_NAME = "savedMovies";

  function openDatabase() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
          store.createIndex("title", "title", { unique: false });
          store.createIndex("rating", "rating", { unique: false });
          store.createIndex("savedAt", "savedAt", { unique: false });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  const db = await openDatabase();
  const transaction = db.transaction([STORE_NAME], "readonly");
  const store = transaction.objectStore(STORE_NAME);
  const movie = await store.get(movieId);
  return !!movie;
}

async function deleteSavedMovie(movieId) {
  try {
    if (!navigator.serviceWorker || !navigator.serviceWorker.controller) {
      return await deleteSavedMovieDirectly(movieId);
    }

    const messageChannel = new MessageChannel();

    return new Promise((resolve, reject) => {
      navigator.serviceWorker.controller.postMessage(
        {
          action: "DELETE_MOVIE",
          movieId: movieId,
        },
        [messageChannel.port2],
      );

      messageChannel.port1.onmessage = (event) => {
        if (event.data.success) {
          resolve(event.data);
        } else {
          reject(new Error(event.data.error));
        }
      };
    });
  } catch (error) {
    console.error("Error deleting movie:", error);
    throw error;
  }
}

async function deleteSavedMovieDirectly(movieId) {
  const DB_NAME = "MovieApp";
  const DB_VERSION = 2;
  const STORE_NAME = "savedMovies";

  function openDatabase() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
          store.createIndex("title", "title", { unique: false });
          store.createIndex("rating", "rating", { unique: false });
          store.createIndex("savedAt", "savedAt", { unique: false });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  const db = await openDatabase();
  const transaction = db.transaction([STORE_NAME], "readwrite");
  const store = transaction.objectStore(STORE_NAME);
  await store.delete(movieId);
}

// ============================================================
// SHOW SAVED MOVIES VIEW
// ============================================================

async function showSavedMoviesView() {
  displayContainer.innerHTML = "<p>Loading saved movies...</p>";
  resultsText.textContent = "Saved Movies";
  lastViewState = "saved";

  const savedMovies = await getSavedMovies();

  if (savedMovies.length === 0) {
    displayContainer.innerHTML = `
      <p class="no-results">No saved movies yet. Click any movie and save it for offline viewing!</p>
    `;
    return;
  }

  displayMovies(savedMovies);
}