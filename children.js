
let children = []; // let children

const form = document.getElementById("childForm");
const childrenList = document.getElementById("childrenList"); //henter de tre værdier fra html-formular

form.addEventListener("submit", function(event) {
    event.preventDefault();

    // Hent de værdier, ejeren har indtastet
    const name = document.getElementById("name").value.trim();
    const startDate = document.getElementById("startDate").value;
    const endDate = document.getElementById("endDate").value;

    // Kontrollér datoerne
    if (endDate < startDate) {
        alert("Slutdato skal være efter startdato.");
        return;
    }

    // Opret et barn
    const child = {
        id: crypto.randomUUID(),
        name: name,
        startDate: startDate,
        endDate: endDate
    };

    // Tilføj barnet til listen
    children.push(child);

    // Vis barnet på hjemmesiden
    const li = document.createElement("li");
    li.textContent = name + " (" + startDate + " - " + endDate + ")";

    childrenList.appendChild(li);

    // Tøm formularen
    form.reset();
});
