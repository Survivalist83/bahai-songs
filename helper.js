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
                "If you are an end-user, it is highly improbable that you are seeing this message." +
                "If this error pops up, please email benmaxtennant@gmail.com to ask him to fix it.");
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
        document.getElementById("sidebarToggleBtn"),
        document.getElementById("sidebarPlaylistEditBtn"),
        document.getElementById("sidebarPlaylistSaveBtn"),
        document.getElementById("sidebarPlaylistCopyBtn"),
        document.getElementById("footerPlaylistBack"),
        document.getElementById("footerReturnHomeBtn"),
        document.getElementById("footerPlaylistForward"),
        document.getElementById("footerPlaylistStart"),
        document.getElementById("footerPlaylistEdit"),
        document.getElementById("sidebarPlaylistViewer"),
        document.getElementById("sidebarPlaylistHowTo"),
    ]

    const footerArrayQuery = [
        document.querySelectorAll(".playlistViewerRow"),
    ]

    const booleanFooterArray = {
        "main":/* */[2, 4, 3, 4, 0, 0, 0, 2, 2, 3, 3, 0],
        "song":/* */[2, 1, 3, 4, 2, 2, 2, 0, 0, 3, 3, 0],
        "playlist": [2, 1, 3, 4, 2, 2, 2, 0, 0, 3, 3, 0],
        "edit":/* */[1, 3, 4, 3, 0, 0, 0, 0, 0, 4, 4, 1],
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

    if (input === "main" || input === "playlist" || input === "song") {
        document.getElementById("footer").classList.add("open");
    } else {
        document.getElementById("footer").classList.remove("open");
    }

    if (input === "playlist") {
        document.getElementById("positionIndicator").classList.add("open");
    } else {
        document.getElementById("positionIndicator").classList.remove("open");
    }

    const footerPlaylistStart = document.getElementById("footerPlaylistStart");
    const footerPlaylistEdit = document.getElementById("footerPlaylistEdit");
    if (playlist.length === 0) {
        footerPlaylistStart.classList.add("doubleHide");
        footerPlaylistEdit.classList.remove("doubleHide");
        document.getElementById("sidebarPlaylistCopyBtn").classList.remove("open");
    } else {
        footerPlaylistStart.classList.remove("doubleHide");
        footerPlaylistEdit.classList.add("doubleHide");
    }

    if (IS_PHONE) document.getElementById("sidebarToggleBtn").disabled = false;
}

function setSidebarVisibility(input) {
    const sidebar = document.getElementById("sidebar");
    const sidebarToggle = document.getElementById("sidebarToggleBtn");
    const sidebarShadow = document.getElementById("sidebarShadow");
    const mainMenu = document.getElementById("mainMenu");
    const contentDivChildren = [...document.getElementById("contentDiv").children];

    sidebarOverlay("");

    switch (input) {
        case "toggle":
            sidebar.classList.toggle("open");
            sidebarToggle.classList.toggle("open");
            sidebarShadow.classList.toggle("open");
            mainMenu.classList.toggle("sidebarPadding");
            contentDivChildren.forEach(song => {song.classList.toggle("sidebarPadding")});
            break;
        case "open":
            sidebar.classList.add("open");
            sidebarToggle.classList.add("open");
            sidebarShadow.classList.add("open");
            mainMenu.classList.add("sidebarPadding");
            contentDivChildren.forEach(song => {song.classList.add("sidebarPadding")});
            break;
        case "close":
            sidebar.classList.remove("open");
            sidebarToggle.classList.remove("open");
            sidebarShadow.classList.remove("open");
            mainMenu.classList.remove("sidebarPadding");
            contentDivChildren.forEach(song => {song.classList.remove("sidebarPadding")});
            break;
    }
}

