(function () {
  const parts = {
    knowhow: document.getElementById("part-knowhow"),
    practice: document.getElementById("part-practice")
  };
  const sticky = document.getElementById("partSticky");

  function partKeyFromEl(el) {
    if (!el) return null;
    const wrap = el.closest(".part");
    if (!wrap) return null;
    return wrap.id === "part-practice" ? "practice" : "knowhow";
  }

  function openPart(key, jumpId) {
    Object.entries(parts).forEach(([id, el]) => {
      if (!el) return;
      el.classList.toggle("is-open", id === key);
    });
    document.querySelectorAll("[data-open-part]").forEach((btn) => {
      btn.classList.toggle("is-active", btn.getAttribute("data-open-part") === key);
    });
    if (sticky) sticky.hidden = false;

    const target = jumpId ? document.getElementById(jumpId) : parts[key];
    requestAnimationFrame(() => {
      (target || parts[key]).scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  document.querySelectorAll("[data-open-part]").forEach((btn) => {
    btn.addEventListener("click", () => {
      openPart(btn.getAttribute("data-open-part"), btn.getAttribute("data-jump") || "");
    });
  });

  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const id = (a.getAttribute("href") || "").slice(1);
      const el = document.getElementById(id);
      if (!el) return;
      const key = partKeyFromEl(el);
      if (!key) return;
      e.preventDefault();
      openPart(key, id);
    });
  });
})();
