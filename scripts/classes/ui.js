class Footer {
    #buttons = [];
    #verbose = false;

    constructor(args) {
        this.dom = document.createElement("div");
        this.dom.classList.add("footer");

        for (const arg of args) {
            const button = document.createElement("button");
            button.classList.add("footerBtn");
            button.innerText = arg.text || "";
            button.onclick = arg.onclick || "";
            button.modes = arg.modes || [];
            button.condition = arg.condition || (() => true);
            this.dom.appendChild(button);
            this.#buttons.push(button);
        }

        document.body.appendChild(this.dom);
    }

    setMode(input = appState.mode) {
        if (this.#verbose) console.log(input);

        let showFooter = false;
        for (const button of this.#buttons) {
            if (button.modes.includes(input) && button.condition()) {
                button.classList.remove("hide");
                showFooter = true;
            } else {
                button.classList.add("hide");
            }
        }

        if (showFooter) {
            this.dom.classList.add("open");
        } else {
            this.dom.classList.remove("open");
        }
    }
}

class PositionIndicator {
    #div = document.createElement("div");
    #verbose = false;

    constructor() {
        this.dom = document.createElement("div");
        this.dom.classList.add("positionIndicator");

        const leftArrow = document.createElement("p");
        leftArrow.classList.add("positionIndicatorCircle", "left", "empty");
        leftArrow.innerText = "‹";
        leftArrow.onclick = () => playlist.setIndex(Number(playlist.getIndex()) - 1);
        this.dom.appendChild(leftArrow);

        this.#div.classList.add("positionIndicatorDiv");
        this.dom.appendChild(this.#div);

        const rightArrow = document.createElement("p");
        rightArrow.classList.add("positionIndicatorCircle", "right", "empty");
        rightArrow.innerText = "›";
        rightArrow.onclick = () => playlist.setIndex(Number(playlist.getIndex()) + 1);
        this.dom.appendChild(rightArrow);

        document.body.appendChild(this.dom);
    }

    show() {
        this.dom.classList.add("open");
    }

    hide() {
        this.dom.classList.remove("open");
    }

    update(index) {
        index = Number(index);
        this.#div.replaceChildren();

        if (playlist.get()) for (let i of playlist.get().keys()) {
            i += 1;

            if (this.#verbose) console.log(i);

            const circle = document.createElement("p");
            circle.classList.add("positionIndicatorCircle");

            if (index === i) {
                circle.innerText = "●";
            } else {
                circle.innerText = "○";
                circle.classList.add("empty");
                circle.addEventListener("click", () => {
                    playlist.setIndex(i);
                });
            }

            this.#div.appendChild(circle);
        }
    }
}

class Sidebar {
    #open;

    dom = document.createElement("aside");
    sections = [];
    buttons = [];
    #toggleBtn;
    #shadow;

    #verbose = true;

    constructor(sectionNames) {
        // Toggle button

        this.#toggleBtn = document.createElement("button");
        this.#toggleBtn.classList.add("sidebarToggleBtn");
        this.#toggleBtn.onclick = () => this.toggle();

        const toggleBtnImg = document.createElement("img");
        toggleBtnImg.src = "images/Hamburger_Menu.svg";
        toggleBtnImg.alt = "Settings";
        toggleBtnImg.classList.add("icon");
        this.#toggleBtn.appendChild(toggleBtnImg);

        document.body.appendChild(this.#toggleBtn);

        // Sidebar

        this.dom.classList.add("sidebar");
        document.body.appendChild(this.dom);

        sectionNames.forEach(sectionName => {
            const element = document.createElement("div");
            element.classList.add("sidebarDiv");
            element.id = sectionName;
            this.dom.appendChild(element);
            this.sections.push(element);
        });

        // Shadow

        this.#shadow = document.createElement("div");
        this.#shadow.classList.add("sidebarShadow");
        
        document.body.appendChild(this.#shadow);
    }

    // Creating the sidebar

    addVertical() {
        const div = document.createElement("div");
        div.classList.add("sidebarBtnVertical");
        this.sections[0].appendChild(div);
        return div;
    }

    addButton(args) {
        const isP = args.onclick === undefined;
        const element = document.createElement(isP ? "p" : "button");
        if (!isP) {
            element.classList.add("sidebarBtn", "moving");
            element.onclick = () => args.onclick(element);
        }
        element.innerText = args.text;
        args.parent.appendChild(element);
        this.buttons.push([element, args.showWith, args.disableWith])
    }

    addToggle(buttonName, onclick) {
        const label = document.createElement("label");
        label.classList.add("checkbox", "open");

        const input = document.createElement("input");
        input.type = "checkbox";
        input.onclick = () => onclick(input);

        const span = document.createElement("span");

        label.append(input, span, buttonName);
        this.sections[1].appendChild(label);
    }

    addInfo(buttonName, args, pc = false) {
        const aside = document.createElement("aside");
        aside.classList.add("sidebarOverlay");

        args.forEach((arg, index) => {
            let element
            switch (arg[0]) {
                case "h1":
                    element = document.createElement(arg[0]);
                    element.classList.add("songHeader");
                    break;
                case "p":
                    element = document.createElement(arg[0]);
                    element.classList.add("songLyric");
                    break;
                default:
                    return;
            }

            element.innerHTML = args[index][1];
            if (index === 0) element.classList.add("noPadding");
            aside.appendChild(element);
        });

        document.body.appendChild(aside);

        const button = document.createElement("button");
        button.classList.add("sidebarBtn", "wide");
        if (pc) button.classList.add("pc");
        button.innerText = buttonName;
        button.onclick = () => {
            [...document.querySelectorAll(".sidebarOverlay")].filter(e => e !== aside).forEach(sidebarOverlay => sidebarOverlay.classList.remove("open"));
            [...document.querySelectorAll(".sidebarBtn")].filter(e => e !== button).forEach(sidebarBtn => sidebarBtn.classList.remove("highlighted"));
            aside.classList.toggle("open");
            button.classList.toggle("highlighted");
        };

        this.sections[1].appendChild(button);
    }

    // Manipulating the sidebar

    open() {
        this.#open = true;
        this.dom.classList.add("open");
        this.#toggleBtn.classList.add("open");
        this.#shadow.classList.add("open");
        this.setOverlay();
        mainMenu.classList.add("sidebarPadding");
        // contentDivChildren.forEach(song => {song.classList.add("sidebarPadding")}); // todo: add this
    }

    close() {
        this.#open = false;
        this.dom.classList.remove("open");
        this.#toggleBtn.classList.remove("open");
        this.#shadow.classList.remove("open");
        this.setOverlay();
        mainMenu.classList.remove("sidebarPadding");
        // contentDivChildren.forEach(song => {song.classList.add("sidebarPadding")}); // todo: add this
    }

    toggle() {
        if (this.#open) {
            this.close();
        } else {
            this.open();
        }
    }

    setOverlay(exception) {
        document.querySelectorAll(".sidebarOverlay" + (exception ? ":not(#sidebarOverlay-" + exception + ")": "")).forEach(sidebarOverlay => {
            sidebarOverlay.classList.remove("open");
        });

        document.querySelectorAll(".sidebarBtn" + (exception ? ":not(#sidebar-" + exception + ")": "")).forEach(sidebarBtn => {
            sidebarBtn.classList.remove("highlighted");
        });

        if (exception) {
            document.getElementById("sidebarOverlay-" + exception).classList.toggle("open");
            document.getElementById("sidebar-" + exception).classList.toggle("highlighted");
        }
    }

    setButtons(input = appState.mode) {
        if (this.#verbose) console.log("Setting sidebar buttons! Input: " + input)

        if (["song", "playlist", "main", "edit"].includes(input)) {
            // Edit playlist, copy playlist, etc buttons
            this.buttons.forEach(button => {
                if (button[1].includes(input)) {
                    button[0].classList.add("open");
                    button[0].disabled = false;
                } else if (button[2] && button[2].includes(input)) {
                    button[0].classList.add("open");
                    button[0].disabled = true;
                } else {
                    button[0].classList.remove("open");
                }
            });

            // Sidebar toggle button
            if (input === "edit") {
                this.#toggleBtn.disabled = true;
                this.sections[1].classList.add("open");
            } else {
                this.#toggleBtn.disabled = false;
                this.sections[1].classList.remove("open");
            }

            // Playlist viewer's rows
            document.querySelectorAll(".playlistViewerRow").forEach(element => {
                if (input === "edit") {
                    element.classList.add("edit");
                } else {
                    element.classList.remove("edit");
                }
            });
        } else {
            console.log("Failed to set sidebar buttons. Input: " + input);
        }
        
        if (playlist.length() === 0) document.getElementById("sidebarPlaylistCopyBtn").classList.remove("open");
    }
}
