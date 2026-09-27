// Midiator simulator: a working copy of the app's Setlists screen, against a 10-minute clock.
// Plain JavaScript, no libraries. Everything is drawn inside <div id="sim">.
(() => {
  const root = document.getElementById("sim");
  if (!root) return;

  const TEN_MINUTES = 10 * 60 * 1000;
  const SITE = "https://samuelwan04-rgb.github.io/midiator/";

  // Example pedals, each with ten "saved" presets. Generic names, like sounds people really save.
  const PEDALS = [
    { id: "drive", name: "Drive", presets: ["Clean boost", "Edge of breakup", "Light crunch", "Mid gain", "Plexi push", "Tape drive", "Warm fuzz", "Big lead", "Transparent", "Boost +6"] },
    { id: "delay", name: "Delay", presets: ["Dotted 8th", "Quarter note", "Slapback", "Ambient wash", "Tape echo", "Ping pong", "Long trails", "Reverse swell", "8th triplet", "Modulated"] },
    { id: "reverb", name: "Reverb", presets: ["Small room", "Plate", "Big hall", "Shimmer pad", "Cathedral", "Spring", "Cloud", "Bloom", "Swell", "Ambient"] },
    { id: "mod", name: "Modulation", presets: ["Slow chorus", "Vibe", "Rotary", "Tremolo", "Harmonic trem", "Phaser", "Flanger", "Detune", "Leslie", "Subtle shimmer"] },
    { id: "pitch", name: "Pitch", presets: ["Octave up", "Octave down", "Harmony 3rd", "Harmony 5th", "Pad synth", "Swell synth", "Detune wide", "Whammy up", "Sub octave", "Freeze pad"] },
    { id: "comp", name: "Compressor", presets: ["Light squash", "Country snap", "Sustain", "Parallel", "Soft knee", "Always on", "Clean glue", "Funk", "Limiter", "Bloom"] },
    { id: "looper", name: "Looper", presets: ["Record", "Overdub", "Half speed", "Reverse", "Play once", "Fade out", "Stop", "Undo", "Loop A", "Loop B"] },
  ];
  const START_RIG = ["drive", "delay", "reverb", "mod", "pitch"];

  // A normal week: 4 songs, 18 parts, laid out on an MC6 like the app does (bottom A B C, top D E F).
  const SETLIST = [
    { title: "Holy Forever", bpm: 72, parts: ["Intro", "Verse", "Chorus", "Bridge", "Outro"] },
    { title: "Goodness of God", bpm: 63, parts: ["Verse", "Chorus", "Bridge", "Tag"] },
    { title: "Great Are You Lord", bpm: 76, parts: ["Intro", "Verse", "Chorus", "Bridge"] },
    { title: "Way Maker", bpm: 68, parts: ["Verse", "Chorus", "Bridge", "Tag", "Outro"] },
  ];
  const FIRST_BANK = 23;
  const LETTERS = ["A", "B", "C", "D", "E", "F"];
  const ORDER = [3, 4, 5, 0, 1, 2]; // top row first on screen, like the hardware

  let rig = [...START_RIG];
  let picks = []; // picks[song][part] = { pedalId: presetIndex }
  let open = null; // { song, part } being edited
  let startedAt = 0;
  let finishedIn = 0;
  let timer = null;
  let state = "intro";

  const el = (tag, props = {}, ...children) => {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(props)) {
      if (v === null || v === undefined || v === false) continue;
      if (k === "class") node.className = v;
      else if (k === "text") node.textContent = v;
      else if (k.startsWith("on")) node.addEventListener(k.slice(2), v);
      else node.setAttribute(k, v === true ? "" : v);
    }
    for (const c of children.flat()) if (c !== null && c !== undefined && c !== false) node.append(c);
    return node;
  };
  const pedal = (id) => PEDALS.find((p) => p.id === id);
  const clock = (ms) => {
    const s = Math.max(0, Math.floor(ms / 1000));
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  };
  const spoken = (ms) => {
    const s = Math.round(ms / 1000);
    const m = Math.floor(s / 60);
    return m ? `${m} min ${s % 60} s` : `${s} s`;
  };
  const total = SETLIST.reduce((n, s) => n + s.parts.length, 0);
  const isDone = (s, p) => picks[s] && Object.keys(picks[s][p] || {}).length > 0;
  const doneCount = () => SETLIST.reduce((n, s, i) => n + s.parts.filter((_, p) => isDone(i, p)).length, 0);

  // ---------- The app window ----------
  function render() {
    const playing = state === "play";
    const left = total - doneCount();
    root.replaceChildren(
      el("div", { class: "sim-hud" },
        el("span", { class: "sim-time", text: clock(state === "done" ? finishedIn : state === "play" ? performance.now() - startedAt : 0), "aria-label": "Time" }),
        el("div", { class: "sim-bar", "aria-hidden": "true" }, el("span", { class: "sim-bar__fill" }), el("span", { class: "sim-bar__mark", text: "10:00" })),
        el("span", { class: "sim-count", text: `${doneCount()} of ${total} parts` })),
      el("div", { class: "app-window" },
        el("div", { class: "app-titlebar" }, el("i"), el("i"), el("i"), el("span", { text: "Midiator" })),
        el("div", { class: "app" },
          el("header", { class: "app-top" },
            el("span", { class: "app-brand" }, el("img", { src: "assets/midiator-mark.svg", alt: "", width: "20", height: "20" }), "midiator"),
            el("nav", { class: "app-tabs" }, el("span", { class: "on", text: "Setlists" }), el("span", { text: "Songs" }), el("span", { text: "My presets" })),
            el("span", { class: "app-spacer" }),
            el("span", { class: "app-conn" }, el("span", { class: "app-dot" }), "MC6MK2 connected")),
          el("main", { class: "app-main" },
            el("div", { class: "app-head" },
              el("div", {},
                el("p", { class: "app-title", text: "This week" }),
                el("p", { class: "app-sub", text: `${SETLIST.length} songs · MC6 banks ${FIRST_BANK}–${FIRST_BANK + SETLIST.length - 1}` })),
              el("button", {
                type: "button",
                class: `app-btn${left === 0 && playing ? " primary" : ""}`,
                disabled: !playing || left > 0,
                title: left > 0 ? `${left} part${left === 1 ? "" : "s"} still need a sound` : null,
                onclick: send,
                text: `Send ${SETLIST.length} songs to MC6`,
              })),
            el("div", { class: "app-controls" },
              el("span", { class: "app-field" }, "Controller", el("span", { class: "app-select", text: "MC6 mkII" })),
              el("span", { class: "app-field" }, "First MC6 bank", el("span", { class: "app-select app-num", text: String(FIRST_BANK) })),
              el("span", { class: "app-field" }, "Tempo switches", el("span", { class: "app-seg" }, el("span", { text: "Off" }), el("span", { class: "on", text: "Tap" }), el("span", { text: "−1 / +1" })))),
            SETLIST.map((song, s) => songCard(song, s)))),
        state === "intro" ? introCard() : null,
        state === "done" ? doneCard() : null));
    tick();
  }

  function songCard(song, s) {
    const done = song.parts.filter((_, p) => isDone(s, p)).length;
    const cells = ORDER.map((slot) => {
      if (slot === 5) return el("div", { class: "cell cell-tempo" }, el("span", { class: "cell-letter", text: "F" }), el("span", { class: "cell-name", text: "Tap tempo" }), el("span", { class: "cell-presets", text: "live BPM on the MC6" }));
      const p = slot;
      if (p >= song.parts.length) return el("div", { class: "cell cell-empty" }, el("span", { class: "cell-letter", text: LETTERS[slot] }), el("span", { class: "cell-add", text: "+ Add section" }));
      const chosen = (picks[s] && picks[s][p]) || {};
      const lines = Object.entries(chosen).map(([id, k]) => `${pedal(id).name} · ${pedal(id).presets[k]}`);
      const isOpen = open && open.song === s && open.part === p;
      return el("button", {
        type: "button",
        class: `cell cell-section${isOpen ? " selected" : ""}${lines.length ? "" : " cell-todo"}`,
        disabled: state !== "play",
        "aria-expanded": String(isOpen),
        onclick: () => { open = isOpen ? null : { song: s, part: p }; render(); focusEditor(); },
      },
        el("span", { class: "cell-letter", text: LETTERS[slot] }),
        el("span", { class: "cell-name", text: song.parts[p] }),
        el("span", { class: "cell-presets", text: lines.length ? lines.join("\n") : "No presets picked" }));
    });
    const pill = state === "done"
      ? el("span", { class: "app-pill st-ok", text: `On MC6 · bank ${FIRST_BANK + s}` })
      : el("span", { class: "app-pill", text: `Bank ${FIRST_BANK + s} · ${done} of ${song.parts.length} parts` });
    return el("section", { class: "song-card" },
      el("div", { class: "song-head" },
        el("span", { class: "song-grip", "aria-hidden": "true", text: "⋮⋮" }),
        el("span", { class: "song-title", text: song.title }),
        el("span", { class: "song-bpm" }, el("span", { class: "app-select app-num", text: String(song.bpm) }), "BPM"),
        el("span", { class: "app-spacer" }),
        pill),
      el("div", { class: "mc6-grid" }, cells),
      open && open.song === s ? editor(s, open.part) : null);
  }

  // The section editor: one preset picker per pedal, as in the app.
  function editor(s, p) {
    picks[s][p] = picks[s][p] || {};
    const chosen = picks[s][p];
    return el("div", { class: "section-editor" },
      el("div", { class: "se-name" },
        el("span", { class: "app-select se-title", text: SETLIST[s].parts[p] }),
        el("span", { class: "se-hint", text: "Pick the saved sound each pedal plays in this part." })),
      el("div", { class: "se-pedals" },
        rig.map((id) => {
          const pd = pedal(id);
          return el("label", { class: "se-pedal" },
            pd.name,
            el("select", {
              onchange: (e) => {
                if (e.target.value === "") delete chosen[id];
                else chosen[id] = Number(e.target.value);
                const keep = document.activeElement && document.activeElement.dataset.pedal;
                render();
                if (keep) root.querySelector(`select[data-pedal="${keep}"]`)?.focus({ preventScroll: true });
              },
              "data-pedal": id,
            },
              el("option", { value: "", text: "— don't change —" }),
              pd.presets.map((name, k) => {
                const o = el("option", { value: String(k), text: name });
                if (chosen[id] === k) o.selected = true;
                return o;
              })));
        })),
      el("div", { class: "se-actions" },
        el("span", { class: "app-spacer" }),
        el("button", { type: "button", class: "app-btn primary", onclick: nextPart, text: "Done" })));
  }

  function focusEditor() {
    root.querySelector(".section-editor select")?.focus({ preventScroll: true });
    root.querySelector(".section-editor")?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }

  // Done closes this part and opens the next one that still needs a sound.
  function nextPart() {
    const all = SETLIST.flatMap((song, s) => song.parts.map((_, p) => ({ song: s, part: p })));
    const here = all.findIndex((x) => open && x.song === open.song && x.part === open.part);
    const next = [...all.slice(here + 1), ...all.slice(0, here + 1)].find((x) => !isDone(x.song, x.part));
    open = next || null;
    render();
    if (next) focusEditor();
    else root.querySelector(".app-head .app-btn")?.focus({ preventScroll: true });
  }

  // ---------- Before and after ----------
  function introCard() {
    const available = PEDALS.filter((p) => !rig.includes(p.id));
    return el("div", { class: "app-overlay" },
      el("div", { class: "app-dialog" },
        el("p", { class: "app-dialog__title", text: "Your pedalboard" }),
        el("p", { class: "app-dialog__sub", text: `Each pedal already has 10 sounds saved on it, like yours. Add or remove pedals to match your board, then give all ${total} parts of this week's ${SETLIST.length} songs their sounds.` }),
        el("ul", { class: "rig" },
          rig.map((id) =>
            el("li", {},
              el("span", { text: pedal(id).name }),
              el("span", { class: "rig-n", text: "10 presets" }),
              rig.length > 1 ? el("button", { type: "button", class: "rig-x", "aria-label": `Remove ${pedal(id).name}`, text: "×", onclick: () => { rig = rig.filter((r) => r !== id); render(); } }) : null)),
          available.length
            ? el("li", { class: "rig-add" },
                el("select", { "aria-label": "Add a pedal", onchange: (e) => { if (e.target.value) { rig.push(e.target.value); render(); } } },
                  el("option", { value: "", text: "+ Add a pedal" }),
                  available.map((p) => el("option", { value: p.id, text: p.name }))))
            : null),
        el("div", { class: "start-row" },
          el("button", { type: "button", class: "px-btn", onclick: start }, "Start"),
          el("span", { class: "start-note", text: "The clock starts now. Beat 10:00." }))));
  }

  function doneCard() {
    const under = TEN_MINUTES - finishedIn;
    const share = `I set up ${total} song-specific pedal presets for this week in ${clock(finishedIn)} with Midiator. Beat my time: ${SITE}#try`;
    const shareBtn = el("button", {
      type: "button",
      class: "app-btn",
      text: "Share my time",
      onclick: async () => {
        try {
          if (navigator.share) await navigator.share({ text: share });
          else {
            await navigator.clipboard.writeText(share);
            shareBtn.textContent = "Copied!";
          }
        } catch {
          /* share sheet closed */
        }
      },
    });
    return el("div", { class: "app-overlay" },
      el("div", { class: "app-dialog app-dialog--done" },
        el("p", { class: "app-dialog__title", text: "Setlist ready" }),
        el("p", { class: "done-time", text: clock(finishedIn) }),
        el("p", { class: "app-dialog__sub", text: under > 0
          ? `${total} song-specific presets on ${rig.length} pedals, ${spoken(under)} under ten minutes. No more small, medium and large every week.`
          : `${total} song-specific presets on ${rig.length} pedals. Next week is quicker: your songs are already saved.` }),
        el("div", { class: "done-actions" },
          el("a", { class: "app-btn primary big", href: "#download", text: "Try it now: Download for Mac" }),
          shareBtn,
          el("button", { type: "button", class: "app-btn", text: "Play again", onclick: () => { state = "intro"; picks = []; open = null; render(); } }))));
  }

  // ---------- Clock ----------
  function start() {
    picks = SETLIST.map((song) => song.parts.map(() => null));
    open = { song: 0, part: 0 };
    startedAt = performance.now();
    state = "play";
    clearInterval(timer);
    timer = setInterval(tick, 250);
    render();
    focusEditor();
  }

  function send() {
    clearInterval(timer);
    finishedIn = performance.now() - startedAt;
    open = null;
    state = "done";
    render();
  }

  function tick() {
    const ms = state === "done" ? finishedIn : state === "play" ? performance.now() - startedAt : 0;
    const t = root.querySelector(".sim-time");
    const bar = root.querySelector(".sim-bar__fill");
    if (t) t.textContent = clock(ms);
    if (bar) {
      bar.style.width = `${Math.min(100, (ms / TEN_MINUTES) * 100)}%`;
      bar.classList.toggle("over", ms > TEN_MINUTES);
    }
  }

  render();
})();
