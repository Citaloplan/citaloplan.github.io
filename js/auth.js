// Demo-only static authentication.
// IMPORTANT: This is suitable for a local/demo build, NOT real production security.
// In production, replace with Supabase/Firebase/Auth backend.
(() => {
  const DEMO_USERS = {
    kiana: {
      id: "kiana",
      passwordHash: "b58dcef0597c2c5522468fad806a57adb58735d1e49e2b3691aaca673bb2b5e3"
    },
    romisa: {
      id: "romisa",
      passwordHash: "586b9c3e51baa98c0311aa5346daae40d25740d63d30108c317ee291ba269543"
    },
    artina: {
      id: "artina",
      passwordHash: "d96a67a94cb63fb333c78790b51ab8a8e013467162673172cddaca40bd17a956"
    }
  };

  async function sha256(text) {
    const bytes = new TextEncoder().encode(text);
    const hash = await crypto.subtle.digest("SHA-256", bytes);
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("");
  }

  window.CitaloAuth = {
    async login(username, password) {
      const key = String(username || "").trim().toLowerCase();
      const user = DEMO_USERS[key];
      if (!user) return false;
      const hash = await sha256(password || "");
      if (hash !== user.passwordHash) return false;
      localStorage.setItem("citaloplan_session", JSON.stringify({
        studentId: user.id,
        loggedInAt: Date.now()
      }));
      return true;
    },
    session() {
      try {
        return JSON.parse(localStorage.getItem("citaloplan_session") || "null");
      } catch {
        return null;
      }
    },
    requireStudent() {
      const s = this.session();
      if (!s?.studentId) {
        location.href = "login.html";
        return null;
      }
      return s.studentId;
    },
    logout() {
      localStorage.removeItem("citaloplan_session");
      location.href = "login.html";
    }
  };
})();
