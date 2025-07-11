function normalizeDomain(domain) {
  return domain.startsWith("www.") ? domain.slice(4) : domain;
}

const domain = normalizeDomain(location.hostname);

let injectedStyle = null;

function applyStyle(css) {
  if (injectedStyle) {
    injectedStyle.remove();
    injectedStyle = null;
  }
  if (css) {
    injectedStyle = document.createElement("style");
    injectedStyle.textContent = css;
    document.head.appendChild(injectedStyle);
  }
}

function removeStyle() {
  if (injectedStyle) {
    injectedStyle.remove();
    injectedStyle = null;
  }
}

// Na start pobierz style i zastosuj jeśli są
browser.storage.local.get("styles").then(result => {
  const styles = result.styles || {};
  if (styles[domain]) {
    applyStyle(styles[domain]);
  }
  console.log("Styles z storage:", styles);
  console.log("CSS dla domeny", domain, "to:", styles[domain]);
});

// Nasłuchuj wiadomości z popupu
browser.runtime.onMessage.addListener((message) => {
  switch (message.action) {
    case "updateCSS":
      applyStyle(message.css);
      break;

    case "removeCSS":
      removeStyle();
      break;

    case "activateWand":
      activateWandMode();
      break;
  }
});

// --- Magic Wand ---
let wandActive = false;
let wandOverlay = null;

function activateWandMode() {
  if (wandActive) return;

  wandActive = true;
  document.body.style.cursor = "crosshair";

  function highlight(e) {
    if (!wandOverlay) {
      wandOverlay = document.createElement("div");
      Object.assign(wandOverlay.style, {
        position: "absolute",
        zIndex: 9999,
        pointerEvents: "none",
        border: "2px dashed red",
      });
      document.body.appendChild(wandOverlay);
    }
    const rect = e.target.getBoundingClientRect();
    Object.assign(wandOverlay.style, {
      top: `${rect.top + window.scrollY}px`,
      left: `${rect.left + window.scrollX}px`,
      width: `${rect.width}px`,
      height: `${rect.height}px`,
    });
  }

  function clickHandler(e) {
    e.preventDefault();
    e.stopPropagation();

    const el = e.target;
    let selector = "";

    if (el.id) {
      selector = `#${el.id}`;
    } else if (el.classList.length > 0) {
      selector = "." + [...el.classList].join(".");
    } else {
      selector = el.tagName.toLowerCase();
    }

    const cssRule = `${selector} {\n  display: none !important;\n}`;

    saveWandRule(cssRule);

    cleanup();
  }

  function cleanup() {
    wandActive = false;
    document.body.style.cursor = "";
    if (wandOverlay) {
      wandOverlay.remove();
      wandOverlay = null;
    }
    document.removeEventListener("mousemove", highlight);
    document.removeEventListener("click", clickHandler, true);
  }

  document.addEventListener("mousemove", highlight);
  document.addEventListener("click", clickHandler, true);
}

function saveWandRule(cssRule) {
  browser.storage.local.get("styles").then((result) => {
    const styles = result.styles || {};
    const current = styles[domain] || "";
    styles[domain] = current + "\n" + cssRule;

    browser.storage.local.set({ styles }).then(() => {
      applyStyle(styles[domain]);
      console.log("[MagicWand] Zapisano i zastosowano:", cssRule);
    });
  });
}
