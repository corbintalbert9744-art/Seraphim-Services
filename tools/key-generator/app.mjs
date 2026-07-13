const NAV_ITEMS = [
  { id: "all", label: "All Keys", icon: "grid" },
  { id: "keyboard-macro", label: "Keyboard Macro", icon: "keyboard" },
];

let currentFilter = "all";
let meta = { products: [], maxDevices: [], durations: [] };

const els = {
  nav: document.getElementById("nav"),
  statTotal: document.getElementById("statTotal"),
  statActive: document.getElementById("statActive"),
  statDevices: document.getElementById("statDevices"),
  sectionTitle: document.getElementById("sectionTitle"),
  tableBody: document.getElementById("tableBody"),
  createBtn: document.getElementById("createBtn"),
  modal: document.getElementById("modal"),
  modalClose: document.getElementById("modalClose"),
  cancelBtn: document.getElementById("cancelBtn"),
  generateBtn: document.getElementById("generateBtn"),
  maxDevicesSelect: document.getElementById("maxDevicesSelect"),
  durationSelect: document.getElementById("durationSelect"),
  noteInput: document.getElementById("noteInput"),
  toast: document.getElementById("toast"),
};

function iconSvg(type) {
  const icons = {
    grid: '<svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>',
    keyboard: '<svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M8 14h8"/></svg>',
  };
  return icons[type] || icons.grid;
}

function formatDate(iso) {
  if (!iso) return "Never";
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
}

function showToast(msg) {
  els.toast.textContent = msg;
  els.toast.classList.add("show");
  setTimeout(() => els.toast.classList.remove("show"), 2500);
}

async function api(path, options = {}) {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Request failed");
  }
  return res.json();
}

function renderNav() {
  els.nav.innerHTML = NAV_ITEMS.map((item) => `
    <button class="nav-item ${item.id === currentFilter ? "active" : ""}" data-filter="${item.id}">
      ${iconSvg(item.icon)}
      ${item.label}
    </button>
  `).join("");

  els.nav.querySelectorAll(".nav-item").forEach((btn) => {
    btn.addEventListener("click", () => {
      currentFilter = btn.dataset.filter;
      renderNav();
      loadKeys();
      updateSectionTitle();
    });
  });
}

function updateSectionTitle() {
  const item = NAV_ITEMS.find((n) => n.id === currentFilter);
  els.sectionTitle.textContent = currentFilter === "all"
    ? "ALL LICENSE KEYS"
    : `${item?.label.toUpperCase()} KEYS`;
}

function renderTable(keys) {
  if (!keys.length) {
    els.tableBody.innerHTML = `<tr><td colspan="8" class="empty-state">No license keys yet. Click "Create Key" to generate one.</td></tr>`;
    return;
  }

  els.tableBody.innerHTML = keys.map((k) => {
    const devicePct = k.maxDevices ? (k.devicesUsed / k.maxDevices) * 100 : 0;
    const statusClass = k.status === "active" ? "active" : "revoked";

    return `
      <tr data-id="${k.id}">
        <td class="key-cell" title="${k.licenseKey}">${k.licenseKey}</td>
        <td>${k.user ? k.user : '<span class="user-unregistered">Not registered</span>'}</td>
        <td><span class="badge ${statusClass}">${k.status.toUpperCase()}</span></td>
        <td class="device-cell">
          <div class="device-count">${k.devicesUsed}/${k.maxDevices}</div>
          <div class="device-bar"><div class="device-bar-fill" style="width:${devicePct}%"></div></div>
        </td>
        <td>${formatDate(k.createdAt)}</td>
        <td>${k.expiresAt ? formatDate(k.expiresAt) : "Never"}</td>
        <td>${formatDate(k.lastUsedAt)}</td>
        <td>
          <div class="actions">
            <button class="action-btn" data-action="copy" data-key="${k.licenseKey}" title="Copy key">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
            </button>
            <button class="action-btn" data-action="reset" data-id="${k.id}" title="Reset devices">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 4v6h6"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/></svg>
            </button>
            <button class="action-btn danger" data-action="delete" data-id="${k.id}" title="Delete key">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join("");

  els.tableBody.querySelectorAll(".action-btn").forEach((btn) => {
    btn.addEventListener("click", handleAction);
  });
}

async function handleAction(e) {
  const btn = e.currentTarget;
  const action = btn.dataset.action;

  if (action === "copy") {
    await navigator.clipboard.writeText(btn.dataset.key);
    showToast("License key copied");
    return;
  }

  if (action === "reset") {
    if (!confirm("Reset device count for this key?")) return;
    await api(`/api/keys/${btn.dataset.id}`, {
      method: "PATCH",
      body: JSON.stringify({ devicesUsed: 0 }),
    });
    showToast("Devices reset");
    await refresh();
    return;
  }

  if (action === "delete") {
    if (!confirm("Delete this license key permanently?")) return;
    await api(`/api/keys/${btn.dataset.id}`, { method: "DELETE" });
    showToast("Key deleted");
    await refresh();
  }
}

async function loadStats() {
  try {
    const stats = await api("/api/stats");
    els.statTotal.textContent = stats.total ?? 0;
    els.statActive.textContent = stats.active ?? 0;
    els.statDevices.textContent = stats.usedDevices ?? 0;
  } catch {
    els.statTotal.textContent = "0";
    els.statActive.textContent = "0";
    els.statDevices.textContent = "0";
  }
}

async function loadKeys() {
  const keys = await api(`/api/keys?product=${currentFilter}`);
  renderTable(keys);
}

async function refresh() {
  await Promise.all([loadStats(), loadKeys()]);
}

function populateModalSelects() {
  els.maxDevicesSelect.innerHTML = meta.maxDevices
    .map((n) => `<option value="${n}">${n} Device${n > 1 ? "s" : ""}</option>`)
    .join("");

  els.durationSelect.innerHTML = meta.durations
    .map((d) => `<option value="${d.id}">${d.label}</option>`)
    .join("");
}

function openModal() {
  els.noteInput.value = "";
  els.modal.classList.add("open");
}

function closeModal() {
  els.modal.classList.remove("open");
}

async function generateKey() {
  const body = {
    product: "keyboard-macro",
    maxDevices: Number(els.maxDevicesSelect.value),
    duration: els.durationSelect.value,
    note: els.noteInput.value.trim(),
  };

  const record = await api("/api/keys", {
    method: "POST",
    body: JSON.stringify(body),
  });

  closeModal();
  showToast(`Key created: ${record.licenseKey}`);
  await refresh();
}

els.createBtn.addEventListener("click", openModal);
els.modalClose.addEventListener("click", closeModal);
els.cancelBtn.addEventListener("click", closeModal);
els.generateBtn.addEventListener("click", () => generateKey().catch((e) => showToast(e.message)));
els.modal.addEventListener("click", (e) => {
  if (e.target === els.modal) closeModal();
});

async function init() {
  meta = await api("/api/meta");
  populateModalSelects();
  renderNav();
  updateSectionTitle();
  await refresh();
}

init().catch(console.error);