// Shows one specific song. When mode === "main", it goes to the homepage
function showSong(songNumber, startLocation = 1) {
    log("ShowSong called with songNumber " + songNumber + " and startLocation " + startLocation + ". Mode is " + mode + ".", "showSong");

    switch(mode) {
        case "song":
            const queryStringS = songList.indexOf(getQueryString("s"));
            const location_s = queryStringS === -1 ? "main" : queryStringS;
            console.log("location_s: " + location_s);
            slideSong(songNumber, startLocation, 1);
            slideSong(location_s, 1, 2 - startLocation);
            break;
        case "playlist":
            // const location_s = songList.indexOf(getQueryString("s"));
            // const location_i = playlist[getQueryString("i") - 1];
            // const location_final = location_s === -1 ? location_i : location_s;
            
            // console.log("location_s: " + location_s + "\nlocation_i: " + location_i + "\nlocation_final: " + location_final);
            // slideSong(songNumber, startLocation, 1);
            // if (Number.isInteger(location_final)) { slideSong(location_final, 1, 2 - startLocation) };
            // break;

            // const location_i = playlist[getQueryString("i") + 2 - startLocation];
            // console.log("location_i: " + location_i);

            document.querySelectorAll(".setMiddle").forEach(outerDiv => {
                slideSong(outerDiv.id.slice(8) || "main", 1, 2 - startLocation);
            });

            slideSong(songNumber, startLocation, 1);
            // slideSong(location_i, 1, 2 - startLocation);
            break;
        default:
            document.querySelectorAll(".setMiddle").forEach(outerDiv => {
                slideSong(outerDiv.id.slice(8), 1, 2);
            });
            // if (mode === "main") { slideSong("main", 0, 1) }
            break;
    }

    // Shows/hides the main menu
    if (mode === "main") {
        slideSong("main", 0, 1);
    } else {
        if (document.getElementById("mainMenu").classList.contains("setMiddle")) { slideSong("main", 1, 0); }
    }
}

function slideSong(songIndex, start, end) {
    log("Sliding song " + songIndex + " from position " + start + " to position " + end + ".", "showSong");

    const song = songIndex === "main" ? document.getElementById("mainMenu") : document.getElementById("outerDiv" + songIndex);
    song.classList.remove("sliding");

    switch(start) {
        case 0:
            song.classList.add("setLeft");
            song.classList.remove("setMiddle");
            song.classList.remove("setRight");
            break;
        case 1:
            song.classList.remove("setLeft");
            song.classList.add("setMiddle");
            song.classList.remove("setRight");
            break;
        case 2:
            song.classList.remove("setLeft");
            song.classList.remove("setMiddle");
            song.classList.add("setRight");
            break;
    }

    requestAnimationFrame(() => {
        song.classList.add("sliding");
        switch(end) {
            case 0:
                song.classList.add("setLeft");
                song.classList.remove("setMiddle");
                song.classList.remove("setRight");
                break;
            case 1:
                song.classList.remove("setLeft");
                song.classList.add("setMiddle");
                song.classList.remove("setRight");
                break;
            case 2:
                song.classList.remove("setLeft");
                song.classList.remove("setMiddle");
                song.classList.add("setRight");
                break;
        }
    });

    // in theory, this is good code, but I didn't actually need it
    if (songIndex === "main") {
        setTimeout(() => {
            if (mode !== "main" && mode !== "edit") {
                // console.log("Removing mainMenu's sliding class! " + songIndex)
                song.classList.remove("sliding");
            }
        }, sliderSpeed * 1000);
    } else {
        // console.log("Doing nothing to mainMenu's sliding class.")
    }
}

// Sets which of the circles at the bottom of the screen is filled in
function updatePositionIndicator(index) {
    index = Number(index);
    const positionIndicatorDiv = document.getElementById("positionIndicatorDiv");
    positionIndicatorDiv.replaceChildren();

    for (let i = 1; i < playlist.length + 1; i++) {
        const circle = document.createElement("p");

        if (index === i) {
            circle.innerHTML = "&#9679;";
            circle.classList.add("positionIndicatorCircle");
        } else {
            circle.innerHTML = "&#9675;";
            circle.classList.add("positionIndicatorCircle", "empty");
            (function (j) {
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
    log("mainMenuBtn has been clicked. ID: " + id + ", mode: " + mode + ".", "mainMenu");
    if (mode !== "edit") {
        mode = "song";
        showSong(id, 2);
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

// Offsets position: absolute .sidebarBtn.moving elements when the scrollbar is present, so they are still centered
let sidebar;
let resizeObserver;
function checkSidebarScrollbar() {
    document.documentElement.style.setProperty("--sidebar-scrollbar-offset",
        (sidebar.scrollHeight > sidebar.clientHeight) ? "5px" : "0px");
}

function toggleChordVisibility(checkbox) {
    log("Toggling chord visibility!", "chords");
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