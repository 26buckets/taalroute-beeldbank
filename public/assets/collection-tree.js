export function collectionTree(nodes) {
  const byId = new Map(nodes.map((node) => [node.id, node]));
  if (byId.size !== nodes.length) throw new Error("Dubbele collectie-ID.");

  function trail(id) {
    const result = [];
    const visited = new Set();
    let node = byId.get(id);
    if (!node) throw new Error(`Onbekende collectie: ${id}`);
    while (node) {
      if (visited.has(node.id))
        throw new Error("Cirkel in de collectie-indeling.");
      visited.add(node.id);
      result.unshift(node);
      if (!node.parentId) break;
      const parent = byId.get(node.parentId);
      if (!parent)
        throw new Error(`Bovenliggende collectie ontbreekt: ${node.parentId}`);
      node = parent;
    }
    return result;
  }

  nodes.forEach((node) => trail(node.id));
  const children = (parentId = null) =>
    nodes.filter(
      (node) => node.parentId === parentId && node.status === "published",
    );
  function leaves(id) {
    const node = byId.get(id);
    if (!node || node.status !== "published") return [];
    return node.kind === "collection"
      ? [node]
      : children(id).flatMap((child) => leaves(child.id));
  }
  return { get: (id) => byId.get(id), trail, children, leaves };
}
