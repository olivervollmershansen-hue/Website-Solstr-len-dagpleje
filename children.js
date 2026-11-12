
let children = [];


const form = document.getElementById("childForm");
const childrenList = document.getElementById("childrenList");
const childToRemove = document.getElementById("childToRemove");
const removeChildButton = document.getElementById("removeChildButton");

// HENT BØRN FRA NEON-DATABASEN
async function loadChildren() {
    try {
        const response = await fetch("/api/children");

        if (!response.ok) {
            throw new Error("Kunne ikke hente børn fra databasen");
        }

        const data = await response.json();

        children = data.map(function(child) {
            return {
                id: String(child.id),
                name: child.name,
                startDate: child.start_date.slice(0, 10),
                endDate: child.end_date.slice(0, 10)
            };
        });

        showChildren();

    } catch (error) {
        console.error("Fejl ved hentning af børn:", error);
    }
}

loadChildren();


 // TILFØJ ET BARN
form.addEventListener("submit", async function(event) {
    event.preventDefault();

    const name = document.getElementById("name").value.trim();
    const startDate = document.getElementById("startDate").value;
    const endDate = document.getElementById("endDate").value;

    // Kontrollér at alle felter er udfyldt.
    if (!name || !startDate || !endDate) {
        alert("Du skal udfylde alle felter.");
        return;
    }

    // Kontrollér at slutdatoen ikke ligger før startdatoen.
    if (endDate < startDate) {
        alert("Slutdato skal være efter startdato.");
        return;
    }

    try {
        // Send barnets oplysninger til serveren.
        const response = await fetch("/api/children", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                name: name,
                startDate: startDate,
                endDate: endDate
            })
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || "Kunne ikke tilføje barnet.");
        }

        // Hent den opdaterede liste fra databasen.
        await loadChildren();

        // Ryd formularen.
        form.reset();

        alert("Barnet blev tilføjet.");

    } catch (error) {
        console.error("Fejl ved tilføjelse af barn:", error);
        alert(error.message);
    }
});


// VIS ALLE BØRN
function showChildren() {
    childrenList.innerHTML = "";
    childToRemove.innerHTML = '<option value="">Vælg et barn</option>';

    children.forEach(function(child) {
        // Vis barnet på listen
        const li = document.createElement("li");
        li.textContent = child.name + " (" +
            child.startDate + " - " + child.endDate + ")";

        childrenList.appendChild(li);

        // Tilføj barnet til dropdown-menuen
        const option = document.createElement("option");
        option.value = child.id;
        option.textContent = child.name;

        childToRemove.appendChild(option);
    });
}

// FJERN ET BARN FRA DATABASEN
removeChildButton.addEventListener("click", async function() {
// FJERN ET BARN
removeChildButton.addEventListener("click", function() {
    const selectedId = childToRemove.value;

    if (!selectedId) {
        alert("Du skal først vælge et barn.");
        return;
    }

    const child = children.find(function(c) {
        return c.id === selectedId;
    });

    if (!child) return;

    const confirmed = confirm(
        "Er du sikker på, at du vil fjerne " + child.name + "?"
    );

    if (!confirmed) return;

    try {
        // Send en DELETE-forespørgsel til serveren.
        const response = await fetch("/api/children/" + selectedId, {
            method: "DELETE"
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || "Kunne ikke fjerne barnet.");
        }

        // Hent den opdaterede liste fra databasen.
        await loadChildren();

        alert("Barnet blev fjernet.");

    } catch (error) {
        console.error("Fejl ved sletning af barn:", error);
        alert(error.message);
    if (confirmed) {
        children = children.filter(function(c) {
            return c.id !== selectedId;
        });

        showChildren();
    }
});

