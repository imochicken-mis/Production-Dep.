// js/reports.js
// Generic report engine — reused by every report.
// Adding a new report = adding a config object here, nothing else.

const REPORTS_ = {
  lbInput: {
    title: "Daily LB Input Report",
    sheetName: "DataLBSummary",
    dateField: "Date",
    groupField: "Location",
    averageOf: { numerator: "Live_weight", denominator: "No_of_birds" },
    metrics: [
  { label: "Live Birds (NOB)", key: "No_of_birds", decimals: 0 },
  { label: "Live weight (Kg)", key: "Live_weight", decimals: "auto" },
  { label: "Average weight (Kg)", key: "Average_weight", isAverage: true, decimals: "auto" },
  { label: "Transport (NOB)", key: "Transport_Mortality", decimals: 0 },
  { label: "Transport (Kg)", key: "Transport_Mortality_Weight", decimals: "auto" },
  { label: "Bay (NOB)", key: "Bay_Mortality", decimals: 0 },
  { label: "Bay (Kg)", key: "Bay_Mortality_Weight", decimals: "auto" },
  { label: "Total Mortality (Kg)", key: "Total_Weight_of_dead_birds", decimals: "auto" },
  { label: "Halal (NOB)", key: "Number_of_Halal_rejected_birds", decimals: 0 },
  { label: "Halal (Kg)", key: "Weight_of_Halal_rejected_birds", decimals: "auto" },
  { label: "Other (NOB)", key: "Number_of_other_rejected_birds", decimals: 0 },
  { label: "Other (Kg)", key: "Weight_of_other_rejected_birds", decimals: "auto" },
  { label: "Total Rejected (Kg)", key: "Total_Weight_of_rejected_birds", decimals: "auto" },
  { label: "Net Live Birds (NOB)", key: "No_of_birds_to_plant", decimals: 0 },
  { label: "Net Live Weight (Kg)", key: "Live_weight_to_plant", decimals: "auto" },
],
  },
  // ⬇️ ඉස්සරහට report අලුතක් = මෙතනට config object එකක් විතරයි add කරන්නේ
};

function getBatchNo_(dateStr) {
  const year = Number(dateStr.split("-")[0]);
  const dateObj = new Date(dateStr);
  const dayOfYear = Math.floor((dateObj - new Date(year, 0, 1)) / 86400000) + 1;
  return String(year).slice(-2) + String(dayOfYear).padStart(3, "0");
}

// Fetches raw sheet data, then groups/aggregates in-browser
async function buildReport(reportKey, dateStr) {
  const config = REPORTS_[reportKey];
  const allRows = await Api.list(config.sheetName);
  const dayRows = allRows.filter((r) => String(r[config.dateField]) === dateStr);

  // Each row = one column (no grouping/merging by location name)
  const columnLabels = dayRows.map((r) => r[config.groupField] || "-");

  const metrics = config.metrics.map((m) => {
    const values = dayRows.map((r) => Number(r[m.key]) || 0);

    let total;
    if (m.isAverage && config.averageOf) {
      const num = dayRows.reduce((s, r) => s + (Number(r[config.averageOf.numerator]) || 0), 0);
      const den = dayRows.reduce((s, r) => s + (Number(r[config.averageOf.denominator]) || 0), 0);
      total = den > 0 ? +(num / den).toFixed(2) : 0;
    } else {
      total = values.reduce((s, v) => s + v, 0);
    }
    return { label: m.label, values, total, decimals: m.decimals ?? 2 };
  });

  return { title: config.title, date: dateStr, batchNo: getBatchNo_(dateStr), locations: columnLabels, metrics };
}

// ===================================================================
// TOTAL LB REPORT — date rows, metric columns, month/year filtered
// (different shape from lbInput, so it gets its own builder)
// ===================================================================

const TOTAL_LB_COLUMNS_ = [
  { label: "No of Birds", key: "No_of_birds", group: "Farm Out" },
  { label: "Live Weight", key: "Live_weight", group: "Farm Out", decimals: "auto" },
  { label: "Transport (NOB)", key: "Transport_Mortality", group: "Mortality" },
  { label: "Transport (KG)", key: "Transport_Mortality_Weight", group: "Mortality", decimals: "auto" },
  { label: "Bay (NOB)", key: "Bay_Mortality", group: "Mortality" },
  { label: "Bay (KG)", key: "Bay_Mortality_Weight", group: "Mortality", decimals: "auto" },
  { label: "Halal (NOB)", key: "Number_of_Halal_rejected_birds", group: "Rejected" },
  { label: "Halal (KG)", key: "Weight_of_Halal_rejected_birds", group: "Rejected", decimals: "auto" },
  { label: "Other (NOB)", key: "Number_of_other_rejected_birds", group: "Rejected" },
  { label: "Other (KG)", key: "Weight_of_other_rejected_birds", group: "Rejected", decimals: "auto" },
  { label: "No of Birds", key: "No_of_birds_to_plant", group: "Plant In" },
  { label: "Live Weight", key: "Live_weight_to_plant", group: "Plant In", decimals: "auto" },
];

