(function () {
  const state = { typeId: null };
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  function show(id) {
    $$(".screen").forEach((el) => {
      el.classList.remove("active");
      el.style.display = "none";
      el.style.opacity = "";
    });
    const target = document.getElementById(id);
    if (target) {
      target.classList.add("active");
      target.style.display = "block";
      target.style.opacity = "1";
    }
    window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
  }

  function typeById(id) {
    return window.RESET_DATA.types.find((t) => t.id === id);
  }

  function visual(src) {
    return `<figure class="sec-visual"><img src="${src}" alt="" width="1024" height="576" loading="lazy"></figure>`;
  }

  function renderTypeCards() {
    const html = window.RESET_DATA.types
      .map(
        (t) => `
      <button class="pick-btn type-btn" type="button" data-type="${t.id}">
        <span class="pick-thumb"><img src="${t.image}" alt=""></span>
        <span class="pick-body">
          <span class="kicker">タップして選ぶ</span>
          <span class="title">${t.label}</span>
          <span class="sub">${t.sub || ""}</span>
          <span class="desc">${t.short}</span>
        </span>
        <span class="pick-arrow" aria-hidden="true">›</span>
      </button>`
      )
      .join("");

    ["#typeCards"].forEach((sel) => {
      const box = $(sel);
      if (!box) return;
      box.innerHTML = html;
      box.querySelectorAll("[data-type]").forEach((btn) => {
        btn.addEventListener("click", () => {
          state.typeId = btn.getAttribute("data-type");
          renderDetail();
          show("screen-detail");
        });
      });
    });
  }

  function renderDetail() {
    const t = typeById(state.typeId);
    const page = window.RESET_DATA.pages[state.typeId];
    $("#detailCrumb").textContent = t.label;

    $("#detailHead").innerHTML = `
      <div class="type-intro">
        <h3>${t.introTitle}</h3>
        ${(t.introParas || []).map((p) => `<p class="type-intro-p">${p}</p>`).join("")}
        <p class="type-intro-use">${t.introUse}</p>
      </div>
      <div class="tag-row" style="margin-top:14px;">
        <span class="tag">${t.label}</span>
        <span class="tag purple">${t.sub}</span>
      </div>
      <h2 class="heading-break">${page.titleLabel}<span class="heading-line2">${page.titleAction}</span></h2>
      <p class="rich">ザワザワしたときに、ノートを開いて1行書いて、スマホを伏せるまでのやり方です。</p>
      ${visual("images/visual-01.png")}
    `;

    $("#nightBox").innerHTML = `
      <h2>${page.nightTitle}</h2>
      ${page.nights
        .map(
          (n) => `
        <div class="scene-card">
          <span class="label">${n.label}</span>
          <p>${n.text}</p>
        </div>`
        )
        .join("")}
      ${visual("images/visual-02.png")}
    `;

    $("#whyBox").innerHTML = `
      <h2>${page.whyTitle}</h2>
      <p class="rich">${page.why}</p>
    `;

    $("#stepsBox").innerHTML = `
      <h2>${page.stepsTitle}</h2>
      <div class="step-list">
        ${page.steps
          .map(
            (s, i) => `
          <div class="step-item">
            <span class="step-num">${i + 1}</span>
            <p>${s}</p>
          </div>`
          )
          .join("")}
      </div>
      ${visual("images/visual-03.png")}
    `;

    $("#linesBox").innerHTML = `
      <h2>${page.linesTitle}</h2>
      <div class="phrase-list">
        ${page.lines
          .map(
            (text, i) => `
          <div class="phrase good">
            <div class="num">${i + 1}</div>
            <div><p class="txt">${text}</p></div>
          </div>`
          )
          .join("")}
      </div>
    `;

    $("#afterBox").innerHTML = `
      <h2>${page.afterTitle}</h2>
      <div class="guide-card">
        <p>${page.after}</p>
      </div>
      <div class="highlight" style="margin-top:12px;">
        <p>${page.hope}</p>
      </div>
      ${visual("images/visual-04.png")}
    `;
  }

  function bind() {
    $("#startBtn").addEventListener("click", () => {
      const cards = $("#typeCards");
      if (cards) cards.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    $("#backToType").addEventListener("click", () => show("screen-intro"));
    $("#restartBtn").addEventListener("click", () => {
      state.typeId = null;
      show("screen-intro");
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    renderTypeCards();
    bind();
    show("screen-intro");
  });
})();
