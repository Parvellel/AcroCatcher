// Triggered by clicking the extension icon
chrome.action.onClicked.addListener(async (tab) => {
  
  chrome.tabs.sendMessage(tab.id, { type: "GET_PAGE_TEXT" }, (response) => {
    if (chrome.runtime.lastError) {
      console.error("Content script not available on this page:", chrome.runtime.lastError);
      return;
    }
    const entry = new makeStruct("Acronym, Expansion, Definition");
    
  });
  console.out(dict);
});



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

// background.js (service worker)

// GitHub blob URLs render the page — you need the raw content URL instead.
// blob/main/path -> raw.githubusercontent.com/OWNER/REPO/main/path
const RAW_URL = "https://raw.githubusercontent.com/Parvellel/AcroCatcher/refs/heads/main/AcroCatcherDataHub.json";

async function refreshAcronymDict() {
  try {
    const res = await fetch(RAW_URL);
    if (!res.ok) {
      throw new Error(`Fetch failed: ${res.status} ${res.statusText}`);
    }
    const dict = await res.json();

    await chrome.storage.local.set({
      acronymDict: dict,
      lastUpdated: Date.now(),
    });

    console.log(`Loaded ${Object.keys(dict).length} acronyms`);
    return dict;
  } catch (err) {
    console.error("Failed to refresh acronym dict:", err);
    // Fall back to whatever's already cached rather than wiping it
    const cached = await chrome.storage.local.get("acronymDict");
    return cached.acronymDict ?? null;
  }
}

// Call on install and on a schedule (e.g. chrome.alarms) rather than every page load
chrome.runtime.onInstalled.addListener(refreshAcronymDict);


// // Separate entry point for PDFs — e.g. wired to a context-menu click on a PDF link
// async function handlePdfUrl(pdfUrl) {
//   const response = await fetch(pdfUrl);
//   const buffer = await response.arrayBuffer();
//   const bytes = Array.from(new Uint8Array(buffer)); // JSON-safe representation

//   sendToNativeHost({ source: "pdf", pdfBytes: bytes });
// }

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