async function buildTotalLbReport(year, month) {
  const allRows = await Api.list("DataLBSummary");

  // Keep only rows in the selected year-month
  const monthPrefix = `${year}-${String(month).padStart(2, "0")}-`;
  const monthRows = allRows.filter((r) => String(r.Date).startsWith(monthPrefix));

  const daysInMonth = new Date(Number(year), Number(month), 0).getDate();

  const dateRows = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${monthPrefix}${String(d).padStart(2, "0")}`;
    const rowsForDate = monthRows.filter((r) => String(r.Date) === dateStr);

    if (rowsForDate.length === 0) {
      dateRows.push({ date: dateStr, hasData: false, metrics: {}, percentage: null });
      continue;
    }

    const metrics = {};
    TOTAL_LB_COLUMNS_.forEach((col) => {
      metrics[col.key] = rowsForDate.reduce((s, r) => s + (Number(r[col.key]) || 0), 0);
    });

    const birds = metrics["No_of_birds"] || 0;
    const dead = (metrics["Transport_Mortality"] || 0) + (metrics["Bay_Mortality"] || 0);
    const percentage = birds > 0 ? (dead / birds) * 100 : null;

    dateRows.push({ date: dateStr, hasData: true, metrics, percentage });
  }

  // Totals row
  const totals = {};
  TOTAL_LB_COLUMNS_.forEach((col) => {
    totals[col.key] = dateRows.reduce((s, r) => s + (r.metrics[col.key] || 0), 0);
  });
  const totalBirds = totals["No_of_birds"] || 0;
  const totalDead = (totals["Transport_Mortality"] || 0) + (totals["Bay_Mortality"] || 0);
  const totalPercentage = totalBirds > 0 ? (totalDead / totalBirds) * 100 : null;

  return { year, month, dateRows, totals, totalPercentage };
}

// ===================================================================
// CHILL WEIGHT REPORT — fixed item list, 2-column layout,
// pulls from 3 sheets, computes Chill Weight
// ===================================================================

const CHILL_WEIGHT_LEFT_ = [
  { code: "01CW01", name: "Whole Chicken (S)" },
  { code: "01CW02", name: "Whole Chicken (L)" },
  { code: "01CW03", name: "Whole Chicken (XL)" },
  { code: "01CW06", name: "Half Chicken" },
  { code: "02CW01", name: "WOG (S)" },
  { code: "02CW02", name: "WOG (M)" },
  { code: "02CW03", name: "WOG (L)" },
  { code: "02CW04", name: "WOG (XL)" },
  { code: "02CW05", name: "WOG (XXL)" },
  { code: "02CW09", name: "WOG (M) SP" },
  { code: "03CW01", name: "Skinless Whole Chicken (S)" },
  { code: "03CW02", name: "Skinless Whole Chicken (M)" },
  { code: "03CW03", name: "Skinless Whole Chicken (L)" },
  { code: "03CW04", name: "Skinless Whole Chicken (XL)" },
  { code: "03CW05", name: "Skinless Whole Chicken (XXL)" },
  { code: "03CW08", name: "Skinless Whole Chicken (M) SP" },
  { code: "04CP01", name: "Skinless Breast" },
  { code: "04CP02", name: "Skinon Breast" },
  { code: "04CP03", name: "Skinless Drumstick" },
  { code: "04CP04", name: "Skinon Drumstick" },
  { code: "04CP05", name: "Skinon Drumstick SP (100g)" },
  { code: "04CP06", name: "Skinless Thigh" },
  { code: "04CP07", name: "Skinless Thigh SP (100g)" },
  { code: "04CP08", name: "Skinon Thigh" },
  { code: "04CP09", name: "Skinless Leg" },
  { code: "04CP11", name: "Skinon Leg" },
  { code: "04CP12", name: "Skinless Back Quarter" },
  { code: "04CP13", name: "Skinless Back Quarter SP" },
];

const CHILL_WEIGHT_RIGHT_ = [
  { code: "04CP14", name: "Skinon Back Quarter" },
  { code: "04CP16", name: "Whole Wing" },
  { code: "04CP17", name: "Winglet" },
  { code: "04CP19", name: "Chicken Lolipop" },
  { code: "04CP20", name: "Wing Tip 500g" },
  { code: "04CP22", name: "Neck" },
  { code: "04CP23", name: "Bite Pieces 500g" },
  { code: "04CP24", name: "Liver 500g" },
  { code: "04CP25", name: "Liver 1 Kg" },
  { code: "04CP26", name: "Gizzard 500g" },
  { code: "04CP27", name: "Gizzard 1 Kg" },
  { code: "04CP28", name: "Gadget 500g" },
  { code: "04CP29", name: "Curry Pieces 500g" },
  { code: "04CP30", name: "Soup Bone" },
  { code: "04CP31", name: "Thigh Bone" },
  { code: "04CP32", name: "Kitchen Pack 500g" },
  { code: "04CP34", name: "Easy - Pet Food" },
  { code: "04CP34", name: "Production - Pet Food" },
  { code: "04CP36", name: "Kitchen Item" },
  { code: "04CP37", name: "MDM Mat 500g" },
  { code: "04CP40", name: "Middle Wing" },
  { code: "04CP41", name: "Neck 500g" },
  { code: "05CM01", name: "Skinless Boneless Breast" },
  { code: "05CM02", name: "Skinless Boneless Thigh" },
  { code: "05CM03", name: "Chicken Skin" },
  { code: "05CM04", name: "Chicken Fat" },
  { code: "09GP09", name: "Giblet Production", highlight: true },
  { code: "09EM09", name: "WIP(Easy Metirial)", highlight: true },
];

async function buildChillWeightReport(dateStr) {
  const [chillRows, gibletRows, fbpRows] = await Promise.all([
    Api.list("DataPackingChillWeight"),
    Api.list("DataPackingGiblet"),
    Api.list("DataFBPProduction"),
  ]);

  const chillDay = chillRows.filter((r) => String(r.Date) === dateStr);
  const gibletDay = gibletRows.filter((r) => String(r.Date) === dateStr);
  const fbpDay = fbpRows.filter((r) => String(r.Date) === dateStr);

  // Sum weight per item code (handles duplicate codes / multiple entries)
  const weightByCode = {};
  chillDay.forEach((r) => {
    const code = r.Item_Code || "";
    weightByCode[code] = (weightByCode[code] || 0) + (Number(r.Weight) || 0);
  });

  const attachValues = (list) => list.map((item) => ({
    ...item,
    value: weightByCode[item.code] !== undefined ? weightByCode[item.code] : 0,
  }));

  const left = attachValues(CHILL_WEIGHT_LEFT_);
  const right = attachValues(CHILL_WEIGHT_RIGHT_);

  const totalFinishedGoods = chillDay.reduce((s, r) => s + (Number(r.Weight) || 0), 0);
  const gibletUse = gibletDay.reduce((s, r) => s + (Number(r.Qty) || 0), 0);
  const petFood = fbpDay
    .filter((r) => String(r.Item_Code) === "04CP34")
    .reduce((s, r) => s + (Number(r.Weight) || 0), 0);
  const chillWeight = totalFinishedGoods - (gibletUse + petFood);

  return { date: dateStr, left, right, totalFinishedGoods, gibletUse, petFood, chillWeight };
}

// ===================================================================
// DRESS WEIGHT REPORT — Table 1 (per-farm LB summary) +
// Table 2 (item weights from DataFBPProduction) + Dress Weight/Yield %
// ===================================================================

async function buildDressWeightReport(dateStr) {
  const [lbRows, fbpRows, gibletRows] = await Promise.all([
    Api.list("DataLBSummary"),
    Api.list("DataFBPProduction"),
    Api.list("DataPackingGiblet"),
  ]);

  const lbDay = lbRows.filter((r) => String(r.Date) === dateStr);
  const fbpDay = fbpRows.filter((r) => String(r.Date) === dateStr);
  const gibletDay = gibletRows.filter((r) => String(r.Date) === dateStr);

  // ---- Table 1: one row per farm entry (not deduped/merged) ----
  const farms = lbDay.map((r, i) => ({
    sno: String(i + 1).padStart(2, "0"),
    farmName: r.Location || "-",
    noOfBirds: Number(r.No_of_birds) || 0,
    avgWeight: Number(r.Average_weight) || 0,
    liveWeight: Number(r.Live_weight) || 0,
    rejectedWeight: Number(r.Total_Weight_of_rejected_birds) || 0,
    liveWeightToPlant: Number(r.Live_weight_to_plant) || 0,
  }));

  const farmTotals = {
    noOfBirds: farms.reduce((s, f) => s + f.noOfBirds, 0),
    liveWeight: farms.reduce((s, f) => s + f.liveWeight, 0),
    rejectedWeight: farms.reduce((s, f) => s + f.rejectedWeight, 0),
    liveWeightToPlant: farms.reduce((s, f) => s + f.liveWeightToPlant, 0),
  };

  // ---- Table 2: item weights from DataFBPProduction (reuses Chill Weight item list) ----
  const weightByCode = {};
  fbpDay.forEach((r) => {
    const code = r.Item_Code || "";
    weightByCode[code] = (weightByCode[code] || 0) + (Number(r.Weight) || 0);
  });

  const attachValues = (list) => list.map((item) => ({
    ...item,
    value: weightByCode[item.code] !== undefined ? weightByCode[item.code] : 0,
  }));

  const left = attachValues(CHILL_WEIGHT_LEFT_);
  const right = attachValues(CHILL_WEIGHT_RIGHT_);

  const totalFinishedGoods = [...left, ...right].reduce((s, i) => s + i.value, 0);
  const gibletUse = gibletDay.reduce((s, r) => s + (Number(r.Qty) || 0), 0);
  const petFood = fbpDay
    .filter((r) => String(r.Item_Code) === "04CP34")
    .reduce((s, r) => s + (Number(r.Weight) || 0), 0);

  const dressWeight = totalFinishedGoods - (gibletUse + petFood);
  const yieldPct = farmTotals.liveWeightToPlant > 0
    ? (dressWeight / farmTotals.liveWeightToPlant) * 100
    : 0;

  return {
    date: dateStr,
    batchNo: getBatchNo_(dateStr),   // ← add කරන්න
    farms, farmTotals, left, right,
    totalFinishedGoods, gibletUse, petFood, dressWeight, yieldPct,
  };
}

// ===================================================================
// PRODUCTION REPORT — reuses Dress Weight Report (Table 1 + 2) and
// adds Daily Easy Production Summary (Table 3)
// ===================================================================

const EASY_PRODUCTION_ITEMS_ = [
  { code: "06CE01", name: "Imo Easy 250 g" },
  { code: "06CE02", name: "Imo Easy 400 g" },
  { code: "06CE03", name: "Imo Easy 700 g" },
  { code: "06CE05", name: "Imo Easy 5kg" },
  { code: "04CP34", name: "Petfood" },
];

async function buildProductionWeightReport(dateStr) {
  const base = await buildDressWeightReport(dateStr);   // Table 1 + Table 2 (reused)

  const easyRows = await Api.list("DataEasyProduction");
  const easyDay = easyRows.filter((r) => String(r.Date) === dateStr);

  const usedEasyMaterialNetWeight = easyDay
    .filter((r) => String(r.Item_Code) === "NET_WEIGHT")
    .reduce((s, r) => s + (Number(r.Weight) || 0), 0);

  const easyWeightByCode = {};
  easyDay.forEach((r) => {
    const code = r.Item_Code || "";
    easyWeightByCode[code] = (easyWeightByCode[code] || 0) + (Number(r.Weight) || 0);
  });

  const easyProducts = EASY_PRODUCTION_ITEMS_.map((item) => ({
    ...item,
    value: easyWeightByCode[item.code] !== undefined ? easyWeightByCode[item.code] : 0,
  }));

  const totalEasyProductWeight = easyProducts.reduce((s, p) => s + p.value, 0);
  const easyYieldPct = usedEasyMaterialNetWeight > 0
    ? (totalEasyProductWeight / usedEasyMaterialNetWeight) * 100
    : 0;

  return {
    ...base,   // date, batchNo, farms, farmTotals, left, right, totalFinishedGoods, gibletUse, petFood, dressWeight, yieldPct
    usedEasyMaterialNetWeight, easyProducts, totalEasyProductWeight, easyYieldPct,
  };
}

// ===================================================================
// CHILL WEIGHT vs DRESS WEIGHT REPORT — single combined item list,
// compares DataPackingChillWeight vs DataFBPProduction per item code
// ===================================================================

async function buildChillVsDressReport(dateStr) {
  const [chillRows, fbpRows] = await Promise.all([
    Api.list("DataPackingChillWeight"),
    Api.list("DataFBPProduction"),
  ]);

  const chillDay = chillRows.filter((r) => String(r.Date) === dateStr);
  const fbpDay = fbpRows.filter((r) => String(r.Date) === dateStr);

  const chillByCode = {};
  chillDay.forEach((r) => {
    const code = r.Item_Code || "";
    chillByCode[code] = (chillByCode[code] || 0) + (Number(r.Weight) || 0);
  });

  const dressByCode = {};
  fbpDay.forEach((r) => {
    const code = r.Item_Code || "";
    dressByCode[code] = (dressByCode[code] || 0) + (Number(r.Weight) || 0);
  });

  const allItems = [...CHILL_WEIGHT_LEFT_, ...CHILL_WEIGHT_RIGHT_];

  const items = allItems.map((item) => {
  const chillWeight = chillByCode[item.code] !== undefined ? chillByCode[item.code] : 0;
  const dressWeight = dressByCode[item.code] !== undefined ? dressByCode[item.code] : 0;
  const difference = chillWeight - dressWeight;
  const differencePct = chillWeight > 0 ? (difference / chillWeight) * 100 : 0;
  return {
    code: item.code,
    name: item.name,
    highlight: item.highlight,
    chillWeight,
    dressWeight,
    difference,
    differencePct,
  };
});

  const totals = {
    chillWeight: items.reduce((s, i) => s + i.chillWeight, 0),
    dressWeight: items.reduce((s, i) => s + i.dressWeight, 0),
    difference: items.reduce((s, i) => s + i.difference, 0),
  };
  totals.differencePct = totals.chillWeight > 0 ? (totals.difference / totals.chillWeight) * 100 : 0;

  return { date: dateStr, batchNo: getBatchNo_(dateStr), items, totals };
}

// ===================================================================
// TOTAL PRODUCTION SUMMARY — items (rows) × days of month (columns),
// data from DataFBPProduction, month/year filtered
// ===================================================================

const TOTAL_PRODUCTION_ITEMS_ = [
  { code: "01CW01", name: "Whole Chicken (S)" },
  { code: "01CW02", name: "Whole Chicken (L)" },
  { code: "01CW03", name: "Whole Chicken (XL)" },
  { code: "01CW06", name: "Half Chicken" },
  { code: "02CW01", name: "WOG (S)" },
  { code: "02CW02", name: "WOG (M)" },
  { code: "02CW03", name: "WOG (L)" },
  { code: "02CW04", name: "WOG (XL)" },
  { code: "02CW05", name: "WOG (XXL)" },
  { code: "02CW09", name: "WOG (M) SP" },
  { code: "03CW01", name: "Skinless Whole Chicken (S)" },
  { code: "03CW02", name: "Skinless Whole Chicken (M)" },
  { code: "03CW03", name: "Skinless Whole Chicken (L)" },
  { code: "03CW04", name: "Skinless Whole Chicken (XL)" },
  { code: "03CW05", name: "Skinless Whole Chicken (XXL)" },
  { code: "03CW08", name: "Skinless Whole Chicken (M) SP" },
  { code: "04CP01", name: "Skinless Breast" },
  { code: "04CP02", name: "Skinon Breast" },
  { code: "04CP03", name: "Skinless Drumstick" },
  { code: "04CP04", name: "Skinon Drumstick" },
  { code: "04CP05", name: "Skinon Drumstick SP (100g)" },
  { code: "04CP06", name: "Skinless Thigh" },
  { code: "04CP07", name: "Skinless Thigh SP (100g)" },
  { code: "04CP08", name: "Skinon Thigh" },
  { code: "04CP09", name: "Skinless Leg" },
  { code: "04CP11", name: "Skinon Leg" },
  { code: "04CP12", name: "Skinless Back Quarter" },
  { code: "04CP13", name: "Skinless Back Quarter SP" },
  { code: "04CP14", name: "Skinon Back Quarter" },
  { code: "04CP16", name: "Whole Wing" },
  { code: "04CP17", name: "Winglet" },
  { code: "04CP19", name: "Chicken Lolipop" },
  { code: "04CP20", name: "Wing Tip 500g" },
  { code: "04CP22", name: "Neck" },
  { code: "04CP23", name: "Bite Pieces 500g" },
  { code: "04CP24", name: "Liver 500g" },
  { code: "04CP25", name: "Liver 1 Kg" },
  { code: "04CP26", name: "Gizzard 500g" },
  { code: "04CP27", name: "Gizzard 1 Kg" },
  { code: "04CP28", name: "Gadget 500g" },
  { code: "04CP29", name: "Curry Pieces 500g" },
  { code: "04CP30", name: "Soup Bone" },
  { code: "04CP31", name: "Thigh Bone" },
  { code: "04CP32", name: "Kitchen Pack 500g" },
  { code: "04CP34", name: "Easy - Pet Food" },
  { code: "04CP34", name: "Production - Pet Food" },
  { code: "04CP36", name: "Kitchen Item" },
  { code: "04CP37", name: "MDM Mat 500g" },
  { code: "04CP40", name: "Middle Wing" },
  { code: "04CP41", name: "Neck 500g" },
  { code: "05CM01", name: "Skinless Boneless Breast" },
  { code: "05CM02", name: "Skinless Boneless Thigh" },
  { code: "05CM03", name: "Chicken Skin" },
  { code: "05CM04", name: "Chicken Fat" },
  { code: "09GP09", name: "Giblet Production"},
  { code: "09EM09", name: "WIP(Easy Metirial)"},
  { code: "", name: "Giblet Use for Whole Chicken" },
  { code: "06CE01", name: "EASY 250g" },
  { code: "06CE02", name: "EASY 400g" },
  { code: "06CE03", name: "EASY 700g" },
  { code: "06CE05", name: "Easy 05kg" },
];

async function buildTotalProductionSummary(year, month) {
  const [fbpRows, gibletRows, easyRows] = await Promise.all([
    Api.list("DataFBPProduction"),
    Api.list("DataPackingGiblet"),
    Api.list("DataEasyProduction"),
  ]);

  const monthPrefix = `${year}-${String(month).padStart(2, "0")}-`;

  const fbpMonth = fbpRows.filter((r) => String(r.Date).startsWith(monthPrefix));
  const gibletMonth = gibletRows.filter((r) => String(r.Date).startsWith(monthPrefix));
  const easyMonth = easyRows.filter((r) => String(r.Date).startsWith(monthPrefix));

  const daysInMonth = new Date(Number(year), Number(month), 0).getDate();

  // weightByCode[itemCode][day] = summed weight — from DataFBPProduction (default source)
  const weightByCode = {};
  fbpMonth.forEach((r) => {
    const code = r.Item_Code || "";
    const day = Number(String(r.Date).split("-")[2]);
    if (!weightByCode[code]) weightByCode[code] = {};
    weightByCode[code][day] = (weightByCode[code][day] || 0) + (Number(r.Weight) || 0);
  });

  // gibletByDay[day] = summed Qty — from DataPackingGiblet, for "Giblet Use for Whole Chicken"
  const gibletByDay = {};
  gibletMonth.forEach((r) => {
    const day = Number(String(r.Date).split("-")[2]);
    gibletByDay[day] = (gibletByDay[day] || 0) + (Number(r.Qty) || 0);
  });

  // easyByCode[itemCode][day] = summed Weight — from DataEasyProduction, for the 4 Easy items
  const easyByCode = {};
  easyMonth.forEach((r) => {
    const code = r.Item_Code || "";
    const day = Number(String(r.Date).split("-")[2]);
    if (!easyByCode[code]) easyByCode[code] = {};
    easyByCode[code][day] = (easyByCode[code][day] || 0) + (Number(r.Weight) || 0);
  });

  const EASY_CODES_ = ["06CE01", "06CE02", "06CE03", "06CE05"];

  const items = TOTAL_PRODUCTION_ITEMS_.map((item) => {
    const values = [];
    let rowTotal = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      let v;
      if (item.code === "" && item.name === "Giblet Use for Whole Chicken") {
        v = gibletByDay[d] || 0;
      } else if (EASY_CODES_.includes(item.code)) {
        v = (easyByCode[item.code] && easyByCode[item.code][d]) || 0;
      } else {
        v = (weightByCode[item.code] && weightByCode[item.code][d]) || 0;
      }
      values.push(v);
      rowTotal += v;
    }
    return { code: item.code, name: item.name, highlight: item.highlight, values, rowTotal };
  });

  const columnTotals = [];
  for (let d = 1; d <= daysInMonth; d++) {
    columnTotals.push(items.reduce((s, i) => s + i.values[d - 1], 0));
  }
  const grandTotal = columnTotals.reduce((s, v) => s + v, 0);

  return { year, month, daysInMonth, items, columnTotals, grandTotal };
}

// ===================================================================
// SALES FORECAST vs PRODUCTION — items with fixed weight ranges,
// compares Data_Production_Forecast vs DataFBPProduction, month filtered
// ===================================================================

const SFP_ITEMS_ = [
  { code: "01CW01", name: "Whole Chicken (S)", range: "850-1100" },
  { code: "01CW02", name: "Whole Chicken (L)", range: "1101-1400" },
  { code: "01CW03", name: "Whole Chicken (XL)", range: "1401-2000" },
  { code: "01CW05", name: "Krosher Whole Chicken", range: "-" },
  { code: "01CW06", name: "Half Chicken", range: "600 - 800" },
  { code: "02CW01", name: "Whole Chicken - Without Giblets (S)", range: "900-1000" },
  { code: "02CW03", name: "Whole Chicken - Without Giblets (L)", range: "1201-1300" },
  { code: "02CW04", name: "Whole Chicken - Without Giblets (XL)", range: "1301-1500" },
  { code: "02CW05", name: "Whole Chicken - Without Giblets (XXL)", range: "1501-1800" },
  { code: "02CW09", name: "Whole Chicken - Without Giblets (M) Special", range: "1101-1200" },
  { code: "03CW01", name: "Skinless Whole Chicken (S)", range: "900-1100" },
  { code: "03CW03", name: "Skinless Whole Chicken (L)", range: "1201-1400" },
  { code: "03CW04", name: "Skinless Whole Chicken (XL)", range: "1401-1600" },
  { code: "03CW05", name: "Skinless Whole Chicken (XXL)", range: "1601-1850" },
  { code: "03CW08", name: "Skinless Whole Chicken (M) Special", range: "1101-1200" },
  { code: "04CP01", name: "Skinless Breast", range: "425 - 600" },
  { code: "04CP02", name: "Skinon Breast", range: "450 - 625" },
  { code: "04CP03", name: "Skinless Drumstick", range: "80 - 120" },
  { code: "04CP04", name: "Skinon Drumstick", range: "90 - 130" },
  { code: "04CP05", name: "Skinon Drumstick - Special", range: "90 - 110" },
  { code: "04CP06", name: "Skinless Thigh", range: "90 - 140" },
  { code: "04CP07", name: "Skinless Thigh - Special", range: "90 - 105" },
  { code: "04CP08", name: "Skinon Thigh", range: "100 - 150" },
  { code: "04CP09", name: "Skinless Leg", range: "210-270" },
  { code: "04CP11", name: "Skinon Leg", range: "220-280" },
  { code: "04CP12", name: "Skinless Back Quarter", range: "200-230" },
  { code: "04CP13", name: "Skinless Back Quarter - Special", range: "230-270" },
  { code: "04CP14", name: "Skinon Back Quarter", range: "250-290" },
  { code: "04CP16", name: "Whole Wings", range: "L 80-95(Per piece) /  S 60-75(Per piece)" },
  { code: "04CP17", name: "Winglet", range: "40-43" },
  { code: "04CP19", name: "D. Winglet / Lolipop", range: "38-48" },
  { code: "04CP20", name: "Wing Tip", range: "8_12" },
  { code: "04CP22", name: "Neck", range: "-" },
  { code: "04CP23", name: "Bite Pieces", range: "500.00" },
  { code: "04CP24", name: "Liver 500g", range: "42-54" },
  { code: "04CP25", name: "Liver 1Kg", range: "42-54" },
  { code: "04CP26", name: "Gizzard 500g", range: "20-26" },
  { code: "04CP27", name: "Gizzard 1Kg", range: "20-26" },
  { code: "04CP28", name: "Gadget 500g", range: "2_4" },
  { code: "04CP29", name: "Curry Pieces 500g", range: "Offcut 410 (Per piece)/ Neck 50-70 (Per piece)" },
  { code: "04CP30", name: "Soup Bone", range: "125-150" },
  { code: "04CP31", name: "Thigh Bone", range: "20-22" },
  { code: "04CP32", name: "Kitchen Pack 500g", range: "-" },
  { code: "04CP34", name: "Pet Food - Minced 500g", range: "-" },
  { code: "04CP37", name: "MDM Material 500g", range: "-" },
  { code: "04CP40", name: "Middle Wing 500g", range: "27-37" },
  { code: "04CP41", name: "Neck 500g", range: "35-45" },
  { code: "05CM01", name: "Skinless Boneless Breast", range: "400-550" },
  { code: "05CM02", name: "Skinless Boneless Thigh", range: "100-120" },
  { code: "05CM03", name: "Chicken Skin - Loose Meat 5Kg", range: "-" },
  { code: "06CE01", name: "Easy 250g", range: "-" },
  { code: "06CE02", name: "Easy 400g", range: "-" },
  { code: "06CE03", name: "Easy 700g", range: "-" },
  { code: "06CE05", name: "Easy 5 kg", range: "-" },
];

async function buildSalesForecastVsProduction(year, month) {
  const [forecastRows, fbpRows] = await Promise.all([
    Api.list("DataProductionForecast"),
    Api.list("DataFBPProduction"),
  ]);

  const monthPrefix = `${year}-${String(month).padStart(2, "0")}-`;
  const forecastMonth = forecastRows.filter((r) => String(r.Date).startsWith(monthPrefix));
  const fbpMonth = fbpRows.filter((r) => String(r.Date).startsWith(monthPrefix));

  const salesByCode = {};
  forecastMonth.forEach((r) => {
    const code = r.Code || "";
    salesByCode[code] = (salesByCode[code] || 0) + (Number(r["Sales Weight (Kg)"]) || 0);
  });

  const productionByCode = {};
  fbpMonth.forEach((r) => {
    const code = r.Item_Code || "";
    productionByCode[code] = (productionByCode[code] || 0) + (Number(r.Weight) || 0);
  });

  const items = SFP_ITEMS_.map((item) => {
    const salesForecast = salesByCode[item.code] || 0;
    const totalProduction = productionByCode[item.code] || 0;
    const difference = salesForecast - totalProduction;
    return { ...item, salesForecast, totalProduction, difference };
  });

  const totals = {
    salesForecast: items.reduce((s, i) => s + i.salesForecast, 0),
    totalProduction: items.reduce((s, i) => s + i.totalProduction, 0),
  };
  totals.difference = totals.salesForecast - totals.totalProduction;

  return { year, month, items, totals };
}

// ===================================================================
// LB TARGET vs ACTUAL — date rows, month/year filtered.
// Target: DataProductionBirdReq (4 weight-range columns)
// Actual: DataLBSummary, bucketed by each row's Average_weight
// ===================================================================

async function buildLbTargetVsActual(year, month) {
  const [reqRows, lbRows] = await Promise.all([
    Api.list("DataProductionBirdReq"),
    Api.list("DataLBSummary"),
  ]);

  const monthPrefix = `${year}-${String(month).padStart(2, "0")}-`;
  const reqMonth = reqRows.filter((r) => String(r.Date).startsWith(monthPrefix));
  const lbMonth = lbRows.filter((r) => String(r.Date).startsWith(monthPrefix));

  const daysInMonth = new Date(Number(year), Number(month), 0).getDate();

  const dateRows = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${monthPrefix}${String(d).padStart(2, "0")}`;

    const reqDay = reqMonth.filter((r) => String(r.Date) === dateStr);
    const target14 = reqDay.reduce((s, r) => s + (Number(r["1.2 - 1.4 kg"]) || 0), 0);
    const target18 = reqDay.reduce((s, r) => s + (Number(r["1.5 - 1.8 kg"]) || 0), 0);
    const target22 = reqDay.reduce((s, r) => s + (Number(r["1.9 - 2.2 kg"]) || 0), 0);
    const target23 = reqDay.reduce((s, r) => s + (Number(r["2.3 kg Above"]) || 0), 0);
    const totalTargetBirds = target14 + target18 + target22 + target23;

    const lbDay = lbMonth.filter((r) => String(r.Date) === dateStr);
    let actual14 = 0, actual18 = 0, actual22 = 0, actual23 = 0;
    lbDay.forEach((r) => {
      const avg = Number(r.Average_weight) || 0;
      const birds = Number(r.No_of_birds) || 0;
      if (avg >= 1.2 && avg <= 1.4) actual14 += birds;
      else if (avg > 1.4 && avg <= 1.8) actual18 += birds;
      else if (avg > 1.8 && avg <= 2.2) actual22 += birds;
      else if (avg > 2.2) actual23 += birds;
      // avg < 1.2 -> not bucketed into any range column
    });
    const totalActualBirds = lbDay.reduce((s, r) => s + (Number(r.No_of_birds) || 0), 0);

    const hasData = reqDay.length > 0 || lbDay.length > 0;
    const achievementPct = totalTargetBirds > 0 ? (totalActualBirds / totalTargetBirds) * 100 : 0;

    dateRows.push({
      date: dateStr, hasData,
      target14, actual14, target18, actual18, target22, actual22, target23, actual23,
      totalTargetBirds, totalActualBirds, achievementPct,
    });
  }

  const totals = dateRows.reduce((acc, r) => {
    acc.target14 += r.target14; acc.actual14 += r.actual14;
    acc.target18 += r.target18; acc.actual18 += r.actual18;
    acc.target22 += r.target22; acc.actual22 += r.actual22;
    acc.target23 += r.target23; acc.actual23 += r.actual23;
    acc.totalTargetBirds += r.totalTargetBirds;
    acc.totalActualBirds += r.totalActualBirds;
    return acc;
  }, { target14: 0, actual14: 0, target18: 0, actual18: 0, target22: 0, actual22: 0, target23: 0, actual23: 0, totalTargetBirds: 0, totalActualBirds: 0 });
  totals.achievementPct = totals.totalTargetBirds > 0 ? (totals.totalActualBirds / totals.totalTargetBirds) * 100 : 0;

  return { year, month, dateRows, totals };
}

