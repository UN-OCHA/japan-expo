// Variables for gallery
let currentPhotoIndex = 0;
let currentPhotoList = [];

// Globe starts
const world = Globe()(document.getElementById("globeViz"))
  .globeImageUrl("//unpkg.com/three-globe/example/img/earth-blue-marble.jpg")
  .bumpImageUrl(null)
  .showAtmosphere(true)
  .atmosphereColor("#88ccff")
  .atmosphereAltitude(0.25)
  .backgroundColor("#1a1a1a")
  .pointAltitude(0.002)
  .pointRadius(2.5)
  .pointColor(() => "#A71F36");

let currentLang = "en"; // 'en' or 'ja'

// Load dynamic data from Google Sheets
async function loadCountriesFromSheet() {
  const infoUrl =
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vR-iY7Yod_hbDIH5OAJR0k6avIzhUagFTXto8U1rANVEiwo5kH17IBje9j64-M2hKBva9Nn7V0-4tjw/pub?gid=0&single=true&output=csv";
  const photosUrl =
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vR-iY7Yod_hbDIH5OAJR0k6avIzhUagFTXto8U1rANVEiwo5kH17IBje9j64-M2hKBva9Nn7V0-4tjw/pub?gid=1122394290&single=true&output=csv";

  const [infoRes, photosRes] = await Promise.all([
    fetch(infoUrl),
    fetch(photosUrl),
  ]);

  const [infoText, photosText] = await Promise.all([
    infoRes.text(),
    photosRes.text(),
  ]);

  const infoParsed = Papa.parse(infoText, {
    header: true,
    skipEmptyLines: true,
  });
  const photosParsed = Papa.parse(photosText, {
    header: true,
    skipEmptyLines: true,
  });

  const photoMap = {};
  photosParsed.data.forEach((p) => {
    const country = p.country?.trim();
    if (!photoMap[country]) photoMap[country] = [];
    photoMap[country].push({
      url: p.url?.trim(),
      title: p.title?.trim(),
      subtitle: p.subtitle?.trim(),
      caption: p.caption?.trim(),
      title_ja: p.title_ja?.trim(),
      subtitle_ja: p.subtitle_ja?.trim(),
      caption_ja: p.caption_ja?.trim(),
    });
  });

  const countries = infoParsed.data.map((row) => ({
    name: row.name?.trim(),
    name_ja: row.name_ja?.trim(),
    lat: parseFloat(row.lat),
    lng: parseFloat(row.lng),
    pin: row.pin?.trim(),
    pin_ja: row.pin_ja?.trim(),
    concerns: row.concerns?.trim(),
    concerns_ja: row.concerns_ja?.trim(),
    funding: row.funding?.trim(),
    funding_ja: row.funding_ja?.trim(),
    summary: row.summary?.trim(),
    summary_ja: row.summary_ja?.trim(),
    photos: photoMap[row.name?.trim()] || [],
  }));

  // ✅ Preload images and parse funding
  countries.forEach((country) => {
    // Preload images
    country.photos.forEach((photo) => {
      if (photo.url) {
        const img = new Image();
        img.src = photo.url;
      }
    });

    // Pre-parse funding
    const fundingStr = country.funding;
    if (fundingStr) {
      parseFundingString(fundingStr);
    }
  });

  world.pointsData(countries);
}

async function initGlobe() {
  await loadCountriesFromSheet();

  setTimeout(() => {
    world.pointOfView({ lat: 36.2048, lng: 138.2529, altitude: 2.2 }, 2000);
  }, 1500);

  world.pointLabel(() => null);

  // NOW controls exist and the globe is scaled
  const controls = world.controls();
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.1;
  controls.minDistance = 320;
  controls.maxDistance = 400;
}

initGlobe();

// Start overlay click handler
document.getElementById("start-overlay").addEventListener("click", () => {
  document.getElementById("start-overlay").classList.add("hidden");
  // Start auto-rotation if you want
  const controls = world.controls();
  controls.autoRotate = true;
});

// Increase raycasting threshold to make points easier to click
world.scene().children.forEach((obj) => {
  if (obj.isPoints) {
    obj.raycastThreshold = 4; // Increase threshold for better click detection
  }
});

// Hide point labels by default
world.pointLabel(() => null);

world.onPointClick((point) => {
  world.pointOfView({ lat: point.lat, lng: point.lng, altitude: 1.5 }, 1000);
  setTimeout(() => {
    showSidebar(point);
  }, 400);
});

