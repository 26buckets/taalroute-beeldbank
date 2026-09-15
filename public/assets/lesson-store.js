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
