const cssBox = document.getElementById("cssBox");
const saveBtn = document.getElementById("saveBtn");
const uploadCssFile = document.getElementById("uploadCssFile");
const status = document.getElementById("status");

function updateStatus(msg) {
  status.textContent = msg;
  setTimeout(() => {
    status.textContent = "";
  }, 3000);
}

function normalizeDomain(domain) {
  return domain.startsWith("www.") ? domain.slice(4) : domain;
}

async function getCurrentDomain() {
  // Pobierz URL aktualnej aktywnej karty
  let tabs = await browser.tabs.query({ active: true, currentWindow: true });
  let url = new URL(tabs[0].url);
  return normalizeDomain(url.hostname);
}

async function loadStyle() {
  const domain = await getCurrentDomain();
  const data = await browser.storage.local.get("styles");
  const styles = data.styles || {};
  cssBox.value = styles[domain] || "";
  updateStatus("Załadowano styl dla: " + domain);
}

loadStyle();

uploadCssFile.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;

  if (!file.name.endsWith(".css")) {
    alert("Proszę wybrać plik .css");
    return;
  }

  const reader = new FileReader();
  reader.onload = function(evt) {
    cssBox.value = evt.target.result;
    updateStatus("Załadowano plik CSS do edytora");
  };
  reader.readAsText(file);
});

saveBtn.addEventListener("click", async () => {
  const css = cssBox.value.trim();
  const domain = await getCurrentDomain();
  const data = await browser.storage.local.get("styles");
  const styles = data.styles || {};

  styles[domain] = css;

  await browser.storage.local.set({ styles });
  updateStatus("Zapisano styl dla " + domain);
});
