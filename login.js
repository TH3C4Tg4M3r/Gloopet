const loginBtn = document.getElementById("loginBtn");
const signupBtn = document.getElementById("signupBtn");
const messageDiv = document.getElementById("message");

loginBtn.onclick = async () => {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const res = await fetch("/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();

  if (data.success) window.location.href = "index.html";
  else messageDiv.textContent = data.error;
};

signupBtn.onclick = async () => {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const res = await fetch("/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();

  if (data.success) window.location.href = "index.html";
  else messageDiv.textContent = data.error;
};
