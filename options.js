const cssBox = document.getElementById("cssBox");
const saveBtn = document.getElementById("saveBtn");
const uploadCssFile = document.getElementById("uploadCssFile");
const status = document.getElementById("status");
const domainInfo = document.getElementById("domainInfo");

let currentDomain = "";

function getDomainFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get("domain") || "";
}


function updateStatus(msg) {
  status.textContent = msg;
  setTimeout(() => (status.textContent = ""), 3000);
}

function normalizeDomain(domain) {
  return domain.startsWith("www.") ? domain.slice(4) : domain;
}

async function getCurrentDomain() {
  let tabs = await browser.tabs.query({ active: true, currentWindow: true });
  let url = new URL(tabs[0].url);
  return normalizeDomain(url.hostname);
}

async function loadStyle() {
  currentDomain = getDomainFromURL();
  if (!currentDomain) {
    domainInfo.textContent = `Nie wykryto domeny`;
    return;
  }
  domainInfo.textContent = `Edytujesz styl dla: ${currentDomain}`;
  const data = await browser.storage.local.get("styles");
  const styles = data.styles || {};
  cssBox.value = styles[currentDomain] || "";
  updateStatus("Załadowano styl.");
}

loadStyle();

uploadCssFile.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  if (!file.name.endsWith(".css")) {
    alert("Wybierz plik .css");
    return;
  }
  const reader = new FileReader();
  reader.onload = (evt) => {
    cssBox.value = evt.target.result;
    updateStatus("Załadowano plik CSS do edytora.");
  };
  reader.readAsText(file);
});

saveBtn.addEventListener("click", async () => {
  const css = cssBox.value.trim();
  const data = await browser.storage.local.get("styles");
  const styles = data.styles || {};
  styles[currentDomain] = css;
  await browser.storage.local.set({ styles });
  updateStatus("Styl zapisany!");
});
