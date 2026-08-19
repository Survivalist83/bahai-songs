let songList = [];
let songListCategorized = [];
let songListAlphabetical = [];
const PHONE_PC_PIXEL_WIDTH_BREAKPOINT = 1000;
const IS_PHONE = window.innerWidth < PHONE_PC_PIXEL_WIDTH_BREAKPOINT;

let mode;
let songLocations = new Map();

const appState = {
    queryStrings: Object.fromEntries(new URLSearchParams(window.location.search)),
    currentSong: 0,
}
const mainMenu = document.getElementById("mainMenu");

if (!appState.queryStrings.n) appState.queryStrings.n = 3;

let footer;
let positionIndicator;
const songs = [];
let playlist = new Playlist();
const sidebar = new Sidebar();
let menuCategorized;
let menuAlphabetized;

const verbosity = {
    pageLoad: true,
    popstate: true,
    mainMenu: false,
    playlist: true,
    updateNavButtons: true,
    misc: true,
    queryString: true,
    clipboard: true,
    mode: false,
    showSong: true,
    chords: true,
}

/////////////////////////////////////////////////////////////////////////////
////////////////////////////// Non-class stuff //////////////////////////////
/////////////////////////////////////////////////////////////////////////////

function setMode(input, onPageLoad = false) {
    if (typeof (input) === Number) input = "song";

    switch(input) {
        case "main":
            mode = "main";
            updateNavButtons("main");
            showSong();
            setQueryString({s: "", i: ""});
            break;
        
        case "song":
            mode = "song";
            updateNavButtons("song");
            break;
        
        case "playlist":
            if (playlist.length === 0) {
                window.alert("Cannot enter playlist mode without a playlist selected! Please create a playlist first.");
                return;
            }
            mode = "playlist";
            if (!onPageLoad) showSong(playlist.get(0), 2);
            updateNavButtons("playlist");
            if (!onPageLoad) appState.queryStrings.i = 1;
            setQueryString({s: "playlist"});
            positionIndicator.update(1);
            sidebar.close();
            if (verbosity.mode) console.log("Playlist mode starting with song 1/" + playlist.length + ".");
            break;
        
        case "edit":
            mode = "edit";
            updateNavButtons("edit");
            // updateNavButtons([["s", "edit"]]); // this probably means setQueryString(), but I'm not sure if I want it to do that
            sidebar.open();
            break;
        
        default:
            console.log("Warning! Attempt to set invalid mode (" + input + ").\n" +
            "If you are an end-user, it is highly improbable that you are seeing this message. " +
            "If this error pops up, please email sdbahaisongs@gmail.com.");
    }

    footer.setMode();

    if (verbosity.mode) console.log("Successfully set mode to " + input + ".");
}

const styles = getComputedStyle(document.documentElement);
let sliderSpeed = parseFloat(styles.getPropertyValue("--slider-speed").trim());

// Updates the visibility of the buttons at the bottom of the screen.
function updateNavButtons(input = mode) {
    if (verbosity.updateNavButtons) console.log("Switching to nav button set " + input + ".");

    sidebar.setButtons(input);

    if (input === "playlist") {
        positionIndicator.show();
    } else {
        positionIndicator.hide();
    }

    if (IS_PHONE) document.getElementById("sidebarToggleBtn").disabled = false;
}

// Shows one specific song. When mode === "main", it goes to the homepage
function showSong(songNumber, startLocation = 1, onPageLoad = false) {
    if (verbosity.showSong) console.log("showSong() Song: " + songNumber + ". Start: " + startLocation + ". Mode: " + mode + ".");

    switch(mode) {
        case "song":
            songs[songNumber].slide(1, startLocation);

            if (songList.indexOf(appState.queryStrings.s) !== -1) {
                songs[songList.indexOf(appState.queryStrings.s)].slide(2 - startLocation);
            }

            setQueryString({s: songList[songNumber]});
            break;
        case "playlist":
            songs.forEach((song) => {
                song.slideConditional(2 - startLocation, 1);
            });

            songs[songNumber].slide(1, onPageLoad ? 1 : startLocation);

            // setQueryString({i: ???});
            break;
        default:
            songs.forEach((song) => {
                song.slideConditional(2, 1);
            });

            break;
    }

    // Shows/hides the main menu
    if (mode === "main") {
        console.log("Potentially sliding main. Pageload is " + onPageLoad);
        if (onPageLoad) {
            mainMenu.classList.remove("sliding", "setLeft", "setRight");
            mainMenu.classList.add("setMiddle");
        } else {
            slideMain(0, 1);
        }
    } else if (mode !== "main" && document.getElementById("mainMenu").classList.contains("setMiddle")) {
        slideMain(1, 0);
    }

    footer.setMode()
}

function slideMain(start, end) {
    if (verbosity.showSong) console.log("Sliding main: " + start + " => " + end);

    document.getElementById("mainMenu").classList.remove("sliding");
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
        setMode("song");
        showSong(id, 2);
    } else {
        playlist.add(id);
        updatePlaylistViewer();
        positionIndicator.update(playlist.getIndex() || 1);
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

// Sets a query string.
function setQueryString(newQueryStrings) {
    if (verbosity.queryString) console.log("Setting query strings: " + JSON.stringify(newQueryStrings));

    let isDifferent = false;
    Object.entries(newQueryStrings).forEach((newQueryString) => {
        if (appState.queryStrings[newQueryString[0]] !== newQueryString[1]) {
            appState.queryStrings[newQueryString[0]] = newQueryString[1] ? newQueryString[1] : "";
            isDifferent = true;
        }
    });

    if (isDifferent) {
        history.pushState({}, "",
            location.pathname + "?" +
            new URLSearchParams(Object.fromEntries(Object.entries(appState.queryStrings)
            .filter(([key, value]) => value && (key !== "n" || value !== 3)))));
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
