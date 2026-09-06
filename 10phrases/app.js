(function () {
  const state = {
    typeId: null,
    situationId: null
  };

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  function show(id) {
    $$(".screen").forEach((el) => el.classList.remove("active"));
    const target = document.getElementById(id);
    if (target) target.classList.add("active");
    window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
  }

  function typeLabel(id) {
    return (window.PHRASES_DATA.types.find((t) => t.id === id) || {}).label || "";
  }

  function situationById(id) {
    return window.PHRASES_DATA.situations.find((s) => s.id === id);
  }

  function renderTypeCards() {
    const box = $("#typeCards");
    box.innerHTML = window.PHRASES_DATA.types
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
    box.querySelectorAll("[data-type]").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.typeId = btn.getAttribute("data-type");
        renderSituationCards();
        show("screen-situation");
      });
    });
  }

  function typeById(id) {
    return window.PHRASES_DATA.types.find((t) => t.id === id);
  }

  function typeIntroHtml(t) {
    if (!t) return "";
    return `
      <div class="type-intro">
        <h3>${t.introTitle}</h3>
        <p class="type-intro-scene">${t.introScene}</p>
        <p class="type-intro-freq">${t.introFreq}</p>
        <p class="type-intro-use">${t.introUse}</p>
      </div>`;
  }

  function renderSituationCards() {
    const t = typeById(state.typeId);
    $("#situationCrumb").textContent = `タイプ：${typeLabel(state.typeId)}`;
    $("#typeIntroBox").innerHTML = typeIntroHtml(t);
    const box = $("#situationCards");
    box.innerHTML = window.PHRASES_DATA.situations
      .map(
        (s) => `
      <button class="pick-btn sit-btn" type="button" data-sit="${s.id}">
        <span class="sit-num">${s.emoji}</span>
        <span class="pick-body">
          <span class="kicker">タップして選ぶ</span>
          <span class="title">${s.title}</span>
          <span class="desc">${s.sub || "いまの恋の状況を選ぶ"}</span>
        </span>
        <span class="pick-arrow" aria-hidden="true">›</span>
      </button>`
      )
      .join("");
    box.querySelectorAll("[data-sit]").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.situationId = btn.getAttribute("data-sit");
        renderDetail();
        show("screen-detail");
      });
    });
  }

  function renderDetail() {
    const sit = situationById(state.situationId);
    const guide = sit.guide[state.typeId];
    const goodSet = new Set(guide.goodNums);
    const t = typeById(state.typeId);

    $("#detailCrumb").textContent = `${typeLabel(state.typeId)} × ${sit.title}`;

    $("#detailHead").innerHTML = `
      ${typeIntroHtml(t)}
      <div class="tag-row" style="margin-top:14px;">
        <span class="tag">${typeLabel(state.typeId)}</span>
        <span class="tag purple">${sit.title}</span>
      </div>
      <h2>今夜ノートに書く1行を決める</h2>
      <p class="rich">下のフレーズから、いまの自分に近いものを<strong>1つだけ</strong>ノートに書いてください。</p>
      <figure class="sec-visual">
        <img src="images/visual-01.png" alt="" width="1024" height="576" loading="lazy">
      </figure>
    `;

    $("#guideBox").innerHTML = `
      <div class="guide-card">
        <h3>いまの恋で、やりがちなこと（${typeLabel(state.typeId)}）</h3>
        <p>${guide.night}</p>
        <span class="guide-label">このタイプなら、先に見てほしい番号</span>
        <p>${guide.good}</p>
        <span class="guide-label mute">書いたあと、今夜の行動</span>
        <p>${guide.dont}</p>
      </div>
      <figure class="sec-visual">
        <img src="images/visual-02.png" alt="" width="1024" height="576" loading="lazy">
      </figure>
    `;

    $("#phraseBox").innerHTML = sit.phrases
      .map((text, i) => {
        const n = i + 1;
        let cls = "phrase";
        if (goodSet.has(n)) cls += " good";
        return `
          <div class="${cls}">
            <div class="num">${n}</div>
            <div>
              <p class="txt">${text}</p>
            </div>
          </div>`;
      })
      .join("");

    $("#ngBox").textContent = sit.ng;

    $("#memoType").value = typeLabel(state.typeId);
    $("#memoSit").value = sit.title;
  }

  function renderPriority() {
    $("#priorityList").innerHTML = window.PHRASES_DATA.priority
      .map(
        (p) => `
      <li>
        <div class="rank">${p.rank}</div>
        <div>
          <div class="name">${p.name}</div>
          <div class="reason">${p.reason}</div>
        </div>
      </li>`
      )
      .join("");
  }

  function bind() {
    $("#startBtn").addEventListener("click", () => show("screen-type"));
    $("#toPriorityFromIntro").addEventListener("click", () => {
      renderPriority();
      show("screen-priority");
    });
    $("#backToIntro").addEventListener("click", () => show("screen-intro"));
    $("#backToType").addEventListener("click", () => show("screen-type"));
    $("#backToSituation").addEventListener("click", () => show("screen-situation"));
    $("#toPriorityFromDetail").addEventListener("click", () => {
      renderPriority();
      show("screen-priority");
    });
    $("#backFromPriority").addEventListener("click", () => {
      if (state.situationId) show("screen-detail");
      else show("screen-intro");
    });
    $("#restartBtn").addEventListener("click", () => {
      state.typeId = null;
      state.situationId = null;
      show("screen-intro");
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    renderTypeCards();
    bind();
    show("screen-intro");
  });
})();
