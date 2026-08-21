class Playlist {
    #songs;

    #playlistViewer;
    #playlistViewerIntro;
    #draggedRow;

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
        this.#draggedRow = null;
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
                });
            })(index);
            playlistViewerRow.appendChild(playlistViewerButton);

            const playlistViewerImage = document.createElement("img");
            playlistViewerImage.src = "images/X_Icon.png";
            playlistViewerButton.appendChild(playlistViewerImage);

            // Event listeners

            playlistViewerRow.setAttribute("draggable", "true");

            playlistViewerRow.addEventListener("dragstart", (e) => {
                if (appState.mode !== "edit") {
                    e.preventDefault();
                    return;
                }

                this.#draggedRow = e.currentTarget;
                this.#draggedRow.classList.add("dragging");

                // Makes the ghost use different CSS than the main row
                const ghost = playlistViewerRow.cloneNode(true);
                ghost.classList.add("ghost");
                document.body.appendChild(ghost);
                e.dataTransfer.setDragImage(ghost, 0, 0);
                setTimeout(() => ghost.remove(), 0);
            });

            playlistViewerRow.addEventListener("dragover", (e) => {
                e.preventDefault();
                if (this.#draggedRow === playlistViewerRow) return; // || playlistViewerRow.classList.contains("sliding")

                const draggedRowHeight = this.#draggedRow.getBoundingClientRect().top;
                const bounding = playlistViewerRow.getBoundingClientRect();
                const centerLine = bounding.height / 2 + bounding.top;
                const thisRowHeight = bounding.top;

                if (e.clientY < centerLine) {
                    // Mouse is in the top half. Place it BEFORE the target row.
                    // Prevent infinite loops by making sure it isn't already there!
                    if (playlistViewerRow.previousSibling !== this.#draggedRow) {
                        playlistViewerRow.parentNode.insertBefore(this.#draggedRow, playlistViewerRow);
                    } else {
                        return;
                    }
                } else {
                    // Mouse is in the bottom half. Place it AFTER the target row.
                    if (playlistViewerRow.nextSibling !== this.#draggedRow) {
                        playlistViewerRow.parentNode.insertBefore(this.#draggedRow, playlistViewerRow.nextSibling);
                    } else {
                        return; 
                    }
                }

                if (draggedRowHeight > thisRowHeight) { // last
                    playlistViewerRow.parentNode.insertBefore(this.#draggedRow, playlistViewerRow);
                } else {
                    playlistViewerRow.parentNode.insertBefore(this.#draggedRow, playlistViewerRow.nextSibling);
                }

                // invert
                const deltaHeight = thisRowHeight - playlistViewerRow.getBoundingClientRect().top;
                playlistViewerRow.style.transform = `translateY(${deltaHeight}px)`;

                playlistViewerRow.offsetHeight; // forces re-rendering
                playlistViewerRow.classList.add("sliding");
                playlistViewerRow.style.transform = "";
                setTimeout(() => { playlistViewerRow.classList.remove("sliding") }, 300); // must be the same as the transition in .playlistViewerRow.sliding

                // Updates the alternating color nature of playlistViewer
                document.querySelectorAll(".playlistViewerRow").forEach((rowAlternating, index) => {
                    if (index % 2 === 0) {
                        rowAlternating.classList.add("alternating");
                    } else {
                        rowAlternating.classList.remove("alternating");
                    }
                });
            });

            playlistViewerRow.addEventListener("drop", (e) => {
                e.preventDefault();
            });

            // Updates the playlist (and therefore, the URL) with the new order
            playlistViewerRow.addEventListener("dragend", (e) => {
                const newPlaylist = [];
                Array.from(playlistViewerRow.parentNode.children).forEach(child => {
                    newPlaylist.push(songList.indexOf(child.querySelector("p").innerText));
                });
                this.set(newPlaylist);
            });
        });
    }
}