// ===================================================================
// PRODUCTION TARGET vs ACTUAL — items × days (Target/Actual pair per day)
// Target: DataProductionForecast ("Production Weight (Kg)")
// Actual: DataFBPProduction ("Weight")
// Reuses TOTAL_PRODUCTION_ITEMS_ (defined earlier for Total Production Summary)
// ===================================================================

async function buildProductionTargetVsActual(year, month) {
  const [targetRows, fbpRows] = await Promise.all([
    Api.list("DailyTarget"),           // ⬅️ DataProductionForecast → DailyTarget
    Api.list("DataFBPProduction"),
  ]);

  const monthPrefix = `${year}-${String(month).padStart(2, "0")}-`;
  const daysInMonth = new Date(Number(year), Number(month), 0).getDate();

  // ---------------------------------------------------------------
  // DailyTarget structure (Api.list එකෙන් එන විදිහ):
  //   targetRows[0]  = { Date: "Date", "01CW01": "Whole Chicken (S)", ... }  ← names row
  //   targetRows[1+] = { Date: "2026-09-01", "01CW01": 120, ... }              ← actual data
  // ---------------------------------------------------------------
  const nameRow = targetRows[0] || {};
  const itemCodes = Object.keys(nameRow).filter(k => k && k !== 'Date');

  // Item list — DailyTarget sheet එකේ codes + names වලින්ම හදනවා
  const items = itemCodes.map(code => ({
    code,
    name: String(nameRow[code] || ''),
  }));

  // Target data — names row එක skip කරන්න
  const targetMonth = targetRows
    .slice(1)
    .filter(r => String(r.Date || '').startsWith(monthPrefix));

  const targetByCode = {};
  targetMonth.forEach((r) => {
    const day = Number(String(r.Date).split("-")[2]);
    itemCodes.forEach(code => {
      if (!targetByCode[code]) targetByCode[code] = {};
      targetByCode[code][day] = (targetByCode[code][day] || 0) + (Number(r[code]) || 0);
    });
  });

  // Actual — DataFBPProduction එකෙන් (කලින් වගේම)
  const fbpMonth = fbpRows.filter(r => String(r.Date).startsWith(monthPrefix));
  const actualByCode = {};
  fbpMonth.forEach((r) => {
    const code = r.Item_Code || "";
    const day = Number(String(r.Date).split("-")[2]);
    if (!actualByCode[code]) actualByCode[code] = {};
    actualByCode[code][day] = (actualByCode[code][day] || 0) + (Number(r.Weight) || 0);
  });

  // Items × days matrix එක
  const resultItems = items.map((item) => {
    const targets = [];
    const actuals = [];
    let totalTarget = 0;
    let totalActual = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      const t = (targetByCode[item.code] && targetByCode[item.code][d]) || 0;
      const a = (actualByCode[item.code] && actualByCode[item.code][d]) || 0;
      targets.push(t);
      actuals.push(a);
      totalTarget += t;
      totalActual += a;
    }
    return { code: item.code, name: item.name, targets, actuals, totalTarget, totalActual };
  });

  const dayTargetTotals = [];
  const dayActualTotals = [];
  for (let d = 1; d <= daysInMonth; d++) {
    dayTargetTotals.push(resultItems.reduce((s, i) => s + i.targets[d - 1], 0));
    dayActualTotals.push(resultItems.reduce((s, i) => s + i.actuals[d - 1], 0));
  }
  const grandTotalTarget = dayTargetTotals.reduce((s, v) => s + v, 0);
  const grandTotalActual = dayActualTotals.reduce((s, v) => s + v, 0);

  return {
    year, month, daysInMonth,
    items: resultItems,
    dayTargetTotals, dayActualTotals,
    grandTotalTarget, grandTotalActual,
  };
}

