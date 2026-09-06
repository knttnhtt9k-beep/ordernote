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
        <span class="sec-kicker">YOUR TYPE</span>
        <h3>${t.introTitle}</h3>
        <p class="type-intro-scene">${t.introScene}</p>
        <p class="type-intro-freq">${t.introFreq}</p>
        <p class="type-intro-use">${t.introUse}</p>
      </div>
      <div class="tag-row" style="margin-top:14px;">
        <span class="tag">${t.label}</span>
        <span class="tag purple">${t.sub}</span>
      </div>
      <span class="sec-kicker">RESET</span>
      <h2>${page.title}</h2>
      <p class="rich">不安が来た夜に、ノートの周波数へ戻るための短い手順です。完璧な文章は不要です。5分で閉じてください。</p>
    `;

    $("#nightBox").innerHTML = `
      <span class="sec-kicker">TONIGHT</span>
      <h2>${page.nightTitle}</h2>
      ${page.nights
        .map(
          (n) => `
        <div class="scene-card">
          <p>${n}</p>
        </div>`
        )
        .join("")}
    `;

    $("#whyBox").innerHTML = `
      <span class="sec-kicker">FREQUENCY</span>
      <h2>${page.whyTitle}</h2>
      <p class="rich">${page.why}</p>
    `;

    $("#stepsBox").innerHTML = `
      <span class="sec-kicker">5 MINUTES</span>
      <h2>${page.stepsTitle}</h2>
      <div class="step-list" role="list">
        ${page.steps
          .map(
            (s, i) => `
          <div class="step-item" role="listitem">
            <span class="step-num">${i + 1}</span>
            <p>${s}</p>
          </div>`
          )
          .join("")}
      </div>
    `;

    $("#linesBox").innerHTML = `
      <span class="sec-kicker">ONE LINE</span>
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
      <span class="sec-kicker">AFTER</span>
      <h2>${page.afterTitle}</h2>
      <div class="guide-card">
        <p>${page.after}</p>
      </div>
      <div class="highlight" style="margin-top:12px;">
        <p>${page.hope}</p>
      </div>
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
