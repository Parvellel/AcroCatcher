let acronymDict = null;
let presentAcros = [];
let newAcros = [];
let matchingAcros = [];

import * as pdfjsLib from './lib/pdf/build/pdf.mjs';

pdfjsLib.GlobalWorkerOptions.workerSrc = chrome.runtime.getURL('./lib/pdf/build/pdf.worker.mjs');


// Load dict once, then keep it fresh in case it updates later

/*
Core Structural
*/

async function loadAcronymDict() {
  const result = await chrome.storage.local.get("acronymDict");
  acronymDict = result.acronymDict;
}

document.addEventListener("DOMContentLoaded", () => {
  // Size the popup immediately — no async work in front of this
  const screenWidth = window.screen.availWidth;
  const screenHeight = window.screen.availHeight;

  let targetWidth = Math.floor(screenWidth * 0.30);
  let targetHeight = Math.floor(screenHeight * 0.45);

  targetWidth = Math.max(320, Math.min(targetWidth, 800));
  targetHeight = Math.max(400, Math.min(targetHeight, 600));

  document.documentElement.style.width = `${targetWidth}px`;
  document.documentElement.style.height = `${targetHeight}px`;
  document.body.style.width = `${targetWidth}px`;
  document.body.style.height = `${targetHeight}px`;

  // Wire up listeners right away too
  document.querySelector("#scan").addEventListener("click", scanButtonClicked);
  document.querySelector("#search").addEventListener("click", searchButtonClicked);

  // Dict loading happens separately, doesn't block anything above
  loadAcronymDict();
});

async function extractTextFromPdf(pdfData) {
  const loadingTask = pdfjsLib.getDocument({ data: pdfData });
  const pdf = await loadingTask.promise;

  let fullText = '';
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map(item => item.str).join(' ');
    fullText += pageText + '\n';
  }
  return fullText;
}



/*
Interaction Handling
*/

async function scanButtonClicked() {
    const allPresentAcros = await gatherAllPresentAcros();
    let content = createAllEntries(allPresentAcros);
    displayEntries(content);
}

async function searchButtonClicked() {
    const searchAcro = document.querySelector("#searchterm").value.trim(); // separate input id
    
    localStorage.setItem("searchAcro", searchAcro);
    const upperSearch = searchAcro.toUpperCase(); // fixed typo
    let content = "";

    if (!searchAcro){
        content = generateEntries(presentAcros);
    }else{
        matchingAcros = presentAcros.filter(acro => acro === upperSearch); // proper predicate
        content = generateEntries(matchingAcros);
    }

    

    // only show unknown-acronym prompt if the search term itself was unknown
    if (newAcros.includes(upperSearch)||searchAcro) {
        content += `<h2>Unknown Acronym: ${upperSearch}</h2><button type="button" id="${upperSearch}FormFill" class="FormFillButton">Request Addition?</button>`;
    }

    document.querySelector("#entries").innerHTML = content;
}



/*
Resource Gathering
*/

async function gatherAllPresentAcros(){
    if (!acronymDict) {
    console.warn("No acronym dictionary cached yet — try again in a moment.");
    return;
    }

    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    let results = "";
    if(!activeTab.url.endsWith(".pdf")){
        results = await chrome.scripting.executeScript({
            target: { tabId: activeTab.id, allFrames: true },
            func: () => document.body.innerText,
        });
    }else{
        const response = await fetch(activeTab.url);
        const arrayBuffer = await response.arrayBuffer();
        results = await extractTextFromPdf(new Uint8Array(arrayBuffer));
    }
    
    const combinedText = Array.isArray(results)
        ? results.map(r => r.result || "").join("\n")
        : results;

    const foundAcronyms = extractAcronyms(combinedText);

    matchingAcros = [];
    newAcros = [];
    presentAcros = [];

    let content = "";
    for (const acronym of foundAcronyms) {
        if (acronymDict.hasOwnProperty(acronym)) {
            console.log(`YES — "${acronym}" is listed:`, acronymDict[acronym]);
            matchingAcros.push(acronym);
        } else {
            console.log(`NO — "${acronym}" is not listed in the JSON.`);
            newAcros.push(acronym);
        }
    }
    presentAcros.push(matchingAcros);
    presentAcros.push(newAcros);

    return presentAcros;
}



/*
Content Creation
*/

function createAllEntries(allPresentAcros){
    let content = "";
    for(const currRecogAcro of allPresentAcros[0]){
        content += generateEntry(currRecogAcro,acronymDict[currRecogAcro].expanded,acronymDict[currRecogAcro].definition);
    }
    for(const currNewAcro of allPresentAcros[1]){
        content+= generateUnknown(currNewAcro);
    }
    console.log(content);
    return content;
}

function generateEntry(acronym, expantion, definition) {
    let segment = "";
    if (definition == undefined) {
        segment += `<div class='entry'><h2>${acronym}\n</h2><h3>${expantion}\n</h3></div>`;
    } else {
        segment += `<div class='entry'><h2>${acronym}\n</h2><h3>${expantion}\n</h3><p>${definition}</p></div>`;
    }
    return segment;
}

function generateUnknown(newAcro){
    let content = `<h2>Unknown Acronym: ${newAcro}</h2><button type="button" id="${newAcro}FormFill" class="FormFillButton">Request Addition?</button>`;
    return content;
}



/*
Toolbox
*/

function extractAcronyms(pageText) {
  const matches = pageText.match(/\b[A-Z]{2,}[A-Z0-9]*\b/g) || [];
  return [...new Set(matches)];
}

function displayEntries(fullEntries){
    document.querySelector("#entries").innerHTML = fullEntries;
}

/*
Defunked

function generateEntries(currList) {
    let content = "";
    for (const currAcro of currList) {
        if (acronymDict[currAcro].definition == undefined) {
            content += generateEntry(currAcro, acronymDict[currAcro].expanded, "N/A");
        } else {
            content += generateEntry(currAcro, acronymDict[currAcro].expanded, acronymDict[currAcro].definition);
        }
    }
    return content;
}

function compareAcronyms(foundAcronyms, acronymDict) {
    // reset state each scan so results don't accumulate across runs
    presentAcros = [];
    newAcros = [];

    let content = "";
    for (const acronym of foundAcronyms) {
        if (acronymDict.hasOwnProperty(acronym)) {
            console.log(`YES — "${acronym}" is listed:`, acronymDict[acronym]);
            presentAcros.push(acronym);
        } else {
            console.log(`NO — "${acronym}" is not listed in the JSON.`);
            newAcros.push(acronym);
        }
    }
    console.log(presentAcros);
    content += generateEntries(presentAcros);
    for (const newAcro of newAcros) {
        content += `<h2>Unknown Acronym: ${newAcro}</h2><button type="button" id="${newAcro}FormFill" class="FormFillButton">Request Addition?</button>`;
    }
    console.log(content);
    document.querySelector("#entries").innerHTML = content;
}

*/