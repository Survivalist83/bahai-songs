function main() {
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

    positionIndicator = new PositionIndicator();
    positionIndicator.update(1);
    
    BAHAI_SONGS_DATA.forEach((song, index) => {
        songList.push(song.meta.name);
        songs.push(new Song(index, appState.queryStrings.s === song.meta.name));
    });

    // Sidebar creation

    sidebar.dom.innerHTML = `
        <div class="sidebarDiv" id="sidebarPlaylistViewer">
            <h1 id="playlistViewerIntro" class="sidebarText">Current Playlist:</h1>
            <div id="sidebarPlaylistViewerOverflow"></div>
            <div class="sidebarBtnVertical">
                <button id="sidebarPlaylistEditBtn" class="sidebarBtn moving" onclick="setMode('edit')">Edit Playlist</button>
                <button id="sidebarPlaylistSaveBtn" class="sidebarBtn moving" onclick="setMode('main')">Done Editing</button>
            </div>
            <div class="sidebarBtnVertical">
                <button id="sidebarPlaylistCopyBtn" class="sidebarBtn moving">Copy Link</button>
                <p id="sidebarPlaylistHowTo">Click any song on the right to add it to the playlist. Click the X to remove it. Drag the rows to rearrange them.</p>
            </div>
            <!-- <button id="sidebarPlaylistCreateBtn" class="sidebarBtn navPlaylistCreateBtn" onclick="playlistCreateStart()">Create Playlist</button> -->
        </div>
        <div class="sidebarDiv" id="sidebarBottom">
            <label class="checkbox open" id="sidebarHideChords">
                <input type="checkbox" onclick="toggleChordVisibility(this)">
                <span></span>
                Hide Guitar Chords
            </label>
            <label class="checkbox open" id="sidebarStopSliding">
                <input type="checkbox" onclick="stopSliding(this)">
                <span></span>
                Stop Sliding Elements
            </label>
            <label class="checkbox open" id="sidebarToggleMainMenu">
                <input type="checkbox" onclick="toggleMainMenu(this)">
                <span></span>
                Categorize Homescreen
            </label>
            <!-- <button id="sidebarHowTo" class="sidebarBtn" onclick="sidebar.setOverlay('howto')">How To</button> -->
            <button id="sidebar-shortcuts" class="sidebarBtn pc wide" onclick="sidebar.setOverlay('shortcuts')">Keyboard Shortcuts</button>
            <button id="sidebar-about" class="sidebarBtn wide" onclick="sidebar.setOverlay('about')">About</button>
            <button id="sidebar-request" class="sidebarBtn wide" onclick="sidebar.setOverlay('request')">Request a Song</button>
            <div id="sidebarBottomSpacer" />
        </div>
    `

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

function eventListeners() {
    // Handles copying the page URL with sidebarPlaylistCopyBtn
    document.getElementById("sidebarPlaylistCopyBtn").addEventListener("click", async (event) => {
        const element = event.currentTarget;
        const text = window.location.href;

        try {
            await navigator.clipboard.writeText(text);
            await clipboardCopy();

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
    });

    // Pressing back button (or similar)
    window.addEventListener("popstate", () => {
        currentSong = appState.queryStrings.s || "main";
        if (verbosity.popstate) console.log("Popstate detected. Moving to song " + currentSongIndex + ".");
        if (currentSong === "playlist") {
            playlist.setIndex(playlist.getIndex());
            updateNavButtons("playlist");
        } else {
            let currentSongIndex = songList.indexOf(currentSong);
            if (currentSongIndex === -1) {
                currentSongIndex = "main";
                setMode("main", true);
            }
            showSong(currentSongIndex);
            updateNavButtons(currentSong);
        }

        updatePlaylistViewer();
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
                playlist.setIndex(Number(playlist.getIndex()) - 1);
            } else {
                playlist.setIndex(Number(playlist.getIndex()) + 1);
            }
        }
    });
}

function pageLoad() {
    setMode(songList.indexOf(appState.queryStrings.s) === -1 ? appState.queryStrings.s ?? "main" : "song", true);

    if (mode === "main" || mode === "edit") { // maybe remove mode === "edit"
        mainMenu.classList.add("setMiddle");
    } else {
        mainMenu.classList.add("setLeft");
    }

    // Dedicated functions to specific parts of loading the page
    updateNavButtons();

    // Handles logic for loading song when starting from playlist mode.
    if (mode === "playlist") {
        showSong(playlist.get(Number(playlist.getIndex()) - 1), 2, true);
        mainMenu.classList.remove("sliding", "setMiddle");
        mainMenu.classList.add("setLeft");
    }

    updatePlaylistViewer();
    positionIndicator.update(playlist.getIndex() || 1);

    playlistViewerEventListeners();

    // Sets the correct amount of padding to account for position: absolute .sidebarBtn.moving elements
    document.documentElement.style.setProperty("--sidebar-middle-padding",
        "" + (
            document.getElementById("sidebarPlaylistSaveBtn").getBoundingClientRect().height
        ) + "px"
    );
    document.documentElement.style.setProperty("--sidebar-middle-padding-edit",
        "" + (
            document.getElementById("sidebarPlaylistSaveBtn").getBoundingClientRect().height +
            document.getElementById("sidebarPlaylistHowTo").getBoundingClientRect().height
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

main();
