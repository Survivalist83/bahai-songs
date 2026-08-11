class Song {
    #songNumber;
    
    #meta;
    #lyrics;

    #dom = document.createElement("div");
    #columns = [];

    #hasCallAndResponse = false;
    #columnList = [];

    #verboseLoading = true;
    #verboseInteracting = true;

    constructor(songNumber, currentSong) {
        this.#songNumber = songNumber;
        this.#meta = BAHAI_SONGS_DATA[songNumber].meta;
        this.#lyrics = BAHAI_SONGS_DATA[songNumber].lyrics;
        
        this.#dom.classList.add("outerDiv"); // rename later
        this.#dom.id = "outerDiv" + songNumber // remove this later, I don't want to use IDs at all

        // Hides the song by default, unless the URL says this is the one to be displayed.
        if (songList[songNumber] === currentSong) {
            this.#dom.classList.add("setMiddle");
        } else {
            this.#dom.classList.add("setRight");
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


}
