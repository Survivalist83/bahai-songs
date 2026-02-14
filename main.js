let songList = [];
const PHONE_PC_PIXEL_WIDTH_BREAKPOINT = 1000;
const IS_PHONE = window.innerWidth < PHONE_PC_PIXEL_WIDTH_BREAKPOINT;

let playlist;
let mode;

const verbose = true;

////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////// Page Load Stuff ///////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////

function pageLoad() {
    let currentSong = getQueryString("s"); // the song currently in the URL

    // Loads queryString variables
    const queryStringP = getQueryString("p");
    playlist = queryStringP !== null ? queryStringP.split("-").map(Number) : [];
    mode = changeModeSwitch(currentSong ?? "main");
    console.log("page load! mode is " + mode);

    // This loads (but hides) the songs, only showing the requested one.
    for (let i = 0; i < BAHAI_SONGS_DATA.length; i++) {
        songList.push(BAHAI_SONGS_DATA[i].meta.name);
        loadSong(i, currentSong);
    }

    // This adds buttons to select a song.
    loadMainMenu();

    // This handles users clicking the back button.
    window.addEventListener("popstate", () => {
        if (currentSong === "playlist") {
            showSong(playlist[Number(getQueryString("i")) - 1]);
        } else {
            currentSong = getQueryString("s");
            let currentSongIndex = songList.indexOf(currentSong);
            if (currentSongIndex === -1) {
                currentSongIndex = "main";
            }
            log("Popstate detected. Moving to song " + currentSongIndex + ".");
            showSong(currentSongIndex);
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
    outerDiv.id = "outerDiv" + songNumber;
    outerDiv.classList.add("outerDiv");

    // Hides the song by default, unless the URL says this is the one to be displayed.
    if (songList[songNumber] === currentSong || (currentSong === "playlist" && getQueryString("i") === String(songNumber))) {
        console.log("test");
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

function loadMainMenu() {
    const mainMenu = document.getElementById("mainMenu");

    // Shows the songs on page load if string query "s" is blank (they are hidden by default in the html)
    if (mode === "main" | mode === "create") {
        show(mainMenu);
    }

    // Finds all categories
    let songThemes = [];
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

    // Creates columns
    const NUM_OF_CATEGORY_COLUMNS = IS_PHONE ? 1 : 3;
    const AVERAGE_COLUMN_SIZE = IS_PHONE ? BAHAI_SONGS_DATA.length : BAHAI_SONGS_DATA.length / NUM_OF_CATEGORY_COLUMNS;
    let numCategoriesAssigned = 0;
    const THRESHHOLD_ADJUSTER = 0.5;
    const mainMenuColumnTable = document.createElement("table");
    mainMenu.appendChild(mainMenuColumnTable);
    const mainMenuColumnTr = document.createElement("tr");
    mainMenuColumnTable.appendChild(mainMenuColumnTr);
    for (let i = 0; i < NUM_OF_CATEGORY_COLUMNS; i++) {
        // console.log("C" + i);

        // Assigns each category a column
        let numSongsPerColumn = 0;
        for (let j = numCategoriesAssigned; j < songThemes.length; j++) {
            const POTENTIAL_SONGS_PER_COLUMN = numSongsPerColumn + songThemes[j].songs.length;

            // console.log(songThemes[j].name + " " + (numCategoriesAssigned) + " " + Math.abs(AVERAGE_COLUMN_SIZE - numSongsPerColumn) + " " + Math.abs(AVERAGE_COLUMN_SIZE - (POTENTIAL_SONGS_PER_COLUMN + THRESHHOLD_ADJUSTER)));
            if (AVERAGE_COLUMN_SIZE - numSongsPerColumn >= 3 || (AVERAGE_COLUMN_SIZE - numSongsPerColumn) > Math.abs(AVERAGE_COLUMN_SIZE - (POTENTIAL_SONGS_PER_COLUMN + THRESHHOLD_ADJUSTER))) {
                songThemes[j].column = i;
                numCategoriesAssigned++;
                numSongsPerColumn += songThemes[j].songs.length + THRESHHOLD_ADJUSTER;
            } else {
                break;
            }
        }

        const mainMenuColumnTd = document.createElement("td");
        mainMenuColumnTd.id = "mainMenuColumnTd" + i;
        mainMenuColumnTd.classList.add("songTdColumn");
        mainMenuColumnTr.appendChild(mainMenuColumnTd);
    }

    console.log(songThemes);

    // Creates categories
    for (let i = 0; i < songThemes.length; i++) {
        const mainMenuThemeDiv = document.createElement("div");
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

        document.getElementById("mainMenuColumnTd" + songThemes[i].column).appendChild(mainMenuThemeDiv);
    }

    // Shows/hides footer buttons on page load
    // log("About to hide footer buttons. Currently, mode is " + mode + ".");
    if (mode !== "main") { hide(document.getElementById("mainMenuPlaylistStartBtn")); };
    if (mode !== "main") { hide(document.getElementById("mainMenuPlaylistCreateBtn")); };
    if (mode !== "create") { hide(document.getElementById("mainMenuPlaylistFinishBtn")); };
    if (mode !== "playlist") { hide(document.getElementById("mainMenuPlaylistBack")); };
    if (mode !== "song" && mode !== "playlist") { hide(document.getElementById("mainMenuReturnHomeBtn")); }; // | !IS_PHONE
    if (mode !== "playlist") { hide(document.getElementById("mainMenuPlaylistForward")); };

    // Handles logic for loading song when starting from playlist mode.
    if (mode === "playlist") {
        showSong(playlist[Number(getQueryString("i")) - 1]);
    }
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

    mode = "playlist";
    showSong(playlist[0]);
    updateNavButtons("playlist");
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
        returnHome();
        log("Exiting playlist mode.");
    } else {
        showSong(playlist[playlistIndex - 1]);
        setQueryString([["i", playlistIndex]]);
        log("Playlist advancing to song " + (playlistIndex) + "/" + playlist.length + ".");
    }
}

// Enters playlist creation mode
function playlistAdd(id) {
    playlist.push(id);
    log(playlist);
}

// What happens on clicking "Create Playlist"
function playlistCreateStart() {
    mode = "create";
    updateNavButtons("create");
    setQueryString([["s", "create"]]);
}

// What happens on clicking "Save Playlist"
function playlistCreateFinish() {
    mode = "main";
    updateNavButtons("main");
    setQueryString([["s", ""], ["p", playlist.join("-")]]);
}