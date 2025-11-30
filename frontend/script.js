function getCurrentUser() {
  return {
    name: localStorage.getItem("ems_name") || "",
    role: localStorage.getItem("ems_role") || "student",
  };
}

const nameInput      = document.getElementById("user-name");
const roleSelect     = document.getElementById("user-role");
const logoutBtn      = document.getElementById("logout-btn");
const addEventBtn    = document.getElementById("add-event-btn");
const eventGrid      = document.getElementById("event-grid");
const noEventsMsg    = document.getElementById("no-events-msg");
const filterCategory = document.getElementById("filter-category");
const filterFrom     = document.getElementById("filter-from");
const applyFilters   = document.getElementById("apply-filters");

const formCard       = document.getElementById("event-form-container");
const formElement    = document.getElementById("event-form");
const formTitle      = document.getElementById("event-form-title");
const fieldId        = document.getElementById("event-id");
const fieldTitle     = document.getElementById("event-title");
const fieldDate      = document.getElementById("event-date");
const fieldCategory  = document.getElementById("event-category");
const fieldDesc      = document.getElementById("event-description");
const cancelFormBtn  = document.getElementById("cancel-event");

window.addEventListener("DOMContentLoaded", () => {
  const user = getCurrentUser();
  if (!user.name) {
    window.location.href = "login.html";
    return;
  }
  nameInput.value = user.name;
  roleSelect.value = user.role;
  updateRoleUI();
  loadEvents();
});

//update roles
function updateRoleUI() {
  const { role } = getCurrentUser();
  const canManage = role === "organizer" || role === "admin";
  if (canManage) addEventBtn.classList.remove("d-none");
  else addEventBtn.classList.add("d-none");
}

nameInput.addEventListener("change", () => {
  const name = nameInput.value.trim();
  localStorage.setItem("ems_name", name);
});

roleSelect.addEventListener("change", () => {
  const role = roleSelect.value;
  localStorage.setItem("ems_role", role);
  updateRoleUI();
  loadEvents();
});

//login
logoutBtn.addEventListener("click", () => {
  localStorage.removeItem("ems_name");
  localStorage.removeItem("ems_role");
  window.location.href = "login.html";
});

//add event
addEventBtn.addEventListener("click", () => {
  fieldId.value = "";
  fieldTitle.value = "";
  fieldDate.value = "";
  fieldCategory.value = "";
  fieldDesc.value = "";
  formTitle.textContent = "Add New Event";
  formCard.classList.remove("d-none");
});

cancelFormBtn.addEventListener("click", () => {
  formCard.classList.add("d-none");
});

applyFilters.addEventListener("click", () => {
  loadEvents();
});

//submit event
formElement.addEventListener("submit", async (e) => {
  e.preventDefault();
  const payload = {
    title: fieldTitle.value.trim(),
    date: fieldDate.value,
    category: fieldCategory.value,
    description: fieldDesc.value.trim(),
  };

  if (!payload.title || !payload.date || !payload.category || !payload.description) {
    alert("All fields are required.");
    return;
  }

  const id = fieldId.value;
  const url = id ? `/api/events/${id}` : "/api/events";
  const method = id ? "PUT" : "POST";

  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    alert("Error saving event.");
    return;
  }
  formCard.classList.add("d-none");
  loadEvents();
});

//filter events catagory
async function loadEvents() {
  const user = getCurrentUser();
  const params = new URLSearchParams();
  if (filterCategory.value) params.set("category", filterCategory.value);
  if (filterFrom.value) params.set("from", filterFrom.value);
  params.set("role", user.role);
  const res = await fetch(`/api/events?${params.toString()}`);
  if (!res.ok) {
    console.error("Failed to load events");
    return;
  }
  const events = await res.json();
  renderEvents(events);
}

function renderEvents(events) {
  eventGrid.innerHTML = "";
  if (!events.length) {
    noEventsMsg.classList.remove("d-none");
    return;
  }
  noEventsMsg.classList.add("d-none");
  const user = getCurrentUser();

  //approve/reject for admin
  events.forEach((ev) => {
    const card = document.createElement("div");
    card.className = "event-card";
    card.innerHTML = `
      <div class="event-card-header">
        <h3>${ev.title}</h3>
        <small>${ev.date} · ${ev.category}</small>
      </div>
      <p class="mt-2 mb-2">${ev.description}</p>
      <p class="mb-2">
        <span class="badge bg-${
          ev.status === "approved"
            ? "success"
            : ev.status === "rejected"
            ? "danger"
            : "secondary"
        }">
          ${ev.status}
        </span>
      </p>
      <div class="d-flex flex-wrap gap-2">
      </div>
    `;

    const actions = card.querySelector("div.d-flex");

    //student limitations
    if (user.role === "student") {
      const rsvpBtn = document.createElement("button");
      rsvpBtn.className = "btn btn-sm btn-outline-primary";
      rsvpBtn.textContent = "RSVP";
      rsvpBtn.onclick = async () => {
        await fetch(`/api/events/${ev.id}/rsvp`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: user.name }),
        });
        alert("RSVP recorded.");
      };
      const cancelBtn = document.createElement("button");
      cancelBtn.className = "btn btn-sm btn-outline-secondary";
      cancelBtn.textContent = "Cancel RSVP";
      cancelBtn.onclick = async () => {
        await fetch(`/api/events/${ev.id}/cancel-rsvp`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: user.name }),
        });
        alert("RSVP cancelled.");
      };
      actions.appendChild(rsvpBtn);
      actions.appendChild(cancelBtn);
    }

    //organizer limitations
    if (user.role === "organizer" || user.role === "admin") {
      const editBtn = document.createElement("button");
      editBtn.className = "btn btn-sm btn-outline-primary";
      editBtn.textContent = "Edit";
      editBtn.onclick = () => {
        fieldId.value = ev.id;
        fieldTitle.value = ev.title;
        fieldDate.value = ev.date;
        fieldCategory.value = ev.category;
        fieldDesc.value = ev.description;
        formTitle.textContent = "Edit Event";
        formCard.classList.remove("d-none");
      };
      const deleteBtn = document.createElement("button");
      deleteBtn.className = "btn btn-sm btn-outline-danger";
      deleteBtn.textContent = "Delete";
      deleteBtn.onclick = async () => {
        if (!confirm("Delete this event?")) return;
        await fetch(`/api/events/${ev.id}`, { method: "DELETE" });
        loadEvents();
      };
      actions.appendChild(editBtn);
      actions.appendChild(deleteBtn);
    }

    //admin limitations
    if (user.role === "admin" && ev.status === "pending") {
      const approveBtn = document.createElement("button");
      approveBtn.className = "btn btn-sm btn-success";
      approveBtn.textContent = "Approve";
      approveBtn.onclick = async () => {
        await fetch(`/api/events/${ev.id}/approve`, { method: "POST" });
        loadEvents();
      };

      const rejectBtn = document.createElement("button");
      rejectBtn.className = "btn btn-sm btn-outline-danger";
      rejectBtn.textContent = "Reject";
      rejectBtn.onclick = async () => {
        await fetch(`/api/events/${ev.id}/reject`, { method: "POST" });
        loadEvents();
      };

      actions.appendChild(approveBtn);
      actions.appendChild(rejectBtn);
    }

    eventGrid.appendChild(card);
  });
}
