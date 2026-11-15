// Refresh button for the claude.ai artifact (added by build_artifact.py; not used on the website).
// Editors click once; the page saves a "requested" note in the artifact's shared db (refresh/request).
// A local scheduled task on the Mac checks that note hourly and runs the refresh.
(function () {
  var MIN_GAP_H = 12;
  var state = { snap: null, canWrite: false, db: null, confirming: false, busy: false, err: "" };

  var css = document.createElement("style");
  css.textContent =
    "#rfPanel{display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin:0 0 14px;padding:10px 14px;border:1px solid var(--rule);border-radius:10px;background:var(--surface);font-size:13px;color:var(--muted)}" +
    "#rfPanel b{color:var(--ink)}" +
    "#rfPanel button{border:1px solid var(--ink);background:var(--ink);color:var(--bg);border-radius:999px;padding:7px 16px;font:600 13px var(--body);cursor:pointer}" +
    "#rfPanel button.sec{background:var(--surface);color:var(--ink)}" +
    "#rfPanel button:disabled{opacity:.45;cursor:not-allowed}" +
    "#rfPanel button:focus-visible{outline:2px solid var(--accent);outline-offset:2px}" +
    "#rfPanel .dot{display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:6px;background:var(--muted)}" +
    "#rfPanel .dot.run{background:var(--target)}#rfPanel .dot.ok{background:var(--good)}#rfPanel .dot.bad{background:var(--bad)}";
  document.head.appendChild(css);

  function esc(s) {
    return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  function ago(iso) {
    var t = Date.parse(iso);
    if (!t) return "";
    var m = Math.max(0, Math.round((Date.now() - t) / 60000));
    if (m < 2) return "just now";
    if (m < 90) return m + " min ago";
    var h = Math.round(m / 60);
    if (h < 36) return h + " h ago";
    return Math.round(h / 24) + " days ago";
  }

  function view() {
    var d = (state.snap && state.snap.exists && state.snap.data()) || {};
    var st = d.status || "idle";
    var busy = st === "requested" || st === "running";
    var recent = (st === "done" || st === "skipped") && d.finished_at &&
      Date.now() - Date.parse(d.finished_at) < MIN_GAP_H * 3600e3;
    var dot = "dot", line;
    if (st === "requested") { dot += " run"; line = "<b>Refresh requested</b> " + ago(d.requested_at) + ". Starts within an hour."; }
    else if (st === "running") { dot += " run"; line = "<b>Refresh running</b> since " + ago(d.started_at) + "."; }
    else if (st === "failed") { dot += " bad"; line = "<b>Last refresh failed</b> " + ago(d.finished_at) + ": " + esc(d.note || "see the scheduled task"); }
    else if (d.finished_at) { dot += " ok"; line = "<b>Last refreshed</b> " + ago(d.finished_at) + (d.note ? ". " + esc(d.note) : ""); }
    else { line = "No refresh has been requested from this page yet."; }

    var action = "";
    if (state.canWrite) {
      if (state.confirming && !busy) {
        action = '<button id="rfYes">Start refresh</button><button id="rfNo" class="sec">Cancel</button>' +
          '<span>Takes about 30 minutes. No team email.</span>';
      } else {
        var why = busy ? "A refresh is already in progress." :
          recent ? "Refreshed less than " + MIN_GAP_H + " hours ago. Next refresh allowed after " + new Date(Date.parse(d.finished_at) + MIN_GAP_H * 3600e3).toLocaleString() + "." : "";
        action = '<button id="rfGo"' + (busy || recent || state.busy ? " disabled" : "") + '>↻ Refresh all data</button>' + (why ? "<span>" + esc(why) + "</span>" : "");
      }
    }
    return '<span><i class="' + dot + '"></i>' + line + "</span>" + action + (state.err ? '<span style="color:var(--bad)">' + esc(state.err) + "</span>" : "");
  }

  function render() {
    var app = document.getElementById("app");
    if (!app || !state.db) return;
    var box = document.getElementById("rfPanel");
    if (!box) {
      box = document.createElement("div");
      box.id = "rfPanel";
      app.insertBefore(box, app.firstChild);
    }
    box.innerHTML = view();
    var go = document.getElementById("rfGo"), yes = document.getElementById("rfYes"), no = document.getElementById("rfNo");
    if (go) go.onclick = function () { state.confirming = true; state.err = ""; render(); };
    if (no) no.onclick = function () { state.confirming = false; render(); };
    if (yes) yes.onclick = request;
  }

  function request() {
    state.busy = true; state.confirming = false; state.err = ""; render();
    var ref = state.db.doc("refresh/request");
    var body = { status: "requested", requested_at: new Date().toISOString(), note: "" };
    var p = state.snap && state.snap.exists ? ref.update(body) : ref.set(body);
    p.catch(function (e) {
      state.err = e && e.code === "invalid_argument" ? "You need Editor access to request a refresh." : "Could not save the request. Try again in a minute.";
    }).then(function () { state.busy = false; render(); });
  }

  // The page re-renders #app on every tab change; put the panel back when it disappears.
  new MutationObserver(function () {
    if (state.db && !document.getElementById("rfPanel")) render();
  }).observe(document.documentElement, { childList: true, subtree: true });

  // The page saves CSVs with a blob link; an artifact can't, so hand the blob to the downloads capability.
  (function () {
    var blobs = {}, mk = URL.createObjectURL, click = HTMLAnchorElement.prototype.click;
    URL.createObjectURL = function (b) { var u = mk.call(URL, b); blobs[u] = b; return u; };
    HTMLAnchorElement.prototype.click = function () {
      var name = this.getAttribute("download"), href = this.href;
      if (name !== null && blobs[href] && window.claude && window.claude.use) {
        window.claude.use("downloads").then(function (d) {
          if (d) d.save({ filename: name, data: blobs[href] }).catch(function () {});
        });
        return;
      }
      return click.apply(this, arguments);
    };
  })();

  if (!window.claude || !window.claude.use) return;
  Promise.all([window.claude.use("db"), window.claude.use("user")]).then(function (r) {
    if (!r[0]) return;
    state.db = r[0];
    try { state.canWrite = r[1] ? !!r[1].canEdit() : false; } catch (e) { state.canWrite = false; }
    state.db.doc("refresh/request").onSnapshot(function (snap) { state.snap = snap; render(); },
      function () { state.db = null; var b = document.getElementById("rfPanel"); if (b) b.remove(); });
  });
})();
