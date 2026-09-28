// "Try it": a playful, pick-your-own demo of what Midiator does. Build one song (name, BPM, your
// pedals, a sound per part), press SEND, then stomp the switches and watch the pedals change.
// No clock, no score. Plain JavaScript, everything drawn inside <div id="sim">.
(() => {
  const root = document.getElementById("sim");
  if (!root) return;

  // Example pedals with sounds people really save. Short names, so they fit a pedal's screen.
  const PEDALS = [
    { id: "drive", name: "Drive", color: "#e9b949", presets: ["Clean boost", "Edge of breakup", "Light crunch", "Mid gain", "Big lead", "Warm fuzz"] },
    { id: "delay", name: "Delay", color: "#4aa3df", presets: ["Dotted 8th", "Quarter note", "Slapback", "Ambient wash", "Tape echo", "Reverse swell"] },
    { id: "reverb", name: "Reverb", color: "#9b7fe6", presets: ["Small room", "Plate", "Big hall", "Shimmer pad", "Cathedral", "Cloud"] },
    { id: "mod", name: "Mod", color: "#5cc38a", presets: ["Slow chorus", "Vibe", "Rotary", "Tremolo", "Phaser", "Subtle detune"] },
    { id: "pitch", name: "Pitch", color: "#f07fa3", presets: ["Octave up", "Octave down", "Harmony 3rd", "Pad synth", "Freeze pad", "Sub octave"] },
  ];
  const PART_NAMES = ["Intro", "Verse", "Pre-chorus", "Chorus", "Bridge", "Instrumental", "Tag", "Outro"];
  const SONGS = ["Holy Forever", "Way Maker", "Build My Life", "Gratitude", "Firm Foundation"];
  const LETTERS = ["A", "B", "C", "D", "E"];
  const MAX_PARTS = 5; // switches A-E; F is Tap tempo

  // A song that already sounds good, so the first thing a visitor sees makes sense.
  const START = {
    title: "Holy Forever",
    bpm: 72,
    rig: ["drive", "delay", "reverb"],
    parts: [
      { name: "Intro", picks: { delay: 3, reverb: 3 } },
      { name: "Verse", picks: { drive: 0, delay: 1, reverb: 1 } },
      { name: "Chorus", picks: { drive: 2, delay: 0, reverb: 2 } },
      { name: "Bridge", picks: { drive: 4, delay: 0, reverb: 4 } },
    ],
  };

  let song = structuredClone(START);
  let sent = null; // snapshot of the song as last sent to the board
  let live = null; // index of the switch last stomped
  let stomped = false;
  let tapTimer = null;

  const el = (tag, props = {}, ...children) => {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(props)) {
      if (v === null || v === undefined || v === false) continue;
      if (k === "class") node.className = v;
      else if (k === "text") node.textContent = v;
      else if (k === "style") node.style.cssText = v;
      else if (k.startsWith("on")) node.addEventListener(k.slice(2), v);
      else node.setAttribute(k, v === true ? "" : v);
    }
    for (const c of children.flat()) if (c !== null && c !== undefined && c !== false) node.append(c);
    return node;
  };
  const pedal = (id) => PEDALS.find((p) => p.id === id);
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const dirty = () => JSON.stringify(sent) !== JSON.stringify(song);

  // ---------- The builder (left) ----------
  function changed() {
    renderBuilder();
    renderStageState();
  }

  function renderBuilder() {
    const b = root.querySelector(".demo__builder");
    b.replaceChildren(
      el("div", { class: "b-song" },
        el("label", { class: "b-label", for: "demo-title", text: "Song" }),
        el("div", { class: "b-song__row" },
          el("input", {
            id: "demo-title", class: "b-title", value: song.title, maxlength: "24", autocomplete: "off", spellcheck: "false",
            oninput: (e) => { song.title = e.target.value; renderStageState(); },
          }),
          el("div", { class: "b-bpm", role: "group", "aria-label": "Tempo" },
            el("button", { type: "button", "aria-label": "Slower", text: "−", onclick: () => { song.bpm = Math.max(40, song.bpm - 2); changed(); } }),
            el("span", { text: `${song.bpm}` }, el("small", { text: " BPM" })),
            el("button", { type: "button", "aria-label": "Faster", text: "+", onclick: () => { song.bpm = Math.min(200, song.bpm + 2); changed(); } }))),
        el("div", { class: "b-chips" },
          SONGS.filter((t) => t !== song.title).slice(0, 3).map((t) =>
            el("button", { type: "button", class: "chip", text: t, onclick: () => { song.title = t; changed(); } })))),

      el("div", { class: "b-board" },
        el("p", { class: "b-label", text: "Your pedals" }),
        el("div", { class: "b-chips" },
          PEDALS.map((p) => {
            const on = song.rig.includes(p.id);
            return el("button", {
              type: "button", class: `chip chip--pedal${on ? " on" : ""}`, "aria-pressed": String(on), style: `--c:${p.color}`,
              title: on && song.rig.length === 1 ? "Keep at least one pedal" : null,
              onclick: () => {
                if (on && song.rig.length === 1) return;
                song.rig = on ? song.rig.filter((r) => r !== p.id) : [...song.rig, p.id].slice(-3);
                changed();
              },
            }, el("i"), p.name);
          }))),

      el("div", { class: "b-parts" },
        el("p", { class: "b-label", text: "A sound for each part" }, el("span", { class: "b-hint", text: "tap a sound to change it" })),
        song.parts.map((part, i) =>
          el("div", { class: "part" },
            el("span", { class: "part__key", text: LETTERS[i] }),
            el("button", {
              type: "button", class: "part__name", text: part.name, title: "Rename",
              onclick: () => { part.name = PART_NAMES[(PART_NAMES.indexOf(part.name) + 1) % PART_NAMES.length]; changed(); },
            }),
            el("div", { class: "part__sounds" },
              song.rig.map((id) => {
                const p = pedal(id);
                const k = part.picks[id];
                return el("button", {
                  type: "button", class: `sound${k === undefined ? " sound--off" : ""}`, style: `--c:${p.color}`,
                  "aria-label": `${p.name}: ${k === undefined ? "no change" : p.presets[k]}. Change`,
                  onclick: () => {
                    // Cycle through the pedal's presets, then "no change", then round again.
                    const next = k === undefined ? 0 : k + 1;
                    if (next >= p.presets.length) delete part.picks[id];
                    else part.picks[id] = next;
                    changed();
                  },
                }, el("i"), el("span", { text: k === undefined ? "—" : p.presets[k] }));
              })),
            song.parts.length > 1
              ? el("button", { type: "button", class: "part__x", "aria-label": `Remove ${part.name}`, text: "×", onclick: () => { song.parts.splice(i, 1); changed(); } })
              : null)),
        el("div", { class: "b-row" },
          song.parts.length < MAX_PARTS
            ? el("button", {
                type: "button", class: "chip chip--ghost", text: "+ Add part",
                onclick: () => {
                  const used = song.parts.map((p) => p.name);
                  song.parts.push({ name: PART_NAMES.find((n) => !used.includes(n)) || "Tag", picks: {} });
                  changed();
                },
              })
            : null,
          el("button", { type: "button", class: "chip chip--ghost", text: "Shuffle sounds", onclick: shuffle }))),

      el("div", { class: "b-send" },
        el("button", { type: "button", class: "px-btn", onclick: send, text: sent && !dirty() ? "Sent!" : sent ? "Send again" : "Send" }),
        el("span", { class: "b-send__note", text: sent && !dirty() ? "Now stomp a switch on the board." : "Puts this song on the controller." })));
  }

  function shuffle() {
    for (const part of song.parts) {
      part.picks = {};
      for (const id of song.rig) if (Math.random() > 0.15) part.picks[id] = Math.floor(Math.random() * pedal(id).presets.length);
    }
    changed();
  }

  // ---------- The board (right) ----------
  function renderStage() {
    const s = root.querySelector(".demo__stage");
    s.replaceChildren(
      el("div", { class: "mc" },
        el("div", { class: "mc__screen" },
          el("span", { class: "mc__bank", text: "BANK 1" }),
          el("span", { class: "mc__title" }),
          el("span", { class: "mc__bpm" })),
        el("div", { class: "mc__grid" },
          // Top row D E F, bottom row A B C, like the hardware.
          [3, 4, 5, 0, 1, 2].map((slot) =>
            el("button", {
              type: "button", class: `mc__sw${slot === 5 ? " mc__sw--tap" : ""}`, "data-slot": String(slot),
              onclick: () => stomp(slot),
            }, el("span", { class: "mc__led" }), el("span", { class: "mc__name" }), el("span", { class: "mc__foot", "aria-hidden": "true" }))))),
      el("div", { class: "rig" }),
      el("p", { class: "stage__hint", "aria-live": "polite" }));
    renderStageState();
  }

  // What's on the board follows what was SENT, not what's being edited, like the real thing.
  function renderStageState() {
    const s = root.querySelector(".demo__stage");
    const shown = sent || { title: "", bpm: null, parts: [], rig: song.rig };
    s.classList.toggle("is-empty", !sent);
    s.querySelector(".mc__title").textContent = sent ? (shown.title || "Untitled").toUpperCase().slice(0, 16) : "READY";
    s.querySelector(".mc__bpm").textContent = sent ? `${shown.bpm} BPM` : "";
    s.querySelectorAll(".mc__sw").forEach((sw) => {
      const slot = Number(sw.dataset.slot);
      const name = slot === 5 ? (sent ? `TAP ${shown.bpm}` : "") : shown.parts[slot]?.name || "";
      sw.querySelector(".mc__name").textContent = name;
      sw.disabled = !sent || (slot !== 5 && !shown.parts[slot]);
      sw.classList.toggle("is-live", sent && live === slot);
    });
    const rig = s.querySelector(".rig");
    const part = sent && live !== null && live !== 5 ? shown.parts[live] : null;
    rig.replaceChildren(
      ...shown.rig.map((id) => {
        const p = pedal(id);
        const k = part ? part.picks[id] : undefined;
        const box = el("div", { class: `ped${k !== undefined ? " is-on" : ""}`, style: `--c:${p.color}` },
          el("span", { class: "ped__lcd", text: k !== undefined ? p.presets[k] : "—" }),
          el("span", { class: "ped__name", text: p.name }),
          el("span", { class: "ped__led" }));
        return box;
      }));
    const hint = s.querySelector(".stage__hint");
    hint.textContent = !sent
      ? "Press SEND to put your song on the board."
      : dirty()
        ? "You changed the song. Press SEND again to update the board."
        : live === null
          ? "Stomp a switch."
          : live === 5
            ? `Tap tempo: ${shown.bpm} BPM.`
            : `${shown.parts[live].name}: every pedal switched at once.`;
    s.classList.toggle("is-stale", !!sent && dirty());
  }

  function send() {
    sent = structuredClone(song);
    live = null;
    renderBuilder();
    renderStageState();
    const s = root.querySelector(".demo__stage");
    // Switches fill in one by one, like a bank being written.
    if (!reduceMotion) {
      s.querySelectorAll(".mc__sw").forEach((sw, i) => {
        sw.classList.remove("flash");
        void sw.offsetWidth;
        sw.style.animationDelay = `${i * 70}ms`;
        sw.classList.add("flash");
      });
    }
    clearInterval(tapTimer);
    const tap = s.querySelector(".mc__sw--tap");
    tapTimer = setInterval(() => {
      tap.classList.add("beat");
      setTimeout(() => tap.classList.remove("beat"), 90);
    }, 60000 / sent.bpm);
    if (window.matchMedia("(max-width: 860px)").matches) s.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
  }

  function stomp(slot) {
    if (!sent) return;
    live = slot;
    renderStageState();
    root.querySelectorAll(".ped.is-on").forEach((p) => {
      p.classList.remove("pop");
      void p.offsetWidth;
      p.classList.add("pop");
    });
    if (!stomped && slot !== 5) {
      stomped = true;
      root.querySelector(".demo__done").hidden = false;
    }
  }

  root.append(
    el("div", { class: "demo__grid" },
      el("div", { class: "demo__builder" }),
      el("div", { class: "demo__stage" })),
    el("div", { class: "demo__done", hidden: true },
      el("p", {}, el("strong", { text: "That's Midiator." }), " Now picture your whole setlist, every week, in minutes."),
      el("div", { class: "actions" },
        el("a", { class: "btn btn--primary", "data-download": "", href: "https://github.com/samuelwan04-rgb/midiator/releases/latest", text: "Download for Mac" }),
        el("button", {
          type: "button", class: "btn", text: "Start over",
          onclick: () => {
            song = structuredClone(START);
            sent = null;
            live = null;
            clearInterval(tapTimer);
            changed();
          },
        }))));
  renderBuilder();
  renderStage();
})();