// ===================================================================
// EASY & GIBLET STOCK — running balance ledgers, month/year filtered.
// Same logic reused for both materials via config.
// ===================================================================

const MATERIAL_STOCK_CONFIGS_ = {
  easy: {
  title: "Easy Material",
  inSheet: "DataEasyMaterial",        // ⬅️ අලුත් sheet එක
  inField: "Qty",                     // ⬅️ Qty column එකෙන්
  // inCode / inCodeField දෙක අයින් කරන්න (අවශ්ය නැහැ)
  outSheet: "DataEasyProduction", outField: "Weight",
  outCodeField: "Item_Code",
  outExcludeCode: "NET_WEIGHT",
  balanceOverrides: {                 // ⬅️ අලුතින් එකතු කරන්න
    "2026-08-25": 7286.55,
  },
},
  giblet: {
    title: "Giblet Material",
    inSheet: "DataFBPProduction", inCode: "09GP09", inCodeField: "Item_Code", inField: "Weight",
    outSheet: "DataPackingGiblet", outField: "Qty",
  },
};

async function buildMaterialStockLedger_(config, year, month) {
  const [inRows, outRows] = await Promise.all([
    Api.list(config.inSheet),
    Api.list(config.outSheet),
  ]);

  const outRowsFiltered = config.outExcludeCode
    ? outRows.filter((r) => String(r[config.outCodeField]) !== config.outExcludeCode)
    : outRows;

  const inFiltered = config.inCode
  ? inRows.filter((r) => String(r[config.inCodeField]) === config.inCode)
  : inRows;
  const monthPrefix = `${year}-${String(month).padStart(2, "0")}-`;
  const monthStart = `${monthPrefix}01`;

  // Opening balance: net of all In/Out strictly before the 1st of selected month
  const priorIn = inFiltered
    .filter((r) => String(r.Date) < monthStart)
    .reduce((s, r) => s + (Number(r[config.inField]) || 0), 0);
  const priorOut = outRowsFiltered                    // ⬅️ outRows → outRowsFiltered
  .filter((r) => String(r.Date) < monthStart)
  .reduce((s, r) => s + (Number(r[config.outField]) || 0), 0);
  const openingBalance = priorIn - priorOut;

  const daysInMonth = new Date(Number(year), Number(month), 0).getDate();

  const dateRows = [];
  let runningBalance = openingBalance;
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${monthPrefix}${String(d).padStart(2, "0")}`;
    const dayIn = inFiltered
      .filter((r) => String(r.Date) === dateStr)
      .reduce((s, r) => s + (Number(r[config.inField]) || 0), 0);
    const dayOut = outRowsFiltered                      // ⬅️ outRows → outRowsFiltered
  .filter((r) => String(r.Date) === dateStr)
  .reduce((s, r) => s + (Number(r[config.outField]) || 0), 0);
    runningBalance = runningBalance + dayIn - dayOut;

  if (config.balanceOverrides && config.balanceOverrides[dateStr] !== undefined) {
    runningBalance = config.balanceOverrides[dateStr];
  }

    dateRows.push({ date: dateStr, in: dayIn, out: dayOut, balance: runningBalance });
  }

  const totalIn = dateRows.reduce((s, r) => s + r.in, 0);
  const totalOut = dateRows.reduce((s, r) => s + r.out, 0);
  const closingBalance = runningBalance;

  return { title: config.title, openingBalance, dateRows, totalIn, totalOut, closingBalance };
}

async function buildEasyGibletStock(year, month) {
  const [easy, giblet] = await Promise.all([
    buildMaterialStockLedger_(MATERIAL_STOCK_CONFIGS_.easy, year, month),
    buildMaterialStockLedger_(MATERIAL_STOCK_CONFIGS_.giblet, year, month),
  ]);
  return { year, month, easy, giblet };
}

// ===================================================================
// YIELD REPORT — date rows, month/year filtered, pulls from 4 sheets
// ===================================================================

const YIELD_COLUMNS_ = [
  { label: "No.of birds received",        key: "No_of_birds" },
  { label: "Transport mortality NOB",      key: "Transport_Mortality" },
  { label: "Bay mortality",                key: "Bay_Mortality" },
  { label: "Reject Birds",                 key: "RejectBirds" },
  { label: "No.of birds to the plant",     key: "No_of_birds_to_plant" },
  { label: "Live weight to the plant Kg",  key: "Live_weight_to_plant" },
  { label: "Avg Body Weight Kgf",          key: "AvgBodyWeight", decimals: 2 },
  { label: "Feathers",                     key: "Feather" },
  { label: "Feet",                         key: "Feet" },
  { label: "Offals",                       key: "Offal" },
  { label: "Total (F+F+O)",                key: "TotalFFO" },
  { label: "Yield % B/F screw chill",      key: "YieldBF", isPercent: true },
  { label: "chill weight",                 key: "ChillWeight" },
  { label: "FG weight",                    key: "FGWeight" },
  { label: "Final yield%",                 key: "FinalYield", isPercent: true, highlight: true },
  { label: "Chill loss %",                 key: "ChillLoss", isPercent: true },
  { label: "Screw chiller Absortion %",    key: "ScrewAbsorption", isPercent: true },
];

async function buildYieldReport(year, month) {
  const [lbRows, renderingRows, chillRows, fgRows] = await Promise.all([
    Api.list("DataLBSummary"),
    Api.list("DataLBRendering"),
    Api.list("DataPackingChillWeight"),
    Api.list("DataFBPProduction"),
  ]);

  const monthPrefix = `${year}-${String(month).padStart(2, "0")}-`;
  const daysInMonth = new Date(Number(year), Number(month), 0).getDate();

  const dateRows = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${monthPrefix}${String(d).padStart(2, "0")}`;

    const lbForDate = lbRows.filter((r) => String(r.Date) === dateStr);
    const renderForDate = renderingRows.filter((r) => String(r.Date) === dateStr);
    const chillForDate = chillRows.filter((r) => String(r.Date) === dateStr);
    const fgForDate = fgRows.filter((r) => String(r.Date) === dateStr);

    if (!lbForDate.length && !renderForDate.length && !chillForDate.length && !fgForDate.length) {
      dateRows.push({ date: dateStr, hasData: false, metrics: {} });
      continue;
    }

    const sumField = (rows, key) => rows.reduce((s, r) => s + (Number(r[key]) || 0), 0);

    const birdsReceived   = sumField(lbForDate, "No_of_birds");
    const transportMort   = sumField(lbForDate, "Transport_Mortality");
    const bayMort         = sumField(lbForDate, "Bay_Mortality");
    const rejectBirds     = sumField(lbForDate, "Number_of_Halal_rejected_birds") + sumField(lbForDate, "Number_of_other_rejected_birds");
    const birdsToPlant    = sumField(lbForDate, "No_of_birds_to_plant");
    const liveWeightToPlant = sumField(lbForDate, "Live_weight_to_plant");
    const avgBodyWeight   = birdsToPlant > 0 ? liveWeightToPlant / birdsToPlant : 0;

    const feather = sumField(renderForDate, "Feather");
    const feet    = sumField(renderForDate, "Feet");
    const offal   = sumField(renderForDate, "Offal");
    const totalFFO = feather + feet + offal;

    const yieldBF = liveWeightToPlant > 0 ? (liveWeightToPlant - totalFFO) / liveWeightToPlant : 0;

    const chillWeight = sumField(chillForDate, "Weight");
    const fgWeight = sumField(fgForDate, "Weight"); // ⚠️ confirm exact column name in DataFBPProduction

    const finalYield = liveWeightToPlant > 0 ? fgWeight / liveWeightToPlant : 0;
    const chillLoss = fgWeight > 0 ? (chillWeight-fgWeight) / fgWeight : 0;
    const screwAbsorption = yieldBF - chillLoss;

    dateRows.push({
      date: dateStr,
      hasData: true,
      metrics: {
        No_of_birds: birdsReceived,
        Transport_Mortality: transportMort,
        Bay_Mortality: bayMort,
        RejectBirds: rejectBirds,
        No_of_birds_to_plant: birdsToPlant,
        Live_weight_to_plant: liveWeightToPlant,
        AvgBodyWeight: avgBodyWeight,
        Feather: feather,
        Feet: feet,
        Offal: offal,
        TotalFFO: totalFFO,
        YieldBF: yieldBF,
        ChillWeight: chillWeight,
        FGWeight: fgWeight,
        FinalYield: finalYield,
        ChillLoss: chillLoss,
        ScrewAbsorption: screwAbsorption,
      },
    });
  }

  // Totals — computed from summed raw values, NOT an average of daily percentages
  const dataRows = dateRows.filter((r) => r.hasData);
  const sum = (key) => dataRows.reduce((s, r) => s + (r.metrics[key] || 0), 0);

  const tBirdsReceived = sum("No_of_birds");
  const tTransportMort = sum("Transport_Mortality");
  const tBayMort = sum("Bay_Mortality");
  const tRejectBirds = sum("RejectBirds");
  const tBirdsToPlant = sum("No_of_birds_to_plant");
  const tLiveWeight = sum("Live_weight_to_plant");
  const tAvgBodyWeight = tBirdsToPlant > 0 ? tLiveWeight / tBirdsToPlant : 0;
  const tFeather = sum("Feather");
  const tFeet = sum("Feet");
  const tOffal = sum("Offal");
  const tTotalFFO = tFeather + tFeet + tOffal;
  const tYieldBF = tLiveWeight > 0 ? (tLiveWeight - tTotalFFO) / tLiveWeight : 0;
  const tChillWeight = sum("ChillWeight");
  const tFGWeight = sum("FGWeight");
  const tFinalYield = tLiveWeight > 0 ? tFGWeight / tLiveWeight : 0;
  const tChillLoss = tFGWeight > 0 ? tChillWeight / tFGWeight : 0;
  const tScrewAbsorption = tYieldBF - tChillLoss;

  const totals = {
    No_of_birds: tBirdsReceived, Transport_Mortality: tTransportMort, Bay_Mortality: tBayMort,
    RejectBirds: tRejectBirds, No_of_birds_to_plant: tBirdsToPlant, Live_weight_to_plant: tLiveWeight,
    AvgBodyWeight: tAvgBodyWeight, Feather: tFeather, Feet: tFeet, Offal: tOffal, TotalFFO: tTotalFFO,
    YieldBF: tYieldBF, ChillWeight: tChillWeight, FGWeight: tFGWeight, FinalYield: tFinalYield,
    ChillLoss: tChillLoss, ScrewAbsorption: tScrewAbsorption,
  };

  return { year, month, dateRows, totals };
}



