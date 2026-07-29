chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type !== "GET_PAGE_TEXT") return;

  const pageText = document.body.innerText;
  sendResponse({ text: pageText });
});