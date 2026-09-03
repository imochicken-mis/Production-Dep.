// ===================================================================
// Production System — app.js (base shell)
// This starts empty on purpose. Next steps will add a MODULES object
// (same pattern as the Transport VMS project) plus the generic
// renderModule()/paintRows()/openForm() renderer, one module at a time.
// ===================================================================

const cache = {}; // sheet -> rows, refreshed on each view load

// ---- Current session ----
const currentUser = JSON.parse(sessionStorage.getItem("qa_user") || "null");
if (currentUser) {
  document.getElementById("footUser").textContent = `${currentUser.username} (${currentUser.role || "Staff"})`;
}

document.getElementById("logoutBtn").addEventListener("click", () => {
  sessionStorage.removeItem("qa_user");
  window.location.href = "login.html";
});

// ===================================================================
// ROLE-BASED ACCESS CONTROL — hide nav buttons not in AllowedTabs
// ===================================================================
function applyAllowedTabsFilter_() {
  if (!currentUser || !currentUser.allowedTabs || currentUser.allowedTabs.length === 0) {
    return; // no restriction — show everything (e.g. Admin with empty AllowedTabs = full access)
  }

  document.querySelectorAll(".nav-item").forEach((btn) => {
    const view = btn.dataset.view;
    if (!currentUser.allowedTabs.includes(view)) {
      btn.style.display = "none";
    }
  });
}

applyAllowedTabsFilter_();

// ===================================================================
// NAVIGATION
// ===================================================================
const navItems = document.querySelectorAll(".nav-item");
const views = document.querySelectorAll(".view");
const viewTitle = document.getElementById("viewTitle");
const sidebar = document.getElementById("sidebar");

navItems.forEach((btn) => {
  btn.addEventListener("click", () => showView(btn.dataset.view));
});
document.getElementById("hamburgerBtn").addEventListener("click", () => {
  sidebar.classList.toggle("open");
});

// ===================================================================
// SIDEBAR — Collapse/Expand toggle
// ===================================================================
const sidebarCollapseBtn = document.getElementById("sidebarCollapseBtn");
const collapseIcon = document.getElementById("collapseIcon");
const appShell = document.querySelector(".app-shell");

// Restore saved state (persists across page loads within this browser)
if (sessionStorage.getItem("sidebar_collapsed") === "true") {
  appShell.classList.add("sidebar-collapsed");
  collapseIcon.textContent = "▶";
}

sidebarCollapseBtn.addEventListener("click", () => {
  const isCollapsed = appShell.classList.toggle("sidebar-collapsed");
  collapseIcon.textContent = isCollapsed ? "▶" : "◀";
  sessionStorage.setItem("sidebar_collapsed", isCollapsed);
});

// ===================================================================
// SIDEBAR — Collapsible KPI's / Reports accordion
// ===================================================================
const kpiToggle = document.getElementById("kpiToggle");
const reportsToggle = document.getElementById("reportsToggle");
const notificationsToggle = document.getElementById("notificationsToggle");
const kpiCollapse = document.getElementById("kpiCollapse");
const reportsCollapse = document.getElementById("reportsCollapse");
const notificationsCollapse = document.getElementById("notificationsCollapse");

function setSection(open) {
  // open = "kpi" | "reports" | "notifications" | null
  kpiToggle.classList.toggle("active", open === "kpi");
  reportsToggle.classList.toggle("active", open === "reports");
  notificationsToggle.classList.toggle("active", open === "notifications");
  kpiCollapse.classList.toggle("open", open === "kpi");
  reportsCollapse.classList.toggle("open", open === "reports");
  notificationsCollapse.classList.toggle("open", open === "notifications");
}

function toggleSection(section) {
  const collapseMap = { kpi: kpiCollapse, reports: reportsCollapse, notifications: notificationsCollapse };
  const isOpen = collapseMap[section].classList.contains("open");
  setSection(isOpen ? null : section);
}

kpiToggle.addEventListener("click", () => toggleSection("kpi"));
reportsToggle.addEventListener("click", () => toggleSection("reports"));
notificationsToggle.addEventListener("click", () => toggleSection("notifications"));

function showView(key) {
  // Block navigation to a view the user isn't allowed to see
  if (currentUser && currentUser.allowedTabs && currentUser.allowedTabs.length > 0
      && !currentUser.allowedTabs.includes(key)) {
    alert("You don't have permission to access this section.");
    return;
  }
  navItems.forEach((b) => b.classList.toggle("active", b.dataset.view === key));
  views.forEach((v) => v.classList.toggle("active", v.id === `view-${key}`));
  viewTitle.textContent = document.querySelector(`.nav-item[data-view="${key}"]`).textContent.trim();
  sidebar.classList.remove("open");

  // Auto-expand the matching section
  let section;
  if (key === "dashboard-new" || key.startsWith("kpi-")) section = "kpi";
  else if (key.startsWith("notify-kpi-")) section = "notifications";
  else section = "reports";
  setSection(section);

  if (key === "daily-lb-input") initLbInputReport();
  if (key === "total-lb") initTotalLbReport();
  if (key === "chill-weight") initChillWeightReport();
  if (key === "dress-weight") initDressWeightReport();
  if (key === "production-weight") initProductionWeightReport();
  if (key === "chil-vs-dress") initChillVsDressReport();
  if (key === "total-production-summary") initTotalProductionSummary();
  if (key === "salesforecast-vs-production") initSalesForecastVsProduction();
  if (key === "lbtarget-vs-actual") initLbTargetVsActual();
  if (key === "productiontarget-vs-actual") initProductionTargetVsActual();
  if (key === "easy-&-giblet-stock") initEasyGibletStock();
  if (key === "Stock-Available") initStockAvailable();
  if (key === "yield-report") initYieldReport();
  if (key === "all-division-consumable-reports") initAllDivisionConsumableReport();
  if (key === "kpi-01") initBayMortalityKpi();
  if (key === "kpi-05") initDressedYieldKpi();
  if (key === "kpi-06") initChillLossKpi();
  if (key === "kpi-04") initPackingEfficiencyKpi();
  if (key === "kpi-03") initBirdInputEfficiencyKpi();

  // NEW: Notification views
  if (key === "notify-kpi-01") initNotifyKpi("01");
  if (key === "notify-kpi-02") initNotifyKpi("02");
  if (key === "notify-kpi-03") initNotifyKpi("03");
  if (key === "notify-kpi-04") initNotifyKpi("04");
  if (key === "notify-kpi-05") initNotifyKpi("05");
  if (key === "notify-kpi-06") initNotifyKpi("06");
}

// ===================================================================
// API STATUS PING
// ===================================================================
(async function init() {
  const statusEl = document.getElementById("apiStatus");
  try {
    await Api.list("Users");
    statusEl.textContent = "connected";
  } catch {
    statusEl.textContent = "not connected";
  }
  if (currentUser && currentUser.allowedTabs && currentUser.allowedTabs.length > 0) {
  const firstAllowed = currentUser.allowedTabs[0];
  showView(firstAllowed);
  } else {
  showView("dashboard-new"); // default for unrestricted users
  }
})();

// ===================================================================
// DAILY LB INPUT REPORT
// ===================================================================
function initLbInputReport() {
  const dateInput = document.getElementById("lbDateFilter");
  if (dateInput.dataset.bound) {
    return;   // already rendered — panel HTML persists in the DOM, no need to re-fetch
  }
  dateInput.dataset.bound = "true";

  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  dateInput.value = today;

  dateInput.addEventListener("change", () => {
    if (dateInput.value) renderLbInputReport(dateInput.value);
  });

  document.getElementById("lbCsvBtn").addEventListener("click", () => {
    if (window.currentLbReport) downloadReportCsv_(window.currentLbReport);
  });
  document.getElementById("lbPdfBtn").addEventListener("click", () => {
    printWithFilename_(`Daily_LB_Input_Report_${window.currentLbReport?.date || "report"}`);
  });

  renderLbInputReport(today);
}

async function renderLbInputReport(dateStr) {
  const panel = document.getElementById("lbInputPanel");
  const batchDisplay = document.getElementById("lbBatchDisplay");
  panel.innerHTML = `<p class="hint">Loading…</p>`;

  try {
    const report = await buildReport("lbInput", dateStr);
    window.currentLbReport = report;
    batchDisplay.textContent = `Batch No: ${report.batchNo}`;

    // Fill the print-only header
    document.getElementById("printDate").textContent = formatDateDMY_(report.date);
    document.getElementById("printBatch").textContent = report.batchNo;

    if (report.locations.length === 0) {
      panel.innerHTML = `<p class="hint">No data found for ${dateStr}.</p>`;
      return;
    }

    panel.innerHTML = renderReportTable_(report);
  } catch (err) {
    panel.innerHTML = `<p class="hint error">Failed to load report: ${err.message}</p>`;
  }
}

