// Returns the contents of a specific query string. Returns null on errors.
function getQueryString(target) {
    const params = new URLSearchParams(window.location.search);
    const currentSong = params.get(target);
    return currentSong;
}

// Sets a query string.
function setQueryString(queryStrings) {
    const params = new URLSearchParams(window.location.search);
    const oldParams = params.toString();

    log("About to set query strings: " + JSON.stringify(queryStrings), "queryString");

    for (let i = 0; i < queryStrings.length; i++) {
        if (queryStrings[i][1] !== "") {
            params.set(queryStrings[i][0], queryStrings[i][1]);
        } else {
            params.delete(queryStrings[i][0]);
        }
    }

    // No need to set the parameters to something they already are; this just unneccesarily creates lag and more in history
    if (oldParams === params.toString()) {
        log("From setQueryString(): returning due to already set params.", "queryString");
        return;
    }

    let newURL = "";
    if ([...params.entries()].length > 0) {
        newURL = "?" + params.toString();
    }

    window.history.pushState({}, "", window.location.pathname + newURL);
}

function setMode(input, verbose = true) {
    if (typeof (input) === Number) {
        mode = "song";
        if (verbose) log("Successfully set mode to song due to the input being " + input + ".", "mode");
        return;
    }

    switch (input) {
        case "main":
            mode = "main";
            break;
        case "song":
            mode = "song";
            break;
        case "playlist":
            mode = "playlist";
            break;
        case "edit":
            mode = "edit";
            break;
        default:
            window.alert("Warning! Attempt to set invalid mode (" + input + ").\n" +
                "If you are an end-user, it is highly improbable that you are seeing this message. " +
                "If this error pops up, please email sdbahaisongs@gmail.com.");
            return;
    }

    if (verbose) log("Successfully set mode to " + input + ".", "mode");
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

// A helper function for function loadSong() that creates a blank div for visual appeal/spacing.
function createBlankDiv() {
    const blankDiv = document.createElement("div");
    blankDiv.classList.add("blankDiv");
    return blankDiv;
}

// Logs something. For production, change the all of verbosity to false to hide console logs.
function log(text, origin) {
    const verbosity = {
        "pageLoad": true,
        "popstate": true,
        "mainMenu": false,
        "playlist": true,
        "updateNavButtons": false,
        "misc": true,
        "queryString": false,
        "clipboard": true,
        "mode": true,
        "showSong": true,
        "chords": true,
    }

    if (origin === undefined) {
        console.log(text + " no origin");
    } else if (verbosity[origin]) {
        console.log(text);
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
        log("Copied text to clipboard: " + text, "clipboard");
    } catch (err) {
        log("Failed to copy text to clipboard: " + text, "clipboard");
    }
}