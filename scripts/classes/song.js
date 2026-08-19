class Song {
    #songNumber;
    #dom = document.createElement("div");
    #position;
    
    // Used in the constructor
    #meta;
    #lyrics;
    #columns = []; // dom references
    #columnList = []; // columns used in data, only used to create the dom references
    #hasCallAndResponse = false;

    #verbose = true;

    constructor(songNumber, visible = false) {
        this.#songNumber = songNumber;
        this.#meta = BAHAI_SONGS_DATA[songNumber].meta;
        this.#lyrics = BAHAI_SONGS_DATA[songNumber].lyrics;
        
        this.#dom.classList.add("outerDiv");

        // Hides the song by default, unless the URL says this is the one to be displayed.
        if (visible) {
            this.#dom.classList.add("setMiddle");
            this.#position = 1;
        } else {
            this.#dom.classList.add("setRight");
            this.#position = 2;
        }

        this.#createHeader();
        this.#parseMetadata();
        this.#createColumns();
        this.#lyrics.forEach((stanza, index) => { this.#createStanza(stanza, index) });

        document.getElementById("contentDiv").appendChild(this.#dom);
    }

    // Assists in creating the song on page load

    #createHeader() {
        const songTitle = document.createElement("h1");
        songTitle.classList.add("songHeader");
        songTitle.innerText = this.#meta.name;
        this.#dom.appendChild(songTitle);

        const songSource =
            this.#meta.sources ? this.#meta.sources :
            this.#meta.source ? [this.#meta.source] :
            (this.#meta.sourceName || this.#meta.sourceLink ? [[this.#meta.sourceName, this.#meta.sourceLink]] : []);
        
        if (songSource) {
            const songLinkContainer = document.createElement("div");
            songLinkContainer.classList.add("songLinkContainer");
            this.#dom.appendChild(songLinkContainer);

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
    }

    #parseMetadata() {
        // Checks if the song has any call and response.
        for (let i = 0; i < this.#lyrics.length; i++) {
            if (this.#lyrics[i].sectionMeta && this.#lyrics[i].sectionMeta.callAndResponse) {
                this.#hasCallAndResponse = true;
                break;
            }
        }
        
        // Checks which columns the song is using (default to only column 0).
        // For phones, never uses more than 1 column.
        if (IS_PHONE) {
            this.#columnList = [0];
        } else {
            this.#lyrics.forEach((lyric) => {
                this.#columnList.push(lyric.sectionMeta?.column ?? 0);
            });
            this.#columnList = [...new Set(this.#columnList)];
        }
    }

    #createColumns() {
        // Makes a row flexbox to store columns
        const horizontalSongDiv = document.createElement("div");
        horizontalSongDiv.classList.add("flex-row");
        this.#dom.appendChild(horizontalSongDiv);
        document.getElementById("contentDiv").appendChild(this.#dom);

        this.#columnList.forEach(() => {
            const songColumn = document.createElement("div");
            songColumn.classList.add("songColumn");
            horizontalSongDiv.appendChild(songColumn);
            this.#columns.push(songColumn);
        });
    }

    #createStanza(stanza, stanzaIndex) {
        const sectionMeta = stanza.sectionMeta;
        const sectionLyrics = stanza.sectionLyrics;

        const sectionDiv = document.createElement("div");
        sectionDiv.classList.add("sectionDiv");
        this.#columns[IS_PHONE ? 0 : sectionMeta?.column ?? 0].appendChild(sectionDiv);

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
        } else if (this.#hasCallAndResponse) {
            const allTogether = document.createElement("p");
            allTogether.innerText = "All together:";
            allTogether.classList.add("songLyric", "bold");
            sectionDiv.appendChild(allTogether);
        }

        // Adds the verses themselves, including chords above the verses. This loops over each line
        sectionLyrics.forEach((lyric, lyricIndex) => {
            const verseAndChords = [];
            let previousChord = "";
            for (const match of lyric.matchAll(/([^[]+)|\[(.*?)\]/g)) {
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
            if ((sectionMeta?.withChords || []).includes(lyricIndex)) { lyricContainer.classList.add("fadesWithChords", "shrinksWithChords") };
            if ((sectionMeta?.withoutChords || []).includes(lyricIndex)) { lyricContainer.classList.add("appearWithChords", "growWithChords", "fade", "shrink") };
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
        });

        // Adds repetitions - i.e. (×2)
        if (sectionMeta && sectionMeta.repetitions) {
            const repetitions = document.createElement("p");
            repetitions.innerText = "(×" + sectionMeta.repetitions + ")";
            repetitions.classList.add("songLyric");
            sectionDiv.appendChild(repetitions);
        }

        // Adds a space between sections (if this isn't the last section)
        if (Number(stanzaIndex) + 1 !== this.#lyrics.length && !(sectionMeta && sectionMeta.repetitions) && !this.#hasCallAndResponse) {
            const blankDiv = document.createElement("div");
            blankDiv.classList.add("blankDiv");
            sectionDiv.appendChild(blankDiv);
        }
    }

    // Things that happen to a song after page load

    slide(newPosition, oldPosition) {
        this.#position = oldPosition === undefined ? this.#position : oldPosition;
        if (this.#verbose) console.log("Sliding " + this.#songNumber + ": " + this.#position + " => " + newPosition);

        this.#dom.classList.remove("sliding");
        slideObject(this.#dom, this.#position);

        this.#position = newPosition;

        requestAnimationFrame(() => {
            this.#dom.classList.add("sliding");
            slideObject(this.#dom, this.#position);
        });
    }

    slideConditional(newPosition, condition) {
        if (this.#position === condition) this.slide(newPosition);
    }
}

class Menu {
    #dom = document.createElement("div");
    #map;
    #columns = [];

    #id;
    #includeHeaders;
    #totalHeight = 0;

    #verbose = false;
    #verboseAssignments = false;

    constructor(unsortedMap, id, includeHeaders = true, songOrder) {
        this.#id = id;
        this.#includeHeaders = includeHeaders;

        this.#dom.classList.add("flex-row", "hide");
        this.#dom.id = "mainMenu" + this.#id;
        document.getElementById("mainMenu").appendChild(this.#dom);
        
        this.#cleanMap(unsortedMap);
        this.#map.forEach((value) => {
            value.songs.forEach((song) => {
                songOrder.push(BAHAI_SONGS_DATA[song].meta.name);
            });
        });

        if (!IS_PHONE) this.#assignColumns();
        
        // Creates columns
        for (let i = 0; i < appState.queryStrings.n; i++) {
            if (IS_PHONE && i > 0) break;
            const menuColumn = document.createElement("div");
            menuColumn.classList.add("songColumn");
            this.#columns.push(menuColumn);
            this.#dom.appendChild(menuColumn);
        }

        this.#map.forEach((value, key) => {
            this.#createCard(value.songs, this.#columns[value.column], key);
        });

        this.#columns.forEach(column => {
            column.lastElementChild.remove();
        });

        if (this.#verbose) console.log(this.#map);
    }

    #cleanMap(unsortedMap) {
        this.#map = new Map(
            [...unsortedMap.entries()]
                .map(([key, value]) => [key || "Uncategorized", {
                    songs: value.sort((a, b) => BAHAI_SONGS_DATA[a].meta.name.localeCompare(BAHAI_SONGS_DATA[b].meta.name)),
                    column: 0,
                    height: value.length + (this.#includeHeaders ? 2 : 0)
                }])
                .sort(([a], [b]) => {
                    if (a === "Uncategorized") return 1;
                    if (b === "Uncategorized") return -1;
                    return a.localeCompare(b);
            }));    
        
        this.#map.forEach((_, key) => {
            this.#totalHeight += this.#map.get(key).height;
        });
    }

    #assignColumns() {
        let numCategoriesAssigned = 0;
        let numHeightAssigned = 0;
        const THRESHHOLD_ADJUSTER = 5.5; // bigger number = more songs in later columns
        
        let currentColumn = 0;
        let currentColumnHeight = 0;
        let THRESHHOLD_TARGET = (this.#totalHeight - numHeightAssigned) / (appState.queryStrings.n - currentColumn);

        this.#map.forEach((value, key) => {
            const COLUMN_UNDER = THRESHHOLD_TARGET - currentColumnHeight;
            const COLUMN_OVER = Math.abs(THRESHHOLD_TARGET - currentColumnHeight - value.height);

            value.column = currentColumn;
            numCategoriesAssigned++;
            numHeightAssigned += value.height;
            currentColumnHeight += value.height;

            if (this.#verboseAssignments) console.log({
                "key": key,
                "index": numCategoriesAssigned,
                "THRESHHOLD_TARGET": THRESHHOLD_TARGET,
                "COLUMN_UNDER": COLUMN_UNDER,
                "COLUMN_OVER": COLUMN_OVER,
                "height": value.height,
                "currentColumn": currentColumn,
                "currentColumnHeight": currentColumnHeight,
            });

            if (COLUMN_UNDER < THRESHHOLD_ADJUSTER || COLUMN_UNDER < COLUMN_OVER) {
                currentColumn = Math.min(currentColumn + 1, appState.queryStrings.n - 1);
                currentColumnHeight = 0;
            }
        });

        // Sets any straggler categories to the final column
        if (this.#verboseAssignments) console.log("About to set straggler categories. numCategoriesAssigned is " + numCategoriesAssigned + ".");
        let i = 0;
        this.#map.forEach((value, key) => {
            if (numCategoriesAssigned < i) value.column = appState.queryStrings.n - 1;
            i++;
        })
    }

    #createCard(songs, column, key) {
        const card = document.createElement("div");
        card.classList.add("mainMenuCard");

        // Adds the header and border between the header and cards, if the invoke call asks for it
        if (this.#includeHeaders) {
            const header = document.createElement("h1");
            header.innerText = key;
            card.appendChild(header);

            const border = document.createElement("div");
            card.appendChild(border);
        }

        // Adds the songs themselves
        songs.forEach((index) => {
            const button = document.createElement("p");
            button.addEventListener("click", () => { mainMenuBtnClicked(index, true) });
            button.innerText = BAHAI_SONGS_DATA[index].meta.name;
            card.appendChild(button);
        });

        column.appendChild(card);

        // Adds the green squiggle between cards
        const squiggle = document.createElement("img");
        squiggle.src = "images/Green_Divider.png";
        squiggle.classList.add("greenDivider");
        column.appendChild(squiggle);
    }

    toggle() {
        this.#dom.classList.toggle("hide");
    }
}
