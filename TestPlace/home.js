// Simple in-memory "featured events" list.
// Later you can pull this from your Flask API instead.
const featuredEvents = [
  {
    id: 1,
    title: "Career Fair 2025",
    description: "Meet employers from across Texas, explore internships, and practice your networking skills.",
    images: [
      "img/career1.jpg",
      "img/career2.jpg"
    ]
  },
  {
    id: 2,
    title: "Hackathon Weekend",
    description: "48-hour coding sprint for teams to build apps, games, or tools that solve real problems.",
    images: [
      "img/hack1.jpg",
      "img/hack2.jpg",
      "img/hack3.jpg"
    ]
  },
  {
    id: 3,
    title: "Student Club Expo",
    description: "Discover academic, cultural, and hobby clubs you can join this semester.",
    images: [
      "img/club1.jpg"
    ]
  }
];

function renderFeaturedEvents() {
  const container = document.getElementById("featuredEvents");
  container.innerHTML = "";

  featuredEvents.forEach(event => {
    const col = document.createElement("div");
    col.className = "col";

    const carouselId = `eventCarousel-${event.id}`;

    // Build carousel inner slides
    const slides = event.images.map((src, index) => {
      const activeClass = index === 0 ? "active" : "";
      return `
        <div class="carousel-item ${activeClass}">
          <img src="${src}" class="d-block w-100" alt="${event.title} image ${index + 1}">
        </div>
      `;
    }).join("");

    col.innerHTML = `
      <div class="card h-100">
        <div id="${carouselId}" class="carousel slide" data-bs-ride="carousel">
          <div class="carousel-inner">
            ${slides}
          </div>
          ${event.images.length > 1 ? `
          <button class="carousel-control-prev" type="button" data-bs-target="#${carouselId}" data-bs-slide="prev">
            <span class="carousel-control-prev-icon" aria-hidden="true"></span>
            <span class="visually-hidden">Previous</span>
          </button>
          <button class="carousel-control-next" type="button" data-bs-target="#${carouselId}" data-bs-slide="next">
            <span class="carousel-control-next-icon" aria-hidden="true"></span>
            <span class="visually-hidden">Next</span>
          </button>` : ""}
        </div>
        <div class="card-body">
          <h5 class="card-title">${event.title}</h5>
          <p class="card-text">${event.description}</p>
        </div>
      </div>
    `;

    container.appendChild(col);
  });
}

window.addEventListener("DOMContentLoaded", renderFeaturedEvents);
