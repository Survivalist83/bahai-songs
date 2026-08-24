// This file is for handling user inputs - key presses, functions that run on event listeners, etc

// Handles what to do when a key press is pressed (not mobile).
function keyPress(event) {
    switch (event) {
        case "h":
            setMode("main");
            break;
        case "Escape":
            sidebar.toggle();
            break;
        case "ArrowLeft":
        case "ArrowRight":
            arrowKey(event);
            break;
    }
}

// What happens when clicking an arrow key, swiping, etc
function arrowKey(input) {
    if (verbosity.misc) console.log("\n\narrowKey() called. Mode is " + appState.mode + ", input is " + input + ".");
    switch (appState.mode) {
        case "song":
            const songListSorted = appState.mainMenu === "Alphabetized" ? songListAlphabetical : songListCategorized;
            const CURRENT_SONG = songListSorted.indexOf(appState.queryStrings.s);
            const NEXT_SONG = CURRENT_SONG + (input === "ArrowLeft" ? -1 : 1);
            const START_LOCATION = input === "ArrowLeft" ? 0 : 2;
            if (NEXT_SONG === -1) {
                showSong(songList.indexOf(songListSorted.at(-1)), START_LOCATION);
                // setQueryString({s: songListSorted.at(-1)});
            } else if (NEXT_SONG === songListSorted.length) {
                showSong(songList.indexOf(songListSorted[0]), START_LOCATION);
                // setQueryString({s: songListSorted[0]});
            } else {
                showSong(songList.indexOf(songListSorted[NEXT_SONG]), START_LOCATION);
                // setQueryString({s: songListSorted[NEXT_SONG]});
            }
            break;
        case "playlist":
            const numberOfAdvances = input === "ArrowLeft" ? -1 : 1;
            playlist.setIndex(Number(playlist.getIndex() || 1) + numberOfAdvances);
            break;
        default:
            if (verbosity.misc) console.log("Error: not in mode song or playlist. Arrow keys do nothing.");
    }
}

// Handles copying the page URL with sidebarPlaylistCopyBtn
async function copyLink(element) {
    const text = window.location.href;

    try {
        await navigator.clipboard.writeText(text);

        element.textContent = "Copied!";
        element.disabled = true;
        element.classList.add("disabled");

        setTimeout(() => {
            element.textContent = "Copy Link";
            element.disabled = false;
            element.classList.remove("disabled");
        }, 1500);
    } catch (err) {
        console.log("Failed to copy text to clipboard. Error below. Text: " + text);
        console.log(err);
    }
}

function toggleChordVisibility(checkbox) {
    if (verbosity.chords) console.log("Toggling chord visibility!");
    const fadesWithChords = document.querySelectorAll(".fadesWithChords");
    const shrinksWithChords = document.querySelectorAll(".shrinksWithChords");
    const appearWithChords = document.querySelectorAll(".appearWithChords");
    const growWithChords = document.querySelectorAll(".growWithChords");

    if (checkbox.checked) {
        fadesWithChords.forEach(chord => chord.classList.add("fade"));
        shrinksWithChords.forEach(chord => chord.classList.add("shrink"));
        appearWithChords.forEach(chord => chord.classList.remove("fade"));
        growWithChords.forEach(chord => chord.classList.remove("shrink"));
    } else {
        fadesWithChords.forEach(chord => chord.classList.remove("fade"));
        shrinksWithChords.forEach(chord => chord.classList.remove("shrink"));
        appearWithChords.forEach(chord => chord.classList.add("fade"));
        growWithChords.forEach(chord => chord.classList.add("shrink"));
    }
}

function stopSliding(checkbox) {
    sliderSpeed = checkbox.checked ? "0s" : "0.65s";
    document.documentElement.style.setProperty("--slider-speed", sliderSpeed);
}

function toggleMainMenu() {
    menuCategorized.toggle();
    menuAlphabetized.toggle();
}