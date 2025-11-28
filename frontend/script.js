const $ = (id) => document.getElementById(id);
const addEventButton  = $("add-event-btn");
const formContainer   = $("event-form-container");
const eventForm       = $("event-form");
const eventGrid       = $("event-grid");
const myRsvpList      = $("my-rsvp-list");
const reminderBanner  = $("reminder-banner");
const noEventsMsg     = $("no-events-msg");
const noRsvpMsg       = $("no-rsvp-msg");
const userNameInput   = $("user-name");
const userRoleSelect  = $("user-role");
const filterCategory  = $("filter-category");
const filterFrom      = $("filter-from");
const applyFiltersBtn = $("apply-filters");
const viewReportBtn   = $("view-report-btn");

let currentFilters = { category: "", from: "" };

// load names n roles
function loadUserContext() {
  const storedName = localStorage.getItem("ems_name") || "";
  const storedRole = localStorage.getItem("ems_role") || "student";
  userNameInput.value = storedName;
  userRoleSelect.value = storedRole;
  onRoleChange();
}

function saveUserContext() {
  localStorage.setItem("ems_name", userNameInput.value.trim());
  localStorage.setItem("ems_role", userRoleSelect.value);
}

function onRoleChange() {
  const role = userRoleSelect.value;
  // add event only for admins n organizers (so students need to be accepted)
  addEventButton.classList.toggle("d-none", !(role === "organizer" || role === "admin"));
  // report button (admin only)
  viewReportBtn.classList.toggle("d-none", role !== "admin");
}

// show/hide button
addEventButton.addEventListener("click", () => {
  $("event-form-title").textContent = "Add New Event";
  $("event-id").value = "";
  eventForm.reset();
  formContainer.classList.remove("d-none");
});

$("cancel-event").addEventListener("click", () => {
  formContainer.classList.add("d-none");
  eventForm.reset();
});

// add/edit events
eventForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const id          = $("event-id").value;
  const title       = $("event-title").value.trim();
  const date        = $("event-date").value;
  const category    = $("event-category").value;
  const description = $("event-description").value.trim();

  if (!title || !date || !category || !description) return;

  const payload = { title, date, category, description };
  const method  = id ? "PUT" : "POST";
  const url     = id ? `/events/${id}` : "/events";

  await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  formContainer.classList.add("d-none");
  eventForm.reset();
  await refreshAll();
});

// user changes
userNameInput.addEventListener("change", () => {
  saveUserContext();
  refreshAll();
});
userRoleSelect.addEventListener("change", () => {
  saveUserContext();
  onRoleChange();
  refreshAll();
});

// filters
applyFiltersBtn.addEventListener("click", () => {
  currentFilters.category = filterCategory.value;
  currentFilters.from     = filterFrom.value;
  refreshAll();
});

// load events w filters
async function loadEvents() {
  let url = "/events?status=approved";
  if (currentFilters.category) {
    url += `&category=${encodeURIComponent(currentFilters.category)}`;
  }
  if (currentFilters.from) {
    url += `&from=${encodeURIComponent(currentFilters.from)}`;
  }
  const res = await fetch(url);
  const events = await res.json();

  eventGrid.innerHTML = "";
  noEventsMsg.classList.toggle("d-none", events.length > 0);

  const role = userRoleSelect.value;
  const name = (userNameInput.value || "").trim();

  events.forEach(ev => {
    const card = document.createElement("div");
    card.className = "event-card";
    card.dataset.id = ev.id;
    card.innerHTML = `
      <div class="d-flex justify-content-between align-items-start">
        <div>
          <h3 class="h5 mb-1">${ev.title}</h3>
          <div class="small text-muted mb-1">${ev.date} · ${ev.category}</div>
        </div>
        <span class="badge bg-${ev.status === "approved" ? "success" : ev.status === "pending" ? "warning text-dark" : "secondary"} text-capitalize">
          ${ev.status}
        </span>
      </div>
      <p class="mb-2">${ev.description}</p>
      <div class="d-flex flex-wrap gap-2">
        ${role === "student" ? `
          <button class="btn btn-sm btn-outline-primary rsvp-btn">RSVP</button>
          <button class="btn btn-sm btn-outline-secondary cancel-rsvp-btn">Cancel RSVP</button>
        ` : ""}
        ${(role === "organizer" || role === "admin") ? `
          <button class="btn btn-sm btn-outline-primary edit-btn">Edit</button>
          <button class="btn btn-sm btn-outline-danger delete-btn">Delete</button>
          <button class="btn btn-sm btn-outline-info view-rsvp-btn">View RSVPs</button>
        ` : ""}
        ${role === "admin" && ev.status === "pending" ? `
          <button class="btn btn-sm btn-success approve-btn">Approve</button>
          <button class="btn btn-sm btn-outline-secondary reject-btn">Reject</button>
        ` : ""}
        <button class="btn btn-sm btn-outline-dark feedback-btn">Leave Feedback</button>
      </div>
    `;
    eventGrid.appendChild(card);
  });

  attachEventCardHandlers();
}