// ===================================================================
// DAY-OF-WEEK HELPER — used by monthly reports to highlight
// Sunday (red) and Saturday (gray) rows/columns
// ===================================================================
function getDayOfWeekClass_(dateStr) {
  const day = new Date(dateStr + "T00:00:00").getDay();   // 0=Sun, 6=Sat
  if (day === 0) return "dow-sunday";
  if (day === 6) return "dow-saturday";
  return "";
}

// ===================================================================
// KPI 01 — Bay Mortality Rate %  (transposed: metrics as rows, days as columns)
// ===================================================================

const KPI_BAY_MORTALITY_STANDARD_ = 0.05;   // standard threshold %

async function buildBayMortalityKpi(year, month) {
  const rows = await Api.list("Live_Bird_Bay_Mortality_Rate_%");
  const holidayMap = await getHolidayMap_();
  const monthPrefix = `${year}-${String(month).padStart(2, "0")}-`;
  const monthRows = rows.filter((r) => String(r.Date).startsWith(monthPrefix));
  const daysInMonth = new Date(Number(year), Number(month), 0).getDate();

  const byDay = {};
  monthRows.forEach((r) => {
    const day = Number(String(r.Date).split("-")[2]);
    const totalBirds = Number(r.Total_Birds_Received_Alive) || 0;
    const bayMortality = Number(r.Bay_Mortality) || 0;
    const pct = totalBirds > 0 ? (bayMortality / totalBirds) * 100 : 0;
    byDay[day] = { totalBirds, bayMortality, pct };
  });

  const days = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${monthPrefix}${String(d).padStart(2, "0")}`;
    const rec = byDay[d];
    days.push({
      day: d,
      hasData: !!rec && (rec.totalBirds > 0 || rec.bayMortality > 0),
      date: dateStr,
      totalBirds: rec ? rec.totalBirds : null,
      bayMortality: rec ? rec.bayMortality : null,
      pct: rec ? rec.pct : null,
    });
  }

  return { year, month, days, summary: buildBayMortalitySummary_(days), holidayMap };
}

function bayMortalityColorClass_(pct) {
  const std = KPI_BAY_MORTALITY_STANDARD_;
  if (pct === null || pct === undefined) return "";
  if (pct <= std) return "kpi-green";
  if (pct <= std * 1.5) return "kpi-yellow";
  if (pct <= std * 2) return "kpi-orange";
  return "kpi-red";
}

function buildBayMortalitySummary_(days) {
  const std = KPI_BAY_MORTALITY_STANDARD_;
  const withData = days.filter((d) => d.hasData);
  const totalDays = withData.length;

  const counts = { green: 0, yellow: 0, orange: 0, red: 0 };
  withData.forEach((d) => {
    const cls = bayMortalityColorClass_(d.pct);
    if (cls === "kpi-green") counts.green++;
    else if (cls === "kpi-yellow") counts.yellow++;
    else if (cls === "kpi-orange") counts.orange++;
    else if (cls === "kpi-red") counts.red++;
  });

  const pct = (n) => (totalDays > 0 ? ((n / totalDays) * 100).toFixed(1) : "0.0");

  return [
    { key: "green", label: "Good", range: `≤ ${std.toFixed(2)}%`, count: counts.green, pct: pct(counts.green) },
    { key: "yellow", label: "Caution", range: `${std.toFixed(2)}% – ${(std * 1.5).toFixed(2)}%`, count: counts.yellow, pct: pct(counts.yellow) },
    { key: "orange", label: "Warning", range: `${(std * 1.5).toFixed(2)}% – ${(std * 2).toFixed(2)}%`, count: counts.orange, pct: pct(counts.orange) },
    { key: "red", label: "Critical", range: `> ${(std * 2).toFixed(2)}%`, count: counts.red, pct: pct(counts.red) },
  ];
}

// ===================================================================
// KPI 01 — Full year data (for Weekly/Monthly Good Days % trend)
// ===================================================================
async function buildBayMortalityYearData_(year) {
  const rows = await Api.list("Live_Bird_Bay_Mortality_Rate_%");
  const daysInYear = (Number(year) % 4 === 0 && Number(year) % 100 !== 0) || Number(year) % 400 === 0 ? 366 : 365;

  const allDays = [];
  const startOfYear = new Date(Number(year), 0, 1);
  for (let i = 0; i < daysInYear; i++) {
    const d = new Date(startOfYear);
    d.setDate(startOfYear.getDate() + i);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

    const dayRows = rows.filter((r) => String(r.Date) === dateStr);
    const totalBirds = dayRows.reduce((s, r) => s + (Number(r.Total_Birds_Received_Alive) || 0), 0);
    const bayMortality = dayRows.reduce((s, r) => s + (Number(r.Bay_Mortality) || 0), 0);
    const pct = totalBirds > 0 ? (bayMortality / totalBirds) * 100 : 0;

    allDays.push({
      date: dateStr,
      month: d.getMonth() + 1,
      dayOfYear: i + 1,
      hasData: totalBirds > 0 || bayMortality > 0,
      pct,
    });
  }

  return allDays;
}

// ===================================================================
// KPI 02 — Birds Unloading Rate (birds/hour)
// ===================================================================

const KPI_BIRD_UNLOAD_STANDARD_ = 4500;
const KPI_BIRD_UNLOAD_THRESHOLDS_ = { green: 4500, yellow: 4300, orange: 4100 };

function birdUnloadColorClass_(rate) {
  const t = KPI_BIRD_UNLOAD_THRESHOLDS_;
  if (rate >= t.green) return "kpi-green";
  if (rate >= t.yellow) return "kpi-yellow";
  if (rate >= t.orange) return "kpi-orange";
  return "kpi-red";
}

function buildBirdUnloadSummary_(dateRows) {
  const t = KPI_BIRD_UNLOAD_THRESHOLDS_;
  const withData = dateRows.filter((r) => r.hasData && r.receivedBirds > 0);
  const totalDays = withData.length;

  const counts = { green: 0, yellow: 0, orange: 0, red: 0 };
  withData.forEach((r) => {
    const cls = birdUnloadColorClass_(r.rate);
    if (cls === "kpi-green") counts.green++;
    else if (cls === "kpi-yellow") counts.yellow++;
    else if (cls === "kpi-orange") counts.orange++;
    else if (cls === "kpi-red") counts.red++;
  });

  const pct = (n) => (totalDays > 0 ? ((n / totalDays) * 100).toFixed(1) : "0.0");

  return [
    { key: "green", label: "Good", range: `≥ ${t.green}`, count: counts.green, pct: pct(counts.green) },
    { key: "yellow", label: "Caution", range: `${t.yellow} – ${t.green}`, count: counts.yellow, pct: pct(counts.yellow) },
    { key: "orange", label: "Warning", range: `${t.orange} – ${t.yellow}`, count: counts.orange, pct: pct(counts.orange) },
    { key: "red", label: "Critical", range: `< ${t.orange}`, count: counts.red, pct: pct(counts.red) },
  ];
}

async function buildBirdUnloadKpi(year, month) {
  const rows = await Api.list("Birds_Unloading_Rate_%");
  const holidayMap = await getHolidayMap_();
  const monthPrefix = `${year}-${String(month).padStart(2, "0")}-`;
  const daysInMonth = new Date(Number(year), Number(month), 0).getDate();

  const dateRows = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${monthPrefix}${String(d).padStart(2, "0")}`;
    const dayRows = rows.filter((r) => String(r.Date) === dateStr);

    const receivedBirds = dayRows.reduce((s, r) => s + (Number(r.Received_Birds) || 0), 0);
    const unloadingTime = dayRows.reduce((s, r) => s + (Number(r.Unloading_Time) || 0), 0);
    const rate = unloadingTime > 0 ? receivedBirds / unloadingTime : 0;

    dateRows.push({
      day: d,
      date: dateStr,
      hasData: receivedBirds > 0 || unloadingTime > 0,
      receivedBirds,
      unloadingTime,
      rate,
    });
  }

  const totalReceived = dateRows.reduce((s, r) => s + r.receivedBirds, 0);
  const totalTime = dateRows.reduce((s, r) => s + r.unloadingTime, 0);
  const totalRate = totalTime > 0 ? totalReceived / totalTime : 0;

  return {
    year, month, daysInMonth, dateRows,
    totals: { receivedBirds: totalReceived, unloadingTime: totalTime, rate: totalRate },
    summary: buildBirdUnloadSummary_(dateRows),
    holidayMap,
  };
}

async function buildBirdUnloadYearData_(year) {
  const rows = await Api.list("Birds_Unloading_Rate_%");
  const daysInYear = (Number(year) % 4 === 0 && Number(year) % 100 !== 0) || Number(year) % 400 === 0 ? 366 : 365;

  const allDays = [];
  const startOfYear = new Date(Number(year), 0, 1);
  for (let i = 0; i < daysInYear; i++) {
    const d = new Date(startOfYear);
    d.setDate(startOfYear.getDate() + i);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

    const dayRows = rows.filter((r) => String(r.Date) === dateStr);
    const receivedBirds = dayRows.reduce((s, r) => s + (Number(r.Received_Birds) || 0), 0);
    const unloadingTime = dayRows.reduce((s, r) => s + (Number(r.Unloading_Time) || 0), 0);
    const rate = unloadingTime > 0 ? receivedBirds / unloadingTime : 0;

    allDays.push({
      date: dateStr,
      month: d.getMonth() + 1,
      dayOfYear: i + 1,
      hasData: receivedBirds > 0 || unloadingTime > 0,
      receivedBirds,
      rate,
    });
  }

  return allDays;
}


// ===================================================================
// KPI 05 — Dressed Yield %
// ===================================================================