function renderReportTable_(report) {
  const locCols = report.locations.map((loc) => `<th>${loc}</th>`).join("");

  const rows = report.metrics.map((m) => {
    const cells = m.values.map((v) => `<td>${formatNum_(v, m.decimals)}</td>`).join("");
    return `<tr><td class="row-label">${m.label}</td>${cells}<td class="total-cell">${formatNum_(m.total, m.decimals)}</td></tr>`;
  }).join("");

  return `
    <table class="report-table">
      <thead>
        <tr>
          <th class="row-label">Farmer Reference</th>
          ${locCols}
          <th class="total-col">Total</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

// ===================================================================
// TOTAL LB REPORT
// ===================================================================
const MONTH_NAMES_ = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function initTotalLbReport() {
  const monthSelect = document.getElementById("totalLbMonth");
  const yearSelect = document.getElementById("totalLbYear");

  if (monthSelect.dataset.bound) {
    return;   // already rendered — panel HTML persists, skip re-fetch
  }
  monthSelect.dataset.bound = "true";

  const nowYear = new Date().getFullYear();
  for (let y = nowYear - 3; y <= nowYear + 1; y++) {
    const opt = document.createElement("option");
    opt.value = y;
    opt.textContent = y;
    if (y === nowYear) opt.selected = true;
    yearSelect.appendChild(opt);
  }
  monthSelect.value = new Date().getMonth() + 1;

  monthSelect.addEventListener("change", renderTotalLbReport);
  yearSelect.addEventListener("change", renderTotalLbReport);

  document.getElementById("totalLbCsvBtn").addEventListener("click", () => {
    if (window.currentTotalLbReport) downloadTotalLbCsv_(window.currentTotalLbReport);
  });
  document.getElementById("totalLbPdfBtn").addEventListener("click", () => {
    const r = window.currentTotalLbReport;
    printWithFilename_(r ? `Total_LB_Report_${MONTH_NAMES_[r.month - 1]}_${r.year}` : "Total_LB_Report");
  });

  renderTotalLbReport();
}

async function renderTotalLbReport() {
  const year = document.getElementById("totalLbYear").value;
  const month = document.getElementById("totalLbMonth").value;
  const panel = document.getElementById("totalLbPanel");
  panel.innerHTML = `<p class="hint">Loading…</p>`;

  try {
    const report = await buildTotalLbReport(year, month);
    window.currentTotalLbReport = report;
    document.getElementById("totalLbPrintMonth").textContent = `${MONTH_NAMES_[month - 1]} ${year}`;
    panel.innerHTML = renderTotalLbTable_(report);
  } catch (err) {
    panel.innerHTML = `<p class="hint error">Failed to load report: ${err.message}</p>`;
  }
}

function renderTotalLbTable_(report) {
  const cols = TOTAL_LB_COLUMNS_;

  const groupCells = [];
  let i = 0;
  while (i < cols.length) {
    const g = cols[i].group;
    if (!g) { groupCells.push(`<th></th>`); i++; continue; }
    let span = 0;
    while (i + span < cols.length && cols[i + span].group === g) span++;
    groupCells.push(`<th colspan="${span}">${g}</th>`);
    i += span;
  }

  const colHeaders = cols.map((c) => `<th>${c.label}</th>`).join("");

  const bodyRows = report.dateRows.map((r) => {
  const cells = cols.map((c) => `<td>${r.hasData ? formatNum_(r.metrics[c.key], 0) : ""}</td>`).join("");
  const pctCell = r.hasData && r.percentage !== null ? formatPct_(r.percentage) : "";
  const dowClass = getDayOfWeekClass_(r.date);
  return `<tr class="${dowClass}"><td class="row-label">${formatDateDMY_(r.date)}</td>${cells}<td>${pctCell}</td></tr>`;
}).join("");

  const totalCells = cols.map((c) => `<td>${formatNum_(report.totals[c.key], 0)}</td>`).join("");
  const totalPct = report.totalPercentage !== null ? formatPct_(report.totalPercentage) : "";

  return `
    <table class="report-table total-lb-table">
      <colgroup>
        <col style="width:75px">
        <col style="width:75px"><col style="width:75px">
        <col style="width:55px"><col style="width:55px"><col style="width:55px"><col style="width:55px">
        <col style="width:55px"><col style="width:55px"><col style="width:55px"><col style="width:55px">
        <col style="width:75px"><col style="width:75px">
        <col style="width:90px">
      </colgroup>
      <thead>
      <tr>
        <th class="row-label" rowspan="2">Date</th>
        ${groupCells.join("")}
        <th rowspan="2">Percentage of Dead Birds</th>
      </tr>
      <tr>${colHeaders}</tr>
    </thead>
      <tbody>${bodyRows}</tbody>
      <tfoot>
        <tr class="bold-row"><td class="row-label">Total &gt;&gt;&gt;</td>${totalCells}<td>${totalPct}</td></tr>
      </tfoot>
    </table>
  `;
}

// ===================================================================
// CHILL WEIGHT REPORT
// ===================================================================
function initChillWeightReport() {
  const dateInput = document.getElementById("cwDateFilter");
  if (dateInput.dataset.bound) return;
  dateInput.dataset.bound = "true";

  const today = new Date().toISOString().slice(0, 10);
  dateInput.value = today;

  dateInput.addEventListener("change", () => {
    if (dateInput.value) renderChillWeightReport(dateInput.value);
  });

  document.getElementById("cwCsvBtn").addEventListener("click", () => {
    if (window.currentChillWeightReport) downloadChillWeightCsv_(window.currentChillWeightReport);
  });
  document.getElementById("cwPdfBtn").addEventListener("click", () => {
    printWithFilename_(`Chill_Weight_Report_${window.currentChillWeightReport?.date || "report"}`);
  });

  renderChillWeightReport(today);
}

async function renderChillWeightReport(dateStr) {
  const panel = document.getElementById("cwPanel");
  panel.innerHTML = `<p class="hint">Loading…</p>`;

  try {
    const report = await buildChillWeightReport(dateStr);
    window.currentChillWeightReport = report;
    document.getElementById("cwPrintDate").textContent = formatDateDMY_(dateStr);
    panel.innerHTML = renderChillWeightTable_(report);
  } catch (err) {
    panel.innerHTML = `<p class="hint error">Failed to load report: ${err.message}</p>`;
  }
}

function renderChillWeightTable_(report) {
  const rowCount = Math.max(report.left.length, report.right.length);
  let bodyRows = "";
  for (let i = 0; i < rowCount; i++) {
    const l = report.left[i];
    const r = report.right[i];
    bodyRows += `<tr>
      <td>${l ? l.code : ""}</td>
      <td class="item-name ${l && l.highlight ? "highlight" : ""}">${l ? l.name : ""}</td>
      <td>${l ? formatNum_(l.value, "auto") : ""}</td>
      <td>${r ? r.code : ""}</td>
      <td class="item-name ${r && r.highlight ? "highlight" : ""}">${r ? r.name : ""}</td>
      <td>${r ? formatNum_(r.value, 1) : ""}</td>
    </tr>`;
  }

  const gibletDisplay = report.gibletUse > 0 ? formatNum_(report.gibletUse, 1) : "-";

  return `
    <table class="report-table chill-weight-table">
      <thead>
        <tr>
          <th>Item Code</th><th>Item Name</th><th>Quantity (Kg)</th>
          <th>Item Code</th><th>Item Name</th><th>Quantity (Kg)</th>
        </tr>
      </thead>
      <tbody>${bodyRows}</tbody>
    </table>
    <div class="chill-summary">
      <div class="cw-row"><span>Total Finished Goods weight</span><span>${formatNum_(report.totalFinishedGoods, 1)}</span></div>
      <div class="cw-row"><span>Giblet Use for Whole Chicken</span><span>${gibletDisplay}</span></div>
      <div class="cw-row"><span>Pet Food from the Easy</span><span>${formatNum_(report.petFood, 1)}</span></div>
      <div class="cw-row cw-total"><span>Chill Weight</span><span>${formatNum_(report.chillWeight, 1)}</span></div>
    </div>
  `;
}

function downloadChillWeightCsv_(report) {
  let csv = "Item Code,Item Name,Quantity (Kg),Item Code,Item Name,Quantity (Kg)\n";
  const rowCount = Math.max(report.left.length, report.right.length);
  for (let i = 0; i < rowCount; i++) {
    const l = report.left[i], r = report.right[i];
    csv += [l?.code || "", l?.name || "", l?.value ?? "", r?.code || "", r?.name || "", r?.value ?? ""]
      .map((v) => `"${v}"`).join(",") + "\n";
  }
  csv += `\n"Total Finished Goods weight","","${report.totalFinishedGoods}"\n`;
  csv += `"Giblet Use for Whole Chicken","","${report.gibletUse}"\n`;
  csv += `"Pet Food from the Easy","","${report.petFood}"\n`;
  csv += `"Chill Weight","","${report.chillWeight}"\n`;

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Chill_Weight_Report_${report.date}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ===================================================================
// DRESS WEIGHT REPORT
// ===================================================================
function initDressWeightReport() {
  const dateInput = document.getElementById("dwDateFilter");
  if (dateInput.dataset.bound) return;
  dateInput.dataset.bound = "true";

  const today = new Date().toISOString().slice(0, 10);
  dateInput.value = today;

  dateInput.addEventListener("change", () => {
    if (dateInput.value) renderDressWeightReport(dateInput.value);
  });

  document.getElementById("dwCsvBtn").addEventListener("click", () => {
    if (window.currentDressWeightReport) downloadDressWeightCsv_(window.currentDressWeightReport);
  });
  document.getElementById("dwPdfBtn").addEventListener("click", () => {
    printWithFilename_(`Dress_Weight_Report_${window.currentDressWeightReport?.date || "report"}`);
  });

  renderDressWeightReport(today);
}

async function renderDressWeightReport(dateStr) {
  const panel = document.getElementById("dwPanel");
  panel.innerHTML = `<p class="hint">Loading…</p>`;

  try {
    const report = await buildDressWeightReport(dateStr);
    window.currentDressWeightReport = report;
    document.getElementById("dwPrintDate").textContent = formatDateDMY_(dateStr);
    document.getElementById("dwPrintBatch").textContent = report.batchNo;
    document.getElementById("dwBatchDisplay").textContent = `Batch No: ${report.batchNo}`;
    panel.innerHTML = renderDressWeightTables_(report);
  } catch (err) {
    panel.innerHTML = `<p class="hint error">Failed to load report: ${err.message}</p>`;
  }
}

function renderDressWeightTables_(report) {
  // ---- Table 1 ----
  const farmRows = report.farms.map((f) => `
    <tr>
      <td>${f.sno}</td>
      <td class="item-name">${f.farmName}</td>
      <td>${formatNum_(f.noOfBirds, 0)}</td>
      <td>${formatNum_(f.avgWeight, 1)}</td>
      <td>${formatNum_(f.liveWeight, 0)}</td>
      <td>${formatNum_(f.rejectedWeight, 0)}</td>
      <td>${formatNum_(f.liveWeightToPlant, 0)}</td>
    </tr>`).join("");

  const table1 = `
    <h3 class="report-subhead">Daily Live Birds Input Summary</h3>
    <table class="report-table dress-farm-table">
      <thead>
        <tr>
          <th>S/No</th><th>Farm Name</th><th>No of Birds</th><th>AVG Weight (Kg)</th>
          <th>Live Weight (Kg)</th><th>Rejected Weight (Kg)</th><th>Live Weight to Plant (Kg)</th>
        </tr>
      </thead>
      <tbody>${farmRows}</tbody>
      <tfoot>
        <tr class="bold-row">
          <td colspan="2">Total &gt;&gt;&gt;</td>
          <td>${formatNum_(report.farmTotals.noOfBirds, 0)}</td>
          <td></td>
          <td>${formatNum_(report.farmTotals.liveWeight, 0)}</td>
          <td>${formatNum_(report.farmTotals.rejectedWeight, 0)}</td>
          <td>${formatNum_(report.farmTotals.liveWeightToPlant, 0)}</td>
        </tr>
      </tfoot>
    </table>`;

  // ---- Table 2 ----
  const rowCount = Math.max(report.left.length, report.right.length);
  let bodyRows = "";
  for (let i = 0; i < rowCount; i++) {
    const l = report.left[i];
    const r = report.right[i];
    bodyRows += `<tr>
      <td>${l ? l.code : ""}</td>
      <td class="item-name ${l && l.highlight ? "highlight" : ""}">${l ? l.name : ""}</td>
      <td>${l ? formatNum_(l.value, "auto") : ""}</td>
      <td>${r ? r.code : ""}</td>
      <td class="item-name ${r && r.highlight ? "highlight" : ""}">${r ? r.name : ""}</td>
      <td>${r ? formatNum_(r.value, 1) : ""}</td>
    </tr>`;
  }

  const gibletDisplay = report.gibletUse > 0 ? formatNum_(report.gibletUse, 1) : "-";

  const table2 = `
    <h3 class="report-subhead">Daily Production Summary</h3>
    <table class="report-table chill-weight-table">
      <thead>
        <tr>
          <th>Item Code</th><th>Item Name</th><th>Quantity (Kg)</th>
          <th>Item Code</th><th>Item Name</th><th>Quantity (Kg)</th>
        </tr>
      </thead>
      <tbody>${bodyRows}</tbody>
    </table>
    <div class="chill-summary">
      <div class="cw-row"><span>Total Finished Goods weight</span><span>${formatNum_(report.totalFinishedGoods, 1)}</span></div>
      <div class="cw-row"><span>Giblet Use for Whole Chicken</span><span>${gibletDisplay}</span></div>
      <div class="cw-row"><span>Pet Food from the Easy</span><span>${formatNum_(report.petFood, 1)}</span></div>
      <div class="cw-row cw-total"><span>Dress Weight</span><span>${formatNum_(report.dressWeight, 1)}</span></div>
      <div class="cw-row cw-total"><span>Yeild %</span><span>${formatPct_(report.yieldPct)}</span></div>
    </div>`;

  return table1 + table2;
}

function downloadDressWeightCsv_(report) {
  let csv = "S/No,Farm Name,No of Birds,AVG Weight (Kg),Live Weight (Kg),Rejected Weight (Kg),Live Weight to Plant (Kg)\n";
  report.farms.forEach((f) => {
    csv += [f.sno, f.farmName, f.noOfBirds, f.avgWeight, f.liveWeight, f.rejectedWeight, f.liveWeightToPlant]
      .map((v) => `"${v}"`).join(",") + "\n";
  });
  csv += `"Total","","${report.farmTotals.noOfBirds}","","${report.farmTotals.liveWeight}","${report.farmTotals.rejectedWeight}","${report.farmTotals.liveWeightToPlant}"\n\n`;

  csv += "Item Code,Item Name,Quantity (Kg),Item Code,Item Name,Quantity (Kg)\n";
  const rowCount = Math.max(report.left.length, report.right.length);
  for (let i = 0; i < rowCount; i++) {
    const l = report.left[i], r = report.right[i];
    csv += [l?.code || "", l?.name || "", l?.value ?? "", r?.code || "", r?.name || "", r?.value ?? ""]
      .map((v) => `"${v}"`).join(",") + "\n";
  }
  csv += `\n"Total Finished Goods weight","","${report.totalFinishedGoods}"\n`;
  csv += `"Giblet Use for Whole Chicken","","${report.gibletUse}"\n`;
  csv += `"Pet Food from the Easy","","${report.petFood}"\n`;
  csv += `"Dress Weight","","${report.dressWeight}"\n`;
  csv += `"Yeild %","","${Math.round(report.yieldPct)}%"\n`;

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Dress_Weight_Report_${report.date}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ===================================================================
// PRODUCTION REPORT
// ===================================================================
function initProductionWeightReport() {
  const dateInput = document.getElementById("pwDateFilter");
  if (dateInput.dataset.bound) return;
  dateInput.dataset.bound = "true";

  const today = new Date().toISOString().slice(0, 10);
  dateInput.value = today;

  dateInput.addEventListener("change", () => {
    if (dateInput.value) renderProductionWeightReport(dateInput.value);
  });

  document.getElementById("pwCsvBtn").addEventListener("click", () => {
    if (window.currentProductionWeightReport) downloadProductionWeightCsv_(window.currentProductionWeightReport);
  });
  document.getElementById("pwPdfBtn").addEventListener("click", () => {
    printWithFilename_(`Production_Report_${window.currentProductionWeightReport?.date || "report"}`);
  });

  renderProductionWeightReport(today);
}

async function renderProductionWeightReport(dateStr) {
  const panel = document.getElementById("pwPanel");
  panel.innerHTML = `<p class="hint">Loading…</p>`;

  try {
    const report = await buildProductionWeightReport(dateStr);
    window.currentProductionWeightReport = report;
    document.getElementById("pwPrintDate").textContent = formatDateDMY_(dateStr);
    document.getElementById("pwPrintBatch").textContent = report.batchNo;
    document.getElementById("pwBatchDisplay").textContent = `Batch No: ${report.batchNo}`;
    panel.innerHTML = renderDressWeightTables_(report) + renderEasyProductionTable_(report);
  } catch (err) {
    panel.innerHTML = `<p class="hint error">Failed to load report: ${err.message}</p>`;
  }
}

function renderEasyProductionTable_(report) {
  const productRows = report.easyProducts.map((p) => `
    <tr>
      <td>${p.code}</td>
      <td class="item-name">${p.name}</td>
      <td>${formatNum_(p.value, 1)}</td>
    </tr>`).join("");

  return `
    <h3 class="report-subhead">Daily Easy Production Summary</h3>

    <div class="easy-subsection">
      <div class="easy-subhead">• Daily Easy Material Input Summery</div>
      <div class="easy-net-weight-row">
        <span>Used Easy Material Net Weight</span>
        <span class="easy-net-weight-value">${formatNum_(report.usedEasyMaterialNetWeight, 1)}</span>
      </div>
    </div>

    <div class="easy-subsection">
      <div class="easy-subhead">• Daily Easy Product Output Summery</div>
      <table class="report-table easy-product-table">
        <thead>
          <tr><th>Item Code</th><th>Product Name</th><th>Weight (Kg)</th></tr>
        </thead>
        <tbody>${productRows}</tbody>
        <tfoot>
          <tr class="bold-row">
            <td colspan="2">Total Easy Product Weight</td>
            <td>${formatNum_(report.totalEasyProductWeight, 1)}</td>
          </tr>
          <tr class="bold-row">
            <td colspan="2">Yield (%)</td>
            <td>${formatPct_(report.easyYieldPct)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  `;
}

function downloadProductionWeightCsv_(report) {
  // Table 1 + 2 CSV (Dress Weight part)
  let csv = "S/No,Farm Name,No of Birds,AVG Weight (Kg),Live Weight (Kg),Rejected Weight (Kg),Live Weight to Plant (Kg)\n";
  report.farms.forEach((f) => {
    csv += [f.sno, f.farmName, f.noOfBirds, f.avgWeight, f.liveWeight, f.rejectedWeight, f.liveWeightToPlant]
      .map((v) => `"${v}"`).join(",") + "\n";
  });
  csv += `"Total","","${report.farmTotals.noOfBirds}","","${report.farmTotals.liveWeight}","${report.farmTotals.rejectedWeight}","${report.farmTotals.liveWeightToPlant}"\n\n`;

  csv += "Item Code,Item Name,Quantity (Kg),Item Code,Item Name,Quantity (Kg)\n";
  const rowCount = Math.max(report.left.length, report.right.length);
  for (let i = 0; i < rowCount; i++) {
    const l = report.left[i], r = report.right[i];
    csv += [l?.code||"", l?.name||"", l?.value??"", r?.code||"", r?.name||"", r?.value??""]
      .map((v) => `"${v}"`).join(",") + "\n";
  }
  csv += `\n"Total Finished Goods weight","","${report.totalFinishedGoods}"\n`;
  csv += `"Giblet Use for Whole Chicken","","${report.gibletUse}"\n`;
  csv += `"Pet Food from the Easy","","${report.petFood}"\n`;
  csv += `"Dress Weight","","${report.dressWeight}"\n`;
  csv += `"Yeild %","","${Math.round(report.yieldPct)}%"\n\n`;

  // ✅ Table 3: Easy Production section
  csv += `Daily Easy Production Summary\n`;
  csv += `Used Easy Material Net Weight,${report.usedEasyMaterialNetWeight}\n\n`;
  csv += `Item Code,Product Name,Weight (Kg)\n`;
  report.easyProducts.forEach((p) => {
    csv += `"${p.code}","${p.name}","${p.value}"\n`;
  });
  csv += `"Total Easy Product Weight","","${report.totalEasyProductWeight}"\n`;
  csv += `"Yield (%)","","${report.easyYieldPct.toFixed(2)}%"\n`;

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Production_Report_${report.date}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function downloadTotalLbCsv_(report) {
  const headers = ["Date", ...TOTAL_LB_COLUMNS_.map((c) => c.label), "Dead Birds %"];
  let csv = headers.join(",") + "\n";

  report.dateRows.forEach((r) => {
    const vals = TOTAL_LB_COLUMNS_.map((c) => (r.hasData ? r.metrics[c.key] : ""));
    const pct = r.hasData && r.percentage !== null ? Math.round(r.percentage) + "%" : "";
    csv += [formatDateDMY_(r.date), ...vals, pct].map((v) => `"${v}"`).join(",") + "\n";
  });

  const totalVals = TOTAL_LB_COLUMNS_.map((c) => report.totals[c.key]);
  const totalPct = report.totalPercentage !== null ? Math.round(report.totalPercentage) + "%" : "";
  csv += ["Total", ...totalVals, totalPct].map((v) => `"${v}"`).join(",") + "\n";

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Total_LB_Report_${report.year}-${String(report.month).padStart(2, "0")}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function formatNum_(v, decimals = 2) {
  const num = Number(v) || 0;
  if (decimals === "auto") {
    const hasFraction = Math.abs(num % 1) > 0.001;   // tiny epsilon for float rounding
    return num.toLocaleString(undefined, {
      minimumFractionDigits: hasFraction ? 1 : 0,
      maximumFractionDigits: hasFraction ? 1 : 0,
    });
  }
  return num.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function formatPct_(v) {
  return `${(Number(v) || 0).toFixed(2)}%`;
}

function formatDateDMY_(isoDate) {
  const [y, m, d] = isoDate.split("-");
  return `${d}-${m}-${y.slice(-2)}`;
}

function downloadReportCsv_(report) {
  const headers = ["Farmer Reference", ...report.locations, "Total"];
  const rows = report.metrics.map((m) => [m.label, ...m.values, m.total]);

  let csv = headers.join(",") + "\n";
  rows.forEach((r) => {
    csv += r.map((v) => `"${v}"`).join(",") + "\n";
  });

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `LB_Input_Report_${report.date}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ===================================================================
// CHILL WEIGHT vs DRESS WEIGHT REPORT
// ===================================================================
function initChillVsDressReport() {
  const dateInput = document.getElementById("cvdDateFilter");
  if (dateInput.dataset.bound) return;
  dateInput.dataset.bound = "true";

  const today = new Date().toISOString().slice(0, 10);
  dateInput.value = today;

  dateInput.addEventListener("change", () => {
    if (dateInput.value) renderChillVsDressReport(dateInput.value);
  });

  document.getElementById("cvdCsvBtn").addEventListener("click", () => {
    if (window.currentChillVsDressReport) downloadChillVsDressCsv_(window.currentChillVsDressReport);
  });
  document.getElementById("cvdPdfBtn").addEventListener("click", () => {
    printWithFilename_(`Chill_vs_Dress_Weight_${window.currentChillVsDressReport?.date || "report"}`);
  });

  renderChillVsDressReport(today);
}

async function renderChillVsDressReport(dateStr) {
  const panel = document.getElementById("cvdPanel");
  const batchDisplay = document.getElementById("cvdBatchDisplay");
  panel.innerHTML = `<p class="hint">Loading…</p>`;

  try {
    const report = await buildChillVsDressReport(dateStr);
    window.currentChillVsDressReport = report;
    batchDisplay.textContent = `Batch No: ${report.batchNo}`;
    document.getElementById("cvdPrintDate").textContent = formatDateDMY_(dateStr);
    document.getElementById("cvdPrintBatch").textContent = report.batchNo;
    panel.innerHTML = renderChillVsDressTable_(report);
  } catch (err) {
    panel.innerHTML = `<p class="hint error">Failed to load report: ${err.message}</p>`;
  }
}

function renderChillVsDressTable_(report) {
  const rows = report.items.map((i) => {
    const diffClass = i.difference < 0 ? "diff-negative" : i.difference > 0 ? "diff-positive" : "";
    return `<tr>
      <td>${i.code}</td>
      <td class="item-name ${i.highlight ? "highlight" : ""}">${i.name}</td>
      <td>${formatNum_(i.chillWeight, 1)}</td>
      <td>${formatNum_(i.dressWeight, 1)}</td>
      <td class="${diffClass}">${formatNum_(i.difference, 1)}</td>
      <td class="${diffClass}">${formatPct_(i.differencePct)}</td>
    </tr>`;
  }).join("");

  return `
    <table class="report-table chill-vs-dress-table">
      <thead>
        <tr><th>Item Code</th><th>Item Name</th><th>Chill Weight</th><th>Dress Weight</th><th>Difference</th><th>Difference %</th></tr>
      </thead>
      <tbody>${rows}</tbody>
      <tfoot>
        <tr class="bold-row">
          <td colspan="2">Total</td>
          <td>${formatNum_(report.totals.chillWeight, 1)}</td>
          <td>${formatNum_(report.totals.dressWeight, 1)}</td>
          <td>${formatNum_(report.totals.difference, 1)}</td>
          <td>${formatPct_(report.totals.differencePct)}</td>
        </tr>
      </tfoot>
    </table>
  `;
}

function downloadChillVsDressCsv_(report) {
  let csv = "Item Code,Item Name,Chill Weight,Dress Weight,Difference,Difference %\n";
  report.items.forEach((i) => {
    csv += [i.code, i.name, i.chillWeight, i.dressWeight, i.difference, Math.round(i.differencePct) + "%"]
      .map((v) => `"${v}"`).join(",") + "\n";
  });
  csv += `"Total","","${report.totals.chillWeight}","${report.totals.dressWeight}","${report.totals.difference}","${Math.round(report.totals.differencePct)}%"\n`;

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Chill_vs_Dress_Weight_Report_${report.date}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ===================================================================
// TOTAL PRODUCTION SUMMARY
// ===================================================================
function initTotalProductionSummary() {
  const monthSelect = document.getElementById("tpsMonth");
  const yearSelect = document.getElementById("tpsYear");

  if (monthSelect.dataset.bound) return;
  monthSelect.dataset.bound = "true";

  const nowYear = new Date().getFullYear();
  for (let y = nowYear - 3; y <= nowYear + 1; y++) {
    const opt = document.createElement("option");
    opt.value = y;
    opt.textContent = y;
    if (y === nowYear) opt.selected = true;
    yearSelect.appendChild(opt);
  }
  monthSelect.value = new Date().getMonth() + 1;

  monthSelect.addEventListener("change", renderTotalProductionSummary);
  yearSelect.addEventListener("change", renderTotalProductionSummary);

  document.getElementById("tpsCsvBtn").addEventListener("click", () => {
    if (window.currentTpsReport) downloadTpsCsv_(window.currentTpsReport);
  });
  document.getElementById("tpsPdfBtn").addEventListener("click", () => {
    const r = window.currentTpsReport;
    printWithFilename_(r ? `Total_Production_Summary_${MONTH_NAMES_[r.month - 1]}_${r.year}` : "Total_Production_Summary");
  });

  renderTotalProductionSummary();
}

async function renderTotalProductionSummary() {
  const year = document.getElementById("tpsYear").value;
  const month = document.getElementById("tpsMonth").value;
  const panel = document.getElementById("tpsPanel");
  panel.innerHTML = `<p class="hint">Loading…</p>`;

  try {
    const report = await buildTotalProductionSummary(year, month);
    window.currentTpsReport = report;
    document.getElementById("tpsPrintMonth").textContent = `${MONTH_NAMES_[month - 1]} ${year}`;
    panel.innerHTML = renderTpsTable_(report);
  } catch (err) {
    panel.innerHTML = `<p class="hint error">Failed to load report: ${err.message}</p>`;
  }
}

function renderTpsTable_(report) {
  const dayHeaders = Array.from({ length: report.daysInMonth }, (_, i) => {
    const day = i + 1;
    const dateStr = `${report.year}-${String(report.month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return `<th class="${getDayOfWeekClass_(dateStr)}">${String(day).padStart(2, "0")}</th>`;
  }).join("");

  const rows = report.items.map((item) => {
    const cells = item.values.map((v, i) => {
      const day = i + 1;
      const dateStr = `${report.year}-${String(report.month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      return `<td class="${getDayOfWeekClass_(dateStr)}">${formatNum_(v, "auto")}</td>`;
    }).join("");
    return `<tr>
      <td>${item.code}</td>
      <td class="item-name ${item.highlight ? "highlight" : ""}">${item.name}</td>
      ${cells}
      <td class="total-cell">${formatNum_(item.rowTotal, "auto")}</td>
    </tr>`;
  }).join("");

  const totalCells = report.columnTotals.map((v) => `<td>${formatNum_(v, "auto")}</td>`).join("");

  return `
    <table class="report-table total-production-table">
      <thead>
        <tr><th>Item Code</th><th>Item Name</th>${dayHeaders}<th>Total</th></tr>
      </thead>
      <tbody>${rows}</tbody>
      <tfoot>
        <tr class="bold-row"><td colspan="2">Total</td>${totalCells}<td>${formatNum_(report.grandTotal, "auto")}</td></tr>
      </tfoot>
    </table>
  `;
}

function downloadTpsCsv_(report) {
  const dayHeaders = Array.from({ length: report.daysInMonth }, (_, i) => String(i + 1).padStart(2, "0"));
  let csv = ["Item Code", "Item Name", ...dayHeaders, "Total"].map((v) => `"${v}"`).join(",") + "\n";

  report.items.forEach((item) => {
    csv += [item.code, item.name, ...item.values, item.rowTotal].map((v) => `"${v}"`).join(",") + "\n";
  });
  csv += ["Total", "", ...report.columnTotals, report.grandTotal].map((v) => `"${v}"`).join(",") + "\n";

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Total_Production_Summary_${report.year}-${String(report.month).padStart(2, "0")}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ===================================================================
// SALES FORECAST vs PRODUCTION
// ===================================================================
function initSalesForecastVsProduction() {
  const monthSelect = document.getElementById("sfpMonth");
  const yearSelect = document.getElementById("sfpYear");

  if (monthSelect.dataset.bound) return;
  monthSelect.dataset.bound = "true";

  const nowYear = new Date().getFullYear();
  for (let y = nowYear - 3; y <= nowYear + 1; y++) {
    const opt = document.createElement("option");
    opt.value = y;
    opt.textContent = y;
    if (y === nowYear) opt.selected = true;
    yearSelect.appendChild(opt);
  }
  monthSelect.value = new Date().getMonth() + 1;

  monthSelect.addEventListener("change", renderSalesForecastVsProduction);
  yearSelect.addEventListener("change", renderSalesForecastVsProduction);

  document.getElementById("sfpCsvBtn").addEventListener("click", () => {
    if (window.currentSfpReport) downloadSfpCsv_(window.currentSfpReport);
  });
  document.getElementById("sfpPdfBtn").addEventListener("click", () => {
    const r = window.currentSfpReport;
    printWithFilename_(r ? `Sales_Forecast_vs_Production_${MONTH_NAMES_[r.month - 1]}_${r.year}` : "Sales_Forecast_vs_Production");
  });

  renderSalesForecastVsProduction();
}

async function renderSalesForecastVsProduction() {
  const year = document.getElementById("sfpYear").value;
  const month = document.getElementById("sfpMonth").value;
  const panel = document.getElementById("sfpPanel");
  panel.innerHTML = `<p class="hint">Loading…</p>`;

  try {
    const report = await buildSalesForecastVsProduction(year, month);
    window.currentSfpReport = report;
    document.getElementById("sfpPrintMonth").textContent = `${MONTH_NAMES_[month - 1]} ${year}`;
    panel.innerHTML = renderSfpTable_(report);
  } catch (err) {
    panel.innerHTML = `<p class="hint error">Failed to load report: ${err.message}</p>`;
  }
}

function diffMarkup_(diff) {
  const isNeg = diff < 0;
  const arrow = isNeg ? "▼" : "▲";
  const cls = isNeg ? "diff-negative" : "diff-positive";
  return `<span class="${cls}">${arrow}${formatNum_(Math.abs(diff), "auto")}</span>`;
}

function renderSfpTable_(report) {
  const rows = report.items.map((i) => `
    <tr>
      <td>${i.code}</td>
      <td class="item-name">${i.name}</td>
      <td>${formatNum_(i.salesForecast, "auto")}</td>
      <td>${formatNum_(i.totalProduction, "auto")}</td>
      <td>${diffMarkup_(i.difference)}</td>
      <td>${i.range}</td>
    </tr>`).join("");

  return `
    <table class="report-table sfp-table">
      <thead>
        <tr>
          <th>Item Code</th><th>Item Name</th><th>Sales Forecast</th>
          <th>Total Production</th><th>Difference (Kg)</th><th>Weight or weight range (g)</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
      <tfoot>
        <tr class="bold-row">
          <td colspan="2">Total</td>
          <td>${formatNum_(report.totals.salesForecast, "auto")}</td>
          <td>${formatNum_(report.totals.totalProduction, "auto")}</td>
          <td>${diffMarkup_(report.totals.difference)}</td>
          <td></td>
        </tr>
      </tfoot>
    </table>
  `;
}

function downloadSfpCsv_(report) {
  let csv = "Item Code,Item Name,Sales Forecast,Total Production,Difference (Kg),Weight or weight range (g)\n";
  report.items.forEach((i) => {
    csv += [i.code, i.name, i.salesForecast, i.totalProduction, i.difference, i.range]
      .map((v) => `"${v}"`).join(",") + "\n";
  });
  csv += `"Total","","${report.totals.salesForecast}","${report.totals.totalProduction}","${report.totals.difference}",""\n`;

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Sales_Forecast_vs_Production_${report.year}-${String(report.month).padStart(2, "0")}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ===================================================================
// LB TARGET vs ACTUAL
// ===================================================================
function initLbTargetVsActual() {
  const monthSelect = document.getElementById("ltaMonth");
  const yearSelect = document.getElementById("ltaYear");

  if (monthSelect.dataset.bound) return;
  monthSelect.dataset.bound = "true";

  const nowYear = new Date().getFullYear();
  for (let y = nowYear - 3; y <= nowYear + 1; y++) {
    const opt = document.createElement("option");
    opt.value = y;
    opt.textContent = y;
    if (y === nowYear) opt.selected = true;
    yearSelect.appendChild(opt);
  }
  monthSelect.value = new Date().getMonth() + 1;

  monthSelect.addEventListener("change", renderLbTargetVsActual);
  yearSelect.addEventListener("change", renderLbTargetVsActual);

  document.getElementById("ltaCsvBtn").addEventListener("click", () => {
    if (window.currentLtaReport) downloadLtaCsv_(window.currentLtaReport);
  });
  document.getElementById("ltaPdfBtn").addEventListener("click", () => {
    const r = window.currentLtaReport;
    printWithFilename_(r ? `LB_Target_vs_Actual_${MONTH_NAMES_[r.month - 1]}_${r.year}` : "LB_Target_vs_Actual");
  });

  renderLbTargetVsActual();
}

async function renderLbTargetVsActual() {
  const year = document.getElementById("ltaYear").value;
  const month = document.getElementById("ltaMonth").value;
  const panel = document.getElementById("ltaPanel");
  panel.innerHTML = `<p class="hint">Loading…</p>`;

  try {
    const report = await buildLbTargetVsActual(year, month);
    window.currentLtaReport = report;
    document.getElementById("ltaPrintMonth").textContent = `${MONTH_NAMES_[month - 1]} ${year}`;
    panel.innerHTML = renderLtaTable_(report);
  } catch (err) {
    panel.innerHTML = `<p class="hint error">Failed to load report: ${err.message}</p>`;
  }
}

function renderLtaTable_(report) {
  const rows = report.dateRows.map((r) => {
  const dowClass = getDayOfWeekClass_(r.date);
  return `<tr class="${dowClass}">
    <td class="row-label">${formatDateDMY_(r.date)}</td>
    <td>${r.hasData ? formatNum_(r.totalTargetBirds, 0) : ""}</td>
    <td>${r.hasData ? formatNum_(r.totalActualBirds, 0) : ""}</td>
    <td>${r.target14 ? formatNum_(r.target14, 0) : ""}</td>
    <td>${r.actual14 ? formatNum_(r.actual14, 0) : ""}</td>
    <td>${r.target18 ? formatNum_(r.target18, 0) : ""}</td>
    <td>${r.actual18 ? formatNum_(r.actual18, 0) : ""}</td>
    <td>${r.target22 ? formatNum_(r.target22, 0) : ""}</td>
    <td>${r.actual22 ? formatNum_(r.actual22, 0) : ""}</td>
    <td>${r.target23 ? formatNum_(r.target23, 0) : ""}</td>
    <td>${r.actual23 ? formatNum_(r.actual23, 0) : ""}</td>
    <td>${r.hasData ? formatPct_(r.achievementPct) : "0.00%"}</td>
  </tr>`;
}).join("");

  return `
    <table class="report-table lta-table">
      <colgroup>
        <col style="width:9%">
        <col style="width:8%"><col style="width:8%">
        <col style="width:7%"><col style="width:7%">
        <col style="width:7%"><col style="width:7%">
        <col style="width:7%"><col style="width:7%">
        <col style="width:7%"><col style="width:7%">
        <col style="width:15%">
      </colgroup>
      <thead>
        <tr>
          <th class="row-label" rowspan="2">Date</th>
          <th rowspan="2">Total Target Birds</th>
          <th rowspan="2">Total Actual Birds</th>
          <th colspan="2">1.2 - 1.4</th>
          <th colspan="2">1.5 - 1.8</th>
          <th colspan="2">1.9 - 2.2</th>
          <th colspan="2">2.3 & Above</th>
          <th rowspan="2">Achievement %</th>
        </tr>
        <tr>
          <th>Target</th><th>Actual</th>
          <th>Target</th><th>Actual</th>
          <th>Target</th><th>Actual</th>
          <th>Target</th><th>Actual</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
      <tfoot>
        <tr class="bold-row">
          <td class="row-label">Total &gt;&gt;&gt;</td>
          <td>${formatNum_(report.totals.totalTargetBirds, 0)}</td>
          <td>${formatNum_(report.totals.totalActualBirds, 0)}</td>
          <td>${formatNum_(report.totals.target14, 0)}</td>
          <td>${formatNum_(report.totals.actual14, 0)}</td>
          <td>${formatNum_(report.totals.target18, 0)}</td>
          <td>${formatNum_(report.totals.actual18, 0)}</td>
          <td>${formatNum_(report.totals.target22, 0)}</td>
          <td>${formatNum_(report.totals.actual22, 0)}</td>
          <td>${formatNum_(report.totals.target23, 0)}</td>
          <td>${formatNum_(report.totals.actual23, 0)}</td>
          <td>${formatPct_(report.totals.achievementPct)}</td>
        </tr>
      </tfoot>
    </table>
  `;
}

function downloadLtaCsv_(report) {
  let csv = "Date,Total Target Birds,Total Actual Birds,1.2-1.4 Target,1.2-1.4 Actual,1.5-1.8 Target,1.5-1.8 Actual,1.9-2.2 Target,1.9-2.2 Actual,2.3+ Target,2.3+ Actual,Achievement %\n";
  report.dateRows.forEach((r) => {
    csv += [formatDateDMY_(r.date), r.totalTargetBirds, r.totalActualBirds, r.target14, r.actual14, r.target18, r.actual18, r.target22, r.actual22, r.target23, r.actual23, Math.round(r.achievementPct) + "%"]
      .map((v) => `"${v}"`).join(",") + "\n";
  });
  csv += ["Total", report.totals.totalTargetBirds, report.totals.totalActualBirds, report.totals.target14, report.totals.actual14, report.totals.target18, report.totals.actual18, report.totals.target22, report.totals.actual22, report.totals.target23, report.totals.actual23, Math.round(report.totals.achievementPct) + "%"]
    .map((v) => `"${v}"`).join(",") + "\n";

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `LB_Target_vs_Actual_${report.year}-${String(report.month).padStart(2, "0")}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ===================================================================
// PRODUCTION TARGET vs ACTUAL
// ===================================================================
function initProductionTargetVsActual() {
  const monthSelect = document.getElementById("ptaMonth");
  const yearSelect = document.getElementById("ptaYear");

  if (monthSelect.dataset.bound) return;
  monthSelect.dataset.bound = "true";

  const nowYear = new Date().getFullYear();
  for (let y = nowYear - 3; y <= nowYear + 1; y++) {
    const opt = document.createElement("option");
    opt.value = y;
    opt.textContent = y;
    if (y === nowYear) opt.selected = true;
    yearSelect.appendChild(opt);
  }
  monthSelect.value = new Date().getMonth() + 1;

  monthSelect.addEventListener("change", renderProductionTargetVsActual);
  yearSelect.addEventListener("change", renderProductionTargetVsActual);

  document.getElementById("ptaCsvBtn").addEventListener("click", () => {
    if (window.currentPtaReport) downloadPtaCsv_(window.currentPtaReport);
  });
  document.getElementById("ptaPdfBtn").addEventListener("click", () => {
    const r = window.currentPtaReport;
    printWithFilename_(r ? `Production_Target_vs_Actual_${MONTH_NAMES_[r.month - 1]}_${r.year}` : "Production_Target_vs_Actual");
  });

  renderProductionTargetVsActual();
}

async function renderProductionTargetVsActual() {
  const year = document.getElementById("ptaYear").value;
  const month = document.getElementById("ptaMonth").value;
  const panel = document.getElementById("ptaPanel");
  panel.innerHTML = `<p class="hint">Loading…</p>`;

  try {
    const report = await buildProductionTargetVsActual(year, month);
    window.currentPtaReport = report;
    document.getElementById("ptaPrintMonth").textContent = `${MONTH_NAMES_[month - 1]} ${year}`;
    panel.innerHTML = renderPtaTable_(report);
  } catch (err) {
    panel.innerHTML = `<p class="hint error">Failed to load report: ${err.message}</p>`;
  }
}

function renderPtaTable_(report) {
  // <colgroup>: Item Code, Item Name, Total Target, Total Actual, then Target/Actual pair per day
  let colgroupHtml = `<col style="width:70px"><col style="width:220px"><col style="width:90px"><col style="width:90px">`;
  for (let d = 1; d <= report.daysInMonth; d++) {
    colgroupHtml += `<col style="width:55px"><col style="width:55px">`;
  }

  const dayGroupHeaders = Array.from({ length: report.daysInMonth }, (_, i) => {
  const day = i + 1;
  const dateStr = `${report.year}-${String(report.month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const batchNo = getBatchNo_(dateStr);
  const dowClass = getDayOfWeekClass_(dateStr);
  return `<th colspan="2" class="${dowClass}"><div class="day-header-num">${String(day).padStart(2, "0")}</div><div class="day-header-batch">${batchNo}</div></th>`;
}).join("");

  const dayTargetActualHeaders = Array.from({ length: report.daysInMonth }, (_, i) => {
    const day = i + 1;
    const dateStr = `${report.year}-${String(report.month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const dowClass = getDayOfWeekClass_(dateStr);
    return `<th class="${dowClass}">Target</th><th class="${dowClass}">Actual</th>`;
  }).join("");

  const rows = report.items.map((item) => {
  const dayCells = item.targets.map((t, i) => {
    const day = i + 1;
    const dateStr = `${report.year}-${String(report.month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const dowClass = getDayOfWeekClass_(dateStr);
    return `<td class="${dowClass}">${formatNum_(t, "auto")}</td><td class="${dowClass}">${formatNum_(item.actuals[i], "auto")}</td>`;
  }).join("");
  return `<tr>
    <td>${item.code}</td>
    <td class="item-name">${item.name}</td>
    <td>${formatNum_(item.totalTarget, "auto")}</td>
    <td>${formatNum_(item.totalActual, "auto")}</td>
    ${dayCells}
  </tr>`;
}).join("");

  const dayTotalCells = report.dayTargetTotals.map((t, i) =>
    `<td>${formatNum_(t, "auto")}</td><td>${formatNum_(report.dayActualTotals[i], "auto")}</td>`
  ).join("");

  return `
    <table class="report-table pta-table">
      <colgroup>${colgroupHtml}</colgroup>
      <thead>
        <tr>
          <th rowspan="2">Item Code</th>
          <th rowspan="2">Item Name</th>
          <th rowspan="2">Total Target</th>
          <th rowspan="2">Total Actual</th>
          ${dayGroupHeaders}
        </tr>
        <tr>${dayTargetActualHeaders}</tr>
      </thead>
      <tbody>${rows}</tbody>
      <tfoot>
        <tr class="bold-row">
          <td colspan="2">Total</td>
          <td>${formatNum_(report.grandTotalTarget, "auto")}</td>
          <td>${formatNum_(report.grandTotalActual, "auto")}</td>
          ${dayTotalCells}
        </tr>
      </tfoot>
    </table>
  `;
}

function downloadPtaCsv_(report) {
  const dayHeaders = [];
  for (let d = 1; d <= report.daysInMonth; d++) {
    dayHeaders.push(`Day ${String(d).padStart(2, "0")} Target`, `Day ${String(d).padStart(2, "0")} Actual`);
  }
  let csv = ["Item Code", "Item Name", "Total Target", "Total Actual", ...dayHeaders].map((v) => `"${v}"`).join(",") + "\n";

  report.items.forEach((item) => {
    const dayVals = item.targets.flatMap((t, i) => [t, item.actuals[i]]);
    csv += [item.code, item.name, item.totalTarget, item.totalActual, ...dayVals].map((v) => `"${v}"`).join(",") + "\n";
  });

  const totalDayVals = report.dayTargetTotals.flatMap((t, i) => [t, report.dayActualTotals[i]]);
  csv += ["Total", "", report.grandTotalTarget, report.grandTotalActual, ...totalDayVals].map((v) => `"${v}"`).join(",") + "\n";

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Production_Target_vs_Actual_${report.year}-${String(report.month).padStart(2, "0")}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ===================================================================
// EASY & GIBLET STOCK
// ===================================================================
function initEasyGibletStock() {
  const monthSelect = document.getElementById("egsMonth");
  const yearSelect = document.getElementById("egsYear");

  if (monthSelect.dataset.bound) return;
  monthSelect.dataset.bound = "true";

  const nowYear = new Date().getFullYear();
  for (let y = nowYear - 3; y <= nowYear + 1; y++) {
    const opt = document.createElement("option");
    opt.value = y;
    opt.textContent = y;
    if (y === nowYear) opt.selected = true;
    yearSelect.appendChild(opt);
  }
  monthSelect.value = new Date().getMonth() + 1;

  monthSelect.addEventListener("change", renderEasyGibletStock);
  yearSelect.addEventListener("change", renderEasyGibletStock);

  document.getElementById("egsCsvBtn").addEventListener("click", () => {
    if (window.currentEgsReport) downloadEgsCsv_(window.currentEgsReport);
  });
  document.getElementById("egsPdfBtn").addEventListener("click", () => {
    const r = window.currentEgsReport;
    printWithFilename_(r ? `Easy_Giblet_Stock_${MONTH_NAMES_[r.month - 1]}_${r.year}` : "Easy_Giblet_Stock");
  });

  renderEasyGibletStock();
}

async function renderEasyGibletStock() {
  const year = document.getElementById("egsYear").value;
  const month = document.getElementById("egsMonth").value;
  const panel = document.getElementById("egsPanel");
  panel.innerHTML = `<p class="hint">Loading…</p>`;

  try {
    const report = await buildEasyGibletStock(year, month);
    window.currentEgsReport = report;
    document.getElementById("egsPrintMonth").textContent = `${MONTH_NAMES_[month - 1]} ${year}`;
    panel.innerHTML = `<div class="egs-tables-wrap">
      ${renderStockLedgerTable_(report.easy)}
      ${renderStockLedgerTable_(report.giblet)}
    </div>`;
  } catch (err) {
    panel.innerHTML = `<p class="hint error">Failed to load report: ${err.message}</p>`;
  }
}

function renderStockLedgerTable_(ledger) {
  const rows = ledger.dateRows.map((r) => {
  const dowClass = getDayOfWeekClass_(r.date);
  return `<tr class="${dowClass}">
    <td>${formatDateDMY_(r.date)}</td>
    <td>${formatNum_(r.in, "auto")}</td>
    <td>${formatNum_(r.out, "auto")}</td>
    <td>${formatNum_(r.balance, "auto")}</td>
  </tr>`;
}).join("");

  return `
    <div class="egs-table-block">
      <table class="report-table egs-table">
        <thead>
          <tr><th colspan="4" class="egs-title">${ledger.title}</th></tr>
          <tr><th>Date</th><th>In (Kg)</th><th>Out (Kg)</th><th>Balance</th></tr>
        </thead>
        <tbody>
          <tr class="bold-row">
            <td colspan="3">Opening Balance &gt;&gt;&gt;</td>
            <td>${formatNum_(ledger.openingBalance, "auto")}</td>
          </tr>
          ${rows}
        </tbody>
        <tfoot>
          <tr class="bold-row">
            <td>Total</td>
            <td>${formatNum_(ledger.totalIn, "auto")}</td>
            <td>${formatNum_(ledger.totalOut, "auto")}</td>
            <td>${formatNum_(ledger.closingBalance, "auto")}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  `;
}

function downloadEgsCsv_(report) {
  const buildBlock = (ledger) => {
    let csv = `${ledger.title}\nDate,In (Kg),Out (Kg),Balance\n`;
    csv += `"Opening Balance","","","${ledger.openingBalance}"\n`;
    ledger.dateRows.forEach((r) => {
      csv += [formatDateDMY_(r.date), r.in, r.out, r.balance].map((v) => `"${v}"`).join(",") + "\n";
    });
    csv += `"Total","${ledger.totalIn}","${ledger.totalOut}","${ledger.closingBalance}"\n`;
    return csv;
  };

  const csv = buildBlock(report.easy) + "\n" + buildBlock(report.giblet);

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Easy_Giblet_Stock_${report.year}-${String(report.month).padStart(2, "0")}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ===================================================================
// PRINT-TO-PDF FILENAME HELPER
// Browsers use document.title as the suggested filename when saving
// a print job as PDF. We set it temporarily before printing, then
// restore the original title once the print dialog closes.
// ===================================================================
function printWithFilename_(filename) {
  const originalTitle = document.title;

  function setTitle() {
    document.title = filename;
  }
  function restoreTitle() {
    document.title = originalTitle;
    window.removeEventListener("afterprint", restoreTitle);
  }

  window.addEventListener("beforeprint", setTitle);
  window.addEventListener("afterprint", restoreTitle);

  window.print();

  // Cleanup the beforeprint listener after this print cycle
  setTimeout(() => window.removeEventListener("beforeprint", setTitle), 1000);
}

// ===================================================================
// DAY OF STOCK AVAILABLE
// ===================================================================
function initStockAvailable() {
  const dateInput = document.getElementById("saDateFilter");
  if (dateInput.dataset.bound) {
    return;   // already rendered — panel HTML persists in the DOM, no need to re-fetch
  }
  dateInput.dataset.bound = "true";
 
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  dateInput.value = today;
 
  dateInput.addEventListener("change", () => {
    if (dateInput.value) renderStockAvailable(dateInput.value);
  });
 
  document.getElementById("saCsvBtn").addEventListener("click", () => {
    if (window.currentStockAvailableReport) downloadStockAvailableCsv_(window.currentStockAvailableReport);
  });
  document.getElementById("saPdfBtn").addEventListener("click", () => {
    printWithFilename_(`Day_of_Stock_Available_${window.currentStockAvailableReport?.date || "report"}`);
  });
 
  renderStockAvailable(today);
}
 
async function renderStockAvailable(dateStr) {
  const panel = document.getElementById("saPanel");
  panel.innerHTML = `<p class="hint">Loading…</p>`;
 
  try {
    const report = await buildStockAvailableReport_(dateStr);
    window.currentStockAvailableReport = report;
    document.getElementById("saPrintDate").textContent = formatDateDMY_(report.date);
    panel.innerHTML = renderStockAvailableTable_(report);
  } catch (err) {
    panel.innerHTML = `<p class="hint error">Failed to load report: ${err.message}</p>`;
  }
}
 
function renderStockAvailableTable_(report) {
  const rows = report.items.map((it) => `
    <tr>
      <td class="row-label">${it.code}</td>
      <td>${it.name}</td>
      <td>${formatNum_(it.salesPlan, "auto")}</td>
      <td>${formatNum_(it.dailyToProduce, "auto")}</td>
      <td>${formatNum_(it.availableStock, "auto")}</td>
      <td>${it.daysOfAvailable === null ? "-" : formatNum_(it.daysOfAvailable, "auto")}</td>
      <td>${it.weightRange}</td>
      <td>${formatNum_(it.productionPlan, "auto")}</td>
      <td>${it.liveWeight}</td>
      <td></td>
    </tr>
  `).join("");
 
  return `
    <table class="report-table">
      <thead>
        <tr>
          <th class="row-label">Item Code</th>
          <th>Item Name</th>
          <th>Monthly Sales Plan (Kg)</th>
          <th>Daily to be Produced (kg)</th>
          <th>Available Stock as at ${report.asAtLabel} (kg)</th>
          <th>Days of Available</th>
          <th>Weight or weight range (g)</th>
          <th>Production Plan</th>
          <th>Live Weight</th>
          <th>No of Pieces (per pack)</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
      <tfoot>
        <tr class="bold-row">
          <td class="total-cell" colspan="2">Total</td>
          <td class="total-cell">${formatNum_(report.totalSalesPlan, "auto")}</td>
          <td class="total-cell">${formatNum_(report.totalDailyToProduce, "auto")}</td>
          <td class="total-cell">${formatNum_(report.totalAvailableStock, "auto")}</td>
          <td class="total-cell"></td>
          <td class="total-cell"></td>
          <td class="total-cell"></td>
          <td class="total-cell"></td>
          <td class="total-cell"></td>
        </tr>
      </tfoot>
    </table>
  `;
}
 
function downloadStockAvailableCsv_(report) {
  const headers = [
    "Item Code", "Item Name", "Monthly Sales Plan (Kg)", "Daily to be Produced (kg)",
    `Available Stock as at ${report.asAtLabel} (kg)`, "Days of Available",
    "Weight or weight range (g)", "Production Plan", "Live Weight", "No of Pieces (per pack)",
  ];
  let csv = headers.map((h) => `"${h}"`).join(",") + "\n";
 
  report.items.forEach((it) => {
    const row = [
      it.code, it.name, it.salesPlan, it.dailyToProduce, it.availableStock,
      it.daysOfAvailable === null ? "" : it.daysOfAvailable,
      it.weightRange, it.productionPlan, it.liveWeight, "",
    ];
    csv += row.map((v) => `"${v}"`).join(",") + "\n";
  });
 
  csv += ["Total", "", report.totalSalesPlan, report.totalDailyToProduce, report.totalAvailableStock, "", "", "", "", ""]
    .map((v) => `"${v}"`).join(",") + "\n";
 
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Day_of_Stock_Available_${report.date}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ===================================================================
// YIELD REPORT
// ===================================================================
function initYieldReport() {
  const monthSelect = document.getElementById("yieldMonth");
  const yearSelect = document.getElementById("yieldYear");

  if (monthSelect.dataset.bound) return;
  monthSelect.dataset.bound = "true";

  const nowYear = new Date().getFullYear();
  for (let y = nowYear - 3; y <= nowYear + 1; y++) {
    const opt = document.createElement("option");
    opt.value = y; opt.textContent = y;
    if (y === nowYear) opt.selected = true;
    yearSelect.appendChild(opt);
  }
  monthSelect.value = new Date().getMonth() + 1;

  monthSelect.addEventListener("change", renderYieldReport);
  yearSelect.addEventListener("change", renderYieldReport);

  document.getElementById("yieldCsvBtn").addEventListener("click", () => {
    if (window.currentYieldReport) downloadYieldCsv_(window.currentYieldReport);
  });
  document.getElementById("yieldPdfBtn").addEventListener("click", () => window.print());

  renderYieldReport();
}

async function renderYieldReport() {
  const year = document.getElementById("yieldYear").value;
  const month = document.getElementById("yieldMonth").value;
  const panel = document.getElementById("yieldPanel");
  panel.innerHTML = `<p class="hint">Loading…</p>`;

  try {
    const report = await buildYieldReport(year, month);
    window.currentYieldReport = report;
    document.getElementById("yieldPrintMonth").textContent = `${MONTH_NAMES_[month - 1]} ${year}`;
    panel.innerHTML = renderYieldTable_(report);
  } catch (err) {
    panel.innerHTML = `<p class="hint error">Failed to load report: ${err.message}</p>`;
  }
}

function pctOrNum_(value, col) {
  if (col.isPercent) return `${(value * 100).toFixed(1)}%`;
  return formatNum_(value, col.decimals ?? 0);
}

function renderYieldTable_(report) {
  const cols = YIELD_COLUMNS_;
  const colHeaders = cols.map((c) => `<th>${c.label}</th>`).join("");

  const bodyRows = report.dateRows.map((r) => {
  const cells = cols.map((c) => {
    const cls = c.highlight ? ' class="total-cell"' : "";
    return `<td${cls}>${r.hasData ? pctOrNum_(r.metrics[c.key], c) : ""}</td>`;
  }).join("");
  const dowClass = getDayOfWeekClass_(r.date);
  return `<tr class="${dowClass}"><td class="row-label">${formatDateDMY_(r.date)}</td>${cells}</tr>`;
}).join("");

  const totalCells = cols.map((c) => {
    const cls = c.highlight ? ' class="total-cell"' : "";
    return `<td${cls}>${pctOrNum_(report.totals[c.key], c)}</td>`;
  }).join("");

  return `
    <table class="report-table yield-table">
      <thead><tr><th class="row-label">Date</th>${colHeaders}</tr></thead>
      <tbody>${bodyRows}</tbody>
      <tfoot>
        <tr class="bold-row"><td class="row-label">Total &gt;&gt;&gt;</td>${totalCells}</tr>
      </tfoot>
    </table>
  `;
}

function downloadYieldCsv_(report) {
  const headers = ["Date", ...YIELD_COLUMNS_.map((c) => c.label)];
  let csv = headers.join(",") + "\n";

  report.dateRows.forEach((r) => {
    const vals = YIELD_COLUMNS_.map((c) => (r.hasData ? pctOrNum_(r.metrics[c.key], c) : ""));
    csv += [formatDateDMY_(r.date), ...vals].map((v) => `"${v}"`).join(",") + "\n";
  });

  const totalVals = YIELD_COLUMNS_.map((c) => pctOrNum_(report.totals[c.key], c));
  csv += ["Total", ...totalVals].map((v) => `"${v}"`).join(",") + "\n";

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Yield_Report_${report.year}-${String(report.month).padStart(2, "0")}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ===================================================================
// Update KPI header with standard and working days
// ===================================================================

function updateKpiHeader(kpiKey, standard, workingDays) {
  const viewElement = document.getElementById(`view-${kpiKey}`);
  if (!viewElement) return;

  // Update info row (center)
  const infoRow = viewElement.querySelector('.info-row-center');
  if (!infoRow) return;

  let infoDiv = infoRow.querySelector('.kpi-header-info');
  if (!infoDiv) {
    infoDiv = document.createElement('div');
    infoDiv.className = 'kpi-header-info';
    infoRow.appendChild(infoDiv);
  }

  infoDiv.innerHTML = `
    <span>📊 Standard: <strong class="standard-value">${standard}%</strong></span>
    <span class="divider">|</span>
    <span>📅 Working Days: <strong class="working-days-value">${workingDays}</strong></span>
  `;
}

// ===================================================================
// KPI 01 — Bay Mortality Rate %
// ===================================================================
function initBayMortalityKpi() {
  const monthSelect = document.getElementById("kpi01Month");
  const yearSelect = document.getElementById("kpi01Year");

  if (monthSelect.dataset.bound) return;
  monthSelect.dataset.bound = "true";

  const nowYear = new Date().getFullYear();
  for (let y = nowYear - 3; y <= nowYear + 1; y++) {
    const opt = document.createElement("option");
    opt.value = y;
    opt.textContent = y;
    if (y === nowYear) opt.selected = true;
    yearSelect.appendChild(opt);
  }
  monthSelect.value = new Date().getMonth() + 1;

  monthSelect.addEventListener("change", renderBayMortalityKpi);
  yearSelect.addEventListener("change", renderBayMortalityKpi);

  renderBayMortalityKpi();
}

async function renderBayMortalityKpi() {
  const year = document.getElementById("kpi01Year").value;
  const month = document.getElementById("kpi01Month").value;
  const panel = document.getElementById("kpi01Panel");
  panel.innerHTML = `<p class="hint">Loading…</p>`;

  try {
    const report = await buildBayMortalityKpi(year, month);
    panel.innerHTML =
      renderBayMortalitySummaryCards_(report.summary) +
      `<div class="panel kpi-chart-panel"><div class="panel-body"><canvas id="kpi01Chart" height="90"></canvas></div></div>` +
      renderBayMortalityTable_(report);
    renderBayMortalityChart_(report);
    syncChartWidthToTable_();
  } catch (err) {
    panel.innerHTML = `<p class="hint error">Failed to load report: ${err.message}</p>`;
  }
}

function renderBayMortalityTable_(report) {
  const holidayMap = report.holidayMap || {};
  const dateCells = report.days.map((d) => {
    const cls = getDateHeaderClass_(d.date, holidayMap);
    return `<td class="${cls}">${String(d.day).padStart(2, "0")}</td>`;
  }).join("");
  const birdsCells = report.days.map((d) => `<td>${d.hasData ? formatNum_(d.totalBirds, 0) : ""}</td>`).join("");
  const mortalityCells = report.days.map((d) => `<td>${d.hasData ? formatNum_(d.bayMortality, 0) : ""}</td>`).join("");
  const pctCells = report.days.map((d) => {
    if (!d.hasData) return `<td></td>`;
    const cls = bayMortalityColorClass_(d.pct);
    return `<td class="${cls}">${d.pct.toFixed(2)}%</td>`;
  }).join("");

  return `
    <div class="kpi-table-scroll">
      <table class="report-table kpi-bay-mortality-table">
        <tbody>
          <tr><td class="row-label">Date</td>${dateCells}</tr>
          <tr><td class="row-label">Total Birds Received Alive</td>${birdsCells}</tr>
          <tr><td class="row-label">Bay Mortality Birds</td>${mortalityCells}</tr>
          <tr><td class="row-label">Bay Mortality %</td>${pctCells}</tr>
        </tbody>
      </table>
    </div>
  `;
}
function renderBayMortalitySummaryCards_(summary) {
  const cards = summary.map((s) => `
    <div class="kpi-card kpi-card-${s.key}">
      <div class="kpi-card-label">${s.label}</div>
      <div class="kpi-card-range">${s.range}</div>
      <div class="kpi-card-bottom-row">
        <span class="kpi-card-count">${s.count} <span class="kpi-card-days">days</span></span>
        <span class="kpi-card-pct">${s.pct}%</span>
      </div>
    </div>`).join("");

  return `<div class="kpi-cards-wrap">${cards}</div>`;
}
let kpi01ChartInstance_ = null;

const bayMortalityBandFill_ = {
  id: "bayMortalityBandFill",
  beforeDatasetsDraw(chart) {
    const { ctx, chartArea, scales } = chart;
    if (!chartArea) return;
    const yScale = scales.y;
    const std = KPI_BAY_MORTALITY_STANDARD_;

    const yStd = yScale.getPixelForValue(std);
    const yStd15 = yScale.getPixelForValue(std * 1.5);
    const yStd2 = yScale.getPixelForValue(std * 2);

    ctx.save();

    // Below standard (0 to std) — green
    ctx.fillStyle = "rgba(76, 175, 80, 0.35)";
    ctx.fillRect(chartArea.left, yStd, chartArea.right - chartArea.left, chartArea.bottom - yStd);

    // std to std*1.5 — yellow
    ctx.fillStyle = "rgba(255, 213, 79, 0.4)";
    ctx.fillRect(chartArea.left, yStd15, chartArea.right - chartArea.left, yStd - yStd15);

    // std*1.5 to std*2 — orange
    ctx.fillStyle = "rgba(255, 152, 0, 0.35)";
    ctx.fillRect(chartArea.left, yStd2, chartArea.right - chartArea.left, yStd15 - yStd2);

    // above std*2 — red
    ctx.fillStyle = "rgba(244, 67, 54, 0.3)";
    ctx.fillRect(chartArea.left, chartArea.top, chartArea.right - chartArea.left, yStd2 - chartArea.top);

    ctx.restore();
  },
};

let kpi01TrendView_ = "daily"; // "daily" | "weekly"

function renderBayMortalityChart_(report) {
  window.currentKpi01Report_ = report; // stash so the toggle can redraw without refetching
  const buckets = computeKpi01TrendBuckets_(report.days, kpi01TrendView_);

  const labels = buckets.map((b) => b.label);
  const actualValues = buckets.map((b) => b.pct);
  const standardValues = buckets.map(() => KPI_BAY_MORTALITY_STANDARD_);

  if (kpi01ChartInstance_) {
    kpi01ChartInstance_.destroy();
  }

  const ctx = document.getElementById("kpi01Chart").getContext("2d");
  kpi01ChartInstance_ = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Actual Bay Mortality %",
          data: actualValues,
          borderColor: "#2c4a7c",
          backgroundColor: "transparent",
          borderWidth: 2,
          tension: 0.35,
          fill: false,
          pointRadius: 1.5,
          pointBackgroundColor: "#2c4a7c",
        },
        {
          label: "Standard (0.05%)",
          data: standardValues,
          borderColor: "#c0564a",
          borderWidth: 2,
          borderDash: [6, 4],
          tension: 0,
          fill: false,
          pointRadius: 0,
        },
      ],
    },
    plugins: [bayMortalityBandFill_],
    options: {
  responsive: true,
  interaction: {
    mode: "index",
    intersect: false,
  },
  animation: {
    duration: 1200,
    easing: "easeOutQuart",
    x: { type: "number", easing: "linear", duration: 1200, from: NaN, delay(ctx) {
      if (ctx.type !== "data" || ctx.xStarted) return 0;
      ctx.xStarted = true;
      return ctx.index * 40;
    }},
  },
  scales: {
    y: {
      beginAtZero: true,
      title: { display: true, text: "Bay Mortality %" },
    },
    x: {
      title: { display: true, text: "Date" },
    },
  },
  plugins: {
          title: {
        display: true,
        text: kpi01TrendView_ === "weekly" ? "Weekly Bay Mortality % Trend" : "Daily Bay Mortality % Trend",
        font: { size: 16, weight: "bold" },
        color: "#14213D",
        padding: { top: 4, bottom: 12 },
      },
    legend: { position: "top" },
    tooltip: {
  mode: "index",
  intersect: false,
  callbacks: {
    afterBody(tooltipItems) {
      const actual = tooltipItems.find((t) => t.dataset.label === "Actual Bay Mortality %");
      const standard = tooltipItems.find((t) => t.dataset.label === "Standard (0.05%)");
      if (!actual || !standard) return "";
      const gap = actual.parsed.y - standard.parsed.y;
      const sign = gap >= 0 ? "+" : "";
      return `Gap: ${sign}${gap.toFixed(2)}%`;
    },
  },
},
  },
},
  });
}
function syncChartWidthToTable_() {
  const table = document.querySelector("#view-kpi-01 .kpi-bay-mortality-table");
  const chartPanel = document.querySelector("#view-kpi-01 .kpi-chart-panel");
  if (!table || !chartPanel) return;

  // Wait one frame so the table has finished laying out before measuring it
  requestAnimationFrame(() => {
    const tableWidth = table.getBoundingClientRect().width;
    chartPanel.style.maxWidth = `${tableWidth}px`;
  });
}

function setupKpi01TrendToggle_() {
  const dailyBtn = document.getElementById("kpi01TrendViewDaily");
  const weeklyBtn = document.getElementById("kpi01TrendViewWeekly");
  if (!dailyBtn || !weeklyBtn) return;

  dailyBtn.onclick = () => {
    kpi01TrendView_ = "daily";
    dailyBtn.classList.add("active");
    weeklyBtn.classList.remove("active");
    if (window.currentKpi01Report_) renderBayMortalityChart_(window.currentKpi01Report_);
  };
  weeklyBtn.onclick = () => {
    kpi01TrendView_ = "weekly";
    weeklyBtn.classList.add("active");
    dailyBtn.classList.remove("active");
    if (window.currentKpi01Report_) renderBayMortalityChart_(window.currentKpi01Report_);
  };
}

// ===================================================================
// KPI 01 — Good Days % Trend (Weekly / Monthly toggle)
// ===================================================================

let kpi01GoodDaysChartInstance_ = null;
let kpi01GoodDaysView_ = "weekly"; // "weekly" | "monthly"

function computeKpi01GoodDaysBuckets_(yearDays, viewMode) {
  const withData = yearDays.filter((r) => r.hasData);

  if (viewMode === "monthly") {
    const buckets = {};
    for (let m = 1; m <= 12; m++) buckets[m] = { total: 0, good: 0 };

    withData.forEach((r) => {
      buckets[r.month].total += 1;
      if (bayMortalityColorClass_(r.pct) === "kpi-green") buckets[r.month].good += 1;
    });

    return Object.keys(buckets)
      .map(Number)
      .sort((a, b) => a - b)
      .map((m) => {
        const b = buckets[m];
        const pct = b.total > 0 ? (b.good / b.total) * 100 : 0;
        return { label: MONTH_SHORT_NAMES_[m - 1], pct, total: b.total, good: b.good };
      });
  }

  const buckets = {};
  withData.forEach((r) => {
    const weekNum = Math.ceil(r.dayOfYear / 7);
    if (!buckets[weekNum]) buckets[weekNum] = { total: 0, good: 0 };
    buckets[weekNum].total += 1;
    if (bayMortalityColorClass_(r.pct) === "kpi-green") buckets[weekNum].good += 1;
  });

  return Object.keys(buckets)
    .map(Number)
    .sort((a, b) => a - b)
    .map((wk) => {
      const b = buckets[wk];
      const pct = b.total > 0 ? (b.good / b.total) * 100 : 0;
      return { label: `W${wk}`, pct, total: b.total, good: b.good };
    });
}

function renderKpi01GoodDaysChart_(yearDays) {
  const buckets = computeKpi01GoodDaysBuckets_(yearDays, kpi01GoodDaysView_);
  const labels = buckets.map((b) => b.label);
  const values = buckets.map((b) => b.pct);

  if (kpi01GoodDaysChartInstance_) {
    kpi01GoodDaysChartInstance_.destroy();
  }

  const ctx = document.getElementById("kpi01GoodDaysChart").getContext("2d");
  kpi01GoodDaysChartInstance_ = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Good Days %",
          data: values,
          borderColor: "#0da23a",
          backgroundColor: "#b3d5b5",
          borderWidth: 2.5,
          tension: 0.35,
          fill: true,
          pointRadius: 4,
          pointBackgroundColor: "#2d6a6a",
        },
      ],
    },
    options: {
      responsive: true,
      animation: { duration: 900, easing: "easeOutQuart" },
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          title: { display: true, text: "Good Days %" },
        },
        x: {
          title: { display: true, text: kpi01GoodDaysView_ === "monthly" ? "Month" : "Week" },
        },
      },
      plugins: {
        title: {
          display: true,
          text: kpi01GoodDaysView_ === "monthly" ? "Good Days % — Monthly" : "Good Days % — Weekly",
          font: { size: 15, weight: "bold" },
          color: "#14213D",
          padding: { top: 4, bottom: 10 },
        },
        legend: { display: false },
        tooltip: {
          callbacks: {
            afterLabel(item) {
              const b = buckets[item.dataIndex];
              return `${b.good} of ${b.total} days good`;
            },
          },
        },
      },
    },
  });
}

