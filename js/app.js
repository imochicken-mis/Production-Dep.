// ===================================================================
// Production System — app.js
// ===================================================================

const cache = {};

// ---- Current session ----
const currentUser = JSON.parse(sessionStorage.getItem("qa_user") || "null");
if (currentUser) {
  document.getElementById("footUser").textContent =
    `${currentUser.username} (${currentUser.role || "Staff"})`;
}

document.getElementById("logoutBtn").addEventListener("click", () => {
  sessionStorage.removeItem("qa_user");
  window.location.href = "login.html";
});

// ===================================================================
// ROLE-BASED ACCESS CONTROL
// ===================================================================
function applyAllowedTabsFilter_() {
  if (!currentUser || !currentUser.allowedTabs || currentUser.allowedTabs.length === 0) return;

  document.querySelectorAll(".nav-item").forEach((btn) => {
    if (!currentUser.allowedTabs.includes(btn.dataset.view)) {
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
// SIDEBAR — Collapsible sections (accordion)
// ===================================================================
const kpiToggle = document.getElementById("kpiToggle");
const reportsToggle = document.getElementById("reportsToggle");
const dataEntryToggle = document.getElementById("dataEntryToggle");          // 🆕
const notificationsToggle = document.getElementById("notificationsToggle");
const kpiCollapse = document.getElementById("kpiCollapse");
const reportsCollapse = document.getElementById("reportsCollapse");
const dataEntryCollapse = document.getElementById("dataEntryCollapse");       // 🆕
const notificationsCollapse = document.getElementById("notificationsCollapse");

function setSection(open) {
  kpiToggle.classList.toggle("active", open === "kpi");
  reportsToggle.classList.toggle("active", open === "reports");
  dataEntryToggle.classList.toggle("active", open === "dataEntry");           // 🆕
  notificationsToggle.classList.toggle("active", open === "notifications");
  kpiCollapse.classList.toggle("open", open === "kpi");
  reportsCollapse.classList.toggle("open", open === "reports");
  dataEntryCollapse.classList.toggle("open", open === "dataEntry");           // 🆕
  notificationsCollapse.classList.toggle("open", open === "notifications");
}

function toggleSection(section) {
  const collapseMap = {
    kpi: kpiCollapse,
    reports: reportsCollapse,
    dataEntry: dataEntryCollapse,                                             // 🆕
    notifications: notificationsCollapse
  };
  const isOpen = collapseMap[section].classList.contains("open");
  setSection(isOpen ? null : section);
}

kpiToggle.addEventListener("click", () => toggleSection("kpi"));
reportsToggle.addEventListener("click", () => toggleSection("reports"));
dataEntryToggle.addEventListener("click", () => toggleSection("dataEntry"));  // 🆕
notificationsToggle.addEventListener("click", () => toggleSection("notifications"));

// -------------------------------------------------------------------
// Decimal hours → "Xh Ym" format (display only)
//   1.8  →  "1h 48m"
//   0.5  →  "0h 30m"
//   2.4  →  "2h 24m"
// -------------------------------------------------------------------
function formatHoursMinutes_(decimalHours) {
  const num = Number(decimalHours);
  if (!isFinite(num) || num <= 0) return "—";

  const totalMinutes = Math.round(num * 60);
  const hours   = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

// ===================================================================
// showView — Tab navigation dispatcher
// ===================================================================
function showView(key) {
  if (currentUser && currentUser.allowedTabs && currentUser.allowedTabs.length > 0 &&
      !currentUser.allowedTabs.includes(key)) {
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
  else if (key.startsWith("entry-")) section = "dataEntry";      // 🆕
  else section = "reports";
  setSection(section);

  // Reports
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

  // KPIs
  if (key === "kpi-01") initBayMortalityKpi();
  if (key === "kpi-02") initBirdUnloadKpi();
  if (key === "kpi-03") initBirdInputEfficiencyKpi();
  if (key === "kpi-04") initPackingEfficiencyKpi();
  if (key === "kpi-05") initDressedYieldKpi();
  if (key === "kpi-06") initChillLossKpi();

  // 🆕 Data Entering
  if (key === "entry-daily-lb") initDailyLbEntry();
  if (key === "entry-rendering") initRenderingEntry();      // 🆕
  if (key === "entry-production") initProductionDetailEntry();      // 🆕
  if (key === "entry-blast-freezer") initBlastFreezerEntry();      // 🆕
  if (key === "entry-giblet") initGibletEntry();      // 🆕
  if (key === "entry-easy-material") initEasyMaterialEntry();      // 🆕
  if (key === "entry-easy-production") initEasyProductionEntry();      // 🆕
  if (key === "entry-csv-uploads") initCsvUploadsEntry();      // 🆕
  if (key === "entry-consumable") initConsumableEntry();      // 🆕

  // Notifications
  if (key === "notify-kpi-01") initNotifyKpi("01");
  if (key === "notify-kpi-02") initNotifyKpi("02");
  if (key === "notify-kpi-03") initNotifyKpi("03");
  if (key === "notify-kpi-04") initNotifyKpi("04");
  if (key === "notify-kpi-05") initNotifyKpi("05");
  if (key === "notify-kpi-06") initNotifyKpi("06");
}

// ===================================================================
// API STATUS PING + INITIAL VIEW
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
    showView(currentUser.allowedTabs[0]);
  } else {
    showView("dashboard-new");
  }
})();

// ===================================================================
// SHARED HELPERS
// ===================================================================
function formatNum_(v, decimals = 2) {
  const num = Number(v) || 0;
  if (decimals === "auto") {
    const hasFraction = Math.abs(num % 1) > 0.001;
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

const MONTH_NAMES_ = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const MONTH_SHORT_NAMES_ = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// ===================================================================
// countWorkingDaysInMonth_ — TOP LEVEL (used by all KPI functions)
// ===================================================================
// ===================================================================
// Count working days in a month
//   = non-Sunday days − Poya days (excluding Poya that fall on Sunday)
// ===================================================================
let __holidaysCache_ = null;

async function loadHolidaysCache_() {
  if (__holidaysCache_ !== null) return __holidaysCache_;
  try {
    const rows = await Api.list("Holidays");
    __holidaysCache_ = rows.map((r) => ({
      date: String(r.Date || "").slice(0, 10),
      category: String(r.Category || "").trim(),
    }));
  } catch (err) {
    console.warn("[Holidays] Failed to load:", err.message);
    __holidaysCache_ = [];
  }
  return __holidaysCache_;
}

async function countWorkingDaysInMonth_(year, month) {
  const daysInMonth = new Date(year, month, 0).getDate();
  const monthPrefix = `${year}-${String(month).padStart(2, "0")}-`;

  // Load holidays (cached)
  const holidays = await loadHolidaysCache_();

  // 🆕 Build a Set of Poya dates in this month
  const poyaDates = new Set();
  holidays.forEach((h) => {
    if (h.category.toLowerCase() === "poya" && h.date.startsWith(monthPrefix)) {
      poyaDates.add(h.date);
    }
  });

  let count = 0;
  for (let d = 1; d <= daysInMonth; d++) {
    const dateObj = new Date(year, month - 1, d);
    const dayOfWeek = dateObj.getDay();   // 0 = Sunday

    // Skip Sundays
    if (dayOfWeek === 0) continue;

    // 🆕 Skip Poya days (but only if they're NOT Sunday — Sunday already skipped)
    const dateStr = `${monthPrefix}${String(d).padStart(2, "0")}`;
    if (poyaDates.has(dateStr)) {
      // Poya on Sunday → already skipped above, no double-count issue
      // Poya on weekday → skip
      continue;
    }

    count++;
  }
  return count;
}

// ===================================================================
// PRINT-TO-PDF FILENAME HELPER
// ===================================================================
function printWithFilename_(filename) {
  const originalTitle = document.title;
  function setTitle() { document.title = filename; }
  function restoreTitle() {
    document.title = originalTitle;
    window.removeEventListener("afterprint", restoreTitle);
  }
  window.addEventListener("beforeprint", setTitle);
  window.addEventListener("afterprint", restoreTitle);
  window.print();
  setTimeout(() => window.removeEventListener("beforeprint", setTitle), 1000);
}

// ===================================================================
// KPI STATUS HELPER — returns label + color for a given KPI + value
// ===================================================================
function getKpiStatusDisplay_(kpiKey, value) {
  const classFn = {
    'kpi-01': typeof bayMortalityColorClass_      !== 'undefined' ? bayMortalityColorClass_      : null,
    'kpi-02': typeof birdUnloadColorClass_       !== 'undefined' ? birdUnloadColorClass_       : null,
    'kpi-03': typeof slaughterEfficiencyColorClass_ !== 'undefined' ? slaughterEfficiencyColorClass_ : null,
    'kpi-04': typeof packingEfficiencyColorClass_ !== 'undefined' ? packingEfficiencyColorClass_ : null,
    'kpi-05': typeof dressedYieldColorClass_     !== 'undefined' ? dressedYieldColorClass_     : null,
    'kpi-06': typeof chillLossColorClass_        !== 'undefined' ? chillLossColorClass_        : null,
  }[kpiKey];

  if (!classFn || value === null || value === undefined || !isFinite(value)) {
    return { label: '—', color: '#999' };
  }

  const cls = classFn(value);
  // 🆕 Achieved / Not Achieved — green band = Achieved, anything else = Not Achieved
  if (cls === 'kpi-green') return { label: 'Achieved',     color: '#2e7d32', pill: 'kpi-achieved' };
  return                        { label: 'Not Achieved', color: '#c62828', pill: 'kpi-not-achieved' };
}

// ===================================================================
// KPI goodness check — returns true if actual value is in "Good" band
// ===================================================================
function isKpiGood_(kpiKey, value) {
  if (value === null || value === undefined || !isFinite(value)) return false;
  const fnMap = {
    'kpi-01': typeof bayMortalityColorClass_      !== 'undefined' ? bayMortalityColorClass_      : null,
    'kpi-02': typeof birdUnloadColorClass_       !== 'undefined' ? birdUnloadColorClass_       : null,
    'kpi-03': typeof slaughterEfficiencyColorClass_ !== 'undefined' ? slaughterEfficiencyColorClass_ : null,
    'kpi-04': typeof packingEfficiencyColorClass_ !== 'undefined' ? packingEfficiencyColorClass_ : null,
    'kpi-05': typeof dressedYieldColorClass_     !== 'undefined' ? dressedYieldColorClass_     : null,
    'kpi-06': typeof chillLossColorClass_        !== 'undefined' ? chillLossColorClass_        : null,
  };
  const fn = fnMap[kpiKey];
  return fn ? fn(value) === 'kpi-green' : false;
}

// ===================================================================
// Short standard display for the bar center label
// ===================================================================
function shortStdLabel_(kpiKey) {
  if (kpiKey === 'kpi-01') return '0.05%';
  if (kpiKey === 'kpi-02') return '4500';
  if (kpiKey === 'kpi-03') return '95.00%';
  if (kpiKey === 'kpi-04') return '95.00%';
  if (kpiKey === 'kpi-05') return '79.00%';
  if (kpiKey === 'kpi-06') return '2.00%';
  return '—';
}

// -------------------------------------------------------------------
// Wrap master chart + status cards into a side-by-side flex layout
// -------------------------------------------------------------------
function wrapChartAndCards_(chartHtml, cardsHtml) {
  return `
    <div class="kpi-chart-cards-flex">
      <div class="kpi-chart-cards-chart">${chartHtml}</div>
      <div class="kpi-chart-cards-side">${cardsHtml}</div>
    </div>
  `;
}

// -------------------------------------------------------------------
// Wrap numbers AND operators inside formula with spans
// -------------------------------------------------------------------
function wrapFormulaNumbers_(formula) {
  if (!formula) return '';
  // 1) Escape HTML
  const escaped = String(formula)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // 2) Line by line process කරන්න
  const lines = escaped.split('\n');

  return lines.map((line, idx) => {
    // 🆕 පළවෙනි line එක = text-only (numbers wrap කරන්නේ නැහැ)
    if (idx === 0) {
      return '<span class="formula-text-line">' + line + '</span>';
    }
    // ඉතුරු lines = numbers + operators wrap කරන්න
    return line.replace(/(\d[\d,\.]*%?|[×÷=+\-])/g, function (match) {
      if (/^\d/.test(match)) {
        return '<span class="formula-num">' + match + '</span>';
      }
      return '<span class="formula-op">' + match + '</span>';
    });
  }).join('\n');
}

// ===================================================================
// KPI HEADER — update the 6-column grid
// ===================================================================
function updateKpiHeader(kpiKey, std, workingDays, actualDays , actualValue, breakdown) {
  const viewElement = document.getElementById(`view-${kpiKey}`);
  if (!viewElement) return;

  const num = kpiKey.replace('kpi-', '');

  // Standard display per KPI
  let stdText;
  if (kpiKey === 'kpi-01')      stdText = '≤ 0.05%';
  else if (kpiKey === 'kpi-02') stdText = '4500 birds/hr';
  else if (kpiKey === 'kpi-03') stdText = '95.00%';
  else if (kpiKey === 'kpi-04') stdText = '95.00%';
  else if (kpiKey === 'kpi-05') stdText = '79.00%';
  else if (kpiKey === 'kpi-06') stdText = '2.00%';
  else                          stdText = (typeof std === 'number' ? std.toFixed(2) + '%' : String(std));

  // Actual value display
  let actualText = '—';
  if (actualValue !== null && actualValue !== undefined && isFinite(actualValue)) {
    if (kpiKey === 'kpi-02') actualText = Number(actualValue).toFixed(0) + ' birds/hr';
    else                     actualText = Number(actualValue).toFixed(2) + '%';
  }

  const statusInfo = getKpiStatusDisplay_(kpiKey, actualValue);
  const good = isKpiGood_(kpiKey, actualValue);

  const stdEl = document.getElementById(`kpi${num}Standard`);
  const actEl = document.getElementById(`kpi${num}Actual`);
  const stEl  = document.getElementById(`kpi${num}Status`);
  const wdEl  = document.getElementById(`kpi${num}WorkingDays`);

  // STANDARD — value only
  if (stdEl) {
    stdEl.textContent = stdText;
  }

  // ACTUAL — value + achieved/not-achieved color
  if (actEl) {
    actEl.textContent = actualText;
    actEl.style.color = '';
    actEl.classList.remove('kpi-actual-achieved', 'kpi-actual-notachieved');
    actEl.classList.add(good ? 'kpi-actual-achieved' : 'kpi-actual-notachieved');
  }


  // STATUS pill
  if (stEl) {
    stEl.textContent = statusInfo.label;
    stEl.style.color = statusInfo.color;
    stEl.classList.remove('kpi-achieved', 'kpi-not-achieved');
    if (statusInfo.pill) stEl.classList.add(statusInfo.pill);
  }

  // ===========================================================
  // WORKING DAYS — STD + ACT
  // ===========================================================
  const wdStdEl = document.getElementById(`kpi${num}WdStd`);
  const wdActEl = document.getElementById(`kpi${num}WdActual`);

  if (wdStdEl) wdStdEl.textContent = workingDays;
  if (wdActEl) {
    wdActEl.textContent = actualDays;
    wdActEl.classList.remove('wd-over', 'wd-under');
    if (actualDays > workingDays) wdActEl.classList.add('wd-over');
    else if (actualDays < workingDays) wdActEl.classList.add('wd-under');
  }

    // ===========================================================
  // BAR — standard marked, actual fills left-to-right
  // ===========================================================
  const barFillEl    = document.getElementById(`kpi${num}BarFill`);
  const barStdMarkEl = document.getElementById(`kpi${num}BarStdMark`);
  const barStdLblEl  = document.getElementById(`kpi${num}BarStdLabel`);
  const barStatusEl  = document.getElementById(`kpi${num}BarStatus`);

  if (barFillEl && actualValue !== null && actualValue !== undefined && isFinite(actualValue)) {
    // Bar max range from KPI_BAR_MAX_ (defined elsewhere in app.js)
    const BAR_MAX = (typeof KPI_BAR_MAX_ !== 'undefined' && KPI_BAR_MAX_[kpiKey])
      ? KPI_BAR_MAX_[kpiKey]
      : std * 2;

    const fillPct = Math.max(0, Math.min(100, (actualValue / BAR_MAX) * 100));
    const stdPct  = Math.max(0, Math.min(100, (std / BAR_MAX) * 100));

    // Fill width + color
    barFillEl.style.width = `${fillPct}%`;
    barFillEl.style.background = good
      ? 'linear-gradient(90deg, #6EE87C 0%, #1B9E3A 100%)'
      : 'linear-gradient(90deg, #FF6B6B 0%, #B71C1C 100%)';

    // Standard mark position
    if (barStdMarkEl) barStdMarkEl.style.left = `${stdPct}%`;

    // Standard label position (with edge-clamping)
    if (barStdLblEl) {
      if (stdPct < 12) {
        barStdLblEl.style.transform = 'translateX(0)';
        barStdLblEl.style.left = '4px';
      } else if (stdPct > 88) {
        barStdLblEl.style.transform = 'translateX(-100%)';
        barStdLblEl.style.left = 'calc(100% - 4px)';
      } else {
        barStdLblEl.style.transform = 'translateX(-50%)';
        barStdLblEl.style.left = `${stdPct}%`;
      }
      barStdLblEl.textContent = shortStdLabel_(kpiKey);
    }

    // Status text on bar
    if (barStatusEl) barStatusEl.textContent = statusInfo.label;

        // 🆕 Deviation from standard
    const barDevEl = document.getElementById(`kpi${num}BarDeviation`);
    if (barDevEl && std > 0) {
      const devPct = ((actualValue - std) / std) * 100;
      const sign = devPct >= 0 ? '+' : '';
      barDevEl.textContent = `${sign}${devPct.toFixed(1)}%`;

      // Position near the actual fill edge
      const devPos = Math.max(6, Math.min(94, fillPct));
      barDevEl.style.left = `${devPos}%`;

      // Color: green if achieved, red if not
      barDevEl.classList.toggle('negative', !good);
      barDevEl.classList.remove('hidden');
    }
  } else {
    // No data → hide deviation
    const barDevEl = document.getElementById(`kpi${num}BarDeviation`);
    if (barDevEl) barDevEl.classList.add('hidden');
  }

  // ===========================================================
  // FORMULA — bottom row (Col 3)
  // ===========================================================
  const fmSpanEl = document.getElementById(`kpi${num}FormulaSpan`);
    if (fmSpanEl) {
    if (breakdown && breakdown.formula) {
      fmSpanEl.innerHTML = wrapFormulaNumbers_(breakdown.formula);   // ✅
      fmSpanEl.style.display = '';
    } else {
      fmSpanEl.innerHTML = '';
      fmSpanEl.style.display = 'none';
    }
  }

    // Today's date — DD-MM-YYYY
  const todayEl = document.getElementById(`kpi${num}Today`);
  if (todayEl) {
    const d = new Date();
    const day   = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    todayEl.textContent = `${day}-${month}-${d.getFullYear()}`;
  }
}

// ===================================================================
// DAILY LB INPUT REPORT
// ===================================================================
function initLbInputReport() {
  const dateInput = document.getElementById("lbDateFilter");
  if (dateInput.dataset.bound) return;
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
    document.getElementById("printDate").textContent = formatDateDMY_(report.date);
    document.getElementById("printBatch").textContent = report.batchNo;

    if (report.locations.length === 0) {
      panel.innerHTML = `<p class="hint">No data found for ${dateStr}.</p>`;
      window.currentLbUnloadingRows = [];
      return;
    }

    // 🆕 Load Birds_Unloading data for this date
    let unloadingRows = [];
    try {
      const all = await Api.list("Birds_Unloading");
      unloadingRows = all.filter((r) => String(r.Date) === dateStr);
    } catch (err) {
      console.warn("[LB] Failed to load Birds_Unloading:", err.message);
    }

    // 🆕 Save globally for CSV download
    window.currentLbUnloadingRows = unloadingRows;

    panel.innerHTML = renderReportTable_(report, unloadingRows);
  } catch (err) {
    panel.innerHTML = `<p class="hint error">Failed to load report: ${err.message}</p>`;
  }
}

function renderReportTable_(report, unloadingRows) {
  unloadingRows = unloadingRows || [];

  const locCols = report.locations.map((loc) => `<th>${loc}</th>`).join("");

  // ----- Existing rows (Farmer Reference metrics) -----
  const existingRows = report.metrics.map((m) => {
    const cells = m.values.map((v) => `<td>${formatNum_(v, m.decimals)}</td>`).join("");
    return `<tr><td class="row-label">${m.label}</td>${cells}<td class="total-cell">${formatNum_(m.total, m.decimals)}</td></tr>`;
  }).join("");

  // ===================================================================
  // Helper functions
  // ===================================================================
  const getLoc = (r) => String(r.Location || r.Loaction || "").trim();

  // Get the Nth matching entry for a location (occurrenceIndex = 0, 1, 2, ...)
  function getUnloadingEntryForLoc_(loc, occurrenceIndex) {
    const target = String(loc || "").trim();
    const matches = unloadingRows.filter((r) => getLoc(r) === target);
    return matches[occurrenceIndex] || null;
  }

  // Count how many times this location appeared BEFORE index `idx`
  function getOccurrenceIndex_(locationsList, idx) {
    const target = String(locationsList[idx] || "").trim();
    let count = 0;
    for (let k = 0; k < idx; k++) {
      if (String(locationsList[k] || "").trim() === target) count++;
    }
    return count;
  }

  // Parse "HH:MM" or "HH:MM:SS" → total minutes
  function parseTimeMins_(t) {
    if (!t) return null;
    const parts = String(t).split(":").map((x) => Number(x));
    if (parts.length < 2 || !isFinite(parts[0]) || !isFinite(parts[1])) return null;
    return parts[0] * 60 + parts[1];
  }

  // Format duration minutes → "Xh Ym"
  function formatDuration_(mins) {
    if (mins === null || mins === undefined || !isFinite(mins)) return "";
    const h = Math.floor(mins / 60);
    const m = Math.round(mins % 60);
    if (h === 0) return `${m}m`;
    if (m === 0) return `${h}h`;
    return `${h}h ${String(m).padStart(2, "0")}m`;
  }

  // ===================================================================
  // Build 3 new rows — ONE entry per column
  // ===================================================================

  // Row 1: Unload/ Start Time
  const startTimeCells = report.locations.map((loc, i) => {
    const occIdx = getOccurrenceIndex_(report.locations, i);
    const entry = getUnloadingEntryForLoc_(loc, occIdx);
    if (!entry) return `<td></td>`;
    const time = String(entry.Start_Time || "").slice(0, 5);
    return `<td>${time || ""}</td>`;
  }).join("");

  // Row 2: Unload/ End Time
  const endTimeCells = report.locations.map((loc, i) => {
    const occIdx = getOccurrenceIndex_(report.locations, i);
    const entry = getUnloadingEntryForLoc_(loc, occIdx);
    if (!entry) return `<td></td>`;
    const time = String(entry.End_Time || "").slice(0, 5);
    return `<td>${time || ""}</td>`;
  }).join("");

    // Row 3: Unloading Time (duration)
  let totalDurationMins = 0;

  const durationCells = report.locations.map((loc, i) => {
    const occIdx = getOccurrenceIndex_(report.locations, i);
    const entry = getUnloadingEntryForLoc_(loc, occIdx);
    if (!entry) return `<td></td>`;
    const s = parseTimeMins_(entry.Start_Time);
    const en = parseTimeMins_(entry.End_Time);
    if (s === null || en === null) return `<td></td>`;
    let diff = en - s;
    if (diff < 0) diff += 24 * 60;
    totalDurationMins += diff;                    // 🆕 accumulate
    return `<td>${formatDuration_(diff)}</td>`;
  }).join("");

  // 🆕 Total unloading time across all locations
  const totalDurationCell = totalDurationMins > 0
    ? `<td class="total-cell">${formatDuration_(totalDurationMins)}</td>`
    : `<td class="total-cell"></td>`;

  const newRows = `
    <tr class="unloading-rows"><td class="row-label">Unload/ Start Time</td>${startTimeCells}<td class="total-cell"></td></tr>
    <tr class="unloading-rows"><td class="row-label">Unload/ End Time</td>${endTimeCells}<td class="total-cell"></td></tr>
    <tr class="unloading-rows"><td class="row-label">Unloading Time</td>${durationCells}${totalDurationCell}</tr>
  `;

  return `
    <table class="report-table">
      <thead>
        <tr>
          <th class="row-label">Farmer Reference</th>
          ${locCols}
          <th class="total-col">Total</th>
        </tr>
      </thead>
      <tbody>${existingRows}${newRows}</tbody>
    </table>
  `;
}

function downloadReportCsv_(report) {
  if (!report) return;

  const headers = ["Farmer Reference", ...report.locations, "Total"];
  const rows = report.metrics.map((m) => [m.label, ...m.values, m.total]);

  // ===================================================================
  // 🆕 Add 3 unloading rows (one entry per column, matching the table)
  // ===================================================================
  const unloadingRows = window.currentLbUnloadingRows || [];

  const getLoc = (r) => String(r.Location || r.Loaction || "").trim();

  function getUnloadingEntryForLoc_(loc, occurrenceIndex) {
    const target = String(loc || "").trim();
    const matches = unloadingRows.filter((r) => getLoc(r) === target);
    return matches[occurrenceIndex] || null;
  }

  function getOccurrenceIndex_(locationsList, idx) {
    const target = String(locationsList[idx] || "").trim();
    let count = 0;
    for (let k = 0; k < idx; k++) {
      if (String(locationsList[k] || "").trim() === target) count++;
    }
    return count;
  }

  function parseTimeMins_(t) {
    if (!t) return null;
    const parts = String(t).split(":").map((x) => Number(x));
    if (parts.length < 2 || !isFinite(parts[0]) || !isFinite(parts[1])) return null;
    return parts[0] * 60 + parts[1];
  }

  function formatDuration_(mins) {
    if (mins === null || mins === undefined || !isFinite(mins)) return "";
    const h = Math.floor(mins / 60);
    const m = Math.round(mins % 60);
    if (h === 0) return `${m}m`;
    if (m === 0) return `${h}h`;
    return `${h}h ${String(m).padStart(2, "0")}m`;
  }

  // ---- Row: Unload/ Start Time ----
  const startRow = ["Unload/ Start Time"];
  report.locations.forEach((loc, i) => {
    const occIdx = getOccurrenceIndex_(report.locations, i);
    const entry = getUnloadingEntryForLoc_(loc, occIdx);
    startRow.push(entry ? String(entry.Start_Time || "").slice(0, 5) : "");
  });
  startRow.push("");
  rows.push(startRow);

  // ---- Row: Unload/ End Time ----
  const endRow = ["Unload/ End Time"];
  report.locations.forEach((loc, i) => {
    const occIdx = getOccurrenceIndex_(report.locations, i);
    const entry = getUnloadingEntryForLoc_(loc, occIdx);
    endRow.push(entry ? String(entry.End_Time || "").slice(0, 5) : "");
  });
  endRow.push("");
  rows.push(endRow);

  // ---- Row: Unloading Time ----
  const durRow = ["Unloading Time"];
  let totalDurationMins = 0;

  report.locations.forEach((loc, i) => {
    const occIdx = getOccurrenceIndex_(report.locations, i);
    const entry = getUnloadingEntryForLoc_(loc, occIdx);
    if (!entry) {
      durRow.push("");
      return;
    }
    const s = parseTimeMins_(entry.Start_Time);
    const en = parseTimeMins_(entry.End_Time);
    if (s === null || en === null) {
      durRow.push("");
      return;
    }
    let diff = en - s;
    if (diff < 0) diff += 24 * 60;
    totalDurationMins += diff;                  // 🆕 accumulate
    durRow.push(formatDuration_(diff));
  });
  durRow.push(totalDurationMins > 0 ? formatDuration_(totalDurationMins) : "");   // 🆕 Total
  rows.push(durRow);

  // ===================================================================
  // Build CSV
  // ===================================================================
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
// TOTAL LB REPORT
// ===================================================================
function initTotalLbReport() {
  const monthSelect = document.getElementById("totalLbMonth");
  const yearSelect = document.getElementById("totalLbYear");
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
  const hideGibletPetFood = report.hideGibletAndPetFood === true;

  // Table 1
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

  // Table 2
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

  const gibletRow      = hideGibletPetFood ? "" : `<div class="cw-row"><span>Giblet Use for Whole Chicken</span><span>${gibletDisplay}</span></div>`;
  const petFoodRow     = hideGibletPetFood ? "" : `<div class="cw-row"><span>Pet Food from the Easy</span><span>${formatNum_(report.petFood, 1)}</span></div>`;
  const dressWeightRow = hideGibletPetFood ? "" : `<div class="cw-row cw-total"><span>Dress Weight</span><span>${formatNum_(report.dressWeight, 1)}</span></div>`;
  const yieldPctRow    = hideGibletPetFood ? "" : `<div class="cw-row cw-total"><span>Yeild %</span><span>${formatPct_(report.yieldPct)}</span></div>`;

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
      ${gibletRow}
      ${petFoodRow}
      ${dressWeightRow}
      ${yieldPctRow}
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
  `;
}

function downloadProductionWeightCsv_(report) {
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
  csv += `"Yeild %","","${Math.round(report.yieldPct)}%"\n\n`;

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
    opt.value = y; opt.textContent = y;
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
    opt.value = y; opt.textContent = y;
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
    opt.value = y; opt.textContent = y;
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
    opt.value = y; opt.textContent = y;
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
    opt.value = y; opt.textContent = y;
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
// DAY OF STOCK AVAILABLE
// ===================================================================
function initStockAvailable() {
  const dateInput = document.getElementById("saDateFilter");
  if (dateInput.dataset.bound) return;
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
    opt.value = y; opt.textContent = y;
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
    const rowTotal = item.values.reduce((s, v) => s + v, 0);
    return `<tr><td class="row-label">${item.itemName}</td>${cells}<td class="total-cell">${formatNum_(rowTotal, "auto")}</td></tr>`;
  }).join("");

  const totalCells = report.columnTotals.map((v) => `<td>${formatNum_(v, "auto")}</td>`).join("");
  const grandTotal = report.columnTotals.reduce((s, v) => s + v, 0);

  return `
    <table class="report-table consumable-table">
      <thead>
        <tr><th class="row-label">Material Name</th>${dayHeaders}<th class="total-col">Total</th></tr>
      </thead>
      <tbody>${rows}</tbody>
      <tfoot>
        <tr class="bold-row"><td class="row-label">Total &gt;&gt;&gt;</td>${totalCells}<td class="total-cell">${formatNum_(grandTotal, "auto")}</td></tr>
      </tfoot>
    </table>
  `;
}

function downloadConsumableCsv_(report) {
  const dayHeaders = Array.from({ length: report.daysInMonth }, (_, i) => String(i + 1).padStart(2, "0"));
  let csv = ["Material Name", ...dayHeaders, "Total"].map((v) => `"${v}"`).join(",") + "\n";

  report.items.forEach((item) => {
    const rowTotal = item.values.reduce((s, v) => s + v, 0);
    csv += [item.itemName, ...item.values, rowTotal].map((v) => `"${v}"`).join(",") + "\n";
  });

  const grandTotal = report.columnTotals.reduce((s, v) => s + v, 0);
  csv += ["Total", ...report.columnTotals, grandTotal].map((v) => `"${v}"`).join(",") + "\n";

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${report.label.replace(/\s+/g, "_")}_Consumable_${report.year}-${String(report.month).padStart(2, "0")}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ===================================================================
// DATA ENTRY — Daily Rendering Outflow
// ===================================================================
function initRenderingEntry() {
  const form = document.getElementById("form-rendering");
  if (!form || form.dataset.bound === "true") return;
  form.dataset.bound = "true";

  // ----- Field references -----
  const F = {
    date:    document.getElementById("rndDate"),
    feather: document.getElementById("rndFeather"),
    feet:    document.getElementById("rndFeet"),
    offal:   document.getElementById("rndOffal"),
    total:   document.getElementById("rndTotal"),
  };

  // ----- Default today's date -----
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  if (!F.date.value) F.date.value = today;

  // ----- Number formatting helpers -----
  function formatDec_(el) {
    let raw = String(el.value).replace(/[^\d.]/g, "");
    const firstDot = raw.indexOf(".");
    if (firstDot !== -1) {
      raw = raw.slice(0, firstDot + 1) + raw.slice(firstDot + 1).replace(/\./g, "");
    }
    if (raw === "") { el.value = ""; return 0; }

    const parts = raw.split(".");
    const intPart = parts[0] === "" ? "0" : parts[0];
    const intNum = parseInt(intPart, 10);
    const intFmt = intNum.toLocaleString("en-US");

    if (parts.length === 1) {
      el.value = intFmt;
      return intNum;
    }

    const decPart = (parts[1] || "").slice(0, 2);
    el.value = intFmt + "." + decPart;
    const n = parseFloat(intFmt.replace(/,/g, "") + (decPart ? "." + decPart : ""));
    return isFinite(n) ? n : intNum;
  }

  function parseNum_(el) {
    const v = String(el.value).replace(/,/g, "");
    const n = parseFloat(v);
    return isFinite(n) ? n : 0;
  }

  function setAuto_(el, value, decimals) {
    if (!isFinite(value) || value === 0) { el.value = ""; return; }
    el.value = value.toLocaleString("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: decimals,
    });
  }

  // ----- Auto-calculate Total Rendering Weight -----
  function recalc() {
    const feather = parseNum_(F.feather);
    const feet    = parseNum_(F.feet);
    const offal   = parseNum_(F.offal);

    const total = feather + feet + offal;
    setAuto_(F.total, total, 2);
  }

  // ----- Attach input events -----
  [F.feather, F.feet, F.offal].forEach((el) => {
    el.addEventListener("input", () => { formatDec_(el); recalc(); });
  });

  // ----- Clear button -----
  document.getElementById("rndClearBtn").addEventListener("click", () => {
    if (!confirm("Clear all fields?")) return;
    form.reset();
    F.date.value = today;
    recalc();
  });

  // ----- Save (placeholder) -----
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const payload = {
      Date:        F.date.value,
      Feather:     parseNum_(F.feather),
      Feet:        parseNum_(F.feet),
      Offal:       parseNum_(F.offal),
      TotalFFO:    parseNum_(F.total),
    };

    console.log("[Rendering Entry] Payload ready:", payload);
    alert("✅ Payload ready!\n\nBackend API integration next step එකේදී save වෙයි.\n\nConsole එකේ payload බලන්න.");
  });

  recalc();
}

// ===================================================================
// DATA ENTRY — Daily Production Detail
// ===================================================================
async function initProductionDetailEntry() {
  const form = document.getElementById("form-production-detail");
  if (!form || form.dataset.bound === "true") return;
  form.dataset.bound = "true";

  const dateEl      = document.getElementById("prdDate");
  const searchEl    = document.getElementById("prdSearch");
  const tbodyEl     = document.getElementById("prdItemsBody");
  const grandTotalEl = document.getElementById("prdGrandTotal");

  // Default today's date
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  if (!dateEl.value) dateEl.value = today;

  // -------------------------------------------------------------------
  // Number formatting (decimal — #,###.## style)
  // -------------------------------------------------------------------
  function formatDec_(el) {
    let raw = String(el.value).replace(/[^\d.]/g, "");
    const firstDot = raw.indexOf(".");
    if (firstDot !== -1) {
      raw = raw.slice(0, firstDot + 1) + raw.slice(firstDot + 1).replace(/\./g, "");
    }
    if (raw === "") { el.value = ""; return 0; }

    const parts = raw.split(".");
    const intPart = parts[0] === "" ? "0" : parts[0];
    const intNum  = parseInt(intPart, 10);
    const intFmt  = intNum.toLocaleString("en-US");

    if (parts.length === 1) {
      el.value = intFmt;
      return intNum;
    }
    const decPart = (parts[1] || "").slice(0, 2);
    el.value = intFmt + "." + decPart;
    const n = parseFloat(intFmt.replace(/,/g, "") + (decPart ? "." + decPart : ""));
    return isFinite(n) ? n : intNum;
  }

  function parseNum_(el) {
    const v = String(el.value).replace(/,/g, "");
    const n = parseFloat(v);
    return isFinite(n) ? n : 0;
  }

  // -------------------------------------------------------------------
  // Recalculate grand total
  // -------------------------------------------------------------------
  function recalcGrandTotal() {
    const inputs = tbodyEl.querySelectorAll(".entry-item-qty");
    let total = 0;
    inputs.forEach((inp) => {
      const v = parseNum_(inp);
      if (isFinite(v)) total += v;
    });
    grandTotalEl.textContent = total.toLocaleString("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  }

  // -------------------------------------------------------------------
  // Load items from MasterItems sheet
  // -------------------------------------------------------------------
  let allItems = [];
  try {
    const rows = await Api.list("MasterItems");
    allItems = rows
      .filter((r) => r.Code && String(r.Code).trim())
      .map((r) => ({
        code: String(r.Code).trim(),
        name: String(r["Item Name"] || r.Item_Name || "").trim(),
      }));

    // Sort by code alphabetically
    allItems.sort((a, b) => a.code.localeCompare(b.code));

    if (allItems.length === 0) {
      tbodyEl.innerHTML = `<tr><td colspan="3" style="text-align:center;padding:20px;color:#6b7280;">No items found in MasterItems.</td></tr>`;
      return;
    }

    // Build rows
    let html = "";
    allItems.forEach((item) => {
      html += `
        <tr data-code="${item.code}" data-name="${item.name.toLowerCase()}">
          <td>${item.code}</td>
          <td>${item.name}</td>
          <td>
            <input type="text"
                   class="entry-item-qty"
                   data-code="${item.code}"
                   inputmode="decimal"
                   placeholder="0">
          </td>
        </tr>
      `;
    });
    tbodyEl.innerHTML = html;

    // Attach input events
    tbodyEl.querySelectorAll(".entry-item-qty").forEach((inp) => {
      inp.addEventListener("input", () => {
        formatDec_(inp);
        recalcGrandTotal();
      });
    });

    recalcGrandTotal();

  } catch (err) {
    tbodyEl.innerHTML = `<tr><td colspan="3" style="text-align:center;padding:20px;color:#b23b3b;">Failed to load items: ${err.message}</td></tr>`;
    return;
  }

  // -------------------------------------------------------------------
  // Search filter (code + name)
  // -------------------------------------------------------------------
  searchEl.addEventListener("input", () => {
    const q = String(searchEl.value || "").trim().toLowerCase();
    tbodyEl.querySelectorAll("tr").forEach((tr) => {
      const code = String(tr.dataset.code || "").toLowerCase();
      const name = String(tr.dataset.name || "").toLowerCase();
      const match = !q || code.includes(q) || name.includes(q);
      tr.classList.toggle("item-hidden", !match);
    });
  });

  // -------------------------------------------------------------------
  // Clear button
  // -------------------------------------------------------------------
  document.getElementById("prdClearBtn").addEventListener("click", () => {
    if (!confirm("Clear all quantities?")) return;
    tbodyEl.querySelectorAll(".entry-item-qty").forEach((inp) => { inp.value = ""; });
    searchEl.value = "";
    tbodyEl.querySelectorAll("tr").forEach((tr) => tr.classList.remove("item-hidden"));
    recalcGrandTotal();
  });

  // -------------------------------------------------------------------
  // Save (placeholder)
  // -------------------------------------------------------------------
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const items = [];
    tbodyEl.querySelectorAll(".entry-item-qty").forEach((inp) => {
      const qty = parseNum_(inp);
      if (qty > 0) {
        const tr = inp.closest("tr");
        items.push({
          Item_Code: tr.dataset.code,
          Item_Name: tr.querySelector("td:nth-child(2)").textContent.trim(),
          Weight: qty,
        });
      }
    });

    const payload = {
      Date:  dateEl.value,
      items: items,
      total: parseFloat(grandTotalEl.textContent.replace(/,/g, "")) || 0,
    };

    console.log("[Production Detail Entry] Payload ready:", payload);
    alert(`✅ Payload ready!\n\nDate: ${payload.Date}\nItems: ${items.length}\nTotal: ${payload.total}\n\nBackend API integration next step එකේදී save වෙයි.\n\nConsole එකේ full payload බලන්න.`);
  });
}

// ===================================================================
// DATA ENTRY — Blast Freezer
// ===================================================================
async function initBlastFreezerEntry() {
  const container = document.getElementById("view-entry-blast-freezer");
  if (!container || container.dataset.bound === "true") return;
  container.dataset.bound = "true";

  // -------------------------------------------------------------------
  // Tab switching
  // -------------------------------------------------------------------
  const tabs = container.querySelectorAll(".bf-tab");
  const contents = container.querySelectorAll(".bf-tab-content");

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const target = tab.dataset.bfTab;
      tabs.forEach((t) => t.classList.toggle("active", t === tab));
      contents.forEach((c) => {
        c.classList.toggle("active", c.id === (target === "ledger" ? "bfTabLedger" : "bfTabInOut"));
      });
    });
  });

  // ===================================================================
  // TAB 1 — Daily Blast Freezer Inward Ledger (= Production Detail)
  // ===================================================================
  await initBfLedger_();

  // ===================================================================
  // TAB 2 — Blast Freezer In Time & Weight
  // ===================================================================
  initBfInOut_();
}

// -------------------------------------------------------------------
// TAB 1 — Ledger (same as Production Detail)
// -------------------------------------------------------------------
async function initBfLedger_() {
  const form = document.getElementById("form-bf-ledger");
  if (!form) return;

  const dateEl       = document.getElementById("bflDate");
  const searchEl     = document.getElementById("bflSearch");
  const tbodyEl      = document.getElementById("bflItemsBody");
  const grandTotalEl = document.getElementById("bflGrandTotal");

  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  if (!dateEl.value) dateEl.value = today;

  // Number formatting helpers
  function formatDec_(el) {
    let raw = String(el.value).replace(/[^\d.]/g, "");
    const firstDot = raw.indexOf(".");
    if (firstDot !== -1) {
      raw = raw.slice(0, firstDot + 1) + raw.slice(firstDot + 1).replace(/\./g, "");
    }
    if (raw === "") { el.value = ""; return 0; }
    const parts = raw.split(".");
    const intPart = parts[0] === "" ? "0" : parts[0];
    const intNum = parseInt(intPart, 10);
    const intFmt = intNum.toLocaleString("en-US");
    if (parts.length === 1) { el.value = intFmt; return intNum; }
    const decPart = (parts[1] || "").slice(0, 2);
    el.value = intFmt + "." + decPart;
    const n = parseFloat(intFmt.replace(/,/g, "") + (decPart ? "." + decPart : ""));
    return isFinite(n) ? n : intNum;
  }

  function parseNum_(el) {
    const v = String(el.value).replace(/,/g, "");
    const n = parseFloat(v);
    return isFinite(n) ? n : 0;
  }

  function recalcGrandTotal() {
    const inputs = tbodyEl.querySelectorAll(".entry-item-qty");
    let total = 0;
    inputs.forEach((inp) => { total += parseNum_(inp); });
    grandTotalEl.textContent = total.toLocaleString("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  }

  // Load items from MasterItems
  try {
    const rows = await Api.list("MasterItems");
    const items = rows
      .filter((r) => r.Code && String(r.Code).trim())
      .map((r) => ({
        code: String(r.Code).trim(),
        name: String(r["Item Name"] || r.Item_Name || "").trim(),
      }))
      .sort((a, b) => a.code.localeCompare(b.code));

    if (items.length === 0) {
      tbodyEl.innerHTML = `<tr><td colspan="3" style="text-align:center;padding:20px;color:#6b7280;">No items found.</td></tr>`;
      return;
    }

    let html = "";
    items.forEach((item) => {
      html += `
        <tr data-code="${item.code}" data-name="${item.name.toLowerCase()}">
          <td>${item.code}</td>
          <td>${item.name}</td>
          <td>
            <input type="text" class="entry-item-qty" data-code="${item.code}" inputmode="decimal" placeholder="0">
          </td>
        </tr>
      `;
    });
    tbodyEl.innerHTML = html;

    tbodyEl.querySelectorAll(".entry-item-qty").forEach((inp) => {
      inp.addEventListener("input", () => {
        formatDec_(inp);
        recalcGrandTotal();
      });
    });

    recalcGrandTotal();
  } catch (err) {
    tbodyEl.innerHTML = `<tr><td colspan="3" style="text-align:center;padding:20px;color:#b23b3b;">Failed to load items: ${err.message}</td></tr>`;
    return;
  }

  // Search filter
  searchEl.addEventListener("input", () => {
    const q = String(searchEl.value || "").trim().toLowerCase();
    tbodyEl.querySelectorAll("tr").forEach((tr) => {
      const code = String(tr.dataset.code || "").toLowerCase();
      const name = String(tr.dataset.name || "").toLowerCase();
      tr.classList.toggle("item-hidden", !(!q || code.includes(q) || name.includes(q)));
    });
  });

  // Clear
  document.getElementById("bflClearBtn").addEventListener("click", () => {
    if (!confirm("Clear all quantities?")) return;
    tbodyEl.querySelectorAll(".entry-item-qty").forEach((inp) => { inp.value = ""; });
    searchEl.value = "";
    tbodyEl.querySelectorAll("tr").forEach((tr) => tr.classList.remove("item-hidden"));
    recalcGrandTotal();
  });

  // Save (placeholder)
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const items = [];
    tbodyEl.querySelectorAll(".entry-item-qty").forEach((inp) => {
      const qty = parseNum_(inp);
      if (qty > 0) {
        const tr = inp.closest("tr");
        items.push({
          Item_Code: tr.dataset.code,
          Item_Name: tr.querySelector("td:nth-child(2)").textContent.trim(),
          Weight: qty,
        });
      }
    });
    console.log("[BF Ledger Entry] Payload ready:", {
      Date: dateEl.value,
      items,
      total: parseFloat(grandTotalEl.textContent.replace(/,/g, "")) || 0,
    });
    alert("✅ Payload ready! Console එකේ බලන්න.");
  });
}

// -------------------------------------------------------------------
// TAB 2 — Blast Freezer In Time & Weight
// -------------------------------------------------------------------
function initBfInOut_() {
  const form = document.getElementById("form-bf-inout");
  if (!form) return;

  const dateEl    = document.getElementById("bfDate");
  const batchEl   = document.getElementById("bfBatchNo");
  const tbodyEl   = document.getElementById("bfItemsBody");
  const addRowBtn = document.getElementById("bfAddRowBtn");

  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  if (!dateEl.value) dateEl.value = today;

  // Blast Freezer options
  const BF_OPTIONS_ = ["BF 01", "BF 02", "BF 03", "BF 04", "BF 05", "BF 06", "BF 07", "BF 08"];

  // -------------------------------------------------------------------
  // Number formatting (decimal)
  // -------------------------------------------------------------------
  function formatDec_(el) {
    let raw = String(el.value).replace(/[^\d.]/g, "");
    const firstDot = raw.indexOf(".");
    if (firstDot !== -1) {
      raw = raw.slice(0, firstDot + 1) + raw.slice(firstDot + 1).replace(/\./g, "");
    }
    if (raw === "") { el.value = ""; return 0; }
    const parts = raw.split(".");
    const intPart = parts[0] === "" ? "0" : parts[0];
    const intNum = parseInt(intPart, 10);
    const intFmt = intNum.toLocaleString("en-US");
    if (parts.length === 1) { el.value = intFmt; return intNum; }
    const decPart = (parts[1] || "").slice(0, 2);
    el.value = intFmt + "." + decPart;
    const n = parseFloat(intFmt.replace(/,/g, "") + (decPart ? "." + decPart : ""));
    return isFinite(n) ? n : intNum;
  }

  function parseNum_(el) {
    const v = String(el.value).replace(/,/g, "");
    const n = parseFloat(v);
    return isFinite(n) ? n : 0;
  }

  // -------------------------------------------------------------------
  // Update row numbers after add/remove
  // -------------------------------------------------------------------
  function renumberRows_() {
    tbodyEl.querySelectorAll("tr").forEach((tr, i) => {
      tr.querySelector(".bf-row-num").textContent = i + 1;
    });
  }

  // -------------------------------------------------------------------
  // Add a new row
  // -------------------------------------------------------------------
  function addRow_() {
    const tr = document.createElement("tr");

    // Row number
    const tdNum = document.createElement("td");
    tdNum.className = "bf-row-num";
    tdNum.textContent = "1";
    tr.appendChild(tdNum);

    // Blast Freezer No — dropdown
    const tdBF = document.createElement("td");
    const sel = document.createElement("select");
    sel.className = "entry-item-select";
    sel.innerHTML = `<option value="">-- Select --</option>` +
      BF_OPTIONS_.map((o) => `<option value="${o}">${o}</option>`).join("");
    tdBF.appendChild(sel);
    tr.appendChild(tdBF);

    // In Time
    const tdTime = document.createElement("td");
    const timeInput = document.createElement("input");
    timeInput.type = "time";
    timeInput.step = "60";
    timeInput.className = "entry-item-time";
    tdTime.appendChild(timeInput);
    tr.appendChild(tdTime);

    // Weight
    const tdW = document.createElement("td");
    const wInput = document.createElement("input");
    wInput.type = "text";
    wInput.className = "entry-item-qty";
    wInput.inputMode = "decimal";
    wInput.placeholder = "0.00";
    wInput.addEventListener("input", () => formatDec_(wInput));
    tdW.appendChild(wInput);
    tr.appendChild(tdW);

    // Delete button
    const tdDel = document.createElement("td");
    const delBtn = document.createElement("button");
    delBtn.type = "button";
    delBtn.className = "btn-del-row";
    delBtn.textContent = "✕";
    delBtn.title = "Remove row";
    delBtn.addEventListener("click", () => {
      tr.remove();
      renumberRows_();
    });
    tdDel.appendChild(delBtn);
    tr.appendChild(tdDel);

    tbodyEl.appendChild(tr);
    renumberRows_();
  }

  // Fix typo helper — actual append
  // (Handled in addRow_ properly below)

  // -------------------------------------------------------------------
  // Add Row button
  // -------------------------------------------------------------------
  addRowBtn.addEventListener("click", addRow_);

  // Add first row by default
  addRow_();

  // Clear
  document.getElementById("bfClearBtn").addEventListener("click", () => {
    if (!confirm("Clear all fields?")) return;
    form.reset();
    dateEl.value = today;
    tbodyEl.innerHTML = "";
    addRow_();
  });

  // Save (placeholder)
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const rows = [];
    tbodyEl.querySelectorAll("tr").forEach((tr) => {
      const bfNo  = tr.querySelector(".entry-item-select")?.value || "";
      const time  = tr.querySelector(".entry-item-time")?.value || "";
      const wtInp = tr.querySelector(".entry-item-qty");
      const wt    = wtInp ? parseNum_(wtInp) : 0;

      if (bfNo || time || wt > 0) {
        rows.push({
          Blast_Freezer_No: bfNo,
          In_Time:          time,
          Weight:           wt,
        });
      }
    });

    const payload = {
      Date:      dateEl.value,
      Batch_No:  batchEl.value.trim(),
      rows:      rows,
    };

    console.log("[BF In/Out Entry] Payload ready:", payload);
    alert(`✅ Payload ready!\n\nDate: ${payload.Date}\nBatch: ${payload.Batch_No}\nRows: ${rows.length}\n\nConsole එකේ බලන්න.`);
  });
}

// ===================================================================
// DATA ENTRY — Giblet Use for W/Chicken
// ===================================================================
function initGibletEntry() {
  const form = document.getElementById("form-giblet");
  if (!form || form.dataset.bound === "true") return;
  form.dataset.bound = "true";

  const dateEl = document.getElementById("gibDate");
  const qtyEl  = document.getElementById("gibQty");

  // Default today's date
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  if (!dateEl.value) dateEl.value = today;

  // ----- Decimal formatting (#,###.##) -----
  function formatDec_(el) {
    let raw = String(el.value).replace(/[^\d.]/g, "");
    const firstDot = raw.indexOf(".");
    if (firstDot !== -1) {
      raw = raw.slice(0, firstDot + 1) + raw.slice(firstDot + 1).replace(/\./g, "");
    }
    if (raw === "") { el.value = ""; return 0; }

    const parts = raw.split(".");
    const intPart = parts[0] === "" ? "0" : parts[0];
    const intNum  = parseInt(intPart, 10);
    const intFmt  = intNum.toLocaleString("en-US");

    if (parts.length === 1) { el.value = intFmt; return intNum; }
    const decPart = (parts[1] || "").slice(0, 2);
    el.value = intFmt + "." + decPart;
    const n = parseFloat(intFmt.replace(/,/g, "") + (decPart ? "." + decPart : ""));
    return isFinite(n) ? n : intNum;
  }

  function parseNum_(el) {
    const v = String(el.value).replace(/,/g, "");
    const n = parseFloat(v);
    return isFinite(n) ? n : 0;
  }

  // Input formatter
  qtyEl.addEventListener("input", () => formatDec_(qtyEl));

  // Clear
  document.getElementById("gibClearBtn").addEventListener("click", () => {
    if (!confirm("Clear all fields?")) return;
    form.reset();
    dateEl.value = today;
  });

  // Save (placeholder)
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const payload = {
      Date:                 dateEl.value,
      Giblet_Use:           parseNum_(qtyEl),
    };

    console.log("[Giblet Entry] Payload ready:", payload);
    alert("✅ Payload ready!\n\nBackend API integration next step එකේදී save වෙයි.\n\nConsole එකේ payload බලන්න.");
  });
}

// ===================================================================
// DATA ENTRY — Daily Production Easy Material (WIP)
// ===================================================================
function initEasyMaterialEntry() {
  const form = document.getElementById("form-easy-material");
  if (!form || form.dataset.bound === "true") return;
  form.dataset.bound = "true";

  const dateEl = document.getElementById("emDate");
  const qtyEl  = document.getElementById("emQty");

  // Default today's date
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  if (!dateEl.value) dateEl.value = today;

  // ----- Decimal formatting (#,###.##) -----
  function formatDec_(el) {
    let raw = String(el.value).replace(/[^\d.]/g, "");
    const firstDot = raw.indexOf(".");
    if (firstDot !== -1) {
      raw = raw.slice(0, firstDot + 1) + raw.slice(firstDot + 1).replace(/\./g, "");
    }
    if (raw === "") { el.value = ""; return 0; }

    const parts = raw.split(".");
    const intPart = parts[0] === "" ? "0" : parts[0];
    const intNum  = parseInt(intPart, 10);
    const intFmt  = intNum.toLocaleString("en-US");

    if (parts.length === 1) { el.value = intFmt; return intNum; }
    const decPart = (parts[1] || "").slice(0, 2);
    el.value = intFmt + "." + decPart;
    const n = parseFloat(intFmt.replace(/,/g, "") + (decPart ? "." + decPart : ""));
    return isFinite(n) ? n : intNum;
  }

  function parseNum_(el) {
    const v = String(el.value).replace(/,/g, "");
    const n = parseFloat(v);
    return isFinite(n) ? n : 0;
  }

  // Input formatter
  qtyEl.addEventListener("input", () => formatDec_(qtyEl));

  // Clear
  document.getElementById("emClearBtn").addEventListener("click", () => {
    if (!confirm("Clear all fields?")) return;
    form.reset();
    dateEl.value = today;
  });

  // Save (placeholder)
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const payload = {
      Date:                 dateEl.value,
      Easy_Material_WIP:    parseNum_(qtyEl),
    };

    console.log("[Easy Material Entry] Payload ready:", payload);
    alert("✅ Payload ready!\n\nBackend API integration next step එකේදී save වෙයි.\n\nConsole එකේ payload බලන්න.");
  });
}

// ===================================================================
// DATA ENTRY — Daily Easy Production
// ===================================================================
async function initEasyProductionEntry() {
  const form = document.getElementById("form-easy-production");
  if (!form || form.dataset.bound === "true") return;
  form.dataset.bound = "true";

  const dateEl       = document.getElementById("epDate");
  const searchEl     = document.getElementById("epSearch");
  const tbodyEl      = document.getElementById("epItemsBody");
  const grandTotalEl = document.getElementById("epGrandTotal");
  const netWeightEl  = document.getElementById("epNetWeight");

  // Default today's date
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  if (!dateEl.value) dateEl.value = today;

  // -------------------------------------------------------------------
  // Number formatting helpers
  // -------------------------------------------------------------------
  function formatDec_(el) {
    let raw = String(el.value).replace(/[^\d.]/g, "");
    const firstDot = raw.indexOf(".");
    if (firstDot !== -1) {
      raw = raw.slice(0, firstDot + 1) + raw.slice(firstDot + 1).replace(/\./g, "");
    }
    if (raw === "") { el.value = ""; return 0; }
    const parts = raw.split(".");
    const intPart = parts[0] === "" ? "0" : parts[0];
    const intNum = parseInt(intPart, 10);
    const intFmt = intNum.toLocaleString("en-US");
    if (parts.length === 1) { el.value = intFmt; return intNum; }
    const decPart = (parts[1] || "").slice(0, 2);
    el.value = intFmt + "." + decPart;
    const n = parseFloat(intFmt.replace(/,/g, "") + (decPart ? "." + decPart : ""));
    return isFinite(n) ? n : intNum;
  }

  function parseNum_(el) {
    const v = String(el.value).replace(/,/g, "");
    const n = parseFloat(v);
    return isFinite(n) ? n : 0;
  }

  // -------------------------------------------------------------------
  // Grand total (sum of all item quantities)
  // -------------------------------------------------------------------
  function recalcGrandTotal() {
    let total = 0;
    tbodyEl.querySelectorAll(".entry-item-qty").forEach((inp) => {
      total += parseNum_(inp);
    });
    grandTotalEl.textContent = total.toLocaleString("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  }

  // -------------------------------------------------------------------
  // Load items from MasterItemsEasy
  // -------------------------------------------------------------------
  try {
    const rows = await Api.list("MasterItemsEasy");
    const items = rows
      .filter((r) => r.Code && String(r.Code).trim())
      .map((r) => ({
        code: String(r.Code).trim(),
        name: String(r["Item Name"] || r.Item_Name || "").trim(),
      }))
      .sort((a, b) => a.code.localeCompare(b.code));

    if (items.length === 0) {
      tbodyEl.innerHTML = `<tr><td colspan="3" style="text-align:center;padding:20px;color:#6b7280;">No items found in MasterItemsEasy.</td></tr>`;
      return;
    }

    let html = "";
    items.forEach((item) => {
      html += `
        <tr data-code="${item.code}" data-name="${item.name.toLowerCase()}">
          <td>${item.code}</td>
          <td>${item.name}</td>
          <td>
            <input type="text"
                   class="entry-item-qty"
                   data-code="${item.code}"
                   inputmode="decimal"
                   placeholder="0">
          </td>
        </tr>
      `;
    });
    tbodyEl.innerHTML = html;

    tbodyEl.querySelectorAll(".entry-item-qty").forEach((inp) => {
      inp.addEventListener("input", () => {
        formatDec_(inp);
        recalcGrandTotal();
      });
    });

    recalcGrandTotal();

  } catch (err) {
    tbodyEl.innerHTML = `<tr><td colspan="3" style="text-align:center;padding:20px;color:#b23b3b;">Failed to load items: ${err.message}</td></tr>`;
    return;
  }

  // -------------------------------------------------------------------
  // Net Weight input formatter
  // -------------------------------------------------------------------
  netWeightEl.addEventListener("input", () => formatDec_(netWeightEl));

  // -------------------------------------------------------------------
  // Search filter
  // -------------------------------------------------------------------
  searchEl.addEventListener("input", () => {
    const q = String(searchEl.value || "").trim().toLowerCase();
    tbodyEl.querySelectorAll("tr").forEach((tr) => {
      const code = String(tr.dataset.code || "").toLowerCase();
      const name = String(tr.dataset.name || "").toLowerCase();
      tr.classList.toggle("item-hidden", !(!q || code.includes(q) || name.includes(q)));
    });
  });

  // -------------------------------------------------------------------
  // Clear button
  // -------------------------------------------------------------------
  document.getElementById("epClearBtn").addEventListener("click", () => {
    if (!confirm("Clear all quantities?")) return;
    tbodyEl.querySelectorAll(".entry-item-qty").forEach((inp) => { inp.value = ""; });
    netWeightEl.value = "";
    searchEl.value = "";
    tbodyEl.querySelectorAll("tr").forEach((tr) => tr.classList.remove("item-hidden"));
    recalcGrandTotal();
  });

  // -------------------------------------------------------------------
  // Save (placeholder)
  // -------------------------------------------------------------------
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const items = [];
    tbodyEl.querySelectorAll(".entry-item-qty").forEach((inp) => {
      const qty = parseNum_(inp);
      if (qty > 0) {
        const tr = inp.closest("tr");
        items.push({
          Item_Code: tr.dataset.code,
          Item_Name: tr.querySelector("td:nth-child(2)").textContent.trim(),
          Weight: qty,
        });
      }
    });

    const payload = {
      Date:                  dateEl.value,
      items:                 items,
      totalEasyProductWeight: parseFloat(grandTotalEl.textContent.replace(/,/g, "")) || 0,
      usedEasyMaterialNetWeight: parseNum_(netWeightEl),
    };

    console.log("[Easy Production Entry] Payload ready:", payload);
    alert(`✅ Payload ready!\n\nDate: ${payload.Date}\nItems: ${items.length}\nTotal: ${payload.totalEasyProductWeight}\nNet Weight: ${payload.usedEasyMaterialNetWeight}\n\nConsole එකේ full payload බලන්න.`);
  });
}

// ===================================================================
// DATA ENTRY — CSV Uploads
// ===================================================================
function initCsvUploadsEntry() {
  const container = document.getElementById("view-entry-csv-uploads");
  if (!container || container.dataset.bound === "true") return;
  container.dataset.bound = "true";

  // Default date for Opening Stock
  const openingDateEl = document.getElementById("csvOpeningDate");
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  if (!openingDateEl.value) openingDateEl.value = today;

  // Bind all 3 uploaders
  setupCsvUploader_({
    formId:     "form-csv-daily-target",
    fileId:     "csvTargetFile",
    fileNameId: "csvTargetFileName",
    previewId:  "csvTargetPreview",
    clearBtnId: "csvTargetClearBtn",
    sheetName:  "DailyTarget",
  });

  setupCsvUploader_({
    formId:     "form-csv-livebird-req",
    fileId:     "csvBirdReqFile",
    fileNameId: "csvBirdReqFileName",
    previewId:  "csvBirdReqPreview",
    clearBtnId: "csvBirdReqClearBtn",
    sheetName:  "DataProductionBirdReq",
  });

  setupCsvUploader_({
    formId:     "form-csv-opening-stock",
    fileId:     "csvOpeningFile",
    fileNameId: "csvOpeningFileName",
    previewId:  "csvOpeningPreview",
    clearBtnId: "csvOpeningClearBtn",
    sheetName:  "DataProductionStock",
    dateId:     "csvOpeningDate",
  });
}

// -------------------------------------------------------------------
// Generic CSV/Excel uploader setup
// -------------------------------------------------------------------
function setupCsvUploader_({ formId, fileId, fileNameId, previewId, clearBtnId, sheetName, dateId }) {
  const form       = document.getElementById(formId);
  const fileInput  = document.getElementById(fileId);
  const fileName   = document.getElementById(fileNameId);
  const previewEl  = document.getElementById(previewId);
  const clearBtn   = document.getElementById(clearBtnId);
  const dateEl     = dateId ? document.getElementById(dateId) : null;

  if (!form || !fileInput || !fileName || !previewEl) return;

  let parsedData = null;    // { headers, rows, fileName }

  // ----- Update file name label -----
  function updateFileName_() {
    if (fileInput.files && fileInput.files.length > 0) {
      fileName.textContent = fileInput.files[0].name;
      fileName.classList.remove("empty");
    } else {
      fileName.textContent = "No file chosen";
      fileName.classList.add("empty");
    }
  }
  updateFileName_();

  // ----- File change -----
  fileInput.addEventListener("change", async () => {
    updateFileName_();
    previewEl.classList.remove("visible");
    previewEl.innerHTML = "";
    parsedData = null;

    const file = fileInput.files && fileInput.files[0];
    if (!file) return;

    const ext = String(file.name).split(".").pop().toLowerCase();

    try {
      let headers = [];
      let rows = [];

      if (ext === "csv") {
        const text = await file.text();
        const parsed = parseCsvText_(text);
        headers = parsed.headers;
        rows    = parsed.rows;
            } else if (ext === "xlsx" || ext === "xls") {
        // 🆕 XLSX / XLS — SheetJS use කරන්න
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: "array", cellDates: true });

        // Only the first sheet
        const firstSheetName = workbook.SheetNames[0];
        if (!firstSheetName) {
          previewEl.innerHTML = `<div class="csv-preview-error">Excel file has no sheets.</div>`;
          previewEl.classList.add("visible");
          return;
        }

        const ws = workbook.Sheets[firstSheetName];
        const sheetRows = XLSX.utils.sheet_to_json(ws, {
          defval: "",
          raw: false,
          dateNF: "yyyy-mm-dd",
        });

        // If sheet is empty
        if (!sheetRows.length) {
          previewEl.innerHTML = `<div class="csv-preview-error">Sheet "${escapeHtml_(firstSheetName)}" is empty.</div>`;
          previewEl.classList.add("visible");
          return;
        }

        // Extract headers from the first row
        headers = Object.keys(sheetRows[0]);
        rows = sheetRows.map((r) => {
          const obj = {};
          headers.forEach((h) => {
            obj[h] = r[h] !== undefined ? String(r[h]).trim() : "";
          });
          return obj;
        });

      } else {
        previewEl.innerHTML = `<div class="csv-preview-error">Unsupported file type: .${ext}</div>`;
        previewEl.classList.add("visible");
        return;
      }

      if (!headers.length || !rows.length) {
        previewEl.innerHTML = `<div class="csv-preview-error">File is empty or invalid.</div>`;
        previewEl.classList.add("visible");
        return;
      }

      parsedData = { headers, rows, fileName: file.name };

      // Preview render
      const previewRows = rows.slice(0, 5);
      const headersHtml = headers.map((h) => `<th>${escapeHtml_(h)}</th>`).join("");
      const rowsHtml = previewRows.map((r) =>
        "<tr>" + headers.map((h) => `<td>${escapeHtml_(r[h] ?? "")}</td>`).join("") + "</tr>"
      ).join("");

      previewEl.innerHTML = `
        <div class="csv-preview-header">
          <span>📄 ${escapeHtml_(file.name)}</span>
          <span class="csv-preview-badge">${rows.length} row${rows.length !== 1 ? "s" : ""} loaded</span>
        </div>
        <table class="csv-preview-table">
          <thead><tr>${headersHtml}</tr></thead>
          <tbody>${rowsHtml}</tbody>
        </table>
        ${rows.length > 5 ? `<p style="margin:8px 0 0 0;color:#6b7280;font-size:11px;">Showing first 5 of ${rows.length} rows.</p>` : ""}
      `;
      previewEl.classList.add("visible");

    } catch (err) {
      previewEl.innerHTML = `<div class="csv-preview-error">Failed to parse file: ${escapeHtml_(err.message)}</div>`;
      previewEl.classList.add("visible");
    }
  });

  // ----- Clear -----
  clearBtn.addEventListener("click", () => {
    if (!confirm("Clear this upload?")) return;
    form.reset();
    updateFileName_();
    previewEl.classList.remove("visible");
    previewEl.innerHTML = "";
    parsedData = null;
    if (dateEl) dateEl.value = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}-${String(new Date().getDate()).padStart(2, "0")}`;
  });

  // ----- Submit (placeholder) -----
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    if (!parsedData) {
      alert("Please choose a CSV file first.");
      return;
    }

    const payload = {
      sheetName: sheetName,
      date: dateEl ? dateEl.value : null,
      fileName: parsedData.fileName,
      headers: parsedData.headers,
      rowCount: parsedData.rows.length,
      rows: parsedData.rows,
    };

    console.log(`[CSV Upload — ${sheetName}] Payload ready:`, payload);
    alert(`✅ CSV parsed!\n\nSheet: ${sheetName}\nRows: ${payload.rowCount}\n${dateEl ? "Date: " + payload.date + "\n" : ""}\nBackend integration next step එකේදී upload වෙයි.\n\nConsole එකේ full payload බලන්න.`);
  });
}

// ===================================================================
// DATA ENTRY — Consumable Records (6 tabs)
// ===================================================================
async function initConsumableEntry() {
  const container = document.getElementById("view-entry-consumable");
  if (!container || container.dataset.bound === "true") return;
  container.dataset.bound = "true";

  // Tab switching
  const tabs     = container.querySelectorAll(".cons-tab");
  const contents = container.querySelectorAll(".cons-tab-content");

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const target = tab.dataset.consTab;
      tabs.forEach((t) => t.classList.toggle("active", t === tab));
      contents.forEach((c) => {
        c.classList.toggle("active", c.id === `consTab${target}`);
      });
    });
  });

  // Config for each tab
  const TABS = [
    { key: "LB",       sheet: "MasterConsumableLB",       dateId: "consLbDate",       searchId: "consLbSearch",       bodyId: "consLbBody",       totalId: "consLbTotal",       formId: "form-cons-lb" },
    { key: "EV",       sheet: "MasterConsumableEV",       dateId: "consEvDate",       searchId: "consEvSearch",       bodyId: "consEvBody",       totalId: "consEvTotal",       formId: "form-cons-ev" },
    { key: "FBP",      sheet: "MasterConsumableFBP",      dateId: "consFbpDate",      searchId: "consFbpSearch",      bodyId: "consFbpBody",      totalId: "consFbpTotal",      formId: "form-cons-fbp" },
    { key: "Packing",  sheet: "MasterConsumablePacking",  dateId: "consPackingDate",  searchId: "consPackingSearch",  bodyId: "consPackingBody",  totalId: "consPackingTotal",  formId: "form-cons-packing" },
    { key: "Packing2", sheet: "MasterConsumablePacking2", dateId: "consPacking2Date", searchId: "consPacking2Search", bodyId: "consPacking2Body", totalId: "consPacking2Total", formId: "form-cons-packing2" },
    { key: "Easy",     sheet: "MasterConsumableEasy",     dateId: "consEasyDate",     searchId: "consEasySearch",     bodyId: "consEasyBody",     totalId: "consEasyTotal",     formId: "form-cons-easy" },
  ];

  // Initialize each tab sequentially
  for (const cfg of TABS) {
    await setupConsumableTab_(cfg);
  }

  // Clear buttons (event delegation)
  container.querySelectorAll("[data-cons-clear]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const k = btn.dataset.consClear;
      const cfg = TABS.find((t) => t.key === k);
      if (!cfg) return;
      if (!confirm("Clear all quantities?")) return;
      const bodyEl  = document.getElementById(cfg.bodyId);
      const searchEl = document.getElementById(cfg.searchId);
      const dateEl   = document.getElementById(cfg.dateId);
      bodyEl.querySelectorAll(".entry-item-qty").forEach((inp) => { inp.value = ""; });
      searchEl.value = "";
      bodyEl.querySelectorAll("tr").forEach((tr) => tr.classList.remove("item-hidden"));
      const today = getTodayStr_();
      if (dateEl) dateEl.value = today;
      recalcConsumableTotal_(bodyEl, cfg.totalId);
    });
  });
}

