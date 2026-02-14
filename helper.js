// Sets a query string.
function setQueryString(queryStrings) {
    const params = new URLSearchParams(window.location.search);
    const oldParams = params.toString();

    for (let i = 0; i < queryStrings.length; i++) {
        if (queryStrings[i][1] !== "") {
            params.set(queryStrings[i][0], queryStrings[i][1]);
        } else {
            params.delete(queryStrings[i][0]);
        }
    }

    // No need to set the parameters to something they already are; this just unneccesarily creates lag and more in history
    if (oldParams === params.toString()) {
        log("From setQueryString(): returning due to already set params.");
        return;
    }
    
    let newURL = "";
    if ([...params.entries()].length > 0) {
        newURL = "?" + params.toString();
    }

    window.history.pushState({}, "", window.location.pathname + newURL);
}

// Returns the contents of a specific query string. Returns null on errors.
function getQueryString(target) {
    const params = new URLSearchParams(window.location.search);
    const currentSong = params.get(target);
    return currentSong;
}

// Handles what to do when a key press is pressed (not mobile).
function keyPress(event) {
    switch (event) {
        case "Escape":
            returnHome();
            break;
        case "ArrowRight":
            playlistAdvance(1);
            break;
        case "ArrowLeft":
            playlistAdvance(-1);
            break;
        case "a":
            const params = new URLSearchParams(window.location.search);
            log(params.get("s") + " typeof " + typeof(params.get("s")));
    }
}

// Returns to the home page, as if no query strings were entered on page load.
function returnHome() {
    mode = "main";
    showSong("main");
    updateNavButtons("main");
    setQueryString([["s", ""], ["i", ""]]);
}

// Sets global variable "mode" depending on input. Don't use this like "changeModeSwitch('main')", instead just do "mode = 'main'"
function changeModeSwitch(input) {
    let mode;
    switch(input) {
        case "main":
            mode = "main";
            break;
        case "create":
            mode = "create";
            break;
        case "playlist":
            mode = "playlist";
            break;
        default:
            mode = "song";
            break;
    }
    // log("changeModeSwitch() mode changed successfully, now: " + mode + ".");
    return mode;
}

// Updates the visibility of the buttons at the bottom of the screen.
function updateNavButtons(input) {
    const mainMenuPlaylistStartBtn = document.getElementById("mainMenuPlaylistStartBtn");
    const mainMenuPlaylistCreateBtn = document.getElementById("mainMenuPlaylistCreateBtn");
    const mainMenuPlaylistFinishBtn = document.getElementById("mainMenuPlaylistFinishBtn");
    const mainMenuPlaylistBack = document.getElementById("mainMenuPlaylistBack");
    const mainMenuReturnHomeBtn = document.getElementById("mainMenuReturnHomeBtn");
    const mainMenuPlaylistForward = document.getElementById("mainMenuPlaylistForward");
    log("updating nav button visibility");
    switch(input) {
        case "main":
            show(mainMenuPlaylistStartBtn);
            show(mainMenuPlaylistCreateBtn);
            hide(mainMenuPlaylistFinishBtn);
            hide(mainMenuPlaylistBack);
            hide(mainMenuReturnHomeBtn);
            hide(mainMenuPlaylistForward);
            break;
        case "song":
            hide(mainMenuPlaylistStartBtn);
            hide(mainMenuPlaylistCreateBtn);
            hide(mainMenuPlaylistFinishBtn);
            hide(mainMenuPlaylistBack);
            show(mainMenuReturnHomeBtn);
            hide(mainMenuPlaylistForward);
            break;
        case "playlist":
            hide(mainMenuPlaylistStartBtn);
            hide(mainMenuPlaylistCreateBtn);
            hide(mainMenuPlaylistFinishBtn);
            show(mainMenuPlaylistBack);
            show(mainMenuReturnHomeBtn);
            show(mainMenuPlaylistForward);
            break;
        case "create":
            setQueryString([["s", "create"]]);
            hide(mainMenuPlaylistStartBtn);
            hide(mainMenuPlaylistCreateBtn);
            show(mainMenuPlaylistFinishBtn);
            hide(mainMenuPlaylistBack);
            hide(mainMenuReturnHomeBtn);
            hide(mainMenuPlaylistForward);
            break;
        default:
            log("changeMode() Uncaught input: " + mode + ".");
            break;
    }
}

// Shows one specific song. When mode === "main", it goes to the homepage
function showSong(songNumber) {
    log("showSong called");
    mode = changeModeSwitch(songNumber);
    // updateNavButtons(mode);

    document.querySelectorAll(".outerDiv").forEach(outerDiv => { hide(outerDiv); });

    if (mode === "song") {
        show(document.getElementById("outerDiv" + songNumber));
    }

    // Shows/hides the main menu
    if (mode === "main" | songNumber === "playlist") {
        show(document.getElementById("mainMenu"));
    } else {
        hide(document.getElementById("mainMenu"));
    }
}

// This is an easy way of changing what the mainMenuBtns do without changing their event listeners.
function mainMenuBtnClicked(id) {
    log("mainMenuBtn has been clicked. ID: " + id + ", mode: " + mode + ".");
    if (mode !== "create") {
        showSong(id);
        updateNavButtons("song");
        setQueryString([["s", songList[id]]]);
    } else {
        playlistAdd(id);
    }
}

// A helper function for function loadSong() that creates a blank div for visual appeal/spacing.
function createBlankDiv() {
    const blankDiv = document.createElement("div");
    blankDiv.classList.add("blankDiv");
    return blankDiv;
}

// Logs something. For production, change the variable "verbose" to false.
function log(text) {
    if (verbose) {
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