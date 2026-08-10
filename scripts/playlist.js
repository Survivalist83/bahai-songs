// Enters playlist mode
function playlistStart() {
    if (getQueryString("p") === null) {
        window.alert("Cannot enter playlist mode without a playlist selected! Please create a playlist first.");
        return;
    }

    setMode("playlist");
    showSong(playlist[0], 2);
    updateNavButtons("playlist");
    setQueryString([["s", "playlist"], ["i", 1]]);
    positionIndicator.update(1);
    setSidebarVisibility("close");

    if (verbosity.playlist) console.log("Playlist mode starting with song 1/" + playlist.length + ".");
}

function arrowKey(input) {
    if (verbosity.misc) console.log("\n\narrowKey() called. Mode is " + mode + ", input is " + input + ".");
    switch (mode) {
        case "song":
            const CURRENT_SONG = songListSorted.indexOf(getQueryString("s"));
            const NEXT_SONG = CURRENT_SONG + (input === "ArrowLeft" ? -1 : 1);
            const START_LOCATION = input === "ArrowLeft" ? 0 : 2;
            if (NEXT_SONG === -1) {
                showSong(songList.indexOf(songListSorted.at(-1)), START_LOCATION);
                setQueryString([["s", songListSorted.at(-1)]]);
            } else if (NEXT_SONG === songListSorted.length) {
                showSong(songList.indexOf(songListSorted[0]), START_LOCATION);
                setQueryString([["s", songListSorted[0]]]);
            } else {
                showSong(songList.indexOf(songListSorted[NEXT_SONG]), START_LOCATION);
                setQueryString([["s", songListSorted[NEXT_SONG]]]);
            }
            break;
        case "playlist":
            const numberOfAdvances = input === "ArrowLeft" ? -1 : 1;
            playlistSet(Number(getQueryString("i")) + numberOfAdvances, numberOfAdvances);
            break;
        default:
            if (verbosity.misc) console.log("Error: not in mode song or playlist. Arrow keys do nothing.");
    }
}

// Goes forward/backward in the playlist. Half-deprecated.
function playlistAdvance(numberOfAdvances) {
    if (getQueryString("s") !== "playlist") {
        if (verbosity.playlist) console.log("Playlist mode not active.");
        return;
    }

    playlistSet(Number(getQueryString("i")) + numberOfAdvances, numberOfAdvances);
}

function playlistSet(index, numberOfAdvances) {
    if (index <= 0 | (index - 1) >= playlist.length) {
        returnHome();
        if (verbosity.playlist) console.log("Exiting playlist mode.");
    } else {
        const direction = numberOfAdvances < 0 ? 0 : 2;
        console.log("playlistSet() switching to song " + index + " from direction " + direction + ", numberofAdvances is " + numberOfAdvances + ".");

        setQueryString([["i", index]]);
        showSong(playlist[index - 1], direction);
        positionIndicator.update(index);
        setSidebarVisibility("close");
        if (verbosity.playlist) console.log("Playlist advancing to song " + (index) + "/" + playlist.length + ".");
    }
}

function setPlaylist() {
    const queryStringP = getQueryString("p");
    playlist = queryStringP ? queryStringP.split("-").map(Number) : [];
}

function updatePlaylistViewer() {
    // const playlistViewer = document.getElementById("sidebarPlaylistViewer");
    const playlistViewerOverflow = document.getElementById("sidebarPlaylistViewerOverflow");
    setPlaylist()

    const playlistViewerIntro = document.getElementById("playlistViewerIntro");
    if (playlist.length === 0) {
        playlistViewerIntro.innerText = "No playlist currently selected.";
        hide(playlistViewerOverflow);
        return;
    } else {
        playlistViewerIntro.innerText = "Current Playlist:";
        show(playlistViewerOverflow);
    }

    // Removes children (otherwise, there would be duplicates)
    playlistViewerOverflow.replaceChildren();

    for (i = 0; i < playlist.length; i++) {
        const playlistViewerRow = document.createElement("div");
        playlistViewerRow.classList.add("playlistViewerRow");
        if (i % 2 === 0) playlistViewerRow.classList.add("alternating");
        if (mode === "edit") playlistViewerRow.classList.add("edit");
        playlistViewerOverflow.appendChild(playlistViewerRow);

        const playlistViewerText = document.createElement("p");
        playlistViewerText.innerText = BAHAI_SONGS_DATA[playlist[i]].meta.name;
        playlistViewerRow.appendChild(playlistViewerText);

        const playlistViewerButton = document.createElement("button");
        (function (j) {
            playlistViewerButton.addEventListener("click", () => {
                playlist.splice(j, 1);
                setQueryString([["p", playlist.join("-")]]);
                updatePlaylistViewer();
                playlistViewerEventListeners();
            });
        })(i);
        playlistViewerRow.appendChild(playlistViewerButton);

        const playlistViewerImage = document.createElement("img");
        playlistViewerImage.src = "images/X_Icon.png";
        playlistViewerButton.appendChild(playlistViewerImage);
    }
}

// Handles dragging playlistViewerRow(s)
function playlistViewerEventListeners() {
    let draggedRow = null;
    document.querySelectorAll(".playlistViewerRow").forEach(row => {
        row.setAttribute("draggable", "true");

        row.addEventListener("dragstart", (e) => {
            if (mode !== "edit") {
                e.preventDefault();
                return;
            }

            draggedRow = e.currentTarget;
            draggedRow.classList.add("dragging");

            // Makes the ghost use different CSS than the main row
            const ghost = row.cloneNode(true);
            ghost.classList.add("ghost");
            document.body.appendChild(ghost);
            e.dataTransfer.setDragImage(ghost, 0, 0);
            setTimeout(() => ghost.remove(), 0);
        });

        row.addEventListener("dragover", (e) => {
            e.preventDefault();
            if (draggedRow === row) return;

            playlistViewerDrag(row, draggedRow, false);
        });

        row.addEventListener("drop", (e) => {
            e.preventDefault();
            if (draggedRow === row) return;

            playlistViewerDrag(row, draggedRow, true);
        });

        row.addEventListener("dragend", () => {
            draggedRow.classList.remove("dragging");
        })
    });
}

function playlistViewerDrag(row, draggedRow, boolUpdatePlaylist) {
    const draggedRowHeight = draggedRow.getBoundingClientRect().top;
    const thisRowHeight = row.getBoundingClientRect().top;

    if (draggedRowHeight > thisRowHeight) {
        row.parentNode.insertBefore(draggedRow, row);
    } else {
        row.parentNode.insertBefore(draggedRow, row.nextSibling);
    }

    // Updates the alternating color nature of playlistViewer
    document.querySelectorAll(".playlistViewerRow").forEach((rowAlternating, index) => {
        if (index % 2 === 0) {
            rowAlternating.classList.add("alternating");
        } else {
            rowAlternating.classList.remove("alternating");
        }
    });

    // Updates the internal playlist variable and associated thingies
    if (boolUpdatePlaylist) {
        playlist = []
        Array.from(row.parentNode.children).forEach(child => {
            playlist.push(songList.indexOf(child.querySelector("p").innerText));
        });
        setQueryString([["p", playlist.join("-")]]);
    }
}

// What happens on clicking "Edit Playlist"
function playlistEdit() {
    setMode("edit");
    updateNavButtons("edit");
    updateNavButtons([["s", "edit"]]);
    setSidebarVisibility("open");
}

// What happens on clicking "Save Playlist"
function playlistSave() {
    setMode("main");
    updateNavButtons("main");
    setQueryString([["s", ""], ["p", playlist.join("-")]]);
}
