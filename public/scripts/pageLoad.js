function main() {
    updateQueryStrings();
    loadClasses();
    pageLoad();
    eventListeners();
}

function loadClasses() {
    footer = new Footer([
        {
            "text": "<",
            "onclick": () => arrowKey('ArrowLeft'),
            "modes": ["song", "playlist"],
        },
        {
            "text": "Home",
            "onclick": () => setMode("main"),
            "modes": ["song", "playlist"],
        },
        {
            "text": ">",
            "onclick": () => arrowKey('ArrowRight'),
            "modes": ["song", "playlist"],
        },
        {
            "text": "Start Playlist",
            "onclick": () => setMode("playlist"),
            "modes": ["main"],
            "condition": () => playlist.length() !== 0,
        },
        {
            "text": "Create Playlist",
            "onclick": () => setMode("edit"),
            "modes": ["main"],
            "condition": () => playlist.length() === 0,
        },
    ]);
    
    BAHAI_SONGS_DATA.forEach((song, index) => {
        songList.push(song.meta.name);
        songs.push(new Song(index, appState.queryStrings.s === song.meta.name));
    });

    createSidebar();

    playlist = new Playlist();

    positionIndicator = new PositionIndicator();
    positionIndicator.update(1);

    const categorizedMap = new Map();
    const alphabetizedMap = new Map();
    BAHAI_SONGS_DATA.forEach((song, index) => {
        const category = song.meta.theme;
        if (!categorizedMap.has(category)) categorizedMap.set(category, []);
        categorizedMap.get(category).push(index);

        const firstLetter = song.meta.name[0];
        if (!alphabetizedMap.has(firstLetter)) alphabetizedMap.set(firstLetter, []);
        alphabetizedMap.get(firstLetter).push(index);
    });

    menuCategorized = new Menu(categorizedMap, "Categorized", true, songListCategorized);
    menuAlphabetized = new Menu(alphabetizedMap, "Alphabetized", false, songListAlphabetical);
    menuAlphabetized.toggle();
}

function createSidebar() {
    // Main sidebar stuff

    const playlistViewerIntro = document.createElement("h1");
    playlistViewerIntro.classList.add("sidebarText");
    playlistViewerIntro.id = "playlistViewerIntro";
    playlistViewerIntro.innerText = "Current Playlist:";
    
    const playlistViewer = document.createElement("div");
    playlistViewer.id = "playlistViewer";

    sidebar.sections[0].append(playlistViewerIntro, playlistViewer);

    // Custom functions

    const vertical0 = sidebar.addVertical();
    sidebar.addButton({parent: vertical0, text: "Edit Playlist", onclick: () => setMode("edit"), showWith: ["main"], disableWith: ["song", "playlist"]});
    sidebar.addButton({parent: vertical0, text: "Done Editing", onclick: () => setMode("main"), showWith: ["edit"]});

    const vertical1 = sidebar.addVertical();
    sidebar.addButton({parent: vertical1, text: "Copy Link", onclick: e => copyLink(e), showWith: ["main", "song", "playlist"]});
    sidebar.addButton({parent: vertical1, showWith: ["edit"],
        text: "Click any song on the right to add it to the playlist. Click the X to remove it. Drag the rows to rearrange them."});

    sidebar.addToggle("Hide Guitar Chords", e => toggleChordVisibility(e));
    sidebar.addToggle("Stop Sliding Elements", e => stopSliding(e));
    sidebar.addToggle("Categorize Homescreen", () => toggleMainMenu());
    
    sidebar.addInfo("About", [
        ["h1", "About"],
        ["p", "This website was created by individual initiative to share lyrics to Bahá'í songs sung in devotional spaces, with an emphasis on songs created in the San Diego Cluster Youth Camps."],
        ["p", "To view similar content in Google-Slide form, see <a href='https://bit.ly/BahaiSongs' target='_blank' class='sansLink'>bit.ly/BahaiSongs</a>."],
    ]);

    sidebar.addInfo("Keyboard Shortcuts", [
        ["h1", "Left/Right Arrow Keys"],
        ["p", "Switch between songs"],
        ["h1", "h"],
        ["p", "Go to homescreen"],
        ["h1", "Escape"],
        ["p", "Toggle sidebar menus"],
    ], true);

    sidebar.addInfo("Request a Song", [
        ["h1", "Request a Song"],
        ["p", "To request to add a song, please email <u>sdbahaisongs<wbr>@gmail.com</u> with the song title, link, and lyrics."],
        ["p", "Optionally, you can include a video of the song and/or its guitar chords."],
    ]);

    const sidebarBottomSpacer = document.createElement("sidebarBottomSpacer");
    sidebarBottomSpacer.id = "sidebarBottomSpacer";
    sidebar.sections[1].appendChild(sidebarBottomSpacer);
}

