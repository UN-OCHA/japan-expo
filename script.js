const countries = [
  {
    name: "DRC",
    lat: 0.7893,
    lng: 23.656,
    pin: "25 million",
    concerns: "Conflict, displacement, food insecurity",
    funding: "38% of $2.25B",
    summary:
      "The Democratic Republic of Congo continues to face a dire humanitarian crisis...",
    readMore: "https://humanitarianaction.info/plan/123",
    portraits: ["img/drc.jpg"],
  },

  {
    name: "Honduras",
    lat: 15.2,
    lng: -86.2419,
    pin: "2.8 million",
    concerns: "Climate shocks, violence, food insecurity",
    funding: "19% of $291M",
    summary:
      "Honduras is facing severe challenges due to climate-related disasters and violence, driving internal displacement and humanitarian needs.",
    readMore: "https://humanitarianaction.info/plan/honduras",
    portraits: ["img/honduras.jpg"],
  },

  {
    name: "Japan",
    lat: 36.2048,
    lng: 138.2529,
    pin: "N/A",
    concerns: "Natural disasters, aging population",
    funding: "N/A",
    summary:
      "Japan has faced significant natural disasters over the years, including earthquakes and tsunamis. OCHA continues to promote awareness and preparedness efforts.",
    readMore: "https://humanitarianaction.info/plan/japan",
    portraits: ["img/japan1.jpg", "img/japan2.jpg"],
  },

  {
    name: "Syria",
    lat: 34.8021,
    lng: 38.9968,
    pin: "15 million",
    concerns: "Conflict, displacement, access issues",
    funding: "52% of $4.5B",
    summary: "Millions continue to depend on cross-border assistance...",
    readMore: "https://humanitarianaction.info/plan/456",
    portraits: ["img/syria.jpg"],
  },
];

const world = Globe()(document.getElementById("globeViz"))
  .globeImageUrl("//unpkg.com/three-globe/example/img/earth-blue-marble.jpg")
  .bumpImageUrl(null)
  .showAtmosphere(true)
  .atmosphereColor("#88ccff")
  .atmosphereAltitude(0.25)
  .backgroundColor("#1a1a1a")
  .pointAltitude(0.001)
  .pointRadius(2)
  .pointsData(countries)
  .pointColor(() => "rgba(237, 24, 71, 0.7)") // Semi-transparent red
  .labelsData(countries)
  .labelLat((d) => d.lat)
  .labelLng((d) => d.lng)
  .labelText((d) => d.name)
  .labelSize(1.2)
  .labelColor(() => "white")
  .labelDotRadius(0)
  .labelResolution(0); // Disables glow that can appear on hover

// Set initial zoom and center
world.pointOfView({ lat: 36.2048, lng: 138.2529, altitude: 2.2 });

// Enable auto-rotate
world.controls().autoRotate = true;
world.controls().autoRotateSpeed = 0.35; // adjust speed if needed

world.onPointClick((point) => {
  world.pointOfView({ lat: point.lat, lng: point.lng, altitude: 1.5 }, 1000);
  showSidebar(point);
});

//SIDEBAR FUNCTIONALITY

function showSidebar(data) {
  document.getElementById("countryTitle").textContent = data.name;
  document.getElementById("pin").textContent = data.pin;
  document.getElementById("concerns").textContent = data.concerns;
  document.getElementById("funding").textContent = data.funding;
  document.getElementById("summary").textContent = data.summary;
  document.getElementById("readMore").href = data.readMore;

  const gallery = document.getElementById("photoGallery");
  gallery.innerHTML = "";

  data.portraits.forEach((p, i) => {
    const url = typeof p === "string" ? p : p.url;
    const caption = typeof p === "string" ? "" : p.caption || "";

    const img = document.createElement("img");
    img.src = url;
    img.alt = `Portrait ${i + 1}`;
    img.addEventListener("click", () => openLightbox(url, caption));

    gallery.appendChild(img);
  });

  document.querySelector(".sidebar").classList.add("visible");
}

function closeSidebar() {
  document.getElementById("sidebar").classList.remove("visible");

  // Reset globe view to center
  world.pointOfView({ lat: 36.2048, lng: 138.2529, altitude: 2.2 }, 1000);
}
