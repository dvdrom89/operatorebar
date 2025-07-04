const BASE_URL = "https://script.google.com/macros/s/AKfycbxE7N8UPQouBXlD1rxAjpXcWZXml0F4bkshTiyT3UEJilohVhsqOU4BT75wcgGdmGt1nA/exec";
let selectedUserId = "";

async function loadUsers() {
  try {
    const res = await fetch(`${BASE_URL}?action=getUserList`);
    const users = await res.json();
    if (!Array.isArray(users)) throw new Error("Risposta non valida");

    const select = document.getElementById("userSelect");
    select.innerHTML = "<option value=''>-- Seleziona un utente --</option>";
    users.forEach(user => {
      const opt = document.createElement("option");
      opt.value = user.id;
      opt.textContent = `${user.nome} ${user.cognome} - €${parseFloat(user.credito).toFixed(2)}`;
      select.appendChild(opt);
    });

    select.onchange = () => {
      selectedUserId = select.value;
      document.getElementById("result").textContent = "";
    };
  } catch (err) {
    document.getElementById("result").textContent = "Errore caricamento utenti: " + err.message;
    console.error("Errore caricamento utenti:", err);
  }
}

async function loadProducts() {
  const res = await fetch(`${BASE_URL}?action=getProducts`);
  const products = await res.json();
  const select = document.getElementById("productSelect");
  select.innerHTML = "<option value=''>-- Seleziona un prodotto --</option>";
  products.forEach(p => {
    const opt = document.createElement("option");
    opt.value = p.nome;
    opt.textContent = `${p.nome} (€${p.prezzo})`;
    select.appendChild(opt);
  });
}

// Messaggio "Utente scansionato ✅" centrato
function showFeedbackMessage(text) {
  const message = document.getElementById("feedbackMessage");
  message.textContent = text;
  message.classList.add("fade");
  message.style.display = "block";
  navigator.vibrate?.(200); // vibrazione se disponibile
  new Audio("beep.mp3").play().catch(() => {}); // suono opzionale

  setTimeout(() => {
    message.style.display = "none";
    message.classList.remove("fade");
  }, 2500);
}

// Overlay con spinner e messaggio (es. Addebito in corso)
function showLoadingMessage(text) {
  const result = document.getElementById("resultMessage");
  result.innerHTML = `
    <div class="spinner"></div>
    <div>${text}</div>
  `;
  result.style.display = "flex";
}

// Nasconde l'overlay
function hideLoadingMessage() {
  const result = document.getElementById("resultMessage");
  result.style.display = "none";
}

// Mostra messaggio finale temporaneo
function showFinalMessage(text) {
  const result = document.getElementById("resultMessage");
  result.innerHTML = `<div>${text}</div>`;
  result.style.display = "flex";
  setTimeout(() => {
    result.style.display = "none";
  }, 3000);
}

// Funzione Addebita
function charge() {
  const operatore = document.getElementById("operatore").value.trim();
  if (!selectedUserId || !operatore) return alert("Compila tutti i campi");

  const prodotto = document.getElementById("productSelect").value;
  if (!prodotto) return alert("Seleziona un prodotto");

  showLoadingMessage("Addebito in corso...");

  fetch(`${BASE_URL}?action=charge&id=${selectedUserId}&operatore=${encodeURIComponent(operatore)}&prodotto=${encodeURIComponent(prodotto)}`, {
    method: "POST"
  })
  .then(r => r.text())
  .then(txt => {
    hideLoadingMessage();
    showFinalMessage(txt);
    document.getElementById("result").textContent = txt;
  })
  .catch(err => {
    hideLoadingMessage();
    alert("Errore durante l'addebito: " + err.message);
  });
}

// Funzione Accredita
function credit() {
  const operatore = document.getElementById("operatore").value.trim();
  if (!selectedUserId || !operatore) return alert("Compila tutti i campi");

  const importo = parseFloat(document.getElementById("importo").value);
  if (isNaN(importo) || importo <= 0) return alert("Inserisci un importo valido");

  showLoadingMessage("Accredito in corso...");

  fetch(`${BASE_URL}?action=credit&id=${selectedUserId}&operatore=${encodeURIComponent(operatore)}&importo=${importo}`, {
    method: "POST"
  })
  .then(r => r.text())
  .then(txt => {
    hideLoadingMessage();
    showFinalMessage(txt);
    document.getElementById("result").textContent = txt;
  })
  .catch(err => {
    hideLoadingMessage();
    alert("Errore durante l'accredito: " + err.message);
  });
}

// Inizializzazione QR Scanner
const html5QrCode = new Html5Qrcode("reader");
Html5Qrcode.getCameras().then(devices => {
  const backCam = devices.find(cam => cam.label.toLowerCase().includes("back")) || devices[0];
  if (backCam) {
    html5QrCode.start(
      backCam.id,
      { fps: 10, qrbox: 250 },
      qrCodeMessage => {
        selectedUserId = qrCodeMessage;
        document.getElementById("result").textContent = `Utente selezionato: ${qrCodeMessage}`;
        document.getElementById("userSelect").value = qrCodeMessage;
        showFeedbackMessage("Utente scansionato ✅");
      }
    );
  }
});

// Caricamento iniziale
window.onload = () => {
  loadUsers();
  loadProducts();
};
