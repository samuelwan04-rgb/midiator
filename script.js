document.documentElement.classList.remove("no-js");

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = window.matchMedia("(pointer: fine)").matches;

// ---------- Mobile menu ----------
const toggle = document.querySelector(".nav__toggle");
const links = document.getElementById("nav-links");
toggle.addEventListener("click", () => {
  const open = toggle.getAttribute("aria-expanded") === "true";
  toggle.setAttribute("aria-expanded", String(!open));
  links.classList.toggle("open", !open);
});
links.addEventListener("click", (e) => {
  if (e.target.closest("a")) {
    toggle.setAttribute("aria-expanded", "false");
    links.classList.remove("open");
  }
});

document.getElementById("year").textContent = new Date().getFullYear();

// ---------- Split text ----------
// Wraps each word in a mask (.w) holding one or more pieces (.c) that animate.
// Gradient words get the gradient on each piece, offset so it still reads as one sweep.
function splitText(el, byChar) {
  const label = el.textContent.replace(/\s+/g, " ").trim();
  let i = 0;
  const gradHosts = [];

  const walk = (node, inGrad) => {
    [...node.childNodes].forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE) {
        const frag = document.createDocumentFragment();
        child.textContent.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) {
            frag.append(" ");
            return;
          }
          const word = document.createElement("span");
          word.className = "w";
          (byChar ? [...part] : [part]).forEach((piece) => {
            const c = document.createElement("span");
            c.className = inGrad ? "c grad" : "c";
            c.textContent = piece;
            c.style.setProperty("--i", i++);
            word.append(c);
          });
          frag.append(word);
        });
        child.replaceWith(frag);
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        const grad = child.classList.contains("grad");
        if (grad) {
          child.classList.replace("grad", "grad-host");
          gradHosts.push(child);
        }
        walk(child, inGrad || grad);
      }
    });
  };

  walk(el, false);
  el.setAttribute("aria-label", label);
  [...el.children].forEach((child) => child.setAttribute("aria-hidden", "true"));
  el.classList.add("split");
  if (byChar) el.classList.add("split--chars");
  return gradHosts;
}

const gradHosts = [];
function alignGradients() {
  gradHosts.forEach((host) => {
    const width = host.offsetWidth;
    host.querySelectorAll(".c").forEach((c) => {
      c.style.backgroundSize = `${width}px 100%`;
      c.style.backgroundPosition = `${-c.offsetLeft}px 0`;
    });
  });
}

const splitEls = document.querySelectorAll("[data-split]");
const scrubEls = document.querySelectorAll("[data-scrub]");

if (!reduceMotion) {
  splitEls.forEach((el) => gradHosts.push(...splitText(el, el.dataset.split === "chars")));
  scrubEls.forEach((el) => {
    gradHosts.push(...splitText(el, false));
    el.classList.remove("split");
    el.classList.add("scrub");
  });
  alignGradients();
  document.fonts?.ready.then(alignGradients);
  window.addEventListener("resize", alignGradients);
}

// ---------- Reveal on scroll ----------
const toReveal = [...document.querySelectorAll(".reveal"), ...document.querySelectorAll(".split")];

// stagger cards that share a grid
document.querySelectorAll(".gear__grid .reveal").forEach((el, i) => {
  el.style.setProperty("--d", `${(i % 3) * 0.12}s`);
});

if (reduceMotion || !("IntersectionObserver" in window)) {
  toReveal.forEach((el) => el.classList.add("is-in"));
} else {
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in");
          io.unobserve(entry.target);
        }
      });
    },
    { rootMargin: "0px 0px -12% 0px" }
  );
  toReveal.forEach((el) => {
    if (el.closest(".hero")) return;
    io.observe(el);
  });

  const heroTitle = document.querySelector(".hero .display");
  requestAnimationFrame(() => setTimeout(() => heroTitle.classList.add("is-in"), 80));
}

// ---------- Scroll-linked effects ----------
const hero = document.querySelector(".hero");
const root = document.documentElement;
let ticking = false;

function onScroll() {
  const y = window.scrollY;
  const vh = window.innerHeight;
  const max = root.scrollHeight - vh;
  root.style.setProperty("--scroll", max > 0 ? (y / max).toFixed(4) : 0);

  if (!reduceMotion) {
    const p = Math.min(1, y / hero.offsetHeight);
    hero.style.setProperty("--p", p.toFixed(4));

    scrubEls.forEach((el) => {
      const r = el.getBoundingClientRect();
      const progress = (vh * 0.9 - r.top) / (vh * 0.55);
      const pieces = el.querySelectorAll(".c");
      const lit = Math.round(Math.max(0, Math.min(1, progress)) * pieces.length);
      pieces.forEach((c, i) => c.classList.toggle("lit", i < lit));
    });
  }
  ticking = false;
}
window.addEventListener(
  "scroll",
  () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(onScroll);
    }
  },
  { passive: true }
);
onScroll();

