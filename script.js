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
  world.pointOfView({ lat: 36.2048, lng: 138.2529, altitude: 2.2 }, 1000);
}

document.getElementById("overlay").addEventListener("click", closeSidebar);

function openLightbox(photo) {
  const lang = currentLang === "ja" ? "_ja" : "";

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
