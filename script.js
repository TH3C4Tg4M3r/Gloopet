let userEmail = null; // will store the logged-in user's email
let coins = 0;
let collection = {};
let packs = {};

const packsDiv = document.getElementById("packs");
const resultDiv = document.getElementById("result");
const collectionDiv = document.getElementById("collectionList");

// --- CHECK SESSION ---
async function checkSession() {
  const res = await fetch("/session");
  const data = await res.json();
  if (!data.loggedIn) {
    // not logged in, redirect to login page
    window.location.href = "login.html";
    return;
  }
  userEmail = data.email;
  await loadUserData();
}

// --- LOAD USER COINS & COLLECTION ---
async function loadUserData() {
  // Load coins
  const res = await fetch("/coins");
  const data = await res.json();
  coins = data.coins;
  document.getElementById("coins").textContent = coins;

  // Load collection from server-side users.json
  const usersData = await fetch("/users.json").then(r => r.json());
  collection = usersData[userEmail].collection || {};
  updateCollection();

  // Load packs
  const res2 = await fetch("packs.json");
  packs = await res2.json();
  showPacks();
}

// --- UPDATE COLLECTION DISPLAY ---
function updateCollection() {
  collectionDiv.innerHTML = Object.entries(collection)
    .map(([name, count]) => `<div>${name} × ${count}</div>`)
    .join("") || "(empty)";
}

// --- SHOW PACKS ---
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

// --- OPEN PACK ---
async function openPack(name) {
  const pack = packs[name];
  if (!pack) return;

  if (coins < pack.cost) {
    alert("Not enough coins!");
    return;
  }

  // Subtract coins on server
  coins -= pack.cost;
  await fetch("/coins/" + userEmail, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-admin-key": "YOUR_SECRET_KEY" // use your admin key
    },
    body: JSON.stringify({ coins })
  });
  document.getElementById("coins").textContent = coins;

  // Determine random blook
  const rand = Math.random();
  let cumulative = 0;
  for (const blook of pack.blooks) {
    cumulative += blook.chance;
    if (rand <= cumulative) {
      showResult(blook);
      await addToCollection(blook);
      return;
    }
  }
}

// --- SHOW RESULT ---
function showResult(blook) {
  resultDiv.innerHTML = `
    <div class="blook">
      🎁 You got: <b>${blook.name}</b> <br>
      <i>${blook.rarity}</i><br>
      <img src="images/${blook.name.replace(/\s/g,'_')}.png" class="blook-img" />
    </div>
  `;
}

// --- ADD TO COLLECTION ---
async function addToCollection(blook) {
  if (!collection[blook.name]) collection[blook.name] = 0;
  collection[blook.name]++;

  // Update collection on server
  const usersData = await fetch("/users.json").then(r => r.json());
  usersData[userEmail].collection = collection;
  // overwrite users.json with updated collection
  await fetch("/updateCollection", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(usersData)
  });

  updateCollection();
}

// --- INITIALIZE ---
checkSession();
