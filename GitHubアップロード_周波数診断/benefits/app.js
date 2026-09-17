(function () {
  function go(url) {
    if (!url) return;
    window.location.href = url;
  }

  function bind() {
    document.querySelectorAll(".open-btn[data-url]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        go(btn.getAttribute("data-url"));
      });
    });

    document.querySelectorAll(".benefit-card[data-url]").forEach((card) => {
      card.addEventListener("click", (e) => {
        if (e.target.closest(".open-btn")) return;
        go(card.getAttribute("data-url"));
      });
      card.style.cursor = "pointer";
    });
  }

  document.addEventListener("DOMContentLoaded", bind);
})();
