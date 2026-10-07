(function () {
  const links = [
    { href: "dice-roller.html", label: "Dice Roller" },
    {
      label: "Crafting",
      children: [
        { href: "craft-calculator.html", label: "Alchemical Crafting" },
        { href: "magic-craft-calculator.html", label: "Magic Crafting" },
      ],
    },
    { href: "characters.html", label: "Characters" },
    { href: "enemies.html", label: "Enemies" },
    { href: "bag-of-holding.html", label: "Bag of Holding" },
    { href: "map.html", label: "Map" },
    { href: "calendar.html", label: "Calendar" },
    { href: "campaigns.html", label: "Campaigns" },
  ];

  function currentPage() {
    const page =
      window.location.pathname.split("/").pop() || "dice-roller.html";
    if (page === "character-sheet.html") {
      const params = new URLSearchParams(window.location.search);
      return params.get("enemyId") ? "enemies.html" : "characters.html";
    }
    return page;
  }

  function renderNavbar() {
    const mount = document.getElementById("appNavbar");
    if (!mount) return;
    const page = currentPage();
    if (page === "auth.html") {
      mount.innerHTML = "";
      injectNavbarStyles();
      return;
    }

    mount.innerHTML = `
      <nav class="navbar navbar-expand-xxl navbar-dark bg-black border-bottom">
        <div class="container-fluid">
          <a class="navbar-brand" href="dice-roller.html">PathFriends</a>
          <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarMain" aria-controls="navbarMain" aria-expanded="false" aria-label="Toggle navigation">
            <span class="navbar-toggler-icon"></span>
          </button>

          <div class="collapse navbar-collapse" id="navbarMain">
            <ul class="navbar-nav me-auto mb-2 mb-lg-0">
              ${links
                .map((link) => {
                  if (link.children) {
                    const isActive = link.children.some(
                      (child) => child.href === page,
                    );
                    return `
                    <li class="nav-item dropdown">
                      <a class="nav-link dropdown-toggle ${isActive ? "active" : ""}" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                        ${link.label}
                      </a>
                      <ul class="dropdown-menu dropdown-menu-dark">
                        ${link.children
                          .map(
                            (child) => `
                          <li><a class="dropdown-item ${child.href === page ? "active" : ""}" href="${child.href}">${child.label}</a></li>
                        `,
                          )
                          .join("")}
                      </ul>
                    </li>
                  `;
                  }

                  return `
                  <li class="nav-item ${link.href === "enemies.html" ? "d-none" : ""}" data-nav-item="${link.href}">
                    <a class="nav-link ${link.href === page ? "active" : ""}" href="${link.href}">${link.label}</a>
                  </li>
                `;
                })
                .join("")}
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
      #navbarMain .navbar-nav {
        min-width: 0;
        align-items: flex-start;
      }
      #navbarMain .nav-item,
      #navbarMain .nav-link {
        width: 100%;
        text-align: left;
      }
      #navbarMain .nav-link {
        white-space: nowrap;
        line-height: 1.25;
      }
      #authNav {
        width: 100%;
        min-width: 0;
        margin-top: .75rem;
        justify-content: flex-start;
        align-items: end !important;
      }
      #authNav .nav-session-controls {
        width: 100%;
        min-width: 0;
        flex-wrap: wrap !important;
      }
      #authNav .nav-session-field {
        min-width: 0;
        flex: 1 1 220px;
      }
      #authNav .nav-session-field select { width: 100%; max-width: 100%; }
      #authNav .nav-profile-link span { max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      input::placeholder,
      textarea::placeholder,
      .form-control::placeholder {
        color: #c7c7c7 !important;
        opacity: 1 !important;
      }
      @media (min-width: 1400px) {
        #navbarMain .navbar-nav { flex-wrap: nowrap; align-items: center; }
        #navbarMain .nav-item, #navbarMain .nav-link { width: auto; }
        #authNav {
          width: auto;
          margin-top: 0;
          margin-left: auto;
          justify-content: flex-end;
          flex: 0 1 auto;
          flex-wrap: nowrap;
        }
        #authNav .nav-session-controls { width: auto; flex-wrap: nowrap !important; }
        #authNav .nav-session-field { flex: 0 1 190px; }
        #authNav .nav-session-field select { width: clamp(140px, 16vw, 240px); }
        #authNav .nav-profile-link { justify-content: flex-start; flex: 0 0 auto; }
      }
    `;
    document.head.appendChild(style);
  }

  window.PFNavbar = { render: renderNavbar };
  renderNavbar();
})();