// -------------------------------------------------------------------
// Setup one Consumable tab
// -------------------------------------------------------------------
async function setupConsumableTab_(cfg) {
  const dateEl   = document.getElementById(cfg.dateId);
  const searchEl = document.getElementById(cfg.searchId);
  const bodyEl   = document.getElementById(cfg.bodyId);
  const formEl   = document.getElementById(cfg.formId);

  if (!bodyEl || !formEl) return;

  // Default today's date
  if (dateEl && !dateEl.value) dateEl.value = getTodayStr_();

  // Load items from sheet
  try {
    const rows = await Api.list(cfg.sheet);
    // Item Name is the header — filter out empties
    const items = rows
      .map((r) => String(r["Item Name"] || r.Item_Name || r.ItemName || "").trim())
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));

    if (items.length === 0) {
      bodyEl.innerHTML = `<tr><td colspan="2" style="text-align:center;padding:20px;color:#6b7280;">No items found in ${cfg.sheet}.</td></tr>`;
      return;
    }

    let html = "";
    items.forEach((name) => {
      const safe = escapeHtml_(name);
      html += `
        <tr data-name="${safe.toLowerCase()}">
          <td>${safe}</td>
          <td>
            <input type="text" class="entry-item-qty" inputmode="decimal" placeholder="0">
          </td>
        </tr>
      `;
    });
    bodyEl.innerHTML = html;

    // Attach input events
    bodyEl.querySelectorAll(".entry-item-qty").forEach((inp) => {
      inp.addEventListener("input", () => {
        formatConsumableDec_(inp);
        recalcConsumableTotal_(bodyEl, cfg.totalId);
      });
    });

    recalcConsumableTotal_(bodyEl, cfg.totalId);

  } catch (err) {
    bodyEl.innerHTML = `<tr><td colspan="2" style="text-align:center;padding:20px;color:#b23b3b;">Failed to load items: ${escapeHtml_(err.message)}</td></tr>`;
    return;
  }

  // Search filter
  searchEl.addEventListener("input", () => {
    const q = String(searchEl.value || "").trim().toLowerCase();
    bodyEl.querySelectorAll("tr").forEach((tr) => {
      const name = String(tr.dataset.name || "").toLowerCase();
      tr.classList.toggle("item-hidden", !(!q || name.includes(q)));
    });
  });

  // Submit (placeholder)
  formEl.addEventListener("submit", (e) => {
    e.preventDefault();

    const items = [];
    bodyEl.querySelectorAll(".entry-item-qty").forEach((inp) => {
      const qty = parseConsumableNum_(inp);
      if (qty > 0) {
        const tr = inp.closest("tr");
        items.push({
          Item_Name: tr.dataset.name,
          Qty: qty,
        });
      }
    });

    const payload = {
      Sheet: cfg.sheet,
      Date: dateEl ? dateEl.value : null,
      items,
      total: items.reduce((s, i) => s + i.Qty, 0),
    };

    console.log(`[Consumable — ${cfg.key}] Payload ready:`, payload);
    alert(`✅ Payload ready!\n\nTab: ${cfg.key}\nSheet: ${cfg.sheet}\nItems: ${items.length}\n\nConsole එකේ full payload බලන්න.`);
  });
}

