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