function setupKpi01GoodDaysToggle_() {
  const weeklyBtn = document.getElementById("kpi01ViewWeekly");
  const monthlyBtn = document.getElementById("kpi01ViewMonthly");
  if (!weeklyBtn || !monthlyBtn) return;

  weeklyBtn.onclick = () => {
    kpi01GoodDaysView_ = "weekly";
    weeklyBtn.classList.add("active");
    monthlyBtn.classList.remove("active");
    renderKpi01GoodDaysChart_(window.currentKpi01YearDays_ || []);
  };
  monthlyBtn.onclick = () => {
    kpi01GoodDaysView_ = "monthly";
    monthlyBtn.classList.add("active");
    weeklyBtn.classList.remove("active");
    renderKpi01GoodDaysChart_(window.currentKpi01YearDays_ || []);
  };
}

async function renderBayMortalityKpi() {
  const year = document.getElementById("kpi01Year").value;
  const month = document.getElementById("kpi01Month").value;
  const panel = document.getElementById("kpi01Panel");
  panel.innerHTML = `<p class="hint">Loading…</p>`;

  try {
    const report = await buildBayMortalityKpi(year, month);

    // Calculate working days for the selected month
    const workingDays = countWorkingDaysInMonth_(Number(year), Number(month));
    const std = KPI_BAY_MORTALITY_STANDARD_;

    // Update the header with standard and working days
    updateKpiHeader("kpi-01", std, workingDays);

        panel.innerHTML =
  renderBayMortalitySummaryCards_(report.summary) +
  `<div class="panel kpi-chart-panel">
    <div class="chart-toolbar" style="padding:10px 14px 0;">
      <div class="kpi-view-toggle">
        <button type="button" id="kpi01TrendViewDaily" class="kpi-toggle-btn active">Daily</button>
        <button type="button" id="kpi01TrendViewWeekly" class="kpi-toggle-btn">Weekly</button>
      </div>
    </div>
    <div class="panel-body"><canvas id="kpi01Chart" height="90"></canvas></div>
  </div>` +
  renderBayMortalityTable_(report) +
  `<div class="panel kpi-chart-panel" style="margin-top:16px;">
    <div class="chart-toolbar" style="padding:10px 14px 0;">
      <div class="kpi-view-toggle">
        <button type="button" id="kpi01ViewWeekly" class="kpi-toggle-btn active">Weekly</button>
        <button type="button" id="kpi01ViewMonthly" class="kpi-toggle-btn">Monthly</button>
      </div>
    </div>
    <div class="panel-body"><canvas id="kpi01GoodDaysChart" height="50"></canvas></div>
  </div>` +
  `<div class="panel kpi-chart-panel" style="margin-top:16px;">
    <div class="chart-toolbar" style="padding:10px 14px 0;">
      <div class="kpi-view-toggle">
        <button type="button" id="kpi01StatusViewWeekly" class="kpi-toggle-btn active">Weekly</button>
        <button type="button" id="kpi01StatusViewMonthly" class="kpi-toggle-btn">Monthly</button>
      </div>
    </div>
    <div class="panel-body"><canvas id="kpi01StatusChart" height="50"></canvas></div>
  </div>`;

renderBayMortalityChart_(report);
kpi01TrendView_ = "daily";
setupKpi01TrendToggle_();
syncChartWidthToTable_();

kpi01GoodDaysView_ = "weekly";
setupKpi01GoodDaysToggle_();

const yearDays = await buildBayMortalityYearData_(year);
window.currentKpi01YearDays_ = yearDays;
renderKpi01GoodDaysChart_(yearDays);

kpi01StatusView_ = "weekly";
setupKpi01StatusToggle_();
renderKpi01StatusChart_(yearDays);
  } catch (err) {
    panel.innerHTML = `<p class="hint error">Failed to load report: ${err.message}</p>`;
  }

// ===================================================================
// Helper: Count working days in a month (excluding Sundays)
// ===================================================================

function countWorkingDaysInMonth_(year, month) {
  const daysInMonth = new Date(year, month, 0).getDate();
  let count = 0;
  for (let d = 1; d <= daysInMonth; d++) {
    const dayOfWeek = new Date(year, month - 1, d).getDay();
    if (dayOfWeek !== 0) { // 0 = Sunday
      count++;
    }
  }
  return count;
}
}

