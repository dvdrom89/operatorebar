const BASE_URL = "https://script.google.com/macros/s/AKfycbx_3yeauOxznQ0WqJ7xLEpmxCQXgXRV1w3_0au3VAJh1AdTNICGbbWjxz1Gj3b5jgRs/exec";

async function loadUser() {
  const userId = document.getElementById("userId").value.trim();


  if (!userId) {
    alert("Inserisci un ID valido");
    return;
  }
localStorage.setItem("userId", userId);
  try {
    const response = await fetch(`${BASE_URL}?action=getUser&id=${encodeURIComponent(userId)}`);
    if (!response.ok) throw new Error("Errore nella risposta dal server");
    const data = await response.json();

    if (data === "Utente non trovato") {
      alert("Utente non trovato");
      return;
    }

    document.getElementById("user-name").textContent = `${data.nome} ${data.cognome}`;
    document.getElementById("user-credit").textContent = data.credito.toFixed(2);
    document.getElementById("login-section").style.display = "none";
    document.getElementById("user-section").style.display = "block";

    // Genera QR code con ID utente
    new QRCode(document.getElementById("qrcode"), {
      text: data.id,
      width: 128,
      height: 128,
    });

    // Carica lo storico acquisti
    loadUserHistory(data.id);

  } catch (error) {
    alert("Errore durante il caricamento utente: " + error.message);
  }
}
window.addEventListener("DOMContentLoaded", () => {
  document.getElementById("userId").value = localStorage.getItem("userId") || "";
});


async function loadUserHistory(userId) {
  try {
    const response = await fetch(`${BASE_URL}?action=getHistory&id=${encodeURIComponent(userId)}`);
    if (!response.ok) throw new Error("Errore nella risposta dal server");
    const history = await response.json();

    const historyList = document.getElementById("user-history");
    historyList.innerHTML = "";
    if (history.length === 0) {
      historyList.innerHTML = "<li>Nessuno storico disponibile</li>";
      return;
    }

    history.forEach(item => {
      const li = document.createElement("li");
      const date = new Date(item[0]);
      li.textContent = `${date.toLocaleDateString()} - ${item[3]} (${item[4] > 0 ? "+" : ""}${item[4]} €) da ${item[2]}`;
      historyList.appendChild(li);
    });
  } catch (error) {
    alert("Errore durante il caricamento dello storico: " + error.message);
  }
}

function logout() {
  document.getElementById("login-section").style.display = "block";
  document.getElementById("user-section").style.display = "none";
  document.getElementById("userId").value = "";
  document.getElementById("qrcode").innerHTML = "";
  document.getElementById("user-history").innerHTML = "";
}
