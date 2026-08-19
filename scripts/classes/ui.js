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

    setMode(input = mode) {
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
    #toggleBtn;
    #shadow;

    #verbose = true;

    constructor() {
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

        // Shadow

        this.#shadow = document.createElement("div");
        this.#shadow.classList.add("sidebarShadow");
        
        document.body.appendChild(this.#shadow);
    }

    // Manipulating the sidebar

    open() {
        this.#open = true;
        this.dom.classList.add("open");
        this.#toggleBtn.classList.add("open");
        this.#shadow.classList.add("open");
        this.setOverlay();
        document.getElementById("mainMenu").classList.add("sidebarPadding");
        // contentDivChildren.forEach(song => {song.classList.add("sidebarPadding")}); // todo: add this
    }

    close() {
        this.#open = false;
        this.dom.classList.remove("open");
        this.#toggleBtn.classList.remove("open");
        this.#shadow.classList.remove("open");
        this.setOverlay();
        document.getElementById("mainMenu").classList.remove("sidebarPadding");
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

    setButtons(input = mode) {
        if (this.#verbose) console.log("Setting sidebar buttons! Input: " + input)

        const elementArray = [
            this.#toggleBtn,
            document.getElementById("sidebarPlaylistEditBtn"),
            document.getElementById("sidebarPlaylistSaveBtn"),
            document.getElementById("sidebarPlaylistCopyBtn"),
            document.getElementById("sidebarPlaylistViewer"),
            document.getElementById("sidebarPlaylistHowTo"),
        ]

        const elementArrayQuery = [
            document.querySelectorAll(".playlistViewerRow"),
        ]

        const booleanArray = {
            main:/* */[2, 4, 3, 4, 3, 3, 0],
            song:/* */[2, 1, 3, 4, 3, 3, 0],
            playlist: [2, 1, 3, 4, 3, 3, 0],
            edit:/* */[1, 3, 4, 3, 4, 4, 0],
        }

        if (booleanArray[input]) {
            // 0: hide
            // 1: disable
            // 2: show
            // 3: offscreen
            // 4: onscreen
            elementArray.forEach((element, index) => {
                switch(booleanArray[input][index]) {
                    case 0:
                        element.classList.add("hide");
                        break;
                    case 1:
                        element.classList.remove("hide");
                        element.disabled = true;
                        break;
                    case 2:
                        element.classList.remove("hide");
                        element.disabled = false;
                        break;
                    case 3:
                        element.disabled = false;
                        element.classList.remove("open");
                        break;
                    case 4:
                        element.disabled = false;
                        element.classList.add("open");
                        break;
                }
            });

            // 0: normal
            // 1: edit
            const elementArrayLength = elementArray.length;
            elementArrayQuery.forEach(elements => {
                elements.forEach((element, index) => {
                    index += elementArrayLength;
                    switch(booleanArray[input][index]) {
                        case 0:
                            element.classList.remove("edit");
                            break;
                        case 1:
                            element.classList.add("edit");
                            break;
                    }
                });
            });
        } else {
            console.log("Failed to set sidebar buttons. Input: " + input);
        }
        
        if (playlist.length() === 0) {
            document.getElementById("sidebarPlaylistCopyBtn").classList.remove("open");
        }
    }
}
