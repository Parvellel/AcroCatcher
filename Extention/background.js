// Triggered by clicking the extension icon
chrome.action.onClicked.addListener(async (tab) => {
  chrome.tabs.sendMessage(tab.id, { type: "GET_PAGE_TEXT" }, (response) => {
    if (chrome.runtime.lastError) {
      console.error("Content script not available on this page:", chrome.runtime.lastError);
      return;
    }
    const entry = new makeStruct("Acronym, Expansion, Definition");
    
  });
});

// Separate entry point for PDFs — e.g. wired to a context-menu click on a PDF link
async function handlePdfUrl(pdfUrl) {
  const response = await fetch(pdfUrl);
  const buffer = await response.arrayBuffer();
  const bytes = Array.from(new Uint8Array(buffer)); // JSON-safe representation

  sendToNativeHost({ source: "pdf", pdfBytes: bytes });
}

// function sendToNativeHost(payload) {
//   const port = chrome.runtime.connectNative("com.yourname.acronym_lookup");

//   port.onMessage.addListener((msg) => {
//     console.log("Definitions found:", msg.definitions);
//     // TODO: render msg.definitions somewhere the user can see it
//   });

//   port.onDisconnect.addListener(() => {
//     if (chrome.runtime.lastError) {
//       console.error("Native host error:", chrome.runtime.lastError.message);
//     }
//   });

//   port.postMessage(payload);
// }

function makeStruct(keys) {
  if (!keys) return null;
  const k = keys.split(', ');
  const count = k.length;

  /** @constructor */
  function constructor() {
    for (let i = 0; i < count; i++) this[k[i]] = arguments[i];
  }
  return constructor;
}