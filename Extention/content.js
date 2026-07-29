chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type !== "GET_PAGE_TEXT") return;

  const pageText = document.body.innerText;
  console.log("Raw page text length:", pageText.length);
  console.log("First 200 chars:", pageText.slice(0, 200));
  sendResponse({ text: pageText });
});