// -------------------------------------------------------------------
// Number formatting + parsing helpers
// -------------------------------------------------------------------
function getTodayStr_() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function formatConsumableDec_(el) {
  let raw = String(el.value).replace(/[^\d.]/g, "");
  const firstDot = raw.indexOf(".");
  if (firstDot !== -1) {
    raw = raw.slice(0, firstDot + 1) + raw.slice(firstDot + 1).replace(/\./g, "");
  }
  if (raw === "") { el.value = ""; return 0; }
  const parts = raw.split(".");
  const intPart = parts[0] === "" ? "0" : parts[0];
  const intNum  = parseInt(intPart, 10);
  const intFmt  = intNum.toLocaleString("en-US");
  if (parts.length === 1) { el.value = intFmt; return intNum; }
  const decPart = (parts[1] || "").slice(0, 2);
  el.value = intFmt + "." + decPart;
  const n = parseFloat(intFmt.replace(/,/g, "") + (decPart ? "." + decPart : ""));
  return isFinite(n) ? n : intNum;
}

function parseConsumableNum_(el) {
  const v = String(el.value).replace(/,/g, "");
  const n = parseFloat(v);
  return isFinite(n) ? n : 0;
}

function recalcConsumableTotal_(bodyEl, totalId) {
  let total = 0;
  bodyEl.querySelectorAll(".entry-item-qty").forEach((inp) => {
    total += parseConsumableNum_(inp);
  });
  const totalEl = document.getElementById(totalId);
  if (totalEl) {
    totalEl.textContent = total.toLocaleString("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  }
}

// -------------------------------------------------------------------
// Simple CSV parser (handles quotes + commas)
// -------------------------------------------------------------------
function parseCsvText_(text) {
  // Normalize line endings
  const lines = String(text).replace(/\r\n?/g, "\n").split("\n").filter((l) => l.length > 0);
  if (lines.length === 0) return { headers: [], rows: [] };

  function parseLine_(line) {
    const cells = [];
    let cur = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (inQuotes) {
        if (ch === '"' && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else if (ch === '"') {
          inQuotes = false;
        } else {
          cur += ch;
        }
      } else {
        if (ch === '"') {
          inQuotes = true;
        } else if (ch === ",") {
          cells.push(cur);
          cur = "";
        } else {
          cur += ch;
        }
      }
    }
    cells.push(cur);
    return cells;
  }

  const headers = parseLine_(lines[0]).map((h) => h.trim());
  const rows = lines.slice(1).map((line) => {
    const cells = parseLine_(line);
    const obj = {};
    headers.forEach((h, i) => {
      obj[h] = (cells[i] !== undefined ? cells[i] : "").trim();
    });
    return obj;
  });

  return { headers, rows };
}

// -------------------------------------------------------------------
// HTML escape
// -------------------------------------------------------------------
function escapeHtml_(v) {
  return String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// ===================================================================
// DATA ENTRY — Daily Live Birds Input
// ===================================================================
function initDailyLbEntry() {
  const form = document.getElementById("form-daily-lb");
  if (!form || form.dataset.bound === "true") return;
  form.dataset.bound = "true";

  // ----- Field references -----
  const F = {
    date:               document.getElementById("dlbDate"),
    location:           document.getElementById("dlbLocation"),
    loadingStart:       document.getElementById("dlbLoadingStart"),
    unloadingTime:      document.getElementById("dlbUnloadingTime"),
    birds:              document.getElementById("dlbBirds"),
    liveWeight:         document.getElementById("dlbLiveWeight"),
    avgWeight:          document.getElementById("dlbAvgWeight"),
    transportMort:      document.getElementById("dlbTransportMort"),
    transportMortW:     document.getElementById("dlbTransportMortWeight"),
    bayMort:            document.getElementById("dlbBayMort"),
    bayMortW:           document.getElementById("dlbBayMortWeight"),
    totalDeadW:         document.getElementById("dlbTotalDeadWeight"),
    halalRej:           document.getElementById("dlbHalalRej"),
    halalRejW:          document.getElementById("dlbHalalRejWeight"),
    otherRej:           document.getElementById("dlbOtherRej"),
    otherRejW:          document.getElementById("dlbOtherRejWeight"),
    totalRejW:          document.getElementById("dlbTotalRejWeight"),
    birdsToPlant:       document.getElementById("dlbBirdsToPlant"),
    liveWToPlant:       document.getElementById("dlbLiveWeightToPlant"),
  };

  // ----- Default today's date -----
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  if (!F.date.value) F.date.value = today;

  // ----- Number formatting helpers -----
  function formatInt_(el) {
    const raw = String(el.value).replace(/[^\d]/g, "");
    if (!raw) return 0;
    const n = parseInt(raw, 10);
    el.value = n.toLocaleString("en-US");
    return n;
  }

  function formatDec_(el) {
  // Strip non-digit, non-dot chars
  let raw = String(el.value).replace(/[^\d.]/g, "");

  // Keep only the first dot
  const firstDot = raw.indexOf(".");
  if (firstDot !== -1) {
    raw = raw.slice(0, firstDot + 1) + raw.slice(firstDot + 1).replace(/\./g, "");
  }

  // Empty → nothing to format
  if (raw === "") {
    el.value = "";
    return 0;
  }

  // Split integer / decimal parts
  const parts = raw.split(".");
  const intPart = parts[0] === "" ? "0" : parts[0];
  const intNum  = parseInt(intPart, 10);
  const intFmt  = intNum.toLocaleString("en-US");

  if (parts.length === 1) {
    // No decimal typed → keep integer only (no forced .00)
    el.value = intFmt;
    return intNum;
  }

  // Decimal typed → keep up to 2 digits (trailing typed state preserved)
  const decPart = (parts[1] || "").slice(0, 2);
  el.value = intFmt + "." + decPart;

  const n = parseFloat(intFmt.replace(/,/g, "") + (decPart ? "." + decPart : ""));
  return isFinite(n) ? n : intNum;
}

  function parseNum_(el) {
    const v = String(el.value).replace(/,/g, "");
    const n = parseFloat(v);
    return isFinite(n) ? n : 0;
  }

  function setAuto_(el, value, decimals) {
  if (!isFinite(value) || value === 0) {
    el.value = "";
    return;
  }
  el.value = value.toLocaleString("en-US", {
    minimumFractionDigits: 0,           // 🆕 trailing zeros hide
    maximumFractionDigits: decimals,    // still capped at 2
  });
}

  // ----- Auto-calculation -----
  function recalc() {
    const birds          = parseNum_(F.birds);
    const liveW          = parseNum_(F.liveWeight);
    const transportMort  = parseNum_(F.transportMort);
    const transportMortW = parseNum_(F.transportMortW);
    const bayMort        = parseNum_(F.bayMort);
    const bayMortW       = parseNum_(F.bayMortW);
    const halalRej       = parseNum_(F.halalRej);
    const halalRejW      = parseNum_(F.halalRejW);
    const otherRej       = parseNum_(F.otherRej);
    const otherRejW      = parseNum_(F.otherRejW);

    // F7 — Average Weight = Live Weight / No. of Birds
    const avgW = birds > 0 ? liveW / birds : 0;
    setAuto_(F.avgWeight, avgW, 2);

    // F12 — Total Dead Weight = Transport Mort W + Bay Mort W
    const totalDeadW = transportMortW + bayMortW;
    setAuto_(F.totalDeadW, totalDeadW, 2);

    // F17 — Total Rejected Weight = Halal Rej W + Other Rej W
    const totalRejW = halalRejW + otherRejW;
    setAuto_(F.totalRejW, totalRejW, 2);

    // F18 — Birds to Plant = Birds − (TransportMort + BayMort + HalalRej + OtherRej)
    const birdsToPlant = birds - (transportMort + bayMort + halalRej + otherRej);
    setAuto_(F.birdsToPlant, birdsToPlant, 0);

    // F19 — Live Weight to Plant = Live W − (TransportMort W + BayMort W + HalalRej W + OtherRej W)
    const liveWToPlant = liveW - (transportMortW + bayMortW + halalRejW + otherRejW);
    setAuto_(F.liveWToPlant, liveWToPlant, 2);
  }

  // ----- Attach events -----
  const intEls = [F.birds, F.transportMort, F.bayMort, F.halalRej, F.otherRej];
  const decEls = [F.liveWeight, F.transportMortW, F.bayMortW, F.halalRejW, F.otherRejW];

  intEls.forEach((el) => {
    el.addEventListener("input", () => { formatInt_(el); recalc(); });
  });
  decEls.forEach((el) => {
    el.addEventListener("input", () => { formatDec_(el); recalc(); });
  });

  // ----- Clear button -----
  document.getElementById("dlbClearBtn").addEventListener("click", () => {
    if (!confirm("Clear all fields?")) return;
    form.reset();
    F.date.value = today;
    recalc();
  });

  // ----- Save to Google Sheets (Data_LB_Summary + LoadingUnloadingTime) -----
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const saveBtn = document.getElementById("dlbSaveBtn");
    const originalText = saveBtn.textContent;

    // Collect + validate
    const dateVal     = F.date.value;
    const locationVal = F.location.value.trim();
    const startTime   = F.loadingStart.value;
    const endTime     = F.unloadingTime.value;

    if (!dateVal)     { alert("Please select a Date."); return; }
    if (!locationVal) { alert("Please enter a Location."); return; }
    if (!startTime)   { alert("Please enter Loading Start Time."); return; }
    if (!endTime)     { alert("Please enter Unloading Time."); return; }

    // ---- Auto timestamp (Google Sheet readable) ----
    const now = new Date();
    const timestampStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;

    // ============================================================
    // Row 1: Data_LB_Summary
    // ============================================================
    const lbSummaryRow = {
      Timestamp:                          timestampStr,
      Date:                               dateVal,
      Location:                           locationVal,
      No_of_birds:                        parseNum_(F.birds),
      Average_weight:                     parseNum_(F.avgWeight),
      Live_weight:                        parseNum_(F.liveWeight),
      Transport_Mortality:                parseNum_(F.transportMort),
      Transport_Mortality_Weight:         parseNum_(F.transportMortW),
      Bay_Mortality:                      parseNum_(F.bayMort),
      Bay_Mortality_Weight:               parseNum_(F.bayMortW),
      Total_Weight_of_dead_birds:         parseNum_(F.totalDeadW),
      Number_of_Halal_rejected_birds:     parseNum_(F.halalRej),
      Weight_of_Halal_rejected_birds:     parseNum_(F.halalRejW),
      Number_of_other_rejected_birds:     parseNum_(F.otherRej),
      Weight_of_other_rejected_birds:     parseNum_(F.otherRejW),
      Total_Weight_of_rejected_birds:     parseNum_(F.totalRejW),
      No_of_birds_to_plant:               parseNum_(F.birdsToPlant),
      Live_weight_to_plant:               parseNum_(F.liveWToPlant),
    };

    // ============================================================
    // Row 2: LoadingUnloadingTime
    // ============================================================
    const unloadingRow = {
      Timestamp:  timestampStr,
      Date:       dateVal,
      Location:   locationVal,
      Start_Time: startTime,      // "HH:MM" (24-hour)
      End_Time:   endTime,        // "HH:MM"
    };

    // Disable button while saving
    saveBtn.disabled = true;
    saveBtn.textContent = "⏳ Saving...";

    try {
      // Save to BOTH sheets in parallel
      const [r1, r2] = await Promise.all([
        Api.append("DataLBSummary",    [lbSummaryRow]),
        Api.append("Birds_Unloading",  [unloadingRow]),
      ]);

      if (r1 && r1.success && r2 && r2.success) {
        alert(`✅ Record saved successfully!\n\nDate: ${dateVal}\nLocation: ${locationVal}\n\nSaved to:\n• Data_LB_Summary\n• LoadingUnloadingTime`);
        form.reset();
        F.date.value = today;
        recalc();
      } else {
        const lbStatus  = r1 && r1.success ? "✅" : "❌";
        const unlStatus = r2 && r2.success ? "✅" : "❌";
        alert(`⚠️ Partial save:\n\n${lbStatus} Data_LB_Summary\n${unlStatus} LoadingUnloadingTime\n\nErrors:\n${r1?.error || "-"}\n${r2?.error || "-"}`);
      }
    } catch (err) {
      console.error("[Daily LB Entry] Save failed:", err);
      alert(`❌ Save failed: ${err.message}`);
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = originalText;
    }
  });

  // Initial calc
  recalc();
}

// ===================================================================
// KPI 01 — Bay Mortality
// ===================================================================
function initBayMortalityKpi() {
  const monthSelect = document.getElementById("kpi01Month");
  const yearSelect = document.getElementById("kpi01Year");
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

    const workingDays = await countWorkingDaysInMonth_(Number(year), Number(month));
const std = KPI_BAY_MORTALITY_STANDARD_;
const actualDays = report.days.filter(d => d.hasData).length;   // 🆕


// Actual = month overall = (Total Bay Mortality Birds ÷ Total Birds Received Alive) × 100
// 🆕 Only days where BOTH totalBirds AND bayMortality > 0
const dataDays = report.days.filter(d => d.hasData);
const sumBirds  = dataDays.reduce((s, d) => s + (d.totalBirds || 0), 0);
const sumMortal = dataDays.reduce((s, d) => s + (d.bayMortality || 0), 0);
const actualAvg = sumBirds > 0 ? (sumMortal / sumBirds) * 100 : 0;

// 🆕 Breakdown: total mortality birds ÷ total birds received alive
const kpi01Breakdown = sumBirds > 0 ? {
  figures: `${sumMortal.toLocaleString()} ÷ ${sumBirds.toLocaleString()} × 100 = ${actualAvg.toFixed(2)}%`,
  formula: `= (Total Bay Mortality Birds ÷ Total Birds Received Alive) × 100\n= ${sumMortal.toLocaleString()} ÷ ${sumBirds.toLocaleString()} × 100\n= ${actualAvg.toFixed(2)}%`
} : null;

updateKpiHeader("kpi-01", std, workingDays , actualDays , actualAvg, kpi01Breakdown);

    panel.innerHTML =
  wrapChartAndCards_(
    `<div class="panel kpi-chart-panel">
      <div class="chart-toolbar">
        <div class="kpi-view-toggle">
          <button type="button" id="kpi01TrendViewDaily" class="kpi-toggle-btn active">Daily</button>
          <button type="button" id="kpi01TrendViewWeekly" class="kpi-toggle-btn">Weekly</button>
        </div>
        <div class="kpi-chart-title" id="kpi01ChartTitle">Daily Bay Mortality % Trend</div>
      </div>
      <div class="panel-body"><canvas id="kpi01Chart" height="90"></canvas></div>
    </div>`,
    renderBayMortalitySummaryCards_(report.summary)
  ) +
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
}

function renderBayMortalityTable_(report) {
  const holidayMap = report.holidayMap || {};
  const days = report.days;

  const dateCells = days.map((d) => {
    const cls = getDateHeaderClass_(d.date, holidayMap);
    return `<td class="${cls}">${String(d.day).padStart(2, "0")}</td>`;
  }).join("");

  const birdsCells = days.map((d) =>
    `<td>${d.hasData ? formatNum_(d.totalBirds, 0) : ""}</td>`
  ).join("");

  const mortalityCells = days.map((d) =>
    `<td>${d.hasData ? formatNum_(d.bayMortality, 0) : ""}</td>`
  ).join("");

  const pctCells = days.map((d) => {
    if (!d.hasData) return `<td></td>`;
    const cls = bayMortalityColorClass_(d.pct);
    return `<td class="${cls}">${d.pct.toFixed(2)}%</td>`;
  }).join("");

  // 🆕 Totals
  const totalBirds = days.reduce((s, d) => s + (d.hasData ? (d.totalBirds || 0) : 0), 0);
  const totalMort  = days.reduce((s, d) => s + (d.hasData ? (d.bayMortality || 0) : 0), 0);
  const totalPct   = totalBirds > 0 ? (totalMort / totalBirds) * 100 : 0;
  const totalPctCls = bayMortalityColorClass_(totalPct);

  const totalCell = `<td class="total-cell">${formatNum_(totalBirds, 0)}</td>`;
  const totalMortCell = `<td class="total-cell">${formatNum_(totalMort, 0)}</td>`;
  const totalPctCell = totalBirds > 0
    ? `<td class="total-cell ${totalPctCls}">${totalPct.toFixed(2)}%</td>`
    : `<td class="total-cell"></td>`;

  return `
    <div class="kpi-table-scroll">
      <table class="report-table kpi-bay-mortality-table">
        <tbody>
          <tr><td class="row-label">Date</td>${dateCells}<td class="total-cell">Total</td></tr>
          <tr><td class="row-label">Total Birds Received Alive</td>${birdsCells}${totalCell}</tr>
          <tr><td class="row-label">Bay Mortality Birds</td>${mortalityCells}${totalMortCell}</tr>
          <tr><td class="row-label">Bay Mortality %</td>${pctCells}${totalPctCell}</tr>
        </tbody>
      </table>
    </div>
  `;
}

function renderBayMortalitySummaryCards_(summary) {
  return renderKpiStatusCards_(summary);
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
    ctx.fillStyle = "rgba(76, 175, 80, 0.35)";
    ctx.fillRect(chartArea.left, yStd, chartArea.right - chartArea.left, chartArea.bottom - yStd);
    ctx.fillStyle = "rgba(255, 213, 79, 0.4)";
    ctx.fillRect(chartArea.left, yStd15, chartArea.right - chartArea.left, yStd - yStd15);
    ctx.fillStyle = "rgba(255, 152, 0, 0.35)";
    ctx.fillRect(chartArea.left, yStd2, chartArea.right - chartArea.left, yStd15 - yStd2);
    ctx.fillStyle = "rgba(244, 67, 54, 0.3)";
    ctx.fillRect(chartArea.left, chartArea.top, chartArea.right - chartArea.left, yStd2 - chartArea.top);
    ctx.restore();
  },
};

