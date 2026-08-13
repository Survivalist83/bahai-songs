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
        leftArrow.onclick = () => playlistAdvance(-1);
        this.dom.appendChild(leftArrow);

        this.#div.classList.add("positionIndicatorDiv");
        this.dom.appendChild(this.#div);

        const rightArrow = document.createElement("p");
        rightArrow.classList.add("positionIndicatorCircle", "right", "empty");
        rightArrow.innerText = "›";
        rightArrow.onclick = () => playlistAdvance(1);
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
                    playlistSet(i);
                });
            }

            this.#div.appendChild(circle);
        }
    }
}

function sidebarOverlay(input) {
    if (input !== "") {
        const sidebarOverlayTest = document.getElementById("sidebarOverlay-" + input);
        sidebarOverlayTest.classList.toggle("open");

        document.querySelectorAll(".sidebarOverlay:not(#sidebarOverlay-" + input + ")").forEach(otherSidebar => {
            otherSidebar.classList.remove("open");
        });

        const sidebarBtn = document.getElementById("sidebar-" + input);
        sidebarBtn.classList.toggle("highlighted");

        document.querySelectorAll(".sidebarBtn:not(#sidebar-" + input + ")").forEach(otherBtn => {
            otherBtn.classList.remove("highlighted");
        });
    } else {
        document.querySelectorAll(".sidebarOverlay").forEach(sidebarOverlay => {
            sidebarOverlay.classList.remove("open");
        });

        document.querySelectorAll(".sidebarBtn").forEach(sidebarBtn => {
            sidebarBtn.classList.remove("highlighted");
        });
    }
}

function setSidebarVisibility(input) {
    const sidebar = document.getElementById("sidebar");
    const sidebarToggle = document.getElementById("sidebarToggleBtn");
    const sidebarShadow = document.getElementById("sidebarShadow");
    const mainMenu = document.getElementById("mainMenu");
    const contentDivChildren = [...document.getElementById("contentDiv").children];

    sidebarOverlay("");

    switch (input) {
        case "toggle":
            sidebar.classList.toggle("open");
            sidebarToggle.classList.toggle("open");
            sidebarShadow.classList.toggle("open");
            mainMenu.classList.toggle("sidebarPadding");
            contentDivChildren.forEach(song => {song.classList.toggle("sidebarPadding")});
            break;
        case "open":
            sidebar.classList.add("open");
            sidebarToggle.classList.add("open");
            sidebarShadow.classList.add("open");
            mainMenu.classList.add("sidebarPadding");
            contentDivChildren.forEach(song => {song.classList.add("sidebarPadding")});
            break;
        case "close":
            sidebar.classList.remove("open");
            sidebarToggle.classList.remove("open");
            sidebarShadow.classList.remove("open");
            mainMenu.classList.remove("sidebarPadding");
            contentDivChildren.forEach(song => {song.classList.remove("sidebarPadding")});
            break;
    }
}

// Offsets position: absolute .sidebarBtn.moving elements when the scrollbar is present, so they are still centered
let sidebar;
let resizeObserver;
function checkSidebarScrollbar() {
    document.documentElement.style.setProperty("--sidebar-scrollbar-offset",
        (sidebar.scrollHeight > sidebar.clientHeight) ? "5px" : "0px");
}
