const express = require("express");
const fs = require("fs");
const bodyParser = require("body-parser");
const session = require("express-session");
const bcrypt = require("bcrypt");

const app = express();
app.use(bodyParser.json());
app.use(express.static("."));

// --- SESSION SETUP ---
app.use(session({
  secret: "YOUR_SECRET_SESSION_KEY",
  resave: false,
  saveUninitialized: true,
}));

// --- USERS STORAGE ---
const USERS_FILE = "users.json";
let users = {};
if (fs.existsSync(USERS_FILE)) {
  users = JSON.parse(fs.readFileSync(USERS_FILE));
}

// --- SIGNUP ---
app.post("/signup", async (req, res) => {
  const { email, password } = req.body;
  if (users[email]) return res.status(400).json({ error: "Email already exists" });

  const hash = await bcrypt.hash(password, 10);
  users[email] = { password: hash, coins: 500, collection: {} };
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));

  req.session.user = email;
  res.json({ success: true });
});

// --- LOGIN ---
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = users[email];
  if (!user) return res.status(400).json({ error: "Incorrect email or password" });

  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(400).json({ error: "Incorrect email or password" });

  req.session.user = email;
  res.json({ success: true });
});

// --- CHECK SESSION ---
app.get("/session", (req, res) => {
  if (req.session.user) res.json({ loggedIn: true, email: req.session.user });
  else res.json({ loggedIn: false });
});

// --- GET COINS ---
app.get("/coins", (req, res) => {
  const user = users[req.session.user];
  if (!user) return res.status(403).json({ error: "Not logged in" });
  res.json({ coins: user.coins });
});

// --- UPDATE COINS (Admin only) ---
const ADMIN_KEY = "YOUR_SECRET_KEY";
app.post("/coins/:email", (req, res) => {
  const key = req.headers["x-admin-key"];
  if (key !== ADMIN_KEY) return res.status(403).json({ error: "Forbidden" });

  const targetEmail = req.params.email;
  const user = users[targetEmail];
  if (!user) return res.status(404).json({ error: "User not found" });

  user.coins = req.body.coins;
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
  res.json({ success: true, coins: user.coins });
});

app.listen(3000, () => console.log("Server running on port 3000"));

// --- UPDATE COLLECTION ---
app.post("/updateCollection", (req, res) => {
  const usersData = req.body;

  // overwrite users.json (server only)
  fs.writeFileSync(USERS_FILE, JSON.stringify(usersData, null, 2));
  res.json({ success: true });
});