async function buildDressedYieldKpi(year, month) {
  // ✅ නව sheet එකෙන් data ගන්න
  const rows = await Api.list("Dressed_Yield_%");
  const holidayMap = await getHolidayMap_();
  const monthPrefix = `${year}-${String(month).padStart(2, "0")}-`;
  const daysInMonth = new Date(Number(year), Number(month), 0).getDate();

  const dateRows = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${monthPrefix}${String(d).padStart(2, "0")}`;

    const dayRows = rows.filter((r) => String(r.Date) === dateStr);
    
    // ✅ නව column names භාවිතා කරන්න
    const liveWeight = dayRows.reduce((s, r) => s + (Number(r["Live_Birds_Weight"]) || 0), 0);
    const dressedWeight = dayRows.reduce((s, r) => s + (Number(r["Dress_Weight"]) || 0), 0);
    const yieldPct = liveWeight > 0 ? (dressedWeight / liveWeight) * 100 : 0;

    dateRows.push({
      day: d,
      date: dateStr,
      hasData: liveWeight > 0 || dressedWeight > 0,
      liveWeight,
      dressedWeight,
      yieldPct,
    });
  }

  const totalLiveWeight = dateRows.reduce((s, r) => s + r.liveWeight, 0);
  const totalDressedWeight = dateRows.reduce((s, r) => s + r.dressedWeight, 0);
  const totalYieldPct = totalLiveWeight > 0 ? (totalDressedWeight / totalLiveWeight) * 100 : 0;

  return {
    year,
    month,
    daysInMonth,
    dateRows,
    totals: { 
      liveWeight: totalLiveWeight, 
      dressedWeight: totalDressedWeight, 
      yieldPct: totalYieldPct 
    },
    summary: buildDressedYieldSummary_(dateRows),
    holidayMap,
  };
}

// ===================================================================
// KPI 05 — Dressed Yield % summary cards
// ===================================================================

const KPI_DRESSED_YIELD_THRESHOLDS_ = { green: 79, yellow: 70, orange: 65 };
const KPI_DRESSED_YIELD_STANDARD_ = 79;

function dressedYieldColorClass_(pct) {
  const t = KPI_DRESSED_YIELD_THRESHOLDS_;
  if (pct >= t.green) return "kpi-green";
  if (pct >= t.yellow) return "kpi-yellow";
  if (pct >= t.orange) return "kpi-orange";
  return "kpi-red";
}

function buildDressedYieldSummary_(dateRows) {
  const t = KPI_DRESSED_YIELD_THRESHOLDS_;
  const withData = dateRows.filter((r) => r.hasData);
  const totalDays = withData.length;

  const counts = { green: 0, yellow: 0, orange: 0, red: 0 };
  withData.forEach((r) => {
    const cls = dressedYieldColorClass_(r.yieldPct);
    if (cls === "kpi-green") counts.green++;
    else if (cls === "kpi-yellow") counts.yellow++;
    else if (cls === "kpi-orange") counts.orange++;
    else if (cls === "kpi-red") counts.red++;
  });

  const pct = (n) => (totalDays > 0 ? ((n / totalDays) * 100).toFixed(1) : "0.0");

  return [
    { key: "green", label: "Good", range: `≥ ${t.green}%`, count: counts.green, pct: pct(counts.green) },
    { key: "yellow", label: "Caution", range: `${t.yellow}% – ${t.green}%`, count: counts.yellow, pct: pct(counts.yellow) },
    { key: "orange", label: "Warning", range: `${t.orange}% – ${t.yellow}%`, count: counts.orange, pct: pct(counts.orange) },
    { key: "red", label: "Critical", range: `< ${t.orange}%`, count: counts.red, pct: pct(counts.red) },
  ];
}

// ===================================================================
// KPI 05 — Dressed Yield % (Full Year Data)
// ===================================================================

async function buildDressedYieldYearData_(year) {
  const rows = await Api.list("Dressed_Yield_%");
  const daysInYear = (Number(year) % 4 === 0 && Number(year) % 100 !== 0) || Number(year) % 400 === 0 ? 366 : 365;

  const allDays = [];
  const startOfYear = new Date(Number(year), 0, 1);
  for (let i = 0; i < daysInYear; i++) {
    const d = new Date(startOfYear);
    d.setDate(startOfYear.getDate() + i);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

    const dayRows = rows.filter((r) => String(r.Date) === dateStr);
    const liveWeight = dayRows.reduce((s, r) => s + (Number(r["Live_Birds_Weight"]) || 0), 0);
    const dressWeight = dayRows.reduce((s, r) => s + (Number(r["Dress_Weight"]) || 0), 0);
    const pct = liveWeight > 0 ? (dressWeight / liveWeight) * 100 : 0;

    allDays.push({
      date: dateStr,
      month: d.getMonth() + 1,
      dayOfYear: i + 1,
      hasData: liveWeight > 0 || dressWeight > 0,
      yieldPct: pct,
    });
  }

  return allDays;
}

// ===================================================================
// KPI 06 — Chill Loss %
// ===================================================================

async function buildChillLossKpi(year, month) {
  const rows = await Api.list("Chill_Loss_%");
  const holidayMap = await getHolidayMap_();
  const monthPrefix = `${year}-${String(month).padStart(2, "0")}-`;
  const daysInMonth = new Date(Number(year), Number(month), 0).getDate();

  const dateRows = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${monthPrefix}${String(d).padStart(2, "0")}`;
    const dayRows = rows.filter((r) => String(r.Date) === dateStr);
    
    const chillWeight = dayRows.reduce((s, r) => s + (Number(r["Chill_weight"]) || 0), 0);
    const dressWeight = dayRows.reduce((s, r) => s + (Number(r["Dress_weight"]) || 0), 0);
    const diff = chillWeight - dressWeight;
    const chillLossPct = chillWeight > 0 ? (diff / chillWeight) * 100 : 0;

    dateRows.push({
      day: d,
      date: dateStr,
      hasData: chillWeight > 0 || dressWeight > 0,
      chillWeight,
      dressWeight,
      diff,
      chillLossPct,
    });
  }

  const totalChillWeight = dateRows.reduce((s, r) => s + r.chillWeight, 0);
  const totalDressWeight = dateRows.reduce((s, r) => s + r.dressWeight, 0);
  const totalDiff = totalChillWeight - totalDressWeight;
  const totalChillLossPct = totalChillWeight > 0 ? (totalDiff / totalChillWeight) * 100 : 0;

  return {
    year,
    month,
    daysInMonth,
    dateRows,
    totals: { chillWeight: totalChillWeight, dressWeight: totalDressWeight, diff: totalDiff, chillLossPct: totalChillLossPct },
    summary: buildChillLossSummary_(dateRows),
    holidayMap,
  };
}

// ===================================================================
// KPI 06 — Chill Loss % summary cards
// Lower is better here (standard < 2%) — thresholds run the opposite
// direction from KPI 05. Adjust the numbers below to fine-tune.
// ===================================================================

const KPI_CHILL_LOSS_THRESHOLDS_ = { green: 2, yellow: 3, orange: 4 };

function chillLossColorClass_(pct) {
  const t = KPI_CHILL_LOSS_THRESHOLDS_;
  if (pct <= t.green) return "kpi-green";
  if (pct <= t.yellow) return "kpi-yellow";
  if (pct <= t.orange) return "kpi-orange";
  return "kpi-red";
}

function buildChillLossSummary_(dateRows) {
  const t = KPI_CHILL_LOSS_THRESHOLDS_;
  const withData = dateRows.filter((r) => r.hasData);
  const totalDays = withData.length;

  const counts = { green: 0, yellow: 0, orange: 0, red: 0 };
  withData.forEach((r) => {
    const cls = chillLossColorClass_(r.chillLossPct);
    if (cls === "kpi-green") counts.green++;
    else if (cls === "kpi-yellow") counts.yellow++;
    else if (cls === "kpi-orange") counts.orange++;
    else if (cls === "kpi-red") counts.red++;
  });

  const pct = (n) => (totalDays > 0 ? ((n / totalDays) * 100).toFixed(1) : "0.0");

  return [
    { key: "green", label: "Good", range: `≤ ${t.green}%`, count: counts.green, pct: pct(counts.green) },
    { key: "yellow", label: "Caution", range: `${t.green}% – ${t.yellow}%`, count: counts.yellow, pct: pct(counts.yellow) },
    { key: "orange", label: "Warning", range: `${t.yellow}% – ${t.orange}%`, count: counts.orange, pct: pct(counts.orange) },
    { key: "red", label: "Critical", range: `> ${t.orange}%`, count: counts.red, pct: pct(counts.red) },
  ];
}

// ===================================================================
// KPI 06 — Chill Loss % (Full Year Data)
// ===================================================================

async function buildChillLossYearData_(year) {
  const rows = await Api.list("Chill_Loss_%");
  const daysInYear = (Number(year) % 4 === 0 && Number(year) % 100 !== 0) || Number(year) % 400 === 0 ? 366 : 365;

  const allDays = [];
  const startOfYear = new Date(Number(year), 0, 1);
  for (let i = 0; i < daysInYear; i++) {
    const d = new Date(startOfYear);
    d.setDate(startOfYear.getDate() + i);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

    const dayRows = rows.filter((r) => String(r.Date) === dateStr);
    const chillWeight = dayRows.reduce((s, r) => s + (Number(r["Chill_weight"]) || 0), 0);
    const dressWeight = dayRows.reduce((s, r) => s + (Number(r["Dress_weight"]) || 0), 0);
    const pct = chillWeight > 0 ? ((chillWeight - dressWeight) / chillWeight) * 100 : 0;

    allDays.push({
      date: dateStr,
      month: d.getMonth() + 1,
      dayOfYear: i + 1,
      hasData: chillWeight > 0 || dressWeight > 0,
      chillLossPct: pct,
    });
  }

  return allDays;
}

// ===================================================================
// KPI 04 — Packing Line Efficiency %
// Efficiency % = (Actual / Planned) * 100
// ===================================================================

const KPI_PACKING_EFFICIENCY_STANDARD_ = 95;   // standard threshold %

