let songList = [];
let songListCategorized = [];
let songListAlphabetical = [];
const PHONE_PC_PIXEL_WIDTH_BREAKPOINT = 1000;
const IS_PHONE = window.innerWidth < PHONE_PC_PIXEL_WIDTH_BREAKPOINT;

const appState = {
    queryStrings: {},
    currentSong: 0,
    mode: "",
}
const mainMenu = document.getElementById("mainMenu");

let footer;
let positionIndicator;
const songs = [];
let playlist;
const sidebar = new Sidebar(["sidebarPlaylistViewer", "sidebarBottom"]);
let menuCategorized;
let menuAlphabetized;

const verbosity = {
    popstate: true,
    mainMenu: false,
    playlist: true,
    misc: true,
    queryString: true,
    mode: true,
    showSong: true,
    chords: true,
}

//////////////////////////////////////////////////////////////////////////////
/////////////////////////////////// Brains ///////////////////////////////////
//////////////////////////////////////////////////////////////////////////////

function setMode(input, onPageLoad = false) {
    if (typeof (input) === Number) input = "song";

    switch(input) {
        case "main":
            appState.mode = "main";
            sidebar.setButtons("main");
            if (onPageLoad) {
                mainMenu.classList.remove("sliding", "setLeft", "setRight");
                mainMenu.classList.add("setMiddle");
            } else {
                showSong();
                setQueryString({s: "", i: ""});
            }
            positionIndicator.hide();
            break;
        
        case "song":
            appState.mode = "song";
            sidebar.setButtons("song");
            positionIndicator.hide();
            break;
        
        case "playlist":
            if (playlist.length === 0) {
                window.alert("Cannot enter playlist mode without a playlist selected! Please create a playlist first.");
                return;
            }
            appState.mode = "playlist";
            sidebar.setButtons("playlist");
            if (!onPageLoad) {
                showSong(playlist.get(0), 2);
                appState.queryStrings.i = 1;
                setQueryString({s: "playlist"});
            }
            positionIndicator.update(1);
            positionIndicator.show();
            sidebar.close();
            if (verbosity.mode) console.log("Playlist mode starting with song 1/" + playlist.length() + ".");
            break;
        
        case "edit":
            appState.mode = "edit";
            sidebar.open();
            sidebar.setButtons("edit");
            positionIndicator.hide();
            break;
        
        default:
            console.log("Warning! Attempt to set invalid mode (" + input + ").\n" +
            "If you are an end-user, it is highly improbable that you are seeing this message. " +
            "If this error pops up, please email sdbahaisongs@gmail.com.");
    }

    footer.setMode();

    if (verbosity.mode) console.log("Set mode to " + input + ".");
}

// Shows one specific song. When appState.mode === "main", it goes to the homepage
function showSong(songNumber, startLocation = 1, onPageLoad = false) {
    if (verbosity.showSong) console.log("showSong() Song: " + songNumber + ". Start: " + startLocation + ". Mode: " + appState.mode + ".");

    switch(appState.mode) {
        case "song":
            songs[songNumber].slide(1, startLocation);

            if (songList.indexOf(appState.queryStrings.s) !== -1 && !onPageLoad) {
                songs[songList.indexOf(appState.queryStrings.s)].slide(2 - startLocation);//, onPageLoad ? 2 - startLocation : undefined);
            }

            if (!onPageLoad) setQueryString({s: songList[songNumber]});
            break;
        case "playlist":
            if (onPageLoad) {
                songs.forEach((song) => {
                    song.hideConditional(1);
                });
            } else {
                songs.forEach((song) => {
                    song.slideConditional(2 - startLocation, 1);
                });
            }

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
    if (appState.mode === "main") {
        if (onPageLoad) {
            mainMenu.classList.add("setMiddle");
            mainMenu.classList.remove("sliding", "setLeft", "setRight");
        } else {
            slideMain(0, 1);
        }
    } else if (appState.mode !== "main" && mainMenu.classList.contains("setMiddle")) {
        if (onPageLoad) {
            mainMenu.classList.add("setLeft");
            mainMenu.classList.remove("sliding", "setMiddle", "setRight");
        } else {
            slideMain(1, 0);
        }
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

function slideObject(object, position) {
    const positions = ["setLeft", "setMiddle", "setRight"];
    const selectedPosition = positions[position];

    if (selectedPosition) {
        object.classList.remove(...positions);
        object.classList.add(selectedPosition);
    }
}

//////////////////////////////////////////////////////////////////////////////
////////////////////////////// Helper functions //////////////////////////////
//////////////////////////////////////////////////////////////////////////////

function updateQueryStrings() {
    appState.queryStrings = Object.fromEntries(new URLSearchParams(window.location.search));
    if (!appState.queryStrings.n) appState.queryStrings.n = 3;
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
