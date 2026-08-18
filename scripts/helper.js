// Sets a query string.
function setQueryString(newQueryStrings) {
    if (verbosity.queryString) console.log("Setting query strings: " + JSON.stringify(newQueryStrings));

    let isDifferent = false;
    Object.entries(newQueryStrings).forEach((newQueryString) => {
        if (appState.queryStrings[newQueryString[0]] !== newQueryString[1]) {
            appState.queryStrings[newQueryString[0]] = newQueryString[1] ? newQueryString[1] : "";
            isDifferent = true;
        }
    });

    if (isDifferent) {
        history.pushState({}, "",
            location.pathname + "?" +
            new URLSearchParams(Object.fromEntries(Object.entries(appState.queryStrings)
            .filter(([key, value]) => value && (key !== "n" || value !== 3)))));
    }
}

// Handles what to do when a key press is pressed (not mobile).
function keyPress(event) {
    switch (event) {
        case "h":
            setMode("main");
            break;
        case "Escape":
            sidebarObject.toggle();
            break;
        case "ArrowLeft":
        case "ArrowRight":
            arrowKey(event);
            break;
        case "a":
            sidebarObject.setButtons("song")
    }
}

// Copies the text to the clipboard
async function clipboardCopy(text) {
    try {
        await navigator.clipboard.writeText(text);
        if (verbosity.clipboard) console.log("Copied text to clipboard: " + text);
    } catch (err) {
        if (verbosity.clipboard) console.log("Failed to copy text to clipboard: " + text);
    }
}

function slideObject(object, position) {
    const positions = ["setLeft", "setMiddle", "setRight"];
    const selectedPosition = positions[position];

    if (selectedPosition) {
        object.classList.remove(...positions);
        object.classList.add(selectedPosition);
    }
}