// ---------- Pointer effects ----------
if (!reduceMotion && finePointer) {
  const mc6 = document.querySelector(".mc6");
  hero.addEventListener("pointermove", (e) => {
    const r = hero.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    mc6.style.setProperty("--ry", `${x * 14}deg`);
    mc6.style.setProperty("--rx", `${-y * 10}deg`);
  });
  hero.addEventListener("pointerleave", () => {
    mc6.style.setProperty("--ry", "0deg");
    mc6.style.setProperty("--rx", "0deg");
  });

  document.querySelectorAll(".gcard").forEach((card) => {
    card.addEventListener("pointermove", (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty("--mx", `${e.clientX - r.left}px`);
      card.style.setProperty("--my", `${e.clientY - r.top}px`);
    });
  });
}

// ---------- Hero controller ----------
const sections = [
  "BigSky 04A · TimeLine off",
  "TimeLine 12B · BigSky 04A",
  "TimeLine 12B · BigSky 71C",
  "BigSky 71C · LVX PC 17",
  "BigSky 04A · delays off",
];
const switches = [...document.querySelectorAll(".mc6 .sw[data-i]")].sort(
  (a, b) => a.dataset.i - b.dataset.i
);
const tap = document.querySelector(".mc6 .sw--tempo");
const msgText = document.querySelector(".mc6__msgtext");
const msgLed = document.querySelector(".mc6__led");
let current = 1;
switches[current].classList.add("is-on");

function restart(el, cls) {
  el.classList.remove(cls);
  void el.offsetWidth;
  el.classList.add(cls);
}

if (!reduceMotion) {
  setInterval(() => {
    switches[current].classList.remove("is-on");
    current = (current + 1) % switches.length;
    const sw = switches[current];
    sw.classList.add("is-on", "press");
    setTimeout(() => sw.classList.remove("press"), 160);
    msgText.textContent = sections[current];
    restart(msgText, "flash");
    restart(msgLed, "blink");
  }, 1800);

  setInterval(() => {
    tap.classList.add("is-tap");
    setTimeout(() => tap.classList.remove("is-tap"), 120);
  }, 60000 / 72);
}

// ---------- Feature scenes ----------
// Each scene loops while its drawing is on screen and pauses when it isn't.
function scene(el, setup, loop) {
  if (reduceMotion || !el) return;
  el.classList.add("anim");
  setup?.();
  let visible = false;
  let resume = null;
  new IntersectionObserver(
    ([entry]) => {
      visible = entry.isIntersecting;
      if (visible && resume) {
        resume();
        resume = null;
      }
    },
    { threshold: 0.3 }
  ).observe(el);
  const wait = async (ms) => {
    await new Promise((r) => setTimeout(r, ms));
    if (!visible) await new Promise((r) => (resume = r));
  };
  (async () => {
    await wait(0);
    await wait(900);
    for (;;) await loop(wait);
  })();
}

async function typeInto(el, text, wait, speed = 28) {
  for (let i = 1; i <= text.length; i++) {
    el.textContent = text.slice(0, i);
    await wait(speed);
  }
}

function flip(container, mutate) {
  const kids = [...container.children];
  const before = new Map(kids.map((k) => [k, k.getBoundingClientRect().top]));
  mutate();
  kids.forEach((k) => {
    const dy = before.get(k) - k.getBoundingClientRect().top;
    if (dy) {
      k.animate([{ transform: `translateY(${dy}px)` }, { transform: "none" }], {
        duration: 700,
        easing: "cubic-bezier(.2,.8,.2,1)",
      });
    }
  });
}

function setStatus(el, cls, text) {
  el.className = `status ${cls}`;
  el.textContent = text;
}

// Setlists: play through a song's sections, reorder two songs, resync.
const setlistEl = document.querySelector('[data-scene="setlist"]');
scene(setlistEl, null, async (wait) => {
  const cells = [...setlistEl.querySelectorAll(".minigrid [data-o]")].sort(
    (a, b) => a.dataset.o - b.dataset.o
  );
  for (const cell of cells) {
    cells.forEach((c) => c.classList.toggle("on", c === cell));
    await wait(750);
  }
  cells.forEach((c) => c.classList.toggle("on", c.dataset.o === "1"));

  const list = setlistEl.querySelector(".songs");
  const cards = [...list.children];
  const moving = cards[2];
  moving.classList.add("lift");
  flip(list, () => list.insertBefore(moving, cards[1]));
  [...list.children].forEach((card, i) => {
    card.querySelector(".bank").textContent = 23 + i;
  });
  await wait(700);
  moving.classList.remove("lift");

  const statuses = [...list.children].slice(1).map((c) => c.querySelector(".status"));
  statuses.forEach((s) => setStatus(s, "status--new", "Bank changed"));
  await wait(1300);
  statuses.forEach((s) => setStatus(s, "status--busy", "Sending"));
  await wait(1500);
  statuses.forEach((s) => setStatus(s, "status--ok", "Synced"));
  await wait(1800);
});

