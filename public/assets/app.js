import "./app-header.js";
import { lessonStore } from "./lesson-store.js";
import { collectionTree } from "./collection-tree.js";
import { indexCollections } from "./collection-data.js";

(async () => {
  const root = document.getElementById("tr-bathroom"),
    main = root.querySelector("#bath-main");
  let data, registry, library;
  try {
    const load = async (name) => {
      const response = await fetch(new URL("../data/" + name, import.meta.url));
      if (!response.ok)
        throw new Error("De collecties konden niet worden geladen.");
      return response.json();
    };
    registry = await load("collections.json");
    const packages = await Promise.all(
      registry.nodes
        .filter(
          (node) => node.kind === "collection" && node.status === "published",
        )
        .map((node) => load(node.dataset)),
    );
    library = indexCollections(packages);
    data = packages[0];
  } catch (error) {
    main.innerHTML =
      '<p role="alert">De collectie kon niet worden geladen. Controleer je verbinding en probeer opnieuw.</p><button id="retry">Opnieuw laden</button>';
    main
      .querySelector("#retry")
      .addEventListener("click", () => location.reload());
    root.querySelector("#bath-lesson").disabled = true;
    return;
  }
  const tree = collectionTree(registry.nodes);
  const homeGroup = tree.get(data.collection.id).parentId;
  const assets = library.assets,
    seqs = library.sequences;
  const modeNames = {
      nu: "Nu",
      volgorde: "Eerst–dan",
      instructie: "Instructie",
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
    ["OBJ", "Voorwerpen"],
    ["ACT", "Handelingen"],
    ["REL", "Plaats"],
    ["OVZ", "Overzicht"],
    ["REE", "Stappen"],
    ["SEQ", "Reeksen"],
  ];
  const typeNames = {
    OBJ: "Voorwerp",
    ACT: "Handeling",
    REL: "Plaats & relaties",
    OVZ: "Overzicht",
    REE: "Stap uit een reeks",
  };
  let view = "collections",
    groupId = homeGroup,
    catalogueScope = "collection",
    kind = "all",
    term = "",
    sort = "lesson",
    detail = 37,
    detailBack = "catalogue",
    draft = null,
    editUid = null,
    lesson = [],
    uid = 0,
    board = null;
  const design = { density: "compact" };
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
  const chips = (xs) =>
    '<div class="bath-chips">' +
    xs.map((x) => '<span class="bath-tag">' + esc(x) + "</span>").join("") +
    "</div>";
  const clone = (x) => JSON.parse(JSON.stringify(x));
  const announce = (s) => {
    root.querySelector("#bath-live").textContent = s;
  };

  const saveNotice = document.createElement("div");
  saveNotice.className = "bath-save-notice";
  saveNotice.hidden = true;
  saveNotice.setAttribute("role", "alert");
  main.before(saveNotice);
  let store;
  try {
    store = await lessonStore(
      (message) => {
        saveNotice.replaceChildren(document.createTextNode(message + " "));
        const retry = document.createElement("button");
        retry.textContent = message.includes("ander venster")
          ? "Pagina herladen"
          : "Opnieuw opslaan";
        retry.addEventListener("click", () =>
          message.includes("ander venster") ? location.reload() : store.retry(),
        );
        saveNotice.append(retry);
        saveNotice.hidden = false;
      },
      () => {
        saveNotice.hidden = true;
      },
    );
    lesson = store.items;
    uid = Math.max(0, ...lesson.map((item) => item.uid));
  } catch {
    main.innerHTML =
      '<p role="alert">Je lesselectie kon niet worden geladen. Probeer de pagina opnieuw te laden.</p><button id="retry">Opnieuw laden</button>';
    main
      .querySelector("#retry")
      .addEventListener("click", () => location.reload());
    root.querySelector("#bath-lesson").disabled = true;
    return;
  }
  window.addEventListener("beforeunload", (event) => {
    if (store.dirty()) {
      event.preventDefault();
      event.returnValue = "";
    }
  });
  function saveLesson() {
    store.save(lesson);
  }

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
      if (i >= 0) {
        lesson[i] = { ...clone(draft), uid: editUid };
        saveLesson();
      }
    }
  }
  function name(c) {
    return c.type === "sequence" ? S(c.id).title : A(c.n).title;
  }
  function add(c) {
    lesson.push({ ...clone(c), uid: ++uid });
    saveLesson();
    announce(name(c) + " toegevoegd aan je les.");
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
    ...[...seqs.values()].map((s, i) => ({
      collectionId: s.collectionId,
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
    ...[...assets.values()].map((a) => ({
      ...a,
      rank:
        a.type === "OVZ"
          ? 100 + (a.sourceNumber ?? a.n)
          : 1000 + (a.sourceNumber ?? a.n),
      search: norm([a.title, a.description, ...a.words, ...a.uses, ...(a.methodLinks ?? []).flatMap(l => [l.lesson, l.route])].join(" ")),
    })),
  ];
  function collectionCover(node, size = "thumb", priority = false) {
    if (node.kind === "collection")
      return photo(
        node.coverImageNumber,
        "",
        "bath-collection-photo",
        size,
        priority,
      );
    const r = node.cover.renditions[size];
    return (
      '<picture><source type="image/avif" srcset="' +
      esc(r.avif) +
      '"><img class="bath-collection-photo" src="' +
      esc(r.webp) +
      '" alt="' +
      esc(node.cover.alt) +
      '" width="' +
      r.width +
      '" height="' +
      r.height +
      '" loading="' +
      (priority ? "eager" : "lazy") +
      '" decoding="async"></picture>'
    );
  }
  function collectionCounts(node) {
    const leaves = tree.leaves(node.id);
    const packages = leaves.map((leaf) => library.collections.get(leaf.id));
    const count = packages.reduce((sum, item) => sum + item.assets.length, 0);
    const sequences = packages.reduce(
      (sum, item) => sum + item.sequences.length,
      0,
    );
    return { count, sequences, collections: leaves.length };
  }
  function collectionCard(node) {
    const counts = collectionCounts(node);
    return (
      '<button class="bath-tile bath-collection-card" data-collection="' +
      esc(node.id) +
      '" aria-label="Open collectie ' +
      esc(node.title) +
      '">' +
      collectionCover(node, "thumb", true) +
      '<span class="bath-collection-copy"><strong>' +
      esc(node.title) +
      '</strong><span class="bath-muted">' +
      (node.kind === "group"
        ? counts.collections +
          (counts.collections === 1 ? " collectie · " : " collecties · ") +
          counts.count +
          " beelden"
        : counts.count +
          " beelden · " +
          counts.sequences +
          (counts.sequences === 1 ? " reeks" : " reeksen")) +
      '</span><span class="bath-collection-open">Bekijk collectie <span aria-hidden="true">→</span></span></span></button>'
    );
  }
  function breadcrumbs(id, allImages = false) {
    const trail = tree.trail(id);
    return (
      '<nav class="bath-breadcrumb" aria-label="Je bent hier"><button id="bath-collections">Collecties</button>' +
      trail
        .map(
          (node, i) =>
            '<span aria-hidden="true">›</span>' +
            (i === trail.length - 1 && !allImages
              ? '<span aria-current="page">' + esc(node.title) + "</span>"
              : '<button data-collection="' +
                esc(node.id) +
                '">' +
                esc(node.title) +
                "</button>"),
        )
        .join("") +
      (allImages
        ? '<span aria-hidden="true">›</span><span aria-current="page">Alle beelden</span>'
        : "") +
      "</nav>"
    );
  }
  function collectionOverview() {
    main.innerHTML =
      '<section aria-labelledby="collections-title"><div class="bath-collection-heading"><h1 id="collections-title">Collecties</h1><p class="bath-muted">Kies een collectie voor je les.</p></div><div class="bath-collections">' +
      tree.children().map(collectionCard).join("") +
      "</div></section>";
  }
  function groupOverview() {
    const node = tree.get(groupId),
      counts = collectionCounts(node);
    main.innerHTML =
      breadcrumbs(node.id) +
      '<section class="bath-hero bath-group-hero"><div>' +
      collectionCover(node, "full", true) +
      "</div><div><h1>" +
      esc(node.title) +
      "</h1><p>" +
      esc(node.description) +
      '</p><div class="bath-hero-counts"><span>' +
      counts.count +
      " beelden</span><span>" +
      counts.sequences +
      ' reeksen</span></div><button class="bath-primary" id="bath-group-images">Alle beelden in deze familie</button></div></section>' +
      '<section aria-labelledby="group-children-title"><h2 id="group-children-title">Ruimtes en onderwerpen</h2><div class="bath-collections">' +
      tree.children(node.id).map(collectionCard).join("") +
      "</div></section>";
  }
  function scopedItems() {
    const ids = new Set(
      catalogueScope === "group"
        ? tree.leaves(groupId).map((node) => node.id)
        : [data.collection.id],
    );
    return catalogItems.filter((item) => ids.has(item.collectionId));
  }
  function catalogue() {
    const allImages = catalogueScope === "group";
    const node = tree.get(allImages ? groupId : data.collection.id);
    const counts = collectionCounts(node);
    const coverNumber = tree.get(data.collection.id).coverImageNumber;
    const firstSequence = allImages ? null : data.sequences[0];
    const items = scopedItems();
    main.innerHTML =
      breadcrumbs(allImages ? groupId : data.collection.id, allImages) +
      '<section class="bath-hero bath-group-hero">' +
      (allImages
        ? "<div>" + collectionCover(tree.get(groupId), "full", true) + "</div>"
        : '<button class="bath-hero-image" data-image="' +
          coverNumber +
          '" aria-label="Open beeldkaart ' +
          esc(A(coverNumber).title) +
          '">' +
          photo(coverNumber, undefined, "", "full", true) +
          "</button>") +
      '<div><span class="bath-muted">' +
      esc(
        allImages
          ? tree.get(groupId).title
          : node.subtitle || tree.get(node.parentId).title,
      ) +
      "</span><h1>" +
      esc(allImages ? "Alle beelden · " + tree.get(groupId).title : data.collection.title) +
      '</h1><div class="bath-hero-counts"><span>' +
      counts.count +
      " beelden</span><span>" +
      counts.sequences +
      (counts.sequences === 1 ? " reeks van 4" : " reeksen van 4") +
      "</span></div>" +
      (firstSequence
        ? '<button class="bath-primary" data-sequence="' +
          esc(firstSequence.id) +
          '">Oefen ' +
          esc(firstSequence.title.toLocaleLowerCase("nl")) +
          "</button>"
        : "") +
      '</div></section><section aria-label="Beelden vinden"><div class="bath-searchbar"><label class="bath-field" for="bath-search">Zoek een woord, handeling of situatie<input id="bath-search" type="search" autocomplete="off" placeholder="Bijvoorbeeld: water, boven of opruimen" value="' +
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
            (k === "all"
              ? ""
              : " · " + items.filter((a) => a.type === k).length) +
            "</button>",
        )
        .join("") +
      '</div><div id="bath-results"></div></section>';
    results();
  }
  function results() {
    const tokens = norm(term).trim().split(/\s+/).filter(Boolean);
    let list = scopedItems().filter(
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
    root.querySelector("#bath-results").innerHTML =
      '<div class="bath-row bath-between bath-results-head"><span role="status" aria-live="polite">' +
      list.length +
      " " +
      (list.length === 1 ? "resultaat" : "resultaten") +
      '</span><span class="bath-muted">Een reeks opent als één oefening</span></div><div class="bath-grid">' +
      list
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
        : "");
  }
  function imageCard() {
    const a = A(detail),
      seq = [...seqs.values()].find((s) => s.steps.includes(detail));
    main.innerHTML =
      '<button id="bath-card-back" class="bath-back">Terug naar ' +
      (detailBack === "practice" ? "de reeks" : "de collectie") +
      '</button><div class="bath-detail-grid"><div>' +
      photo(detail, a.description, "bath-detail-photo", "full", true) +
      '</div><div><span class="bath-muted">Beeldkaart · ' +
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
      (a.methodLinks?.length ? '<section><strong>Bij deze lessen</strong><ul>' + [...new Map(a.methodLinks.map(l => [l.url, l])).values()].sort((a,b) => ["Van Start","Inzicht","De Finale","Vooruit"].indexOf(a.route) - ["Van Start","Inzicht","De Finale","Vooruit"].indexOf(b.route)).map(l => '<li><a href="' + esc(l.url) + '" target="_blank" rel="noopener">' + esc(l.route + " · " + l.lesson) + "</a></li>").join("") + "</ul></section>" : "") +
      (a.concepts ?? []).filter(c => c.exercise).map(c => "<section><strong>Oefenen met " + esc(c.word) + "</strong><p>" + esc(c.exercise.instruction) + "</p><p>Voorbeeld: " + esc(c.exercise.example_answer) + "</p><p>" + esc(c.exercise.note) + "</p></section>").join("") +
      "<section><strong>Startvraag</strong><p>" +
      esc(
        a.type === "OBJ"
          ? "Wat is dit? Waar gebruik je het voor?"
          : a.type === "REL"
            ? "Waar is het voorwerp? Vertel waar je het ziet."
            : a.type === "OVZ"
              ? "Wat zie je op dit overzicht? Vertel waar de voorwerpen staan of hangen."
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
  function isImperative(c) {
    return c.mode === "instructie" && c.instructionForm === "imperatief";
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
      instructie: isImperative(c)
        ? "Geef bij iedere foto een instructie in de gebiedende wijs. Begin met het werkwoord, bijvoorbeeld: “" + s.imperative[0] + "”"
        : "Leg aan iemand uit wat die moet doen. Begin je zinnen met “Je moet”.",
      verleden:
        "Stel je voor: jij hebt deze handelingen vanochtend gedaan. Vertel achteraf wat je hebt gedaan. Begin met “Ik heb”.",
    }[c.mode];
    return (
      text +
      (isImperative(c)
        ? " Geef de instructies in een logische volgorde."
        : c.level === "B1"
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
              ? (isImperative(c) ? "imperative" : "instruction")
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
        ? (isImperative(c) ? s.imperative[idx].split(" ")[0] + " …" : "Je moet …")
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
      '</div><div class="bath-settings"><label class="bath-field" for="bath-level">Niveau<select id="bath-level"><option value="A2" ' +
      (c.level === "A2" ? "selected" : "") +
      '>A2 · korte zinnen</option><option value="B1" ' +
      (c.level === "B1" ? "selected" : "") +
      '>B1 · samenhang & uitleg</option></select></label><label class="bath-field" for="bath-help">Steun op het bord<select id="bath-help"><option value="none" ' +
      (c.help === "none" ? "selected" : "") +
      '>Zonder hulp</option><option value="words" ' +
      (c.help === "words" ? "selected" : "") +
      '>Kernwoorden</option><option value="starters" ' +
      (c.help === "starters" ? "selected" : "") +
      '>Zinsstarters</option></select></label>' +
      (c.mode === "instructie"
        ? '<label class="bath-field" for="bath-instruction-form">Instructievorm<select id="bath-instruction-form"><option value="moet" ' +
          (!isImperative(c) ? "selected" : "") +
          '>Je moet …</option><option value="imperatief" ' +
          (isImperative(c) ? "selected" : "") +
          '>Gebiedende wijs (imperatief)</option></select></label>'
        : "") +
      '</div>' +
      (isImperative(c)
        ? '<aside class="bath-notice"><strong>Voor de docent · dagelijks taalgebruik</strong><p>De gebiedende wijs is bruikbaar om instructies te geven in het dagelijks leven. Voor de examenvoorbereiding adviseren we in deze beeldbank de vorm “Je moet …”. De gebiedende wijs wordt hier niet als examenantwoord geadviseerd.</p></aside>'
        : "") +
      '<section class="bath-prompt"><strong>' +
      modeLong[c.mode] +
      "</strong><p>" +
      esc(prompt(c)) +
      "</p>" +
      (c.level === "B1" && !isImperative(c) ? "<p>" + esc(s.b1) + "</p>" : "") +
      "</section>" +
      panelSet(c) +
      (c.mode === "volgorde"
        ? '<div class="bath-row bath-actions"><button id="bath-shuffle">Hussel beelden</button><button id="bath-source-order">Volgorde herstellen</button><span class="bath-muted">Vertelvolgorde vrij bespreekbaar</span></div>'
        : "") +
      '<div class="bath-row bath-actions"><button class="bath-primary" id="bath-practice-board">Toon op bord</button><button id="bath-practice-add">' +
      (editUid === null ? "Voeg toe aan les" : "Voeg nogmaals toe") +
      '</button></div><details><summary>Voorbeeldzinnen voor de docent</summary><ul class="bath-model">' +
      answers(c)
        .map((v, i) => "<li>" + (i + 1) + ". " + esc(v) + "</li>")
        .join("") +
      '</ul><p class="bath-muted">Voorbeelden bij de oorspronkelijke volgorde.</p></details><details><summary>Aandachtspunt bij deze reeks</summary><p>' +
      esc(s.note) +
      "</p></details>";
  }
  function lessonView() {
    main.innerHTML =
      '<div class="bath-row bath-between bath-back"><button id="bath-catalogue-back">Terug naar de collectie</button><button class="bath-primary" id="bath-start-lesson" ' +
      (!lesson.length ? "disabled" : "") +
      ">Start les op bord</button></div><h1>Mijn lesselectie · " +
      lesson.length +
      '</h1><p class="bath-muted">Zet je beelden en reeksen in de gewenste volgorde.</p>' +
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
                  ? (c.mode === "instructie" ? (isImperative(c) ? "Gebiedende wijs" : "Je moet") : modeNames[c.mode]) +
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
      '<section class="bath-board"><div class="bath-row bath-between bath-back"><button id="bath-board-back">Terug naar voorbereiding</button></div>' +
      (seq
        ? "<h1>" +
          modeLong[c.mode] +
          "</h1><p>" +
          esc(prompt(c)) +
          "</p>" +
          (c.level === "B1" && !isImperative(c) ? "<p>" + esc(S(c.id).b1) + "</p>" : "") +
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
      collections: collectionOverview,
      group: groupOverview,
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
    if (d.collection) {
      const node = tree.get(d.collection);
      if (!node || node.status !== "published") return;
      if (node.kind === "group") {
        groupId = node.id;
        view = "group";
      } else {
        data = library.collections.get(node.id);
        groupId = node.parentId;
        catalogueScope = "collection";
        kind = "all";
        term = "";
        view = "catalogue";
      }
    } else if (d.kind) {
      kind = d.kind;
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
      saveLesson();
    } else if (d.remove) {
      lesson = lesson.filter((x) => x.uid !== Number(d.remove));
      saveLesson();
      announce("Lesitem verwijderd.");
    } else if (d.edit) {
      const c = lesson.find((x) => x.uid === Number(d.edit));
      if (c.type === "sequence") {
        draft = clone(c);
        editUid = c.uid;
        view = "practice";
      } else {
        detail = c.n;
        data = library.collections.get(A(c.n).collectionId);
        catalogueScope = "collection";
        kind = "all";
        term = "";
        detailBack = "catalogue";
        view = "detail";
      }
    } else if (d.reveal !== undefined) {
      const i = Number(d.reveal);
      board.visible[i] = !board.visible[i];
    } else
      switch (b.id) {
        case "bath-group-images":
          catalogueScope = "group";
          kind = "all";
          term = "";
          view = "catalogue";
          break;
        case "bath-lesson":
          view = "lesson";
          break;
        case "bath-card-back":
          view = detailBack;
          break;
        case "bath-practice-back":
          view = editUid === null ? "catalogue" : "lesson";
          break;
        case "bath-home":
        case "bath-collections":
          view = "collections";
          break;
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
    if (
      oldId === "bath-home" ||
      oldId === "bath-collections" ||
      oldId === "bath-group-images" ||
      d.collection
    ) {
      announce("");
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
      results();
    }
  });
  root.addEventListener("change", (e) => {
    let redraw = true;
    switch (e.target.id) {
      case "bath-sort":
        sort = e.target.value;
        results();
        redraw = false;
        break;
      case "bath-level":
        draft.level = e.target.value;
        updateEdited();
        break;
      case "bath-instruction-form":
        draft.instructionForm = e.target.value;
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
  const linkedCollection = tree.get(location.hash.slice(1));
  if (
    linkedCollection?.status === "published" &&
    ["collection", "group"].includes(linkedCollection.kind)
  ) {
    if (linkedCollection.kind === "collection") {
      data = library.collections.get(linkedCollection.id);
      groupId = linkedCollection.parentId;
      view = "catalogue";
    } else {
      groupId = linkedCollection.id;
      view = "collections";
    }
  }
  render();
})();
