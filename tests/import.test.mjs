import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import {indexCollections} from '../public/assets/collection-data.js';
import {validItems} from '../worker/index.js';
const read=async p=>JSON.parse(await readFile(new URL('../'+p,import.meta.url),'utf8'));
test('alle nieuwe beelden, woordkoppelingen en lessen zijn bereikbaar en behouden unieke nummers',async()=>{
 const registry=await read('public/data/collections.json');
 const packages=await Promise.all(registry.nodes.filter(n=>n.status==='published'&&n.dataset).map(n=>read('public/data/'+n.dataset)));
 const library=indexCollections(packages); const assets=[...library.assets.values()];
 assert.equal(assets.filter(a=>a.id.startsWith('los-')).length,575);
 assert.equal(assets.filter(a=>/^won-\d+$/.test(a.id)).length,34);
 const concepts=new Set(assets.flatMap(a=>(a.concepts??[]).map(c=>c.id)));
 assert.equal(concepts.size,124);
 for (const a of assets) {
  assert.ok(validItems([{type:'image',n:a.n,uid:1}]));
  for (const r of Object.values(a.renditions)) for (const fmt of ['avif','webp']) assert.ok((await stat(new URL('../public/'+r[fmt],import.meta.url))).size>0);
  for (const l of a.methodLinks??[]) assert.ok(l.lesson && l.conceptId && l.url.startsWith('https://docent.lingua-academy.nl/'));
 }
 const ruim=assets.flatMap(a=>a.methodLinks??[]).filter(l=>l.word==='ruim');
 assert.ok(ruim.length>0 && ruim.every(l=>l.lesson==='VS-L40'));
 assert.ok(assets.some(a=>a.source?.driveFileId==='1QIcpRDSUjsU5Edhr-Qu20QnC7KMbZGkx' && a.words.includes('rijtjeshuis')));
 assert.ok(assets.some(a=>a.source?.driveFileId==='1mYS7G_layy7vHMsDGVkdPGCWV4_6SCW8' && a.words.includes('hoekhuis')));
});
