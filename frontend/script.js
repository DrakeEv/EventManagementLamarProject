const addEventButton = document.getElementById("add-event-btn");
const formContainer  = document.getElementById("event-form-container");

addEventButton.addEventListener("click", () => {
  formContainer.style.display = "block";   // show the form
});