let songList = [];
let songListSorted = [];
let songListAlphabetical = [];
const PHONE_PC_PIXEL_WIDTH_BREAKPOINT = 1000;
const IS_PHONE = window.innerWidth < PHONE_PC_PIXEL_WIDTH_BREAKPOINT;

let mode;
let songLocations = new Map();

const appState = {
    queryStrings: Object.fromEntries(new URLSearchParams(window.location.search)),    
    currentSong: 0,
}

let footer;
let positionIndicator;
const songs = [];
let playlist = new Playlist();

const verbosity = {
    pageLoad: true,
    popstate: true,
    mainMenu: false,
    playlist: true,
    updateNavButtons: false,
    misc: true,
    queryString: false,
    clipboard: true,
    mode: false,
    showSong: true,
    chords: true,
}

/////////////////////////////////////////////////////////////////////////////
//////////////////////////////// Class stuff ////////////////////////////////
/////////////////////////////////////////////////////////////////////////////

function main() {
    footer = new Footer([
        {
            "text": "<",
            "onclick": () => arrowKey('ArrowLeft'),
            "modes": ["song", "playlist"],
        },
        {
            "text": "Home",
            "onclick": () => returnHome(),
            "modes": ["song", "playlist"],
        },
        {
            "text": ">",
            "onclick": () => arrowKey('ArrowRight'),
            "modes": ["song", "playlist"],
        },
        {
            "text": "Start Playlist",
            "onclick": () => playlistStart(),
            "modes": ["main"],
            "condition": () => playlist.length() !== 0,
        },
        {
            "text": "Create Playlist",
            "onclick": () => playlistEdit(),
            "modes": ["main"],
            "condition": () => playlist.length() === 0,
        },
    ]);

    positionIndicator = new PositionIndicator();
    positionIndicator.update(1);
    
    BAHAI_SONGS_DATA.forEach((song, index) => {
        songList.push(song.meta.name);
        songs.push(new Song(index, appState.queryStrings.s === song.meta.name));
    });
}

/////////////////////////////////////////////////////////////////////////////
////////////////////////////// Non-class stuff //////////////////////////////
/////////////////////////////////////////////////////////////////////////////

// used to in category-column assignments
let NUM_OF_CATEGORY_COLUMNS;
const THRESHHOLD_ADJUSTER = 3; // bigger number = more songs in later columns

let mainMenu;

const styles = getComputedStyle(document.documentElement);
let sliderSpeed = parseFloat(styles.getPropertyValue("--slider-speed").trim());

// Page load stuff used to be here

function toggleMainMenu(checkbox) {
    const mainMenuAlphabetized = document.getElementById("mainMenuAlphabetized");
    const mainMenuCategorized = document.getElementById("mainMenuCategorized");

    if (checkbox.checked) {
        mainMenuAlphabetized.classList.add("hide");
        mainMenuCategorized.classList.remove("hide");
    } else {
        mainMenuAlphabetized.classList.remove("hide");
        mainMenuCategorized.classList.add("hide");
    }
}

// Playlist stuff used to be here

// Sidebar stuff used to be here


// Returns to the home page, as if no query strings were entered on page load.
function returnHome() {
    setMode("main");
    showSong("main");
    updateNavButtons("main");
    setQueryString({s: "", i: ""});
}

// Updates the visibility of the buttons at the bottom of the screen.
function updateNavButtons(input = mode) {
    if (verbosity.updateNavButtons) console.log("Switching to nav button set " + input + ".");

    // Shows/hides footer buttons
    const footerArray = [
        document.getElementById("sidebarToggleBtn"),
        document.getElementById("sidebarPlaylistEditBtn"),
        document.getElementById("sidebarPlaylistSaveBtn"),
        document.getElementById("sidebarPlaylistCopyBtn"),
        document.getElementById("sidebarPlaylistViewer"),
        document.getElementById("sidebarPlaylistHowTo"),
    ]

    const footerArrayQuery = [
        document.querySelectorAll(".playlistViewerRow"),
    ]

    const booleanFooterArray = {
        "main":/* */[2, 4, 3, 4, 3, 3, 0],
        "song":/* */[2, 1, 3, 4, 3, 3, 0],
        "playlist": [2, 1, 3, 4, 3, 3, 0],
        "edit":/* */[1, 3, 4, 3, 4, 4, 1],
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

        if (verbosity.updateNavButtons) console.log("Successfully updated nav button visibility. Input is " + input + ".");
    } else {
        if (verbosity.updateNavButtons) console.log("Failed to update nav button visibility. Input is " + input + ".");
    }

    if (input === "playlist") {
        positionIndicator.show();
    } else {
        positionIndicator.hide();
    }

    if (playlist.length() === 0) {
        document.getElementById("sidebarPlaylistCopyBtn").classList.remove("open");
    }

    if (IS_PHONE) document.getElementById("sidebarToggleBtn").disabled = false;
}

// Shows one specific song. When mode === "main", it goes to the homepage
function showSong(songNumber, startLocation = 1) {
    if (verbosity.showSong) console.log("showSong() Song: " + songNumber + ". Start: " + startLocation + ". Mode: " + mode + ".");

    switch(mode) {
        case "song":
            songs[songNumber].slide(1, startLocation);

            if (songList.indexOf(appState.queryStrings.s) !== -1) {
                songs[songList.indexOf(appState.queryStrings.s)].slide(2 - startLocation);
            }

            break;
        case "playlist":
            songs.forEach((song) => {
                song.slideConditional(2 - startLocation, 1);
            });

            songs[songNumber].slide(1, startLocation);

            break;
        default:
            songs.forEach((song) => {
                song.slideConditional(2, 1);
            });

            break;
    }

    // Shows/hides the main menu
    if (mode === "main") {
        slideMain(0, 1);
    } else if (mode !== "main" && document.getElementById("mainMenu").classList.contains("setMiddle")) {
        slideMain(1, 0);
    }

    footer.setMode()
}

function slideMain(start, end) {
    if (verbosity.showSong) console.log("Sliding main: " + start + " => " + end);

    mainMenu.classList.remove("sliding");
    slideObject(mainMenu, start);

    requestAnimationFrame(() => {
        mainMenu.classList.add("sliding");
        slideObject(mainMenu, end);
    });
}

// This is an easy way of changing what the mainMenuBtns do without changing their event listeners.
function mainMenuBtnClicked(id) {
    if (verbosity.mainMenu) console.log("mainMenuBtn has been clicked. ID: " + id + ", mode: " + mode + ".");
    if (mode !== "edit") {
        mode = "song";
        showSong(id, 2);
        updateNavButtons("song");
        setQueryString({s: songList[id]});
    } else {
        playlist.add(id);
        updatePlaylistViewer();
        positionIndicator.update(appState.queryStrings.i || 1);
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