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

  function renderSituationCards() {
    $("#situationCrumb").textContent = `タイプ：${typeLabel(state.typeId)}`;
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
    const badSet = new Set(guide.badNums);

    $("#detailCrumb").textContent = `${typeLabel(state.typeId)} × ${sit.title}`;

    $("#detailHead").innerHTML = `
      <div class="tag-row">
        <span class="tag">${typeLabel(state.typeId)}</span>
        <span class="tag purple">${sit.title}</span>
      </div>
      <span class="sec-kicker">TONIGHT</span>
      <h2>今夜ノートに書く1行を決める</h2>
      <p class="rich">下の「タイプ別の番号の目印」を見てから、<strong>「書いていい」</strong>がついた番号の中から、近いものを1つだけノートに書いてください。<strong>「今はやめて」</strong>がついた番号は、今夜は選ばないでください。</p>
    `;

    $("#guideBox").innerHTML = `
      <div class="guide-card">
        <h3>いまの恋で、やりがちなこと（${typeLabel(state.typeId)}）</h3>
        <p>${guide.night}</p>
        <span class="guide-label">書いていい番号</span>
        <p>${guide.good}</p>
        <span class="guide-label bad">今はやめての番号</span>
        <p>${guide.bad}</p>
        <span class="guide-label mute">書いたあと、やらないこと</span>
        <p>${guide.dont}</p>
        <span class="guide-label mute">相談で決めること</span>
        <p>${guide.consult}</p>
      </div>
    `;

    $("#phraseBox").innerHTML = sit.phrases
      .map((text, i) => {
        const n = i + 1;
        let cls = "phrase";
        let mark = "";
        if (goodSet.has(n)) {
          cls += " good";
          mark = `<span class="mark mark-good">書いていい · ${n}番</span>`;
        } else if (badSet.has(n)) {
          cls += " bad";
          mark = `<span class="mark mark-bad">今はやめて · ${n}番</span>`;
        }
        return `
          <div class="${cls}">
            <div class="num">${n}</div>
            <div>
              <p class="txt">${text}</p>
              ${mark}
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
