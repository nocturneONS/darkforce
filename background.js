browser.action.onClicked.addListener(async () => {
  const sidebar = await browser.sidebarAction.isOpen();
  if (sidebar) {
    await browser.sidebarAction.close();
  } else {
    await browser.sidebarAction.open();
  }
});
