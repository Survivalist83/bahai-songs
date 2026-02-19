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

// Returns the contents of a specific query string. Returns null on errors.
function getQueryString(target) {
    const params = new URLSearchParams(window.location.search);
    const currentSong = params.get(target);
    return currentSong;
}

// Handles what to do when a key press is pressed (not mobile).
function keyPress(event) {
    switch (event) {
        case "h":
            returnHome();
        case "Escape":
            const sidebarToggle = document.getElementById("sidebar-toggle");
            sidebarToggle.checked = !sidebarToggle.checked;
            break;
        case "ArrowLeft":
        case "ArrowRight":
            arrowKey(event);
            break;
        case "a":
            sidebarOverlay("");
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

    // Shows/hides footer buttons
    const footerArray = [
        document.getElementById("sidebarPlaylistStartBtn"),
        document.getElementById("sidebarPlaylistEndBtn"),
        document.getElementById("sidebarPlaylistEditBtn"),
        document.getElementById("sidebarPlaylistSaveBtn"),
        document.getElementById("sidebarPlaylistCopyBtn"),
        document.getElementById("mainMenuPlaylistBack"),
        document.getElementById("mainMenuReturnHomeBtn"),
        document.getElementById("mainMenuPlaylistForward"),
    ]

    const footerArrayQuery = [
        document.querySelectorAll(".playlistViewerRow"),
    ]
    
    const booleanFooterArray = {
        "main":     [4, 3, 4, 3, 4, 0, 0, 0, 0],
        "song":     [4, 3, 1, 3, 4, 2, 2, 2, 0],
        "playlist": [3, 4, 1, 3, 4, 2, 2, 2, 0],
        "edit":     [1, 3, 3, 4, 4, 0, 0, 0, 1],
    }

    log(input);

    if (booleanFooterArray[input]) {
        for (let i = 0; i < footerArray.length; i++) {
            // All buttons that use 3 or 4 must always use those numbers. Otherwise, they must always use 0 or 2. In addition, any can use 1 no matter what.
            // 0: hide
            // 1: disable
            // 2: show
            // 3: offscreen
            // 4: onscreen
            switch (booleanFooterArray[input][i]) {
                case 0:
                    hide(footerArray[i]);
                    break;
                case 1:
                    show(footerArray[i]);
                    footerArray[i].disabled = true;
                    break;
                case 2:
                    show(footerArray[i]);
                    footerArray[i].disabled = false;
                    break;
                case 3:
                    footerArray[i].disabled = false;
                    footerArray[i].classList.remove("open");
                    break;
                case 4:
                    footerArray[i].disabled = false;
                    footerArray[i].classList.add("open");
                    break;
            }
        }

        for (let i = 0; i < footerArrayQuery.length; i++) {
            // 
            // 0: normal
            // 1: edit
            footerArrayQuery[i].forEach((row) => {
                switch (booleanFooterArray[input][i + footerArray.length]) {
                    case 0:
                        row.classList.remove("edit");
                        break;
                    case 1:
                        row.classList.add("edit");
                        break;
                }
            });
        }

        log("Successfully updated nav button visibility. Input is " + input + ".", "updateNavButtons");
    } else {
        log("Failed to update nav button visibility. Input is " + input + ".", + "updateNavButtons");
    }

    document.getElementById("footer-toggle").checked = input === "song" || input === "playlist";
    document.getElementById("position-indicator-toggle").checked = input === "playlist";
}


// Shows one specific song. When mode === "main", it goes to the homepage
function showSong(songNumber) {
    log("showSong called");
    // mode = changeModeSwitch(songNumber);
    // updateNavButtons(mode);

    document.querySelectorAll(".outerDiv").forEach(outerDiv => { hide(outerDiv); });

    if (mode === "song" || mode === "playlist") {
        show(document.getElementById("outerDiv" + songNumber));
    }

    // Shows/hides the main menu
    if (mode === "main") {
        show(document.getElementById("mainMenu"));
    } else {
        hide(document.getElementById("mainMenu"));
    }
}

// Sets which of the circles at the bottom of the screen is filled in
function updatePlaylistPositionIndicator(index) {
    const playlistPositionIndicatorCircleDiv = document.getElementById("playlistPositionIndicatorCircleDiv");
    playlistPositionIndicatorCircleDiv.replaceChildren();

    for (let i = 1; i < playlist.length + 1; i++) {
        const circle = document.createElement("p");

        if (index === i) {
            circle.innerHTML = "&#9679;";
            circle.classList.add("playlistPositionIndicatorCircle");
        } else {
            circle.innerHTML = "&#9675;";
            circle.classList.add("playlistPositionIndicatorCircle", "positionIndicatorFilled");
            (function(j) {
                circle.addEventListener("click", () => {
                    playlistSet(j);
                })
            })(i);
        }

        playlistPositionIndicatorCircleDiv.appendChild(circle);
    }

    // document.getElementById("playlistPositionIndicator").innerHTML = innerText
}

// This is an easy way of changing what the mainMenuBtns do without changing their event listeners.
function mainMenuBtnClicked(id) {
    log("mainMenuBtn has been clicked. ID: " + id + ", mode: " + mode + ".");
    if (mode !== "create") {
        mode = "song";
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

// Logs something. For production, change the all of verbosity to false to hide console logs9.
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
    }

    if (origin === undefined || verbosity[origin]) {
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
        console.log("Failed to copy text to clipboard: " + text);
    }
}