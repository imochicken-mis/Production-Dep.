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
// SIDEBAR — Collapsible KPI's / Reports accordion
// ===================================================================
const kpiToggle = document.getElementById("kpiToggle");
const reportsToggle = document.getElementById("reportsToggle");
const kpiCollapse = document.getElementById("kpiCollapse");
const reportsCollapse = document.getElementById("reportsCollapse");

function setSection(open) {
  // open = "kpi" | "reports" | null (null = both closed)
  kpiToggle.classList.toggle("active", open === "kpi");
  reportsToggle.classList.toggle("active", open === "reports");
  kpiCollapse.classList.toggle("open", open === "kpi");
  reportsCollapse.classList.toggle("open", open === "reports");
}

function toggleSection(section) {
  const isOpen = section === "kpi"
    ? kpiCollapse.classList.contains("open")
    : reportsCollapse.classList.contains("open");
  setSection(isOpen ? null : section);   // click on open section -> close both; else open it
}

kpiToggle.addEventListener("click", () => toggleSection("kpi"));
reportsToggle.addEventListener("click", () => toggleSection("reports"));

function showView(key) {
  navItems.forEach((b) => b.classList.toggle("active", b.dataset.view === key));
  views.forEach((v) => v.classList.toggle("active", v.id === `view-${key}`));
  viewTitle.textContent = document.querySelector(`.nav-item[data-view="${key}"]`).textContent.trim();
  sidebar.classList.remove("open");

  // Auto-expand the matching section
  const isKpi = key === "dashboard" || key.startsWith("kpi-");
  setSection(isKpi ? "kpi" : "reports");

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
  if (key === "yield-report") initYieldReport();
  if (key === "kpi-01") initBayMortalityKpi();
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
  downloadDressWeightCsv_(report);   // Table 1 + 2 CSV reused; Easy section appended below

  // Note: Easy Production section export can be added as a second CSV block if needed later.
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

  const dayTargetActualHeaders = Array.from({ length: report.daysInMonth }, () =>
    `<th>Target</th><th>Actual</th>`
  ).join("");

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
    panel.innerHTML = renderBayMortalityTable_(report);
  } catch (err) {
    panel.innerHTML = `<p class="hint error">Failed to load report: ${err.message}</p>`;
  }
}

function renderBayMortalityTable_(report) {
  const dateCells = report.days.map((d) => `<td>${String(d.day).padStart(2, "0")}</td>`).join("");
  const birdsCells = report.days.map((d) => `<td>${d.hasData ? formatNum_(d.totalBirds, 0) : ""}</td>`).join("");
  const mortalityCells = report.days.map((d) => `<td>${d.hasData ? formatNum_(d.bayMortality, 0) : ""}</td>`).join("");
  const pctCells = report.days.map((d) => {
    if (!d.hasData) return `<td></td>`;
    const cls = bayMortalityColorClass_(d.pct);
    return `<td class="${cls}">${d.pct.toFixed(2)}%</td>`;
  }).join("");

  return `
    <table class="report-table kpi-bay-mortality-table">
      <tbody>
        <tr><td class="row-label">Date</td>${dateCells}</tr>
        <tr><td class="row-label">Total Birds Received Alive</td>${birdsCells}</tr>
        <tr><td class="row-label">Bay Mortality Birds</td>${mortalityCells}</tr>
        <tr><td class="row-label">Bay Mortality %</td>${pctCells}</tr>
      </tbody>
    </table>
  `;
}