let songList = [];
const PHONE_PC_PIXEL_WIDTH_BREAKPOINT = 1000;
const IS_PHONE = window.innerWidth < PHONE_PC_PIXEL_WIDTH_BREAKPOINT;

let playlist = [0, 2, 3];

const verbose = true;

function pageLoad() {
    document.getElementById("hideMe").style.display = "none";

    // This loads (but hides) the songs, only showing the requested one.
    let currentSong = getQueryString("s"); // the song currently in the URL
    for (let i = 0; i < BAHAI_SONGS_DATA.length; i++) {
        songList.push(BAHAI_SONGS_DATA[i].meta.name);
        loadSong(i, currentSong);
    }

    // This adds buttons to select a song.
    loadMainMenu();

    // This handles users clicking the back button.
    window.addEventListener("popstate", () => {
        if (currentSong === "playlist") {
           showSong(playlist[Number(getQueryString("i")) - 1], false);
        } else {
            currentSong = getQueryString("s");
            let currentSongIndex = songList.indexOf(currentSong);
            log("Popstate detected. Moving to song " + currentSongIndex + ".");
            showSong(currentSongIndex, false);
        }
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
};

// Initializes the website on page load such that every song is loaded, but hidden.
function loadSong(songNumber, currentSong) {
    const contentDiv = document.getElementById("contentDiv")

    const lyrics = BAHAI_SONGS_DATA[songNumber].lyrics;
    const meta = BAHAI_SONGS_DATA[songNumber].meta;
    const outerDiv = document.createElement("div");
    outerDiv.id = "songOuterDiv" + songNumber;
    outerDiv.classList.add("songOuterDiv");
    
    // Hides the song by default, unless the URL says this is the one to be displayed.
    if (songList[songNumber] !== currentSong) {
        outerDiv.style.display = "none";
    } else {
        outerDiv.style.display = "flex";
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

// A helper function for function loadSong() that creates a blank div for visual appeal/spacing.
function createBlankDiv() {
    const blankDiv = document.createElement("div");
    blankDiv.classList.add("blankDiv");
    return blankDiv;
}

function loadMainMenu() {
    const mainMenu = document.getElementById("mainMenu");

    // Shows the songs on page load if string query "s" is blank (they are hidden by default in the html)
    const currentSong = getQueryString("s");
    if (currentSong === -1) {
        mainMenu.style.display = "block";
    }

    // Finds all themes
    let songThemes = [];
    for (let i = 0; i < songList.length; i++) {
        songThemes.push(BAHAI_SONGS_DATA[i].meta?.theme ?? "Uncategorized");
    }
    songThemes = [...new Set(songThemes)];

    // Moves "Uncategorized" category to the end of the list
    const indexOfUncategorized = songThemes.indexOf("Uncategorized");
    if (indexOfUncategorized !== -1) {
        songThemes.splice(indexOfUncategorized, 1);
        songThemes.push("Uncategorized");
    }

    // Creates a div for each theme
    for (let i = 0; i < songThemes.length; i++) {
        const mainMenuThemeDiv = document.createElement("div");
        const mainMenuThemeHeader = document.createElement("h1");
        mainMenuThemeHeader.classList.add("mainMenuHeader");
        mainMenuThemeHeader.innerText = songThemes[i];
        mainMenuThemeDiv.appendChild(mainMenuThemeHeader);

        // Adds songs that belong in the theme to the theme
        for (let j = 0; j < BAHAI_SONGS_DATA.length; j++) {
            if ((BAHAI_SONGS_DATA[j].meta?.theme ?? "Uncategorized") === songThemes[i]) {
                const mainMenuBtn = document.createElement("p");
                mainMenuBtn.classList.add("mainMenuBtn");
                mainMenuBtn.addEventListener("click", () => {
                    showSong(j, true);
                });
                mainMenuBtn.innerText = songList[j];
                mainMenuThemeDiv.appendChild(mainMenuBtn);
            }
        }

        mainMenu.appendChild(mainMenuThemeDiv);
    }

    // Creates a button to start playlist mode
    const mainMenuPlaylistStartBtn = document.createElement("button");
    mainMenuPlaylistStartBtn.addEventListener("click", () => {playlistStart();});
    mainMenuPlaylistStartBtn.innerText = "Playlist Mode";
    mainMenu.appendChild(mainMenuPlaylistStartBtn);

    // Handles logic for loading song when starting from playlist mode.
    if (currentSong === "playlist") {
        showSong(playlist[Number(getQueryString("i")) - 1], false);
    }
}

// Shows one specific song.
// When songNumber === -1, it goes to the homepage
function showSong(songNumber, boolChangeHistory) {
    document.querySelectorAll(".songOuterDiv").forEach(songOuterDiv => {songOuterDiv.style.display = "none";});

    if (songNumber !== -1) {
        document.getElementById("songOuterDiv" + songNumber).style.display = "flex";
    }

    // Shows/hides the main menu
    if (songNumber === -1 | songNumber === "playlist") {
        document.getElementById("mainMenu").style.display = "block";
    } else {
        document.getElementById("mainMenu").style.display = "none";
    }

    // Changes the "s" query string parameter to the current song's name so that the URL is easily shareable with others.
    if (boolChangeHistory) {
        if (songNumber === -1) {
            setQueryString([["s", ""]]);
        } else {
            setQueryString([["s", songList[songNumber]]]);
        }
    }
}

function setQueryString(queryStrings) {
    const params = new URLSearchParams(window.location.search);

    for (let i = 0; i < queryStrings.length; i++) {
        if (queryStrings[i][1] !== "") {
            params.set(queryStrings[i][0], queryStrings[i][1]);
        } else {
            params.delete(queryStrings[i][0]);
        }
    }
    
    let newURL = "";
    if ([...params.entries()].length > 0) {
        newURL = "?" + params.toString();
    }

    window.history.pushState({}, "", window.location.pathname + newURL);
}

// Returns the contents of a specific query string. Returns -1 on errors.
function getQueryString(target) {
    const params = new URLSearchParams(window.location.search);
    const currentSong = params.get(target) ?? -1;
    return currentSong;
}

// Handles what to do when a key press is pressed (not mobile)
function keyPress(event) {
    switch (event) {
        case "Escape":
            showSong(-1, true);
            setQueryString([["i", ""]]); // removes the i parameter when going to main menu (since it exits playback mode)
            break;
        case "ArrowRight":
            playlistAdvance(1);
            break;
        case "ArrowLeft":
            playlistAdvance(-1);
            break;
        case "a":
            setQueryString([["i", "hello world"]]);
    }
}

// Enters playlist mode
function playlistStart() {
    showSong(playlist[0], false);
    setQueryString([["s", "playlist"], ["i", 1]]);
    log("Playlist mode starting with song 1/" + playlist.length + ".");
}

// Goes forward/backward in the playlist
function playlistAdvance(numberOfAdvances) {
    if (getQueryString("s") !== "playlist") {
        log("Playlist mode not active.");
        return;
    }

    const playlistIndex = Number(getQueryString("i")) + numberOfAdvances;

    if (playlistIndex <= 0 | (playlistIndex - 1) >= playlist.length) {
        showSong(-1, true);
        setQueryString([["i", 0]]);
        log("Exiting playlist mode.");

    } else {
        showSong(playlist[playlistIndex - 1], false);
        setQueryString([["i", playlistIndex]]);
        log("Playlist advancing to song " + (playlistIndex) + "/" + playlist.length + ".");
    }
}

function log(text) {
    if (verbose) {
        console.log(text);
    }
}