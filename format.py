import argparse, re

delimiter = '    '

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--forceMeta', action='store_true')
    args = parser.parse_args()
    song = getSong()
    printSong(args, song)

def getSong():
    print('Paste the song:\n')

    ret = [[]]
    while True:
        line = input('')

        if line != '':
            ret[len(ret) - 1].append(line)
        else:
            if ret[len(ret) - 1] == []:
                ret.pop(len(ret) - 1)
                break
            ret.append([])

    print('\nOutput:\n')
    return ret

def printSong(args, song):
    meta = song.pop(0)
    addLine('{', 0)
    addLine('"meta": {', 2)
    addLine(f'"name": "{meta.pop(0)}",', 3)

    if len(meta) != 0 and meta[0][:8] == 'Chords: ':
        addLine(f'"chords": {meta.pop(0)[8:]}",', 3)
    else:
        addLine('"chords": "",', 3)

    if meta[0][:7] == 'Theme: ':
        addLine(f'"theme": "{meta.pop(0)[7:]}",', 3)
    else:
        addLine('"theme": "",', 3)

    if len(meta) <= 2:
        addLine(f'"source": ["{meta[0]}", "{meta[1] or ""}"],', 3)
    else:
        addLine('"sources": [', 3)
        for i in range(0, len(meta), 2):
            sourceName = meta[i]
            sourceLink = meta[i + 1] if len(meta) > 2 * i else ''
            addLine(f'["{sourceName}", "{sourceLink}"],', 4)
        addLine('],', 3)
    
    addLine('},', 2)
    addLine('"lyrics": [', 2)

    for section in song:
        addLine('{', 3)

        chords = section.pop(0)[8:] if section[0][:8] == 'Chords: ' else ''
        repetitions = re.match('^\(x(\d+)\)$', section.pop(-1)).group(1) if re.search('^\(x\d+\)$', section[-1]) else 1

        if args.forceMeta or chords or repetitions != 1:
            addLine('"sectionMeta": {', 4)
            if repetitions != 1:
                addLine(f'"repetitions": {repetitions},', 5)
            if chords:
                addLine(f'"chords": "{chords}",', 5)
            addLine('},', 4)
        
        addLine('"sectionLyrics": [', 4)
        for lyric in section:
            lyric = re.sub('\(x(\d+)\)', '(×\g<1>)', lyric)
            addLine(f'"{lyric}",', 5)
        addLine('],', 4)

        addLine('},', 3)
    addLine(']', 2)
    addLine('},', 1)

def addLine(line, indent, multiplier = 1):
    print(multiplier * (indent * delimiter + line + '\n'), end = '')

main()
