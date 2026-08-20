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
        case "a":
            playlist.setViewer();
        case "s":
            playlist.remove(2);
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

function toggleMainMenu(checkbox) {
    menuCategorized.toggle();
    menuAlphabetized.toggle();
}