import "./app-header.js";

(async () => {
  const root = document.getElementById("tr-bathroom"),
    main = root.querySelector("#bath-main");
  let data;
  try {
    const response = await fetch(
      new URL("../data/badkamer.json", import.meta.url),
    );
    if (!response.ok) throw new Error("De collectie kon niet worden geladen.");
    data = await response.json();
  } catch (error) {
    main.innerHTML =
      '<p role="alert">De collectie kon niet worden geladen. Controleer je verbinding en probeer opnieuw.</p><button id="retry">Opnieuw laden</button>';
    main
      .querySelector("#retry")
      .addEventListener("click", () => location.reload());
    root.querySelector("#bath-lesson").disabled = true;
    return;
  }
  const assets = new Map(data.assets.map((a) => [a.n, a])),
    seqs = new Map(data.sequences.map((s) => [s.id, s]));
  const modeNames = {
      nu: "Nu",
      volgorde: "Eerst–dan",
      instructie: "Je moet",
      verleden: "Ik heb",
    },
    modeLong = {
      nu: "Vertel wat je ziet",
      volgorde: "Vertel de volgorde",
      instructie: "Geef instructies",
      verleden: "Vertel achteraf",
    };
  const categories = [
    ["all", "Alles"],
    ["OBJ", "Voorwerpen · 18"],
    ["ACT", "Handelingen · 11"],
    ["REL", "Plaats · 7"],
    ["OVZ", "Overzicht · 2"],
    ["SEQ", "Reeksen · 3"],
  ];
  const typeNames = {
    OBJ: "Voorwerp",
    ACT: "Handeling",
    REL: "Plaats & relaties",
    OVZ: "Overzicht",
    REE: "Reeksbeeld",
  };
  let view = "catalogue",
    kind = "all",
    term = "",
    sort = "lesson",
    page = 0,
    detail = 37,
    detailBack = "catalogue",
    draft = null,
    editUid = null,
    lesson = [],
    uid = 0,
    board = null;
  const design = { density: "compact" };
  const PAGE = 8;
  const esc = (s) =>
    String(s).replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
  const norm = (s) =>
    s
      .toLocaleLowerCase("nl")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  const A = (n) => assets.get(n),
    S = (id) => seqs.get(id),
    photo = (n, alt, cls = "", size = "thumb", priority = false) => {
      const a = A(n),
        r = a.renditions[size];
      return (
        '<picture><source type="image/avif" srcset="' +
        esc(r.avif) +
        '"><img class="' +
        cls +
        '" src="' +
        esc(r.webp) +
        '" alt="' +
        esc(alt ?? a.description) +
        '" width="' +
        r.width +
        '" height="' +
        r.height +
        '" loading="' +
        (priority || size === "full" ? "eager" : "lazy") +
        '" decoding="async"' +
        (priority ? ' fetchpriority="high"' : "") +
        "></picture>"
      );
    };
  const sourceLink = (n) =>
    '<a href="' +
    esc(A(n).source) +
    '" target="_blank" rel="noopener noreferrer">Origineel op Drive · v' +
    A(n).version +
    "</a>";
  const chips = (xs) =>
    '<div class="bath-chips">' +
    xs.map((x) => '<span class="bath-tag">' + esc(x) + "</span>").join("") +
    "</div>";
  const clone = (x) => JSON.parse(JSON.stringify(x));
  const announce = (s) => {
    root.querySelector("#bath-live").textContent = s;
  };

  function config(id) {
    return {
      type: "sequence",
      id,
      mode: "nu",
      level: "A2",
      help: "words",
      order: [0, 1, 2, 3],
    };
  }
  function setDraft(id) {
    draft = config(id);
    editUid = null;
    view = "practice";
  }
  function updateEdited() {
    if (editUid !== null) {
      const i = lesson.findIndex((x) => x.uid === editUid);
      if (i >= 0) lesson[i] = { ...clone(draft), uid: editUid };
    }
  }
  function name(c) {
    return c.type === "sequence" ? S(c.id).title : A(c.n).title;
  }
  function add(c) {
    lesson.push({ ...clone(c), uid: ++uid });
    announce(name(c) + " toegevoegd als apart lesitem.");
    updateLessonCount();
  }
  function updateLessonCount() {
    root.querySelector("#bath-lesson-count").textContent = lesson.length;
    root
      .querySelector("#bath-lesson")
      .setAttribute(
        "aria-label",
        `Mijn lesselectie, ${lesson.length} ${lesson.length === 1 ? "lesitem" : "lesitems"}`,
      );
  }
  const catalogItems = [
    ...data.sequences.map((s, i) => ({
      id: s.id,
      type: "SEQ",
      title: s.title,
      rank: i,
      steps: s.steps,
      search: norm(
        [
          s.title,
          ...s.steps.flatMap((n) => [A(n).title, ...A(n).words, ...A(n).uses]),
        ].join(" "),
      ),
    })),
    ...data.assets
      .filter((a) => a.n < 39)
      .map((a) => ({
        ...a,
        rank: a.type === "OVZ" ? a.n - 34 : a.n + 10,
        search: norm([a.title, a.description, ...a.words, ...a.uses].join(" ")),
      })),
  ];
  function catalogue() {
    main.innerHTML =
      '<section class="bath-hero"><button class="bath-hero-image" data-image="37" aria-label="Open beeldkaart badkamer overzicht 1">' +
      photo(37, undefined, "", "full", true) +
      '</button><div><span class="bath-muted">Collectie · wonen & persoonlijke verzorging</span><h1>Badkamer & verzorging</h1><p>Van één woord naar een hele routine.</p><div class="bath-hero-counts"><span>50 beelden</span><span>38 losse beelden</span><span>3 reeksen van 4</span></div><div class="bath-row"><button class="bath-primary" data-sequence="seq-tanden">Oefen tandenpoetsen</button><a href="' +
      data.collection.source +
      '" target="_blank" rel="noopener noreferrer">Collectie op Drive</a></div></div></section><section aria-label="Beelden vinden"><div class="bath-searchbar"><label class="bath-field" for="bath-search">Zoek een woord, handeling of situatie<input id="bath-search" type="search" autocomplete="off" placeholder="Bijvoorbeeld: tanden, boven of opruimen" value="' +
      esc(term) +
      '"></label><label class="bath-field" for="bath-sort">Sorteren<select id="bath-sort"><option value="lesson" ' +
      (sort === "lesson" ? "selected" : "") +
      '>Lesvolgorde</option><option value="az" ' +
      (sort === "az" ? "selected" : "") +
      '>Naam A–Z</option><option value="za" ' +
      (sort === "za" ? "selected" : "") +
      '>Naam Z–A</option></select></label></div><div class="bath-row bath-filters" aria-label="Soort materiaal">' +
      categories
        .map(
          ([k, l]) =>
            '<button id="bath-filter-' +
            k +
            '" data-kind="' +
            k +
            '" aria-pressed="' +
            (kind === k) +
            '">' +
            l +
            "</button>",
        )
        .join("") +
      '</div><div id="bath-results"></div></section>';
    results();
  }
  function results() {
    const tokens = norm(term).trim().split(/\s+/).filter(Boolean);
    let list = catalogItems.filter(
      (a) =>
        (kind === "all" || a.type === kind) &&
        tokens.every((t) => a.search.includes(t)),
    );
    list.sort(
      sort === "lesson"
        ? (a, b) => a.rank - b.rank
        : (a, b) =>
            (sort === "za" ? -1 : 1) * a.title.localeCompare(b.title, "nl"),
    );
    const pages = Math.max(1, Math.ceil(list.length / PAGE));
    page = Math.min(page, pages - 1);
    root.querySelector("#bath-results").innerHTML =
      '<div class="bath-row bath-between bath-results-head"><span role="status" aria-live="polite">' +
      list.length +
      " " +
      (list.length === 1 ? "resultaat" : "resultaten") +
      '</span><span class="bath-muted">Een reeks opent als één oefening</span></div><div class="bath-grid">' +
      list
        .slice(page * PAGE, (page + 1) * PAGE)
        .map(
          (a) =>
            '<button class="bath-tile" ' +
            (a.type === "SEQ"
              ? 'data-sequence="' + a.id + '"'
              : 'data-image="' + a.n + '"') +
            ' aria-label="Open ' +
            esc(a.title) +
            '"><span class="bath-thumb">' +
            (a.type === "SEQ"
              ? '<span class="bath-four">' +
                a.steps.map((n) => photo(n, "")).join("") +
                "</span>"
              : photo(a.n, "")) +
            '</span><span class="bath-caption"><strong>' +
            esc(a.title) +
            '</strong><span class="bath-muted">' +
            (a.type === "SEQ"
              ? "4 stappen · 4 oefenstanden"
              : typeNames[a.type]) +
            "</span></span></button>",
        )
        .join("") +
      "</div>" +
      (!list.length
        ? '<p class="bath-empty">Geen beelden met deze combinatie. Pas je zoekwoord of soort materiaal aan.</p>'
        : "") +
      '<div class="bath-row bath-between bath-page"><button id="bath-page-prev" ' +
      (page === 0 ? "disabled" : "") +
      ">Vorige</button><span>Pagina " +
      (page + 1) +
      " van " +
      pages +
      '</span><button id="bath-page-next" ' +
      (page === pages - 1 ? "disabled" : "") +
      ">Volgende</button></div>";
  }
  function imageCard() {
    const a = A(detail),
      seq = data.sequences.find((s) => s.steps.includes(detail));
    main.innerHTML =
      '<button id="bath-card-back" class="bath-back">Terug naar ' +
      (detailBack === "practice" ? "de reeks" : "de collectie") +
      '</button><div class="bath-detail-grid"><div>' +
      photo(detail, a.description, "bath-detail-photo", "full", true) +
      '<p class="bath-muted">' +
      sourceLink(detail) +
      '</p></div><div><span class="bath-muted">Beeldkaart · ' +
      typeNames[a.type] +
      "</span><h1>" +
      esc(a.title) +
      '</h1><div class="bath-facts"><section><strong>Wat is zichtbaar?</strong><p>' +
      esc(a.description) +
      "</p></section><section><strong>Woorden & handelingen</strong>" +
      chips(a.words) +
      "</section><section><strong>Ook te gebruiken bij</strong>" +
      chips(a.uses) +
      "</section>" +
      (a.note
        ? '<section class="bath-notice"><strong>Voor de docent</strong><p>' +
          esc(a.note) +
          "</p></section>"
        : "") +
      "<section><strong>Startvraag</strong><p>" +
      esc(
        a.type === "OBJ"
          ? "Wat is dit? Waar gebruik je het voor?"
          : a.type === "REL"
            ? "Waar is het voorwerp? Vertel waar je het ziet."
            : a.type === "OVZ"
              ? "Wat zie je in deze badkamer? Vertel waar de voorwerpen staan of hangen."
              : "Wat doet de persoon op deze foto?",
      ) +
      '</p></section></div><div class="bath-row bath-actions"><button class="bath-primary" id="bath-image-board">Toon beeld op bord</button><button id="bath-image-add">Voeg toe aan les</button>' +
      (seq
        ? '<button data-sequence="' +
          seq.id +
          '">Open reeks ' +
          esc(seq.title) +
          "</button>"
        : "") +
      "</div></div></div>";
  }
  function prompt(c) {
    const s = S(c.id);
    const text = {
      nu:
        "Wat doet " +
        (s.pronoun === "Zij" ? "de vrouw" : "de man") +
        " op de foto’s? Vertel bij iedere foto wat je ziet.",
      volgorde:
        "Vertel wat er eerst gebeurt en wat daarna gebeurt. Gebruik eerst, dan, daarna en ten slotte.",
      instructie:
        "Leg aan iemand uit wat die moet doen. Begin je zinnen met “Je moet”.",
      verleden:
        "Stel je voor: jij hebt deze handelingen vanochtend gedaan. Vertel achteraf wat je hebt gedaan. Begin met “Ik heb”.",
    }[c.mode];
    return (
      text +
      (c.level === "B1"
        ? " Verbind je zinnen tot één verhaal."
        : " Gebruik korte, volledige zinnen.")
    );
  }
  function answers(c) {
    const s = S(c.id);
    return c.mode === "nu"
      ? s.verbs.map((v) => s.pronoun + " " + v + ".")
      : s[
          c.mode === "verleden"
            ? "past"
            : c.mode === "instructie"
              ? "instruction"
              : "order"
        ];
  }
  function help(c, idx, pos) {
    if (c.help === "none") return "";
    const s = S(c.id);
    if (c.help === "words") return s.keywords[idx];
    return c.mode === "nu"
      ? s.pronoun + " …"
      : c.mode === "instructie"
        ? "Je moet …"
        : c.mode === "verleden"
          ? "Ik heb …"
          : ["Eerst …", "Dan …", "Daarna …", "Ten slotte …"][pos];
  }
  function answerAt(c, idx, pos) {
    if (c.mode === "volgorde") {
      const s = S(c.id);
      return s.order[idx].replace(
        /^(Eerst|Dan|Daarna|Ten slotte)/,
        ["Eerst", "Dan", "Daarna", "Ten slotte"][pos],
      );
    }
    return answers(c)[idx];
  }
  function panelSet(c, isBoard = false) {
    const s = S(c.id);
    return (
      '<div class="bath-panels">' +
      c.order
        .map((idx, pos) => {
          const n = s.steps[idx],
            visible = !isBoard || board.visible[pos];
          return (
            '<figure class="bath-panel">' +
            (isBoard
              ? '<button class="bath-panel-photo" id="bath-reveal-' +
                pos +
                '" data-reveal="' +
                pos +
                '" aria-label="' +
                (visible ? "Dek af" : "Onthul") +
                " beeld " +
                (pos + 1) +
                '">'
              : '<div class="bath-panel-photo">') +
            (visible
              ? photo(n, A(n).description, "", "full")
              : "<span>Afgedekt</span>") +
            '<span class="bath-number">' +
            (pos + 1) +
            "</span>" +
            (isBoard ? "</button>" : "</div>") +
            "<figcaption>" +
            (visible && help(c, idx, pos)
              ? "<span>" + esc(help(c, idx, pos)) + "</span>"
              : "") +
            (!isBoard
              ? '<button class="bath-panel-link" data-image="' +
                n +
                '">Beeldkaart ' +
                (pos + 1) +
                "</button>"
              : "") +
            (isBoard && board.examples && visible
              ? "<span>" + esc(answerAt(c, idx, pos)) + "</span>"
              : "") +
            (!isBoard && c.mode === "volgorde"
              ? '<div class="bath-panel-tools"><button data-step-move="' +
                pos +
                '" data-delta="-1" aria-label="Beeld ' +
                (pos + 1) +
                ' naar voren" ' +
                (pos === 0 ? "disabled" : "") +
                '>←</button><button data-step-move="' +
                pos +
                '" data-delta="1" aria-label="Beeld ' +
                (pos + 1) +
                ' naar achteren" ' +
                (pos === 3 ? "disabled" : "") +
                ">→</button></div>"
              : "") +
            "</figcaption></figure>"
          );
        })
        .join("") +
      "</div>"
    );
  }
  function practice() {
    const c = draft,
      s = S(c.id);
    main.innerHTML =
      '<div class="bath-row bath-between bath-back"><button id="bath-practice-back">Terug naar ' +
      (editUid === null ? "de collectie" : "je lesselectie") +
      '</button><span class="bath-muted">' +
      (editUid === null
        ? "Reeks · 4 beelden"
        : "Lesitem " +
          (lesson.findIndex((x) => x.uid === editUid) + 1) +
          " · eigen instellingen") +
      "</span></div><h1>" +
      esc(s.title) +
      '</h1><div class="bath-row bath-modes" aria-label="Oefenstand">' +
      Object.entries(modeNames)
        .map(
          ([k, l]) =>
            '<button id="bath-mode-' +
            k +
            '" data-mode="' +
            k +
            '" aria-pressed="' +
            (c.mode === k) +
            '">' +
            l +
            "</button>",
        )
        .join("") +
      '</div><div class="bath-settings"><label class="bath-field" for="bath-level">Oefenvoorstel<select id="bath-level"><option value="A2" ' +
      (c.level === "A2" ? "selected" : "") +
      '>A2 · korte zinnen</option><option value="B1" ' +
      (c.level === "B1" ? "selected" : "") +
      '>B1 · samenhang & uitleg</option></select></label><label class="bath-field" for="bath-help">Steun op het bord<select id="bath-help"><option value="none" ' +
      (c.help === "none" ? "selected" : "") +
      '>Zonder hulp</option><option value="words" ' +
      (c.help === "words" ? "selected" : "") +
      '>Kernwoorden</option><option value="starters" ' +
      (c.help === "starters" ? "selected" : "") +
      '>Zinsstarters</option></select></label></div><section class="bath-prompt"><strong>' +
      modeLong[c.mode] +
      "</strong><p>" +
      esc(prompt(c)) +
      "</p>" +
      (c.level === "B1" ? "<p>" + esc(s.b1) + "</p>" : "") +
      "</section>" +
      panelSet(c) +
      (c.mode === "volgorde"
        ? '<div class="bath-row bath-actions"><button id="bath-shuffle">Hussel beelden</button><button id="bath-source-order">Bronvolgorde terug</button><span class="bath-muted">Vertelvolgorde vrij bespreekbaar</span></div>'
        : "") +
      '<div class="bath-row bath-actions"><button class="bath-primary" id="bath-practice-board">Toon op bord</button><button id="bath-practice-add">' +
      (editUid === null ? "Voeg toe aan les" : "Voeg nogmaals toe") +
      '</button></div><details><summary>Voorbeeldzinnen voor de docent</summary><ul class="bath-model">' +
      answers(c)
        .map((v, i) => "<li>" + (i + 1) + ". " + esc(v) + "</li>")
        .join("") +
      '</ul><p class="bath-muted">Voorbeelden bij de bronvolgorde; andere passende formuleringen zijn mogelijk.</p></details><details><summary>Aandachtspunt bij deze reeks</summary><p>' +
      esc(s.note) +
      "</p></details>";
  }
  function lessonView() {
    main.innerHTML =
      '<div class="bath-row bath-between bath-back"><button id="bath-catalogue-back">Terug naar de collectie</button><button class="bath-primary" id="bath-start-lesson" ' +
      (!lesson.length ? "disabled" : "") +
      ">Start les op bord</button></div><h1>Mijn lesselectie · " +
      lesson.length +
      '</h1><p class="bath-muted">Iedere toevoeging is een apart lesitem met eigen oefenstand en steun.</p>' +
      (lesson.length
        ? lesson
            .map((c, i) => {
              const n = c.type === "sequence" ? S(c.id).steps[0] : c.n;
              return (
                '<article class="bath-lesson-item">' +
                photo(n, "", "bath-mini") +
                "<div><strong>" +
                (i + 1) +
                ". " +
                esc(name(c)) +
                '</strong><p class="bath-muted">' +
                (c.type === "sequence"
                  ? modeNames[c.mode] +
                    " · " +
                    c.level +
                    " · " +
                    {
                      none: "zonder hulp",
                      words: "kernwoorden",
                      starters: "zinsstarters",
                    }[c.help]
                  : "Los beeld") +
                '</p></div><div class="bath-row bath-lesson-tools"><button data-edit="' +
                c.uid +
                '">Openen</button><button data-item-move="' +
                i +
                '" data-delta="-1" aria-label="Lesitem ' +
                (i + 1) +
                ' omhoog" ' +
                (!i ? "disabled" : "") +
                '>↑</button><button data-item-move="' +
                i +
                '" data-delta="1" aria-label="Lesitem ' +
                (i + 1) +
                ' omlaag" ' +
                (i === lesson.length - 1 ? "disabled" : "") +
                '>↓</button><button data-remove="' +
                c.uid +
                '" aria-label="Verwijder lesitem ' +
                (i + 1) +
                '">Verwijder</button></div></article>'
              );
            })
            .join("")
        : '<p class="bath-empty">Open een beeld of oefenreeks en voeg die toe aan je les.</p>');
  }
  function startBoard(items, from) {
    announce("");
    board = {
      items: clone(items),
      index: 0,
      from,
      visible: [true, true, true, true],
      examples: false,
      words: false,
    };
    view = "board";
  }
  function boardView() {
    const c = board.items[board.index],
      seq = c.type === "sequence";
    main.innerHTML =
      '<section class="bath-board"><div class="bath-row bath-between bath-back"><button id="bath-board-back">Terug naar voorbereiding</button><span class="bath-tag">Bordvoorbeeld</span></div>' +
      (seq
        ? "<h1>" +
          modeLong[c.mode] +
          "</h1><p>" +
          esc(prompt(c)) +
          "</p>" +
          (c.level === "B1" ? "<p>" + esc(S(c.id).b1) + "</p>" : "") +
          panelSet(c, true)
        : photo(c.n, A(c.n).description, "bath-board-photo", "full", true) +
          (board.words
            ? "<h1>" + esc(A(c.n).title) + "</h1>" + chips(A(c.n).words)
            : "")) +
      '<div class="bath-row bath-between bath-controls">' +
      (seq
        ? '<div class="bath-row"><button id="bath-cover-all">Alles afdekken</button><button id="bath-reveal-next" ' +
          (board.visible.every(Boolean) ? "disabled" : "") +
          '>Volgende onthullen</button><button id="bath-reveal-all">Alles tonen</button></div><label class="bath-row"><input id="bath-examples" type="checkbox" ' +
          (board.examples ? "checked" : "") +
          ">Voorbeeldzinnen tonen</label>"
        : '<label class="bath-row"><input id="bath-show-words" type="checkbox" ' +
          (board.words ? "checked" : "") +
          ">Woorden tonen</label>") +
      "</div>" +
      (board.items.length > 1
        ? '<div class="bath-row bath-between bath-controls"><button id="bath-board-prev" ' +
          (!board.index ? "disabled" : "") +
          ">Vorig lesitem</button><span>Lesitem " +
          (board.index + 1) +
          " van " +
          board.items.length +
          '</span><button id="bath-board-next" ' +
          (board.index === board.items.length - 1 ? "disabled" : "") +
          ">Volgend lesitem</button></div>"
        : "") +
      "</section>";
  }
  function render() {
    root.dataset.density = design.density;
    root.querySelector("#bath-lesson").hidden = view === "board";
    updateLessonCount();
    ({
      catalogue,
      detail: imageCard,
      practice,
      lesson: lessonView,
      board: boardView,
    })[view]();
  }
  root.addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b || b.disabled) return;
    const d = b.dataset,
      oldId = b.id;
    let full = true;
    if (d.kind) {
      kind = d.kind;
      page = 0;
      root
        .querySelectorAll("[data-kind]")
        .forEach((x) =>
          x.setAttribute("aria-pressed", String(x.dataset.kind === kind)),
        );
      results();
      full = false;
    } else if (d.sequence) {
      setDraft(d.sequence);
    } else if (d.image) {
      detail = Number(d.image);
      detailBack = view === "practice" ? "practice" : "catalogue";
      view = "detail";
    } else if (d.mode) {
      draft.mode = d.mode;
      draft.order = [0, 1, 2, 3];
      updateEdited();
    } else if (d.stepMove !== undefined) {
      const i = Number(d.stepMove),
        j = i + Number(d.delta);
      [draft.order[i], draft.order[j]] = [draft.order[j], draft.order[i]];
      updateEdited();
    } else if (d.itemMove !== undefined) {
      const i = Number(d.itemMove),
        j = i + Number(d.delta);
      [lesson[i], lesson[j]] = [lesson[j], lesson[i]];
    } else if (d.remove) {
      lesson = lesson.filter((x) => x.uid !== Number(d.remove));
      announce("Lesitem verwijderd.");
    } else if (d.edit) {
      const c = lesson.find((x) => x.uid === Number(d.edit));
      if (c.type === "sequence") {
        draft = clone(c);
        editUid = c.uid;
        view = "practice";
      } else {
        detail = c.n;
        detailBack = "catalogue";
        view = "detail";
      }
    } else if (d.reveal !== undefined) {
      const i = Number(d.reveal);
      board.visible[i] = !board.visible[i];
    } else
      switch (b.id) {
        case "bath-lesson":
          view = "lesson";
          break;
        case "bath-page-prev":
          page--;
          results();
          full = false;
          break;
        case "bath-page-next":
          page++;
          results();
          full = false;
          break;
        case "bath-card-back":
          view = detailBack;
          break;
        case "bath-practice-back":
          view = editUid === null ? "catalogue" : "lesson";
          break;
        case "bath-home":
        case "bath-catalogue-back":
          view = "catalogue";
          break;
        case "bath-image-add":
          add({ type: "image", n: detail });
          full = false;
          break;
        case "bath-practice-add":
          add(draft);
          full = false;
          break;
        case "bath-image-board":
          startBoard([{ type: "image", n: detail }], "detail");
          break;
        case "bath-practice-board":
          startBoard([draft], "practice");
          break;
        case "bath-start-lesson":
          startBoard(lesson, "lesson");
          break;
        case "bath-board-back":
          view = board.from;
          break;
        case "bath-shuffle": {
          const before = draft.order.join();
          for (let i = 3; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [draft.order[i], draft.order[j]] = [draft.order[j], draft.order[i]];
          }
          if (draft.order.join() === before) draft.order.reverse();
          updateEdited();
          break;
        }
        case "bath-source-order":
          draft.order = [0, 1, 2, 3];
          updateEdited();
          break;
        case "bath-cover-all":
          board.visible.fill(false);
          break;
        case "bath-reveal-all":
          board.visible.fill(true);
          break;
        case "bath-reveal-next": {
          const i = board.visible.findIndex((x) => !x);
          if (i >= 0) board.visible[i] = true;
          break;
        }
        case "bath-board-prev":
          board.index--;
          board.visible.fill(true);
          board.examples = false;
          board.words = false;
          break;
        case "bath-board-next":
          board.index++;
          board.visible.fill(true);
          board.examples = false;
          board.words = false;
          break;
        default:
          full = false;
      }
    if (full) render();
    if (oldId === "bath-home") {
      root.scrollIntoView({ block: "start", behavior: "instant" });
      const heading = main.querySelector("h1");
      heading.setAttribute("tabindex", "-1");
      heading.focus({ preventScroll: true });
      return;
    }
    if (oldId) {
      const t = root.querySelector("#" + oldId);
      if (t && !t.disabled) t.focus();
    }
  });
  root.addEventListener("input", (e) => {
    if (e.target.id === "bath-search") {
      term = e.target.value;
      page = 0;
      results();
    }
  });
  root.addEventListener("change", (e) => {
    let redraw = true;
    switch (e.target.id) {
      case "bath-sort":
        sort = e.target.value;
        page = 0;
        results();
        redraw = false;
        break;
      case "bath-level":
        draft.level = e.target.value;
        updateEdited();
        break;
      case "bath-help":
        draft.help = e.target.value;
        updateEdited();
        break;
      case "bath-examples":
        board.examples = e.target.checked;
        break;
      case "bath-show-words":
        board.words = e.target.checked;
        break;
      default:
        redraw = false;
    }
    if (redraw) {
      const id = e.target.id;
      render();
      root.querySelector("#" + id)?.focus();
    }
  });
  render();
})();
