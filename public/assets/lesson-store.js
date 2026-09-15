export function browserLessonStore(onError, onSaved, storage) {
  const key = "taalroute-beeldbank-public-lesson-v1";
  let items = [],
    unsaved = false;
  try {
    const saved = JSON.parse(storage.getItem(key) || "[]");
    if (Array.isArray(saved)) items = saved;
  } catch {
    /* An unavailable browser store still allows trying the app. */
  }
  function persist() {
    try {
      storage.setItem(key, JSON.stringify(items));
      unsaved = false;
      onSaved();
    } catch {
      unsaved = true;
      onError(
        "Je browser kan deze lesselectie niet bewaren. Je kunt wel verder oefenen in dit venster.",
      );
    }
  }
  return {
    items,
    save(next) {
      items = structuredClone(next);
      persist();
    },
    retry: persist,
    dirty() {
      return unsaved;
    },
  };
}

export async function lessonStore(onError, onSaved, fetcher = fetch) {
  let response = await fetcher("/api/lesson", {
    headers: { accept: "application/json" },
    cache: "no-store",
  });
  if (
    response.status === 404 &&
    ["localhost", "127.0.0.1"].includes(location.hostname)
  ) {
    return {
      items: [],
      save() {},
      dirty() {
        return false;
      },
      retry() {},
    };
  }
  if (
    !response.ok ||
    !response.headers.get("content-type")?.includes("application/json")
  )
    throw new Error("Je lesselectie kon niet worden geladen.");
  const initial = await response.json();
  if (initial.storage === "browser") {
    let storage;
    try {
      storage = window.localStorage;
    } catch {
      storage = null;
    }
    return browserLessonStore(onError, onSaved, storage);
  }
  let revision = initial.revision,
    pending = null,
    saving = false,
    failed = false;
  async function flush() {
    if (saving || failed || pending === null) return;
    saving = true;
    while (pending !== null && !failed) {
      const items = pending;
      pending = null;
      let conflict = false;
      try {
        response = await fetcher("/api/lesson", {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ items, revision }),
          redirect: "error",
        });
        conflict = response.status === 409;
        if (!response.ok) throw new Error("Save failed");
        const result = await response.json();
        revision = result.revision;
      } catch (error) {
        pending ??= items;
        failed = true;
        onError(
          conflict
            ? "Je lesselectie is in een ander venster gewijzigd. Herlaad de pagina om die versie te openen."
            : "Je wijzigingen zijn nog niet opgeslagen. Controleer je verbinding en probeer opnieuw.",
        );
      }
    }
    saving = false;
    if (!failed) onSaved();
  }
  return {
    items: initial.items,
    save(items) {
      pending = structuredClone(items);
      void flush();
    },
    retry() {
      failed = false;
      void flush();
    },
    dirty() {
      return saving || pending !== null;
    },
  };
}
