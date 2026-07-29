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

    console.log(`Loaded ${Object.keys(dict).length} acronyms:`, dict);
    return dict;
  } catch (err) {
    console.error("Failed to refresh acronym dict:", err);
    return null;
  }
}

chrome.runtime.onInstalled.addListener(refreshAcronymDict);