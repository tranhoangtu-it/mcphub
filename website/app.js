/**
 * app.js — mcphub website client
 * Loads index.json, renders server cards, handles search and category filters.
 */

/** @type {{ servers: Record<string, any>, bundles: Record<string, any>, stats: any } | null} */
let registry = null;
let activeCategory = null;

async function init() {
  try {
    const res = await fetch("index.json");
    if (!res.ok) throw new Error("Failed to load index.json");
    registry = await res.json();
  } catch {
    document.getElementById("servers").innerHTML =
      '<p class="empty">Could not load registry data.</p>';
    return;
  }

  renderStats();
  renderFilters();
  renderBundles();
  renderServers();

  // Search handler (debounced)
  let timer;
  document.getElementById("search").addEventListener("input", (e) => {
    clearTimeout(timer);
    timer = setTimeout(() => renderServers(e.target.value), 150);
  });
}

function renderStats() {
  if (!registry?.stats) return;
  const el = document.getElementById("stats");
  const { servers, bundles, categories } = registry.stats;
  el.innerHTML =
    `<div><span>${servers}</span> servers</div>` +
    `<div><span>${bundles}</span> bundles</div>` +
    `<div><span>${categories.length}</span> categories</div>`;
}

function renderFilters() {
  if (!registry?.stats?.categories) return;
  const el = document.getElementById("filters");
  const allChip = createFilterChip("all", true);
  el.appendChild(allChip);

  for (const cat of registry.stats.categories) {
    el.appendChild(createFilterChip(cat, false));
  }
}

function createFilterChip(label, isActive) {
  const chip = document.createElement("button");
  chip.className = "filter-chip" + (isActive ? " active" : "");
  chip.textContent = label;
  chip.addEventListener("click", () => {
    document.querySelectorAll(".filter-chip").forEach((c) => c.classList.remove("active"));
    chip.classList.add("active");
    activeCategory = label === "all" ? null : label;
    renderServers(document.getElementById("search").value);
  });
  return chip;
}

function renderBundles() {
  if (!registry?.bundles) return;
  const el = document.getElementById("bundles");
  const bundles = Object.values(registry.bundles);
  if (bundles.length === 0) {
    document.getElementById("bundles-section").style.display = "none";
    return;
  }

  el.innerHTML = bundles
    .map(
      (b) =>
        `<div class="bundle-card">
      <div class="name">${esc(b.name)}</div>
      <div class="desc">${esc(b.description)}</div>
      <div class="server-list">${b.servers.map((s) => esc(s)).join(", ")}</div>
      <div class="install-cmd">
        <code>npx mcphub bundle install ${esc(b.name)}</code>
        <button class="copy-btn" onclick="copy('npx mcphub bundle install ${esc(b.name)}')">Copy</button>
      </div>
    </div>`,
    )
    .join("");
}

function renderServers(query = "") {
  if (!registry?.servers) return;
  const el = document.getElementById("servers");
  let servers = Object.values(registry.servers);

  // Filter by category
  if (activeCategory) {
    servers = servers.filter((s) => s.category === activeCategory);
  }

  // Filter by search query
  if (query) {
    const q = query.toLowerCase();
    servers = servers.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q) ||
        (s.tags || []).some((t) => t.toLowerCase().includes(q)),
    );
  }

  // Sort: verified first, then alphabetical
  servers.sort((a, b) => {
    if (a.verified !== b.verified) return a.verified ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  if (servers.length === 0) {
    el.innerHTML = '<p class="empty">No servers found.</p>';
    return;
  }

  el.innerHTML = servers.map((s) => renderServerCard(s)).join("");
}

function renderServerCard(s) {
  const verified = s.verified ? '<span class="verified">&#10004; verified</span>' : "";
  const tags = (s.tags || [])
    .map((t) => `<span class="tag">${esc(t)}</span>`)
    .join("");
  const installCmd = `npx mcphub install ${s.name}`;

  return `<div class="server-card">
    <div><span class="name">${esc(s.name)}</span>${verified}</div>
    <div class="desc">${esc(s.description)}</div>
    <div class="meta">
      <span class="tag category-tag">${esc(s.category)}</span>
      ${tags}
    </div>
    <div class="install-cmd">
      <code>${esc(installCmd)}</code>
      <button class="copy-btn" onclick="copy('${esc(installCmd)}')">Copy</button>
    </div>
  </div>`;
}

function copy(text) {
  navigator.clipboard.writeText(text).then(() => {
    // Brief visual feedback
    const btn = event.target;
    const orig = btn.textContent;
    btn.textContent = "Copied!";
    setTimeout(() => (btn.textContent = orig), 1000);
  });
}

function esc(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

init();