// ===================================================================
// KPI 04 — Packing Line Efficiency %
// ===================================================================
function initPackingEfficiencyKpi() {
  const monthSelect = document.getElementById("kpi04Month");
  const yearSelect = document.getElementById("kpi04Year");

  if (!yearSelect || !monthSelect) {
    console.error("KPI 04: Year or Month select not found in DOM");
    return;
  }

  if (monthSelect.dataset.bound) return;
  monthSelect.dataset.bound = "true";

  const nowYear = new Date().getFullYear();
  for (let y = nowYear - 3; y <= nowYear + 1; y++) {
    const opt = document.createElement("option");
    opt.value = y;
    opt.textContent = y;
    if (y === nowYear) opt.selected = true;
    yearSelect.appendChild(opt);
  }
  monthSelect.value = new Date().getMonth() + 1;

  monthSelect.addEventListener("change", renderPackingEfficiencyKpi);
  yearSelect.addEventListener("change", renderPackingEfficiencyKpi);

  renderPackingEfficiencyKpi();
}

function renderPackingEfficiencyTable_(report) {
  const holidayMap = report.holidayMap || {};
  const dateCells = report.days.map((d) => {
    const cls = getDateHeaderClass_(d.date, holidayMap);
    return `<td class="${cls}">${String(d.day).padStart(2, "0")}</td>`;
  }).join("");
  const actualCells = report.days.map((d) => `<td>${d.hasData ? formatNum_(d.actual, "auto") : ""}</td>`).join("");
  const plannedCells = report.days.map((d) => `<td>${d.hasData ? formatNum_(d.planned, "auto") : ""}</td>`).join("");
  const pctCells = report.days.map((d) => {
    if (!d.hasData) return `<td></td>`;
    const cls = packingEfficiencyColorClass_(d.pct);
    return `<td class="${cls}">${d.pct.toFixed(2)}%</td>`;
  }).join("");

  return `
    <div class="kpi-table-scroll">
      <table class="report-table kpi-dressed-yield-table">
        <tbody>
          <tr><td class="row-label">Date</td>${dateCells}</tr>
          <tr><td class="row-label">Actual packed Qty</td>${actualCells}</tr>
          <tr><td class="row-label">Planned packed Qty</td>${plannedCells}</tr>
          <tr><td class="row-label">Efficiency %</td>${pctCells}</tr>
        </tbody>
      </table>
    </div>
  `;
}

function renderPackingEfficiencySummaryCards_(summary) {
  const cards = summary.map((s) => `
    <div class="kpi-card kpi-card-${s.key}">
      <div class="kpi-card-label">${s.label}</div>
      <div class="kpi-card-range">${s.range}</div>
      <div class="kpi-card-bottom-row">
        <span class="kpi-card-count">${s.count} <span class="kpi-card-days">days</span></span>
        <span class="kpi-card-pct">${s.pct}%</span>
      </div>
    </div>`).join("");

  return `<div class="kpi-cards-wrap">${cards}</div>`;
}

let kpi04ChartInstance_ = null;

const packingEfficiencyBandFill_ = {
  id: "packingEfficiencyBandFill",
  beforeDatasetsDraw(chart) {
    const { ctx, chartArea, scales } = chart;
    if (!chartArea) return;
    const yScale = scales.y;
    const std = KPI_PACKING_EFFICIENCY_STANDARD_;

    const yGreen = yScale.getPixelForValue(std);
    const yYellow = yScale.getPixelForValue(std - 10);
    const yOrange = yScale.getPixelForValue(std - 20);

    ctx.save();

    ctx.fillStyle = "rgba(76, 175, 80, 0.35)";
    ctx.fillRect(chartArea.left, chartArea.top, chartArea.right - chartArea.left, yGreen - chartArea.top);

    ctx.fillStyle = "rgba(255, 213, 79, 0.4)";
    ctx.fillRect(chartArea.left, yGreen, chartArea.right - chartArea.left, yYellow - yGreen);

    ctx.fillStyle = "rgba(255, 152, 0, 0.35)";
    ctx.fillRect(chartArea.left, yYellow, chartArea.right - chartArea.left, yOrange - yYellow);

    ctx.fillStyle = "rgba(244, 67, 54, 0.3)";
    ctx.fillRect(chartArea.left, yOrange, chartArea.right - chartArea.left, chartArea.bottom - yOrange);

    ctx.restore();
  },
};

function renderPackingEfficiencyChart_(report) {
  const withData = report.days.filter((d) => d.hasData);

  const labels = withData.map((d) => String(d.day).padStart(2, "0"));
  const actualValues = withData.map((d) => d.pct);
  const standardValues = withData.map(() => KPI_PACKING_EFFICIENCY_STANDARD_);

  if (kpi04ChartInstance_) {
    kpi04ChartInstance_.destroy();
  }

  const ctx = document.getElementById("kpi04Chart").getContext("2d");
  kpi04ChartInstance_ = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Packing Efficiency %",
          data: actualValues,
          borderColor: "#2c4a7c",
          backgroundColor: "transparent",
          borderWidth: 2.5,
          tension: 0.35,
          fill: false,
          pointRadius: 3,
          pointBackgroundColor: "#2c4a7c",
        },
        {
          label: `Standard (${KPI_PACKING_EFFICIENCY_STANDARD_}%)`,
          data: standardValues,
          borderColor: "#c0564a",
          borderWidth: 2,
          borderDash: [6, 4],
          tension: 0,
          fill: false,
          pointRadius: 0,
        },
      ],
    },
    plugins: [packingEfficiencyBandFill_],
    options: {
      responsive: true,
      interaction: { mode: "index", intersect: false },
      animation: {
        duration: 1200,
        easing: "easeOutQuart",
        x: { type: "number", easing: "linear", duration: 1200, from: NaN, delay(ctx) {
          if (ctx.type !== "data" || ctx.xStarted) return 0;
          ctx.xStarted = true;
          return ctx.index * 40;
        }},
      },
      scales: {
        y: { beginAtZero: true, title: { display: true, text: "Efficiency %" } },
        x: { title: { display: true, text: "Date" } },
      },
      plugins: {
        title: {
          display: true,
          text: "Packing Line Efficiency % Trend",
          font: { size: 16, weight: "bold" },
          color: "#14213D",
          padding: { top: 4, bottom: 12 },
        },
        legend: { position: "top" },
        tooltip: {
          mode: "index",
          intersect: false,
          callbacks: {
            afterBody(tooltipItems) {
              const actual = tooltipItems.find((t) => t.dataset.label === "Packing Efficiency %");
              const standard = tooltipItems.find((t) => t.dataset.label.startsWith("Standard"));
              if (!actual || !standard) return "";
              const gap = actual.parsed.y - standard.parsed.y;
              const sign = gap >= 0 ? "+" : "";
              return `Gap: ${sign}${gap.toFixed(2)}%`;
            },
          },
        },
      },
    },
  });
}

function syncKpi04ChartWidthToTable_() {
  const table = document.querySelector("#view-kpi-04 .kpi-dressed-yield-table");
  const chartPanel = document.querySelector("#view-kpi-04 .kpi-chart-panel");
  if (!table || !chartPanel) return;
  requestAnimationFrame(() => {
    const tableWidth = table.getBoundingClientRect().width;
    chartPanel.style.maxWidth = `${tableWidth}px`;
  });
}

// ---- Good Days % trend ----
let kpi04GoodDaysChartInstance_ = null;
let kpi04GoodDaysView_ = "weekly";

function computeKpi04GoodDaysBuckets_(yearDays, viewMode) {
  const withData = yearDays.filter((r) => r.hasData);

  if (viewMode === "monthly") {
    const buckets = {};
    for (let m = 1; m <= 12; m++) buckets[m] = { total: 0, good: 0 };
    withData.forEach((r) => {
      buckets[r.month].total += 1;
      if (packingEfficiencyColorClass_(r.pct) === "kpi-green") buckets[r.month].good += 1;
    });
    return Object.keys(buckets).map(Number).sort((a, b) => a - b).map((m) => {
      const b = buckets[m];
      const pct = b.total > 0 ? (b.good / b.total) * 100 : 0;
      return { label: MONTH_SHORT_NAMES_[m - 1], pct, total: b.total, good: b.good };
    });
  }

  const buckets = {};
  withData.forEach((r) => {
    const weekNum = Math.ceil(r.dayOfYear / 7);
    if (!buckets[weekNum]) buckets[weekNum] = { total: 0, good: 0 };
    buckets[weekNum].total += 1;
    if (packingEfficiencyColorClass_(r.pct) === "kpi-green") buckets[weekNum].good += 1;
  });
  return Object.keys(buckets).map(Number).sort((a, b) => a - b).map((wk) => {
    const b = buckets[wk];
    const pct = b.total > 0 ? (b.good / b.total) * 100 : 0;
    return { label: `W${wk}`, pct, total: b.total, good: b.good };
  });
}

function renderKpi04GoodDaysChart_(yearDays) {
  const buckets = computeKpi04GoodDaysBuckets_(yearDays, kpi04GoodDaysView_);
  const labels = buckets.map((b) => b.label);
  const values = buckets.map((b) => b.pct);

  if (kpi04GoodDaysChartInstance_) kpi04GoodDaysChartInstance_.destroy();

  const ctx = document.getElementById("kpi04GoodDaysChart").getContext("2d");
  kpi04GoodDaysChartInstance_ = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [{
        label: "Good Days %",
        data: values,
        borderColor: "#0da23a",
        backgroundColor: "#b3d5b5",
        borderWidth: 2.5,
        tension: 0.35,
        fill: true,
        pointRadius: 4,
        pointBackgroundColor: "#2d6a6a",
      }],
    },
    options: {
      responsive: true,
      animation: { duration: 900, easing: "easeOutQuart" },
      scales: {
        y: { beginAtZero: true, max: 100, title: { display: true, text: "Good Days %" } },
        x: { title: { display: true, text: kpi04GoodDaysView_ === "monthly" ? "Month" : "Week" } },
      },
      plugins: {
        title: {
          display: true,
          text: kpi04GoodDaysView_ === "monthly" ? "Good Days % — Monthly" : "Good Days % — Weekly",
          font: { size: 15, weight: "bold" }, color: "#14213D", padding: { top: 4, bottom: 10 },
        },
        legend: { display: false },
        tooltip: { callbacks: { afterLabel(item) { const b = buckets[item.dataIndex]; return `${b.good} of ${b.total} days good`; } } },
      },
    },
  });
}

function setupKpi04GoodDaysToggle_() {
  const weeklyBtn = document.getElementById("kpi04ViewWeekly");
  const monthlyBtn = document.getElementById("kpi04ViewMonthly");
  if (!weeklyBtn || !monthlyBtn) return;

  weeklyBtn.onclick = () => {
    kpi04GoodDaysView_ = "weekly";
    weeklyBtn.classList.add("active"); monthlyBtn.classList.remove("active");
    renderKpi04GoodDaysChart_(window.currentKpi04YearDays_ || []);
  };
  monthlyBtn.onclick = () => {
    kpi04GoodDaysView_ = "monthly";
    monthlyBtn.classList.add("active"); weeklyBtn.classList.remove("active");
    renderKpi04GoodDaysChart_(window.currentKpi04YearDays_ || []);
  };
}

// ---- Caution/Warning/Critical status trend ----
let kpi04StatusChartInstance_ = null;
let kpi04StatusView_ = "weekly";

function computeKpi04StatusSeries_(yearDays, viewMode) {
  const withData = yearDays.filter((r) => r.hasData);
  const classify = (r) => packingEfficiencyColorClass_(r.pct);

  if (viewMode === "monthly") {
    const buckets = {};
    for (let m = 1; m <= 12; m++) buckets[m] = { total: 0, yellow: 0, orange: 0, red: 0 };
    withData.forEach((r) => {
      buckets[r.month].total += 1;
      const cls = classify(r);
      if (cls === "kpi-yellow") buckets[r.month].yellow += 1;
      else if (cls === "kpi-orange") buckets[r.month].orange += 1;
      else if (cls === "kpi-red") buckets[r.month].red += 1;
    });
    return Object.keys(buckets).map(Number).sort((a, b) => a - b).map((m) => {
      const b = buckets[m];
      const pct = (n) => (b.total > 0 ? (n / b.total) * 100 : 0);
      return { label: MONTH_SHORT_NAMES_[m - 1], total: b.total, caution: pct(b.yellow), warning: pct(b.orange), critical: pct(b.red) };
    });
  }

  const buckets = {};
  withData.forEach((r) => {
    const weekNum = Math.ceil(r.dayOfYear / 7);
    if (!buckets[weekNum]) buckets[weekNum] = { total: 0, yellow: 0, orange: 0, red: 0 };
    buckets[weekNum].total += 1;
    const cls = classify(r);
    if (cls === "kpi-yellow") buckets[weekNum].yellow += 1;
    else if (cls === "kpi-orange") buckets[weekNum].orange += 1;
    else if (cls === "kpi-red") buckets[weekNum].red += 1;
  });
  return Object.keys(buckets).map(Number).sort((a, b) => a - b).map((wk) => {
    const b = buckets[wk];
    const pct = (n) => (b.total > 0 ? (n / b.total) * 100 : 0);
    return { label: `W${wk}`, total: b.total, caution: pct(b.yellow), warning: pct(b.orange), critical: pct(b.red) };
  });
}

function renderKpi04StatusChart_(yearDays) {
  const buckets = computeKpi04StatusSeries_(yearDays, kpi04StatusView_);
  const labels = buckets.map((b) => b.label);

  if (kpi04StatusChartInstance_) kpi04StatusChartInstance_.destroy();

  const ctx = document.getElementById("kpi04StatusChart").getContext("2d");
  kpi04StatusChartInstance_ = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        { label: "Caution %", data: buckets.map((b) => b.caution), borderColor: "#d4a017", backgroundColor: "transparent", borderWidth: 2.5, tension: 0.35, fill: false, pointRadius: 3, pointBackgroundColor: "#d4a017" },
        { label: "Warning %", data: buckets.map((b) => b.warning), borderColor: "#e07b00", backgroundColor: "transparent", borderWidth: 2.5, tension: 0.35, fill: false, pointRadius: 3, pointBackgroundColor: "#e07b00" },
        { label: "Critical %", data: buckets.map((b) => b.critical), borderColor: "#c0392b", backgroundColor: "transparent", borderWidth: 2.5, tension: 0.35, fill: false, pointRadius: 3, pointBackgroundColor: "#c0392b" },
      ],
    },
    options: {
      responsive: true,
      interaction: { mode: "index", intersect: false },
      animation: { duration: 900, easing: "easeOutQuart" },
      scales: {
        y: { beginAtZero: true, max: 100, title: { display: true, text: "% of Days" } },
        x: { title: { display: true, text: kpi04StatusView_ === "monthly" ? "Month" : "Week" } },
      },
      plugins: {
        title: {
          display: true,
          text: `Caution / Warning / Critical Days % — ${kpi04StatusView_ === "monthly" ? "Monthly" : "Weekly"}`,
          font: { size: 15, weight: "bold" }, color: "#14213D", padding: { top: 4, bottom: 10 },
        },
        legend: { position: "top" },
        tooltip: { mode: "index", intersect: false },
      },
    },
  });
}

function setupKpi04StatusToggle_() {
  const weeklyBtn = document.getElementById("kpi04StatusViewWeekly");
  const monthlyBtn = document.getElementById("kpi04StatusViewMonthly");
  if (!weeklyBtn || !monthlyBtn) return;

  weeklyBtn.onclick = () => {
    kpi04StatusView_ = "weekly";
    weeklyBtn.classList.add("active"); monthlyBtn.classList.remove("active");
    renderKpi04StatusChart_(window.currentKpi04YearDays_ || []);
  };
  monthlyBtn.onclick = () => {
    kpi04StatusView_ = "monthly";
    monthlyBtn.classList.add("active"); weeklyBtn.classList.remove("active");
    renderKpi04StatusChart_(window.currentKpi04YearDays_ || []);
  };
}

// ---- Main render orchestrator ----
async function renderPackingEfficiencyKpi() {
  const year = document.getElementById("kpi04Year").value;
  const month = document.getElementById("kpi04Month").value;
  const panel = document.getElementById("kpi04Panel");
  panel.innerHTML = `<p class="hint">Loading…</p>`;

  try {
    const report = await buildPackingEfficiencyKpi(year, month);

    const workingDays = countWorkingDaysInMonth_(Number(year), Number(month));
    const std = KPI_PACKING_EFFICIENCY_STANDARD_;
    updateKpiHeader("kpi-04", std, workingDays);

    panel.innerHTML =
      renderPackingEfficiencySummaryCards_(report.summary) +
      `<div class="panel kpi-chart-panel"><div class="panel-body"><canvas id="kpi04Chart" height="90"></canvas></div></div>` +
      renderPackingEfficiencyTable_(report) +
      `<div class="panel kpi-chart-panel" style="margin-top:16px;">
        <div class="chart-toolbar" style="padding:10px 14px 0;">
          <div class="kpi-view-toggle">
            <button type="button" id="kpi04ViewWeekly" class="kpi-toggle-btn active">Weekly</button>
            <button type="button" id="kpi04ViewMonthly" class="kpi-toggle-btn">Monthly</button>
          </div>
        </div>
        <div class="panel-body"><canvas id="kpi04GoodDaysChart" height="50"></canvas></div>
      </div>` +
      `<div class="panel kpi-chart-panel" style="margin-top:16px;">
        <div class="chart-toolbar" style="padding:10px 14px 0;">
          <div class="kpi-view-toggle">
            <button type="button" id="kpi04StatusViewWeekly" class="kpi-toggle-btn active">Weekly</button>
            <button type="button" id="kpi04StatusViewMonthly" class="kpi-toggle-btn">Monthly</button>
          </div>
        </div>
        <div class="panel-body"><canvas id="kpi04StatusChart" height="50"></canvas></div>
      </div>`;

    renderPackingEfficiencyChart_(report);
    syncKpi04ChartWidthToTable_();

    kpi04GoodDaysView_ = "weekly";
    setupKpi04GoodDaysToggle_();

    const yearDays = await buildPackingEfficiencyYearData_(year);
    window.currentKpi04YearDays_ = yearDays;
    renderKpi04GoodDaysChart_(yearDays);

    kpi04StatusView_ = "weekly";
    setupKpi04StatusToggle_();
    renderKpi04StatusChart_(yearDays);
  } catch (err) {
    panel.innerHTML = `<p class="hint error">Failed to load report: ${err.message}</p>`;
  }
}

// ===================================================================
// KPI 05 — Dressed Yield %
// ===================================================================
function initDressedYieldKpi() {
  const monthSelect = document.getElementById("kpi05Month");
  const yearSelect = document.getElementById("kpi05Year");

  if (!yearSelect || !monthSelect) {
    console.error("KPI 05: Year or Month select not found in DOM");
    return;
  }

  if (monthSelect.dataset.bound) return;
  monthSelect.dataset.bound = "true";

  const nowYear = new Date().getFullYear();
  for (let y = nowYear - 3; y <= nowYear + 1; y++) {
    const opt = document.createElement("option");
    opt.value = y;
    opt.textContent = y;
    if (y === nowYear) opt.selected = true;
    yearSelect.appendChild(opt);
  }
  monthSelect.value = new Date().getMonth() + 1;

  monthSelect.addEventListener("change", renderDressedYieldKpi);
  yearSelect.addEventListener("change", renderDressedYieldKpi);

  renderDressedYieldKpi();
}