// handler attaches to cards
function attachEventCardHandlers() {
  const name = (userNameInput.value || "").trim();

  document.querySelectorAll(".delete-btn").forEach(btn =>
    btn.onclick = async (e) => {
      const id = e.target.closest(".event-card").dataset.id;
      await fetch(`/events/${id}`, { method: "DELETE" });
      await refreshAll();
    }
  );

  document.querySelectorAll(".edit-btn").forEach(btn =>
    btn.onclick = async (e) => {
      const card = e.target.closest(".event-card");
      const id   = card.dataset.id;
      const title = card.querySelector("h3").textContent;
      const meta  = card.querySelector(".small").textContent;
      const [date, category] = meta.split(" · ");
      const desc  = card.querySelector("p").textContent;

      $("event-form-title").textContent = "Edit Event";
      $("event-id").value = id;
      $("event-title").value = title;
      $("event-date").value  = date;
      $("event-category").value = category;
      $("event-description").value = desc;
      formContainer.classList.remove("d-none");
    }
  );

  document.querySelectorAll(".approve-btn").forEach(btn =>
    btn.onclick = async (e) => {
      const id = e.target.closest(".event-card").dataset.id;
      await fetch(`/events/${id}/approve`, { method: "POST" });
      await refreshAll();
    }
  );
  document.querySelectorAll(".reject-btn").forEach(btn =>
    btn.onclick = async (e) => {
      const id = e.target.closest(".event-card").dataset.id;
      await fetch(`/events/${id}/reject`, { method: "POST" });
      await refreshAll();
    }
  );

  document.querySelectorAll(".rsvp-btn").forEach(btn =>
    btn.onclick = async (e) => {
      if (!name) {
        alert("Please enter your name first.");
        userNameInput.focus();
        return;
      }
      const id = e.target.closest(".event-card").dataset.id;
      await fetch(`/events/${id}/rsvp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name })
      });
      await refreshAll();
    }
  );

  document.querySelectorAll(".cancel-rsvp-btn").forEach(btn =>
    btn.onclick = async (e) => {
      if (!name) return;
      const id = e.target.closest(".event-card").dataset.id;
      await fetch(`/events/${id}/cancel-rsvp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name })
      });
      await refreshAll();
    }
  );

  document.querySelectorAll(".view-rsvp-btn").forEach(btn =>
    btn.onclick = async (e) => {
      const id = e.target.closest(".event-card").dataset.id;
      const res = await fetch(`/events/${id}/rsvps`);
      const data = await res.json();
      if (data.length === 0) {
        alert("No RSVPs yet for this event.");
      } else {
        const lines = data.map(r => `• ${r.name} (${r.status})`);
        alert("RSVP list:\n" + lines.join("\n"));
      }
    }
  );

  document.querySelectorAll(".feedback-btn").forEach(btn =>
    btn.onclick = async (e) => {
      const card = e.target.closest(".event-card");
      const id = card.dataset.id;
      const nameLocal = name || prompt("Your name?");
      if (!nameLocal) return;
      const comment = prompt("Enter your feedback/comment:");
      if (!comment) return;
      await fetch(`/events/${id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: nameLocal, comment })
      });
      alert("Thank you for your feedback!");
      saveUserContext();
    }
  );
}

// load user rsvp
async function loadMyRsvps() {
  const name = (userNameInput.value || "").trim();
  if (!name) {
    myRsvpList.innerHTML = "";
    noRsvpMsg.classList.remove("d-none");
    reminderBanner.classList.add("d-none");
    return;
  }
  const res = await fetch(`/my-rsvps?name=${encodeURIComponent(name)}`);
  const events = await res.json();
  myRsvpList.innerHTML = "";
  noRsvpMsg.classList.toggle("d-none", events.length > 0);

  let upcomingSoon = [];

  events.forEach(ev => {
    const card = document.createElement("div");
    card.className = "event-card small-card";
    card.innerHTML = `
      <div class="d-flex justify-content-between">
        <div>
          <div class="fw-semibold">${ev.title}</div>
          <div class="small text-muted">${ev.date} · ${ev.category}</div>
        </div>
      </div>
    `;
    myRsvpList.appendChild(card);

    // reminders for the users
    const today = new Date();
    const evDate = new Date(ev.date);
    const diffDays = (evDate - today) / (1000 * 60 * 60 * 24);
    if (diffDays >= 0 && diffDays <= 3) {
      upcomingSoon.push(ev);
    }
  });

  if (upcomingSoon.length > 0) {
    const names = upcomingSoon.map(ev => `${ev.title} (${ev.date})`).join(", ");
    reminderBanner.textContent = `Reminder: You have upcoming event(s) soon: ${names}`;
    reminderBanner.classList.remove("d-none");
  } else {
    reminderBanner.classList.add("d-none");
  }
}

// attendance report (admin only)
viewReportBtn.addEventListener("click", async () => {
  const res = await fetch("/reports/attendance");
  const data = await res.json();
  if (data.length === 0) {
    alert("No attendance data yet.");
    return;
  }
  const lines = data.map(r =>
    `${r.title} (${r.date}) - RSVPs: ${r.going_count}`
  );
  alert("Attendance report:\n" + lines.join("\n"));
});

// refresh
async function refreshAll() {
  await loadEvents();
  await loadMyRsvps();
}

// how everything loads
window.addEventListener("DOMContentLoaded", () => {
  loadUserContext();
  refreshAll();
});