let kpi01TrendView_ = "daily";

function renderBayMortalityChart_(report) {
  window.currentKpi01Report_ = report;
  const buckets = computeKpi01TrendBuckets_(report.days, kpi01TrendView_);

  const labels = buckets.map((b) => b.label);
  const actualValues = buckets.map((b) => b.pct);
  const standardValues = buckets.map(() => KPI_BAY_MORTALITY_STANDARD_);
  const yRange = computeKpiChartYRange_(actualValues, KPI_BAY_MORTALITY_STANDARD_);

  if (kpi01ChartInstance_) kpi01ChartInstance_.destroy();

  const ctx = document.getElementById("kpi01Chart").getContext("2d");
  kpi01ChartInstance_ = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Actual %",
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
          label: "Standard (≤ 0.05%)",
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
          beginAtZero: false,
          suggestedMin: yRange.suggestedMin,
          suggestedMax: yRange.suggestedMax,
          title: { display: true, text: "Bay Mortality %" },
        },
        x: { title: { display: true, text: "Date" } },
      },
      plugins: {
        title: { display: false },
        legend: { position: "top" },
        tooltip: {
          mode: "index",
          intersect: false,
          callbacks: {
            afterBody(tooltipItems) {
              const actual = tooltipItems.find((t) => t.dataset.label === "Actual %");
              const standard = tooltipItems.find((t) => t.dataset.label === "Standard (≤ 0.05%)");
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
  requestAnimationFrame(() => {
    chartPanel.style.maxWidth = `${table.getBoundingClientRect().width}px`;
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
    const titleEl = document.getElementById("kpi01ChartTitle");
    if (titleEl) titleEl.textContent = "Daily Bay Mortality % Trend";
    if (window.currentKpi01Report_) renderBayMortalityChart_(window.currentKpi01Report_);
  };
  weeklyBtn.onclick = () => {
    kpi01TrendView_ = "weekly";
    weeklyBtn.classList.add("active");
    dailyBtn.classList.remove("active");
    const titleEl = document.getElementById("kpi01ChartTitle");
    if (titleEl) titleEl.textContent = "Weekly Bay Mortality % Trend";
    if (window.currentKpi01Report_) renderBayMortalityChart_(window.currentKpi01Report_);
  };
}

// ---- KPI 01 Good Days chart ----
let kpi01GoodDaysChartInstance_ = null;
let kpi01GoodDaysView_ = "weekly";

function computeKpi01GoodDaysBuckets_(yearDays, viewMode) {
  const withData = yearDays.filter((r) => r.hasData);

  if (viewMode === "monthly") {
    const buckets = {};
    for (let m = 1; m <= 12; m++) buckets[m] = { total: 0, good: 0 };
    withData.forEach((r) => {
      buckets[r.month].total += 1;
      if (bayMortalityColorClass_(r.pct) === "kpi-green") buckets[r.month].good += 1;
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
    if (bayMortalityColorClass_(r.pct) === "kpi-green") buckets[weekNum].good += 1;
  });
  return Object.keys(buckets).map(Number).sort((a, b) => a - b).map((wk) => {
    const b = buckets[wk];
    const pct = b.total > 0 ? (b.good / b.total) * 100 : 0;
    return { label: `W${wk}`, pct, total: b.total, good: b.good };
  });
}

function renderKpi01GoodDaysChart_(yearDays) {
  const buckets = computeKpi01GoodDaysBuckets_(yearDays, kpi01GoodDaysView_);
  const labels = buckets.map((b) => b.label);
  const values = buckets.map((b) => b.pct);

  if (kpi01GoodDaysChartInstance_) kpi01GoodDaysChartInstance_.destroy();

  const ctx = document.getElementById("kpi01GoodDaysChart").getContext("2d");
  kpi01GoodDaysChartInstance_ = new Chart(ctx, {
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
        x: { title: { display: true, text: kpi01GoodDaysView_ === "monthly" ? "Month" : "Week" } },
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

// ---- KPI 01 Status combined chart ----
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

  if (kpi01StatusChartInstance_) kpi01StatusChartInstance_.destroy();

  const ctx = document.getElementById("kpi01StatusChart").getContext("2d");
  kpi01StatusChartInstance_ = new Chart(ctx, {
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
// KPI 02 — Birds Unloading Rate
// ===================================================================
function initBirdUnloadKpi() {
  const monthSelect = document.getElementById("kpi02Month");
  const yearSelect = document.getElementById("kpi02Year");
  if (!yearSelect || !monthSelect) return;
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

  monthSelect.addEventListener("change", renderBirdUnloadKpi);
  yearSelect.addEventListener("change", renderBirdUnloadKpi);

  renderBirdUnloadKpi();
}

function renderBirdUnloadTable_(report) {
  const holidayMap = report.holidayMap || {};
  const rows = report.dateRows;

  const dateCells = rows.map((r) => {
    const cls = getDateHeaderClass_(r.date, holidayMap);
    return `<td class="${cls}">${String(r.day).padStart(2, "0")}</td>`;
  }).join("");

  const receivedCells = rows.map((r) =>
    `<td>${r.hasData ? formatNum_(r.receivedBirds, 0) : ""}</td>`
  ).join("");

  const timeCells = rows.map((r) =>
    `<td>${r.hasData ? formatHoursMinutes_(r.unloadingTime) : ""}</td>`
  ).join("");

  const rateCells = rows.map((r) => {
    if (!r.hasData || r.receivedBirds === 0) return `<td></td>`;
    const cls = birdUnloadColorClass_(r.rate);
    return `<td class="${cls}">${formatNum_(r.rate, 0)}</td>`;
  }).join("");

  // 🆕 Totals
  const totalBirds = rows.reduce((s, r) => s + (r.hasData ? (r.receivedBirds || 0) : 0), 0);
  const totalTime  = rows.reduce((s, r) => s + (r.hasData ? (r.unloadingTime || 0) : 0), 0);
  const totalRate  = totalTime > 0 ? (totalBirds / totalTime) : 0;
  const totalRateCls = totalTime > 0 ? birdUnloadColorClass_(totalRate) : "";

  const totalBirdsCell = `<td class="total-cell">${formatNum_(totalBirds, 0)}</td>`;
  const totalTimeCell  = `<td class="total-cell">${totalTime > 0 ? formatHoursMinutes_(totalTime) : ""}</td>`;
  const totalRateCell  = totalTime > 0
    ? `<td class="total-cell ${totalRateCls}">${formatNum_(totalRate, 0)}</td>`
    : `<td class="total-cell"></td>`;

  return `
    <div class="kpi-table-scroll">
      <table class="report-table kpi-dressed-yield-table">
        <tbody>
          <tr><td class="row-label">Date</td>${dateCells}<td class="total-cell">Total</td></tr>
          <tr><td class="row-label">Received Birds</td>${receivedCells}${totalBirdsCell}</tr>
          <tr><td class="row-label">Unloading Time</td>${timeCells}${totalTimeCell}</tr>
          <tr><td class="row-label">Rate (birds/hr)</td>${rateCells}${totalRateCell}</tr>
        </tbody>
      </table>
    </div>
  `;
}

function renderBirdUnloadSummaryCards_(summary) {
  return renderKpiStatusCards_(summary);
}

let kpi02ChartInstance_ = null;
let kpi02MainChartView_ = "daily";

const birdUnloadBandFill_ = {
  id: "birdUnloadBandFill",
  beforeDatasetsDraw(chart) {
    const { ctx, chartArea, scales } = chart;
    if (!chartArea) return;
    const yScale = scales.y;
    const t = KPI_BIRD_UNLOAD_THRESHOLDS_;

    const yGreen = yScale.getPixelForValue(t.green);
    const yYellow = yScale.getPixelForValue(t.yellow);
    const yOrange = yScale.getPixelForValue(t.orange);

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

function renderBirdUnloadChart_(report) {
  const withData = report.dateRows.filter((r) => r.hasData && r.receivedBirds > 0);

  let labels, actualValues, standardValues;
  if (kpi02MainChartView_ === "weekly") {
    const weekly = aggregateToWeeks_(withData, "rate");
    labels = weekly.map((w) => w.label);
    actualValues = weekly.map((w) => w.value);
    standardValues = weekly.map(() => KPI_BIRD_UNLOAD_STANDARD_);
  } else {
    labels = withData.map((r) => String(r.day).padStart(2, "0"));
    actualValues = withData.map((r) => r.rate);
    standardValues = withData.map(() => KPI_BIRD_UNLOAD_STANDARD_);
  }

  const yRange = computeKpiChartYRange_(actualValues, KPI_BIRD_UNLOAD_STANDARD_);
  if (kpi02ChartInstance_) kpi02ChartInstance_.destroy();

  const ctx = document.getElementById("kpi02Chart").getContext("2d");
  kpi02ChartInstance_ = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Birds Unloading Rate",
          data: actualValues,
          borderColor: "#2c4a7c",
          backgroundColor: "transparent",
          borderWidth: 2,
          tension: 0.35,
          fill: false,
          pointRadius: kpi02MainChartView_ === "weekly" ? 4 : 1.5,
          pointBackgroundColor: "#2c4a7c",
        },
        {
          label: "Standard (4500)",
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
    plugins: [birdUnloadBandFill_],
    options: {
      responsive: true,
      interaction: { mode: "index", intersect: false },
      animation: {
        duration: 1200, easing: "easeOutQuart",
        x: { type: "number", easing: "linear", duration: 1200, from: NaN, delay(ctx) {
          if (ctx.type !== "data" || ctx.xStarted) return 0;
          ctx.xStarted = true;
          return ctx.index * 40;
        }},
      },
      scales: {
        y: {
          beginAtZero: false,
          suggestedMin: yRange.suggestedMin,
          suggestedMax: yRange.suggestedMax,
          title: { display: true, text: "Birds/Hour" }
        },
        x: { title: { display: true, text: kpi02MainChartView_ === "weekly" ? "Week" : "Date" } },
      },
      plugins: {
        title: { display: false },
        legend: { position: "top" },
        tooltip: {
          mode: "index", intersect: false,
          callbacks: {
            afterBody(tooltipItems) {
              const actual = tooltipItems.find((t) => t.dataset.label === "Birds Unloading Rate");
              const standard = tooltipItems.find((t) => t.dataset.label === "Standard (4500)");
              if (!actual || !standard) return "";
              const gap = actual.parsed.y - standard.parsed.y;
              const sign = gap >= 0 ? "+" : "";
              return `Gap: ${sign}${gap.toFixed(0)}`;
            },
          },
        },
      },
    },
  });
}

function setupKpi02MainChartToggle_(report) {
  const dailyBtn = document.getElementById("kpi02MainViewDaily");
  const weeklyBtn = document.getElementById("kpi02MainViewWeekly");
  if (!dailyBtn || !weeklyBtn) return;

  dailyBtn.onclick = () => {
    kpi02MainChartView_ = "daily";
    dailyBtn.classList.add("active"); weeklyBtn.classList.remove("active");
    const t = document.getElementById("kpi02ChartTitle");
    if (t) t.textContent = "Daily Birds Unloading Rate Trend";
    renderBirdUnloadChart_(report);
  };
  weeklyBtn.onclick = () => {
    kpi02MainChartView_ = "weekly";
    weeklyBtn.classList.add("active"); dailyBtn.classList.remove("active");
    const t = document.getElementById("kpi02ChartTitle");
    if (t) t.textContent = "Weekly Birds Unloading Rate Trend";
    renderBirdUnloadChart_(report);
  };
}

function syncKpi02ChartWidthToTable_() {
  const table = document.querySelector("#view-kpi-02 .kpi-dressed-yield-table");
  const chartPanel = document.querySelector("#view-kpi-02 .kpi-chart-panel");
  if (!table || !chartPanel) return;
  requestAnimationFrame(() => {
    chartPanel.style.maxWidth = `${table.getBoundingClientRect().width}px`;
  });
}

let kpi02GoodDaysChartInstance_ = null;
let kpi02GoodDaysView_ = "weekly";

function computeKpi02GoodDaysBuckets_(yearDays, viewMode) {
  const withData = yearDays.filter((r) => r.hasData);
  if (viewMode === "monthly") {
    const buckets = {};
    for (let m = 1; m <= 12; m++) buckets[m] = { total: 0, good: 0 };
    withData.forEach((r) => {
      buckets[r.month].total += 1;
      if (birdUnloadColorClass_(r.rate) === "kpi-green") buckets[r.month].good += 1;
    });
    return Object.keys(buckets).map(Number).sort((a, b) => a - b).map((m) => {
      const b = buckets[m];
      return { label: MONTH_SHORT_NAMES_[m - 1], pct: b.total > 0 ? (b.good / b.total) * 100 : 0, total: b.total, good: b.good };
    });
  }
  const buckets = {};
  withData.forEach((r) => {
    const wk = Math.ceil(r.dayOfYear / 7);
    if (!buckets[wk]) buckets[wk] = { total: 0, good: 0 };
    buckets[wk].total += 1;
    if (birdUnloadColorClass_(r.rate) === "kpi-green") buckets[wk].good += 1;
  });
  return Object.keys(buckets).map(Number).sort((a, b) => a - b).map((wk) => {
    const b = buckets[wk];
    return { label: `W${wk}`, pct: b.total > 0 ? (b.good / b.total) * 100 : 0, total: b.total, good: b.good };
  });
}

function renderKpi02GoodDaysChart_(yearDays) {
  const buckets = computeKpi02GoodDaysBuckets_(yearDays, kpi02GoodDaysView_);
  if (kpi02GoodDaysChartInstance_) kpi02GoodDaysChartInstance_.destroy();

  const ctx = document.getElementById("kpi02GoodDaysChart").getContext("2d");
  kpi02GoodDaysChartInstance_ = new Chart(ctx, {
    type: "line",
    data: {
      labels: buckets.map((b) => b.label),
      datasets: [{
        label: "Good Days %", data: buckets.map((b) => b.pct),
        borderColor: "#0da23a", backgroundColor: "#b3d5b5",
        borderWidth: 2.5, tension: 0.35, fill: true, pointRadius: 4, pointBackgroundColor: "#2d6a6a",
      }],
    },
    options: {
      responsive: true, animation: { duration: 900, easing: "easeOutQuart" },
      scales: {
        y: { beginAtZero: true, max: 100, title: { display: true, text: "Good Days %" } },
        x: { title: { display: true, text: kpi02GoodDaysView_ === "monthly" ? "Month" : "Week" } },
      },
      plugins: {
        title: {
          display: true,
          text: kpi02GoodDaysView_ === "monthly" ? "Good Days % — Monthly" : "Good Days % — Weekly",
          font: { size: 15, weight: "bold" }, color: "#14213D", padding: { top: 4, bottom: 10 },
        },
        legend: { display: false },
        tooltip: { callbacks: { afterLabel(item) { const b = buckets[item.dataIndex]; return `${b.good} of ${b.total} days good`; } } },
      },
    },
  });
}

function setupKpi02GoodDaysToggle_() {
  const weeklyBtn = document.getElementById("kpi02ViewWeekly");
  const monthlyBtn = document.getElementById("kpi02ViewMonthly");
  if (!weeklyBtn || !monthlyBtn) return;
  weeklyBtn.onclick = () => { kpi02GoodDaysView_ = "weekly"; weeklyBtn.classList.add("active"); monthlyBtn.classList.remove("active"); renderKpi02GoodDaysChart_(window.currentKpi02YearDays_ || []); };
  monthlyBtn.onclick = () => { kpi02GoodDaysView_ = "monthly"; monthlyBtn.classList.add("active"); weeklyBtn.classList.remove("active"); renderKpi02GoodDaysChart_(window.currentKpi02YearDays_ || []); };
}

let kpi02StatusChartInstance_ = null;
let kpi02StatusView_ = "weekly";

function computeKpi02StatusSeries_(yearDays, viewMode) {
  const withData = yearDays.filter((r) => r.hasData);
  const classify = (r) => birdUnloadColorClass_(r.rate);

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
      const b = buckets[m]; const pct = (n) => (b.total > 0 ? (n / b.total) * 100 : 0);
      return { label: MONTH_SHORT_NAMES_[m - 1], total: b.total, caution: pct(b.yellow), warning: pct(b.orange), critical: pct(b.red) };
    });
  }
  const buckets = {};
  withData.forEach((r) => {
    const wk = Math.ceil(r.dayOfYear / 7);
    if (!buckets[wk]) buckets[wk] = { total: 0, yellow: 0, orange: 0, red: 0 };
    buckets[wk].total += 1;
    const cls = classify(r);
    if (cls === "kpi-yellow") buckets[wk].yellow += 1;
    else if (cls === "kpi-orange") buckets[wk].orange += 1;
    else if (cls === "kpi-red") buckets[wk].red += 1;
  });
  return Object.keys(buckets).map(Number).sort((a, b) => a - b).map((wk) => {
    const b = buckets[wk]; const pct = (n) => (b.total > 0 ? (n / b.total) * 100 : 0);
    return { label: `W${wk}`, total: b.total, caution: pct(b.yellow), warning: pct(b.orange), critical: pct(b.red) };
  });
}

function renderKpi02StatusChart_(yearDays) {
  const buckets = computeKpi02StatusSeries_(yearDays, kpi02StatusView_);
  if (kpi02StatusChartInstance_) kpi02StatusChartInstance_.destroy();

  const ctx = document.getElementById("kpi02StatusChart").getContext("2d");
  kpi02StatusChartInstance_ = new Chart(ctx, {
    type: "line",
    data: {
      labels: buckets.map((b) => b.label),
      datasets: [
        { label: "Caution %", data: buckets.map((b) => b.caution), borderColor: "#d4a017", backgroundColor: "transparent", borderWidth: 2.5, tension: 0.35, fill: false, pointRadius: 3, pointBackgroundColor: "#d4a017" },
        { label: "Warning %", data: buckets.map((b) => b.warning), borderColor: "#e07b00", backgroundColor: "transparent", borderWidth: 2.5, tension: 0.35, fill: false, pointRadius: 3, pointBackgroundColor: "#e07b00" },
        { label: "Critical %", data: buckets.map((b) => b.critical), borderColor: "#c0392b", backgroundColor: "transparent", borderWidth: 2.5, tension: 0.35, fill: false, pointRadius: 3, pointBackgroundColor: "#c0392b" },
      ],
    },
    options: {
      responsive: true, interaction: { mode: "index", intersect: false },
      animation: { duration: 900, easing: "easeOutQuart" },
      scales: {
        y: { beginAtZero: true, max: 100, title: { display: true, text: "% of Days" } },
        x: { title: { display: true, text: kpi02StatusView_ === "monthly" ? "Month" : "Week" } },
      },
      plugins: {
        title: { display: true, text: `Caution / Warning / Critical Days % — ${kpi02StatusView_ === "monthly" ? "Monthly" : "Weekly"}`, font: { size: 15, weight: "bold" }, color: "#14213D", padding: { top: 4, bottom: 10 } },
        legend: { position: "top" }, tooltip: { mode: "index", intersect: false },
      },
    },
  });
}

function setupKpi02StatusToggle_() {
  const weeklyBtn = document.getElementById("kpi02StatusViewWeekly");
  const monthlyBtn = document.getElementById("kpi02StatusViewMonthly");
  if (!weeklyBtn || !monthlyBtn) return;
  weeklyBtn.onclick = () => { kpi02StatusView_ = "weekly"; weeklyBtn.classList.add("active"); monthlyBtn.classList.remove("active"); renderKpi02StatusChart_(window.currentKpi02YearDays_ || []); };
  monthlyBtn.onclick = () => { kpi02StatusView_ = "monthly"; monthlyBtn.classList.add("active"); weeklyBtn.classList.remove("active"); renderKpi02StatusChart_(window.currentKpi02YearDays_ || []); };
}

async function renderBirdUnloadKpi() {
  const year = document.getElementById("kpi02Year").value;
  const month = document.getElementById("kpi02Month").value;
  const panel = document.getElementById("kpi02Panel");
  panel.innerHTML = `<p class="hint">Loading…</p>`;

  try {
    const report = await buildBirdUnloadKpi(year, month);

    const workingDays = await countWorkingDaysInMonth_(Number(year), Number(month));
const std = 4500;
const actualDays = report.dateRows.filter(r => r.hasData && r.receivedBirds > 0).length;   // 🆕


// Actual = overall rate for the month (total received / total time)
// 🆕 Only days where BOTH receivedBirds AND unloadingTime > 0
const actualAvg = report.totals && report.totals.rate ? report.totals.rate : 0;

// 🆕 Breakdown: total received birds ÷ total unloading time
const kpi02Breakdown = (report.totals && report.totals.unloadingTime > 0) ? {
  figures: `${report.totals.receivedBirds.toLocaleString()} ÷ ${report.totals.unloadingTime.toLocaleString()} = ${actualAvg.toFixed(0)}`,
  formula: `= Total Received Birds ÷ Total Unloading Time\n= ${report.totals.receivedBirds.toLocaleString()} ÷ ${report.totals.unloadingTime.toLocaleString()} = ${actualAvg.toFixed(0)} birds/hr`
} : null;

updateKpiHeader("kpi-02", std, workingDays, actualDays, actualAvg, kpi02Breakdown);
    panel.innerHTML =
  wrapChartAndCards_(
    `<div class="panel kpi-chart-panel">
      <div class="chart-toolbar">
        <div class="kpi-view-toggle">
          <button type="button" id="kpi02MainViewDaily" class="kpi-toggle-btn active">Daily</button>
          <button type="button" id="kpi02MainViewWeekly" class="kpi-toggle-btn">Weekly</button>
        </div>
        <div class="kpi-chart-title" id="kpi02ChartTitle">Daily Birds Unloading Rate Trend</div>
      </div>
      <div class="panel-body"><canvas id="kpi02Chart" height="90"></canvas></div>
    </div>`,
    renderBirdUnloadSummaryCards_(report.summary)
  ) +
  renderBirdUnloadTable_(report) +
      `<div class="panel kpi-chart-panel" style="margin-top:16px;">
        <div class="chart-toolbar" style="padding:10px 14px 0;">
          <div class="kpi-view-toggle">
            <button type="button" id="kpi02ViewWeekly" class="kpi-toggle-btn active">Weekly</button>
            <button type="button" id="kpi02ViewMonthly" class="kpi-toggle-btn">Monthly</button>
          </div>
        </div>
        <div class="panel-body"><canvas id="kpi02GoodDaysChart" height="50"></canvas></div>
      </div>` +
      `<div class="panel kpi-chart-panel" style="margin-top:16px;">
        <div class="chart-toolbar" style="padding:10px 14px 0;">
          <div class="kpi-view-toggle">
            <button type="button" id="kpi02StatusViewWeekly" class="kpi-toggle-btn active">Weekly</button>
            <button type="button" id="kpi02StatusViewMonthly" class="kpi-toggle-btn">Monthly</button>
          </div>
        </div>
        <div class="panel-body"><canvas id="kpi02StatusChart" height="50"></canvas></div>
      </div>`;

    renderBirdUnloadChart_(report);
    kpi02MainChartView_ = "daily";
    setupKpi02MainChartToggle_(report);

    kpi02GoodDaysView_ = "weekly";
    setupKpi02GoodDaysToggle_();
    const yearDays = await buildBirdUnloadYearData_(year);
    window.currentKpi02YearDays_ = yearDays;
    renderKpi02GoodDaysChart_(yearDays);

    kpi02StatusView_ = "weekly";
    setupKpi02StatusToggle_();
    renderKpi02StatusChart_(yearDays);
  } catch (err) {
    panel.innerHTML = `<p class="hint error">Failed to load report: ${err.message}</p>`;
  }
}

// ===================================================================
// KPI 03 — Slaughter Line Efficiency
// ===================================================================
function initBirdInputEfficiencyKpi() {
  const monthSelect = document.getElementById("kpi03Month");
  const yearSelect = document.getElementById("kpi03Year");
  if (!yearSelect || !monthSelect) return;
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

  monthSelect.addEventListener("change", renderBirdInputEfficiencyKpi);
  yearSelect.addEventListener("change", renderBirdInputEfficiencyKpi);

  renderBirdInputEfficiencyKpi();
}

function renderBirdInputTable_(report) {
  const holidayMap = report.holidayMap || {};
  const days = report.days;

  const dateCells = days.map((d) => {
    const cls = getDateHeaderClass_(d.date, holidayMap);
    return `<td class="${cls}">${String(d.day).padStart(2, "0")}</td>`;
  }).join("");

  const actualCells = days.map((d) =>
    `<td>${d.hasData ? formatNum_(d.actual, "auto") : ""}</td>`
  ).join("");

  const plannedCells = days.map((d) =>
    `<td>${d.hasData ? formatNum_(d.planned, "auto") : ""}</td>`
  ).join("");

  const pctCells = days.map((d) => {
    if (!d.hasData) return `<td></td>`;
    const cls = slaughterEfficiencyColorClass_(d.pct);
    return `<td class="${cls}">${d.pct.toFixed(2)}%</td>`;
  }).join("");

  // 🆕 Totals
  const totalPlanned = days.reduce((s, d) => s + (d.hasData ? (d.planned || 0) : 0), 0);
  const totalActual  = days.reduce((s, d) => s + (d.hasData ? (d.actual  || 0) : 0), 0);
  const totalPct     = totalPlanned > 0 ? (totalActual / totalPlanned) * 100 : 0;
  const totalPctCls  = totalPlanned > 0 ? slaughterEfficiencyColorClass_(totalPct) : "";

  const totalActualCell  = `<td class="total-cell">${formatNum_(totalActual, "auto")}</td>`;
  const totalPlannedCell = `<td class="total-cell">${formatNum_(totalPlanned, "auto")}</td>`;
  const totalPctCell     = totalPlanned > 0
    ? `<td class="total-cell ${totalPctCls}">${totalPct.toFixed(2)}%</td>`
    : `<td class="total-cell"></td>`;

  return `
    <div class="kpi-table-scroll">
      <table class="report-table kpi-dressed-yield-table">
        <tbody>
          <tr><td class="row-label">Date</td>${dateCells}<td class="total-cell">Total</td></tr>
          <tr><td class="row-label">Planned birds</td>${plannedCells}${totalPlannedCell}</tr>
          <tr><td class="row-label">Actual birds</td>${actualCells}${totalActualCell}</tr>
          <tr><td class="row-label">Efficiency %</td>${pctCells}${totalPctCell}</tr>
        </tbody>
      </table>
    </div>
  `;
}

function renderBirdInputSummaryCards_(summary) {
  return renderKpiStatusCards_(summary);
}

let kpi03ChartInstance_ = null;
let kpi03MainView_ = "daily";

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

  let labels, actualValues, standardValues;
  if (kpi03MainView_ === "weekly") {
    const weekly = aggregateToWeeks_(withData, "pct");
    labels = weekly.map((w) => w.label);
    actualValues = weekly.map((w) => w.value);
    standardValues = weekly.map(() => KPI_BIRD_INPUT_STANDARD_);
  } else {
    labels = withData.map((d) => String(d.day).padStart(2, "0"));
    actualValues = withData.map((d) => d.pct);
    standardValues = withData.map(() => KPI_BIRD_INPUT_STANDARD_);
  }

  const yRange = computeKpiChartYRange_(actualValues, KPI_BIRD_INPUT_STANDARD_);
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
        y: {
          beginAtZero: false,
          suggestedMin: yRange.suggestedMin,
          suggestedMax: yRange.suggestedMax,
          title: { display: true, text: "Efficiency %" }
        },
        x: { title: { display: true, text: kpi03MainView_ === "weekly" ? "Week" : "Date" } },
      },
      plugins: {
        title: { display: false },
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

function setupKpi03MainChartToggle_(report) {
  const dailyBtn  = document.getElementById("kpi03MainViewDaily");
  const weeklyBtn = document.getElementById("kpi03MainViewWeekly");
  if (!dailyBtn || !weeklyBtn) return;

  dailyBtn.onclick = () => {
    kpi03MainView_ = "daily";
    dailyBtn.classList.add("active");
    weeklyBtn.classList.remove("active");
    const t = document.getElementById("kpi03ChartTitle");
    if (t) t.textContent = "Daily Bird Input Efficiency % Trend";
    renderBirdInputChart_(report);
  };
  weeklyBtn.onclick = () => {
    kpi03MainView_ = "weekly";
    weeklyBtn.classList.add("active");
    dailyBtn.classList.remove("active");
    const t = document.getElementById("kpi03ChartTitle");
    if (t) t.textContent = "Weekly Bird Input Efficiency % Trend";
    renderBirdInputChart_(report);
  };
}

function syncKpi03ChartWidthToTable_() {
  const table = document.querySelector("#view-kpi-03 .kpi-dressed-yield-table");
  const chartPanel = document.querySelector("#view-kpi-03 .kpi-chart-panel");
  if (!table || !chartPanel) return;
  requestAnimationFrame(() => {
    chartPanel.style.maxWidth = `${table.getBoundingClientRect().width}px`;
  });
}

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

async function renderBirdInputEfficiencyKpi() {
  const year = document.getElementById("kpi03Year").value;
  const month = document.getElementById("kpi03Month").value;
  const panel = document.getElementById("kpi03Panel");
  panel.innerHTML = `<p class="hint">Loading…</p>`;

  try {
    const report = await buildSlaughterEfficiencyKpi(year, month);

    const workingDays = await countWorkingDaysInMonth_(Number(year), Number(month));
const std = KPI_BIRD_INPUT_STANDARD_;
const actualDays = report.days.filter(d => d.hasData).length;   // 🆕

// Actual = overall efficiency for the month (total actual / total planned * 100)
// 🆕 Only days where BOTH planned AND actual > 0
const totalPlanned = report.days.reduce((s, d) => s + (d.planned || 0), 0);
const totalActual  = report.days.reduce((s, d) => s + (d.actual  || 0), 0);
const actualAvg = totalPlanned > 0 ? (totalActual / totalPlanned) * 100 : 0;

// 🆕 Breakdown: total actual ÷ total planned
const kpi03Breakdown = totalPlanned > 0 ? {
  figures: `${totalActual.toLocaleString()} ÷ ${totalPlanned.toLocaleString()} × 100 = ${actualAvg.toFixed(2)}%`,
  formula: `= (Total Actual Birds ÷ Total Planned Birds) × 100\n= ${totalActual.toLocaleString()} ÷ ${totalPlanned.toLocaleString()} × 100 = ${actualAvg.toFixed(2)}%`
} : null;

updateKpiHeader("kpi-03", std, workingDays, actualDays, actualAvg, kpi03Breakdown);

    panel.innerHTML =
  wrapChartAndCards_(
    `<div class="panel kpi-chart-panel">
      <div class="chart-toolbar">
        <div class="kpi-view-toggle">
          <button type="button" id="kpi03MainViewDaily" class="kpi-toggle-btn active">Daily</button>
          <button type="button" id="kpi03MainViewWeekly" class="kpi-toggle-btn">Weekly</button>
        </div>
        <div class="kpi-chart-title" id="kpi03ChartTitle">Daily Bird Input Efficiency % Trend</div>
      </div>
      <div class="panel-body"><canvas id="kpi03Chart" height="90"></canvas></div>
    </div>`,
    renderBirdInputSummaryCards_(report.summary)
  ) +
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
    kpi03MainView_ = "daily";
    setupKpi03MainChartToggle_(report);

    kpi03GoodDaysView_ = "weekly";
    setupKpi03GoodDaysToggle_();

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
// KPI 04 — Packing Line Efficiency
// ===================================================================
function initPackingEfficiencyKpi() {
  const monthSelect = document.getElementById("kpi04Month");
  const yearSelect = document.getElementById("kpi04Year");
  if (!yearSelect || !monthSelect) return;
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

  monthSelect.addEventListener("change", renderPackingEfficiencyKpi);
  yearSelect.addEventListener("change", renderPackingEfficiencyKpi);

  renderPackingEfficiencyKpi();
}

function renderPackingEfficiencyTable_(report) {
  const holidayMap = report.holidayMap || {};
  const days = report.days;

  const dateCells = days.map((d) => {
    const cls = getDateHeaderClass_(d.date, holidayMap);
    return `<td class="${cls}">${String(d.day).padStart(2, "0")}</td>`;
  }).join("");

  const actualCells = days.map((d) =>
    `<td>${d.hasData ? formatNum_(d.actual, "auto") : ""}</td>`
  ).join("");

  const plannedCells = days.map((d) =>
    `<td>${d.hasData ? formatNum_(d.planned, "auto") : ""}</td>`
  ).join("");

  const pctCells = days.map((d) => {
    if (!d.hasData) return `<td></td>`;
    const cls = packingEfficiencyColorClass_(d.pct);
    return `<td class="${cls}">${d.pct.toFixed(2)}%</td>`;
  }).join("");

  // 🆕 Totals
  const totalPlanned = days.reduce((s, d) => s + (d.hasData ? (d.planned || 0) : 0), 0);
  const totalActual  = days.reduce((s, d) => s + (d.hasData ? (d.actual  || 0) : 0), 0);
  const totalPct     = totalPlanned > 0 ? (totalActual / totalPlanned) * 100 : 0;
  const totalPctCls  = totalPlanned > 0 ? packingEfficiencyColorClass_(totalPct) : "";

  const totalActualCell  = `<td class="total-cell">${formatNum_(totalActual, "auto")}</td>`;
  const totalPlannedCell = `<td class="total-cell">${formatNum_(totalPlanned, "auto")}</td>`;
  const totalPctCell     = totalPlanned > 0
    ? `<td class="total-cell ${totalPctCls}">${totalPct.toFixed(2)}%</td>`
    : `<td class="total-cell"></td>`;

  return `
    <div class="kpi-table-scroll">
      <table class="report-table kpi-dressed-yield-table">
        <tbody>
          <tr><td class="row-label">Date</td>${dateCells}<td class="total-cell">Total</td></tr>
          <tr><td class="row-label">Planned Production Qty</td>${plannedCells}${totalPlannedCell}</tr>
          <tr><td class="row-label">Actual Production Qty</td>${actualCells}${totalActualCell}</tr>
          <tr><td class="row-label">Efficiency %</td>${pctCells}${totalPctCell}</tr>
        </tbody>
      </table>
    </div>
  `;
}

function renderPackingEfficiencySummaryCards_(summary) {
  return renderKpiStatusCards_(summary);
}

let kpi04ChartInstance_ = null;
let kpi04MainView_ = "daily";

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

  let labels, actualValues, standardValues;
  if (kpi04MainView_ === "weekly") {
    const weekly = aggregateToWeeks_(withData, "pct");
    labels = weekly.map((w) => w.label);
    actualValues = weekly.map((w) => w.value);
    standardValues = weekly.map(() => KPI_PACKING_EFFICIENCY_STANDARD_);
  } else {
    labels = withData.map((d) => String(d.day).padStart(2, "0"));
    actualValues = withData.map((d) => d.pct);
    standardValues = withData.map(() => KPI_PACKING_EFFICIENCY_STANDARD_);
  }

  const yRange = computeKpiChartYRange_(actualValues, KPI_PACKING_EFFICIENCY_STANDARD_);
  if (kpi04ChartInstance_) kpi04ChartInstance_.destroy();

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
        y: {
          beginAtZero: false,
          suggestedMin: yRange.suggestedMin,
          suggestedMax: yRange.suggestedMax,
          title: { display: true, text: "Efficiency %" }
        },
        x: { title: { display: true, text: kpi04MainView_ === "weekly" ? "Week" : "Date" } },
      },
      plugins: {
        title: { display: false },
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

function setupKpi04MainChartToggle_(report) {
  const dailyBtn  = document.getElementById("kpi04MainViewDaily");
  const weeklyBtn = document.getElementById("kpi04MainViewWeekly");
  if (!dailyBtn || !weeklyBtn) return;

  dailyBtn.onclick = () => {
    kpi04MainView_ = "daily";
    dailyBtn.classList.add("active");
    weeklyBtn.classList.remove("active");
    const t = document.getElementById("kpi04ChartTitle");
    if (t) t.textContent = "Daily Packing Line Efficiency % Trend";
    renderPackingEfficiencyChart_(report);
  };
  weeklyBtn.onclick = () => {
    kpi04MainView_ = "weekly";
    weeklyBtn.classList.add("active");
    dailyBtn.classList.remove("active");
    const t = document.getElementById("kpi04ChartTitle");
    if (t) t.textContent = "Weekly Packing Line Efficiency % Trend";
    renderPackingEfficiencyChart_(report);
  };
}

function syncKpi04ChartWidthToTable_() {
  const table = document.querySelector("#view-kpi-04 .kpi-dressed-yield-table");
  const chartPanel = document.querySelector("#view-kpi-04 .kpi-chart-panel");
  if (!table || !chartPanel) return;
  requestAnimationFrame(() => {
    chartPanel.style.maxWidth = `${table.getBoundingClientRect().width}px`;
  });
}

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
  if (kpi04GoodDaysChartInstance_) kpi04GoodDaysChartInstance_.destroy();

  const ctx = document.getElementById("kpi04GoodDaysChart").getContext("2d");
  kpi04GoodDaysChartInstance_ = new Chart(ctx, {
    type: "line",
    data: {
      labels: buckets.map((b) => b.label),
      datasets: [{
        label: "Good Days %",
        data: buckets.map((b) => b.pct),
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
  if (kpi04StatusChartInstance_) kpi04StatusChartInstance_.destroy();

  const ctx = document.getElementById("kpi04StatusChart").getContext("2d");
  kpi04StatusChartInstance_ = new Chart(ctx, {
    type: "line",
    data: {
      labels: buckets.map((b) => b.label),
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

async function renderPackingEfficiencyKpi() {
  const year = document.getElementById("kpi04Year").value;
  const month = document.getElementById("kpi04Month").value;
  const panel = document.getElementById("kpi04Panel");
  panel.innerHTML = `<p class="hint">Loading…</p>`;

  try {
    const report = await buildPackingEfficiencyKpi(year, month);

    const workingDays = await countWorkingDaysInMonth_(Number(year), Number(month));
const std = KPI_PACKING_EFFICIENCY_STANDARD_;
const actualDays = report.days.filter(d => d.hasData).length;   // 🆕

// Actual = overall efficiency (total actual / total planned * 100)
// 🆕 Only days where BOTH planned AND actual > 0
const totalPlanned = report.days.reduce((s, d) => s + (d.planned || 0), 0);
const totalActual  = report.days.reduce((s, d) => s + (d.actual  || 0), 0);
const actualAvg = totalPlanned > 0 ? (totalActual / totalPlanned) * 100 : 0;

// 🆕 Breakdown: total actual ÷ total planned
const kpi04Breakdown = totalPlanned > 0 ? {
  figures: `${totalActual.toLocaleString()} ÷ ${totalPlanned.toLocaleString()} × 100 = ${actualAvg.toFixed(2)}%`,
  formula: `= (Total Actual Qty ÷ Total Planned Qty) × 100\n= ${totalActual.toLocaleString()} ÷ ${totalPlanned.toLocaleString()} × 100 = ${actualAvg.toFixed(2)}%`
} : null;

updateKpiHeader("kpi-04", std, workingDays, actualDays, actualAvg, kpi04Breakdown);

    panel.innerHTML =
  wrapChartAndCards_(
    `<div class="panel kpi-chart-panel">
      <div class="chart-toolbar">
        <div class="kpi-view-toggle">
          <button type="button" id="kpi04MainViewDaily" class="kpi-toggle-btn active">Daily</button>
          <button type="button" id="kpi04MainViewWeekly" class="kpi-toggle-btn">Weekly</button>
        </div>
        <div class="kpi-chart-title" id="kpi04ChartTitle">Daily Packing Line Efficiency % Trend</div>
      </div>
      <div class="panel-body"><canvas id="kpi04Chart" height="90"></canvas></div>
    </div>`,
    renderPackingEfficiencySummaryCards_(report.summary)
  ) +
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
    kpi04MainView_ = "daily";
    setupKpi04MainChartToggle_(report);

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
// KPI 05 — Dressed Yield
// ===================================================================
function initDressedYieldKpi() {
  const monthSelect = document.getElementById("kpi05Month");
  const yearSelect = document.getElementById("kpi05Year");
  if (!yearSelect || !monthSelect) return;
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

  monthSelect.addEventListener("change", renderDressedYieldKpi);
  yearSelect.addEventListener("change", renderDressedYieldKpi);

  renderDressedYieldKpi();
}

function renderDressedYieldTable_(report) {
  const holidayMap = report.holidayMap || {};
  const rows = report.dateRows;

  const dateCells = rows.map((r) => {
    const cls = getDateHeaderClass_(r.date, holidayMap);
    return `<td class="${cls}">${String(r.day).padStart(2, "0")}</td>`;
  }).join("");

  const liveCells = rows.map((r) =>
    `<td>${r.hasData ? formatNum_(r.liveWeight, 1) : ""}</td>`
  ).join("");

  const dressedCells = rows.map((r) =>
    `<td>${r.hasData ? formatNum_(r.dressedWeight, 1) : ""}</td>`
  ).join("");

  const pctCells = rows.map((r) => {
    if (!r.hasData) return `<td></td>`;
    const y = r.yieldPct;
    const cls = dressedYieldColorClass_(y);
    return `<td class="${cls}">${y.toFixed(2)}%</td>`;
  }).join("");

  // 🆕 Totals
  const totalLive    = rows.reduce((s, r) => s + (r.hasData ? (r.liveWeight || 0) : 0), 0);
  const totalDressed = rows.reduce((s, r) => s + (r.hasData ? (r.dressedWeight || 0) : 0), 0);
  const totalPct     = totalLive > 0 ? (totalDressed / totalLive) * 100 : 0;
  const totalPctCls  = totalLive > 0 ? dressedYieldColorClass_(totalPct) : "";

  const totalLiveCell    = `<td class="total-cell">${formatNum_(totalLive, 1)}</td>`;
  const totalDressedCell = `<td class="total-cell">${formatNum_(totalDressed, 1)}</td>`;
  const totalPctCell     = totalLive > 0
    ? `<td class="total-cell ${totalPctCls}">${totalPct.toFixed(2)}%</td>`
    : `<td class="total-cell"></td>`;

  return `
    <div class="kpi-table-scroll">
      <table class="report-table kpi-dressed-yield-table">
        <tbody>
          <tr><td class="row-label">Date</td>${dateCells}<td class="total-cell">Total</td></tr>
          <tr><td class="row-label">Live Bird Weight (Kg)</td>${liveCells}${totalLiveCell}</tr>
          <tr><td class="row-label">Dressed Weight (Kg)</td>${dressedCells}${totalDressedCell}</tr>
          <tr><td class="row-label">Yield %</td>${pctCells}${totalPctCell}</tr>
        </tbody>
      </table>
    </div>
  `;
}

function renderDressedYieldSummaryCards_(summary) {
  return renderKpiStatusCards_(summary);
}

let kpi05ChartInstance_ = null;
let kpi05MainView_ = "daily";

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

function renderDressedYieldChart_(report) {
  const withData = report.dateRows.filter((r) => r.hasData);

  let labels, actualValues, standardValues;
  if (kpi05MainView_ === "weekly") {
    const weekly = aggregateToWeeks_(withData, "yieldPct");
    labels = weekly.map((w) => w.label);
    actualValues = weekly.map((w) => w.value);
    standardValues = weekly.map(() => KPI_DRESSED_YIELD_STANDARD_);
  } else {
    labels = withData.map((r) => String(r.day).padStart(2, "0"));
    actualValues = withData.map((r) => r.yieldPct);
    standardValues = withData.map(() => KPI_DRESSED_YIELD_STANDARD_);
  }

  const yRange = computeKpiChartYRange_(actualValues, KPI_DRESSED_YIELD_STANDARD_);
  if (kpi05ChartInstance_) kpi05ChartInstance_.destroy();

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
          beginAtZero: false,
          suggestedMin: yRange.suggestedMin,
          suggestedMax: yRange.suggestedMax,
          title: { display: true, text: "Dressed Yield %" },
        },
        x: { title: { display: true, text: kpi05MainView_ === "weekly" ? "Week" : "Date" } },
      },
      plugins: {
        title: { display: false },
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

function setupKpi05MainChartToggle_(report) {
  const dailyBtn  = document.getElementById("kpi05MainViewDaily");
  const weeklyBtn = document.getElementById("kpi05MainViewWeekly");
  if (!dailyBtn || !weeklyBtn) return;

  dailyBtn.onclick = () => {
    kpi05MainView_ = "daily";
    dailyBtn.classList.add("active");
    weeklyBtn.classList.remove("active");
    const t = document.getElementById("kpi05ChartTitle");
    if (t) t.textContent = "Daily Dressed Yield % Trend";
    renderDressedYieldChart_(report);
  };
  weeklyBtn.onclick = () => {
    kpi05MainView_ = "weekly";
    weeklyBtn.classList.add("active");
    dailyBtn.classList.remove("active");
    const t = document.getElementById("kpi05ChartTitle");
    if (t) t.textContent = "Weekly Dressed Yield % Trend";
    renderDressedYieldChart_(report);
  };
}

function syncKpi05ChartWidthToTable_() {
  const table = document.querySelector("#view-kpi-05 .kpi-dressed-yield-table");
  const chartPanel = document.querySelector("#view-kpi-05 .kpi-chart-panel");
  if (!table || !chartPanel) return;
  requestAnimationFrame(() => {
    chartPanel.style.maxWidth = `${table.getBoundingClientRect().width}px`;
  });
}

let kpi05GoodDaysChartInstance_ = null;
let kpi05GoodDaysView_ = "weekly";

function computeKpi05GoodDaysBuckets_(yearDays, viewMode) {
  const withData = yearDays.filter((r) => r.hasData);

  if (viewMode === "monthly") {
    const buckets = {};
    for (let m = 1; m <= 12; m++) buckets[m] = { total: 0, good: 0 };
    withData.forEach((r) => {
      buckets[r.month].total += 1;
      if (dressedYieldColorClass_(r.yieldPct) === "kpi-green") buckets[r.month].good += 1;
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
    if (dressedYieldColorClass_(r.yieldPct) === "kpi-green") buckets[weekNum].good += 1;
  });
  return Object.keys(buckets).map(Number).sort((a, b) => a - b).map((wk) => {
    const b = buckets[wk];
    const pct = b.total > 0 ? (b.good / b.total) * 100 : 0;
    return { label: `W${wk}`, pct, total: b.total, good: b.good };
  });
}

function renderKpi05GoodDaysChart_(yearDays) {
  const buckets = computeKpi05GoodDaysBuckets_(yearDays, kpi05GoodDaysView_);
  const labels = buckets.map((b) => b.label);
  const values = buckets.map((b) => b.pct);

  if (kpi05GoodDaysChartInstance_) kpi05GoodDaysChartInstance_.destroy();

  const ctx = document.getElementById("kpi05GoodDaysChart").getContext("2d");
  kpi05GoodDaysChartInstance_ = new Chart(ctx, {
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
        x: { title: { display: true, text: kpi05GoodDaysView_ === "monthly" ? "Month" : "Week" } },
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

  if (kpi05StatusChartInstance_) kpi05StatusChartInstance_.destroy();

  const ctx = document.getElementById("kpi05StatusChart").getContext("2d");
  kpi05StatusChartInstance_ = new Chart(ctx, {
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

async function renderDressedYieldKpi() {
  const year = document.getElementById("kpi05Year").value;
  const month = document.getElementById("kpi05Month").value;
  const panel = document.getElementById("kpi05Panel");
  panel.innerHTML = `<p class="hint">Loading…</p>`;

  try {
    const report = await buildDressedYieldKpi(year, month);

    const workingDays = await countWorkingDaysInMonth_(Number(year), Number(month));
const std = KPI_DRESSED_YIELD_STANDARD_;
const actualDays = report.dateRows.filter(r => r.hasData).length;   // 🆕

// Actual = overall yield % for the month
// 🆕 Only days where BOTH liveWeight AND dressedWeight > 0
const actualAvg = report.totals && report.totals.yieldPct ? report.totals.yieldPct : 0;

// 🆕 Breakdown: total dressed weight ÷ total live weight
const kpi05Breakdown = (report.totals && report.totals.liveWeight > 0) ? {
  figures: `${report.totals.dressedWeight.toLocaleString(undefined, { maximumFractionDigits: 0 })} ÷ ${report.totals.liveWeight.toLocaleString(undefined, { maximumFractionDigits: 0 })} × 100 = ${actualAvg.toFixed(2)}%`,
  formula: `= (Total Dress Weight ÷ Total Live Birds Weight) × 100\n= ${report.totals.dressedWeight.toLocaleString(undefined, { maximumFractionDigits: 0 })} ÷ ${report.totals.liveWeight.toLocaleString(undefined, { maximumFractionDigits: 0 })} × 100 = ${actualAvg.toFixed(2)}%`
} : null;

updateKpiHeader("kpi-05", std, workingDays, actualDays, actualAvg, kpi05Breakdown);

    panel.innerHTML =
  wrapChartAndCards_(
    `<div class="panel kpi-chart-panel">
      <div class="chart-toolbar">
        <div class="kpi-view-toggle">
          <button type="button" id="kpi05MainViewDaily" class="kpi-toggle-btn active">Daily</button>
          <button type="button" id="kpi05MainViewWeekly" class="kpi-toggle-btn">Weekly</button>
        </div>
        <div class="kpi-chart-title" id="kpi05ChartTitle">Daily Dressed Yield % Trend</div>
      </div>
      <div class="panel-body"><canvas id="kpi05Chart" height="90"></canvas></div>
    </div>`,
    renderDressedYieldSummaryCards_(report.summary)
  ) +
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
        <div class="chart-toolbar" style="padding:10px 14px 0;">
          <div class="kpi-view-toggle">
            <button type="button" id="kpi05StatusViewWeekly" class="kpi-toggle-btn active">Weekly</button>
            <button type="button" id="kpi05StatusViewMonthly" class="kpi-toggle-btn">Monthly</button>
          </div>
        </div>
        <div class="panel-body"><canvas id="kpi05StatusChart" height="50"></canvas></div>
      </div>`;

    renderDressedYieldChart_(report);
    kpi05MainView_ = "daily";
    setupKpi05MainChartToggle_(report);

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
// KPI 06 — Chill Loss
// ===================================================================
function initChillLossKpi() {
  const monthSelect = document.getElementById("kpi06Month");
  const yearSelect = document.getElementById("kpi06Year");
  if (!yearSelect || !monthSelect) return;
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

  monthSelect.addEventListener("change", renderChillLossKpi);
  yearSelect.addEventListener("change", renderChillLossKpi);

  renderChillLossKpi();
}

function renderChillLossTable_(report) {
  const holidayMap = report.holidayMap || {};
  const rows = report.dateRows;

  const dateCells = rows.map((r) => {
    const cls = getDateHeaderClass_(r.date, holidayMap);
    return `<td class="${cls}">${String(r.day).padStart(2, "0")}</td>`;
  }).join("");

  const chillCells = rows.map((r) =>
    `<td>${r.hasData ? formatNum_(r.chillWeight, 1) : ""}</td>`
  ).join("");

  const diffCells = rows.map((r) =>
    `<td>${r.hasData ? formatNum_(r.diff, 1) : ""}</td>`
  ).join("");

  const pctCells = rows.map((r) => {
    if (!r.hasData) return `<td></td>`;
    const cls = chillLossColorClass_(r.chillLossPct);
    return `<td class="${cls}">${r.chillLossPct.toFixed(2)}%</td>`;
  }).join("");

  // 🆕 Totals
  const totalChill = rows.reduce((s, r) => s + (r.hasData ? (r.chillWeight || 0) : 0), 0);
  const totalDiff  = rows.reduce((s, r) => s + (r.hasData ? (r.diff || 0) : 0), 0);
  const totalPct   = totalChill > 0 ? (totalDiff / totalChill) * 100 : 0;
  const totalPctCls = totalChill > 0 ? chillLossColorClass_(totalPct) : "";

  const totalChillCell = `<td class="total-cell">${formatNum_(totalChill, 1)}</td>`;
  const totalDiffCell  = `<td class="total-cell">${formatNum_(totalDiff, 1)}</td>`;
  const totalPctCell   = totalChill > 0
    ? `<td class="total-cell ${totalPctCls}">${totalPct.toFixed(2)}%</td>`
    : `<td class="total-cell"></td>`;

  return `
    <div class="kpi-table-scroll">
      <table class="report-table kpi-dressed-yield-table">
        <tbody>
          <tr><td class="row-label">Date</td>${dateCells}<td class="total-cell">Total</td></tr>
          <tr><td class="row-label">Diff (Chill-Dress)</td>${diffCells}${totalDiffCell}</tr>
          <tr><td class="row-label">Chill Weight (Kg)</td>${chillCells}${totalChillCell}</tr>
          <tr><td class="row-label">Chill Loss %</td>${pctCells}${totalPctCell}</tr>
        </tbody>
      </table>
    </div>
  `;
}

function renderChillLossSummaryCards_(summary) {
  return renderKpiStatusCards_(summary);
}

let kpi06ChartInstance_ = null;
let kpi06MainView_ = "daily";
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
    ctx.fillStyle = "rgba(76, 175, 80, 0.35)";
    ctx.fillRect(chartArea.left, yGreen, chartArea.right - chartArea.left, chartArea.bottom - yGreen);
    ctx.fillStyle = "rgba(255, 213, 79, 0.4)";
    ctx.fillRect(chartArea.left, yYellow, chartArea.right - chartArea.left, yGreen - yYellow);
    ctx.fillStyle = "rgba(255, 152, 0, 0.35)";
    ctx.fillRect(chartArea.left, yOrange, chartArea.right - chartArea.left, yYellow - yOrange);
    ctx.fillStyle = "rgba(244, 67, 54, 0.3)";
    ctx.fillRect(chartArea.left, chartArea.top, chartArea.right - chartArea.left, yOrange - chartArea.top);
    ctx.restore();
  },
};

function renderChillLossChart_(report) {
  const withData = report.dateRows.filter((r) => r.hasData);

  let labels, actualValues, standardValues;
  if (kpi06MainView_ === "weekly") {
    const weekly = aggregateToWeeks_(withData, "chillLossPct");
    labels = weekly.map((w) => w.label);
    actualValues = weekly.map((w) => w.value);
    standardValues = weekly.map(() => KPI_CHILL_LOSS_STANDARD_);
  } else {
    labels = withData.map((r) => String(r.day).padStart(2, "0"));
    actualValues = withData.map((r) => r.chillLossPct);
    standardValues = withData.map(() => KPI_CHILL_LOSS_STANDARD_);
  }

  const yRange = computeKpiChartYRange_(actualValues, KPI_CHILL_LOSS_STANDARD_);
  if (kpi06ChartInstance_) kpi06ChartInstance_.destroy();

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
          beginAtZero: false,
          suggestedMin: yRange.suggestedMin,
          suggestedMax: yRange.suggestedMax,
          title: { display: true, text: "Chill Loss %" },
        },
        x: { title: { display: true, text: kpi06MainView_ === "weekly" ? "Week" : "Date" } },
      },
      plugins: {
        title: { display: false },
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

function setupKpi06MainChartToggle_(report) {
  const dailyBtn  = document.getElementById("kpi06MainViewDaily");
  const weeklyBtn = document.getElementById("kpi06MainViewWeekly");
  if (!dailyBtn || !weeklyBtn) return;

  dailyBtn.onclick = () => {
    kpi06MainView_ = "daily";
    dailyBtn.classList.add("active");
    weeklyBtn.classList.remove("active");
    const t = document.getElementById("kpi06ChartTitle");
    if (t) t.textContent = "Daily Chill Loss % Trend";
    renderChillLossChart_(report);
  };
  weeklyBtn.onclick = () => {
    kpi06MainView_ = "weekly";
    weeklyBtn.classList.add("active");
    dailyBtn.classList.remove("active");
    const t = document.getElementById("kpi06ChartTitle");
    if (t) t.textContent = "Weekly Chill Loss % Trend";
    renderChillLossChart_(report);
  };
}

function syncKpi06ChartWidthToTable_() {
  const table = document.querySelector("#view-kpi-06 .kpi-dressed-yield-table");
  const chartPanel = document.querySelector("#view-kpi-06 .kpi-chart-panel");
  if (!table || !chartPanel) return;
  requestAnimationFrame(() => {
    chartPanel.style.maxWidth = `${table.getBoundingClientRect().width}px`;
  });
}

let kpi06GoodDaysChartInstance_ = null;
let kpi06GoodDaysView_ = "weekly";

function computeGoodDaysBuckets_(yearDays, viewMode) {
  const withData = yearDays.filter((r) => r.hasData);

  if (viewMode === "monthly") {
    const buckets = {};
    for (let m = 1; m <= 12; m++) buckets[m] = { total: 0, good: 0 };
    withData.forEach((r) => {
      buckets[r.month].total += 1;
      if (chillLossColorClass_(r.chillLossPct) === "kpi-green") buckets[r.month].good += 1;
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
    if (chillLossColorClass_(r.chillLossPct) === "kpi-green") buckets[weekNum].good += 1;
  });
  return Object.keys(buckets).map(Number).sort((a, b) => a - b).map((wk) => {
    const b = buckets[wk];
    const pct = b.total > 0 ? (b.good / b.total) * 100 : 0;
    return { label: `W${wk}`, pct, total: b.total, good: b.good };
  });
}

function renderGoodDaysChart_(yearDays) {
  const buckets = computeGoodDaysBuckets_(yearDays, kpi06GoodDaysView_);
  const labels = buckets.map((b) => b.label);
  const values = buckets.map((b) => b.pct);

  if (kpi06GoodDaysChartInstance_) kpi06GoodDaysChartInstance_.destroy();

  const ctx = document.getElementById("kpi06GoodDaysChart").getContext("2d");
  kpi06GoodDaysChartInstance_ = new Chart(ctx, {
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
        x: { title: { display: true, text: kpi06GoodDaysView_ === "monthly" ? "Month" : "Week" } },
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

  if (kpi06StatusChartInstance_) kpi06StatusChartInstance_.destroy();

  const ctx = document.getElementById("kpi06StatusChart").getContext("2d");
  kpi06StatusChartInstance_ = new Chart(ctx, {
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

async function renderChillLossKpi() {
  const year = document.getElementById("kpi06Year").value;
  const month = document.getElementById("kpi06Month").value;
  const panel = document.getElementById("kpi06Panel");
  panel.innerHTML = `<p class="hint">Loading…</p>`;

  try {
    const report = await buildChillLossKpi(year, month);
    const workingDays = await countWorkingDaysInMonth_(Number(year), Number(month));
const std = KPI_CHILL_LOSS_STANDARD_;
const actualDays = report.dateRows.filter(r => r.hasData).length;   // 🆕

// Actual = overall chill loss % for the month
// 🆕 Only days where BOTH chillWeight AND dressWeight > 0
const actualAvg = report.totals && report.totals.chillLossPct ? report.totals.chillLossPct : 0;

// 🆕 Breakdown: (total chill weight − total dress weight) ÷ total chill weight
const kpi06Breakdown = (report.totals && report.totals.chillWeight > 0) ? {
  figures: `(${report.totals.chillWeight.toLocaleString(undefined, { maximumFractionDigits: 0 })} − ${report.totals.dressWeight.toLocaleString(undefined, { maximumFractionDigits: 0 })}) ÷ ${report.totals.chillWeight.toLocaleString(undefined, { maximumFractionDigits: 0 })} × 100 = ${actualAvg.toFixed(2)}%`,
  formula: `= (Total Chill Weight − Total Dress Weight) ÷ Total Chill Weight × 100\n= (${report.totals.chillWeight.toLocaleString(undefined, { maximumFractionDigits: 0 })} − ${report.totals.dressWeight.toLocaleString(undefined, { maximumFractionDigits: 0 })}) ÷ ${report.totals.chillWeight.toLocaleString(undefined, { maximumFractionDigits: 0 })} × 100 = ${actualAvg.toFixed(2)}%`
} : null;

updateKpiHeader("kpi-06", std, workingDays, actualDays, actualAvg, kpi06Breakdown);
    window.currentKpi06DateRows_ = report.dateRows;

    panel.innerHTML =
  wrapChartAndCards_(
    `<div class="panel kpi-chart-panel">
      <div class="chart-toolbar">
        <div class="kpi-view-toggle">
          <button type="button" id="kpi06MainViewDaily" class="kpi-toggle-btn active">Daily</button>
          <button type="button" id="kpi06MainViewWeekly" class="kpi-toggle-btn">Weekly</button>
        </div>
        <div class="kpi-chart-title" id="kpi06ChartTitle">Daily Chill Loss % Trend</div>
      </div>
      <div class="panel-body"><canvas id="kpi06Chart" height="90"></canvas></div>
    </div>`,
    renderChillLossSummaryCards_(report.summary)
  ) +
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
    kpi06MainView_ = "daily";
    setupKpi06MainChartToggle_(report);

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
// DASHBOARD-NEW (KPI Overview)
// ===================================================================

const KPI_CONFIG_NEW = {
  "kpi-01": {
    id: "kpi-01", label: "Bay Mortality", shortLabel: "Bay Mortality",
    icon: "🐦", unit: "%", standard: 0.05, isLowerBetter: true,
    color: "#E74C3C", bgColor: "rgba(231, 76, 60, 0.12)", borderColor: "#E74C3C",
    gradientFrom: "rgba(231, 76, 60, 0.20)", gradientTo: "rgba(231, 76, 60, 0.02)",
    description: "Mortality rate during bay holding"
  },
  "kpi-02": {
    id: "kpi-02", label: "Birds Unloading", shortLabel: "Live Birds Unloading",
    icon: "🚚", unit: "birds/hr", standard: 4500, isLowerBetter: false,
    color: "#3498DB", bgColor: "rgba(52, 152, 219, 0.12)", borderColor: "#3498DB",
    gradientFrom: "rgba(52, 152, 219, 0.20)", gradientTo: "rgba(52, 152, 219, 0.02)",
    description: "Birds unloading efficiency"
  },
  "kpi-03": {
    id: "kpi-03", label: "Slaughter Efficiency", shortLabel: "Slaughter Efficiency",
    icon: "🔪", unit: "%", standard: 95, isLowerBetter: false,
    color: "#2ECC71", bgColor: "rgba(46, 204, 113, 0.12)", borderColor: "#2ECC71",
    gradientFrom: "rgba(46, 204, 113, 0.20)", gradientTo: "rgba(46, 204, 113, 0.02)",
    description: "Slaughter line efficiency"
  },
  "kpi-04": {
    id: "kpi-04", label: "Production Efficiency", shortLabel: "Production Efficiency",
    icon: "📦", unit: "%", standard: 95, isLowerBetter: false,
    color: "#9B59B6", bgColor: "rgba(155, 89, 182, 0.12)", borderColor: "#9B59B6",
    gradientFrom: "rgba(155, 89, 182, 0.20)", gradientTo: "rgba(155, 89, 182, 0.02)",
    description: "Packing line efficiency"
  },
  "kpi-05": {
    id: "kpi-05", label: "Dressed Yield", shortLabel: "Dressed Yield",
    icon: "🍗", unit: "%", standard: 79, isLowerBetter: false,
    color: "#F39C12", bgColor: "rgba(243, 156, 18, 0.12)", borderColor: "#F39C12",
    gradientFrom: "rgba(243, 156, 18, 0.20)", gradientTo: "rgba(243, 156, 18, 0.02)",
    description: "Dressed yield percentage"
  },
  "kpi-06": {
    id: "kpi-06", label: "Chill Loss", shortLabel: "Chill Loss",
    icon: "❄️", unit: "%", standard: 2, isLowerBetter: true,
    color: "#1ABC9C", bgColor: "rgba(26, 188, 156, 0.12)", borderColor: "#1ABC9C",
    gradientFrom: "rgba(26, 188, 156, 0.20)", gradientTo: "rgba(26, 188, 156, 0.02)",
    description: "Weight loss during chill process"
  }
};

const KPI_DAY_STATUS_COLORS_ = {
  good:     '#00de2c',
  caution:  '#fcff2f',
  warning:  '#fc941d',
  critical: '#c11e1e'
};

const KPI_CLASS_TO_STATUS_ = {
  'kpi-green':  'good',
  'kpi-yellow': 'caution',
  'kpi-orange': 'warning',
  'kpi-red':    'critical'
};

const KPI_MONTH_FIELD_MAP_ = {
  'kpi-01': { arr: 'days',     field: 'pct' },
  'kpi-02': { arr: 'dateRows', field: 'rate' },
  'kpi-03': { arr: 'days',     field: 'pct' },
  'kpi-04': { arr: 'days',     field: 'pct' },
  'kpi-05': { arr: 'dateRows', field: 'yieldPct' },
  'kpi-06': { arr: 'dateRows', field: 'chillLossPct' }
};

function getKpiColorFn_(kpiKey) {
  switch (kpiKey) {
    case 'kpi-01': return bayMortalityColorClass_;
    case 'kpi-02': return birdUnloadColorClass_;
    case 'kpi-03': return slaughterEfficiencyColorClass_;
    case 'kpi-04': return packingEfficiencyColorClass_;
    case 'kpi-05': return dressedYieldColorClass_;
    case 'kpi-06': return chillLossColorClass_;
    default:       return null;
  }
}

function computeMonthDayStatusCounts_(report, kpiKey) {
  const counts = { good: 0, caution: 0, warning: 0, critical: 0, total: 0 };
  if (!report) return counts;

  const cfg = KPI_MONTH_FIELD_MAP_[kpiKey];
  if (!cfg) return counts;

  const rows = report[cfg.arr];
  if (!Array.isArray(rows)) return counts;

  const colorFn = getKpiColorFn_(kpiKey);
  if (!colorFn) return counts;

  rows.forEach((r) => {
    if (!r || r.hasData !== true) return;
    const val = r[cfg.field];
    if (val === null || val === undefined || !isFinite(val)) return;
    const cls = colorFn(val);
    const status = KPI_CLASS_TO_STATUS_[cls];
    if (status) {
      counts[status] += 1;
      counts.total  += 1;
    }
  });

  return counts;
}

let dashNewState = {
  year: new Date().getFullYear(),
  month: new Date().getMonth() + 1,
  viewMode: "quarterly",
  chartType: "line",
  selectedKpis: new Set(["kpi-01","kpi-02","kpi-03","kpi-04","kpi-05","kpi-06"]),
  selectedStatuses: new Set(["good", "not-achieved"]),
  data: {},
  chartInstances: {}
};

function getKpiStatusNew(value, config) {
  if (value === null || value === undefined || !isFinite(value)) {
    return { status: "no-data", label: "No Data", color: "#9e9e9e" };
  }
  const std = config.standard;
  if (config.isLowerBetter) {
    if (value <= std) return { status: "good",     label: "Achieved",     color: "#2e7d32" };
    return               { status: "critical", label: "Not Achieved", color: "#c62828" };
  } else {
    if (value >= std) return { status: "good",     label: "Achieved",     color: "#2e7d32" };
    return               { status: "critical", label: "Not Achieved", color: "#c62828" };
  }
}

function extractKpiDataNew(report, kpiKey) {
  if (!report || typeof report !== 'object') return { values: [], dates: [], hasData: false };

  if (kpiKey === "kpi-01" && report.days) {
    const valid = report.days.filter(d => d && d.hasData === true);
    return {
      values: valid.map(d => (d.pct !== undefined && d.pct !== null) ? Number(d.pct) : null).filter(v => v !== null),
      dates: valid.map(d => d.day || 0),
      hasData: valid.length > 0
    };
  }
  if (kpiKey === "kpi-02" && report.dateRows) {
    const valid = report.dateRows.filter(d => d && d.hasData === true && d.receivedBirds > 0);
    return {
      values: valid.map(d => (d.rate !== undefined && d.rate !== null) ? Number(d.rate) : null).filter(v => v !== null),
      dates: valid.map(d => d.day || 0),
      hasData: valid.length > 0
    };
  }
  if (kpiKey === "kpi-03" && report.days) {
    const valid = report.days.filter(d => d && d.hasData === true);
    return {
      values: valid.map(d => (d.pct !== undefined && d.pct !== null) ? Number(d.pct) : null).filter(v => v !== null),
      dates: valid.map(d => d.day || 0),
      hasData: valid.length > 0
    };
  }
  if (kpiKey === "kpi-04" && report.days) {
    const valid = report.days.filter(d => d && d.hasData === true);
    return {
      values: valid.map(d => (d.pct !== undefined && d.pct !== null) ? Number(d.pct) : null).filter(v => v !== null),
      dates: valid.map(d => d.day || 0),
      hasData: valid.length > 0
    };
  }
  if (kpiKey === "kpi-05" && report.dateRows) {
    const valid = report.dateRows.filter(d => d && d.hasData === true);
    return {
      values: valid.map(d => (d.yieldPct !== undefined && d.yieldPct !== null) ? Number(d.yieldPct) : null).filter(v => v !== null),
      dates: valid.map(d => d.day || 0),
      hasData: valid.length > 0
    };
  }
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

async function fetchAllKpiDataNew(year, month) {
  const results = {};
  const kpiBuilders = {
    "kpi-05": buildDressedYieldKpi,
    "kpi-01": buildBayMortalityKpi,
    "kpi-02": buildBirdUnloadKpi,
    "kpi-03": buildSlaughterEfficiencyKpi,
    "kpi-04": buildPackingEfficiencyKpi,
    "kpi-06": buildChillLossKpi,
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

const KPI_PCT_FIELD_ = {
  "kpi-01": "pct",
  "kpi-02": "rate",
  "kpi-03": "pct",
  "kpi-04": "pct",
  "kpi-05": "yieldPct",
  "kpi-06": "chillLossPct",
};

async function fetchAllKpiYearDataNew(year) {
  const results = {};
  const yearBuilders = {
    "kpi-05": buildDressedYieldYearData_,
    "kpi-01": buildBayMortalityYearData_,
    "kpi-02": buildBirdUnloadYearData_,
    "kpi-03": buildSlaughterEfficiencyYearData_,
    "kpi-04": buildPackingEfficiencyYearData_,
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

const QUARTER_MONTHS_ = { Q1: [1, 2, 3], Q2: [4, 5, 6], Q3: [7, 8, 9], Q4: [10, 11, 12] };

function aggregateYearByViewMode_(yearDays, pctField, viewMode) {
  const withData = yearDays.filter((r) => r.hasData && r[pctField] !== undefined && r[pctField] !== null);

  if (viewMode === "monthly") {
    const buckets = {};
    for (let m = 1; m <= 12; m++) buckets[m] = { sum: 0, count: 0 };
    withData.forEach((r) => {
      buckets[r.month].sum += r[pctField];
      buckets[r.month].count += 1;
    });
    const labels = MONTH_SHORT_NAMES_.slice();
    const values = labels.map((_, i) => {
      const b = buckets[i + 1];
      return b.count > 0 ? b.sum / b.count : 0;
    });
    return { labels, values, hasData: true };
  }

  if (viewMode === "quarterly") {
    const qOrder = ["Q1", "Q2", "Q3", "Q4"];
    const buckets = { Q1: { sum: 0, count: 0 }, Q2: { sum: 0, count: 0 }, Q3: { sum: 0, count: 0 }, Q4: { sum: 0, count: 0 } };
    withData.forEach((r) => {
      const q = qOrder.find((qk) => QUARTER_MONTHS_[qk].includes(r.month));
      if (q) { buckets[q].sum += r[pctField]; buckets[q].count += 1; }
    });
    const values = qOrder.map((q) => (buckets[q].count > 0 ? buckets[q].sum / buckets[q].count : 0));
    return { labels: qOrder, values, hasData: true };
  }

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

// ===================================================================
// Standard value display helper for dashboard cards + charts
// ===================================================================
function formatStdDisplay_(kpiKey, config) {
  if (kpiKey === 'kpi-01') return '≤ 0.05%';
  if (kpiKey === 'kpi-02') return '4500 birds/hr';
  if (kpiKey === 'kpi-03') return '95.00%';
  if (kpiKey === 'kpi-04') return '95.00%';
  if (kpiKey === 'kpi-05') return '79.00%';
  if (kpiKey === 'kpi-06') return '2.00%';
  // Fallback
  const unit = config.unit || '';
  return unit === '%' ? config.standard.toFixed(2) + '%' : config.standard + ' ' + unit;
}
// ===================================================================
// Bar Max scale per KPI — the "full" value the bar represents
// ===================================================================
const KPI_BAR_MAX_ = {
  'kpi-01': 0.15,     // Bay Mortality — 3x std
  'kpi-02': 5500,     // Unloading — ~1.2x std
  'kpi-03': 100,      // Slaughter Eff
  'kpi-04': 100,      // Packing Eff
  'kpi-05': 100,      // Dressed Yield
  'kpi-06': 5,        // Chill Loss — 2.5x std
};

// ===================================================================
// Dashboard KPI order — used by all dashboard renderers
// ===================================================================
const DASH_KPI_ORDER_ = ["kpi-05", "kpi-01", "kpi-02", "kpi-03", "kpi-04", "kpi-06"];

// ===================================================================
// KPI OVERALL VALUE — same calculation as KPI tabs header
// ===================================================================
function computeKpiOverallValue_(report, kpiKey) {
  if (!report) return null;

  // KPI-01: weighted — total mortality / total birds (matches KPI tab)
  if (kpiKey === 'kpi-01' && report.days) {
    const valid = report.days.filter(d =>
      d.hasData &&
      Number(d.totalBirds) > 0 &&
      Number(d.bayMortality) > 0
    );
    if (!valid.length) return null;
    const sumBirds  = valid.reduce((s, d) => s + (Number(d.totalBirds) || 0), 0);
    const sumMortal = valid.reduce((s, d) => s + (Number(d.bayMortality) || 0), 0);
    return sumBirds > 0 ? (sumMortal / sumBirds) * 100 : null;
  }

  // KPI-02: weighted rate — total received / total time
  if (kpiKey === 'kpi-02') {
    if (report.totals && isFinite(report.totals.rate)) return report.totals.rate;
    return null;
  }

  // KPI-03 & KPI-04: weighted — total actual / total planned × 100
  if ((kpiKey === 'kpi-03' || kpiKey === 'kpi-04') && report.days) {
    const totalPlanned = report.days.reduce((s, d) => s + (Number(d.planned) || 0), 0);
    const totalActual  = report.days.reduce((s, d) => s + (Number(d.actual)  || 0), 0);
    if (totalPlanned <= 0) return null;
    return (totalActual / totalPlanned) * 100;
  }

  // KPI-05: weighted yield % — total dressed / total live × 100
  if (kpiKey === 'kpi-05') {
    if (report.totals && isFinite(report.totals.yieldPct)) return report.totals.yieldPct;
    return null;
  }

  // KPI-06: weighted chill loss %
  if (kpiKey === 'kpi-06') {
    if (report.totals && isFinite(report.totals.chillLossPct)) return report.totals.chillLossPct;
    return null;
  }

  return null;
}

function renderKpiCardsNew(data) {
  const container = document.getElementById("dashNewCards");
  if (!container) return;

  // 🆕 Filter KPI keys by user selection
  const keys = DASH_KPI_ORDER_.filter(k => dashNewState.selectedKpis.has(k));
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
      const overall = computeKpiOverallValue_(report, key);
      avgValue = (overall !== null && isFinite(overall))
        ? overall
        : extracted.values.reduce((a, b) => a + b, 0) / extracted.values.length;

      status = getKpiStatusNew(avgValue, config);

      if (key === "kpi-02") {
        displayValue = Math.round(avgValue).toLocaleString();
      } else {
        displayValue = avgValue.toFixed(2);
      }

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

    // ===================================================================
    // 🆕 STATUS FILTER — skip card if status not selected
    // ===================================================================
    const statusKey =
      status.status === "good"     ? "good" :
      status.status === "no-data"  ? "no-data" :
                                     "not-achieved";

    console.log(`[Card Filter] ${key} → status="${status.status}" → key="${statusKey}" → selected=${dashNewState.selectedStatuses.has(statusKey)}`);

    if (!dashNewState.selectedStatuses.has(statusKey)) {
      return;   // skip this KPI card
    }
    // ===================================================================

    const barWidth = avgValue !== null ? Math.min(100, (avgValue / config.standard) * 100) : 0;
    const trendDisplay = trend.direction === "up" ? `▲ ${trend.value.toFixed(1)}%` :
                        trend.direction === "down" ? `▼ ${trend.value.toFixed(1)}%` : "—";
    const trendClass = trend.direction === "up" ? "up" : trend.direction === "down" ? "down" : "";

    const stdDisplay = formatStdDisplay_(key, config);

    const accentColor =
      status.status === "good"     ? "#1B9E3A" :
      status.status === "no-data"  ? "#9e9e9e" :
                                     "#C62828";

    const accentLight =
      status.status === "good"     ? "rgba(27, 158, 58, 0.30)" :
      status.status === "no-data"  ? "rgba(158, 158, 158, 0.20)" :
                                     "rgba(198, 40, 40, 0.30)";

    html += `
      <div class="dash-kpi-card"
           data-kpi="${key}"
           role="button"
           tabindex="0"
           title="Open ${config.label} KPI"
           data-status="${status.status}"
           style="--card-accent: ${accentColor}; --card-accent-light: ${accentLight};">
        <div class="card-icon">${config.icon}</div>
        <div class="card-label">${config.shortLabel}</div>
        <div class="card-value">
          ${displayValue}<span class="unit">${config.unit}</span>
        </div>
        <div class="card-standard">
          <span class="std-label">Standard:</span>
          <span class="std-value">${stdDisplay}</span>
        </div>
        <div>
          <span class="card-status ${status.status}">${status.label}</span>
        </div>
        <div class="card-bar">
          <div class="card-bar-fill" style="width: ${barWidth}%; background: ${config.color}"></div>
        </div>
        <div class="card-pie-wrap">
          <canvas id="card-pie-${key}"></canvas>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;

  container.querySelectorAll(".dash-kpi-card").forEach((card) => {
    const kpiKey = card.dataset.kpi;
    if (!kpiKey) return;
    card.addEventListener("click", () => {
      if (typeof showView === "function") showView(kpiKey);
    });
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        if (typeof showView === "function") showView(kpiKey);
      }
    });
    renderSinglePieChart_(kpiKey, data[kpiKey], `card-pie-${kpiKey}`);
  });
}

function renderSingleChart(kpiKey, aggregated, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = `<canvas id="chart-${kpiKey}"></canvas>`;
  const canvas = document.getElementById(`chart-${kpiKey}`);
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const config = KPI_CONFIG_NEW[kpiKey];
  const chartType = dashNewState.chartType || "line";   // 🆕

  if (dashNewState.chartInstances[kpiKey]) {
    dashNewState.chartInstances[kpiKey].destroy();
  }

  const labels = aggregated.labels || [];
  const values = aggregated.values || [];
  const hasData = aggregated.hasData && values.length > 0;

  if (!hasData) {
    container.innerHTML = `
      <div class="dash-no-data">
        <span class="emoji">📊</span>
        No data available
      </div>
    `;
    return;
  }

  const gradient = ctx.createLinearGradient(0, 0, 0, 160);
  gradient.addColorStop(0, config.gradientFrom);
  gradient.addColorStop(1, config.gradientTo);

  const stdValue = config.standard;
  const stdLabel = `Standard (${stdValue}${config.unit === '%' ? '%' : ' ' + config.unit})`;

  // 🆕 Datasets differ by chart type
  let datasets;
  if (chartType === "column") {
    datasets = [
      {
        type: "line",                                    // standard as dashed line
        label: stdLabel,
        data: labels.map(() => stdValue),
        borderColor: "#c0564a",
        backgroundColor: "transparent",
        borderWidth: 2,
        borderDash: [6, 4],
        tension: 0,
        fill: false,
        pointRadius: 0,
        pointHoverRadius: 0,
        order: 1,                                        // draw on top
      },
      {
        type: "bar",                                     // actual as column
        label: config.shortLabel,
        data: values,
        backgroundColor: config.color + "CC",
        borderColor: config.color,
        borderWidth: 1.5,
        borderRadius: 4,
        barPercentage: 0.7,
        categoryPercentage: 0.8,
        order: 2,                                        // draw behind
      },
    ];
  } else {
    datasets = [
      {
        label: stdLabel,
        data: labels.map(() => stdValue),
        borderColor: "#c0564a",
        backgroundColor: "transparent",
        borderWidth: 1.5,
        borderDash: [6, 4],
        tension: 0,
        fill: false,
        pointRadius: 0,
        pointHoverRadius: 0,
        order: 2,
      },
      {
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
        order: 1,
      },
    ];
  }

  const chart = new Chart(ctx, {
    type: chartType === "column" ? "bar" : "line",       // 🆕
    data: { labels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
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
          },
        },
      },
      plugins: {
        legend: {
          display: true,
          position: "bottom",
          labels: {
            boxWidth: 12,
            boxHeight: 6,
            padding: 10,
            font: { size: 10 },
            usePointStyle: false,
            filter: (item) => !item.text.startsWith("Standard"),
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: "rgba(0,0,0,0.05)", drawBorder: false },
          ticks: {
            font: { size: 9 },
            maxTicksLimit: 5,
            callback: function(value) { return value + config.unit; },
          },
        },
        x: {
          grid: { display: false },
          ticks: { font: { size: 9 }, maxTicksLimit: 10 },
        },
      },
    },
  });

  dashNewState.chartInstances[kpiKey] = chart;
}

function renderAllCharts(yearData, viewMode) {
  const keys = DASH_KPI_ORDER_.filter(k => dashNewState.selectedKpis.has(k));   // 🆕

  keys.forEach(key => {
    const yearDays = yearData[key] || [];
    const pctField = KPI_PCT_FIELD_[key];
    const aggregated = aggregateYearByViewMode_(yearDays, pctField, viewMode);
    renderSingleChart(key, aggregated, `chart-container-${key}`);
  });
}

function renderSummaryTable(data) {
  const container = document.getElementById("dashNewSummary");
  if (!container) return;

  const keys = DASH_KPI_ORDER_.filter(k => dashNewState.selectedKpis.has(k));   // 🆕
  let html = `
    <table class="dash-summary-table">
      <thead>
        <tr>
          <th>KPI</th><th>Average</th><th>Min</th><th>Max</th><th>Status</th><th>vs Standard</th>
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
        <td><span class="status-dot ${status.status}"></span>${status.label}</td>
        <td>${vsStandard}</td>
      </tr>
    `;
  });

  html += `</tbody></table>`;
  container.innerHTML = html;
}

const pieCenterTextPlugin_ = {
  id: 'pieCenterText',
  afterDraw(chart) {
    const { ctx, chartArea, data } = chart;
    if (!chartArea) return;
    const total = (data.datasets[0].data || []).reduce((s, v) => s + (Number(v) || 0), 0);
    if (!total) return;
    const centerX = (chartArea.left + chartArea.right) / 2;
    const centerY = (chartArea.top + chartArea.bottom) / 2;
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 20px Arial, sans-serif';
    ctx.fillStyle = '#14213D';
    ctx.fillText(String(total), centerX, centerY - 6);
    ctx.font = '10px Arial, sans-serif';
    ctx.fillStyle = '#6b7280';
    ctx.fillText('days', centerX, centerY + 12);
    ctx.restore();
  }
};

function renderKpiDayPieCharts_(data) {
  const container = document.getElementById("dashNewPieCharts");
  if (!container) return;

  const keys = DASH_KPI_ORDER_;
  let html = "";
  keys.forEach((key) => {
    const config = KPI_CONFIG_NEW[key];
    html += `
      <div class="dash-pie-card">
        <div class="pie-card-header">
          <span class="pie-card-icon">${config.icon}</span>
          <span class="pie-card-title">${config.shortLabel}</span>
        </div>
        <div class="pie-chart-wrap">
          <canvas id="pie-${key}"></canvas>
        </div>
      </div>
    `;
  });
  container.innerHTML = html;

  keys.forEach((key) => renderSinglePieChart_(key, data[key]));
}

function renderSinglePieChart_(kpiKey, report, canvasId) {
  const canvas = document.getElementById(canvasId || `pie-${kpiKey}`);
  if (!canvas) return;

  const counts = computeMonthDayStatusCounts_(report, kpiKey);

  // Destroy previous instance if exists
  if (dashNewState.chartInstances[`pie-${kpiKey}`]) {
    dashNewState.chartInstances[`pie-${kpiKey}`].destroy();
    delete dashNewState.chartInstances[`pie-${kpiKey}`];
  }

  if (counts.total === 0) {
    canvas.parentElement.innerHTML = `<div class="card-pie-empty">No data for this month</div>`;
    return;
  }

  const ctx = canvas.getContext("2d");
  const labels = ['Good', 'Caution', 'Warning', 'Critical'];
  const values = [counts.good, counts.caution, counts.warning, counts.critical];
  const colors = [
    KPI_DAY_STATUS_COLORS_.good,
    KPI_DAY_STATUS_COLORS_.caution,
    KPI_DAY_STATUS_COLORS_.warning,
    KPI_DAY_STATUS_COLORS_.critical
  ];

  dashNewState.chartInstances[`pie-${kpiKey}`] = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data: values,
        backgroundColor: colors,
        borderColor: '#ffffff',
        borderWidth: 2,
        hoverOffset: 6
      }]
    },
    plugins: [pieCenterTextPlugin_],
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '65%',
      layout: { padding: 0 },
      animation: { duration: 800, easing: 'easeOutQuart' },
      plugins: {
        legend: { display: false },
        title:  { display: false },
        tooltip: {
          backgroundColor: 'rgba(20, 33, 61, 0.92)',
          titleColor: '#ffffff',
          bodyColor: '#ffffff',
          padding: 8,
          cornerRadius: 6,
          callbacks: {
            label: (ctx) => {
              const val = ctx.parsed;
              const pct = counts.total > 0 ? ((val / counts.total) * 100).toFixed(1) : '0.0';
              return ` ${ctx.label}: ${val} day${val !== 1 ? 's' : ''} (${pct}%)`;
            }
          }
        }
      }
    }
  });
}

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

    const data = await fetchAllKpiDataNew(year, month);
    dashNewState.data = data;

    const yearData = await fetchAllKpiYearDataNew(year);
    dashNewState.yearData = yearData;

    renderKpiCardsNew(data);
    renderAllCharts(yearData, viewMode);
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

function initDashboardNew() {
  const yearSelect = document.getElementById("dashNewYear");
  const monthSelect = document.getElementById("dashNewMonth");
  const refreshBtn = document.getElementById("dashNewRefreshBtn");
  const viewBtns = document.querySelectorAll(".dash-view-btn");

  if (!yearSelect) return;
  if (yearSelect.dataset.bound) return;
  yearSelect.dataset.bound = "true";

  const nowYear = new Date().getFullYear();
  for (let y = nowYear - 3; y <= nowYear + 1; y++) {
    const opt = document.createElement("option");
    opt.value = y;
    opt.textContent = y;
    if (y === nowYear) opt.selected = true;
    yearSelect.appendChild(opt);
  }
  monthSelect.value = new Date().getMonth() + 1;

  yearSelect.addEventListener("change", () => {
    dashNewState.year = parseInt(yearSelect.value);
    renderDashboardNew();
  });
  monthSelect.addEventListener("change", () => {
    dashNewState.month = parseInt(monthSelect.value);
    renderDashboardNew();
  });
  if (refreshBtn) refreshBtn.addEventListener("click", renderDashboardNew);

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
    // 🆕 Chart type toggle (Line / Column) — mutually exclusive
  const chartTypeLineEl   = document.getElementById("chartTypeLine");
  const chartTypeColumnEl = document.getElementById("chartTypeColumn");

  if (chartTypeLineEl && chartTypeColumnEl) {
    chartTypeLineEl.addEventListener("change", () => {
      if (chartTypeLineEl.checked) {
        chartTypeColumnEl.checked = false;
        dashNewState.chartType = "line";
      } else {
        // Both unchecked — reset to line
        chartTypeLineEl.checked = true;
        return;
      }
      if (dashNewState.yearData) {
        renderAllCharts(dashNewState.yearData, dashNewState.viewMode);
      } else {
        renderDashboardNew();
      }
    });

    chartTypeColumnEl.addEventListener("change", () => {
      if (chartTypeColumnEl.checked) {
        chartTypeLineEl.checked = false;
        dashNewState.chartType = "column";
      } else {
        // Both unchecked — reset to column
        chartTypeColumnEl.checked = true;
        return;
      }
      if (dashNewState.yearData) {
        renderAllCharts(dashNewState.yearData, dashNewState.viewMode);
      } else {
        renderDashboardNew();
      }
    });
  }

    // ===================================================================
  // 🆕 Multi-select dropdown helpers
  // ===================================================================
  function setupMultiSelect_(containerId, btnId, onSelectionChanged) {
    const container = document.getElementById(containerId);
    const btn = document.getElementById(btnId);
    if (!container || !btn) return;

    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      // Close other dropdowns
      document.querySelectorAll(".multi-select.open").forEach(el => {
        if (el !== container) el.classList.remove("open");
      });
      container.classList.toggle("open");
    });

    // Prevent clicks inside panel from closing
    const panel = container.querySelector(".multi-select-panel");
    panel.addEventListener("click", (e) => e.stopPropagation());

    // Outside click closes
    document.addEventListener("click", () => container.classList.remove("open"));

    // Optional callback — only call if provided
    if (typeof onSelectionChanged === "function") onSelectionChanged();
  }

  function updateKpiFilterLabel_() {
    const label = document.getElementById("kpiFilterLabel");
    const all = document.getElementById("kpiFilterAll");
    const items = document.querySelectorAll(".kpi-filter-item");
    const checked = Array.from(items).filter(i => i.checked);

    if (all.checked || checked.length === items.length) {
      label.textContent = "All KPIs";
    } else if (checked.length === 0) {
      label.textContent = "No KPIs";
    } else if (checked.length === 1) {
      label.textContent = checked[0].parentElement.querySelector("span").textContent.trim();
    } else {
      label.textContent = `${checked.length} KPIs`;
    }
  }

  function updateStatusFilterLabel_() {
    const label = document.getElementById("statusFilterLabel");
    const all = document.getElementById("statusFilterAll");
    const items = document.querySelectorAll(".status-filter-item");
    const checked = Array.from(items).filter(i => i.checked);

    if (all.checked || checked.length === items.length) {
      label.textContent = "All Status";
    } else if (checked.length === 0) {
      label.textContent = "No Status";
    } else if (checked.length === 1) {
      label.textContent = checked[0].dataset.status === "good" ? "Achieved" : "Not Achieved";
    } else {
      label.textContent = `${checked.length} Status`;
    }
  }

  // KPI Names filter
  const kpiFilterAll = document.getElementById("kpiFilterAll");
  const kpiFilterItems = document.querySelectorAll(".kpi-filter-item");

  kpiFilterAll.addEventListener("change", () => {
    kpiFilterItems.forEach(i => { i.checked = kpiFilterAll.checked; });
    dashNewState.selectedKpis = new Set(
      Array.from(kpiFilterItems).filter(i => i.checked).map(i => i.dataset.kpi)
    );
    updateKpiFilterLabel_();
    rerenderDashboard_();
  });

  kpiFilterItems.forEach(item => {
    item.addEventListener("change", () => {
      const checkedCount = Array.from(kpiFilterItems).filter(i => i.checked).length;
      kpiFilterAll.checked = checkedCount === kpiFilterItems.length;

      dashNewState.selectedKpis = new Set(
        Array.from(kpiFilterItems).filter(i => i.checked).map(i => i.dataset.kpi)
      );
      updateKpiFilterLabel_();
      rerenderDashboard_();
    });
  });

  // Status filter
  const statusFilterAll = document.getElementById("statusFilterAll");
  const statusFilterItems = document.querySelectorAll(".status-filter-item");

  statusFilterAll.addEventListener("change", () => {
    statusFilterItems.forEach(i => { i.checked = statusFilterAll.checked; });
    dashNewState.selectedStatuses = new Set(
      Array.from(statusFilterItems).filter(i => i.checked).map(i => i.dataset.status)
    );
    updateStatusFilterLabel_();
    rerenderDashboard_();
  });

  statusFilterItems.forEach(item => {
    item.addEventListener("change", () => {
      const checkedCount = Array.from(statusFilterItems).filter(i => i.checked).length;
      statusFilterAll.checked = checkedCount === statusFilterItems.length;

      dashNewState.selectedStatuses = new Set(
        Array.from(statusFilterItems).filter(i => i.checked).map(i => i.dataset.status)
      );
      updateStatusFilterLabel_();
      rerenderDashboard_();
    });
  });

  // Initialize dropdown open/close
  setupMultiSelect_("kpiFilter", "kpiFilterBtn");
  setupMultiSelect_("statusFilter", "statusFilterBtn");

  // Rerender helper (uses cached data if available)
  function rerenderDashboard_() {
    if (dashNewState.data && dashNewState.yearData) {
      renderKpiCardsNew(dashNewState.data);
      renderAllCharts(dashNewState.yearData, dashNewState.viewMode);
      renderSummaryTable(dashNewState.data);
    } else {
      renderDashboardNew();
    }
  }

  renderDashboardNew();
}

function generateChartContainers() {
  const container = document.getElementById("dashNewCharts");
  if (!container) return;

  // 🆕 Order: Dressed Yield → Bay Mortality → Unloading → Slaughter → Packing → Chill
  const keys = DASH_KPI_ORDER_.map(id => ({
    id,
    label: KPI_CONFIG_NEW[id].label
  }));

  let html = "";
  keys.forEach(k => {
    const config = KPI_CONFIG_NEW[k.id];
    const stdDisplay = formatStdDisplay_(k.id, config);

    html += `
      <div class="dash-chart-card" style="border-top: 3px solid ${config.color}">
        <div class="chart-header">
          <span class="chart-title">${config.icon} ${config.label}</span>
          <span class="chart-badge" style="background:#fdecea; color:#c0564a; font-weight:700;">
            Standard: ${stdDisplay}
          </span>
        </div>
        <div class="chart-container" id="chart-container-${k.id}">
          <canvas id="chart-${k.id}"></canvas>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}

document.addEventListener("DOMContentLoaded", function() {
  generateChartContainers();
  initDashboardNew();
});

let notificationChartInstances = {};

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

    const totalCaution = data.buckets.caution.length;
    const totalWarning = data.buckets.warning.length;
    const totalCritical = data.buckets.critical.length;
    const totalIssues = totalCaution + totalWarning + totalCritical;

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

    const notifyCfg = NOTIFICATION_KPI_CONFIGS_[config.kpiKey] || {};
    const valueSuffix   = notifyCfg.valueSuffix;
    const valueDecimals = notifyCfg.valueDecimals;

    const cautionHtml  = renderNotifyStatusTable_("Caution",  data.buckets.caution,  "caution",  valueSuffix, valueDecimals);
    const warningHtml  = renderNotifyStatusTable_("Warning",  data.buckets.warning,  "warning",  valueSuffix, valueDecimals);
    const criticalHtml = renderNotifyStatusTable_("Critical", data.buckets.critical, "critical", valueSuffix, valueDecimals);

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

function renderNotifyStatusTable_(title, entries, statusKey, valueSuffix, valueDecimals) {
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

  const suffix = (valueSuffix !== undefined && valueSuffix !== null) ? valueSuffix : '%';
  const decimals = (valueDecimals !== undefined && valueDecimals !== null) ? valueDecimals : 2;

  const rows = entries.map((e) => {
    const deliveryDisplay = e.sent
      ? `<span style="color:#2e7d32;font-weight:bold;">✅ Sent</span>`
      : `<span style="color:#9e9e9e;">Pending</span>`;
    const responseDisplay = e.response
      ? escapeNotificationHtml_(e.response).replace(/\n/g, '<br>')
      : `<span style="color:#9e9e9e;">—</span>`;

    const valueDisplay = Number(e.value).toFixed(decimals) + suffix;

    return `<tr>
      <td style="font-weight:500;text-align:center;padding:3px 4px;font-size:12px;">${formatDateDMY_(e.date)}</td>
      <td style="font-weight:600;color:${statusColors[statusKey] || '#333'};text-align:center;padding:3px 4px;font-size:12px;">${valueDisplay}</td>
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

function renderNotifyChart(num, data) {
  const canvas = document.getElementById(`notifyChart_${num}`);
  if (!canvas) return;

  if (notificationChartInstances[num]) {
    notificationChartInstances[num].destroy();
    delete notificationChartInstances[num];
  }

  const allEntries = [
    ...data.buckets.caution.map(e => ({ ...e, status: 'caution' })),
    ...data.buckets.warning.map(e => ({ ...e, status: 'warning' })),
    ...data.buckets.critical.map(e => ({ ...e, status: 'critical' })),
  ];

  const ctx = canvas.getContext('2d');

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
        scales: { y: { beginAtZero: true, max: 1, display: false }, x: { display: false } }
      }
    });
    return;
  }

  const statusColors = { caution: '#d4a017', warning: '#e07b00', critical: '#c0392b' };
  const statusLabels = { caution: 'Caution', warning: 'Warning', critical: 'Critical' };

  const grouped = {};
  allEntries.forEach(e => {
    if (!grouped[e.status]) grouped[e.status] = [];
    grouped[e.status].push(e);
  });

  const labels = Object.keys(grouped).map(s => statusLabels[s] || s);
  const counts = Object.keys(grouped).map(s => grouped[s].length);
  const colors = Object.keys(grouped).map(s => statusColors[s] || '#999');

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
          ticks: { stepSize: 1, font: { size: 9 } }
        },
        x: {
          title: { display: true, text: 'Category', font: { size: 10 } },
          ticks: { font: { size: 10, weight: 'bold' } }
        }
      },
      animation: { duration: 600, easing: 'easeOutQuart' }
    }
  });
}

async function buildNotificationData_(kpiKey, year, month) {
  const builderMap = {
    "kpi-01": { builder: buildBayMortalityYearData_,    colorClass: bayMortalityColorClass_,      valueField: "pct",           sheetName: "Live_Bird_Bay_Mortality_Rate_%" },
    "kpi-02": { builder: buildBirdUnloadYearData_,      colorClass: birdUnloadColorClass_,        valueField: "rate",          sheetName: "Birds_Unloading_Rate_%" },
    "kpi-03": { builder: buildSlaughterEfficiencyYearData_, colorClass: slaughterEfficiencyColorClass_, valueField: "pct",       sheetName: "Slaughter_Line_Efficiency_%" },
    "kpi-04": { builder: buildPackingEfficiencyYearData_,   colorClass: packingEfficiencyColorClass_,   valueField: "pct",       sheetName: "Packing_Line_Efficiency_%" },
    "kpi-05": { builder: buildDressedYieldYearData_,    colorClass: dressedYieldColorClass_,      valueField: "yieldPct",      sheetName: "Dressed_Yield_%" },
    "kpi-06": { builder: buildChillLossYearData_,       colorClass: chillLossColorClass_,         valueField: "chillLossPct",  sheetName: "Chill_Loss_%" },
  };

  const config = builderMap[kpiKey];
  if (!config) return { available: false, label: kpiKey };

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