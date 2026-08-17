// Thin wrapper around the Google Apps Script Web App (QA System backend).
const Api = {
  async list(sheet, retries = 2) {
    const url = `${API_URL}?sheet=${encodeURIComponent(sheet)}&action=list`;
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`API error (${res.status})`);
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        return data;
      } catch (err) {
        if (attempt === retries) throw err;   // final attempt failed — give up
        await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));  // wait 500ms, 1000ms...
      }
    }
  },

  async _post(payload, retries = 0) {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const res = await fetch(API_URL, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify(payload),
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
};