async function renderDressedYieldKpi() {
  const year = document.getElementById("kpi05Year").value;
  const month = document.getElementById("kpi05Month").value;
  const panel = document.getElementById("kpi05Panel");
  panel.innerHTML = `<p class="hint">Loading…</p>`;

  try {
    const report = await buildDressedYieldKpi(year, month);
    panel.innerHTML = renderDressedYieldTable_(report);
  } catch (err) {
    panel.innerHTML = `<p class="hint error">Failed to load report: ${err.message}</p>`;
  }
}

function renderDressedYieldTable_(report) {
  const holidayMap = report.holidayMap || {};
  const dateCells = report.dateRows.map((r) => {
    const cls = getDateHeaderClass_(r.date, holidayMap);
    return `<td class="${cls}">${String(r.day).padStart(2, "0")}</td>`;
  }).join("");
  const liveCells = report.dateRows.map((r) => `<td>${r.hasData ? formatNum_(r.liveWeight, 1) : ""}</td>`).join("");
  const dressedCells = report.dateRows.map((r) => `<td>${r.hasData ? formatNum_(r.dressedWeight, 1) : ""}</td>`).join("");
  const pctCells = report.dateRows.map((r) => {
    if (!r.hasData) return `<td></td>`;
    const y = r.yieldPct;
    const cls = y >= 75 ? "kpi-green" : y >= 70 ? "kpi-yellow" : y >= 65 ? "kpi-orange" : "kpi-red";
    return `<td class="${cls}">${y.toFixed(2)}%</td>`;
  }).join("");

  return `
    <div class="kpi-table-scroll">
      <table class="report-table kpi-dressed-yield-table">
        <tbody>
          <tr><td class="row-label">Date</td>${dateCells}</tr>
          <tr><td class="row-label">Live Bird Weight (Kg)</td>${liveCells}</tr>
          <tr><td class="row-label">Dressed Weight (Kg)</td>${dressedCells}</tr>
          <tr><td class="row-label">Yield %</td>${pctCells}</tr>
        </tbody>
      </table>
    </div>
  `;
}
function renderDressedYieldSummaryCards_(summary) {
  const cards = summary.map((s) => `
    <div class="kpi-card kpi-card-${s.key}">
      <div class="kpi-card-label">${s.label}</div>
      <div class="kpi-card-range">${s.range}</div>
      <div class="kpi-card-bottom-row">
        <span class="kpi-card-count">${s.count} <span class="kpi-card-days">days</span></span>
        <span class="kpi-card-pct">${s.pct}%</span>
      </div>
    </div>`).join("");

  return `<div class="kpi-cards-wrap">${cards}</div>`;
}
async function renderDressedYieldKpi() {
  const year = document.getElementById("kpi05Year").value;
  const month = document.getElementById("kpi05Month").value;
  const panel = document.getElementById("kpi05Panel");
  panel.innerHTML = `<p class="hint">Loading…</p>`;

  try {
    const report = await buildDressedYieldKpi(year, month);
    panel.innerHTML =
      renderDressedYieldSummaryCards_(report.summary) +
      renderDressedYieldTable_(report);
  } catch (err) {
    panel.innerHTML = `<p class="hint error">Failed to load report: ${err.message}</p>`;
  }
}
// ===================================================================
// KPI 05 — Dressed Yield % chart
// ===================================================================

let kpi05ChartInstance_ = null;

const dressedYieldBandFill_ = {
  id: "dressedYieldBandFill",
  beforeDatasetsDraw(chart) {
    const { ctx, chartArea, scales } = chart;
    if (!chartArea) return;
    const yScale = scales.y;
    const t = KPI_DRESSED_YIELD_THRESHOLDS_;

    const yGreen = yScale.getPixelForValue(t.green);
    const yYellow = yScale.getPixelForValue(t.yellow);
    const yOrange = yScale.getPixelForValue(t.orange);

    ctx.save();

    // Above green threshold — green
    ctx.fillStyle = "rgba(76, 175, 80, 0.35)";
    ctx.fillRect(chartArea.left, chartArea.top, chartArea.right - chartArea.left, yGreen - chartArea.top);

    // yellow to green — yellow
    ctx.fillStyle = "rgba(255, 213, 79, 0.4)";
    ctx.fillRect(chartArea.left, yGreen, chartArea.right - chartArea.left, yYellow - yGreen);

    // orange to yellow — orange
    ctx.fillStyle = "rgba(255, 152, 0, 0.35)";
    ctx.fillRect(chartArea.left, yYellow, chartArea.right - chartArea.left, yOrange - yYellow);

    // below orange — red
    ctx.fillStyle = "rgba(244, 67, 54, 0.3)";
    ctx.fillRect(chartArea.left, yOrange, chartArea.right - chartArea.left, chartArea.bottom - yOrange);

    ctx.restore();
  },
};

function renderDressedYieldChart_(report) {
  const withData = report.dateRows.filter((r) => r.hasData);

  const labels = withData.map((r) => String(r.day).padStart(2, "0"));
  const actualValues = withData.map((r) => r.yieldPct);
  const standardValues = withData.map(() => KPI_DRESSED_YIELD_STANDARD_);

  if (kpi05ChartInstance_) {
    kpi05ChartInstance_.destroy();
  }

  const ctx = document.getElementById("kpi05Chart").getContext("2d");
  kpi05ChartInstance_ = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Dressed Yield %",
          data: actualValues,
          borderColor: "#2c4a7c",
          backgroundColor: "transparent",
          borderWidth: 2.5,
          tension: 0.35,
          fill: false,
          pointRadius: 3,
          pointBackgroundColor: "#2c4a7c",
        },
        {
          label: "Standard (79%)",
          data: standardValues,
          borderColor: "#c0564a",
          borderWidth: 2,
          borderDash: [6, 4],
          tension: 0,
          fill: false,
          pointRadius: 0,
        },
      ],
    },
    plugins: [dressedYieldBandFill_],
    options: {
      responsive: true,
      interaction: { mode: "index", intersect: false },
      animation: {
        duration: 1200,
        easing: "easeOutQuart",
        x: { type: "number", easing: "linear", duration: 1200, from: NaN, delay(ctx) {
          if (ctx.type !== "data" || ctx.xStarted) return 0;
          ctx.xStarted = true;
          return ctx.index * 40;
        }},
      },
      scales: {
        y: {
          beginAtZero: true,
          title: { display: true, text: "Dressed Yield %" },
        },
        x: {
          title: { display: true, text: "Date" },
        },
      },
      plugins: {
        title: {
          display: true,
          text: "Dressed Yield % Trend",
          font: { size: 16, weight: "bold" },
          color: "#14213D",
          padding: { top: 4, bottom: 12 },
        },
        legend: { position: "top" },
        tooltip: {
          mode: "index",
          intersect: false,
          callbacks: {
            afterBody(tooltipItems) {
              const actual = tooltipItems.find((t) => t.dataset.label === "Dressed Yield %");
              const standard = tooltipItems.find((t) => t.dataset.label === "Standard (79%)");
              if (!actual || !standard) return "";
              const gap = actual.parsed.y - standard.parsed.y;
              const sign = gap >= 0 ? "+" : "";
              return `Gap: ${sign}${gap.toFixed(2)}%`;
            },
          },
        },
      },
    },
  });
}

function syncKpi05ChartWidthToTable_() {
  const table = document.querySelector("#view-kpi-05 .kpi-dressed-yield-table");
  const chartPanel = document.querySelector("#view-kpi-05 .kpi-chart-panel");
  if (!table || !chartPanel) return;
  requestAnimationFrame(() => {
    const tableWidth = table.getBoundingClientRect().width;
    chartPanel.style.maxWidth = `${tableWidth}px`;
  });
}

async function renderDressedYieldKpi() {
  const year = document.getElementById("kpi05Year").value;
  const month = document.getElementById("kpi05Month").value;
  const panel = document.getElementById("kpi05Panel");
  panel.innerHTML = `<p class="hint">Loading…</p>`;

  try {
    const report = await buildDressedYieldKpi(year, month);
    panel.innerHTML =
      renderDressedYieldSummaryCards_(report.summary) +
      `<div class="panel kpi-chart-panel"><div class="panel-body"><canvas id="kpi05Chart" height="90"></canvas></div></div>` +
      renderDressedYieldTable_(report);
    renderDressedYieldChart_(report);
    syncKpi05ChartWidthToTable_();
  } catch (err) {
    panel.innerHTML = `<p class="hint error">Failed to load report: ${err.message}</p>`;
  }
}

// ===================================================================
// KPI 05 — Good Days % Trend (Weekly / Monthly toggle)
// ===================================================================

let kpi05GoodDaysChartInstance_ = null;
let kpi05GoodDaysView_ = "weekly"; // "weekly" | "monthly"

function computeKpi05GoodDaysBuckets_(yearDays, viewMode) {
  const withData = yearDays.filter((r) => r.hasData);

  if (viewMode === "monthly") {
    const buckets = {};
    for (let m = 1; m <= 12; m++) buckets[m] = { total: 0, good: 0 };

    withData.forEach((r) => {
      buckets[r.month].total += 1;
      if (dressedYieldColorClass_(r.yieldPct) === "kpi-green") buckets[r.month].good += 1;
    });

    return Object.keys(buckets)
      .map(Number)
      .sort((a, b) => a - b)
      .map((m) => {
        const b = buckets[m];
        const pct = b.total > 0 ? (b.good / b.total) * 100 : 0;
        return { label: MONTH_SHORT_NAMES_[m - 1], pct, total: b.total, good: b.good };
      });
  }

  const buckets = {};
  withData.forEach((r) => {
    const weekNum = Math.ceil(r.dayOfYear / 7);
    if (!buckets[weekNum]) buckets[weekNum] = { total: 0, good: 0 };
    buckets[weekNum].total += 1;
    if (dressedYieldColorClass_(r.yieldPct) === "kpi-green") buckets[weekNum].good += 1;
  });

  return Object.keys(buckets)
    .map(Number)
    .sort((a, b) => a - b)
    .map((wk) => {
      const b = buckets[wk];
      const pct = b.total > 0 ? (b.good / b.total) * 100 : 0;
      return { label: `W${wk}`, pct, total: b.total, good: b.good };
    });
}

function renderKpi05GoodDaysChart_(yearDays) {
  const buckets = computeKpi05GoodDaysBuckets_(yearDays, kpi05GoodDaysView_);
  const labels = buckets.map((b) => b.label);
  const values = buckets.map((b) => b.pct);

  if (kpi05GoodDaysChartInstance_) {
    kpi05GoodDaysChartInstance_.destroy();
  }

  const ctx = document.getElementById("kpi05GoodDaysChart").getContext("2d");
  kpi05GoodDaysChartInstance_ = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Good Days %",
          data: values,
          borderColor: "#0da23a",
          backgroundColor: "#b3d5b5",
          borderWidth: 2.5,
          tension: 0.35,
          fill: true,
          pointRadius: 4,
          pointBackgroundColor: "#2d6a6a",
        },
      ],
    },
    options: {
      responsive: true,
      animation: { duration: 900, easing: "easeOutQuart" },
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          title: { display: true, text: "Good Days %" },
        },
        x: {
          title: { display: true, text: kpi05GoodDaysView_ === "monthly" ? "Month" : "Week" },
        },
      },
      plugins: {
        title: {
          display: true,
          text: kpi05GoodDaysView_ === "monthly" ? "Good Days % — Monthly" : "Good Days % — Weekly",
          font: { size: 15, weight: "bold" },
          color: "#14213D",
          padding: { top: 4, bottom: 10 },
        },
        legend: { display: false },
        tooltip: {
          callbacks: {
            afterLabel(item) {
              const b = buckets[item.dataIndex];
              return `${b.good} of ${b.total} days good`;
            },
          },
        },
      },
    },
  });
}

function setupKpi05GoodDaysToggle_() {
  const weeklyBtn = document.getElementById("kpi05ViewWeekly");
  const monthlyBtn = document.getElementById("kpi05ViewMonthly");
  if (!weeklyBtn || !monthlyBtn) return;

  weeklyBtn.onclick = () => {
    kpi05GoodDaysView_ = "weekly";
    weeklyBtn.classList.add("active");
    monthlyBtn.classList.remove("active");
    renderKpi05GoodDaysChart_(window.currentKpi05YearDays_ || []);
  };
  monthlyBtn.onclick = () => {
    kpi05GoodDaysView_ = "monthly";
    monthlyBtn.classList.add("active");
    weeklyBtn.classList.remove("active");
    renderKpi05GoodDaysChart_(window.currentKpi05YearDays_ || []);
  };
}

async function renderDressedYieldKpi() {
  const year = document.getElementById("kpi05Year").value;
  const month = document.getElementById("kpi05Month").value;
  const panel = document.getElementById("kpi05Panel");
  panel.innerHTML = `<p class="hint">Loading…</p>`;

  try {
    const report = await buildDressedYieldKpi(year, month);

    const workingDays = countWorkingDaysInMonth_(Number(year), Number(month));
    const std = KPI_DRESSED_YIELD_STANDARD_;
    updateKpiHeader("kpi-05", std, workingDays);

    panel.innerHTML =
      renderDressedYieldSummaryCards_(report.summary) +
      `<div class="panel kpi-chart-panel"><div class="panel-body"><canvas id="kpi05Chart" height="90"></canvas></div></div>` +
      renderDressedYieldTable_(report) +
      `<div class="panel kpi-chart-panel" style="margin-top:16px;">
        <div class="chart-toolbar" style="padding:10px 14px 0;">
          <div class="kpi-view-toggle">
            <button type="button" id="kpi05ViewWeekly" class="kpi-toggle-btn active">Weekly</button>
            <button type="button" id="kpi05ViewMonthly" class="kpi-toggle-btn">Monthly</button>
          </div>
        </div>
        <div class="panel-body"><canvas id="kpi05GoodDaysChart" height="50"></canvas></div>
      </div>` +
      `<div class="panel kpi-chart-panel" style="margin-top:16px;">
    <div class="chart-toolbar" style="padding:10px 14px 0; margin-bottom:-10px">
      <div class="kpi-view-toggle">
        <button type="button" id="kpi05StatusViewWeekly" class="kpi-toggle-btn active">Weekly</button>
        <button type="button" id="kpi05StatusViewMonthly" class="kpi-toggle-btn">Monthly</button>
      </div>
    </div>
    <div class="panel-body"><canvas id="kpi05StatusChart" height="50"></canvas></div>
  </div>`;

    renderDressedYieldChart_(report);
    syncKpi05ChartWidthToTable_();

    kpi05GoodDaysView_ = "weekly";
    setupKpi05GoodDaysToggle_();
    
    const yearDays = await buildDressedYieldYearData_(year);
    window.currentKpi05YearDays_ = yearDays;
    renderKpi05GoodDaysChart_(yearDays);
    
    kpi05StatusView_ = "weekly";
    setupKpi05StatusToggle_();
    renderKpi05StatusChart_(yearDays);
  } catch (err) {
    panel.innerHTML = `<p class="hint error">Failed to load report: ${err.message}</p>`;
  }
}

// ===================================================================
// KPI 06 — Chill Loss %
// ===================================================================
function initChillLossKpi() {
  const monthSelect = document.getElementById("kpi06Month");
  const yearSelect = document.getElementById("kpi06Year");

  if (!yearSelect || !monthSelect) {
    console.error("KPI 06: Year or Month select not found in DOM");
    return;
  }

  if (monthSelect.dataset.bound) return;
  monthSelect.dataset.bound = "true";

  const nowYear = new Date().getFullYear();
  for (let y = nowYear - 3; y <= nowYear + 1; y++) {
    const opt = document.createElement("option");
    opt.value = y;
    opt.textContent = y;
    if (y === nowYear) opt.selected = true;
    yearSelect.appendChild(opt);
  }
  monthSelect.value = new Date().getMonth() + 1;

  monthSelect.addEventListener("change", renderChillLossKpi);
  yearSelect.addEventListener("change", renderChillLossKpi);

  renderChillLossKpi();
}

function renderChillLossTable_(report) {
  const holidayMap = report.holidayMap || {};
  const dateCells = report.dateRows.map((r) => {
    const cls = getDateHeaderClass_(r.date, holidayMap);
    return `<td class="${cls}">${String(r.day).padStart(2, "0")}</td>`;
  }).join("");
  const chillCells = report.dateRows.map((r) => `<td>${r.hasData ? formatNum_(r.chillWeight, 1) : ""}</td>`).join("");
  const diffCells = report.dateRows.map((r) => `<td>${r.hasData ? formatNum_(r.diff, 1) : ""}</td>`).join("");
  const pctCells = report.dateRows.map((r) => {
    if (!r.hasData) return `<td></td>`;
    const cls = chillLossColorClass_(r.chillLossPct);
    return `<td class="${cls}">${r.chillLossPct.toFixed(2)}%</td>`;
  }).join("");

  return `
    <div class="kpi-table-scroll">
      <table class="report-table kpi-dressed-yield-table">
        <tbody>
          <tr><td class="row-label">Date</td>${dateCells}</tr>
          <tr><td class="row-label">Chill Weight (Kg)</td>${chillCells}</tr>
          <tr><td class="row-label">Diff (Chill-Dress)</td>${diffCells}</tr>
          <tr><td class="row-label">Chill Loss %</td>${pctCells}</tr>
        </tbody>
      </table>
    </div>
  `;
}

function renderChillLossSummaryCards_(summary) {
  const cards = summary.map((s) => `
    <div class="kpi-card kpi-card-${s.key}">
      <div class="kpi-card-label">${s.label}</div>
      <div class="kpi-card-range">${s.range}</div>
      <div class="kpi-card-bottom-row">
        <span class="kpi-card-count">${s.count} <span class="kpi-card-days">days</span></span>
        <span class="kpi-card-pct">${s.pct}%</span>
      </div>
    </div>`).join("");

  return `<div class="kpi-cards-wrap">${cards}</div>`;
}
// ===================================================================
// KPI 06 — Chill Loss % chart
// ===================================================================

let kpi06ChartInstance_ = null;
const KPI_CHILL_LOSS_STANDARD_ = 2;

const chillLossBandFill_ = {
  id: "chillLossBandFill",
  beforeDatasetsDraw(chart) {
    const { ctx, chartArea, scales } = chart;
    if (!chartArea) return;
    const yScale = scales.y;
    const t = KPI_CHILL_LOSS_THRESHOLDS_;

    const yGreen = yScale.getPixelForValue(t.green);
    const yYellow = yScale.getPixelForValue(t.yellow);
    const yOrange = yScale.getPixelForValue(t.orange);

    ctx.save();

    // 0 up to green threshold (near the bottom, since low % is good) — green
    ctx.fillStyle = "rgba(76, 175, 80, 0.35)";
    ctx.fillRect(chartArea.left, yGreen, chartArea.right - chartArea.left, chartArea.bottom - yGreen);

    // green to yellow — yellow
    ctx.fillStyle = "rgba(255, 213, 79, 0.4)";
    ctx.fillRect(chartArea.left, yYellow, chartArea.right - chartArea.left, yGreen - yYellow);

    // yellow to orange — orange
    ctx.fillStyle = "rgba(255, 152, 0, 0.35)";
    ctx.fillRect(chartArea.left, yOrange, chartArea.right - chartArea.left, yYellow - yOrange);

    // above orange (worst, near top) — red
    ctx.fillStyle = "rgba(244, 67, 54, 0.3)";
    ctx.fillRect(chartArea.left, chartArea.top, chartArea.right - chartArea.left, yOrange - chartArea.top);

    ctx.restore();
  },
};

function renderChillLossChart_(report) {
  const withData = report.dateRows.filter((r) => r.hasData);

  const labels = withData.map((r) => String(r.day).padStart(2, "0"));
  const actualValues = withData.map((r) => r.chillLossPct);
  const standardValues = withData.map(() => KPI_CHILL_LOSS_STANDARD_);

  if (kpi06ChartInstance_) {
    kpi06ChartInstance_.destroy();
  }

  const ctx = document.getElementById("kpi06Chart").getContext("2d");
  kpi06ChartInstance_ = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Chill Loss %",
          data: actualValues,
          borderColor: "#2c4a7c",
          backgroundColor: "transparent",
          borderWidth: 2.5,
          tension: 0.35,
          fill: false,
          pointRadius: 3,
          pointBackgroundColor: "#2c4a7c",
        },
        {
          label: "Standard (2%)",
          data: standardValues,
          borderColor: "#c0564a",
          borderWidth: 2,
          borderDash: [6, 4],
          tension: 0,
          fill: false,
          pointRadius: 0,
        },
      ],
    },
    plugins: [chillLossBandFill_],
    options: {
      responsive: true,
      interaction: { mode: "index", intersect: false },
      animation: {
        duration: 1200,
        easing: "easeOutQuart",
        x: { type: "number", easing: "linear", duration: 1200, from: NaN, delay(ctx) {
          if (ctx.type !== "data" || ctx.xStarted) return 0;
          ctx.xStarted = true;
          return ctx.index * 40;
        }},
      },
      scales: {
        y: {
          beginAtZero: true,
          title: { display: true, text: "Chill Loss %" },
        },
        x: {
          title: { display: true, text: "Date" },
        },
      },
      plugins: {
        title: {
          display: true,
          text: "Chill Loss % Trend",
          font: { size: 16, weight: "bold" },
          color: "#14213D",
          padding: { top: 4, bottom: 12 },
        },
        legend: { position: "top" },
        tooltip: {
          mode: "index",
          intersect: false,
          callbacks: {
            afterBody(tooltipItems) {
              const actual = tooltipItems.find((t) => t.dataset.label === "Chill Loss %");
              const standard = tooltipItems.find((t) => t.dataset.label === "Standard (2%)");
              if (!actual || !standard) return "";
              const gap = actual.parsed.y - standard.parsed.y;
              const sign = gap >= 0 ? "+" : "";
              return `Gap: ${sign}${gap.toFixed(2)}%`;
            },
          },
        },
      },
    },
  });
}

function syncKpi06ChartWidthToTable_() {
  const table = document.querySelector("#view-kpi-06 .kpi-dressed-yield-table");
  const chartPanel = document.querySelector("#view-kpi-06 .kpi-chart-panel");
  if (!table || !chartPanel) return;
  requestAnimationFrame(() => {
    const tableWidth = table.getBoundingClientRect().width;
    chartPanel.style.maxWidth = `${tableWidth}px`;
  });
}

async function renderChillLossKpi() {
  const year = document.getElementById("kpi06Year").value;
  const month = document.getElementById("kpi06Month").value;
  const panel = document.getElementById("kpi06Panel");
  panel.innerHTML = `<p class="hint">Loading…</p>`;

  try {
    const report = await buildChillLossKpi(year, month);
    const workingDays = countWorkingDaysInMonth_(Number(year), Number(month));
    const std = KPI_CHILL_LOSS_STANDARD_;
    updateKpiHeader("kpi-06", std, workingDays);
    window.currentKpi06DateRows_ = report.dateRows;

    panel.innerHTML =
      renderChillLossSummaryCards_(report.summary) +
      `<div class="panel kpi-chart-panel"><div class="panel-body"><canvas id="kpi06Chart" height="90"></canvas></div></div>` +
      renderChillLossTable_(report) +
            `<div class="panel kpi-chart-panel" style="margin-top:16px;">
        <div class="chart-toolbar" style="padding:10px 14px 0;">
          <div class="kpi-view-toggle">
            <button type="button" id="kpi06ViewWeekly" class="kpi-toggle-btn active">Weekly</button>
            <button type="button" id="kpi06ViewMonthly" class="kpi-toggle-btn">Monthly</button>
          </div>
        </div>
        <div class="panel-body"><canvas id="kpi06GoodDaysChart" height="50"></canvas></div>
      </div>` +
      `<div class="panel kpi-chart-panel" style="margin-top:16px;">
        <div class="chart-toolbar" style="padding:10px 14px 0;">
          <div class="kpi-view-toggle">
            <button type="button" id="kpi06StatusViewWeekly" class="kpi-toggle-btn active">Weekly</button>
            <button type="button" id="kpi06StatusViewMonthly" class="kpi-toggle-btn">Monthly</button>
          </div>
        </div>
        <div class="panel-body"><canvas id="kpi06StatusChart" height="50"></canvas></div>
      </div>`;

    renderChillLossChart_(report);
    syncKpi06ChartWidthToTable_();

        kpi06GoodDaysView_ = "weekly";
    setupGoodDaysToggle_();

    const yearDays = await buildChillLossYearData_(year);
    window.currentKpi06YearDays_ = yearDays;
    renderGoodDaysChart_(yearDays);

  kpi06StatusView_ = "weekly";
    setupKpi06StatusToggle_();
    renderKpi06StatusChart_(yearDays);
  } catch (err) {
    panel.innerHTML = `<p class="hint error">Failed to load report: ${err.message}</p>`;
  }
}

// ===================================================================
// KPI 06 — Good Days % Trend (Weekly / Monthly toggle)
// ===================================================================

let kpi06GoodDaysChartInstance_ = null;
let kpi06GoodDaysView_ = "weekly"; // "weekly" | "monthly"

const MONTH_SHORT_NAMES_ = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function computeGoodDaysBuckets_(yearDays, viewMode) {
  const withData = yearDays.filter((r) => r.hasData);

  if (viewMode === "monthly") {
    // 12 buckets — one per calendar month of the selected year
    const buckets = {};
    for (let m = 1; m <= 12; m++) buckets[m] = { total: 0, good: 0 };

    withData.forEach((r) => {
      buckets[r.month].total += 1;
      if (chillLossColorClass_(r.chillLossPct) === "kpi-green") buckets[r.month].good += 1;
    });

    return Object.keys(buckets)
      .map(Number)
      .sort((a, b) => a - b)
      .map((m) => {
        const b = buckets[m];
        const pct = b.total > 0 ? (b.good / b.total) * 100 : 0;
        return { label: MONTH_SHORT_NAMES_[m - 1], pct, total: b.total, good: b.good };
      });
  }

  // weekly: 52-53 buckets — one per week of the whole year (7-day chunks from Jan 1)
  const buckets = {};
  withData.forEach((r) => {
    const weekNum = Math.ceil(r.dayOfYear / 7);
    if (!buckets[weekNum]) buckets[weekNum] = { total: 0, good: 0 };
    buckets[weekNum].total += 1;
    if (chillLossColorClass_(r.chillLossPct) === "kpi-green") buckets[weekNum].good += 1;
  });

  return Object.keys(buckets)
    .map(Number)
    .sort((a, b) => a - b)
    .map((wk) => {
      const b = buckets[wk];
      const pct = b.total > 0 ? (b.good / b.total) * 100 : 0;
      return { label: `W${wk}`, pct, total: b.total, good: b.good };
    });
}

