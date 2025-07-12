const cssBox = document.getElementById("cssBox");
const saveBtn = document.getElementById("saveBtn");
const clearBtn = document.getElementById("clearBtn");
const status = document.getElementById("status");
const magicWandBtn = document.getElementById("magicWandBtn");
const destroyerBtn = document.getElementById("destroyerBtn");

let currentDomain = "";

// Normalizacja domeny
function normalizeDomain(domain) {
  return domain.startsWith("www.") ? domain.slice(4) : domain;
}

// Załaduj aktualną domenę
async function getCurrentDomain() {
  let tabs = await browser.tabs.query({ active: true, currentWindow: true });
  let url = new URL(tabs[0].url);
  return normalizeDomain(url.hostname);
}

// Załaduj styl z localStorage i wpisz do textarea
async function loadCurrentStyle() {
  currentDomain = await getCurrentDomain();
  const data = await browser.storage.local.get("styles");
  const styles = data.styles || {};
  cssBox.value = styles[currentDomain] || "";
}

loadCurrentStyle();

// Nasłuchuj zmian w storage i aktualizuj textarea jeśli zmieniły się style danej domeny
browser.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.styles) {
    const styles = changes.styles.newValue || {};
    if (styles[currentDomain]) {
      cssBox.value = styles[currentDomain];
      updateStatus("Zaktualizowano style z localStorage");
    } else {
      cssBox.value = "";
      updateStatus("Usunięto style dla tej domeny");
    }
  }
});

function updateStatus(msg) {
  status.textContent = msg;
  setTimeout(() => {
    status.textContent = "";
  }, 2000);
}

// Wyślij CSS do content scriptu, gdy edytujemy textarea
cssBox.addEventListener("input", async () => {
  const css = cssBox.value.trim();
  sendCssToContent(css);
});

// Wyślij CSS do content scriptu
async function sendCssToContent(css) {
  let tabs = await browser.tabs.query({ active: true, currentWindow: true });
  if (tabs.length > 0) {
    browser.tabs.sendMessage(tabs[0].id, {
      action: "updateCSS",
      css: css,
    });
  }
}

// Usuń styl z content scriptu i localStorage
clearBtn.addEventListener("click", async () => {
  const data = await browser.storage.local.get("styles");
  const styles = data.styles || {};

  delete styles[currentDomain];

  await browser.storage.local.set({ styles });

  cssBox.value = "";
  updateStatus("Usunięto styl dla tej domeny.");
  sendRemoveCss();
});
 
async function sendRemoveCss() {
  let tabs = await browser.tabs.query({ active: true, currentWindow: true });
  if (tabs.length > 0) {
    browser.tabs.sendMessage(tabs[0].id, {
      action: "removeCSS",
    });
  }
};

// Obsługa zapisu przyciskiem save
saveBtn.addEventListener("click", async () => {
  const css = cssBox.value.trim();
  const data = await browser.storage.local.get("styles");
  const styles = data.styles || {};

  styles[currentDomain] = css;

  await browser.storage.local.set({ styles });

  updateStatus("Zapisano!");
  sendCssToContent(css);
});

// Obsługa trybów Magic Wand i Destroyer — wysyłamy komunikaty do content.js
magicWandBtn.addEventListener("click", async () => {
  let tabs = await browser.tabs.query({ active: true, currentWindow: true });
  if (tabs.length > 0) {
    browser.tabs.sendMessage(tabs[0].id, { action: "activateWand" });
  }
});

destroyerBtn.addEventListener("click", async () => {
  let tabs = await browser.tabs.query({ active: true, currentWindow: true });
  if (tabs.length > 0) {
    browser.tabs.sendMessage(tabs[0].id, { action: "activateDestro" });
  }
});
document.getElementById("openEditorBtn").addEventListener("click", async () => {
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  const url = new URL(tab.url);
  const domain = url.hostname.replace(/^www\./, "");
  const optionsUrl = `options.html?domain=${encodeURIComponent(domain)}`;
  browser.tabs.create({ url: optionsUrl });
});