function showSidebar(data) {
  const lang = currentLang === "ja" ? "_ja" : "";
  currentPhotoList = data.photos;

  // Update label headings based on language
  document.getElementById("label-pin").textContent =
    currentLang === "ja" ? "支援を必要としている人々：" : "People in need:";
  document.getElementById("label-concerns").textContent =
    currentLang === "ja" ? "主な懸念事項：" : "Main concerns:";
  document.getElementById("label-funding").textContent =
    currentLang === "ja"
      ? "支援のための要請額と調達率："
      : "Humanitarian funding:";

  document.getElementById("countryTitle").textContent =
    data[`name${lang}`] || data.name;
  const pinValue = data[`pin${lang}`] || data.pin;
  const pinBlock = document.getElementById("pinBlock");

  if (!pinValue || pinValue.trim() === "") {
    pinBlock.style.display = "none";
  } else {
    pinBlock.style.display = "block";
    document.getElementById("pin").textContent = pinValue;
  }
  document.getElementById("concerns").textContent =
    data[`concerns${lang}`] || data.concerns;
  document.getElementById("funding").textContent =
    data[`funding${lang}`] || data.funding;
  const fundingValue = data[`funding${lang}`] || data.funding;
  const fundingBlock = document.getElementById("fundingBlock");

  if (!fundingValue || fundingValue.trim() === "") {
    fundingBlock.style.display = "none";
  } else {
    fundingBlock.style.display = "block";
    drawFundingChart(fundingValue);
  }

  const summary = data[`summary${lang}`] || data.summary;
  document.getElementById("summary").innerHTML = summary
    ? summary.replace(/\n/g, "<br><br>")
    : "";

  const gallery = document.getElementById("photoGallery");
  gallery.innerHTML = "";

  data.photos.forEach((photo, i) => {
    const wrapper = document.createElement("div");
    wrapper.classList.add("photo-thumb");

    wrapper.addEventListener("click", () => openLightbox(photo));

    const img = document.createElement("img");
    img.src = photo.url || "";
    img.alt = `Portrait ${i + 1}`;

    // Eye badge in corner
    const badge = document.createElement("div");
    badge.classList.add("photo-badge");
    badge.innerHTML = '<i class="fas fa-magnifying-glass-plus"></i>';

    wrapper.appendChild(img);
    wrapper.appendChild(badge);
    gallery.appendChild(wrapper);
  });

  document.querySelector(".sidebar").classList.add("visible");
  document.getElementById("overlay").classList.add("visible");
}

function closeSidebar() {
  document.querySelector(".sidebar").classList.remove("visible");
  document.getElementById("overlay").classList.remove("visible");
  // world.pointOfView({ lat: 36.2048, lng: 138.2529, altitude: 2.2 }, 1000);
}

document.getElementById("overlay").addEventListener("click", closeSidebar);

function openLightbox(photo) {
  const lang = currentLang === "ja" ? "_ja" : "";

  currentPhotoIndex = currentPhotoList.indexOf(photo);

  document.getElementById("lightbox-img").src = photo.url;
  document.getElementById("lightbox-title").textContent =
    photo[`title${lang}`] || photo.title || "";
  document.getElementById("lightbox-subtitle").textContent =
    photo[`subtitle${lang}`] || photo.subtitle || "";
  const rawCaption = photo[`caption${lang}`] || photo.caption || "";
  document.getElementById("lightbox-caption").innerHTML = rawCaption.replace(
    /\n/g,
    "<br><br>"
  );

  document.getElementById("lightbox").classList.add("visible");
}

function closeLightbox() {
  document.getElementById("lightbox").classList.remove("visible");
}

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeLightbox();
});

// Language toggle
let currentCountry = null;

// Handle point clicks and store the selected country
world.onPointClick((point) => {
  currentCountry = point;
  world.pointOfView({ lat: point.lat, lng: point.lng, altitude: 1.5 }, 1000);
  setTimeout(() => {
    showSidebar(point);
  }, 400);
});

// Language toggle button logic
document.getElementById("lang-en").addEventListener("click", () => {
  currentLang = "en";
  updateLanguage();
});

document.getElementById("lang-ja").addEventListener("click", () => {
  currentLang = "ja";
  updateLanguage();
});

function updateLanguage() {
  // Update active class
  document
    .getElementById("lang-en")
    .classList.toggle("active", currentLang === "en");
  document
    .getElementById("lang-ja")
    .classList.toggle("active", currentLang === "ja");

  // If sidebar is open, re-render it
  if (
    document.querySelector(".sidebar").classList.contains("visible") &&
    currentCountry
  ) {
    showSidebar(currentCountry);
  }

  // Toggle info modal text
  document.getElementById("info-en").style.display =
    currentLang === "en" ? "block" : "none";
  document.getElementById("info-ja").style.display =
    currentLang === "ja" ? "block" : "none";

  // Toggle sidebar bottom close buttons
  document.getElementById("sidebar-close-btn-en").style.display =
    currentLang === "en" ? "block" : "none";
  document.getElementById("sidebar-close-btn-ja").style.display =
    currentLang === "ja" ? "block" : "none";

  // Toggle lightbox bottom close buttons
  document.getElementById("lightbox-close-btn-en").style.display =
    currentLang === "en" ? "block" : "none";
  document.getElementById("lightbox-close-btn-ja").style.display =
    currentLang === "ja" ? "block" : "none";
}

