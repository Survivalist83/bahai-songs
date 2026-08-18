function pageLoad() {
    mainMenu = document.getElementById("mainMenu");

    let currentSong = appState.queryStrings.s; // the song currently in the URL // remove this bit later, it's extraneous

    setMode(songList.indexOf(currentSong) === -1 ? currentSong ?? "main" : "song", true);

    // Dedicated functions to specific parts of loading the page
    loadSongSelector();
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

// Runs on page load that adds the main menu's song selector (center of the screen)
function loadSongSelector() {
    // Shows the songs on page load if string query "s" is blank (they are hidden by default in the html)
    if (mode === "main" | mode === "create") { // mode = "create" ???
        mainMenu.classList.add("setMiddle");
    } else {
        mainMenu.classList.add("setLeft");
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
        for (let i = 0; i < appState.queryStrings.n; i++) {
            if (verbosity.mainMenu) console.log("C" + i);

            let currentColumnHeight = 0;
            const THRESHHOLD_TARGET = (TOTAL_CATEGORY_HEIGHT - numHeightAssigned) / (appState.queryStrings.n - i);

            for (let j = numCategoriesAssigned; j < songThemes.length; j++) {

                const COLUMN_UNDER = THRESHHOLD_TARGET - currentColumnHeight;
                const COLUMN_OVER = Math.abs(THRESHHOLD_TARGET - currentColumnHeight - songThemes[j].height);

                if (verbosity.mainMenu) console.log({
                    "name": songThemes[j].name,
                    "i": numCategoriesAssigned,
                    "THRESHHOLD_TARGET": THRESHHOLD_TARGET,
                    "COLUMN_UNDER": COLUMN_UNDER,
                    "COLUMN_OVER": COLUMN_OVER,
                    "height": songThemes[j].height
                });

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
        if (verbosity.mainMenu) console.log("About to set straggler categories. numCategoriesAssigned is " + numCategoriesAssigned + ".");
        for (let i = numCategoriesAssigned; i < songThemes.length; i++) {
            songThemes[i].column = appState.queryStrings.n - 1;
        }
    }

    // Creates columns
    const horizontalMenuDiv = document.createElement("div");
    horizontalMenuDiv.classList.add("flex-row", "hide");
    horizontalMenuDiv.id = "mainMenuCategorized";
    mainMenu.appendChild(horizontalMenuDiv);
    for (let i = 0; i < appState.queryStrings.n; i++) {
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
    for (let i = 0; i < appState.queryStrings.n; i++) {
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
        const SONG_BREAKPOINT = IS_PHONE ? songList.length : songList.length * (i + 1) / appState.queryStrings.n + SONG_BREAKPOINT_OFFSET;
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