async function buildPackingEfficiencyKpi(year, month) {
  const rows = await Api.list("Packing_Line_Efficiency_%");
  const holidayMap = await getHolidayMap_();
  const monthPrefix = `${year}-${String(month).padStart(2, "0")}-`;
  const monthRows = rows.filter((r) => String(r.Date).startsWith(monthPrefix));
  const daysInMonth = new Date(Number(year), Number(month), 0).getDate();

  const byDay = {};
  monthRows.forEach((r) => {
    const day = Number(String(r.Date).split("-")[2]);
    const planned = Number(r.Planned_Qty) || 0;
    const actual = Number(r.Actual) || 0;
    const pct = planned > 0 ? (actual / planned) * 100 : 0;
    byDay[day] = { planned, actual, pct };
  });

  const days = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${monthPrefix}${String(d).padStart(2, "0")}`;
    const rec = byDay[d];
    days.push({
      day: d,
      date: dateStr,
      hasData: !!rec && (rec.planned > 0 || rec.actual > 0),
      planned: rec ? rec.planned : null,
      actual: rec ? rec.actual : null,
      pct: rec ? rec.pct : null,
    });
  }

  return { year, month, days, summary: buildPackingEfficiencySummary_(days),holidayMap };
}

function packingEfficiencyColorClass_(pct) {
  const std = KPI_PACKING_EFFICIENCY_STANDARD_;
  if (pct === null || pct === undefined) return "";
  if (pct >= std) return "kpi-green";
  if (pct >= std - 10) return "kpi-yellow";
  if (pct >= std - 20) return "kpi-orange";
  return "kpi-red";
}

function buildPackingEfficiencySummary_(days) {
  const std = KPI_PACKING_EFFICIENCY_STANDARD_;
  const withData = days.filter((d) => d.hasData);
  const totalDays = withData.length;

  const counts = { green: 0, yellow: 0, orange: 0, red: 0 };
  withData.forEach((d) => {
    const cls = packingEfficiencyColorClass_(d.pct);
    if (cls === "kpi-green") counts.green++;
    else if (cls === "kpi-yellow") counts.yellow++;
    else if (cls === "kpi-orange") counts.orange++;
    else if (cls === "kpi-red") counts.red++;
  });

  const pct = (n) => (totalDays > 0 ? ((n / totalDays) * 100).toFixed(1) : "0.0");

  return [
    { key: "green", label: "Good", range: `≥ ${std}%`, count: counts.green, pct: pct(counts.green) },
    { key: "yellow", label: "Caution", range: `${std - 10}% – ${std}%`, count: counts.yellow, pct: pct(counts.yellow) },
    { key: "orange", label: "Warning", range: `${std - 20}% – ${std - 10}%`, count: counts.orange, pct: pct(counts.orange) },
    { key: "red", label: "Critical", range: `< ${std - 20}%`, count: counts.red, pct: pct(counts.red) },
  ];
}

// ===================================================================
// KPI 04 — Full year data (for Weekly/Monthly Good Days % + Status trend)
// ===================================================================
async function buildPackingEfficiencyYearData_(year) {
  const rows = await Api.list("Packing_Line_Efficiency_%");
  const daysInYear = (Number(year) % 4 === 0 && Number(year) % 100 !== 0) || Number(year) % 400 === 0 ? 366 : 365;

  const allDays = [];
  const startOfYear = new Date(Number(year), 0, 1);
  for (let i = 0; i < daysInYear; i++) {
    const d = new Date(startOfYear);
    d.setDate(startOfYear.getDate() + i);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

    const dayRows = rows.filter((r) => String(r.Date) === dateStr);
    const planned = dayRows.reduce((s, r) => s + (Number(r.Planned_Qty) || 0), 0);
    const actual = dayRows.reduce((s, r) => s + (Number(r.Actual) || 0), 0);
    const pct = planned > 0 ? (actual / planned) * 100 : 0;

    allDays.push({
      date: dateStr,
      month: d.getMonth() + 1,
      dayOfYear: i + 1,
      hasData: planned > 0 || actual > 0,
      pct,
    });
  }

  return allDays;
}

// ===================================================================
// KPI 03 — Slaughter Line Efficiency %
// ===================================================================

const KPI_BIRD_INPUT_STANDARD_ = 95; 

async function buildSlaughterEfficiencyKpi(year, month) {
  const rows = await Api.list("Slaughter_Line_Efficiency_%");
  const holidayMap = await getHolidayMap_();
  const monthPrefix = `${year}-${String(month).padStart(2, "0")}-`;
  const daysInMonth = new Date(Number(year), Number(month), 0).getDate();

  const days = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${monthPrefix}${String(d).padStart(2, "0")}`;
    const dayRows = rows.filter((r) => String(r.Date) === dateStr);
    
    const planned = dayRows.reduce((s, r) => s + (Number(r["Planned Birds"]) || 0), 0);
    const actual = dayRows.reduce((s, r) => s + (Number(r["Actual Birds"]) || 0), 0);
    const pct = planned > 0 ? (actual / planned) * 100 : 0;

    days.push({
      day: d,
      date: dateStr,
      hasData: planned > 0 || actual > 0,
      planned,
      actual,
      pct,
    });
  }

  return { 
    year, 
    month, 
    days, 
    summary: buildSlaughterEfficiencySummary_(days),
    holidayMap 
  };
}

function buildSlaughterEfficiencySummary_(days) {
  const std = 95;
  const withData = days.filter((d) => d.hasData);
  const totalDays = withData.length;

  const counts = { green: 0, yellow: 0, orange: 0, red: 0 };
  withData.forEach((d) => {
    const cls = d.pct >= std ? "kpi-green" : 
                d.pct >= std - 10 ? "kpi-yellow" : 
                d.pct >= std - 20 ? "kpi-orange" : "kpi-red";
    if (cls === "kpi-green") counts.green++;
    else if (cls === "kpi-yellow") counts.yellow++;
    else if (cls === "kpi-orange") counts.orange++;
    else if (cls === "kpi-red") counts.red++;
  });

  const pct = (n) => (totalDays > 0 ? ((n / totalDays) * 100).toFixed(1) : "0.0");

  return [
    { key: "green", label: "Good", range: `≥ ${std}%`, count: counts.green, pct: pct(counts.green) },
    { key: "yellow", label: "Caution", range: `${std - 10}% – ${std}%`, count: counts.yellow, pct: pct(counts.yellow) },
    { key: "orange", label: "Warning", range: `${std - 20}% – ${std - 10}%`, count: counts.orange, pct: pct(counts.orange) },
    { key: "red", label: "Critical", range: `< ${std - 20}%`, count: counts.red, pct: pct(counts.red) },
  ];
}

// ===================================================================
// KPI 03 — Slaughter Line Efficiency % (Full Year Data)
// ===================================================================

async function buildSlaughterEfficiencyYearData_(year) {
  const rows = await Api.list("Slaughter_Line_Efficiency_%");
  const daysInYear = (Number(year) % 4 === 0 && Number(year) % 100 !== 0) || Number(year) % 400 === 0 ? 366 : 365;

  const allDays = [];
  const startOfYear = new Date(Number(year), 0, 1);
  for (let i = 0; i < daysInYear; i++) {
    const d = new Date(startOfYear);
    d.setDate(startOfYear.getDate() + i);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

    const dayRows = rows.filter((r) => String(r.Date) === dateStr);
    const planned = dayRows.reduce((s, r) => s + (Number(r["Planned Birds"]) || 0), 0);
    const actual = dayRows.reduce((s, r) => s + (Number(r["Actual Birds"]) || 0), 0);
    const pct = planned > 0 ? (actual / planned) * 100 : 0;

    allDays.push({
      date: dateStr,
      month: d.getMonth() + 1,
      dayOfYear: i + 1,
      hasData: planned > 0 || actual > 0,
      pct: pct,
    });
  }

  return allDays;
}

// ===================================================================
// KPI 03 — Slaughter Line Efficiency Color Class
// ===================================================================

function slaughterEfficiencyColorClass_(pct) {
  const std = 95;
  if (pct === null || pct === undefined) return "";
  if (pct >= std) return "kpi-green";
  if (pct >= std - 10) return "kpi-yellow";
  if (pct >= std - 20) return "kpi-orange";
  return "kpi-red";
}

// ===================================================================
// DAY OF STOCK AVAILABLE — daily sales forecast vs. stock on hand.
// Item master (code/name/weight range/live weight) is static; the
// forecast + stock figures are pulled live for the selected date.
// ===================================================================

const STOCK_AVAILABLE_ITEMS_ = [
  { code: "01CW01", name: "Whole Chicken (S)", weightRange: "850-1100", liveWeight: "1.2" },
  { code: "01CW02", name: "Whole Chicken (L)", weightRange: "1101-1400", liveWeight: "1.5" },
  { code: "01CW03", name: "Whole Chicken (XL)", weightRange: "1401-2000", liveWeight: "2.1" },
  { code: "01CW06", name: "Half Chicken", weightRange: "600 - 800", liveWeight: "1.6" },
  { code: "01CW07", name: "Quarter Chicken", weightRange: "-", liveWeight: "-" },
  { code: "02CW01", name: "Whole Chicken - Without Giblets (S)", weightRange: "900-1000", liveWeight: "1.3" },
  { code: "02CW09", name: "Whole Chicken - Without Giblets (M) Special", weightRange: "1101-1200", liveWeight: "1.4" },
  { code: "02CW03", name: "Whole Chicken - Without Giblets (L)", weightRange: "1201-1300", liveWeight: "1.5" },
  { code: "02CW04", name: "Whole Chicken - Without Giblets (XL)", weightRange: "1301-1500", liveWeight: "1.7" },
  { code: "02CW05", name: "Whole Chicken - Without Giblets (XXL)", weightRange: "1501-1800", liveWeight: "2" },
  { code: "03CW01", name: "Skinless Whole Chicken (S)", weightRange: "900-1100", liveWeight: "1.3" },
  { code: "03CW08", name: "Skinless Whole Chicken (M) Special", weightRange: "1101-1200", liveWeight: "1.5" },
  { code: "03CW03", name: "Skinless Whole Chicken (L)", weightRange: "1201-1400", liveWeight: "1.6" },
  { code: "03CW04", name: "Skinless Whole Chicken (XL)", weightRange: "1401-1600", liveWeight: "1.8" },
  { code: "03CW05", name: "Skinless Whole Chicken (XXL)", weightRange: "1601-1850", liveWeight: "2.1" },
  { code: "04CP01", name: "Skinless Breast", weightRange: "425 - 600", liveWeight: "1.9 & above" },
  { code: "04CP02", name: "Skinon Breast", weightRange: "450 - 625", liveWeight: "1.9 & above" },
  { code: "04CP03", name: "Skinless Drumstick", weightRange: "80 - 120", liveWeight: "1.9 & above" },
  { code: "04CP04", name: "Skinon Drumstick", weightRange: "90 - 130", liveWeight: "1.9 & above" },
  { code: "04CP05", name: "Skinon Drumstick - Special", weightRange: "90 - 110", liveWeight: "1.9 & above" },
  { code: "04CP07", name: "Skinless thigh special", weightRange: "90 - 105", liveWeight: "1.9 & above" },
  { code: "04CP06", name: "Skinless Thigh", weightRange: "90 - 140", liveWeight: "1.9 & above" },
  { code: "04CP08", name: "Skinon Thigh", weightRange: "100 - 150", liveWeight: "1.9 & above" },
  { code: "04CP09", name: "Skinless Leg", weightRange: "210-270", liveWeight: "1.9 & above" },
  { code: "04CP11", name: "Skinon Leg", weightRange: "220-280", liveWeight: "1.9 & above" },
  { code: "04CP12", name: "Skinless Back Quarter", weightRange: "200-230", liveWeight: "1.8" },
  { code: "04CP13", name: "Skinless Back Quarter - Special", weightRange: "230-270", liveWeight: "1.8" },
  { code: "04CP14", name: "Skinon Back Quarter", weightRange: "250-290", liveWeight: "1.8" },
  { code: "04CP16", name: "Whole Wings", weightRange: "L 80-95(Per piece) /  S 60-75(Per piece)", liveWeight: "1.9 & above" },
  { code: "04CP17", name: "Winglet", weightRange: "40-43", liveWeight: "1.9 & above" },
  { code: "04CP19", name: "D. Winglet / Lolipop", weightRange: "38-48", liveWeight: "1.9 & above" },
  { code: "04CP20", name: "Wing Tip", weightRange: "8_12", liveWeight: "1.9 & above" },
  { code: "04CP23", name: "Bite Pieces", weightRange: "500", liveWeight: "1.9 & above" },
  { code: "04CP25", name: "Liver 1 Kg", weightRange: "42-54", liveWeight: "1.9 & above" },
  { code: "04CP24", name: "Liver 500g", weightRange: "42-54", liveWeight: "1.9 & above" },
  { code: "04CP27", name: "Gizzard 1 Kg", weightRange: "20-26", liveWeight: "1.9 & above" },
  { code: "04CP26", name: "Gizzard 500g", weightRange: "20-26", liveWeight: "1.9 & above" },
  { code: "04CP28", name: "Gadget 500g", weightRange: "2_4", liveWeight: "1.9 & above" },
  { code: "04CP29", name: "Curry Pieces 500g", weightRange: "-", liveWeight: "1.9 & above" },
  { code: "04CP30", name: "Soup Bone", weightRange: "125-150", liveWeight: "1.9 & above" },
  { code: "04CP31", name: "Thigh Bone", weightRange: "20-22", liveWeight: "1.9 & above" },
  { code: "04CP32", name: "Kitchen Packed (500g)", weightRange: "-", liveWeight: "1.9 & above" },
  { code: "", name: "Broiler Chicken Feet", weightRange: "-", liveWeight: "1.9 & above" },
  { code: "", name: "Kitchen Item", weightRange: "-", liveWeight: "1.9 & above" },
  { code: "04CP37", name: "MDM Material 500g", weightRange: "-", liveWeight: "1.9 & above" },
  { code: "04CP40", name: "Middle Wing 500g", weightRange: "27-37", liveWeight: "1.9 & above" },
  { code: "04CP41", name: "Neck 500g", weightRange: "35-45", liveWeight: "1.9 & above" },
  { code: "05CM01", name: "Skinless Boneless Breast", weightRange: "400-550", liveWeight: "1.9 & above" },
  { code: "05CM02", name: "Skinless Boneless Thigh", weightRange: "100-120", liveWeight: "1.9 & above" },
  { code: "05CM03", name: "Chicken Skin - Loose Meat 5 Kg", weightRange: "-", liveWeight: "1.9 & above" },
  { code: "05CM04", name: "Chicken Fat", weightRange: "-", liveWeight: "1.9 & above" },
  { code: "04CP34", name: "Pet Food - Minced 500g", weightRange: "-", liveWeight: "-" },
  { code: "06CE01", name: "EASY 250g", weightRange: "-", liveWeight: "2 & above" },
  { code: "06CE02", name: "EASY 400g", weightRange: "-", liveWeight: "2 & above" },
  { code: "06CE03", name: "EASY 700g", weightRange: "-", liveWeight: "2 & above" },
  { code: "06CE05", name: "Easy 05kg", weightRange: "-", liveWeight: "-" },
  { code: "01CW05", name: "Krosher Whole Chicken", weightRange: "-", liveWeight: "-" },
];

