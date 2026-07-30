function extractAcronyms(pageText) {
  const matches = pageText.match(/\b[A-Z]{2,}[A-Z0-9]*\b/g) || [];
  return [...new Set(matches)];
}

function compareAcronyms(foundAcronyms, acronymDict) {
    let content="";
    let newAcros=[];
    for (const acronym of foundAcronyms) {
        if (acronymDict.hasOwnProperty(acronym)) {
            console.log(`YES — "${acronym}" is listed:`, acronymDict[acronym]);
            content+= generateEntry(acronym,acronymDict[acronym].expanded,acronymDict[acronym].definition);
            console.log(content);
        } else {
            console.log(`NO — "${acronym}" is not listed in the JSON.`);
            newAcros.push(acronym);
        }
    }
    for (const newAcro of newAcros){
        content+=`<h2>Unknown Acronym: ${newAcro}</h2><button type="button" id="${newAcro}FormFill" class="FormFillButton">Request Addition?</button>`
    }
  console.log(content);
  document.querySelector("#entries").innerHTML = content;
}

function generateEntry(acronym, expantion, definition){
    let segment = `<div class='entry'><h2>${acronym}\n</h2><h3>${expantion}\n</h3><p>${definition}</p></div>`;
    return segment;
}

async function scanButtonClicked() {
  const { acronymDict } = await chrome.storage.local.get("acronymDict");
  if (!acronymDict) {
    console.warn("No acronym dictionary cached yet — try again in a moment.");
    return;
  }

  const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });

  const results = await chrome.scripting.executeScript({
    target: { tabId: activeTab.id, allFrames: true },
    func: () => document.body.innerText,
  });

  const combinedText = results.map(r => r.result || "").join("\n");
  const foundAcronyms = extractAcronyms(combinedText);

  console.log("Acronyms found on page (all frames):", foundAcronyms);
  compareAcronyms(foundAcronyms, acronymDict);
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelector("#scan").addEventListener("click", scanButtonClicked);
  const screenWidth = window.screen.availWidth;
  const screenHeight = window.screen.availHeight;

  // Define target scale (e.g., take up roughly 40% width and 60% height of screen)
  let targetWidth = Math.floor(screenWidth * 0.30);
  let targetHeight = Math.floor(screenHeight * 0.45);

  // Clamp values strictly inside browser extensions limits
  targetWidth = Math.max(320, Math.min(targetWidth, 800));
  targetHeight = Math.max(400, Math.min(targetHeight, 600));

  // Apply the pixel width and height directly to the document elements
  document.body.style.width = `${targetWidth}px`;
  document.body.style.height = `${targetHeight}px`;
});