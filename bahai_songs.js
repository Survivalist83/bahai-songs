let songList = [];
const PHONE_PC_PIXEL_WIDTH_BREAKPOINT = 1000;
const IS_PHONE = window.innerWidth < PHONE_PC_PIXEL_WIDTH_BREAKPOINT;

function pageLoad() {
    document.getElementById("hideMe").style.display = "none";

    // This loads (but hides) the songs, only showing the requested one.
    let currentSong = getCurrentSong();
    for (let i = 0; i < BAHAI_SONGS_DATA.length; i++) {
        songList.push(BAHAI_SONGS_DATA[i].meta.name);
        loadSong(i, currentSong);
    }

    // This adds buttons to select a song.
    const mainMenu = document.getElementById("mainMenu");
    for (let i = 0; i < songList.length; i++) {
        const mainMenuBtn = document.createElement("button");
        mainMenuBtn.addEventListener("click", () => {showSong(i, true);});
        mainMenuBtn.innerText = songList[i];
        mainMenu.appendChild(mainMenuBtn);
    }

    // This handles users clicking the back button.
    window.addEventListener("popstate", () => {
        currentSong = getCurrentSong();
        let currentSongIndex = songList.indexOf(currentSong);
        console.log(currentSongIndex);
        showSong(currentSongIndex, false);
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

// Returns the index of the song the URL says we should display. Returns -1 on errors.
function getCurrentSong() {
    const params = new URLSearchParams(window.location.search);
    const currentSong = params.get("s");
    return currentSong;
}

// Shows one specific song.
function showSong(songNumber, boolChangeHistory) {
    document.querySelectorAll(".songOuterDiv").forEach(songOuterDiv => {songOuterDiv.style.display = "none";});

    if (songNumber !== -1) {
        document.getElementById("songOuterDiv" + songNumber).style.display = "flex";
    }

    // Changes the "s" query string parameter to the current song's name so that the URL is easily shareable with others.
    if (boolChangeHistory) {
        const params = new URLSearchParams(window.location.search);
        let newURL = "";
        if (songNumber !== -1) {
            params.set("s", songList[songNumber]);
            newURL = "?" + params.toString();
        }
        window.history.pushState({}, "", window.location.pathname + newURL);
    }
}

function keyPress(event) {
    switch (event) {
        case "Escape":
            showSong(-1, true);
    }
}