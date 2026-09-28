// Midiator website: menu, reveal-on-scroll, forms, download link, video. Plain JS, no libraries.

// ---------- Menu ----------
const nav = document.querySelector(".nav");
const toggle = document.querySelector(".nav__toggle");
const links = document.getElementById("nav-links");
toggle.addEventListener("click", () => {
  const open = toggle.getAttribute("aria-expanded") !== "true";
  toggle.setAttribute("aria-expanded", String(open));
  links.classList.toggle("open", open);
});
links.addEventListener("click", (e) => {
  if (e.target.closest("a")) {
    toggle.setAttribute("aria-expanded", "false");
    links.classList.remove("open");
  }
});
const onScroll = () => nav.classList.toggle("is-scrolled", window.scrollY > 8);
window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

// ---------- Reveal on scroll ----------
if ("IntersectionObserver" in window) {
  const io = new IntersectionObserver(
    (entries) => entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add("in");
        io.unobserve(e.target);
      }
    }),
    { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
  );
  document.querySelectorAll(".reveal").forEach((el) => io.observe(el));
} else {
  document.documentElement.classList.add("no-io");
}

document.getElementById("year").textContent = new Date().getFullYear();

// ---------- Video ----------
const videoDialog = document.getElementById("video");
const video = videoDialog.querySelector("video");
document.querySelectorAll("[data-video]").forEach((b) =>
  b.addEventListener("click", () => {
    videoDialog.showModal();
    video.play().catch(() => {});
  })
);
videoDialog.querySelector(".video__close").addEventListener("click", () => videoDialog.close());
videoDialog.addEventListener("click", (e) => { if (e.target === videoDialog) videoDialog.close(); });
videoDialog.addEventListener("close", () => video.pause());

// ---------- Forms ----------
// Both forms send through FormSubmit, which emails each one on to the address in the form's action.
const formTypes = {
  gear: {
    subject: (d) => `Midiator gear request: ${d.pedal}`,
    title: "Got it, thanks!",
    message: (d) => (d.email ? `${d.pedal} is on our list. We'll email you when it's in.` : `${d.pedal} is on our list. Check back soon.`),
    again: "Request another one",
  },
  access: {
    subject: (d) => `Midiator sign-up: ${d.email}`,
    title: "You're on the list!",
    message: (d) => `We'll email ${d.email} when there's something new.`,
  },
};

function wireForm(form) {
  const type = formTypes[form.dataset.form];
  const note = form.querySelector(".request__note");
  const fields = [...form.children];
  const fallback = (message) => {
    note.className = "request__note error";
    note.textContent = message;
  };
  const showThanks = (data) => {
    const done = document.createElement("div");
    done.className = "request__done";
    done.setAttribute("role", "status");
    done.innerHTML =
      '<svg viewBox="0 0 44 44" fill="none" stroke-width="2" aria-hidden="true"><circle cx="22" cy="22" r="20"/><path d="M13 22.5l6 6 12-13" stroke-linecap="round" stroke-linejoin="round"/></svg><div><strong></strong><p></p></div>';
    done.querySelector("strong").textContent = type.title;
    done.querySelector("p").textContent = type.message(data);
    if (type.again) {
      const again = document.createElement("button");
      again.type = "button";
      again.textContent = type.again;
      again.addEventListener("click", () => {
        form.reset();
        note.textContent = "";
        form.replaceChildren(...fields);
        form.querySelector("input:not([type=hidden]):not(.honey)").focus();
      });
      done.querySelector("div").append(again);
    }
    form.replaceChildren(done);
  };

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if ([...form.querySelectorAll("[required]")].some((input) => !input.value.trim())) return;
    const data = Object.fromEntries([...new FormData(form)].map(([k, v]) => [k, typeof v === "string" ? v.trim() : v]));
    data._subject = type.subject(data);
    // FormSubmit rejects pages opened straight from disk (file://), so say so instead of failing.
    if (location.protocol === "file:") return fallback("This form only sends once the site is online.");
    const button = form.querySelector("button[type=submit]");
    button.disabled = true;
    note.className = "request__note";
    note.textContent = "Sending…";
    try {
      const res = await fetch(form.action.replace("formsubmit.co/", "formsubmit.co/ajax/"), {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok && String(json.success) === "true") showThanks(data);
      else if (/activat/i.test(json.message || "")) {
        // First submission from a new web address: FormSubmit emails the site owner an activation link.
        note.textContent = "Almost there: this form is waiting to be activated. Please try again later.";
      } else {
        console.warn("FormSubmit:", res.status, json.message);
        fallback("That didn't go through. Try again in a moment.");
      }
    } catch (err) {
      console.warn("FormSubmit:", err);
      fallback("That didn't go through. Check your connection and try again.");
    } finally {
      button.disabled = false;
    }
  });
}
document.querySelectorAll("form[data-form]").forEach(wireForm);

// ---------- Download ----------
// Point the download buttons at the newest release's .dmg; without it (offline, rate-limited)
// they keep linking to the latest release page, which has the same file.
fetch("https://api.github.com/repos/samuelwan04-rgb/midiator/releases/latest", { headers: { Accept: "application/vnd.github+json" } })
  .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
  .then((release) => {
    const dmg = release.assets.find((a) => a.name.endsWith(".dmg"));
    if (!dmg) return;
    document.querySelectorAll("[data-download]").forEach((a) => (a.href = dmg.browser_download_url));
    const version = release.tag_name.replace(/^v/, "");
    document.querySelector(".download__meta").textContent = `Version ${version} · ${Math.round(dmg.size / 1e6)} MB · Apple chip and Intel`;
  })
  .catch(() => {});
