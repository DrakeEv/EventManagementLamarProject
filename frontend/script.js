//get who is using the site (student, organizer, admin)

//gets name and role entered during login if entered before
//otherwise just leaves the space empty until a login is made
function getCurrentUser() {
  return {
    name: localStorage.getItem("ems_name") || "",
    role: localStorage.getItem("ems_role") || "student",
  };
}

//takes ui from index.html for manipulation
//where users type their name
const nameInput      = document.getElementById("user-name");
//where users choose their role
const roleSelect     = document.getElementById("user-role");
//option to log out
const logoutBtn      = document.getElementById("logout-btn");
//button to add an event (organizer/admin only)
const addEventBtn    = document.getElementById("add-event-btn");
//where events display
const eventGrid      = document.getElementById("event-grid");
//shows no events if none are available
const noEventsMsg    = document.getElementById("no-events-msg");
//filters for event type
const filterCategory = document.getElementById("filter-category");
//filters for date
const filterFrom     = document.getElementById("filter-from");
//button to apply the filters
const applyFilters   = document.getElementById("apply-filters");

//event form
//card for event form which is hidden until needed
const formCard       = document.getElementById("event-form-container");
//where organizer/admin will input event info
const formElement    = document.getElementById("event-form");
//add event to edit event 
const formTitle      = document.getElementById("event-form-title");

//input fields for events
//hidden field used when editing event
const fieldId        = document.getElementById("event-id");
//title of event
const fieldTitle     = document.getElementById("event-title");
//event date
const fieldDate      = document.getElementById("event-date");
//what type of event
const fieldCategory  = document.getElementById("event-category");
//description of event
const fieldDesc      = document.getElementById("event-description");
//cancel the event and it does not save
const cancelFormBtn  = document.getElementById("cancel-event");

//check if user has logged in when page loads
window.addEventListener("DOMContentLoaded", () => {
  const user = getCurrentUser();
  // if a name isnt saved already user is brought to login page
  if (!user.name) {
    window.location.href = "login.html";
    return;
  }
  //if user already logged in before they remain logged in
  nameInput.value = user.name;
  //also saves the role chosen at initial login
  roleSelect.value = user.role;
  updateRoleUI();
  loadEvents();
});

//shows or hides features based on role 
function updateRoleUI() {
  const { role } = getCurrentUser();
  //organizers and admins are the only ones who can manage events
  const canManage = role === "organizer" || role === "admin";
  if (canManage) addEventBtn.classList.remove("d-none");
    //students do not have the option to manage events
  else addEventBtn.classList.add("d-none");
}

//updates and saves name if changed
nameInput.addEventListener("change", () => {
  const name = nameInput.value.trim();
  //prevent saving a blank name
  localStorage.setItem("ems_name", name);
});

//updates and saves role if changed
roleSelect.addEventListener("change", () => {
  const role = roleSelect.value;
  localStorage.setItem("ems_role", role);
  updateRoleUI();
  loadEvents();
});

//logout option
//remove user info from storage
logoutBtn.addEventListener("click", () => {
  localStorage.removeItem("ems_name");
  localStorage.removeItem("ems_role");
  //sent back to login page 
  window.location.href = "login.html";
});

//add event
addEventBtn.addEventListener("click", () => {
  //clear ID
  fieldId.value = "";
  //clear title
  fieldTitle.value = "";
  //clear date 
  fieldDate.value = "";
  //clear catagory
  fieldCategory.value = "";
  //clear description
  fieldDesc.value = "";
  
  formTitle.textContent = "Add New Event";
  formCard.classList.remove("d-none");
});

//cancel button will hide event form
cancelFormBtn.addEventListener("click", () => {
  formCard.classList.add("d-none");
});

//when filters are applied user will only be shown events with chosen filters
applyFilters.addEventListener("click", () => {
  loadEvents();
});

//when event is submitted it is sent to backend using node.js apis
formElement.addEventListener("submit", async (e) => {
  //prevents page from reloading entirely when events are submitted
  e.preventDefault();
  //store values in the form (title, date, category, description)
  const payload = {
    title: fieldTitle.value.trim(),
    date: fieldDate.value,
    category: fieldCategory.value,
    description: fieldDesc.value.trim(),
  };

  //checks if anything was left blank and will cause pop-up if so
  if (!payload.title || !payload.date || !payload.category || !payload.description) {
    alert("All fields are required.");
    return;
  }

  // if id exists means its updating but if no id exists it creates a new one
  const id = fieldId.value;
  const url = id ? `/api/events/${id}` : "/api/events";
  const method = id ? "PUT" : "POST";

  //send data to backend for sqlite to save to events.db
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    //incase something goes wrong with event submission
    alert("Error saving event.");
    return;
  }
  //hides form after success
  formCard.classList.add("d-none");
  //reloads events to show the new event available
  loadEvents();
});

//loads events from sqlite events.db using node and express
async function loadEvents() {
  const user = getCurrentUser();
  //building URL params from filters that were selected
  const params = new URLSearchParams();
  if (filterCategory.value) params.set("category", filterCategory.value);
  if (filterFrom.value) params.set("from", filterFrom.value);
  //role limitations so students dont see rejected or pending events
  params.set("role", user.role);
  const res = await fetch(`/api/events?${params.toString()}`);
  if (!res.ok) {
     //log error without crashing page
    console.error("Failed to load events");
    return;
  }
  const events = await res.json();
  //convert database rows into cards to be seen on the page
  renderEvents(events);
}

//turns the events into cards to be seen
function renderEvents(events) {
  //no duplicate event cards
  eventGrid.innerHTML = "";
  //if there are no events display there are none
  if (!events.length) {
    //hide the no events message if events exist
    noEventsMsg.classList.remove("d-none");
    return;
  }
  noEventsMsg.classList.add("d-none");
  const user = getCurrentUser();

  //goes through events and creates card for each one
  events.forEach((ev) => {
    const card = document.createElement("div");
    card.className = "event-card";
     //fills with event info
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

    //students can only RSVP for approved events
    if (user.role === "student") {
      //RSVP button inserts name into database
      const rsvpBtn = document.createElement("button");
      rsvpBtn.className = "btn btn-sm btn-outline-primary";
      rsvpBtn.textContent = "RSVP";
      rsvpBtn.onclick = async () => {
        await fetch(`/api/events/${ev.id}/rsvp`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: user.name }),
        });
        //pop-up confirms it saved
        alert("RSVP recorded.");
      };
      //cancel RSVP removes name from the event list
      const cancelBtn = document.createElement("button");
      cancelBtn.className = "btn btn-sm btn-outline-secondary";
      cancelBtn.textContent = "Cancel RSVP";
      cancelBtn.onclick = async () => {
        await fetch(`/api/events/${ev.id}/cancel-rsvp`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: user.name }),
        });
        //pop-up confirms un-RSVP
        alert("RSVP cancelled.");
      };
      actions.appendChild(rsvpBtn);
      actions.appendChild(cancelBtn);
    }

    //organizer/admin can edit and delete events
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
      //removes event from events.db
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

    //only shows option to approve/reject if event is pending for admins
    if (user.role === "admin" && ev.status === "pending") {
      //flips the event status so students will see it
      const approveBtn = document.createElement("button");
      approveBtn.className = "btn btn-sm btn-success";
      approveBtn.textContent = "Approve";
      approveBtn.onclick = async () => {
        await fetch(`/api/events/${ev.id}/approve`, { method: "POST" });
        //makes it live for students after approval
        loadEvents();
      };
    //flips status so students dont see the event
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
//place the finished card into the grid
    eventGrid.appendChild(card);
  });
}
