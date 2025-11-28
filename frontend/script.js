const addEventButton = document.getElementById("add-event-btn");
const formContainer  = document.getElementById("event-form-container");
const cancelButton = document.getElementById('cancel-event);
const eventForm = document.getElementById('event-form);
const evenetGrod = document.querySelector('.event-grid');                                           

//made a few changes here - chi
addEventButton.onClick = () => {
  formContainer.style.display = "block";   // show the form
};

//cancel event
cancelButton.onclick = () => {
  formContainer.style,display = 'block';
  );

// form submission, save, reload
  eventForm.onsubmit = async (e) => {
    e.preventDefault();
    const title = document.getElementById('event-title).value;
    const date = document.getElementById('event-date').value;
    const desc = document.getElementById('event-description').value;

    await fetch('/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, date, description: desc })
    });
    location.reload();
  };

  //load events when starting
  window.addEventListener('DOMContentLoaded', async() => {
    const res = await fetch(/'events');
    const events = await res.json();
    eventGrid.innerHTML = "";

    events.forEach((ev) => {
      const card = document.createElement("div");
      card.dataset.id = ev.id;
      card.innerHTML = '
        <h2>${ev.title}</h2>
        <small class="text-muted">${ev.date}</small>
        <p>${ev.description}</p>
        <button class="delete-btn btn btn-sm btn-outline-danger mt-2">Delete</button>
';
  event.Grid.appendChild(card);
});
attachDeleteHandlers();
});

//delete event
function attachDeleteHandlers() {
  document.querySelectorAll('delete-btn').forEach(btn =>
    btn.onclick = async (e) => {
      const card = e.target.closest('.event-card');
      const id = card.dataset.id;
      await fetch('/events/' + id, { method: 'DELETE' });
      card.remove();
    }
 );
}  
