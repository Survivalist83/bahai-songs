class Playlist {
    #songs;

    #playlistViewer;
    #playlistViewerIntro;

    #verbose = true;
    
    constructor() {
        const queryString = appState.queryStrings.p;
        this.#songs = queryString !== undefined ? queryString.split("-").map(Number) : [];

        this.#playlistViewer = document.getElementById("playlistViewer");
        this.#playlistViewerIntro = document.getElementById("playlistViewerIntro");
        this.setViewer();
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
        this.setViewer();
    }

    add(index) {
        this.#songs.push(index);
        this.set(this.#songs);
    }

    remove(index) {
        this.#songs.splice(index, 1);
        this.set(this.#songs);
    }

    // Query string i

    getIndex() {
        return appState.queryStrings.i;
    }

    // Playlist mode

    setIndex(index) {
        if (this.#verbose) console.log("Setting playlist index to " + index + ".");

        if (appState.mode === "playlist") {
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
                sidebar.close();
                if (verbosity.playlist) console.log("Playlist advancing to index " + index + ".");
            }
            appState.queryStrings.i = index;
        } else {
            if (verbosity.playlist) console.log("Playlist mode not active.");
        }
    }

    // Playlist viewer

    setViewer() {
        if (this.#songs.length === 0) {
            this.#playlistViewerIntro.innerText = "No playlist currently selected.";
            this.#playlistViewer.classList.add("hide");
            return;
        } else {
            this.#playlistViewerIntro.innerText = "Current Playlist:";
            this.#playlistViewer.classList.remove("hide");
        }

        // Removes children (otherwise, there would be duplicates)
        this.#playlistViewer.replaceChildren();

        // Recreates rows
        this.#songs.forEach((song, index) => {
            const playlistViewerRow = document.createElement("div");
            playlistViewerRow.classList.add("playlistViewerRow");
            if (index % 2 === 0) playlistViewerRow.classList.add("alternating");
            if (appState.mode === "edit") playlistViewerRow.classList.add("edit");
            this.#playlistViewer.appendChild(playlistViewerRow);

            const playlistViewerText = document.createElement("p");
            playlistViewerText.innerText = BAHAI_SONGS_DATA[this.#songs[index]].meta.name;
            playlistViewerRow.appendChild(playlistViewerText);
            
            const playlistViewerButton = document.createElement("button");
            (function (i) {
                playlistViewerButton.addEventListener("click", () => {
                    playlist.remove(i);
                    playlistViewerEventListeners();
                });
            })(index);
            playlistViewerRow.appendChild(playlistViewerButton);

            const playlistViewerImage = document.createElement("img");
            playlistViewerImage.src = "images/X_Icon.png";
            playlistViewerButton.appendChild(playlistViewerImage);
        });
    }
}

// Handles dragging playlistViewerRow(s)
function playlistViewerEventListeners() {
    let draggedRow = null;
    document.querySelectorAll(".playlistViewerRow").forEach(row => {
        row.setAttribute("draggable", "true");

        row.addEventListener("dragstart", (e) => {
            if (appState.mode !== "edit") {
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