function renderGoodDaysChart_(yearDays) {
  const buckets = computeGoodDaysBuckets_(yearDays, kpi06GoodDaysView_);
  const labels = buckets.map((b) => b.label);
  const values = buckets.map((b) => b.pct);

  if (kpi06GoodDaysChartInstance_) {
    kpi06GoodDaysChartInstance_.destroy();
  }

  const ctx = document.getElementById("kpi06GoodDaysChart").getContext("2d");
  kpi06GoodDaysChartInstance_ = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Good Days %",
          data: values,
          borderColor: "#0da23a",
          backgroundColor: "#b3d5b5",
          borderWidth: 2.5,
          tension: 0.35,
          fill: true,
          pointRadius: 4,
          pointBackgroundColor: "#2d6a6a",
        },
      ],
    },
    options: {
      responsive: true,
      animation: { duration: 900, easing: "easeOutQuart" },
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          title: { display: true, text: "Good Days %" },
        },
        x: {
          title: { display: true, text: kpi06GoodDaysView_ === "monthly" ? "Month" : "Week" },
        },
      },
      plugins: {
        title: {
          display: true,
          text: kpi06GoodDaysView_ === "monthly" ? "Good Days % — Monthly" : "Good Days % — Weekly",
          font: { size: 15, weight: "bold" },
          color: "#14213D",
          padding: { top: 4, bottom: 10 },
        },
        legend: { display: false },
        tooltip: {
          callbacks: {
            afterLabel(item) {
              const b = buckets[item.dataIndex];
              return `${b.good} of ${b.total} days good`;
            },
          },
        },
      },
    },
  });
}

function setupGoodDaysToggle_() {
  const weeklyBtn = document.getElementById("kpi06ViewWeekly");
  const monthlyBtn = document.getElementById("kpi06ViewMonthly");
  if (!weeklyBtn || !monthlyBtn) return;

  weeklyBtn.onclick = () => {
    kpi06GoodDaysView_ = "weekly";
    weeklyBtn.classList.add("active");
    monthlyBtn.classList.remove("active");
    renderGoodDaysChart_(window.currentKpi06YearDays_ || []);
  };
  monthlyBtn.onclick = () => {
    kpi06GoodDaysView_ = "monthly";
    monthlyBtn.classList.add("active");
    weeklyBtn.classList.remove("active");
    renderGoodDaysChart_(window.currentKpi06YearDays_ || []);
  };
}

// ===================================================================
// KPI 01 — Caution / Warning / Critical Days % Trend (combined chart)
// ===================================================================

let kpi01StatusChartInstance_ = null;
let kpi01StatusView_ = "weekly";

function computeKpi01StatusSeries_(yearDays, viewMode) {
  const withData = yearDays.filter((r) => r.hasData);

  const classify = (r) => bayMortalityColorClass_(r.pct);

  if (viewMode === "monthly") {
    const buckets = {};
    for (let m = 1; m <= 12; m++) buckets[m] = { total: 0, yellow: 0, orange: 0, red: 0 };
    withData.forEach((r) => {
      buckets[r.month].total += 1;
      const cls = classify(r);
      if (cls === "kpi-yellow") buckets[r.month].yellow += 1;
      else if (cls === "kpi-orange") buckets[r.month].orange += 1;
      else if (cls === "kpi-red") buckets[r.month].red += 1;
    });
    return Object.keys(buckets).map(Number).sort((a, b) => a - b).map((m) => {
      const b = buckets[m];
      const pct = (n) => (b.total > 0 ? (n / b.total) * 100 : 0);
      return { label: MONTH_SHORT_NAMES_[m - 1], total: b.total, caution: pct(b.yellow), warning: pct(b.orange), critical: pct(b.red) };
    });
  }

  const buckets = {};
  withData.forEach((r) => {
    const weekNum = Math.ceil(r.dayOfYear / 7);
    if (!buckets[weekNum]) buckets[weekNum] = { total: 0, yellow: 0, orange: 0, red: 0 };
    buckets[weekNum].total += 1;
    const cls = classify(r);
    if (cls === "kpi-yellow") buckets[weekNum].yellow += 1;
    else if (cls === "kpi-orange") buckets[weekNum].orange += 1;
    else if (cls === "kpi-red") buckets[weekNum].red += 1;
  });
  return Object.keys(buckets).map(Number).sort((a, b) => a - b).map((wk) => {
    const b = buckets[wk];
    const pct = (n) => (b.total > 0 ? (n / b.total) * 100 : 0);
    return { label: `W${wk}`, total: b.total, caution: pct(b.yellow), warning: pct(b.orange), critical: pct(b.red) };
  });
}

function renderKpi01StatusChart_(yearDays) {
  const buckets = computeKpi01StatusSeries_(yearDays, kpi01StatusView_);
  const labels = buckets.map((b) => b.label);

  if (kpi01StatusChartInstance_) {
    kpi01StatusChartInstance_.destroy();
  }

  const ctx = document.getElementById("kpi01StatusChart").getContext("2d");
  kpi01StatusChartInstance_ = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Caution %",
          data: buckets.map((b) => b.caution),
          borderColor: "#d4a017",
          backgroundColor: "transparent",
          borderWidth: 2.5,
          tension: 0.35,
          fill: false,
          pointRadius: 3,
          pointBackgroundColor: "#d4a017",
        },
        {
          label: "Warning %",
          data: buckets.map((b) => b.warning),
          borderColor: "#e07b00",
          backgroundColor: "transparent",
          borderWidth: 2.5,
          tension: 0.35,
          fill: false,
          pointRadius: 3,
          pointBackgroundColor: "#e07b00",
        },
        {
          label: "Critical %",
          data: buckets.map((b) => b.critical),
          borderColor: "#c0392b",
          backgroundColor: "transparent",
          borderWidth: 2.5,
          tension: 0.35,
          fill: false,
          pointRadius: 3,
          pointBackgroundColor: "#c0392b",
        },
      ],
    },
    options: {
      responsive: true,
      interaction: { mode: "index", intersect: false },
      animation: { duration: 900, easing: "easeOutQuart" },
      scales: {
        y: { beginAtZero: true, max: 100, title: { display: true, text: "% of Days" } },
        x: { title: { display: true, text: kpi01StatusView_ === "monthly" ? "Month" : "Week" } },
      },
      plugins: {
        title: {
          display: true,
          text: `Caution / Warning / Critical Days % — ${kpi01StatusView_ === "monthly" ? "Monthly" : "Weekly"}`,
          font: { size: 15, weight: "bold" },
          color: "#14213D",
          padding: { top: 4, bottom: 10 },
        },
        legend: { position: "top" },
        tooltip: { mode: "index", intersect: false },
      },
    },
  });
}

function setupKpi01StatusToggle_() {
  const weeklyBtn = document.getElementById("kpi01StatusViewWeekly");
  const monthlyBtn = document.getElementById("kpi01StatusViewMonthly");
  if (!weeklyBtn || !monthlyBtn) return;

  weeklyBtn.onclick = () => {
    kpi01StatusView_ = "weekly";
    weeklyBtn.classList.add("active");
    monthlyBtn.classList.remove("active");
    renderKpi01StatusChart_(window.currentKpi01YearDays_ || []);
  };
  monthlyBtn.onclick = () => {
    kpi01StatusView_ = "monthly";
    monthlyBtn.classList.add("active");
    weeklyBtn.classList.remove("active");
    renderKpi01StatusChart_(window.currentKpi01YearDays_ || []);
  };
}

// ===================================================================
// KPI 05 — Caution / Warning / Critical Days % Trend (combined chart)
// ===================================================================

let kpi05StatusChartInstance_ = null;
let kpi05StatusView_ = "weekly";

function computeKpi05StatusSeries_(yearDays, viewMode) {
  const withData = yearDays.filter((r) => r.hasData);

  const classify = (r) => dressedYieldColorClass_(r.yieldPct);

  if (viewMode === "monthly") {
    const buckets = {};
    for (let m = 1; m <= 12; m++) buckets[m] = { total: 0, yellow: 0, orange: 0, red: 0 };
    withData.forEach((r) => {
      buckets[r.month].total += 1;
      const cls = classify(r);
      if (cls === "kpi-yellow") buckets[r.month].yellow += 1;
      else if (cls === "kpi-orange") buckets[r.month].orange += 1;
      else if (cls === "kpi-red") buckets[r.month].red += 1;
    });
    return Object.keys(buckets).map(Number).sort((a, b) => a - b).map((m) => {
      const b = buckets[m];
      const pct = (n) => (b.total > 0 ? (n / b.total) * 100 : 0);
      return { label: MONTH_SHORT_NAMES_[m - 1], total: b.total, caution: pct(b.yellow), warning: pct(b.orange), critical: pct(b.red) };
    });
  }

  const buckets = {};
  withData.forEach((r) => {
    const weekNum = Math.ceil(r.dayOfYear / 7);
    if (!buckets[weekNum]) buckets[weekNum] = { total: 0, yellow: 0, orange: 0, red: 0 };
    buckets[weekNum].total += 1;
    const cls = classify(r);
    if (cls === "kpi-yellow") buckets[weekNum].yellow += 1;
    else if (cls === "kpi-orange") buckets[weekNum].orange += 1;
    else if (cls === "kpi-red") buckets[weekNum].red += 1;
  });
  return Object.keys(buckets).map(Number).sort((a, b) => a - b).map((wk) => {
    const b = buckets[wk];
    const pct = (n) => (b.total > 0 ? (n / b.total) * 100 : 0);
    return { label: `W${wk}`, total: b.total, caution: pct(b.yellow), warning: pct(b.orange), critical: pct(b.red) };
  });
}

function renderKpi05StatusChart_(yearDays) {
  const buckets = computeKpi05StatusSeries_(yearDays, kpi05StatusView_);
  const labels = buckets.map((b) => b.label);

  if (kpi05StatusChartInstance_) {
    kpi05StatusChartInstance_.destroy();
  }

  const ctx = document.getElementById("kpi05StatusChart").getContext("2d");
  kpi05StatusChartInstance_ = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Caution %",
          data: buckets.map((b) => b.caution),
          borderColor: "#d4a017",
          backgroundColor: "transparent",
          borderWidth: 2.5,
          tension: 0.35,
          fill: false,
          pointRadius: 3,
          pointBackgroundColor: "#d4a017",
        },
        {
          label: "Warning %",
          data: buckets.map((b) => b.warning),
          borderColor: "#e07b00",
          backgroundColor: "transparent",
          borderWidth: 2.5,
          tension: 0.35,
          fill: false,
          pointRadius: 3,
          pointBackgroundColor: "#e07b00",
        },
        {
          label: "Critical %",
          data: buckets.map((b) => b.critical),
          borderColor: "#c0392b",
          backgroundColor: "transparent",
          borderWidth: 2.5,
          tension: 0.35,
          fill: false,
          pointRadius: 3,
          pointBackgroundColor: "#c0392b",
        },
      ],
    },
    options: {
      responsive: true,
      interaction: { mode: "index", intersect: false },
      animation: { duration: 900, easing: "easeOutQuart" },
      scales: {
        y: { beginAtZero: true, max: 100, title: { display: true, text: "% of Days" } },
        x: { title: { display: true, text: kpi05StatusView_ === "monthly" ? "Month" : "Week" } },
      },
      plugins: {
        title: {
          display: true,
          text: `Caution / Warning / Critical Days % — ${kpi05StatusView_ === "monthly" ? "Monthly" : "Weekly"}`,
          font: { size: 15, weight: "bold" },
          color: "#14213D",
          padding: { top: 4, bottom: 10 },
        },
        legend: { position: "top" },
        tooltip: { mode: "index", intersect: false },
      },
    },
  });
}

function setupKpi05StatusToggle_() {
  const weeklyBtn = document.getElementById("kpi05StatusViewWeekly");
  const monthlyBtn = document.getElementById("kpi05StatusViewMonthly");
  if (!weeklyBtn || !monthlyBtn) return;

  weeklyBtn.onclick = () => {
    kpi05StatusView_ = "weekly";
    weeklyBtn.classList.add("active");
    monthlyBtn.classList.remove("active");
    renderKpi05StatusChart_(window.currentKpi05YearDays_ || []);
  };
  monthlyBtn.onclick = () => {
    kpi05StatusView_ = "monthly";
    monthlyBtn.classList.add("active");
    weeklyBtn.classList.remove("active");
    renderKpi05StatusChart_(window.currentKpi05YearDays_ || []);
  };
}

// ===================================================================
// KPI 06 — Caution / Warning / Critical Days % Trend (combined chart)
// ===================================================================

let kpi06StatusChartInstance_ = null;
let kpi06StatusView_ = "weekly";

function computeKpi06StatusSeries_(yearDays, viewMode) {
  const withData = yearDays.filter((r) => r.hasData);

  const classify = (r) => chillLossColorClass_(r.chillLossPct);

  if (viewMode === "monthly") {
    const buckets = {};
    for (let m = 1; m <= 12; m++) buckets[m] = { total: 0, yellow: 0, orange: 0, red: 0 };
    withData.forEach((r) => {
      buckets[r.month].total += 1;
      const cls = classify(r);
      if (cls === "kpi-yellow") buckets[r.month].yellow += 1;
      else if (cls === "kpi-orange") buckets[r.month].orange += 1;
      else if (cls === "kpi-red") buckets[r.month].red += 1;
    });
    return Object.keys(buckets).map(Number).sort((a, b) => a - b).map((m) => {
      const b = buckets[m];
      const pct = (n) => (b.total > 0 ? (n / b.total) * 100 : 0);
      return { label: MONTH_SHORT_NAMES_[m - 1], total: b.total, caution: pct(b.yellow), warning: pct(b.orange), critical: pct(b.red) };
    });
  }

  const buckets = {};
  withData.forEach((r) => {
    const weekNum = Math.ceil(r.dayOfYear / 7);
    if (!buckets[weekNum]) buckets[weekNum] = { total: 0, yellow: 0, orange: 0, red: 0 };
    buckets[weekNum].total += 1;
    const cls = classify(r);
    if (cls === "kpi-yellow") buckets[weekNum].yellow += 1;
    else if (cls === "kpi-orange") buckets[weekNum].orange += 1;
    else if (cls === "kpi-red") buckets[weekNum].red += 1;
  });
  return Object.keys(buckets).map(Number).sort((a, b) => a - b).map((wk) => {
    const b = buckets[wk];
    const pct = (n) => (b.total > 0 ? (n / b.total) * 100 : 0);
    return { label: `W${wk}`, total: b.total, caution: pct(b.yellow), warning: pct(b.orange), critical: pct(b.red) };
  });
}

function renderKpi06StatusChart_(yearDays) {
  const buckets = computeKpi06StatusSeries_(yearDays, kpi06StatusView_);
  const labels = buckets.map((b) => b.label);

  if (kpi06StatusChartInstance_) {
    kpi06StatusChartInstance_.destroy();
  }

  const ctx = document.getElementById("kpi06StatusChart").getContext("2d");
  kpi06StatusChartInstance_ = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Caution %",
          data: buckets.map((b) => b.caution),
          borderColor: "#d4a017",
          backgroundColor: "transparent",
          borderWidth: 2.5,
          tension: 0.35,
          fill: false,
          pointRadius: 3,
          pointBackgroundColor: "#d4a017",
        },
        {
          label: "Warning %",
          data: buckets.map((b) => b.warning),
          borderColor: "#e07b00",
          backgroundColor: "transparent",
          borderWidth: 2.5,
          tension: 0.35,
          fill: false,
          pointRadius: 3,
          pointBackgroundColor: "#e07b00",
        },
        {
          label: "Critical %",
          data: buckets.map((b) => b.critical),
          borderColor: "#c0392b",
          backgroundColor: "transparent",
          borderWidth: 2.5,
          tension: 0.35,
          fill: false,
          pointRadius: 3,
          pointBackgroundColor: "#c0392b",
        },
      ],
    },
    options: {
      responsive: true,
      interaction: { mode: "index", intersect: false },
      animation: { duration: 900, easing: "easeOutQuart" },
      scales: {
        y: { beginAtZero: true, max: 100, title: { display: true, text: "% of Days" } },
        x: { title: { display: true, text: kpi06StatusView_ === "monthly" ? "Month" : "Week" } },
      },
      plugins: {
        title: {
          display: true,
          text: `Caution / Warning / Critical Days % — ${kpi06StatusView_ === "monthly" ? "Monthly" : "Weekly"}`,
          font: { size: 15, weight: "bold" },
          color: "#14213D",
          padding: { top: 4, bottom: 10 },
        },
        legend: { position: "top" },
        tooltip: { mode: "index", intersect: false },
      },
    },
  });
}

function setupKpi06StatusToggle_() {
  const weeklyBtn = document.getElementById("kpi06StatusViewWeekly");
  const monthlyBtn = document.getElementById("kpi06StatusViewMonthly");
  if (!weeklyBtn || !monthlyBtn) return;

  weeklyBtn.onclick = () => {
    kpi06StatusView_ = "weekly";
    weeklyBtn.classList.add("active");
    monthlyBtn.classList.remove("active");
    renderKpi06StatusChart_(window.currentKpi06YearDays_ || []);
  };
  monthlyBtn.onclick = () => {
    kpi06StatusView_ = "monthly";
    monthlyBtn.classList.add("active");
    weeklyBtn.classList.remove("active");
    renderKpi06StatusChart_(window.currentKpi06YearDays_ || []);
  };
}

// ===================================================================
// KPI 03 — Bird Input Efficiency %
// ===================================================================
function initBirdInputEfficiencyKpi() {
  const monthSelect = document.getElementById("kpi03Month");
  const yearSelect = document.getElementById("kpi03Year");

  if (!yearSelect || !monthSelect) {
    console.error("KPI 03: Year or Month select not found in DOM");
    return;
  }

  if (monthSelect.dataset.bound) return;
  monthSelect.dataset.bound = "true";

  const nowYear = new Date().getFullYear();
  for (let y = nowYear - 3; y <= nowYear + 1; y++) {
    const opt = document.createElement("option");
    opt.value = y;
    opt.textContent = y;
    if (y === nowYear) opt.selected = true;
    yearSelect.appendChild(opt);
  }
  monthSelect.value = new Date().getMonth() + 1;

  monthSelect.addEventListener("change", renderBirdInputEfficiencyKpi);
  yearSelect.addEventListener("change", renderBirdInputEfficiencyKpi);

  renderBirdInputEfficiencyKpi();
}

function renderBirdInputTable_(report) {
  const holidayMap = report.holidayMap || {};
  const dateCells = report.days.map((d) => {
    const cls = getDateHeaderClass_(d.date, holidayMap);
    return `<td class="${cls}">${String(d.day).padStart(2, "0")}</td>`;
  }).join("");
  const actualCells = report.days.map((d) => `<td>${d.hasData ? formatNum_(d.actual, "auto") : ""}</td>`).join("");
  const plannedCells = report.days.map((d) => `<td>${d.hasData ? formatNum_(d.planned, "auto") : ""}</td>`).join("");
  const pctCells = report.days.map((d) => {
    if (!d.hasData) return `<td></td>`;
    const cls = slaughterEfficiencyColorClass_(d.pct);
    return `<td class="${cls}">${d.pct.toFixed(2)}%</td>`;
  }).join("");

  return `
    <div class="kpi-table-scroll">
      <table class="report-table kpi-dressed-yield-table">
        <tbody>
          <tr><td class="row-label">Date</td>${dateCells}</tr>
          <tr><td class="row-label">Planned birds</td>${plannedCells}</tr>
          <tr><td class="row-label">Actual birds</td>${actualCells}</tr>
          <tr><td class="row-label">Efficiency %</td>${pctCells}</tr>
        </tbody>
      </table>
    </div>
  `;
}

function renderBirdInputSummaryCards_(summary) {
  const cards = summary.map((s) => `
    <div class="kpi-card kpi-card-${s.key}">
      <div class="kpi-card-label">${s.label}</div>
      <div class="kpi-card-range">${s.range}</div>
      <div class="kpi-card-bottom-row">
        <span class="kpi-card-count">${s.count} <span class="kpi-card-days">days</span></span>
        <span class="kpi-card-pct">${s.pct}%</span>
      </div>
    </div>`).join("");

  return `<div class="kpi-cards-wrap">${cards}</div>`;
}

let kpi03ChartInstance_ = null;

const birdInputBandFill_ = {
  id: "birdInputBandFill",
  beforeDatasetsDraw(chart) {
    const { ctx, chartArea, scales } = chart;
    if (!chartArea) return;
    const yScale = scales.y;
    const std = KPI_BIRD_INPUT_STANDARD_;

    const yGreen = yScale.getPixelForValue(std);
    const yYellow = yScale.getPixelForValue(std - 10);
    const yOrange = yScale.getPixelForValue(std - 20);

    ctx.save();
    ctx.fillStyle = "rgba(76, 175, 80, 0.35)";
    ctx.fillRect(chartArea.left, chartArea.top, chartArea.right - chartArea.left, yGreen - chartArea.top);
    ctx.fillStyle = "rgba(255, 213, 79, 0.4)";
    ctx.fillRect(chartArea.left, yGreen, chartArea.right - chartArea.left, yYellow - yGreen);
    ctx.fillStyle = "rgba(255, 152, 0, 0.35)";
    ctx.fillRect(chartArea.left, yYellow, chartArea.right - chartArea.left, yOrange - yYellow);
    ctx.fillStyle = "rgba(244, 67, 54, 0.3)";
    ctx.fillRect(chartArea.left, yOrange, chartArea.right - chartArea.left, chartArea.bottom - yOrange);
    ctx.restore();
  },
};

function renderBirdInputChart_(report) {
  const withData = report.days.filter((d) => d.hasData);

  const labels = withData.map((d) => String(d.day).padStart(2, "0"));
  const actualValues = withData.map((d) => d.pct);
  const standardValues = withData.map(() => KPI_BIRD_INPUT_STANDARD_);

  if (kpi03ChartInstance_) kpi03ChartInstance_.destroy();

  const ctx = document.getElementById("kpi03Chart").getContext("2d");
  kpi03ChartInstance_ = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Bird Input Efficiency %",
          data: actualValues,
          borderColor: "#2c4a7c",
          backgroundColor: "transparent",
          borderWidth: 2.5,
          tension: 0.35,
          fill: false,
          pointRadius: 3,
          pointBackgroundColor: "#2c4a7c",
        },
        {
          label: `Standard (${KPI_BIRD_INPUT_STANDARD_}%)`,
          data: standardValues,
          borderColor: "#c0564a",
          borderWidth: 2,
          borderDash: [6, 4],
          tension: 0,
          fill: false,
          pointRadius: 0,
        },
      ],
    },
    plugins: [birdInputBandFill_],
    options: {
      responsive: true,
      interaction: { mode: "index", intersect: false },
      animation: {
        duration: 1200,
        easing: "easeOutQuart",
        x: { type: "number", easing: "linear", duration: 1200, from: NaN, delay(ctx) {
          if (ctx.type !== "data" || ctx.xStarted) return 0;
          ctx.xStarted = true;
          return ctx.index * 40;
        }},
      },
      scales: {
        y: { beginAtZero: true, title: { display: true, text: "Efficiency %" } },
        x: { title: { display: true, text: "Date" } },
      },
      plugins: {
        title: {
          display: true,
          text: "Bird Input Efficiency % Trend",
          font: { size: 16, weight: "bold" },
          color: "#14213D",
          padding: { top: 4, bottom: 12 },
        },
        legend: { position: "top" },
        tooltip: {
          mode: "index",
          intersect: false,
          callbacks: {
            afterBody(tooltipItems) {
              const actual = tooltipItems.find((t) => t.dataset.label === "Bird Input Efficiency %");
              const standard = tooltipItems.find((t) => t.dataset.label.startsWith("Standard"));
              if (!actual || !standard) return "";
              const gap = actual.parsed.y - standard.parsed.y;
              const sign = gap >= 0 ? "+" : "";
              return `Gap: ${sign}${gap.toFixed(2)}%`;
            },
          },
        },
      },
    },
  });
}

function syncKpi03ChartWidthToTable_() {
  const table = document.querySelector("#view-kpi-03 .kpi-dressed-yield-table");
  const chartPanel = document.querySelector("#view-kpi-03 .kpi-chart-panel");
  if (!table || !chartPanel) return;
  requestAnimationFrame(() => {
    const tableWidth = table.getBoundingClientRect().width;
    chartPanel.style.maxWidth = `${tableWidth}px`;
  });
}

// ---- Good Days % trend ----
let kpi03GoodDaysChartInstance_ = null;
let kpi03GoodDaysView_ = "weekly";

function computeKpi03GoodDaysBuckets_(yearDays, viewMode) {
  const withData = yearDays.filter((r) => r.hasData);

  if (viewMode === "monthly") {
    const buckets = {};
    for (let m = 1; m <= 12; m++) buckets[m] = { total: 0, good: 0 };
    withData.forEach((r) => {
      buckets[r.month].total += 1;
      if (slaughterEfficiencyColorClass_(r.pct) === "kpi-green") buckets[r.month].good += 1;
    });
    return Object.keys(buckets).map(Number).sort((a, b) => a - b).map((m) => {
      const b = buckets[m];
      const pct = b.total > 0 ? (b.good / b.total) * 100 : 0;
      return { label: MONTH_SHORT_NAMES_[m - 1], pct, total: b.total, good: b.good };
    });
  }

  const buckets = {};
  withData.forEach((r) => {
    const weekNum = Math.ceil(r.dayOfYear / 7);
    if (!buckets[weekNum]) buckets[weekNum] = { total: 0, good: 0 };
    buckets[weekNum].total += 1;
    if (slaughterEfficiencyColorClass_(r.pct) === "kpi-green") buckets[weekNum].good += 1;
  });
  return Object.keys(buckets).map(Number).sort((a, b) => a - b).map((wk) => {
    const b = buckets[wk];
    const pct = b.total > 0 ? (b.good / b.total) * 100 : 0;
    return { label: `W${wk}`, pct, total: b.total, good: b.good };
  });
}

