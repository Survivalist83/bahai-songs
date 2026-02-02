function setQueryString(queryStrings) {
    const params = new URLSearchParams(window.location.search);

    for (let i = 0; i < queryStrings.length; i++) {
        if (queryStrings[i][1] !== "") {
            params.set(queryStrings[i][0], queryStrings[i][1]);
        } else {
            params.delete(queryStrings[i][0]);
        }
    }
    
    let newURL = "";
    if ([...params.entries()].length > 0) {
        newURL = "?" + params.toString();
    }

    window.history.pushState({}, "", window.location.pathname + newURL);
}

// Returns the contents of a specific query string. Returns -1 on errors.
function getQueryString(target) {
    const params = new URLSearchParams(window.location.search);
    const currentSong = params.get(target) ?? -1;
    return currentSong;
}

// Handles what to do when a key press is pressed (not mobile)
function keyPress(event) {
    switch (event) {
        case "Escape":
            showSong(-1, true);
            setQueryString([["i", ""]]); // removes the i parameter when going to main menu (since it exits playback mode)
            break;
        case "ArrowRight":
            playlistAdvance(1);
            break;
        case "ArrowLeft":
            playlistAdvance(-1);
            break;
        case "a":
            log(getQueryString("p").split("-").map(Number));
    }
}

// A helper function for function loadSong() that creates a blank div for visual appeal/spacing.
function createBlankDiv() {
    const blankDiv = document.createElement("div");
    blankDiv.classList.add("blankDiv");
    return blankDiv;
}

function log(text) {
    if (verbose) {
        console.log(text);
    }
}