const fs = require("fs");
const path = require("path");

const songsDir = path.join(__dirname, "songs");
const outputPath = path.join(__dirname, "data.js");

// Allowed meta keys for song-level metadata
const allowedSongMetaKeys = {
    "theme": "theme"
};

// Allowed meta keys for section-level metadata
const allowedSectionMetaKeys = {
    "chords": "chords",
    "callandresponse": "callAndResponse",
    "column": "column",
    "pagebreak": "pageBreak",
    "withchords": "withChords",
    "withoutchords": "withoutChords"
};

try {
    // Read all files in the songs directory
    const files = fs.readdirSync(songsDir);
    const BAHAI_SONGS_DATA = [];

    files.forEach(file => {
        if (file.endsWith(".txt")) {
            const ret = { meta: { name: file.replace(".txt", "").replace(/[-_]/g, " ")}, lyrics: {} };

            // Separates the contents from a list of lines into paragraphs with each line as its own value in an array
            const [metaParagraphs, bodyParagraphs] = 
                fs.readFileSync(path.join(songsDir, file), "utf8")
                .split(/\r?\n\s*\r?\n\s*\r?\n/).slice(0, 2).map(sec => {
                    if (!sec || sec.trim() === '') return [];
                    
                    return sec.trim().split(/\r?\n\s*\r?\n/).map(para => 
                        para.split(/\r?\n/).map(line => line.trim())
                        .filter(line => line.length > 0)
                    ).filter(para => para.length > 0);
                });

            // Processes the first paragraph of meta
            if (metaParagraphs[0] && metaParagraphs[0].length > 0) {
                ret.meta.name = metaParagraphs[0][0];

                metaParagraphs[0].slice(1).forEach(line => {
                    const metaMatch = line.match(/^([a-zA-Z]+):\s*(.+)$/);
                    if (metaMatch) {
                        const rawKey = metaMatch[1].toLowerCase();
                        if (allowedSongMetaKeys[rawKey]) {
                            ret.meta[allowedSongMetaKeys[rawKey]] = metaMatch[2].trim();
                        }
                    }
                });
            }

            // Adds meta.sources
            ret.meta.sources = [];
            if (metaParagraphs[1] && metaParagraphs[1].length > 0) {
                metaParagraphs[1].forEach((line, i, arr) => {
                    if (i % 2 === 0) ret.meta.sources.push([line, arr[i + 1] || ""]);
                });
            }

            // Process body paragraphs into lyrics with sectionMeta support
            ret.lyrics = bodyParagraphs.map(lines => {
                const sectionMeta = {};
                const sectionLyrics = [];

                lines.forEach(line => {
                    // Check for standalone repetition markers like (×2)
                    const repMatch = line.match(/^\([xX×](\d+)\)$/);
                    if (repMatch) {
                        sectionMeta.repetitions = +repMatch[1];
                        return;
                    }

                    // Check for key-value meta lines like "Chords: ..." or "WithChords: ..."
                    const metaMatch = line.match(/^([a-zA-Z]+):\s*(.+)$/);
                    if (metaMatch) {
                        const rawKey = metaMatch[1].toLowerCase();
                        if (allowedSectionMetaKeys[rawKey]) {
                            const targetKey = allowedSectionMetaKeys[rawKey];
                            let val = metaMatch[2].trim();

                            // Handle list-based numeric meta fields
                            if (["pageBreak", "withChords", "withoutChords"].includes(targetKey)) {
                                val = val.split(",").map(n => Number(n.trim()));
                            } else if (val.toLowerCase() === "true") {
                                val = true;
                            } else if (val.toLowerCase() === "false") {
                                val = false;
                            } else if (!isNaN(val)) {
                                val = Number(val);
                            }

                            sectionMeta[targetKey] = val;
                            return;
                        }
                    }

                    // Default behavior if it isn't a (x2) or Chords: asdf
                    sectionLyrics.push(line.replace(/\(x(\d+)\)/gi, '(×$1)'));
                });

                const sectionObj = {};
                if (Object.keys(sectionMeta).length > 0) sectionObj.sectionMeta = sectionMeta;
                sectionObj.sectionLyrics = sectionLyrics;
                return sectionObj;
            });

            const songObject = {
                "meta": ret.meta,
                "lyrics": ret.lyrics
            };

            BAHAI_SONGS_DATA.push(songObject);
        }
    });

    // Write the complete array to data.js using 4-space indentation
    const fileContent = `const BAHAI_SONGS_DATA = ${JSON.stringify(BAHAI_SONGS_DATA, null, 4)};\n`;
    fs.writeFileSync(outputPath, fileContent, 'utf8');

    console.log(`Successfully bundled ${BAHAI_SONGS_DATA.length} songs into data.js!`);

} catch (err) {
    console.error('Error building data.js:', err.message);
}