function renderKpi03GoodDaysChart_(yearDays) {
  const buckets = computeKpi03GoodDaysBuckets_(yearDays, kpi03GoodDaysView_);
  const labels = buckets.map((b) => b.label);
  const values = buckets.map((b) => b.pct);

  if (kpi03GoodDaysChartInstance_) kpi03GoodDaysChartInstance_.destroy();

  const ctx = document.getElementById("kpi03GoodDaysChart").getContext("2d");
  kpi03GoodDaysChartInstance_ = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [{
        label: "Good Days %",
        data: values,
        borderColor: "#0da23a",
        backgroundColor: "#b3d5b5",
        borderWidth: 2.5,
        tension: 0.35,
        fill: true,
        pointRadius: 4,
        pointBackgroundColor: "#2d6a6a",
      }],
    },
    options: {
      responsive: true,
      animation: { duration: 900, easing: "easeOutQuart" },
      scales: {
        y: { beginAtZero: true, max: 100, title: { display: true, text: "Good Days %" } },
        x: { title: { display: true, text: kpi03GoodDaysView_ === "monthly" ? "Month" : "Week" } },
      },
      plugins: {
        title: {
          display: true,
          text: kpi03GoodDaysView_ === "monthly" ? "Good Days % — Monthly" : "Good Days % — Weekly",
          font: { size: 15, weight: "bold" }, color: "#14213D", padding: { top: 4, bottom: 10 },
        },
        legend: { display: false },
        tooltip: { callbacks: { afterLabel(item) { const b = buckets[item.dataIndex]; return `${b.good} of ${b.total} days good`; } } },
      },
    },
  });
}

function setupKpi03GoodDaysToggle_() {
  const weeklyBtn = document.getElementById("kpi03ViewWeekly");
  const monthlyBtn = document.getElementById("kpi03ViewMonthly");
  if (!weeklyBtn || !monthlyBtn) return;

  weeklyBtn.onclick = () => {
    kpi03GoodDaysView_ = "weekly";
    weeklyBtn.classList.add("active"); monthlyBtn.classList.remove("active");
    renderKpi03GoodDaysChart_(window.currentKpi03YearDays_ || []);
  };
  monthlyBtn.onclick = () => {
    kpi03GoodDaysView_ = "monthly";
    monthlyBtn.classList.add("active"); weeklyBtn.classList.remove("active");
    renderKpi03GoodDaysChart_(window.currentKpi03YearDays_ || []);
  };
}

// ---- Caution/Warning/Critical status trend ----
let kpi03StatusChartInstance_ = null;
let kpi03StatusView_ = "weekly";

function computeKpi03StatusSeries_(yearDays, viewMode) {
  const withData = yearDays.filter((r) => r.hasData);
  const classify = (r) => slaughterEfficiencyColorClass_(r.pct);

  if (viewMode === "monthly") {
    const buckets = {};
    for (let m = 1; m <= 12; m++) buckets[m] = { total: 0, yellow: 0, orange: 0, red: 0 };
    withData.forEach((r) => {
      buckets[r.month].total += 1;
      const cls = classify(r);
      if (cls === "kpi-yellow") buckets[r.month].yellow += 1;
      else if (cls === "kpi-orange") buckets[r.month].orange += 1;
      else if (cls === "kpi-red") buckets[r.month].red += 1;
    });
    return Object.keys(buckets).map(Number).sort((a, b) => a - b).map((m) => {
      const b = buckets[m];
      const pct = (n) => (b.total > 0 ? (n / b.total) * 100 : 0);
      return { label: MONTH_SHORT_NAMES_[m - 1], total: b.total, caution: pct(b.yellow), warning: pct(b.orange), critical: pct(b.red) };
    });
  }

  const buckets = {};
  withData.forEach((r) => {
    const weekNum = Math.ceil(r.dayOfYear / 7);
    if (!buckets[weekNum]) buckets[weekNum] = { total: 0, yellow: 0, orange: 0, red: 0 };
    buckets[weekNum].total += 1;
    const cls = classify(r);
    if (cls === "kpi-yellow") buckets[weekNum].yellow += 1;
    else if (cls === "kpi-orange") buckets[weekNum].orange += 1;
    else if (cls === "kpi-red") buckets[weekNum].red += 1;
  });
  return Object.keys(buckets).map(Number).sort((a, b) => a - b).map((wk) => {
    const b = buckets[wk];
    const pct = (n) => (b.total > 0 ? (n / b.total) * 100 : 0);
    return { label: `W${wk}`, total: b.total, caution: pct(b.yellow), warning: pct(b.orange), critical: pct(b.red) };
  });
}

function renderKpi03StatusChart_(yearDays) {
  const buckets = computeKpi03StatusSeries_(yearDays, kpi03StatusView_);
  const labels = buckets.map((b) => b.label);

  if (kpi03StatusChartInstance_) kpi03StatusChartInstance_.destroy();

  const ctx = document.getElementById("kpi03StatusChart").getContext("2d");
  kpi03StatusChartInstance_ = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        { label: "Caution %", data: buckets.map((b) => b.caution), borderColor: "#d4a017", backgroundColor: "transparent", borderWidth: 2.5, tension: 0.35, fill: false, pointRadius: 3, pointBackgroundColor: "#d4a017" },
        { label: "Warning %", data: buckets.map((b) => b.warning), borderColor: "#e07b00", backgroundColor: "transparent", borderWidth: 2.5, tension: 0.35, fill: false, pointRadius: 3, pointBackgroundColor: "#e07b00" },
        { label: "Critical %", data: buckets.map((b) => b.critical), borderColor: "#c0392b", backgroundColor: "transparent", borderWidth: 2.5, tension: 0.35, fill: false, pointRadius: 3, pointBackgroundColor: "#c0392b" },
      ],
    },
    options: {
      responsive: true,
      interaction: { mode: "index", intersect: false },
      animation: { duration: 900, easing: "easeOutQuart" },
      scales: {
        y: { beginAtZero: true, max: 100, title: { display: true, text: "% of Days" } },
        x: { title: { display: true, text: kpi03StatusView_ === "monthly" ? "Month" : "Week" } },
      },
      plugins: {
        title: {
          display: true,
          text: `Caution / Warning / Critical Days % — ${kpi03StatusView_ === "monthly" ? "Monthly" : "Weekly"}`,
          font: { size: 15, weight: "bold" }, color: "#14213D", padding: { top: 4, bottom: 10 },
        },
        legend: { position: "top" },
        tooltip: { mode: "index", intersect: false },
      },
    },
  });
}

function setupKpi03StatusToggle_() {
  const weeklyBtn = document.getElementById("kpi03StatusViewWeekly");
  const monthlyBtn = document.getElementById("kpi03StatusViewMonthly");
  if (!weeklyBtn || !monthlyBtn) return;

  weeklyBtn.onclick = () => {
    kpi03StatusView_ = "weekly";
    weeklyBtn.classList.add("active"); monthlyBtn.classList.remove("active");
    renderKpi03StatusChart_(window.currentKpi03YearDays_ || []);
  };
  monthlyBtn.onclick = () => {
    kpi03StatusView_ = "monthly";
    monthlyBtn.classList.add("active"); weeklyBtn.classList.remove("active");
    renderKpi03StatusChart_(window.currentKpi03YearDays_ || []);
  };
}

// ---- Main render orchestrator ----
async function renderBirdInputEfficiencyKpi() {
  const year = document.getElementById("kpi03Year").value;
  const month = document.getElementById("kpi03Month").value;
  const panel = document.getElementById("kpi03Panel");
  panel.innerHTML = `<p class="hint">Loading…</p>`;

  try {
    // ✅ buildSlaughterEfficiencyKpi වෙනුවට buildSlaughterEfficiencyKpi භාවිතා කරන්න
    const report = await buildSlaughterEfficiencyKpi(year, month);

    const workingDays = countWorkingDaysInMonth_(Number(year), Number(month));
    const std = KPI_BIRD_INPUT_STANDARD_;
    updateKpiHeader("kpi-03", std, workingDays);

    panel.innerHTML =
      renderBirdInputSummaryCards_(report.summary) +
      `<div class="panel kpi-chart-panel"><div class="panel-body"><canvas id="kpi03Chart" height="90"></canvas></div></div>` +
      renderBirdInputTable_(report) +
      `<div class="panel kpi-chart-panel" style="margin-top:16px;">
        <div class="chart-toolbar" style="padding:10px 14px 0;">
          <div class="kpi-view-toggle">
            <button type="button" id="kpi03ViewWeekly" class="kpi-toggle-btn active">Weekly</button>
            <button type="button" id="kpi03ViewMonthly" class="kpi-toggle-btn">Monthly</button>
          </div>
        </div>
        <div class="panel-body"><canvas id="kpi03GoodDaysChart" height="50"></canvas></div>
      </div>` +
      `<div class="panel kpi-chart-panel" style="margin-top:16px;">
        <div class="chart-toolbar" style="padding:10px 14px 0;">
          <div class="kpi-view-toggle">
            <button type="button" id="kpi03StatusViewWeekly" class="kpi-toggle-btn active">Weekly</button>
            <button type="button" id="kpi03StatusViewMonthly" class="kpi-toggle-btn">Monthly</button>
          </div>
        </div>
        <div class="panel-body"><canvas id="kpi03StatusChart" height="50"></canvas></div>
      </div>`;

    renderBirdInputChart_(report);
    syncKpi03ChartWidthToTable_();

    kpi03GoodDaysView_ = "weekly";
    setupKpi03GoodDaysToggle_();

    // ✅ buildBirdInputYearData_ වෙනුවට buildSlaughterEfficiencyYearData_ භාවිතා කරන්න
    const yearDays = await buildSlaughterEfficiencyYearData_(year);
    window.currentKpi03YearDays_ = yearDays;
    renderKpi03GoodDaysChart_(yearDays);

    kpi03StatusView_ = "weekly";
    setupKpi03StatusToggle_();
    renderKpi03StatusChart_(yearDays);
  } catch (err) {
    panel.innerHTML = `<p class="hint error">Failed to load report: ${err.message}</p>`;
  }
}

// ===================================================================
// ALL DIVISION CONSUMABLE REPORTS
// ===================================================================

let consumableActiveDivision_ = "lb";

function initAllDivisionConsumableReport() {
  const monthSelect = document.getElementById("consumableMonth");
  const yearSelect = document.getElementById("consumableYear");

  if (monthSelect.dataset.bound) return;
  monthSelect.dataset.bound = "true";

  const nowYear = new Date().getFullYear();
  for (let y = nowYear - 3; y <= nowYear + 1; y++) {
    const opt = document.createElement("option");
    opt.value = y;
    opt.textContent = y;
    if (y === nowYear) opt.selected = true;
    yearSelect.appendChild(opt);
  }
  monthSelect.value = new Date().getMonth() + 1;

  monthSelect.addEventListener("change", renderConsumableReport);
  yearSelect.addEventListener("change", renderConsumableReport);

  document.getElementById("consumableCsvBtn").addEventListener("click", () => {
    if (window.currentConsumableReport) downloadConsumableCsv_(window.currentConsumableReport);
  });
  document.getElementById("consumablePdfBtn").addEventListener("click", () => {
    const r = window.currentConsumableReport;
    printWithFilename_(r ? `${r.label.replace(/\s+/g, "_")}_Consumable_${MONTH_NAMES_[r.month - 1]}_${r.year}` : "Consumable_Report");
  });

  renderConsumableButtonsPanel_();
  renderConsumableReport();
}

function renderConsumableButtonsPanel_() {
  const divisions = [
    ["lb", "Live Bird & Slaughtering"],
    ["ev", "EV"],
    ["packing1", "Packing 01"],
    ["packing2", "Packing 02"],
    ["easy", "Easy"],
    ["fbp", "Final bulk packing"],
  ];

  const wrap = document.getElementById("consumableButtonsWrap");
  wrap.innerHTML = `<div class="division-btn-wrap">
    ${divisions.map(([key, label]) =>
      `<button type="button" class="division-btn ${key === consumableActiveDivision_ ? "active" : ""}" data-division="${key}">${label}</button>`
    ).join("")}
  </div>`;

  wrap.querySelectorAll(".division-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      consumableActiveDivision_ = btn.dataset.division;
      wrap.querySelectorAll(".division-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      renderConsumableReport();
    });
  });
}

async function renderConsumableReport() {
  const year = document.getElementById("consumableYear").value;
  const month = document.getElementById("consumableMonth").value;
  const panel = document.getElementById("consumablePanel");
  panel.innerHTML = `<p class="hint">Loading…</p>`;

  try {
    const report = await buildConsumableReport_(consumableActiveDivision_, year, month);
    window.currentConsumableReport = report;
    document.getElementById("consumablePrintMonth").textContent = `${MONTH_NAMES_[month - 1]} ${year}`;
    document.getElementById("consumablePrintDivision").textContent = report.label;
    panel.innerHTML = renderConsumableTable_(report);
  } catch (err) {
    panel.innerHTML = `<p class="hint error">Failed to load report: ${err.message}</p>`;
  }
}

function renderConsumableTable_(report) {
  const dayHeaders = Array.from({ length: report.daysInMonth }, (_, i) => {
    const day = i + 1;
    const dateStr = `${report.year}-${String(report.month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return `<th class="${getDayOfWeekClass_(dateStr)}">${String(day).padStart(2, "0")}</th>`;
  }).join("");

  const rows = report.items.map((item) => {
    const cells = item.values.map((v, i) => {
      const day = i + 1;
      const dateStr = `${report.year}-${String(report.month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      return `<td class="${getDayOfWeekClass_(dateStr)}">${formatNum_(v, "auto")}</td>`;
    }).join("");
    return `<tr><td class="row-label">${item.itemName}</td>${cells}</tr>`;
  }).join("");

  const totalCells = report.columnTotals.map((v) => `<td>${formatNum_(v, "auto")}</td>`).join("");

  return `
    <table class="report-table consumable-table">
      <thead>
        <tr><th class="row-label">Material Name</th>${dayHeaders}</tr>
      </thead>
      <tbody>${rows}</tbody>
      <tfoot>
        <tr class="bold-row"><td class="row-label">Total &gt;&gt;&gt;</td>${totalCells}</tr>
      </tfoot>
    </table>
  `;
}

function downloadConsumableCsv_(report) {
  const dayHeaders = Array.from({ length: report.daysInMonth }, (_, i) => String(i + 1).padStart(2, "0"));
  let csv = ["Material Name", ...dayHeaders].map((v) => `"${v}"`).join(",") + "\n";

  report.items.forEach((item) => {
    csv += [item.itemName, ...item.values].map((v) => `"${v}"`).join(",") + "\n";
  });
  csv += ["Total", ...report.columnTotals].map((v) => `"${v}"`).join(",") + "\n";

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${report.label.replace(/\s+/g, "_")}_Consumable_${report.year}-${String(report.month).padStart(2, "0")}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/* js/dashboard-new.js */

// ============================================================
// KPI DASHBOARD - නව Version එක
// KPIs 6ක් සඳහා වෙනම charts 6ක්, colors, animations
// ============================================================

// ========== KPI Configuration ==========
const KPI_CONFIG_NEW = {
  "kpi-01": {
    id: "kpi-01",
    label: "Bay Mortality",
    shortLabel: "Bay Mortality",
    icon: "🐦",
    unit: "%",
    standard: 0.05,
    isLowerBetter: true,
    color: "#E74C3C",
    bgColor: "rgba(231, 76, 60, 0.12)",
    borderColor: "#E74C3C",
    gradientFrom: "rgba(231, 76, 60, 0.20)",
    gradientTo: "rgba(231, 76, 60, 0.02)",
    description: "Mortality rate during bay holding"
  },
  "kpi-02": {
    id: "kpi-02",
    label: "Birds Unloading",
    shortLabel: "Live Birds Unloading",
    icon: "🚚",
    unit: "%",
    standard: 95,
    isLowerBetter: false,
    color: "#3498DB",
    bgColor: "rgba(52, 152, 219, 0.12)",
    borderColor: "#3498DB",
    gradientFrom: "rgba(52, 152, 219, 0.20)",
    gradientTo: "rgba(52, 152, 219, 0.02)",
    description: "Birds unloading efficiency"
  },
  "kpi-03": {
    id: "kpi-03",
    label: "Slaughter Efficiency",
    shortLabel: "Slaughter Efficiency",
    icon: "🔪",
    unit: "%",
    standard: 95,
    isLowerBetter: false,
    color: "#2ECC71",
    bgColor: "rgba(46, 204, 113, 0.12)",
    borderColor: "#2ECC71",
    gradientFrom: "rgba(46, 204, 113, 0.20)",
    gradientTo: "rgba(46, 204, 113, 0.02)",
    description: "Slaughter line efficiency"
  },
  "kpi-04": {
    id: "kpi-04",
    label: "Packing Efficiency",
    shortLabel: "Packing Efficiency",
    icon: "📦",
    unit: "%",
    standard: 95,
    isLowerBetter: false,
    color: "#9B59B6",
    bgColor: "rgba(155, 89, 182, 0.12)",
    borderColor: "#9B59B6",
    gradientFrom: "rgba(155, 89, 182, 0.20)",
    gradientTo: "rgba(155, 89, 182, 0.02)",
    description: "Packing line efficiency"
  },
  "kpi-05": {
    id: "kpi-05",
    label: "Dressed Yield",
    shortLabel: "Dressed Yield",
    icon: "🍗",
    unit: "%",
    standard: 79,
    isLowerBetter: false,
    color: "#F39C12",
    bgColor: "rgba(243, 156, 18, 0.12)",
    borderColor: "#F39C12",
    gradientFrom: "rgba(243, 156, 18, 0.20)",
    gradientTo: "rgba(243, 156, 18, 0.02)",
    description: "Dressed yield percentage"
  },
  "kpi-06": {
    id: "kpi-06",
    label: "Chill Loss",
    shortLabel: "Chill Loss",
    icon: "❄️",
    unit: "%",
    standard: 2,
    isLowerBetter: true,
    color: "#1ABC9C",
    bgColor: "rgba(26, 188, 156, 0.12)",
    borderColor: "#1ABC9C",
    gradientFrom: "rgba(26, 188, 156, 0.20)",
    gradientTo: "rgba(26, 188, 156, 0.02)",
    description: "Weight loss during chill process"
  }
};

// ========== State ==========
let dashNewState = {
  year: new Date().getFullYear(),
  month: new Date().getMonth() + 1,
  viewMode: "quarterly", // "quarterly" | "monthly" | "weekly"
  data: {},
  chartInstances: {}
};

// ========== Helper Functions ==========
function getKpiStatusNew(value, config) {
  if (value === null || value === undefined || !isFinite(value)) {
    return { status: "no-data", label: "No Data", color: "#9e9e9e" };
  }
  
  const std = config.standard;
  const isLowerBetter = config.isLowerBetter || false;
  
  if (isLowerBetter) {
    if (value <= std) return { status: "good", label: "Good", color: "#2e7d32" };
    if (value <= std * 1.5) return { status: "caution", label: "Caution", color: "#f57f17" };
    if (value <= std * 2) return { status: "warning", label: "Warning", color: "#e65100" };
    return { status: "critical", label: "Critical", color: "#c62828" };
  } else {
    if (value >= std) return { status: "good", label: "Good", color: "#2e7d32" };
    if (value >= std * 0.85) return { status: "caution", label: "Caution", color: "#f57f17" };
    if (value >= std * 0.7) return { status: "warning", label: "Warning", color: "#e65100" };
    return { status: "critical", label: "Critical", color: "#c62828" };
  }
}

function getViewLabel(viewMode) {
  const map = {
    "quarterly": "Quarterly",
    "monthly": "Monthly",
    "weekly": "Weekly"
  };
  return map[viewMode] || "Monthly";
}

// ========== Data Extraction ==========
function extractKpiDataNew(report, kpiKey) {
  if (!report || typeof report !== 'object') {
    return { values: [], dates: [], hasData: false };
  }

  // KPI-01
  if (kpiKey === "kpi-01" && report.days) {
    const valid = report.days.filter(d => d && d.hasData === true);
    return {
      values: valid.map(d => (d.pct !== undefined && d.pct !== null) ? Number(d.pct) : null).filter(v => v !== null),
      dates: valid.map(d => d.day || 0),
      hasData: valid.length > 0
    };
  }
  
  // KPI-02 - Coming soon
  if (kpiKey === "kpi-02") {
    return { values: [], dates: [], hasData: false };
  }
  
  // KPI-03
  if (kpiKey === "kpi-03" && report.days) {
    const valid = report.days.filter(d => d && d.hasData === true);
    return {
      values: valid.map(d => (d.pct !== undefined && d.pct !== null) ? Number(d.pct) : null).filter(v => v !== null),
      dates: valid.map(d => d.day || 0),
      hasData: valid.length > 0
    };
  }
  
  // KPI-04
  if (kpiKey === "kpi-04" && report.days) {
    const valid = report.days.filter(d => d && d.hasData === true);
    return {
      values: valid.map(d => (d.pct !== undefined && d.pct !== null) ? Number(d.pct) : null).filter(v => v !== null),
      dates: valid.map(d => d.day || 0),
      hasData: valid.length > 0
    };
  }
  
  // KPI-05
  if (kpiKey === "kpi-05" && report.dateRows) {
    const valid = report.dateRows.filter(d => d && d.hasData === true);
    return {
      values: valid.map(d => (d.yieldPct !== undefined && d.yieldPct !== null) ? Number(d.yieldPct) : null).filter(v => v !== null),
      dates: valid.map(d => d.day || 0),
      hasData: valid.length > 0
    };
  }
  
  // KPI-06
  if (kpiKey === "kpi-06" && report.dateRows) {
    const valid = report.dateRows.filter(d => d && d.hasData === true);
    return {
      values: valid.map(d => (d.chillLossPct !== undefined && d.chillLossPct !== null) ? Number(d.chillLossPct) : null).filter(v => v !== null),
      dates: valid.map(d => d.day || 0),
      hasData: valid.length > 0
    };
  }
  
  return { values: [], dates: [], hasData: false };
}

// ========== Fetch All KPI Data ==========
async function fetchAllKpiDataNew(year, month) {
  const results = {};
  const kpiBuilders = {
    "kpi-01": buildBayMortalityKpi,
    "kpi-03": buildSlaughterEfficiencyKpi,
    "kpi-04": buildPackingEfficiencyKpi,
    "kpi-05": buildDressedYieldKpi,
    "kpi-06": buildChillLossKpi,
    // "kpi-02": buildUnloadingKpi, // Coming soon
  };

  for (const [key, builder] of Object.entries(kpiBuilders)) {
    try {
      results[key] = await builder(year, month);
    } catch (err) {
      console.warn(`Failed to load ${key}:`, err);
      results[key] = null;
    }
  }
  return results;
}

// ===================================================================
// Fetch full-year data per KPI (for accurate Quarterly/Monthly/Weekly charts)
// Reuses the *YearData_ builders already built for each KPI's Status trend
// ===================================================================
const KPI_PCT_FIELD_ = {
  "kpi-01": "pct",
  "kpi-03": "pct",
  "kpi-04": "pct",
  "kpi-05": "yieldPct",
  "kpi-06": "chillLossPct",
};

async function fetchAllKpiYearDataNew(year) {
  const results = {};
  const yearBuilders = {
    "kpi-01": buildBayMortalityYearData_,
    "kpi-03": buildSlaughterEfficiencyYearData_,
    "kpi-04": buildPackingEfficiencyYearData_,
    "kpi-05": buildDressedYieldYearData_,
    "kpi-06": buildChillLossYearData_,
  };

  for (const [key, builder] of Object.entries(yearBuilders)) {
    try {
      results[key] = await builder(year);
    } catch (err) {
      console.warn(`Failed to load year data for ${key}:`, err);
      results[key] = [];
    }
  }
  return results;
}

// ========== Aggregate Data by View Mode ==========
// Fixed month->quarter mapping (real calendar quarters, not day-of-year thresholds)
// Fixed month->quarter mapping (real calendar quarters, not day-of-year thresholds)
const QUARTER_MONTHS_ = { Q1: [1, 2, 3], Q2: [4, 5, 6], Q3: [7, 8, 9], Q4: [10, 11, 12] };

function aggregateYearByViewMode_(yearDays, pctField, viewMode) {
  const withData = yearDays.filter((r) => r.hasData && r[pctField] !== undefined && r[pctField] !== null);

  if (viewMode === "monthly") {
    // Always all 12 months on the x-axis — Jan through Dec
    const buckets = {};
    for (let m = 1; m <= 12; m++) buckets[m] = { sum: 0, count: 0 };
    withData.forEach((r) => {
      buckets[r.month].sum += r[pctField];
      buckets[r.month].count += 1;
    });
    const labels = MONTH_SHORT_NAMES_.slice();
    const values = labels.map((_, i) => {
      const b = buckets[i + 1];
      return b.count > 0 ? b.sum / b.count : 0;   // 0 instead of a gap when no data
    });
    return { labels, values, hasData: true };
  }

  if (viewMode === "quarterly") {
    // Always all 4 quarters on the x-axis — Q1 through Q4
    const qOrder = ["Q1", "Q2", "Q3", "Q4"];
    const buckets = { Q1: { sum: 0, count: 0 }, Q2: { sum: 0, count: 0 }, Q3: { sum: 0, count: 0 }, Q4: { sum: 0, count: 0 } };
    withData.forEach((r) => {
      const q = qOrder.find((qk) => QUARTER_MONTHS_[qk].includes(r.month));
      if (q) { buckets[q].sum += r[pctField]; buckets[q].count += 1; }
    });
    const values = qOrder.map((q) => (buckets[q].count > 0 ? buckets[q].sum / buckets[q].count : 0));
    return { labels: qOrder, values, hasData: true };
  }

  // weekly — only show weeks that actually have data for the selected year
  const buckets = {};
  withData.forEach((r) => {
    const wk = Math.min(52, Math.ceil(r.dayOfYear / 7));
    if (!buckets[wk]) buckets[wk] = { sum: 0, count: 0 };
    buckets[wk].sum += r[pctField];
    buckets[wk].count += 1;
  });
  const weekNums = Object.keys(buckets).map(Number).sort((a, b) => a - b);
  const labels = weekNums.map((w) => `W${String(w).padStart(2, "0")}`);
  const values = weekNums.map((w) => buckets[w].sum / buckets[w].count);
  return { labels, values, hasData: labels.length > 0 };
}

// ========== Render KPI Cards ==========
function renderKpiCardsNew(data) {
  const container = document.getElementById("dashNewCards");
  if (!container) return;
  
  const keys = ["kpi-01", "kpi-02", "kpi-03", "kpi-04", "kpi-05", "kpi-06"];
  let html = "";
  
  keys.forEach(key => {
    const config = KPI_CONFIG_NEW[key];
    const report = data[key];
    const extracted = extractKpiDataNew(report, key);
    
    let avgValue = null;
    let status = { status: "no-data", label: "No Data", color: "#9e9e9e" };
    let trend = { direction: "flat", value: 0 };
    let displayValue = "—";
    
    if (extracted.hasData && extracted.values.length > 0) {
      avgValue = extracted.values.reduce((a, b) => a + b, 0) / extracted.values.length;
      status = getKpiStatusNew(avgValue, config);
      displayValue = avgValue.toFixed(2);
      
      // Calculate trend (last 7 vs previous 7)
      const vals = extracted.values;
      if (vals.length >= 7) {
        const recent = vals.slice(-7).reduce((a, b) => a + b, 0) / 7;
        const prev = vals.slice(-14, -7).reduce((a, b) => a + b, 0) / 7;
        if (prev > 0) {
          const diff = ((recent - prev) / prev) * 100;
          trend.direction = diff > 0 ? "up" : diff < 0 ? "down" : "flat";
          trend.value = Math.abs(diff);
        }
      }
    }
    
    const barWidth = avgValue !== null ? Math.min(100, (avgValue / config.standard) * 100) : 0;
    const trendDisplay = trend.direction === "up" ? `▲ ${trend.value.toFixed(1)}%` :
                        trend.direction === "down" ? `▼ ${trend.value.toFixed(1)}%` : "—";
    const trendClass = trend.direction === "up" ? "up" : trend.direction === "down" ? "down" : "";
    
    html += `
      <div class="dash-kpi-card" style="border-left: 4px solid ${config.color}">
        <div class="card-icon">${config.icon}</div>
        <div class="card-label">${config.shortLabel}</div>
        <div class="card-value">
          ${displayValue}<span class="unit">${config.unit}</span>
        </div>
        <div>
          <span class="card-status ${status.status}">${status.label}</span>
          <span class="card-trend ${trendClass}">${trendDisplay}</span>
        </div>
        <div class="card-bar">
          <div class="card-bar-fill" style="width: ${barWidth}%; background: ${config.color}"></div>
        </div>
      </div>
    `;
  });
  
  container.innerHTML = html;
}

// ========== Render Individual Chart ==========
function renderSingleChart(kpiKey, aggregated, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  // Clear previous chart
  container.innerHTML = `<canvas id="chart-${kpiKey}"></canvas>`;
  
  const canvas = document.getElementById(`chart-${kpiKey}`);
  if (!canvas) return;
  
  const ctx = canvas.getContext("2d");
  const config = KPI_CONFIG_NEW[kpiKey];
  
  // Destroy previous instance
  if (dashNewState.chartInstances[kpiKey]) {
    dashNewState.chartInstances[kpiKey].destroy();
  }
  
  const labels = aggregated.labels || [];
  const values = aggregated.values || [];
  const hasData = aggregated.hasData && values.length > 0;
  
  // Show no-data message
  if (!hasData) {
    container.innerHTML = `
      <div class="dash-no-data">
        <span class="emoji">📊</span>
        No data available
      </div>
    `;
    return;
  }
  
  // Create gradient
  const gradient = ctx.createLinearGradient(0, 0, 0, 160);
  gradient.addColorStop(0, config.gradientFrom);
  gradient.addColorStop(1, config.gradientTo);
  
  const chart = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [{
        label: config.shortLabel,
        data: values,
        borderColor: config.color,
        backgroundColor: gradient,
        borderWidth: 2.5,
        tension: 0.35,
        fill: true,
        pointRadius: 3,
        pointBackgroundColor: config.color,
        pointBorderColor: "white",
        pointBorderWidth: 1.5,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: config.color,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: "index",
        intersect: false
      },
      animation: {
        duration: 1200,
        easing: "easeOutQuart",
        x: {
          type: "number",
          easing: "linear",
          duration: 1000,
          from: NaN,
          delay(ctx) {
            if (ctx.type !== "data" || ctx.xStarted) return 0;
            ctx.xStarted = true;
            return ctx.index * 30;
          }
        }
      },
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          backgroundColor: "rgba(20, 33, 61, 0.9)",
          titleColor: "white",
          bodyColor: "white",
          borderColor: config.color,
          borderWidth: 2,
          padding: 10,
          cornerRadius: 8,
          callbacks: {
            label: function(context) {
              const val = context.parsed.y;
              return `${config.shortLabel}: ${val !== null && val !== undefined ? val.toFixed(2) : '—'}${config.unit}`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            color: "rgba(0,0,0,0.05)",
            drawBorder: false
          },
          ticks: {
            font: { size: 9 },
            maxTicksLimit: 5,
            callback: function(value) {
              return value + config.unit;
            }
          }
        },
        x: {
          grid: {
            display: false
          },
          ticks: {
            font: { size: 9 },
            maxTicksLimit: 10
          }
        }
      }
    }
  });
  
  dashNewState.chartInstances[kpiKey] = chart;
}

