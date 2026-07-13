(function () {
  const links = [
    { href: "dice-roller.html", label: "Dice Roller" },
    {
      label: "Crafting",
      children: [
        { href: "craft-calculator.html", label: "Alchemical Crafting" },
        { href: "magic-craft-calculator.html", label: "Magic Crafting" }
      ]
    },
    { href: "characters.html", label: "Characters" },
    { href: "enemies.html", label: "Enemies" },
    { href: "bag-of-holding.html", label: "Bag of Holding" },
    { href: "map.html", label: "Map" },
    { href: "campaigns.html", label: "Campaigns" }
  ];

  function currentPage() {
    const page = window.location.pathname.split("/").pop() || "dice-roller.html";
    return page === "character-sheet.html" ? "characters.html" : page;
  }

  function renderNavbar() {
    const mount = document.getElementById("appNavbar");
    if (!mount) return;
    const page = currentPage();
    if (page === "auth.html") {
      mount.innerHTML = "";
      return;
    }

    mount.innerHTML = `
      <nav class="navbar navbar-expand-md navbar-dark bg-black border-bottom">
        <div class="container-fluid">
          <a class="navbar-brand" href="dice-roller.html">PathFriends</a>
          <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarMain" aria-controls="navbarMain" aria-expanded="false" aria-label="Toggle navigation">
            <span class="navbar-toggler-icon"></span>
          </button>

          <div class="collapse navbar-collapse" id="navbarMain">
            <ul class="navbar-nav me-auto mb-2 mb-lg-0">
              ${links.map(link => {
                if (link.children) {
                  const isActive = link.children.some(child => child.href === page);
                  return `
                    <li class="nav-item dropdown">
                      <a class="nav-link dropdown-toggle ${isActive ? "active" : ""}" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                        ${link.label}
                      </a>
                      <ul class="dropdown-menu dropdown-menu-dark">
                        ${link.children.map(child => `
                          <li><a class="dropdown-item ${child.href === page ? "active" : ""}" href="${child.href}">${child.label}</a></li>
                        `).join("")}
                      </ul>
                    </li>
                  `;
                }

                return `
                  <li class="nav-item ${link.href === "enemies.html" ? "d-none" : ""}" data-nav-item="${link.href}">
                    <a class="nav-link ${link.href === page ? "active" : ""}" href="${link.href}">${link.label}</a>
                  </li>
                `;
              }).join("")}
            </ul>
            <div id="authNav" class="d-flex gap-2 align-items-center"></div>
          </div>
        </div>
      </nav>
    `;
    injectNavbarStyles();
  }

  function injectNavbarStyles() {
    if (document.getElementById("pf-navbar-styles")) return;
    const style = document.createElement("style");
    style.id = "pf-navbar-styles";
    style.textContent = `
      #navbarMain { min-width: 0; }
      #navbarMain .navbar-nav { min-width: 0; flex-wrap: wrap; align-items: center; }
      #navbarMain .nav-link { white-space: normal; line-height: 1.25; }
      #authNav { min-width: 0; margin-left: auto; justify-content: flex-end; }
      #authNav .nav-session-controls { min-width: 0; }
      #authNav .nav-session-field { min-width: 0; }
      #authNav .nav-session-field select { width: clamp(140px, 16vw, 240px); max-width: 100%; }
      #authNav .nav-profile-link span { max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      @media (min-width: 1400px) {
        #navbarMain .navbar-nav { flex-wrap: nowrap; align-items: center; }
        #navbarMain .nav-link { white-space: nowrap; }
        #authNav { flex-wrap: nowrap; align-items: end !important; }
      }
      @media (max-width: 1399.98px) {
        #navbarMain .navbar-nav { display: flex; }
        #authNav { align-items: end !important; flex: 0 1 auto; }
        #authNav .nav-session-controls { flex-wrap: nowrap !important; }
        #authNav .nav-session-field { flex: 0 1 190px; }
        #authNav .nav-session-field select { width: 100%; }
        #authNav .nav-profile-link { justify-content: flex-start; flex: 0 0 auto; }
      }
      @media (max-width: 850px) {
        #navbarMain { align-items: stretch; }
        #navbarMain .navbar-nav { display: flex; width: 100%; align-items: flex-start; text-align: left; }
        #navbarMain .nav-item, #navbarMain .nav-link { width: 100%; text-align: left; }
        #authNav, #authNav .nav-session-controls { width: 100%; }
        #authNav { justify-content: flex-start; margin-top: .75rem; }
        #authNav .nav-session-controls { flex-wrap: wrap !important; }
        #authNav .nav-session-field { flex: 1 1 220px; }
      }
    `;
    document.head.appendChild(style);
  }

  window.PFNavbar = { render: renderNavbar };
  renderNavbar();
})();
