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

// ===================================================================
// JSONP loader — Apps Script redirect cache (404) ප්‍රශ්නය විසඳනවා.
// HTML <script> tag එකක් load කරන නිසා CORS/redirect cache නැහැ.
// ===================================================================
function jsonpRequest_(url, timeoutMs = 20000) {
  return new Promise((resolve, reject) => {
    const callbackName = `__jsonp_cb_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const script = document.createElement("script");
    let timeoutId = null;
    let finished = false;

    function cleanup() {
      if (finished) return;
      finished = true;
      if (script.parentNode) script.parentNode.removeChild(script);
      try { delete window[callbackName]; } catch (e) { window[callbackName] = undefined; }
      if (timeoutId) clearTimeout(timeoutId);
    }

    window[callbackName] = (data) => {
      cleanup();
      resolve(data);
    };

    script.onerror = () => {
      cleanup();
      reject(new Error("JSONP script load failed"));
    };

    timeoutId = setTimeout(() => {
      cleanup();
      reject(new Error("JSONP request timed out"));
    }, timeoutMs);

    script.src = `${url}&callback=${callbackName}`;
    script.async = true;
    document.head.appendChild(script);
  });
}

const Api = {
  // =================================================================
  // list() — JSONP use කරනවා. Cache + Queue සමඟ.
  // opts.force = true  → cache skip
  // opts.retries = N   → retry count (default 2)
  // =================================================================
  async list(sheet, opts = {}) {
    const isLegacyRetries = typeof opts === "number";
    const retries = isLegacyRetries ? opts : (opts.retries ?? 2);
    const force   = isLegacyRetries ? false : (opts.force === true);

    // ---------- Cache hit ----------
    const now = Date.now();
    const cached = _sheetCache[sheet];
    if (!force && cached && (now - cached.timestamp) < CACHE_TTL_MS) {
      return cached.rows;
    }

    return await _requestQueue.run(async () => {
      // Queue එකේ ඉන්න ගමන් තව කෙනෙක් cache fill කරලා නම්
      const cachedNow = _sheetCache[sheet];
      if (!force && cachedNow && (Date.now() - cachedNow.timestamp) < CACHE_TTL_MS) {
        return cachedNow.rows;
      }

      // 🆕 Random cache buster — හැම call එකකට unique URL එකක්
      const cacheBuster = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
      const url = `${API_URL}?sheet=${encodeURIComponent(sheet)}&action=list&_=${cacheBuster}`;

      for (let attempt = 0; attempt <= retries; attempt++) {
        try {
          const data = await jsonpRequest_(url);

          // Apps Script එකෙන් error JSON එකක් ආවොත්
          if (data && data.error) throw new Error(data.error);

          _sheetCache[sheet] = { rows: data, timestamp: Date.now() };
          return data;
        } catch (err) {
          if (attempt === retries) throw err;
          await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
        }
      }
    });
  },

  // =================================================================
  // clearCache() — sheet එකක් හෝ සියල්ල clear කරන්න
  // =================================================================
  clearCache(sheet) {
    if (sheet) delete _sheetCache[sheet];
    else Object.keys(_sheetCache).forEach(k => delete _sheetCache[k]);
  },

  // =================================================================
  // _post() — POST calls (login, forgotPassword, resetPassword)
  // POST වලට redirect cache issue නැහැ, ඒ නිසා fetch විදිහටම තියනවා.
  // =================================================================
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