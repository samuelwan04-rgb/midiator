document.documentElement.classList.remove("no-js");

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Mobile menu
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

// Fade sections in as they scroll into view
const revealed = document.querySelectorAll(".reveal");
if (reduceMotion || !("IntersectionObserver" in window)) {
  revealed.forEach((el) => el.classList.add("is-in"));
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
    { rootMargin: "0px 0px -10% 0px" }
  );
  revealed.forEach((el) => io.observe(el));
}

// Hero controller: step through the song's sections like a player would
const switches = [...document.querySelectorAll(".mc6 .sw:not(.sw--tempo)")].sort(
  (a, b) => a.dataset.i - b.dataset.i
);
const tap = document.querySelector(".mc6 .sw--tempo");
let current = 1;
switches[current].classList.add("is-on");

if (!reduceMotion) {
  setInterval(() => {
    switches[current].classList.remove("is-on");
    current = (current + 1) % switches.length;
    switches[current].classList.add("is-on");
  }, 1600);

  // 72 BPM blink on the tap switch
  setInterval(() => {
    tap.classList.add("is-tap");
    setTimeout(() => tap.classList.remove("is-tap"), 120);
  }, 60000 / 72);
}

document.getElementById("year").textContent = new Date().getFullYear();
