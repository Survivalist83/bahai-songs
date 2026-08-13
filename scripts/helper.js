// Sets a query string.
function setQueryString(newQueryStrings) {
    if (verbosity.queryString) console.log("Setting query strings: " + JSON.stringify(newQueryStrings));

    let isDifferent = false;
    Object.entries(newQueryStrings).forEach((newQueryString) => {
        if (appState.queryStrings[newQueryString[0]] !== newQueryString[1]) {
            appState.queryStrings[newQueryString[0]] = newQueryString[1] === "" ? null : newQueryString[1];
            isDifferent = true;
        }
    });

    if (isDifferent) {
        const newParams = Object.values(appState.queryStrings).every(value => !value) ? "" : `?${new URLSearchParams(appState.queryStrings)}`;
        history.pushState({}, "", location.pathname + newParams);
    }
}

function setMode(input) {
    if (typeof (input) === Number) {
        mode = "song";
        if (verbosity.mode) console.log("Successfully set mode to song due to the input being " + input + ".");
        return;
    }

    const validModes = ["main", "song", "playlist", "edit"];
    if (validModes.includes(input)) {
        mode = input;
    } else {
        console.log("Warning! Attempt to set invalid mode (" + input + ").\n" +
            "If you are an end-user, it is highly improbable that you are seeing this message. " +
            "If this error pops up, please email sdbahaisongs@gmail.com.");
    }

    footer.setMode();

    if (verbosity.mode) console.log("Successfully set mode to " + input + ".");
}

// Handles what to do when a key press is pressed (not mobile).
function keyPress(event) {
    switch (event) {
        case "h":
            returnHome();
            break;
        case "Escape":
            setSidebarVisibility("toggle");
            break;
        case "ArrowLeft":
        case "ArrowRight":
            arrowKey(event);
            break;
    }
}

// Shows the element (keeping block/flex display).
function show(element) {
    element.classList.remove("hide");
}

// Hides the element.
function hide(element) {
    element.classList.add("hide");
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