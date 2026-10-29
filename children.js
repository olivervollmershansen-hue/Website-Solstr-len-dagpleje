
let children = [];

const form = document.getElementById("childForm");
const childrenList = document.getElementById("childrenList");
const childToRemove = document.getElementById("childToRemove");
const removeChildButton = document.getElementById("removeChildButton");

// TILFØJ ET BARN
form.addEventListener("submit", function(event) {
    event.preventDefault();

    const name = document.getElementById("name").value.trim();
    const startDate = document.getElementById("startDate").value;
    const endDate = document.getElementById("endDate").value;

    if (!name || !startDate || !endDate) {
        return;
    }

    if (endDate < startDate) {
        alert("Slutdato skal være efter startdato.");
        return;
    }

    const child = {
        id: crypto.randomUUID(),
        name: name,
        startDate: startDate,
        endDate: endDate
    };

    children.push(child);

    showChildren();
    form.reset();
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

    if (confirmed) {
        children = children.filter(function(c) {
            return c.id !== selectedId;
        });

        showChildren();
    }
});
