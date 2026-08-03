function pageLoad() {
    mainMenu = document.getElementById("mainMenu");

    let currentSong = getQueryString("s"); // the song currently in the URL
    NUM_OF_CATEGORY_COLUMNS = getQueryString("n") || 3;

    // This loads (but hides) the songs, only showing the requested one.
    for (let i = 0; i < BAHAI_SONGS_DATA.length; i++) {
        songList.push(BAHAI_SONGS_DATA[i].meta.name);
        loadSong(i, currentSong);
    }

    // Loads queryString variables
    const queryStringP = getQueryString("p");
    playlist = queryStringP !== null ? queryStringP.split("-").map(Number) : [];
    setMode(songList.indexOf(currentSong) === -1 ? currentSong ?? "main" : "song", false);

    // Dedicated functions to specific parts of loading the page
    loadSongSelector();
    updateNavButtons();

    // Handles logic for loading song when starting from playlist mode.
    if (mode === "playlist") {
        showSong(playlist[Number(getQueryString("i")) - 1]);
        mainMenu.classList.remove("sliding", "setMiddle"); // kinda a cheaty way to make this work, but it works
        mainMenu.classList.add("setLeft");
    }

    updatePlaylistViewer();
    updatePositionIndicator(getQueryString("i") || 1);

    // This handles users clicking the back button.
    window.addEventListener("popstate", () => {
        currentSong = getQueryString("s") || "main";
        log("Popstate detected. Moving to song " + currentSongIndex + ".", "popstate");
        if (currentSong === "playlist") {
            playlistSet(getQueryString("i"));
            updateNavButtons("playlist");
        } else {
            let currentSongIndex = songList.indexOf(currentSong);
            if (currentSongIndex === -1) {
                currentSongIndex = "main";
                setMode("main", false);
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
                playlistAdvance(-1);
            } else {
                playlistAdvance(1);
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

    sidebar = document.getElementById("sidebar");
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

// Initializes the website on page load such that every song is loaded, but hidden.
function loadSong(songNumber, currentSong) {
    const contentDiv = document.getElementById("contentDiv")

    const lyrics = BAHAI_SONGS_DATA[songNumber].lyrics;
    const meta = BAHAI_SONGS_DATA[songNumber].meta;
    const outerDiv = document.createElement("div");
    outerDiv.id = "outerDiv" + songNumber;
    outerDiv.classList.add("outerDiv");

    // Hides the song by default, unless the URL says this is the one to be displayed.
    if (songList[songNumber] === currentSong) { // || (currentSong === "playlist" && getQueryString("i") === String(songNumber)) // removed, probably bugged code snippet
        outerDiv.classList.add("setMiddle");
    } else {
        outerDiv.classList.add("setRight");
    }

    // Song header.
    const songTitle = document.createElement("h1");
    songTitle.classList.add("songHeader");
    songTitle.innerText = meta.name;
    outerDiv.appendChild(songTitle);

    // Song source. Allows for deprecated sourceName and sourceLink, but only as a last resort
    const songSource = meta.sources ? meta.sources :
                       meta.source ? [meta.source] :
                       (meta.sourceName || meta.sourceLink ? [[meta.sourceName, meta.sourceLink]] : [])
    if (songSource) {
        // console.log(songSource)
        const songLinkContainer = document.createElement("div");
        songLinkContainer.classList.add("songLinkContainer");
        outerDiv.appendChild(songLinkContainer);
        for (const [index, source] of songSource.entries()) {
            const songLink = document.createElement("a");
            if (source[1]) songLink.href = source[1];
            // if (!meta.sourceLink) songLink.classList.add("missing-href"); // todo: add this in properly
            songLink.target = "_blank";
            songLink.innerHTML = source[0] || "Unknown Citation";
            songLinkContainer.appendChild(songLink);
            if (index !== songSource.length - 1) songLinkContainer.append(" | ")
        }
    }

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

    // Makes a row flexbox to store columns
    const horizontalSongDiv = document.createElement("div");
    horizontalSongDiv.classList.add("flex-row");
    outerDiv.appendChild(horizontalSongDiv);
    contentDiv.appendChild(outerDiv);

    for (let i = 0; i < columnList.length; i++) {
        const songColumn = document.createElement("div");
        songColumn.id = "songColumn" + columnList[i];
        songColumn.classList.add("songColumn");
        horizontalSongDiv.appendChild(songColumn);
    }

    for (let i = 0; i < lyrics.length; i++) {
        const sectionLyrics = lyrics[i].sectionLyrics;
        const sectionMeta = lyrics[i].sectionMeta;
        const sectionDiv = document.createElement("div");
        sectionDiv.classList.add("sectionDiv");


        let column;
        if (IS_PHONE) {
            column = 0;
        } else {
            column = sectionMeta?.column ?? 0;
        }
        const songTdColumn = horizontalSongDiv.querySelector("#songColumn" + column);
        songTdColumn.appendChild(sectionDiv);

        // Adds per-stanza chords if applicable
        if (sectionMeta && sectionMeta.chords) {
            const sectionChordsContainer = document.createElement("i");
            sectionChordsContainer.classList.add("sectionChordsContainer");
            sectionDiv.appendChild(sectionChordsContainer)

            const sectionChords = document.createElement("p");
            sectionChords.innerText = sectionMeta.chords;
            sectionChords.classList.add("sectionChords");
            sectionChordsContainer.appendChild(sectionChords);
        }

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

        // Adds the verses themselves, including chords above the verses. This loops over each line
        for (let j = 0; j < sectionLyrics.length; j++) {
            const verseAndChords = [];
            let previousChord = "";
            for (const match of sectionLyrics[j].matchAll(/([^[]+)|\[(.*?)\]/g)) {
                if (match[1] !== undefined) {
                    verseAndChords.push([match[1], previousChord]);
                } else {
                    const content = match[2];
                    if (!content.startsWith("*")) {
                        previousChord = content;
                    } else {
                        verseAndChords.push(["[" + content.slice(1) + "]", previousChord]);
                    }
                }
            }

            const lyricContainer = document.createElement("div");
            lyricContainer.classList.add("songLine");
            if ((sectionMeta?.withChords || []).includes(j)) { lyricContainer.classList.add("fadesWithChords", "shrinksWithChords") };
            if ((sectionMeta?.withoutChords || []).includes(j)) { lyricContainer.classList.add("appearWithChords", "growWithChords", "fade", "shrink") };
            const HAS_CHORDS = verseAndChords.some(item => item[1] !== ""); // true if any of the line has a chord, false otherwise

            for (const [index, matchedVerse] of verseAndChords.entries()) {
                const lyric = document.createElement("span");

                if (HAS_CHORDS) {
                    const lyricChord = document.createElement("div");
                    lyricChord.classList.add("songChord", "shrinksWithChords");
                    lyric.appendChild(lyricChord);

                    const lyricChordText = document.createElement("p");
                    lyricChordText.classList.add("songChordToHide", "fadesWithChords");
                    lyricChordText.innerText = matchedVerse[1] || "\u00A0";
                    lyricChord.appendChild(lyricChordText);
                }

                const lyricText = document.createElement("p");
                lyricText.classList.add("songText");
                lyricText.innerText = matchedVerse[0];
                lyric.appendChild(lyricText);

                lyric.classList.add("songSpan");
                lyricContainer.appendChild(lyric);
            }

            sectionDiv.appendChild(lyricContainer);
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
    }
}

// Runs on page load that adds the main menu's song selector (center of the screen)
function loadSongSelector() {
    // Shows the songs on page load if string query "s" is blank (they are hidden by default in the html)
    if (mode === "main" | mode === "create") {
        mainMenu.classList.add("setMiddle");
        mainMenu.classList.remove("setLeft");
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

    // Finds height of each category card
    for (let i = 0; i < songThemes.length; i++) {
        songThemes[i].height = songThemes[i].songs.length + 2;
    }
    const TOTAL_CATEGORY_HEIGHT = songThemes.reduce((total, element) => total + element.height, 0);

    // Assigns each category to a columns
    if (!IS_PHONE) {
        let numCategoriesAssigned = 0;
        let numHeightAssigned = 0;

        // Logic to give (most) categories a column
        for (let i = 0; i < NUM_OF_CATEGORY_COLUMNS; i++) {
            log("C" + i, "mainMenu");

            let currentColumnHeight = 0;
            const THRESHHOLD_TARGET = (TOTAL_CATEGORY_HEIGHT - numHeightAssigned) / (NUM_OF_CATEGORY_COLUMNS - i);

            for (let j = numCategoriesAssigned; j < songThemes.length; j++) {

                const COLUMN_UNDER = THRESHHOLD_TARGET - currentColumnHeight;
                const COLUMN_OVER = Math.abs(THRESHHOLD_TARGET - currentColumnHeight - songThemes[j].height);

                log({
                    "name": songThemes[j].name,
                    "i": numCategoriesAssigned,
                    "THRESHHOLD_TARGET": THRESHHOLD_TARGET,
                    "COLUMN_UNDER": COLUMN_UNDER,
                    "COLUMN_OVER": COLUMN_OVER,
                    "height": songThemes[j].height
                }, "mainMenu");

                if (COLUMN_UNDER > THRESHHOLD_ADJUSTER || COLUMN_UNDER > COLUMN_OVER) {
                    numCategoriesAssigned++;
                    numHeightAssigned += songThemes[j].height;
                    currentColumnHeight += songThemes[j].height;
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
    const horizontalMenuDiv = document.createElement("div");
    horizontalMenuDiv.classList.add("flex-row", "hide");
    horizontalMenuDiv.id = "mainMenuCategorized";
    mainMenu.appendChild(horizontalMenuDiv);
    for (let i = 0; i < NUM_OF_CATEGORY_COLUMNS; i++) {
        if (IS_PHONE && i > 0) {
            break;
        }

        const menuColumn = document.createElement("div");
        menuColumn.id = "mainMenuColumn" + i;
        menuColumn.classList.add("songColumn");
        horizontalMenuDiv.appendChild(menuColumn);
    }

    // Creates categories
    for (let i = 0; i < songThemes.length; i++) {
        const mainMenuCard = document.createElement("div");
        mainMenuCard.classList.add("mainMenuCard");

        const mainMenuThemeHeader = document.createElement("h1");
        mainMenuThemeHeader.innerText = songThemes[i].name;
        mainMenuCard.appendChild(mainMenuThemeHeader);

        const mainMenuBorder = document.createElement("div");
        mainMenuCard.appendChild(mainMenuBorder);

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
            const SONG_NAME = BAHAI_SONGS_DATA[songThemes[i].songs[j]].meta.name;
            const mainMenuBtn = document.createElement("p");
            mainMenuBtn.addEventListener("click", () => { mainMenuBtnClicked(songThemes[i].songs[j], true); });
            mainMenuBtn.innerText = SONG_NAME;
            songListSorted.push(SONG_NAME);
            mainMenuCard.appendChild(mainMenuBtn);
        }

        // Adds a green divider between themes
        let mainMenuGreenDivider;
        if (songThemes[i].column === songThemes[i + 1]?.column) {
            mainMenuGreenDivider = document.createElement("img");
            mainMenuGreenDivider.src = "images/Green_Divider.png";
            mainMenuGreenDivider.classList.add("greenDivider");
            mainMenuCard.appendChild(mainMenuGreenDivider);
        }

        document.getElementById("mainMenuColumn" + songThemes[i].column).append(mainMenuCard, mainMenuGreenDivider || "");
    }

    // Creates map songLocation for later use
    songThemes.forEach((category, i) => {
        category.songs.forEach((song, j) => {
            songLocations.set(song, { categoryIndex: i, songIndex: j });
        });
    });

    //////////////////////////////////////
    ////////// alphabetized mode /////////
    //////////////////////////////////////

    songListAlphabetical = [...songList].sort();

    const mainMenuAlphabetized = document.createElement("div");
    mainMenuAlphabetized.classList.add("flex-row");
    mainMenuAlphabetized.id = "mainMenuAlphabetized";
    mainMenu.appendChild(mainMenuAlphabetized);

    // Creates columns
    let numOfSongsAssigned = 0
    let PREVIOUS_LETTER = "";
    for (let i = 0; i < NUM_OF_CATEGORY_COLUMNS; i++) {
        if (IS_PHONE && i > 0) {
            break;
        }

        const menuColumn = document.createElement("div");
        menuColumn.id = "mainMenuColumnAlphabetized" + i;
        menuColumn.classList.add("songColumn");
        mainMenuAlphabetized.appendChild(menuColumn);

        // Adds songs to columns
        // to make this more efficient: create cards first, then add songs in a separate loop
        const SONG_BREAKPOINT_OFFSET = -2
        const SONG_BREAKPOINT = IS_PHONE ? songList.length : songList.length * (i + 1) / NUM_OF_CATEGORY_COLUMNS + SONG_BREAKPOINT_OFFSET;
        for (let j = numOfSongsAssigned; j < SONG_BREAKPOINT && j < songList.length; j++) {
            const CURRENT_LETTER = songListAlphabetical[j][0];

            if (CURRENT_LETTER !== PREVIOUS_LETTER) {
                const mainMenuCard = document.createElement("div");
                mainMenuCard.classList.add("mainMenuCard", "mainMenuCardAlphabetized");
                mainMenuCard.id = "mainMenuCard-Letter" + CURRENT_LETTER;
                menuColumn.appendChild(mainMenuCard);
                
                // Adds a green divider between themes
                const mainMenuGreenDivider = document.createElement("img");
                mainMenuGreenDivider.src = "images/Green_Divider.png";
                mainMenuGreenDivider.classList.add("greenDivider");
                menuColumn.appendChild(mainMenuGreenDivider);
            }

            const SONG_NAME = BAHAI_SONGS_DATA[songList.indexOf(songListAlphabetical[j])].meta.name;
            const mainMenuBtn = document.createElement("p");
            mainMenuBtn.addEventListener("click", () => { mainMenuBtnClicked(songList.indexOf(songListAlphabetical[j]), true); });
            mainMenuBtn.innerText = SONG_NAME;
            mainMenuBtn.classList.add("alphabetizedMenuBtn");
            document.getElementById("mainMenuCard-Letter" + CURRENT_LETTER).appendChild(mainMenuBtn);

            PREVIOUS_LETTER = songListAlphabetical[j][0];
            numOfSongsAssigned += 1;
        }

        // hides the last green squiggle, since they should only be between cards
        menuColumn.lastElementChild.classList.add("hide");
    }
}
