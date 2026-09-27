// Midiator simulator: build a week's setlist of song-specific presets against a 10-minute clock.
// Plain JavaScript, no libraries. Everything is drawn inside <div id="sim">. The pixel pedals come
// from script.js (window.midiatorPixelPedal), which is loaded first.
(() => {
  const root = document.getElementById("sim");
  if (!root) return;

  const TEN_MINUTES = 10 * 60 * 1000;
  const SITE = "https://samuelwan04-rgb.github.io/midiator/";

  // Example pedals, each with ten "saved" presets. Generic names, like sounds people really save.
  const PEDALS = [
    { id: "drive", name: "Drive", look: 15, presets: ["Clean boost", "Edge of breakup", "Light crunch", "Mid gain", "Plexi push", "Tape drive", "Warm fuzz", "Big lead", "Transparent", "Boost +6"] },
    { id: "delay", name: "Delay", look: 2, presets: ["Dotted 8th", "Quarter note", "Slapback", "Ambient wash", "Tape echo", "Ping pong", "Long trails", "Reverse swell", "8th triplet", "Modulated"] },
    { id: "reverb", name: "Reverb", look: 3, presets: ["Small room", "Plate", "Big hall", "Shimmer pad", "Cathedral", "Spring", "Cloud", "Bloom", "Swell", "Ambient"] },
    { id: "mod", name: "Modulation", look: 4, presets: ["Slow chorus", "Vibe", "Rotary", "Tremolo", "Harmonic trem", "Phaser", "Flanger", "Detune", "Leslie", "Subtle shimmer"] },
    { id: "pitch", name: "Pitch", look: 14, presets: ["Octave up", "Octave down", "Harmony 3rd", "Harmony 5th", "Pad synth", "Swell synth", "Detune wide", "Whammy up", "Sub octave", "Freeze pad"] },
    { id: "comp", name: "Compressor", look: 9, presets: ["Light squash", "Country snap", "Sustain", "Parallel", "Soft knee", "Always on", "Clean glue", "Funk", "Limiter", "Bloom"] },
    { id: "looper", name: "Looper", look: 16, presets: ["Record", "Overdub", "Half speed", "Reverse", "Play once", "Fade out", "Stop", "Undo", "Loop A", "Loop B"] },
  ];
  const START_RIG = ["drive", "delay", "reverb", "mod", "pitch"];

  // A normal Sunday: 4 songs, 18 parts.
  const SETLIST = [
    { title: "Holy Forever", parts: ["Intro", "Verse", "Chorus", "Bridge", "Outro"] },
    { title: "Goodness of God", parts: ["Verse", "Chorus", "Bridge", "Tag"] },
    { title: "Great Are You Lord", parts: ["Intro", "Verse", "Chorus", "Bridge"] },
    { title: "Way Maker", parts: ["Verse", "Chorus", "Bridge", "Tag", "Outro"] },
  ];
  const PARTS = SETLIST.flatMap((song, s) => song.parts.map((part, p) => ({ song: s, part: p, title: song.title, name: part })));

  let rig = [...START_RIG];
  let picks = []; // per part: { pedalId: presetIndex }
  let current = 0;
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
      else if (k === "html") node.innerHTML = v;
      else if (k.startsWith("on")) node.addEventListener(k.slice(2), v);
      else node.setAttribute(k, v === true ? "" : v);
    }
    for (const c of children.flat()) if (c !== null && c !== undefined && c !== false) node.append(c);
    return node;
  };
  const pedal = (id) => PEDALS.find((p) => p.id === id);
  const icon = (p, happy = false) => {
    const looks = window.midiatorPedals || [];
    const draw = window.midiatorPixelPedal;
    return el("span", { class: "sim-icon", "aria-hidden": "true", html: draw && looks[p.look] ? draw(looks[p.look], happy) : "" });
  };
  const clock = (ms) => {
    const s = Math.max(0, Math.floor(ms / 1000));
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  };
  const spoken = (ms) => {
    const s = Math.round(ms / 1000);
    const m = Math.floor(s / 60);
    return m ? `${m} min ${s % 60} s` : `${s} s`;
  };
  const doneCount = () => picks.filter((p) => p && Object.keys(p).length).length;

  // ---------- 1. Your rig ----------
  function renderIntro() {
    state = "intro";
    const available = PEDALS.filter((p) => !rig.includes(p.id));
    root.replaceChildren(
      el("div", { class: "sim-screen sim-intro" },
        el("p", { class: "sim-kicker", text: "Player 1: your pedalboard" }),
        el("p", { class: "sim-lead", text: "Each pedal already has 10 sounds saved on it, like yours do. Add or remove pedals to match your board." }),
        el("ul", { class: "sim-rig" },
          rig.map((id) => {
            const p = pedal(id);
            return el("li", { class: "sim-rig__pedal" },
              icon(p),
              el("span", { class: "sim-rig__name", text: p.name }),
              el("span", { class: "sim-rig__count", text: "10 presets" }),
              rig.length > 1 ? el("button", { type: "button", class: "sim-x", "aria-label": `Remove ${p.name}`, text: "×", onclick: () => { rig = rig.filter((r) => r !== id); renderIntro(); } }) : null);
          }),
          available.length
            ? el("li", { class: "sim-rig__add" },
                el("label", {},
                  el("span", { class: "sr-only", text: "Add a pedal" }),
                  el("select", { onchange: (e) => { if (e.target.value) { rig.push(e.target.value); renderIntro(); } } },
                    el("option", { value: "", text: "+ Add a pedal" }),
                    available.map((p) => el("option", { value: p.id, text: p.name })))))
            : null),
        el("p", { class: "sim-lead", text: `This week: ${SETLIST.length} songs, ${PARTS.length} parts. For each part, pick which saved sound each pedal plays. The clock starts when you press Start.` }),
        el("div", { class: "sim-start" },
          el("button", { type: "button", class: "px-btn", onclick: start }, "Start"),
          el("p", { class: "sim-blink", text: "Beat 10:00" }))));
  }

  // ---------- 2. Build the setlist ----------
  function start() {
    picks = PARTS.map(() => ({}));
    current = 0;
    startedAt = performance.now();
    clearInterval(timer);
    timer = setInterval(tick, 250);
    renderPlay();
    root.querySelector(".sim-chip")?.focus({ preventScroll: true });
  }

  function tick() {
    const ms = performance.now() - startedAt;
    const t = root.querySelector(".sim-time");
    const bar = root.querySelector(".sim-bar__fill");
    if (t) t.textContent = clock(ms);
    if (bar) {
      bar.style.width = `${Math.min(100, (ms / TEN_MINUTES) * 100)}%`;
      bar.classList.toggle("over", ms > TEN_MINUTES);
    }
  }

  function go(i) {
    current = Math.max(0, Math.min(PARTS.length - 1, i));
    renderPlay();
  }

  function next() {
    if (!Object.keys(picks[current]).length) return;
    const todo = PARTS.findIndex((_, i) => i > current && !Object.keys(picks[i]).length);
    const anyLeft = PARTS.findIndex((_, i) => !Object.keys(picks[i]).length);
    if (todo !== -1) go(todo);
    else if (anyLeft !== -1) go(anyLeft);
    else finish();
  }

  function renderPlay() {
    state = "play";
    const part = PARTS[current];
    const chosen = picks[current];
    const lastOne = !PARTS.some((_, i) => i !== current && !Object.keys(picks[i]).length);
    root.replaceChildren(
      el("div", { class: "sim-screen sim-play" },
        el("div", { class: "sim-hud" },
          el("span", { class: "sim-time", text: clock(performance.now() - startedAt), "aria-label": "Time" }),
          el("div", { class: "sim-bar", "aria-hidden": "true" }, el("span", { class: "sim-bar__fill" }), el("span", { class: "sim-bar__mark", text: "10:00" })),
          el("span", { class: "sim-count", text: `${doneCount()}/${PARTS.length}` })),
        el("div", { class: "sim-body" },
          el("ol", { class: "sim-songs", "aria-label": "Setlist" },
            SETLIST.map((song, s) =>
              el("li", {},
                el("span", { class: "sim-songs__title", text: song.title }),
                el("span", { class: "sim-songs__parts" },
                  PARTS.map((pt, i) => pt.song === s
                    ? el("button", {
                        type: "button",
                        class: `sim-dot${i === current ? " is-current" : ""}${Object.keys(picks[i]).length ? " is-done" : ""}`,
                        title: `${pt.title}: ${pt.name}`,
                        "aria-label": `${pt.title}, ${pt.name}${Object.keys(picks[i]).length ? " (done)" : ""}`,
                        onclick: () => go(i),
                        text: pt.name[0],
                      })
                    : null))))),
          el("div", { class: "sim-part" },
            el("p", { class: "sim-part__song", text: part.title }),
            el("p", { class: "sim-part__name", text: part.name }),
            el("p", { class: "sim-hint", text: "Pick a sound on any pedals you want on. Leave the rest off." }),
            el("div", { class: "sim-pedals" },
              rig.map((id) => {
                const p = pedal(id);
                return el("div", { class: "sim-pedal" },
                  el("p", { class: "sim-pedal__name" }, icon(p, chosen[id] !== undefined), p.name),
                  el("div", { class: "sim-chips", role: "group", "aria-label": p.name },
                    p.presets.map((name, k) =>
                      el("button", {
                        type: "button",
                        class: `sim-chip${chosen[id] === k ? " is-on" : ""}`,
                        "aria-pressed": String(chosen[id] === k),
                        text: name,
                        onclick: () => {
                          if (chosen[id] === k) delete chosen[id];
                          else chosen[id] = k;
                          renderPlay();
                          root.querySelector(`.sim-pedal:nth-child(${rig.indexOf(id) + 1}) .sim-chip:nth-child(${k + 1})`)?.focus({ preventScroll: true });
                        },
                      }))));
              })),
            el("div", { class: "sim-nav" },
              el("button", { type: "button", class: "sim-back", disabled: current === 0, onclick: () => go(current - 1), text: "← Back" }),
              el("button", {
                type: "button",
                class: "px-btn px-btn--small",
                disabled: !Object.keys(chosen).length,
                onclick: next,
                text: lastOne ? "Finish" : "Next part →",
              }))))));
    tick();
  }

  // ---------- 3. Done ----------
  function finish() {
    clearInterval(timer);
    finishedIn = performance.now() - startedAt;
    state = "done";
    const under = TEN_MINUTES - finishedIn;
    const share = `I built ${PARTS.length} song-specific pedal presets for Sunday in ${clock(finishedIn)} with Midiator. Beat my time: ${SITE}#try`;
    const shareBtn = el("button", {
      type: "button",
      class: "sim-share",
      text: "Share my time",
      onclick: async () => {
        try {
          if (navigator.share) await navigator.share({ text: share });
          else {
            await navigator.clipboard.writeText(share);
            shareBtn.textContent = "Copied!";
          }
        } catch {
          /* closed the share sheet */
        }
      },
    });
    root.replaceChildren(
      el("div", { class: "sim-screen sim-done" },
        el("p", { class: "sim-kicker", text: "Setlist ready!" }),
        el("p", { class: "sim-final", text: clock(finishedIn) }),
        el("p", { class: "sim-lead sim-result", text: under > 0
          ? `${PARTS.length} song-specific presets on ${rig.length} pedals, ${spoken(under)} under ten minutes. No more small, medium and large every week.`
          : `${PARTS.length} song-specific presets on ${rig.length} pedals. A bit over ten minutes this time, and next week is quicker: your songs are already saved.` }),
        el("ul", { class: "sim-recap" },
          SETLIST.map((song, s) =>
            el("li", {},
              el("strong", { text: song.title }),
              el("span", { text: PARTS.map((pt, i) => pt.song === s ? `${pt.name}: ${Object.entries(picks[i]).map(([id, k]) => pedal(id).presets[k]).join(" + ")}` : null).filter(Boolean).join(" · ") })))),
        el("p", { class: "sim-small", text: "In Midiator you add your own saved presets once. After that, each week is just this, and Send puts every song on its own bank of your controller." }),
        el("div", { class: "sim-actions" },
          el("a", { class: "pill pill--cta", href: "#download", text: "Download for Mac" }),
          shareBtn,
          el("button", { type: "button", class: "sim-back", text: "Play again", onclick: renderIntro }))));
  }

  // Enter moves on to the next part while playing.
  root.addEventListener("keydown", (e) => {
    if (state === "play" && e.key === "Enter" && !e.target.closest("button")) next();
  });

  renderIntro();
})();