function pageLoad() {
    setMode(songList.indexOf(appState.queryStrings.s) === -1 ? appState.queryStrings.s ?? "main" : "song", true);

    if (appState.mode === "main" || appState.mode === "edit") { // maybe remove appState.mode === "edit"
        mainMenu.classList.add("setMiddle");
    } else {
        mainMenu.classList.add("setLeft");
    }

    // Handles logic for loading song when starting from playlist mode.
    if (appState.mode === "playlist") {
        showSong(playlist.get(Number(playlist.getIndex()) - 1), 2, true);
        mainMenu.classList.remove("sliding", "setMiddle");
        mainMenu.classList.add("setLeft");
    }

    positionIndicator.update(playlist.getIndex() || 1);

    // Sets the correct amount of padding to account for position: absolute .sidebarBtn.moving elements
    document.documentElement.style.setProperty("--sidebar-middle-padding",
        "" + (
            sidebar.buttons[1][0].getBoundingClientRect().height
        ) + "px"
    );
    document.documentElement.style.setProperty("--sidebar-middle-padding-edit",
        "" + (
            sidebar.buttons[1][0].getBoundingClientRect().height +
            sidebar.buttons[3][0].getBoundingClientRect().height
        ) + "px"
    );

    resizeObserver = new ResizeObserver(checkSidebarScrollbar);
    resizeObserver.observe(sidebar.dom);
    checkSidebarScrollbar();
};

// Offsets position: absolute .sidebarBtn.moving elements when the scrollbar is present, so they are still centered
let resizeObserver;
function checkSidebarScrollbar() {
    document.documentElement.style.setProperty("--sidebar-scrollbar-offset",
        (sidebar.dom.scrollHeight > sidebar.dom.clientHeight) ? "5px" : "0px");
}

function eventListeners() {
    // Pressing back button (or similar)
    window.addEventListener("popstate", () => {
        let newQueryStrings = Object.fromEntries(new URLSearchParams(window.location.search));
        let currentSong = newQueryStrings.s || "main";
        if (verbosity.popstate) console.log("Popstate detected. Moving to song " + currentSong + ".");
        if (currentSong === "playlist") {
            appState.mode = "playlist";
            playlist.setIndex(newQueryStrings.i, true);
            sidebar.setButtons("playlist");
            positionIndicator.show();
        } else {
            songs.forEach((song) => { song.hideConditional(1) });
            let currentSongIndex = songList.indexOf(currentSong);
            if (currentSongIndex === -1) {
                currentSongIndex = "main";
                setMode("main", true);
            } else {
                setMode("song", true);
                showSong(currentSongIndex, 1, true);
            }
            sidebar.setButtons();
            positionIndicator.hide();
        }

        playlist.setViewer();
    });
    
    // Mobile-only swiping
    let swipeStartX = 0;
    let swipeEndX = 0;
    document.addEventListener("touchstart", (event) => {
        swipeStartX = event.touches[0].clientX;
    });
    document.addEventListener("touchend", (event) => {
        swipeEndX = event.changedTouches[0].clientX;

        const swipeDistance = swipeEndX - swipeStartX;
        if (Math.abs(swipeDistance) > 75) {
            if (swipeDistance > 0) {
                arrowKey("ArrowLeft");
            } else {
                arrowKey("ArrowRight");
            }
        }
    });
}

console.log("Testing... adding stuff to the 'public' folder.")
main();
