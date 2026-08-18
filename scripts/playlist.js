class Playlist {
    #songs;

    #verbose = true;
    
    constructor() {
        const queryString = appState.queryStrings.p;
        this.#songs = queryString !== null ? queryString.split("-").map(Number) : [];
    }

    // Query string p

    get(song) {
        if (song === undefined) {
            return this.#songs;
        } else {
            return this.#songs[song];
        }
    }

    length() {
        return this.#songs.length;
    }

    set(newPlaylist) {
        this.#songs = newPlaylist;
        setQueryString({p: newPlaylist.join("-")});

        // update sidebar bit that shows the current playlist
    }

    add(index) {
        this.#songs.push(index);
        this.set(this.#songs);
    }

    // Query string i

    getIndex() {
        return appState.queryStrings.i;
    }

    // Playlist mode

    setIndex(index) {
        if (this.#verbose) console.log("Setting playlist index to " + index + ".");

        if (mode === "playlist") {
            if (index <= 0 || (index - 1) >= this.length()) {
                setMode("main");
                if (verbosity.playlist) console.log("Exiting playlist mode.");
            } else if (appState.queryStrings.i === index) {
                if (verbosity.playlist) console.log("Failed attempt to set index to itself.");
            } else {
                const direction = appState.queryStrings.i > index ? 0 : 2;
                setQueryString({i: index});
                showSong(this.#songs[index - 1], direction);
                positionIndicator.update(index);
                setSidebarVisibility("close");
                if (verbosity.playlist) console.log("Playlist advancing to index " + index + ".");
            }
            appState.queryStrings.i = index;
        } else {
            if (verbosity.playlist) console.log("Playlist mode not active.");
        }
    }
}

function arrowKey(input) {
    if (verbosity.misc) console.log("\n\narrowKey() called. Mode is " + mode + ", input is " + input + ".");
    switch (mode) {
        case "song":
            const CURRENT_SONG = songListSorted.indexOf(appState.queryStrings.s);
            const NEXT_SONG = CURRENT_SONG + (input === "ArrowLeft" ? -1 : 1);
            const START_LOCATION = input === "ArrowLeft" ? 0 : 2;
            if (NEXT_SONG === -1) {
                showSong(songList.indexOf(songListSorted.at(-1)), START_LOCATION);
                setQueryString({s: songListSorted.at(-1)});
            } else if (NEXT_SONG === songListSorted.length) {
                showSong(songList.indexOf(songListSorted[0]), START_LOCATION);
                setQueryString({s: songListSorted[0]});
            } else {
                showSong(songList.indexOf(songListSorted[NEXT_SONG]), START_LOCATION);
                setQueryString({s: songListSorted[NEXT_SONG]});
            }
            break;
        case "playlist":
            const numberOfAdvances = input === "ArrowLeft" ? -1 : 1;
            playlist.setIndex(Number(playlist.getIndex() || 1) + numberOfAdvances);
            break;
        default:
            if (verbosity.misc) console.log("Error: not in mode song or playlist. Arrow keys do nothing.");
    }
}

function updatePlaylistViewer() {
    // const playlistViewer = document.getElementById("sidebarPlaylistViewer");
    const playlistViewerOverflow = document.getElementById("sidebarPlaylistViewerOverflow");

    const playlistViewerIntro = document.getElementById("playlistViewerIntro");
    if (playlist.length() === 0) {
        playlistViewerIntro.innerText = "No playlist currently selected.";
        hide(playlistViewerOverflow);
        return;
    } else {
        playlistViewerIntro.innerText = "Current Playlist:";
        show(playlistViewerOverflow);
    }

    // Removes children (otherwise, there would be duplicates)
    playlistViewerOverflow.replaceChildren();

    for (i = 0; i < playlist.length(); i++) {
        const playlistViewerRow = document.createElement("div");
        playlistViewerRow.classList.add("playlistViewerRow");
        if (i % 2 === 0) playlistViewerRow.classList.add("alternating");
        if (mode === "edit") playlistViewerRow.classList.add("edit");
        playlistViewerOverflow.appendChild(playlistViewerRow);

        const playlistViewerText = document.createElement("p");
        playlistViewerText.innerText = BAHAI_SONGS_DATA[playlist.get()[i]].meta.name;
        playlistViewerRow.appendChild(playlistViewerText);

        const playlistViewerButton = document.createElement("button");
        (function (j) {
            playlistViewerButton.addEventListener("click", () => {
                playlist.splice(j, 1);
                setQueryString({p: playlist.join("-")});
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
        setQueryString({p: playlist.join("-")});
    }
}
