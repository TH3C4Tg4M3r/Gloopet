let userEmail = null;
let coins = 0;
let collection = {};
let packs = {};

const packsDiv = document.getElementById("packs");
const resultDiv = document.getElementById("result");
const collectionDiv = document.getElementById("collectionList");
const container = document.getElementById("gloopit-container");

// --- INITIALIZE ---
document.addEventListener("DOMContentLoaded", checkSession);

async function checkSession() {
  try {
    const res = await fetch("/session");
    const data = await res.json();

    if (!data.loggedIn) {
      // Not logged in → redirect to login page
      window.location.href = "login.html";
      return;
    }

    userEmail = data.email;
    container.style.display = "block"; // show Gloopit UI
    await loadUserData();
  } catch (err) {
    console.error("Error checking session:", err);
    window.location.href = "login.html";
  }
}

// --- LOAD USER DATA FROM SERVER ---
async function loadUserData() {
  try {
    // Fetch coins
    const resCoins = await fetch("/coins");
    const coinData = await resCoins.json();
    coins = coinData.coins;
    document.getElementById("coins").textContent = coins;

    // Fetch user collection from server
    const usersData = await fetch("/users.json").then(r => r.json());
    collection = usersData[userEmail].collection || {};
    updateCollection();

    // Fetch packs
    const packsRes = await fetch("packs.json");
    packs = await packsRes.json();
    showPacks();

  } catch (err) {
    console.error("Error loading user data:", err);
  }
}

// --- UPDATE COLLECTION DISPLAY ---
function updateCollection() {
  collectionDiv.innerHTML = Object.entries(collection)
    .map(([name, count]) => `<div>${name} × ${count}</div>`)
    .join("") || "(empty)";
}

// --- SHOW AVAILABLE PACKS ---
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

  // Subtract coins on server (admin key required)
  coins -= pack.cost;
  await fetch("/coins/" + encodeURIComponent(userEmail), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-admin-key": "YOUR_SECRET_KEY" // use your admin key
    },
    body: JSON.stringify({ coins })
  });

  document.getElementById("coins").textContent = coins;

  // Randomly select blook
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

// --- SHOW PACK RESULT ---
function showResult(blook) {
  resultDiv.innerHTML = `
    <div class="blook">
      🎁 You got: <b>${blook.name}</b> <br>
      <i>${blook.rarity}</i><br>
      <img src="images/${blook.name.replace(/\s/g,'_')}.png" class="blook-img" />
    </div>
  `;
}

// --- ADD BLOOK TO COLLECTION ---
async function addToCollection(blook) {
  if (!collection[blook.name]) collection[blook.name] = 0;
  collection[blook.name]++;

  // Update collection on server
  const usersData = await fetch("/users.json").then(r => r.json());
  usersData[userEmail].collection = collection;

  await fetch("/updateCollection", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(usersData)
  });

  updateCollection();
}