// ========== Render All Charts ==========
function renderAllCharts(yearData, viewMode) {
  const keys = ["kpi-01", "kpi-02", "kpi-03", "kpi-04", "kpi-05", "kpi-06"];

  keys.forEach(key => {
    // KPI-02 has no data yet
    if (key === "kpi-02") {
      const container = document.getElementById(`chart-container-${key}`);
      if (container) {
        container.innerHTML = `
          <div class="dash-no-data">
            <span class="emoji">🚧</span>
            Data Not Available
          </div>
        `;
      }
      return;
    }

    const yearDays = yearData[key] || [];
    const pctField = KPI_PCT_FIELD_[key];
    const aggregated = aggregateYearByViewMode_(yearDays, pctField, viewMode);

    renderSingleChart(key, aggregated, `chart-container-${key}`);
  });
}

// ========== Render Summary Table ==========
function renderSummaryTable(data) {
  const container = document.getElementById("dashNewSummary");
  if (!container) return;
  
  const keys = ["kpi-01", "kpi-02", "kpi-03", "kpi-04", "kpi-05", "kpi-06"];
  let html = `
    <table class="dash-summary-table">
      <thead>
        <tr>
          <th>KPI</th>
          <th>Average</th>
          <th>Min</th>
          <th>Max</th>
          <th>Status</th>
          <th>vs Standard</th>
        </tr>
      </thead>
      <tbody>
  `;
  
  keys.forEach(key => {
    const config = KPI_CONFIG_NEW[key];
    const report = data[key];
    const extracted = extractKpiDataNew(report, key);
    
    let avg = null, min = null, max = null;
    let status = { status: "no-data", label: "No Data", color: "#9e9e9e" };
    let vsStandard = "—";
    
    if (extracted.hasData && extracted.values.length > 0) {
      const vals = extracted.values;
      avg = vals.reduce((a, b) => a + b, 0) / vals.length;
      min = Math.min(...vals);
      max = Math.max(...vals);
      status = getKpiStatusNew(avg, config);
      
      const diff = avg - config.standard;
      const sign = diff > 0 ? "+" : "";
      const color = status.status === "good" ? "#2e7d32" : 
                   status.status === "caution" ? "#f57f17" :
                   status.status === "warning" ? "#e65100" : "#c62828";
      vsStandard = `<span style="color:${color};font-weight:600;">${sign}${diff.toFixed(2)}${config.unit}</span>`;
    }
    
    const avgDisplay = avg !== null ? avg.toFixed(2) : "—";
    const minDisplay = min !== null ? min.toFixed(2) : "—";
    const maxDisplay = max !== null ? max.toFixed(2) : "—";
    
    html += `
      <tr>
        <td><span style="color:${config.color}">${config.icon}</span> ${config.shortLabel}</td>
        <td><strong>${avgDisplay}${config.unit}</strong></td>
        <td>${minDisplay}${config.unit}</td>
        <td>${maxDisplay}${config.unit}</td>
        <td>
          <span class="status-dot ${status.status}"></span>
          ${status.label}
        </td>
        <td>${vsStandard}</td>
      </tr>
    `;
  });
  
  html += `
      </tbody>
    </table>
  `;
  
  container.innerHTML = html;
}

// ========== Main Render Function ==========
async function renderDashboardNew() {
  const container = document.getElementById("dashNewCards");
  if (!container) return;
  
  container.innerHTML = `
    <div class="dash-loading">
      <div class="spinner"></div>
      Loading KPI data...
    </div>
  `;
  
  try {
    const year = dashNewState.year;
    const month = dashNewState.month;
    const viewMode = dashNewState.viewMode;
    
        // Fetch month data (Cards + Summary table use this, unchanged)
    const data = await fetchAllKpiDataNew(year, month);
    dashNewState.data = data;

    // Fetch full-year data (charts need this for correct Quarterly/Monthly/Weekly buckets)
    const yearData = await fetchAllKpiYearDataNew(year);
    dashNewState.yearData = yearData;

    // Render cards
    renderKpiCardsNew(data);

    // Render charts
    renderAllCharts(yearData, viewMode);

    // Render summary
    renderSummaryTable(data);
    
  } catch (err) {
    container.innerHTML = `
      <div class="dash-no-data">
        <span class="emoji">❌</span>
        Failed to load: ${err.message}
      </div>
    `;
  }
}

// ========== Initialize Dashboard ==========
function initDashboardNew() {
  const yearSelect = document.getElementById("dashNewYear");
  const monthSelect = document.getElementById("dashNewMonth");
  const refreshBtn = document.getElementById("dashNewRefreshBtn");
  const viewBtns = document.querySelectorAll(".dash-view-btn");
  
  if (!yearSelect) return;
  if (yearSelect.dataset.bound) return;
  yearSelect.dataset.bound = "true";
  
  // Populate years
  const nowYear = new Date().getFullYear();
  for (let y = nowYear - 3; y <= nowYear + 1; y++) {
    const opt = document.createElement("option");
    opt.value = y;
    opt.textContent = y;
    if (y === nowYear) opt.selected = true;
    yearSelect.appendChild(opt);
  }
  monthSelect.value = new Date().getMonth() + 1;
  
  // Event: Year change
  yearSelect.addEventListener("change", () => {
    dashNewState.year = parseInt(yearSelect.value);
    renderDashboardNew();
  });
  
  // Event: Month change
  monthSelect.addEventListener("change", () => {
    dashNewState.month = parseInt(monthSelect.value);
    renderDashboardNew();
  });
  
  // Event: Refresh
  if (refreshBtn) {
    refreshBtn.addEventListener("click", renderDashboardNew);
  }
  
    // Event: View toggle — reuse cached year data, no need to re-fetch
  viewBtns.forEach(btn => {
    btn.addEventListener("click", function() {
      viewBtns.forEach(b => b.classList.remove("active"));
      this.classList.add("active");
      dashNewState.viewMode = this.dataset.view;
      if (dashNewState.yearData) {
        renderAllCharts(dashNewState.yearData, dashNewState.viewMode);
      } else {
        renderDashboardNew();
      }
    });
  });
  
  // Initial render
  renderDashboardNew();
}

// ========== Chart Container HTML Generator ==========
function generateChartContainers() {
  const container = document.getElementById("dashNewCharts");
  if (!container) return;
  
  const keys = [
    { id: "kpi-01", label: "Bay Mortality" },
    { id: "kpi-02", label: "Birds Unloading" },
    { id: "kpi-03", label: "Slaughter Efficiency" },
    { id: "kpi-04", label: "Packing Efficiency" },
    { id: "kpi-05", label: "Dressed Yield" },
    { id: "kpi-06", label: "Chill Loss" }
  ];
  
  let html = "";
  keys.forEach(k => {
    const config = KPI_CONFIG_NEW[k.id];
    html += `
      <div class="dash-chart-card" style="border-top: 3px solid ${config.color}">
        <div class="chart-header">
          <span class="chart-title">${config.icon} ${config.label}</span>
          <span class="chart-badge">${config.unit}</span>
        </div>
        <div class="chart-container" id="chart-container-${k.id}">
          <canvas id="chart-${k.id}"></canvas>
        </div>
      </div>
    `;
  });
  
  container.innerHTML = html;
}

// ========== DOM Ready ==========
document.addEventListener("DOMContentLoaded", function() {
  // Generate chart containers first
  generateChartContainers();
  
  // Initialize dashboard
  initDashboardNew();
});

let notificationChartInstances = {};

// ===================================================================
// Initialize each KPI notification view
// ===================================================================

function initNotifyKpi(num) {
  const config = NOTIFY_KPI_CONFIG[num];
  if (!config) return;

  const monthSelect = document.getElementById(`notifyMonth${num}`);
  const yearSelect = document.getElementById(`notifyYear${num}`);
  const panel = document.getElementById(`notifyPanel${num}`);

  if (!monthSelect || !yearSelect || !panel) return;

  if (monthSelect.dataset.bound) return;
  monthSelect.dataset.bound = "true";

  const nowYear = new Date().getFullYear();
  for (let y = nowYear - 3; y <= nowYear + 1; y++) {
    const opt = document.createElement("option");
    opt.value = y;
    opt.textContent = y;
    if (y === nowYear) opt.selected = true;
    yearSelect.appendChild(opt);
  }
  monthSelect.value = new Date().getMonth() + 1;

  monthSelect.addEventListener("change", () => renderNotifyKpi(num));
  yearSelect.addEventListener("change", () => renderNotifyKpi(num));

  renderNotifyKpi(num);
}

// ===================================================================
// Render individual KPI notification
// ===================================================================

async function renderNotifyKpi(num) {
  const config = NOTIFY_KPI_CONFIG[num];
  if (!config) return;

  const monthSelect = document.getElementById(`notifyMonth${num}`);
  const yearSelect = document.getElementById(`notifyYear${num}`);
  const panel = document.getElementById(`notifyPanel${num}`);

  if (!monthSelect || !yearSelect || !panel) return;

  const year = yearSelect.value;
  const month = monthSelect.value;
  panel.innerHTML = `<p class="hint">Loading…</p>`;

  try {
    const data = await buildNotificationData_(config.kpiKey, year, month);

    if (!data.available) {
      panel.innerHTML = `
        <p class="hint">${config.label} is not yet configured for notifications.</p>
        <p class="hint" style="font-size:0.9rem;color:#999;">Data source for this KPI is not available.</p>
      `;
      return;
    }

    // Calculate totals for summary
    const totalCaution = data.buckets.caution.length;
    const totalWarning = data.buckets.warning.length;
    const totalCritical = data.buckets.critical.length;
    const totalIssues = totalCaution + totalWarning + totalCritical;

    // 👇 SUMMARY CARDS - එකතු කරන්න
    const summaryHtml = `
      <div style="display:flex;gap:16px;margin-bottom:20px;flex-wrap:wrap;">
        <div style="background:#fff3e0;padding:12px 20px;border-radius:8px;border-left:4px solid #d4a017;flex:1;min-width:120px;">
          <div style="font-size:12px;color:#666;">Caution</div>
          <div style="font-size:24px;font-weight:700;color:#d4a017;">${totalCaution}</div>
        </div>
        <div style="background:#fff3e0;padding:12px 20px;border-radius:8px;border-left:4px solid #e07b00;flex:1;min-width:120px;">
          <div style="font-size:12px;color:#666;">Warning</div>
          <div style="font-size:24px;font-weight:700;color:#e07b00;">${totalWarning}</div>
        </div>
        <div style="background:#fff3e0;padding:12px 20px;border-radius:8px;border-left:4px solid #c0392b;flex:1;min-width:120px;">
          <div style="font-size:12px;color:#666;">Critical</div>
          <div style="font-size:24px;font-weight:700;color:#c0392b;">${totalCritical}</div>
        </div>
        <div style="background:#e8f5e9;padding:12px 20px;border-radius:8px;border-left:4px solid #4CAF50;flex:1;min-width:120px;">
          <div style="font-size:12px;color:#666;">Total Issues</div>
          <div style="font-size:24px;font-weight:700;color:#2e7d32;">${totalIssues}</div>
        </div>
      </div>
    `;

    const cautionHtml = renderNotifyStatusTable_("Caution", data.buckets.caution, "caution");
    const warningHtml = renderNotifyStatusTable_("Warning", data.buckets.warning, "warning");
    const criticalHtml = renderNotifyStatusTable_("Critical", data.buckets.critical, "critical");

    panel.innerHTML = `
      ${summaryHtml}
      ${cautionHtml}
      ${warningHtml}
      ${criticalHtml}
      <div class="panel kpi-chart-panel" style="margin-top:12px; padding: 6px 8px;">
        <div class="panel-body" style="padding: 4px 8px; height: 150px;">
          <canvas id="notifyChart_${num}"></canvas>
        </div>
      </div>
    `;

    renderNotifyChart(num, data);
    
    
  } catch (err) {
    panel.innerHTML = `<p class="hint error">Failed to load: ${err.message}</p>`;
  }
}

// ===================================================================
// Render notification status table
// ===================================================================

function renderNotifyStatusTable_(title, entries, statusKey) {
  if (entries.length === 0) {
    return `
      <div style="background:#e8f5e9;padding:8px 14px;border-radius:4px;margin:6px 0;border-left:3px solid #4CAF50;">
        <span style="font-weight:600;color:#2e7d32;font-size:13px;">✅ ${title}:</span>
        <span style="color:#555;font-size:13px;"> No days in this range.</span>
      </div>
    `;
  }

  const statusColors = {
    caution: '#d4a017',
    warning: '#e07b00',
    critical: '#c0392b'
  };

  const rows = entries.map((e) => {
    const deliveryDisplay = e.sent
      ? `<span style="color:#2e7d32;font-weight:bold;">✅ Sent</span>`
      : `<span style="color:#9e9e9e;">Pending</span>`;
    const responseDisplay = e.response
      ? escapeNotificationHtml_(e.response).replace(/\n/g, '<br>')
      : `<span style="color:#9e9e9e;">—</span>`;

    return `<tr>
      <td style="font-weight:500;text-align:center;padding:3px 4px;font-size:12px;">${formatDateDMY_(e.date)}</td>
      <td style="font-weight:600;color:${statusColors[statusKey] || '#333'};text-align:center;padding:3px 4px;font-size:12px;">${e.value.toFixed(2)}%</td>
      <td style="text-align:center;padding:3px 4px;font-size:12px;font-weight:500;">${deliveryDisplay}</td>
      <td style="padding:6px 8px;font-size:12px;line-height:1.4;white-space:normal;word-break:break-word;">${responseDisplay}</td>
    </tr>`;
  }).join("");

  return `
    <div style="margin:10px 0 4px 0;">
      <h3 style="color:${statusColors[statusKey] || '#333'};border-bottom:2px solid ${statusColors[statusKey] || '#333'};padding-bottom:3px;font-size:14px;margin:0;">
        ${title} <span style="font-size:11px;font-weight:400;color:#666;">(${entries.length})</span>
      </h3>
    </div>
    <table style="width:100%;border-collapse:collapse;font-size:12px;margin-bottom:8px;">
      <thead>
        <tr style="background:#f5f5f5;">
          <th style="width:25px;text-align:center;padding:3px 4px;border:1px solid #e0e0e0;font-size:11px;">Date</th>
          <th style="width:15px;text-align:center;padding:3px 4px;border:1px solid #e0e0e0;font-size:11px;">Out Figure</th>
          <th style="width:30px;text-align:center;padding:3px 4px;border:1px solid #e0e0e0;font-size:11px;">Email Status</th>
          <th style="width:200px;text-align:center;padding:3px 4px;border:1px solid #e0e0e0;font-size:11px;">Response</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

function escapeNotificationHtml_(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ===================================================================
// Render notification chart (Column chart)
// ===================================================================

function renderNotifyChart(num, data) {
  const canvas = document.getElementById(`notifyChart_${num}`);
  if (!canvas) return;

  // Destroy previous instance
  if (notificationChartInstances[num]) {
    notificationChartInstances[num].destroy();
    delete notificationChartInstances[num];
  }

  // Collect all days with issues
  const allEntries = [
    ...data.buckets.caution.map(e => ({ ...e, status: 'caution' })),
    ...data.buckets.warning.map(e => ({ ...e, status: 'warning' })),
    ...data.buckets.critical.map(e => ({ ...e, status: 'critical' })),
  ];

  const ctx = canvas.getContext('2d');

  // If no issues
  if (allEntries.length === 0) {
    notificationChartInstances[num] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['All Days'],
        datasets: [{
          label: 'Within Standard Range',
          data: [1],
          backgroundColor: ['#4CAF50'],
          borderColor: ['#2e7d32'],
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: { 
            display: true, 
            text: '✅ All days within standard range', 
            font: { size: 12, weight: 'bold' },
            color: '#2e7d32'
          },
          legend: { display: false }
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 1,
            display: false
          },
          x: {
            display: false
          }
        }
      }
    });
    return;
  }

  // Group by status
  const statusColors = {
    caution: '#d4a017',
    warning: '#e07b00',
    critical: '#c0392b'
  };

  const statusLabels = {
    caution: 'Caution',
    warning: 'Warning',
    critical: 'Critical'
  };

  const grouped = {};
  allEntries.forEach(e => {
    if (!grouped[e.status]) grouped[e.status] = [];
    grouped[e.status].push(e);
  });

  const labels = Object.keys(grouped).map(s => statusLabels[s] || s);
  const counts = Object.keys(grouped).map(s => grouped[s].length);
  const colors = Object.keys(grouped).map(s => statusColors[s] || '#999');

  // Create column chart
  notificationChartInstances[num] = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Number of Days',
        data: counts,
        backgroundColor: colors.map(c => c + 'CC'),
        borderColor: colors,
        borderWidth: 2,
        borderRadius: 4,
        barPercentage: 0.5,
        categoryPercentage: 0.7
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: 'Out-of-Standard Days by Category',
          font: { size: 12, weight: 'bold' }
        },
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: function(context) {
              const value = context.parsed.y;
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
              return `${value} day${value > 1 ? 's' : ''} (${percentage}%)`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          title: { display: true, text: 'Days', font: { size: 10 } },
          ticks: { 
            stepSize: 1,
            font: { size: 9 }
          }
        },
        x: {
          title: { display: true, text: 'Category', font: { size: 10 } },
          ticks: { font: { size: 10, weight: 'bold' } }
        }
      },
      animation: {
        duration: 600,
        easing: 'easeOutQuart'
      }
    }
  });
}

// ===================================================================
// Build notification data - uses existing KPI year data builders
// ===================================================================

async function buildNotificationData_(kpiKey, year, month) {
  // KPI 02 - Not yet available
  if (kpiKey === "kpi-02") {
    return { available: false, label: "KPI 02" };
  }

  // Map KPI key to builder function
  const builderMap = {
    "kpi-01": { 
      builder: buildBayMortalityYearData_, 
      colorClass: bayMortalityColorClass_, 
      valueField: "pct",
      sheetName: "Live_Bird_Bay_Mortality_Rate_%"
    },
    "kpi-03": { 
    builder: buildSlaughterEfficiencyYearData_,  // ✅ නිවැරදි
    colorClass: slaughterEfficiencyColorClass_,  // ✅ නිවැරදි
    valueField: "pct",
    sheetName: "Slaughter_Line_Efficiency_%"
  },
    "kpi-04": { 
      builder: buildPackingEfficiencyYearData_, 
      colorClass: packingEfficiencyColorClass_, 
      valueField: "pct",
      sheetName: "Packing_Line_Efficiency_%"
    },
    "kpi-05": { 
      builder: buildDressedYieldYearData_,        // ✅ New
      colorClass: dressedYieldColorClass_, 
      valueField: "yieldPct",
      sheetName: "Dressed_Yield_%"
    },
    "kpi-06": { 
      builder: buildChillLossYearData_,           // ✅ New
      colorClass: chillLossColorClass_, 
      valueField: "chillLossPct",
      sheetName: "Chill_Loss_%"
    },
  };

  const config = builderMap[kpiKey];
  if (!config) {
    return { available: false, label: kpiKey };
  }

  const [yearDays, sheetRows] = await Promise.all([
    config.builder(year),
    Api.list(config.sheetName)
  ]);
  const monthPrefix = `${year}-${String(month).padStart(2, "0")}-`;
  const monthDays = yearDays.filter((r) => r.hasData && r.date.startsWith(monthPrefix));

  const buckets = { caution: [], warning: [], critical: [] };
  monthDays.forEach((r) => {
    const cls = config.colorClass(r[config.valueField]);
    const sourceRows = sheetRows.filter(row => String(row.Date) === r.date);
    const sent = sourceRows.length > 0 && sourceRows.every(row =>
      String(row.Status || '').trim().toLowerCase() === 'sent'
    );
    const response = sourceRows
      .map(row => String(row.Response2 || '').trim())
      .filter(Boolean)
      .join('\n\n');
    const entry = { date: r.date, value: r[config.valueField], sent, response };
    if (cls === "kpi-yellow") buckets.caution.push(entry);
    else if (cls === "kpi-orange") buckets.warning.push(entry);
    else if (cls === "kpi-red") buckets.critical.push(entry);
  });

  return { available: true, label: kpiKey, valueLabel: config.valueField, buckets };
}