function ordinalSuffix_(n) {
  const rem100 = n % 100;
  if (rem100 >= 11 && rem100 <= 13) return `${n}th`;
  switch (n % 10) {
    case 1: return `${n}st`;
    case 2: return `${n}nd`;
    case 3: return `${n}rd`;
    default: return `${n}th`;
  }
}

// Working days = calendar days in the month minus Sundays.
// (Assumption — change here if Poya/Mercantile holidays should also be excluded.)
function countWorkingDaysInMonth_(year, month) {
  const daysInMonth = new Date(year, month, 0).getDate();
  let count = 0;
  for (let d = 1; d <= daysInMonth; d++) {
    if (new Date(year, month - 1, d).getDay() !== 0) count++;
  }
  return count;
}

async function buildStockAvailableReport_(dateStr) {
  const [forecastRows, stockRows] = await Promise.all([
    Api.list("DataProductionForecast"),
    Api.list("DataProductionStock"),
  ]);

  const [yearStr, monthStr, dayStr] = dateStr.split("-");
  const year = Number(yearStr);
  const month = Number(monthStr);
  const workingDays = countWorkingDaysInMonth_(year, month);
  const asAtLabel = ordinalSuffix_(Number(dayStr));

  const items = STOCK_AVAILABLE_ITEMS_.map((item) => {
    const salesPlan = forecastRows
      .filter((r) => String(r.Date) === dateStr && String(r.Code) === item.code)
      .reduce((s, r) => s + (Number(r["Sales Weight (Kg)"]) || 0), 0);

    const dailyToProduce = workingDays > 0 ? salesPlan / workingDays : 0;

    const availableStock = stockRows
      .filter((r) => String(r.Date) === dateStr && String(r.Item_Code) === item.code)
      .reduce((s, r) => s + (Number(r.Qty) || 0), 0);

    const daysOfAvailable = dailyToProduce > 0 ? availableStock / dailyToProduce : null;

    return {
      code: item.code,
      name: item.name,
      salesPlan,
      dailyToProduce,
      availableStock,
      daysOfAvailable,
      weightRange: item.weightRange,
      productionPlan: dailyToProduce,
      liveWeight: item.liveWeight,
    };
  });

  const totalSalesPlan = items.reduce((s, i) => s + i.salesPlan, 0);
  const totalDailyToProduce = items.reduce((s, i) => s + i.dailyToProduce, 0);
  const totalAvailableStock = items.reduce((s, i) => s + i.availableStock, 0);

  return { date: dateStr, asAtLabel, workingDays, items, totalSalesPlan, totalDailyToProduce, totalAvailableStock };
}

// ===================================================================
// HOLIDAY LOOKUP — used by KPI Date headers (Poya / Mercantile)
// ===================================================================

let holidayMapCache_ = null;

async function getHolidayMap_() {
  if (holidayMapCache_) return holidayMapCache_;
  const rows = await Api.list("Holidays");
  const map = {};
  rows.forEach((r) => {
    const date = String(r.Date);
    const category = String(r.Category || "").trim().toLowerCase();   // ← .toLowerCase() add කළා
    if (category === "poya") map[date] = "Poya";
    else if (category === "mercantile") map[date] = "Mercantile";
  });
  holidayMapCache_ = map;
  return map;
}

function getDateHeaderClass_(dateStr, holidayMap) {
  const dow = getDayOfWeekClass_(dateStr);   // reuses existing helper: dow-sunday / dow-saturday / ""
  if (holidayMap[dateStr] === "Poya") return "date-poya";
  if (holidayMap[dateStr] === "Mercantile") return "date-mercantile";
  return dow;
}

// ===================================================================
// KPI Main Chart — Daily/Weekly toggle helper
// Aggregates a month's daily records into weeks (W01, W02, ...) —
// average of the metric across days that have data in that week.
// ===================================================================
function aggregateToWeeks_(dailyRecords, valueKey) {
  const withData = dailyRecords.filter((r) => r.hasData);
  const buckets = {};

  withData.forEach((r) => {
    const weekNum = Math.ceil(r.day / 7);   // week within the month (1-5)
    if (!buckets[weekNum]) buckets[weekNum] = { sum: 0, count: 0 };
    buckets[weekNum].sum += r[valueKey];
    buckets[weekNum].count += 1;
  });

  return Object.keys(buckets)
    .map(Number)
    .sort((a, b) => a - b)
    .map((wk) => ({
      label: `W${String(wk).padStart(2, "0")}`,
      value: buckets[wk].count > 0 ? buckets[wk].sum / buckets[wk].count : 0,
    }));
}


// ===================================================================
// KPI 01 — Daily Bay Mortality % Trend: Daily/Weekly toggle helper
// Weekly view = average of daily % values within each week-of-month
// ===================================================================
function computeKpi01TrendBuckets_(days, viewMode) {
  const withData = days.filter((d) => d.hasData && d.totalBirds !== null);

  if (viewMode === "daily") {
    return withData.map((d) => ({ label: String(d.day).padStart(2, "0"), pct: d.pct }));
  }

  // weekly: 7-day chunks within the month, averaged
  const buckets = {};
  withData.forEach((d) => {
    const weekNum = Math.floor((d.day - 1) / 7) + 1;
    if (!buckets[weekNum]) buckets[weekNum] = { sum: 0, count: 0 };
    buckets[weekNum].sum += d.pct;
    buckets[weekNum].count += 1;
  });

  return Object.keys(buckets)
    .map(Number)
    .sort((a, b) => a - b)
    .map((wk) => {
      const b = buckets[wk];
      return { label: `Week ${wk}`, pct: b.count > 0 ? b.sum / b.count : 0 };
    });
}

// ===================================================================
// ALL DIVISION CONSUMABLE REPORTS — 6 divisions, same table shape
// (Material Name rows × day columns), master list per division
// defines rows, data sheet columns = material names.
// ===================================================================

const CONSUMABLE_DIVISIONS_ = {
  lb:       { label: "Live Bird & Slaughtering", masterSheet: "MasterConsumableLB",       dataSheet: "DataLBConsumable" },
  ev:       { label: "EV",                       masterSheet: "MasterConsumableEV",       dataSheet: "DataEVConsumable" },
  packing1: { label: "Packing 01",                masterSheet: "MasterConsumablePacking", dataSheet: "DataPackingConsumable" },
  packing2: { label: "Packing 02",                masterSheet: "MasterConsumablePacking2",dataSheet: "DataPacking2Consumable" },
  easy:     { label: "Easy",                      masterSheet: "MasterConsumableEasy",     dataSheet: "DataEasyConsumable" },
  fbp:      { label: "Final bulk packing",        masterSheet: "MasterConsumableFBP",      dataSheet: "DataFBPConsumable" },
};

async function buildConsumableReport_(divisionKey, year, month) {
  const config = CONSUMABLE_DIVISIONS_[divisionKey];
  const [masterRows, dataRows] = await Promise.all([
    Api.list(config.masterSheet),
    Api.list(config.dataSheet),
  ]);

  const monthPrefix = `${year}-${String(month).padStart(2, "0")}-`;
  const monthRows = dataRows.filter((r) => String(r.Date).startsWith(monthPrefix));
  const daysInMonth = new Date(Number(year), Number(month), 0).getDate();

  // valueByItemDay[itemName][day] = summed value from the wide-format data sheet
  const valueByItemDay = {};
  masterRows.forEach((m) => {
    valueByItemDay[m["Item Name"]] = {};
  });

  monthRows.forEach((row) => {
    const day = Number(String(row.Date).split("-")[2]);
    masterRows.forEach((m) => {
      const itemName = m["Item Name"];
      const v = Number(row[itemName]) || 0;
      valueByItemDay[itemName][day] = (valueByItemDay[itemName][day] || 0) + v;
    });
  });

  const items = masterRows.map((m) => {
    const itemName = m["Item Name"];
    const unit = m.Unit || "";
    const values = [];
    for (let d = 1; d <= daysInMonth; d++) {
      values.push((valueByItemDay[itemName] && valueByItemDay[itemName][d]) || 0);
    }
    return { itemName, unit, values };
  });

  const columnTotals = [];
  for (let d = 1; d <= daysInMonth; d++) {
    columnTotals.push(items.reduce((s, i) => s + i.values[d - 1], 0));
  }

  return { divisionKey, label: config.label, year, month, daysInMonth, items, columnTotals };
}

// ===================================================================
// SEND NOTIFICATIONS — Out-of-standard days per KPI, grouped by status
// ===================================================================

const NOTIFICATION_KPI_CONFIGS_ = {
  "kpi-01": {
    label: "KPI 01",
    buildYearData: buildBayMortalityYearData_,
    colorClass: bayMortalityColorClass_,
    valueField: "pct",
    valueLabel: "Bay Mortality %",
  },
  "kpi-02": {
    label: "KPI 02",
    buildYearData: null, // Coming soon
    colorClass: null,
    valueField: null,
    valueLabel: "Unloading Rate %",
  },
  "kpi-03": {
    label: "KPI 03",
    buildYearData: buildSlaughterEfficiencyYearData_,  // ✅ නිවැරදි
    colorClass: slaughterEfficiencyColorClass_,        // ✅ නිවැරදි
    valueField: "pct",
    valueLabel: "Slaughter Efficiency %",
  },
  "kpi-04": {
    label: "KPI 04",
    buildYearData: buildPackingEfficiencyYearData_,
    colorClass: packingEfficiencyColorClass_,
    valueField: "pct",
    valueLabel: "Packing Efficiency %",
  },
  "kpi-05": {
    label: "KPI 05",
    buildYearData: buildDressedYieldYearData_,
    colorClass: dressedYieldColorClass_,
    valueField: "yieldPct",
    valueLabel: "Dressed Yield %",
  },
  "kpi-06": {
    label: "KPI 06",
    buildYearData: buildChillLossYearData_,
    colorClass: chillLossColorClass_,
    valueField: "chillLossPct",
    valueLabel: "Chill Loss %",
  },
};

async function buildNotificationData_(kpiKey, year, month) {
  const config = NOTIFICATION_KPI_CONFIGS_[kpiKey];
  if (!config || !config.buildYearData) {
    return { available: false, label: config ? config.label : kpiKey };
  }

  const yearDays = await config.buildYearData(year);
  const monthPrefix = `${year}-${String(month).padStart(2, "0")}-`;
  const monthDays = yearDays.filter((r) => r.hasData && r.date.startsWith(monthPrefix));

  const buckets = { caution: [], warning: [], critical: [] };
  monthDays.forEach((r) => {
    const cls = config.colorClass(r[config.valueField]);
    const entry = { date: r.date, value: r[config.valueField] };
    if (cls === "kpi-yellow") buckets.caution.push(entry);
    else if (cls === "kpi-orange") buckets.warning.push(entry);
    else if (cls === "kpi-red") buckets.critical.push(entry);
  });

  return { available: true, label: config.label, valueLabel: config.valueLabel, buckets };
}