// Stable image numbers keep existing lesson selections valid across collections.
export function indexCollections(packages) {
  const collections = new Map(),
    assets = new Map(),
    sequences = new Map();
  for (const data of packages) {
    const collectionId = data.collection.id;
    if (collections.has(collectionId)) throw new Error("Dubbele collectie-ID.");
    collections.set(collectionId, data);
    for (const asset of data.assets) {
      if (assets.has(asset.n)) throw new Error("Dubbel beeldnummer.");
      assets.set(asset.n, { ...asset, collectionId });
    }
    for (const sequence of data.sequences) {
      if (sequences.has(sequence.id)) throw new Error("Dubbele reeks-ID.");
      if (sequence.steps.some((n) => !data.assets.some((a) => a.n === n)))
        throw new Error("Een reeks verwijst naar een ontbrekend beeld.");
      sequences.set(sequence.id, { ...sequence, collectionId });
    }
  }
  return { collections, assets, sequences };
}
