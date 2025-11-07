// --- Coins setup ---
let coins = parseInt(localStorage.getItem("gloopitCoins"));
if (isNaN(coins)) {
  coins = 500; // first-time bonus
  localStorage.setItem("gloopitCoins", coins);
}
document.getElementById("coins").textContent = coins;

// Update coins function
function updateCoins(change) {
  coins += change;
  if (coins < 0) coins = 0;
  localStorage.setItem("gloopitCoins", coins);
  document.getElementById("coins").textContent = coins;
}

// --- Collection ---
let collection = JSON.parse(localStorage.getItem("gloopitCollection") || "{}");

function updateCollection() {
  collectionDiv.innerHTML = Object.entries(collection)
    .map(([name, count]) => `<div>${name} × ${count}</div>`)
    .join("") || "(empty)";
}

// --- Load packs ---
let packs = {};
async function loadPacks() {
  const res = await fetch("packs.json");
  packs = await res.json();
  showPacks();
  updateCollection();
}

const packsDiv = document.getElementById("packs");
const resultDiv = document.getElementById("result");
const collectionDiv = document.getElementById("collectionList");

function showPacks() {
  packsDiv.innerHTML = "";
  for (const [name, data] of Object.entries(packs)) {
    const div = document.createElement("div");
    div.className = "pack";
    div.innerHTML = `
      <h3>${name}</h3>
      <p>Cost: ${data.cost} coins</p>
      <button onclick="openPack('${name}')">Open Pack</button>
    `;
    packsDiv.appendChild(div);
  }
}

// --- Pack opening ---
function openPack(name) {
  const pack = packs[name];
  if (!pack) return;
  if (coins < pack.cost) {
    alert("Not enough coins!");
    return;
  }
  updateCoins(-pack.cost);

  const rand = Math.random();
  let cumulative = 0;
  for (const blook of pack.blooks) {
    cumulative += blook.chance;
    if (rand <= cumulative) {
      showResult(blook);
      addToCollection(blook);
      return;
    }
  }
}

function showResult(blook) {
  resultDiv.innerHTML = `
    <div class="blook">
      🎁 You got: <b>${blook.name}</b> <br>
      <i>${blook.rarity}</i><br>
      <img src="images/${blook.name.replace(/\s/g,'_')}.png" class="blook-img" />
    </div>
  `;
}

function addToCollection(blook) {
  if (!collection[blook.name]) collection[blook.name] = 0;
  collection[blook.name]++;
  localStorage.setItem("gloopitCollection", JSON.stringify(collection));
  updateCollection();
}

loadPacks();
