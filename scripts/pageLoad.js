function pageLoad() {
    let currentSong = appState.queryStrings.s; // the song currently in the URL // remove this bit later, it's extraneous

    setMode(songList.indexOf(currentSong) === -1 ? currentSong ?? "main" : "song", true);

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

    // This handles users clicking the back button.
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

    // This adds detection for swiping left/right on mobile
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

    sidebar = sidebarObject.sidebar;
    resizeObserver = new ResizeObserver(checkSidebarScrollbar);
    resizeObserver.observe(sidebar);
    checkSidebarScrollbar();

    // Handles copying the page URL with sidebarPlaylistCopyBtn
    sidebarPlaylistCopyBtn = document.getElementById("sidebarPlaylistCopyBtn");
    sidebarPlaylistCopyBtn.addEventListener("click", async () => {
        await clipboardCopy(window.location.href);

        sidebarPlaylistCopyBtn.textContent = "Copied!";
        sidebarPlaylistCopyBtn.disabled = true;
        sidebarPlaylistCopyBtn.classList.add("disabled");

        setTimeout(() => {
            sidebarPlaylistCopyBtn.textContent = "Copy Link";
            sidebarPlaylistCopyBtn.disabled = false;
            sidebarPlaylistCopyBtn.classList.remove("disabled");
        }, 1500);
    });
};

// Offsets position: absolute .sidebarBtn.moving elements when the scrollbar is present, so they are still centered
let sidebar;
let resizeObserver;
function checkSidebarScrollbar() {
    document.documentElement.style.setProperty("--sidebar-scrollbar-offset",
        (sidebar.scrollHeight > sidebar.clientHeight) ? "5px" : "0px");
}
