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
  .pointRadius(1.5)
  .pointColor(() => "rgba(237, 24, 71, 0.7)");

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

loadCountriesFromSheet();

world.pointOfView({ lat: 36.2048, lng: 138.2529, altitude: 2.2 });
world.controls().autoRotate = true;
world.controls().autoRotateSpeed = 0.1;
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
    currentLang === "ja" ? "人道支援資金：" : "Humanitarian funding:";

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
    const img = document.createElement("img");
    img.src = photo.url || "";
    console.log("Photo:", photo);
    img.alt = `Portrait ${i + 1}`;
    img.addEventListener("click", () => openLightbox(photo));
    gallery.appendChild(img);
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
