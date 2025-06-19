const world = Globe()(document.getElementById("globeViz"))
  .globeImageUrl("//unpkg.com/three-globe/example/img/earth-blue-marble.jpg")
  .bumpImageUrl(null)
  .showAtmosphere(true)
  .atmosphereColor("#88ccff")
  .atmosphereAltitude(0.25)
  .backgroundColor("#1a1a1a")
  .pointAltitude(0.002)
  .pointRadius(2.5)
  .pointColor(() => "rgba(237, 24, 71, 0.7)");

let currentLang = "en"; // 'en' or 'ja'

// Load dynamic data from Google Sheets
async function loadCountriesFromSheet() {
  const response = await fetch(
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vR-iY7Yod_hbDIH5OAJR0k6avIzhUagFTXto8U1rANVEiwo5kH17IBje9j64-M2hKBva9Nn7V0-4tjw/pub?output=csv"
  );
  const csvText = await response.text();

  const parsed = Papa.parse(csvText, { header: true, skipEmptyLines: true });
  const countries = parsed.data.map((row) => ({
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
    portraits: row.portraits?.split("|").map((p) => p.trim()),
    photoTitle: row.photoTitle?.trim(),
    photoTitle_ja: row.photoTitle_ja?.trim(),
    photoSubtitle: row.photoSubtitle?.trim(),
    photoSubtitle_ja: row.photoSubtitle_ja?.trim(),
    photoCaption: row.photoCaption?.trim(),
    photoCaption_ja: row.photoCaption_ja?.trim(),
  }));

  world.pointsData(countries);
}

loadCountriesFromSheet();

world.pointOfView({ lat: 36.2048, lng: 138.2529, altitude: 2.2 });
world.controls().autoRotate = true;
world.controls().autoRotateSpeed = 0.35;
world.pointLabel(() => null);

world.onPointClick((point) => {
  world.pointOfView({ lat: point.lat, lng: point.lng, altitude: 1.5 }, 1000);
  setTimeout(() => {
    showSidebar(point);
  }, 400);
});

function showSidebar(data) {
  const lang = currentLang === "ja" ? "_ja" : "";

  // Update label headings based on language
  document.getElementById("label-pin").textContent =
    currentLang === "ja" ? "支援を必要としている人々：" : "People in need:";
  document.getElementById("label-concerns").textContent =
    currentLang === "ja" ? "主な懸念事項：" : "Main concerns:";
  document.getElementById("label-funding").textContent =
    currentLang === "ja" ? "資金調達：" : "Funding:";

  document.getElementById("countryTitle").textContent =
    data[`name${lang}`] || data.name;
  document.getElementById("pin").textContent = data[`pin${lang}`] || data.pin;
  document.getElementById("concerns").textContent =
    data[`concerns${lang}`] || data.concerns;
  document.getElementById("funding").textContent =
    data[`funding${lang}`] || data.funding;
  document.getElementById("summary").textContent =
    data[`summary${lang}`] || data.summary;
  document.getElementById("photoTitle").textContent =
    data[`photoTitle${lang}`] || data.photoTitle;
  document.getElementById("photoSubtitle").textContent =
    data[`photoSubtitle${lang}`] || data.photoSubtitle;

  const gallery = document.getElementById("photoGallery");
  gallery.innerHTML = "";

  data.portraits.forEach((url, i) => {
    const img = document.createElement("img");
    img.src = url;
    img.alt = `Portrait ${i + 1}`;

    const lang = currentLang === "ja" ? "_ja" : "";
    const caption = data[`photoCaption${lang}`] || data.photoCaption || "";

    img.addEventListener("click", () => openLightbox(url, caption));
    gallery.appendChild(img);
  });

  document.querySelector(".sidebar").classList.add("visible");
  document.getElementById("overlay").classList.add("visible");
}

function closeSidebar() {
  document.querySelector(".sidebar").classList.remove("visible");
  document.getElementById("overlay").classList.remove("visible");
  world.pointOfView({ lat: 36.2048, lng: 138.2529, altitude: 2.2 }, 1000);
}

document.getElementById("overlay").addEventListener("click", closeSidebar);

function openLightbox(url, caption) {
  const lightbox = document.getElementById("lightbox");
  document.getElementById("lightbox-img").src = url;
  document.getElementById("lightbox-caption").textContent = caption || "";
  lightbox.classList.remove("hidden");
}

function closeLightbox() {
  const lightbox = document.getElementById("lightbox");
  lightbox.classList.add("hidden");
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
