// Thin wrapper around the Google Apps Script Web App (QA System backend).

// ===================================================================
// In-memory cache
// ===================================================================
const _sheetCache = {};
const CACHE_TTL_MS = 60 * 1000;   // 60 තත්පර

// ===================================================================
// Request queue — Apps Script එකට එකවර 3කට වඩා යවන්නේ නැහැ
// ===================================================================
const _requestQueue = {
  active: 0,
  maxConcurrent: 3,
  waiting: [],
  async run(fn) {
    if (this.active >= this.maxConcurrent) {
      await new Promise(resolve => this.waiting.push(resolve));
    }
    this.active++;
    try {
      return await fn();
    } finally {
      this.active--;
      const next = this.waiting.shift();
      if (next) next();
    }
  },
};

const Api = {
  // =================================================================
  // list() — POST වලින් load කරනවා (redirect cache ප්‍රශ්නය විසඳෙනවා)
  // =================================================================
  async list(sheet, opts = {}) {
  const isLegacyRetries = typeof opts === "number";
  const retries = isLegacyRetries ? opts : (opts.retries ?? 2);
  const force   = isLegacyRetries ? false : (opts.force === true);

  const now = Date.now();
  const cached = _sheetCache[sheet];
  if (!force && cached && (now - cached.timestamp) < CACHE_TTL_MS) {
    return cached.rows;
  }

  return await _requestQueue.run(async () => {
    const cachedNow = _sheetCache[sheet];
    if (!force && cachedNow && (Date.now() - cachedNow.timestamp) < CACHE_TTL_MS) {
      return cachedNow.rows;
    }

    const url = `${API_URL}?sheet=${encodeURIComponent(sheet)}&action=list`;
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const res = await fetch(url, { method: "GET" });
        if (!res.ok) throw new Error(`API error (${res.status})`);
        const data = await res.json();
        if (data.error) throw new Error(data.error);

        _sheetCache[sheet] = { rows: data, timestamp: Date.now() };
        return data;
      } catch (err) {
        if (attempt === retries) throw err;
        await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
      }
    }
  });
},

  clearCache(sheet) {
    if (sheet) delete _sheetCache[sheet];
    else Object.keys(_sheetCache).forEach(k => delete _sheetCache[k]);
  },

  async _post(payload, retries = 0) {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const res = await fetch(API_URL, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify(payload),
          redirect: "follow",
          cache: "no-store",
        });
        if (!res.ok) throw new Error(`API error (${res.status})`);
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        return data;
      } catch (err) {
        if (attempt === retries) throw err;
        await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
      }
    }
  },

  login(username, password) {
    return this._post({ sheet: "Users", action: "login", data: { username, password } });
  },
  forgotPassword(username) {
    return this._post({ sheet: "Users", action: "forgotPassword", data: { username } });
  },
  resetPassword(username, code, newPassword) {
    return this._post({ sheet: "Users", action: "resetPassword", data: { username, code, newPassword } });
  },
};