// Funding charts
function parseFundingString(str) {
  const match = str.match(/([\d.]+)% of \$([\d.]+) (million|billion)/i);
  if (!match) return null;

  const percent = parseFloat(match[1]);
  let total = parseFloat(match[2]);
  const unit = match[3].toLowerCase();

  if (unit === "billion") {
    total *= 1000; // Convert to millions
  }

  const funded = +((total * percent) / 100).toFixed(1);
  const gap = +(total - funded).toFixed(1);
  return { funded, gap, total, percent };
}

let fundingChartInstance = null;

function drawFundingChart(fundingText) {
  const data = parseFundingString(fundingText);
  if (!data) return;

  const ctx = document.getElementById("fundingChart").getContext("2d");

  if (fundingChartInstance) {
    fundingChartInstance.destroy();
  }

  fundingChartInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels: [""], // single row, no label
      datasets: [
        {
          label: "Funded",
          data: [data.funded],
          backgroundColor: "#009edb",
        },
        {
          label: "Gap",
          data: [data.gap],
          backgroundColor: "#e0e0e0",
        },
      ],
    },
    options: {
      indexAxis: "y",
      responsive: true,

      interaction: {
        mode: "nearest",
        intersect: true,
      },
      events: ["click"],

      scales: {
        x: {
          stacked: true,
          display: false,
        },
        y: {
          stacked: true,
          display: false,
        },
      },

      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "#000",
          bodyColor: "#fff",
          borderWidth: 0,
          padding: {
            top: 4,
            bottom: 4,
            left: 12,
            right: 12,
          },
          cornerRadius: 2,
          displayColors: false,
          callbacks: {
            label: (context) => `${context.dataset.label}: $${context.raw}M`,
          },
        },
      },
    },
  });
}

// Info disclaimer
document.getElementById("info-button").addEventListener("click", () => {
  document.getElementById("info-modal").style.display = "block";
});

function closeInfoModal() {
  document.getElementById("info-modal").style.display = "none";
}
// Close modal when clicking outside the modal content
window.addEventListener("click", function (event) {
  const modal = document.getElementById("info-modal");
  const content = document.querySelector(".modal-content");
  if (event.target === modal && !content.contains(event.target)) {
    closeInfoModal();
  }
});

// Navigation buttons for lightbox
document.getElementById("prev-photo").addEventListener("click", () => {
  if (currentPhotoList.length === 0) return;
  currentPhotoIndex =
    (currentPhotoIndex - 1 + currentPhotoList.length) % currentPhotoList.length;
  openLightbox(currentPhotoList[currentPhotoIndex]);
});

document.getElementById("next-photo").addEventListener("click", () => {
  if (currentPhotoList.length === 0) return;
  currentPhotoIndex = (currentPhotoIndex + 1) % currentPhotoList.length;
  openLightbox(currentPhotoList[currentPhotoIndex]);
});

// Additional bottom close buttons
document
  .getElementById("lightbox-close-btn-en")
  .addEventListener("click", closeLightbox);
document
  .getElementById("lightbox-close-btn-ja")
  .addEventListener("click", closeLightbox);
document
  .getElementById("sidebar-close-btn-en")
  .addEventListener("click", closeSidebar);
document
  .getElementById("sidebar-close-btn-ja")
  .addEventListener("click", closeSidebar);

// Idle timeout in milliseconds (5 minutes)
const IDLE_TIMEOUT = 1 * 60 * 1000;
let idleTimer = null;

function resetIdleTimer() {
  // Clear any existing timer
  if (idleTimer) {
    clearTimeout(idleTimer);
  }

  // Start a new timer
  idleTimer = setTimeout(() => {
    console.log("No activity detected. Refreshing...");
    location.reload();
  }, IDLE_TIMEOUT);
}

// Events that reset the idle timer
const activityEvents = [
  "mousemove",
  "mousedown",
  "touchstart",
  "touchmove",
  "keydown",
];

// Attach listeners
activityEvents.forEach((event) => {
  document.addEventListener(event, resetIdleTimer, { passive: true });
});

// Start timer on page load
resetIdleTimer();

// Reset button to reload the page
document.getElementById("reset-button").addEventListener("click", () => {
  location.reload();
});

// Lock zoom
// 1) Prevent mobile Safari pinch
document.addEventListener("gesturestart", (e) => e.preventDefault());

// 2) Prevent Windows touch-pad / Chrome “ctrl+wheel” zoom
window.addEventListener(
  "wheel",
  (e) => {
    if (e.ctrlKey) e.preventDefault();
  },
  { passive: false }
);

// 3) Block two-finger touchmove on any element
document.addEventListener(
  "touchmove",
  (e) => {
    if (e.touches.length > 1) {
      e.preventDefault();
    }
  },
  { passive: false }
);

// 4) Also block Ctrl + “+” / “-” / “0” keyboard zoom
window.addEventListener("keydown", (e) => {
  if (e.ctrlKey && ["=", "-", "0"].includes(e.key)) {
    e.preventDefault();
  }
});
