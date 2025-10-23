// script.js — SPA behavior & mock feed logic (local-only)
(() => {
    // Elements
    const navLinks = document.querySelectorAll(".nav-link");
    const pages = document.querySelectorAll(".page");
    const feedNowBtn = document.getElementById("feedNowBtn");
    const simulateBtn = document.getElementById("simulateBtn");
    const statusText = document.getElementById("statusText");
    const lastFedEl = document.getElementById("lastFed");
    const totalFeedsEl = document.getElementById("totalFeeds");
    const todayFeedsEl = document.getElementById("todayFeeds");
    const portionSelect = document.getElementById("portionSelect");
    const portionLabel = document.getElementById("portionLabel");
    const saveSettingsBtn = document.getElementById("saveSettings");
    const resetSettingsBtn = document.getElementById("resetSettings");
    const historyTableBody = document.querySelector("#historyTable tbody");
    const exportCsvBtn = document.getElementById("exportCsv");
    const clearHistoryBtn = document.getElementById("clearHistory");
    const cameraImg = document.getElementById("cameraImg");
    const cameraFrame = document.getElementById("cameraFrame");
    const cameraUrlInput = document.getElementById("cameraUrl");
    const loadCameraBtn = document.getElementById("loadCamera");
    const themeToggle = document.getElementById("themeToggle");
  
    // Simple SPA navigation
    navLinks.forEach(btn => {
      btn.addEventListener("click", () => {
        navLinks.forEach(n => n.classList.remove("active"));
        btn.classList.add("active");
        const target = btn.dataset.target;
        pages.forEach(p => p.classList.toggle("hidden", p.id !== target));
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    });
  
    // Local storage keys
    const LS_HISTORY = "spfs_history_v1";
    const LS_SETTINGS = "spfs_settings_v1";
  
    // Utilities
    function nowISO() { return new Date().toISOString(); }
    function formatLocal(dt) {
      const d = new Date(dt);
      return d.toLocaleString();
    }
  
    // Load settings
    const defaultSettings = { portion: "1 Cup", scheduleTime: "", servings: 1 };
    let settings = JSON.parse(localStorage.getItem(LS_SETTINGS) || "null") || defaultSettings;
    function applySettingsToUI() {
      if (portionSelect) portionSelect.value = settings.portion || defaultSettings.portion;
      if (portionLabel) portionLabel.textContent = settings.portion || defaultSettings.portion;
    }
    applySettingsToUI();
  
    saveSettingsBtn?.addEventListener("click", () => {
      settings.portion = portionSelect.value;
      settings.scheduleTime = document.getElementById("scheduleTime").value;
      settings.servings = Number(document.getElementById("servings").value || 1);
      localStorage.setItem(LS_SETTINGS, JSON.stringify(settings));
      applySettingsToUI();
      alert("Settings saved locally. You can connect these to Supabase later.");
    });
  
    resetSettingsBtn?.addEventListener("click", () => {
      localStorage.removeItem(LS_SETTINGS);
      settings = defaultSettings;
      applySettingsToUI();
      alert("Settings reset.");
    });
  
    // History handling
    let history = JSON.parse(localStorage.getItem(LS_HISTORY) || "[]");
  
    function saveHistory() {
      localStorage.setItem(LS_HISTORY, JSON.stringify(history));
      renderHistory();
      updateStats();
    }
  
    function addHistoryEntry(triggeredBy = "manual", portion = settings.portion || "1 Cup") {
      const date = new Date();
      const entry = {
        id: history.length + 1,
        iso: date.toISOString(),
        date: date.toLocaleDateString(),
        time: date.toLocaleTimeString(),
        portion,
        triggered_by: triggeredBy
      };
      history.unshift(entry); // latest first
      saveHistory();
      lastFedEl.textContent = formatLocal(entry.iso);
    }
  
    function renderHistory() {
      historyTableBody.innerHTML = "";
      history.forEach((h, i) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `<td>${history.length - i}</td>
                        <td>${h.date}</td>
                        <td>${h.time}</td>
                        <td>${h.portion}</td>
                        <td>${h.triggered_by}</td>`;
        historyTableBody.appendChild(tr);
      });
      totalFeedsEl.textContent = history.length;
      // Today count
      const today = new Date().toLocaleDateString();
      todayFeedsEl.textContent = history.filter(h => h.date === today).length;
    }
  
    // Feed simulation / mock behaviour
    function startFeeding(triggeredBy = "manual") {
      statusText.textContent = "Feeding...";
      statusText.style.color = "#d97706";
      feedNowBtn.disabled = true;
      simulateBtn.disabled = true;
  
      // simulate camera snapshot change
      cameraImg.src = `https://via.placeholder.com/800x450?text=Feeding...&t=${Date.now()}`;
  
      // after delay, complete
      setTimeout(() => {
        statusText.textContent = "Idle";
        statusText.style.color = "";
        feedNowBtn.disabled = false;
        simulateBtn.disabled = false;
        addHistoryEntry(triggeredBy, settings.portion);
      }, 1800);
    }
  
    feedNowBtn?.addEventListener("click", () => {
      // mock action - no backend connected yet
      startFeeding("manual");
    });
  
    simulateBtn?.addEventListener("click", () => {
      startFeeding("simulation");
    });
  
    // Export CSV
    exportCsvBtn?.addEventListener("click", () => {
      if (!history.length) return alert("No history to export.");
      const csvRows = [["No","Date","Time","Portion","Triggered"]];
      history.slice().reverse().forEach((h, idx) => {
        csvRows.push([idx+1,h.date,h.time,h.portion,h.triggered_by]);
      });
      const csvContent = csvRows.map(r => r.map(cell => `"${String(cell).replace(/"/g,'""')}"`).join(",")).join("\n");
      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = "feeding_history.csv"; a.click();
      URL.revokeObjectURL(url);
    });
  
    clearHistoryBtn?.addEventListener("click", () => {
      if (!confirm("Clear local feeding history? This action cannot be undone.")) return;
      history = [];
      saveHistory();
    });
  
    // Camera load
    loadCameraBtn?.addEventListener("click", () => {
      const url = cameraUrlInput.value.trim();
      if (!url) return alert("Enter a camera stream URL.");
      // iframe will refuse some streams; we set src for demo. User may need to use image tag or proxy for MJPEG.
      cameraFrame.src = url;
      alert("Camera URL applied to Camera View (iframe). If your stream blocks embedding, use the Dashboard placeholder or open the URL directly.");
    });
  
    // Theme toggle (light/dark)
    let dark = localStorage.getItem("spfs_dark") === "1";
    function applyTheme() {
      if (dark) {
        document.documentElement.style.setProperty("--bg","#07133a");
        document.documentElement.style.setProperty("--card","#091427");
        document.documentElement.style.setProperty("--text","#e6eef8");
        document.documentElement.style.setProperty("--muted","#9fb1d1");
      } else {
        document.documentElement.style.removeProperty("--bg");
        document.documentElement.style.removeProperty("--card");
        document.documentElement.style.removeProperty("--text");
        document.documentElement.style.removeProperty("--muted");
      }
      themeToggle.textContent = dark ? "☀️" : "🌙";
      localStorage.setItem("spfs_dark", dark ? "1" : "0");
    }
    themeToggle?.addEventListener("click", () => { dark = !dark; applyTheme(); });
    applyTheme();
  
    // Initialize UI
    renderHistory();
    updateStats();
  
    function updateStats(){
      totalFeedsEl.textContent = history.length;
      const today = new Date().toLocaleDateString();
      todayFeedsEl.textContent = history.filter(h => h.date === today).length;
      // Uptime placeholder (for demo)
      const started = performance.timing ? performance.timing.navigationStart : Date.now();
      const secs = Math.max(0, Math.floor((Date.now() - started) / 1000));
      document.getElementById("uptime").textContent = `${Math.floor(secs/60)}m`;
    }
  
    // Auto-refresh small things every 10s
    setInterval(() => {
      updateStats();
    }, 10000);
  
    // Expose helpers for debug (optional)
    window.__SPFS = {
      addHistoryEntry,
      history,
      settings
    };
  
  })();
  