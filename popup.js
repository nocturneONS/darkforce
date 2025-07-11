const cssBox = document.getElementById("cssBox"); // textarea dla CSS
const saveBtn = document.getElementById("saveBtn");
const clearBtn = document.getElementById("clearBtn");
const status = document.getElementById("status");
const magicWandBtn = document.getElementById("magicWandBtn");

document.getElementById("openEditorBtn").addEventListener("click", () => {
  browser.runtime.openOptionsPage();
});


let currentDomain = "";

cssBox.addEventListener("input", () => {
  const css = cssBox.value.trim();
  sendCssToContent(css);
});

function updateStatus(msg) {
  status.textContent = msg;
  setTimeout(() => {
    status.textContent = "";
  }, 2000);
}

function normalizeDomain(domain) {
  return domain.startsWith("www.") ? domain.slice(4) : domain;
}

async function getCurrentDomain() {
  let tabs = await browser.tabs.query({ active: true, currentWindow: true });
  let url = new URL(tabs[0].url);
  return normalizeDomain(url.hostname);
}

// Załaduj aktualną domenę i styl
async function loadCurrentStyle() {
  currentDomain = await getCurrentDomain();
  const data = await browser.storage.local.get("styles");
  const styles = data.styles || {};
  cssBox.value = styles[currentDomain] || "";
}

loadCurrentStyle();

// Wyślij CSS do content scriptu aktualnej karty
async function sendCssToContent(css) {
  let tabs = await browser.tabs.query({ active: true, currentWindow: true });
  if (tabs.length > 0) {
    browser.tabs.sendMessage(tabs[0].id, {
      action: "updateCSS",
      css: css
    });
  }
}

// Powiadom content script o usunięciu stylu
async function sendRemoveCss() {
  let tabs = await browser.tabs.query({ active: true, currentWindow: true });
  if (tabs.length > 0) {
    browser.tabs.sendMessage(tabs[0].id, {
      action: "removeCSS"
    });
  }
}

// Obsługa zapisu stylu
saveBtn.addEventListener("click", async () => {
  const css = cssBox.value.trim();
  const data = await browser.storage.local.get("styles");
  const styles = data.styles || {};

  styles[currentDomain] = css;

  await browser.storage.local.set({ styles });

  updateStatus("Zapisano!");
  sendCssToContent(css);
});

// Obsługa czyszczenia stylu
clearBtn.addEventListener("click", async () => {
  const data = await browser.storage.local.get("styles");
  const styles = data.styles || {};

  delete styles[currentDomain];

  await browser.storage.local.set({ styles });

  cssBox.value = "";
  updateStatus("Usunięto styl dla tej domeny.");
  sendRemoveCss();
});

// Magic Wand - aktywacja trybu usuwania elementów
magicWandBtn.addEventListener("click", async () => {
  let tabs = await browser.tabs.query({ active: true, currentWindow: true });
  if (tabs.length > 0) {
    browser.tabs.sendMessage(tabs[0].id, { action: "activateWand" });
  }
});

// Odbiór wiadomości (np. appendCSS z Magic Wand)
browser.runtime.onMessage.addListener((message) => {
  if (message.action === "appendCSS") {
    cssBox.value += `\n${message.css}`;
    updateStatus("Dodano selektor z Magic Wand ✨");
  }
});
