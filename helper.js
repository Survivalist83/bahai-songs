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

function setMode(input) {
    if (typeof(input) === Number) {
        mode = "song";
        log("Successfully set mode to song due to the input being " + input + ".", "mode");
        return;
    }

    switch(input) {
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
                "If you are an end-user, it is highly improbable that you are seeing this message." +
                "If this error pops up, please email benmaxtennant@gmail.com to ask him to fix it.");
            return;
    }

    log("Successfully set mode to " + input + ".", "mode");
}

// Handles what to do when a key press is pressed (not mobile).
function keyPress(event) {
    switch (event) {
        case "h":
            returnHome();
        case "Escape":
            setSidebarVisibility("toggle");
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
    setMode("main");
    showSong("main");
    updateNavButtons("main");
    setQueryString([["s", ""], ["i", ""]]);
}

// Updates the visibility of the buttons at the bottom of the screen.
function updateNavButtons(input = mode) {
    log("Switching to nav button set " + input + ".", "updateNavButtons");

    // Shows/hides footer buttons
    const footerArray = [
        document.getElementById("sidebarPlaylistEditBtn"),
        document.getElementById("sidebarPlaylistSaveBtn"),
        document.getElementById("sidebarPlaylistCopyBtn"),
        document.getElementById("footerPlaylistBack"),
        document.getElementById("footerReturnHomeBtn"),
        document.getElementById("footerPlaylistForward"),
        document.getElementById("footerPlaylistStart"),
        document.getElementById("footerPlaylistEdit"),
    ]

    const footerArrayQuery = [
        document.querySelectorAll(".playlistViewerRow"),
    ]
    
    const booleanFooterArray = {
        "main":     [4, 3, 4, 0, 0, 0, 2, 2, 0],
        "song":     [1, 3, 4, 2, 2, 2, 0, 0, 0],
        "playlist": [1, 3, 4, 2, 2, 2, 0, 0, 0],
        "edit":     [3, 4, 3, 0, 0, 0, 0, 0, 1],
    }
    
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

    document.getElementById("footer-toggle").checked = input === "main" || input === "playlist" || input === "song";
    if (input === "playlist") {
        document.getElementById("positionIndicator").classList.add("open");
    } else {
        document.getElementById("positionIndicator").classList.remove("open");
    }

    if (playlist.length === 0) {
        footerArray[7].classList.remove("doubleHide");
        footerArray[6].classList.add("doubleHide");
    } else {
        footerArray[7].classList.add("doubleHide");
        footerArray[6].classList.remove("doubleHide");
    }
}

function setSidebarVisibility(input) {
    const sidebar = document.getElementById("sidebar");
    const sidebarToggle = document.getElementById("sidebarToggleBtn");
    const sidebarShadow = document.getElementById("sidebarShadow");
    const mainMenu = document.getElementById("mainMenu");
    const contentDiv = document.getElementById("contentDiv");
    sidebarOverlay("");
    switch(input) {
        case "toggle":
            sidebar.classList.toggle("open");
            sidebarToggle.classList.toggle("open");
            sidebarShadow.classList.toggle("open");
            mainMenu.classList.toggle("sidebarPadding");
            contentDiv.classList.toggle("sidebarPadding");
            break;
        case "open":
            sidebar.classList.add("open");
            sidebarToggle.classList.add("open");
            sidebarShadow.classList.add("open");
            mainMenu.classList.add("sidebarPadding");
            contentDiv.classList.add("sidebarPadding");
            break;
        case "close":
            sidebar.classList.remove("open");
            sidebarToggle.classList.remove("open");
            sidebarShadow.classList.remove("open");
            mainMenu.classList.remove("sidebarPadding");
            contentDiv.classList.remove("sidebarPadding");
            break;
    }
}

// Shows one specific song. When mode === "main", it goes to the homepage
function showSong(songNumber) {
    log("showSong called");
    // setMode(songNumber);
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
function updatePositionIndicator(index) {
    const positionIndicatorDiv = document.getElementById("positionIndicatorDiv");
    positionIndicatorDiv.replaceChildren();

    for (let i = 1; i < playlist.length + 1; i++) {
        const circle = document.createElement("p");

        if (index === i) {
            circle.innerHTML = "&#9679;";
            circle.classList.add("positionIndicatorCircle");
        } else {
            circle.innerHTML = "&#9675;";
            circle.classList.add("positionIndicatorCircle", "filled");
            (function(j) {
                circle.addEventListener("click", () => {
                    playlistSet(j);
                })
            })(i);
        }

        positionIndicatorDiv.appendChild(circle);
    }

    // document.getElementById("playlistPositionIndicator").innerHTML = innerText
}

// This is an easy way of changing what the mainMenuBtns do without changing their event listeners.
function mainMenuBtnClicked(id) {
    log("mainMenuBtn has been clicked. ID: " + id + ", mode: " + mode + ".");
    if (mode !== "edit") {
        mode = "song";
        showSong(id);
        updateNavButtons("song");
        setQueryString([["s", songList[id]]]);
    } else {
        playlist.push(id);
        setQueryString([["p", playlist.join("-")]]);
        updatePlaylistViewer();
        updatePositionIndicator(getQueryString("i") || 1);
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
        "mode": true,
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