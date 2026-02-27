let songList = [];
const PHONE_PC_PIXEL_WIDTH_BREAKPOINT = 1000;
const IS_PHONE = window.innerWidth < PHONE_PC_PIXEL_WIDTH_BREAKPOINT;

let playlist;
let mode;
let songLocations = new Map();

////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////// Page Load Stuff ///////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////

function pageLoad() {
    let currentSong = getQueryString("s"); // the song currently in the URL

    // This loads (but hides) the songs, only showing the requested one.
    for (let i = 0; i < BAHAI_SONGS_DATA.length; i++) {
        songList.push(BAHAI_SONGS_DATA[i].meta.name);
        loadSong(i, currentSong);
    }

    // Loads queryString variables
    const queryStringP = getQueryString("p");
    playlist = queryStringP !== null ? queryStringP.split("-").map(Number) : [];
    setMode(songList.indexOf(currentSong) === -1 ? currentSong ?? "main" : "song");

    // Dedicated functions to specific parts of loading the page
    loadSongSelector();
    updateNavButtons();

    // Handles logic for loading song when starting from playlist mode.
    if (mode === "playlist") {
        showSong(playlist[Number(getQueryString("i")) - 1]);
    }

    updatePlaylistViewer();
    updatePositionIndicator(getQueryString("i") || 1);

    // This handles users clicking the back button.
    window.addEventListener("popstate", () => {
        if (currentSong === "playlist") {
            showSong(playlist[Number(getQueryString("i")) - 1]);
            updateNavButtons("playlist");
        } else {
            currentSong = getQueryString("s");
            let currentSongIndex = songList.indexOf(currentSong);
            if (currentSongIndex === -1) {
                currentSongIndex = "main";
            }
            log("Popstate detected. Moving to song " + currentSongIndex + ".", "popstate");
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
                playlistAdvance(-1);
            } else {
                playlistAdvance(1);
            }
        }
    });

    // return;

    // Handles dragging playlistViewerRow(s)
    let draggedRow = null;
    document.querySelectorAll(".playlistViewerRow").forEach((row, index) => {
        
        row.setAttribute("draggable", "true");

        row.addEventListener("dragstart", (e) => {
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
};

// Initializes the website on page load such that every song is loaded, but hidden.
function loadSong(songNumber, currentSong) {
    const contentDiv = document.getElementById("contentDiv")

    const lyrics = BAHAI_SONGS_DATA[songNumber].lyrics;
    const meta = BAHAI_SONGS_DATA[songNumber].meta;
    const outerDiv = document.createElement("div");
    outerDiv.id = "outerDiv" + songNumber;
    outerDiv.classList.add("outerDiv");

    // Hides the song by default, unless the URL says this is the one to be displayed.
    if (songList[songNumber] === currentSong || (currentSong === "playlist" && getQueryString("i") === String(songNumber))) {
        show(outerDiv);
    } else {
        hide(outerDiv);
    }

    // Spacing at the top to "center" it vertically
    const songTopSpacer = document.createElement("div");
    songTopSpacer.classList.add("songOuterDivTopSpacer");

    // Song header.
    const songTitle = document.createElement("h1");
    songTitle.classList.add("songHeader");
    songTitle.innerText = meta.name;
    outerDiv.appendChild(songTitle);

    // Song source.
    const songLink = document.createElement("a");
    songLink.href = meta.sourceLink;
    songLink.target = "_blank";
    songLink.innerHTML = meta.sourceName;
    outerDiv.appendChild(songLink);

    // Checks if the song has any call and response.
    let hasCallAndResponse = false;
    for (let i = 0; i < lyrics.length; i++) {
        if (lyrics[i].sectionMeta && lyrics[i].sectionMeta.callAndResponse) {
            hasCallAndResponse = true;
            break;
        }
    }

    // Checks which columns the song is using (default to only column 0).
    // For phones, never uses more than 1 column.
    let columnList = [];
    if (IS_PHONE) {
        columnList = [0];
    } else {
        for (let i = 0; i < lyrics.length; i++) {
            columnList.push(lyrics[i].sectionMeta?.column ?? 0);
        }
        columnList = [...new Set(columnList)];
    }

    // Makes a table (only one row) to use for columns. Every song is in the table, even if it only has one column.
    const table = document.createElement("table");
    const tableRow = document.createElement("tr");
    table.appendChild(tableRow);
    for (let i = 0; i < columnList.length; i++) {
        const tableColumn = document.createElement("td");
        tableColumn.id = "songTdColumn" + columnList[i];
        tableColumn.classList.add("songTdColumn");
        tableRow.appendChild(tableColumn);
    }

    for (let i = 0; i < lyrics.length; i++) {
        const sectionLyrics = lyrics[i].sectionLyrics;
        const sectionMeta = lyrics[i].sectionMeta;
        const sectionDiv = document.createElement("div");

        // Adds "Call and response:" or "All together:" to each section, if needed.
        if (sectionMeta && sectionMeta.callAndResponse) {
            const callAndResponse = document.createElement("p");
            callAndResponse.innerText = "Call and response:";
            callAndResponse.classList.add("songLyric", "bold");
            sectionDiv.appendChild(callAndResponse);
        } else if (hasCallAndResponse) {
            const allTogether = document.createElement("p");
            allTogether.innerText = "All together:";
            allTogether.classList.add("songLyric", "bold");
            sectionDiv.appendChild(allTogether);
        }

        // Adds the verses themselves.
        for (let j = 0; j < sectionLyrics.length; j++) {
            const lyric = document.createElement("p");
            lyric.innerHTML = sectionLyrics[j];
            lyric.classList.add("songLyric");
            sectionDiv.appendChild(lyric);
        }

        // Adds repetitions - i.e. (×2)
        if (sectionMeta && sectionMeta.repetitions) {
            const repetitions = document.createElement("p");
            repetitions.innerText = "(×" + sectionMeta.repetitions + ")";
            repetitions.classList.add("songLyric");
            sectionDiv.appendChild(repetitions);
        }

        // Adds a space between sections (if this isn't the last section)
        if (Number(i) + 1 !== lyrics.length && !(sectionMeta && sectionMeta.repetitions) && !hasCallAndResponse) {
            sectionDiv.appendChild(createBlankDiv());
        }

        let column;
        if (IS_PHONE) {
            column = 0;
        } else {
            column = sectionMeta?.column ?? 0;
        }
        const songTdColumn = tableRow.querySelector("#songTdColumn" + column);
        songTdColumn.appendChild(sectionDiv);
    }

    outerDiv.appendChild(table);
    contentDiv.appendChild(outerDiv);
}

// Runs on page load that adds the main menu's song selector (center of the screen)
function loadSongSelector() {
    const mainMenu = document.getElementById("mainMenu");

    // Shows the songs on page load if string query "s" is blank (they are hidden by default in the html)
    if (mode === "main" | mode === "create") {
        show(mainMenu);
    }

    // Finds all categories
    songThemes = [];
    for (let i = 0; i < BAHAI_SONGS_DATA.length; i++) {
        const themeToBeAdded = BAHAI_SONGS_DATA[i].meta?.theme || "Uncategorized"
        const THEME_ALREADY_PUSHED = songThemes.find(item => item.name === themeToBeAdded);

        if (!THEME_ALREADY_PUSHED) {
            songThemes.push({ "name": themeToBeAdded, "songs": [], "column": 0 });
        }
    }

    // Alphabetizes categories
    songThemes.sort((a, b) => {
        if (a.name < b.name) return -1;
        if (a.name > b.name) return 1;
        return 0;
    });

    // Moves "Uncategorized" category to the end of the list
    const indexOfUncategorized = songThemes.findIndex(item => item.name === "Uncategorized");
    if (indexOfUncategorized !== -1) {
        songThemes.splice(indexOfUncategorized, 1);
        songThemes.push({ "name": "Uncategorized", "songs": [], "column": 0 });
    }

    // Plans which songs go in which category
    for (let i = 0; i < BAHAI_SONGS_DATA.length; i++) {
        songThemes.find(item => item.name === (BAHAI_SONGS_DATA[i].meta?.theme || "Uncategorized")).songs.push(i);

    }

    const NUM_OF_CATEGORY_COLUMNS = 3;

    // Assigns each category to a columns
    if (!IS_PHONE) {
        let numCategoriesAssigned = 0;
        let numSongsAssigned = 0;

        // Logic to give (most) categories a column
        for (let i = 0; i < NUM_OF_CATEGORY_COLUMNS; i++) {
            log("C" + i, "mainMenu");

            let numSongsPerColumn = 0;
            const THRESHHOLD_TARGET = (BAHAI_SONGS_DATA.length - numSongsAssigned) / (NUM_OF_CATEGORY_COLUMNS - i);
            for (let j = numCategoriesAssigned; j < songThemes.length; j++) {

                const POTENTIAL_SONGS_PER_COLUMN = numSongsPerColumn + songThemes[j].songs.length;
                const COLUMN_UNDER = THRESHHOLD_TARGET - numSongsPerColumn
                const COLUMN_OVER = Math.abs(THRESHHOLD_TARGET - POTENTIAL_SONGS_PER_COLUMN);

                log(songThemes[j].name + " " + numCategoriesAssigned + " " + COLUMN_UNDER + " " + COLUMN_OVER, "mainMenu");
                if (COLUMN_UNDER >= 3 || COLUMN_UNDER > COLUMN_OVER) {
                    numCategoriesAssigned++;
                    numSongsAssigned += songThemes[j].songs.length;
                    numSongsPerColumn += songThemes[j].songs.length;

                    songThemes[j].column = i;
                } else {
                    break;
                }
            }
        }

        // Sets any straggler categories to the final column
        log("About to set straggler categories. numCategoriesAssigned is " + numCategoriesAssigned + ".", "mainMenu");
        for (let i = numCategoriesAssigned; i < songThemes.length; i++) {
            songThemes[i].column = NUM_OF_CATEGORY_COLUMNS - 1;
        }
    }

    // Creates columns
    const mainMenuColumnTable = document.createElement("table");
    mainMenu.appendChild(mainMenuColumnTable);
    const mainMenuColumnTr = document.createElement("tr");
    mainMenuColumnTable.appendChild(mainMenuColumnTr);
    for (let i = 0; i < NUM_OF_CATEGORY_COLUMNS; i++) {
        if (IS_PHONE && i > 0) {
            break;
        }

        const mainMenuColumnTd = document.createElement("td");
        mainMenuColumnTd.id = "mainMenuColumnTd" + i;
        mainMenuColumnTd.classList.add("songTdColumn");
        mainMenuColumnTr.appendChild(mainMenuColumnTd);
    }

    // Creates categories
    for (let i = 0; i < songThemes.length; i++) {
        const mainMenuThemeDiv = document.createElement("div");
        mainMenuThemeDiv.classList.add("mainMenuThemeDiv");
        const mainMenuThemeHeader = document.createElement("h1");
        mainMenuThemeHeader.classList.add("mainMenuHeader");
        mainMenuThemeHeader.innerText = songThemes[i].name;
        mainMenuThemeDiv.appendChild(mainMenuThemeHeader);

        // Alphabetizes the songs in each category
        songThemes[i].songs.sort((a, b) => {
            const FIRST_NAME = BAHAI_SONGS_DATA[a].meta.name;
            const SECOND_NAME = BAHAI_SONGS_DATA[b].meta.name
            
            if (FIRST_NAME < SECOND_NAME) return -1;
            if (FIRST_NAME > SECOND_NAME) return 1;
            return 0;
        })

        // Adds the songs themselves
        for (let j = 0; j < songThemes[i].songs.length; j++) {
            const mainMenuBtn = document.createElement("p");
            mainMenuBtn.classList.add("mainMenuBtn");
            mainMenuBtn.addEventListener("click", () => { mainMenuBtnClicked(songThemes[i].songs[j], true); });
            mainMenuBtn.innerText = BAHAI_SONGS_DATA[songThemes[i].songs[j]].meta.name;
            mainMenuThemeDiv.appendChild(mainMenuBtn);
        }

        // Adds a green divider between themes
        if (songThemes[i].column === songThemes[i + 1]?.column) {
            const mainMenuGreenDivider = document.createElement("img");
            mainMenuGreenDivider.src = "images/Green_Divider.png";
            mainMenuGreenDivider.classList.add("greenDivider");
            mainMenuThemeDiv.appendChild(mainMenuGreenDivider);
        }

        document.getElementById("mainMenuColumnTd" + songThemes[i].column).appendChild(mainMenuThemeDiv);
    }

    // Creates map songLocation for later use
    songThemes.forEach((category, i) => {
        category.songs.forEach((song, j) => {
            songLocations.set(song, { categoryIndex: i, songIndex: j });
        });
    });
}

////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////// Playlist Button ///////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////

// Enters playlist mode
function playlistStart() {
    if (getQueryString("p") === null) {
        window.alert("Cannot enter playlist mode without a playlist selected! Please create a playlist first.");
        return;
    }

    setMode("playlist");
    showSong(playlist[0]);
    updateNavButtons("playlist");
    setQueryString([["s", "playlist"], ["i", 1]]);
    updatePositionIndicator(1);
    document.getElementById("sidebar").classList.remove("open");

    log("Playlist mode starting with song 1/" + playlist.length + ".", "playlist");
}

function arrowKey(input) {
    log("arrowKey() called. Mode is " + mode + ", input is " + input + ".", "misc");
    switch(mode) {
        case "song":
            const currentIndeces = songLocations.get(songList.indexOf(getQueryString("s")));
            i = currentIndeces.categoryIndex;
            j = currentIndeces.songIndex;

            let nextSong = input === "ArrowLeft" ? songThemes[i].songs[j - 1] : songThemes[i].songs[j + 1];
            if (nextSong) {
                log("nextSong: " + nextSong + ", " + songList[nextSong]);
                showSong(nextSong);
                setQueryString([["s", songList[nextSong]]]);
            } else {
                const I_LENGTH = songThemes.length - 1;
                const J_LENGTH = songThemes[I_LENGTH].songs.length - 1;
                if ((input === "ArrowLeft" && i === 0 && j === 0) || (input === "ArrowRight" && i === I_LENGTH && j === J_LENGTH)) {
                    let overflow = input === "ArrowLeft" ? songThemes[I_LENGTH].songs[songThemes[I_LENGTH].songs.length - 1] : songThemes[0].songs[0];
                    showSong(overflow);
                    setQueryString([["s", songList[overflow]]]);
                } else {
                    let nextCat = input === "ArrowLeft" ? songThemes[i - 1].songs[songThemes[i - 1].songs.length - 1] : songThemes[i + 1].songs[0];
                    showSong(nextCat);
                    setQueryString([["s", songList[nextCat]]]);
                }
            }
            break;
        case "playlist":
            playlistSet(Number(getQueryString("i")) + (input === "ArrowLeft" ? -1 : 1));
            break;
        default:
            log("Error: not in mode song or playlist. Arrow keys do nothing.", "misc");
    }
}

// Goes forward/backward in the playlist. Half-deprecated.
function playlistAdvance(numberOfAdvances) {
    if (getQueryString("s") !== "playlist") {
        log("Playlist mode not active.", "playlist");
        return;
    }

    playlistSet(Number(getQueryString("i")) + numberOfAdvances);
}

function playlistSet(index) {
    if (index <= 0 | (index - 1) >= playlist.length) {
        returnHome();
        log("Exiting playlist mode.", "playlist");
    } else {
        showSong(playlist[index - 1]);
        setQueryString([["i", index]]);
        updatePositionIndicator(index);
        setSidebarVisibility("close");
        log("Playlist advancing to song " + (index) + "/" + playlist.length + ".", "playlist");
    }
}

function updatePlaylistViewer() {
    const playlistViewer = document.getElementById("sidebarPlaylistViewer");
    const playlistViewerOverflow = document.getElementById("sidebarPlaylistViewerOverflow");
    const queryStringP = getQueryString("p");
    playlist = queryStringP ? queryStringP.split("-").map(Number) : [];

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
        if (i % 2 === 0) { playlistViewerRow.classList.add("alternating") };
        playlistViewerOverflow.appendChild(playlistViewerRow);

        const playlistViewerText = document.createElement("p");
        playlistViewerText.innerText = BAHAI_SONGS_DATA[playlist[i]].meta.name;
        playlistViewerRow.appendChild(playlistViewerText);

        const playlistViewerButton = document.createElement("button");
        (function(j) {
            playlistViewerButton.addEventListener("click", () => {
                playlist.splice(j, 1);
                setQueryString([["p", playlist.join("-")]]);
                updatePlaylistViewer();
            });
        })(i);
        playlistViewerRow.appendChild(playlistViewerButton);

        const playlistViewerImage = document.createElement("img");
        playlistViewerImage.src = "images/X_Icon.png";
        playlistViewerButton.appendChild(playlistViewerImage);
    }

    // Sets vertical height of .moving sidebar buttons
    const movingSidebarArray = [
        
    ];
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

function playlistCopy() {
    clipboardCopy(playlist.join("-"));
}

function sidebarOverlay(input) {
    if (input !== "") {
        const sidebarOverlayTest = document.getElementById("sidebarOverlay-" + input);
        sidebarOverlayTest.classList.toggle("open");

        document.querySelectorAll(".sidebarOverlay:not(#sidebarOverlay-" + input + ")").forEach(otherSidebar => {
            otherSidebar.classList.remove("open");
        });

        const sidebarBtn = document.getElementById("sidebar-" + input);
        sidebarBtn.classList.toggle("highlighted");

        document.querySelectorAll(".sidebarBtn:not(#sidebar-" + input + ")").forEach(otherBtn => {
            otherBtn.classList.remove("highlighted");
        });
    } else {
        document.querySelectorAll(".sidebarOverlay").forEach(otherSidebar => {
            otherSidebar.classList.remove("open");
        });
    }
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
