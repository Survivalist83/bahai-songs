// This code was run once to generate the songs in .txt form. It is being left for posterity.
// In theory, it will never be run again, hence why it is commented.

// const fs = require("fs");
// const path = require("path");
// const BAHAI_SONGS_DATA = require("./DEPRECATED_data.js");
// const songsDir = path.join(__dirname, "songs");

// try {
//     BAHAI_SONGS_DATA.forEach((song, index) => {
//         let fileContent = "";

//         // 1. First Paragraph: Name and Song-level Metadata
//         fileContent += `${song.meta.name || "Untitled"}\n`;
//         if (song.meta.theme) {
//             fileContent += `Theme: ${song.meta.theme}\n`;
//         }

//         // 2. Second Paragraph: Sources (handling various historical key formats)
//         let sourcesList = [];
//         if (Array.isArray(song.meta.sources)) {
//             sourcesList = song.meta.sources;
//         } else if (Array.isArray(song.meta.source)) {
//             sourcesList = [song.meta.source];
//         } else if (song.meta.sourceName || song.meta.sourceLink) {
//             sourcesList = [[song.meta.sourceName, song.meta.sourceLink]];
//         }

//         if (sourcesList.length > 0) {
//             fileContent += "\n";
//             sourcesList.forEach(([name, link]) => {
//                 fileContent += `${name || "Unknown Citation"}\n${link || ""}${link ? "\n" : ""}`;
//             });
//         }

//         fileContent += "\n\n";

//         // 3. Body Sections & Section Metadata
//         const sectionTexts = song.lyrics.map(sec => {
//             let sectionLines = [];
//             const meta = sec.sectionMeta || {};

//             // Convert section metadata back into text lines
//             if (meta.callAndResponse !== undefined) {
//                 sectionLines.push(`CallAndResponse: ${meta.callAndResponse}`);
//             }
//             if (meta.chords) {
//                 sectionLines.push(`Chords: ${meta.chords}`);
//             }
//             if (meta.column !== undefined) {
//                 sectionLines.push(`Column: ${meta.column}`);
//             }
//             if (Array.isArray(meta.pageBreak)) {
//                 sectionLines.push(`PageBreak: ${meta.pageBreak.join(", ")}`);
//             }
//             if (Array.isArray(meta.withChords)) {
//                 sectionLines.push(`WithChords: ${meta.withChords.join(", ")}`);
//             }
//             if (Array.isArray(meta.withoutChords)) {
//                 sectionLines.push(`WithoutChords: ${meta.withoutChords.join(", ")}`);
//             }

//             // Append actual lyric lines
//             if (Array.isArray(sec.sectionLyrics)) {
//                 sectionLines.push(...sec.sectionLyrics.map(line => line.replace(/\(×(\d+)\)/g, "(x$1)")));
//             }

//             if (meta.repetitions) {
//                 sectionLines.push(`(x${meta.repetitions})`);
//             }

//             return sectionLines.join("\n");
//         });

//         // Join sections with double newlines (paragraphs)
//         fileContent += sectionTexts.join("\n\n");

//         // Clean filename generation (e.g., "Kindle the fire of love" -> "0-Kindle-the-fire-of-love.txt")
//         const safeFilename = (song.meta.name || "untitled")
//             .replace(/<[^>]*>/g, "") // strip html tags if any
//             .replace(/[^a-zA-Z0-9]+/g, "-")
//             .replace(/^-+|-+$/g, "") + ".txt";

//         fs.writeFileSync(path.join(songsDir, String(index).padStart(2, "0") + "-" + safeFilename), fileContent.replace(/\s+$/, "") + "\n", "utf8");
//     });

//     console.log(`Successfully recovered and split ${BAHAI_SONGS_DATA.length} song text files into the 'songs/' directory!`);

// } catch (err) {
//     console.error("Error splitting data.js:", err.message);
// }