// Songs: a cursor adds two songs to the setlist, then the list resets.
const songsEl = document.querySelector('[data-scene="songs"]');
scene(songsEl, null, async (wait) => {
  const cursor = songsEl.querySelector(".cursor");
  const chips = [...songsEl.querySelectorAll("[data-bank]")];
  const box = songsEl.getBoundingClientRect();
  cursor.style.transform = `translate(${box.width * 0.35}px, ${box.height + 20}px)`;
  cursor.classList.add("show");
  await wait(300);

  for (const chip of chips) {
    const r = chip.getBoundingClientRect();
    const b = songsEl.getBoundingClientRect();
    cursor.style.transform = `translate(${r.left - b.left + r.width * 0.5}px, ${r.top - b.top + r.height * 0.4}px)`;
    await wait(950);
    restart(cursor, "click");
    chip.className = "chip c-lilac-bg";
    chip.textContent = `In setlist · bank ${chip.dataset.bank}`;
    restart(chip, "pop");
    await wait(1100);
  }
  cursor.style.transform = `translate(${box.width + 30}px, ${box.height * 0.5}px)`;
  await wait(2200);
  cursor.classList.remove("show");
  chips.forEach((chip) => {
    chip.className = "chip chip--ghost";
    chip.textContent = "+ Add to setlist";
  });
  await wait(900);
});

// My presets: rows slide in, then each preset shows the MIDI it becomes.
const presetsEl = document.querySelector('[data-scene="presets"]');
const presetRows = presetsEl ? [...presetsEl.querySelectorAll(".trow")] : [];
let presetsShown = false;
scene(presetsEl, null, async (wait) => {
  const out = presetsEl.querySelector(".midi-out__text");
  const dot = presetsEl.querySelector(".midi-out__dot");
  if (!presetsShown) {
    out.textContent = "";
    for (const row of presetRows) {
      row.classList.add("show");
      await wait(120);
    }
    presetsShown = true;
    await wait(500);
  }
  for (const row of presetRows) {
    presetRows.forEach((r) => r.classList.toggle("active", r === row));
    restart(dot, "blink");
    await typeInto(out, `${row.querySelector("strong").textContent} → ${row.dataset.msg}`, wait, 22);
    await wait(1300);
  }
  presetRows.forEach((r) => r.classList.remove("active"));
  await wait(600);
});

// Tone lab: type a request, wait for a reply, audition it.
const chatEl = document.querySelector('[data-scene="chat"]');
scene(
  chatEl,
  () => {
    chatEl.querySelector(".type").textContent = "";
  },
  async (wait) => {
    const typed = chatEl.querySelector(".type");
    const dots = chatEl.querySelector(".dots");
    const ai = chatEl.querySelector(".bubble--ai");
    const audition = chatEl.querySelector(".audition");

    chatEl.classList.remove("fade");
    typed.classList.add("caret");
    await typeInto(typed, "Dotted eighth for the chorus, three repeats, a bit darker.", wait);
    typed.classList.remove("caret");
    await wait(400);
    dots.classList.add("show");
    await wait(1300);
    dots.classList.remove("show");
    ai.classList.add("show");
    await wait(1400);
    audition.classList.add("playing");
    await wait(2800);
    audition.classList.remove("playing");
    await wait(1200);
    chatEl.classList.add("fade");
    await wait(500);
    ai.classList.remove("show");
    typed.textContent = "";
  }
);

// Safety: the review fills in row by row, then writes and verifies.
const reviewEl = document.querySelector('[data-scene="review"]');
scene(reviewEl, null, async (wait) => {
  const rows = [...reviewEl.querySelectorAll(".review__rows li")];
  const bar = reviewEl.querySelector(".review__bar");
  const status = reviewEl.querySelector(".review__status");
  const btn = reviewEl.querySelector(".review__btn");

  rows.forEach((r) => r.classList.remove("show"));
  bar.classList.remove("run");
  status.classList.remove("ok");
  status.textContent = "Reading banks 23–25…";
  await wait(700);
  for (const row of rows) {
    row.classList.add("show");
    await wait(380);
  }
  status.textContent = "Review, then write.";
  await wait(1000);
  btn.classList.add("press");
  await wait(160);
  btn.classList.remove("press");
  status.textContent = "Writing and reading back…";
  bar.classList.add("run");
  await wait(1900);
  status.textContent = "✓ Written and verified";
  status.classList.add("ok");
  await wait(3000);
});
