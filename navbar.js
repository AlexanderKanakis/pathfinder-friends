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
    { href: "character-sheet.html", label: "Character Sheet" },
    { href: "enemies.html", label: "Enemies" },
    { href: "bag-of-holding.html", label: "Bag of Holding" },
    { href: "map.html", label: "Map" },
    { href: "campaigns.html", label: "Campaigns" }
  ];

  function currentPage() {
    return window.location.pathname.split("/").pop() || "dice-roller.html";
  }

  function renderNavbar() {
    const mount = document.getElementById("appNavbar");
    if (!mount) return;
    const page = currentPage();

    mount.innerHTML = `
      <nav class="navbar navbar-expand-lg navbar-dark bg-black border-bottom">
        <div class="container-fluid">
          <a class="navbar-brand" href="dice-roller.html">Pathfinder-friends</a>
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
                  <li class="nav-item">
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
  }

  window.PFNavbar = { render: renderNavbar };
  renderNavbar();
})();
