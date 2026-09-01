const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

test('tarot dataset contains a unique complete 78-card deck', () => {
  const deck = JSON.parse(read('data/tarot-cards.en.json'));
  assert.equal(deck.length, 78);
  assert.equal(new Set(deck.map((card) => card.id)).size, 78);
  assert.equal(deck.filter((card) => card.arcana === 'major').length, 22);
  assert.equal(deck.filter((card) => card.arcana !== 'major').length, 56);
  deck.forEach((card) => {
    assert.ok(card.name);
    assert.ok(Array.isArray(card.keywords_upright));
    assert.ok(card.meaning_reversed);
  });
});

test('tarot supports all agreed spreads and secure draw behavior', () => {
  const source = read('js/tarot.js');
  for (const spread of ['single', 'three', 'love', 'career', 'celtic']) {
    assert.match(source, new RegExp(`${spread}:`));
  }
  assert.match(source, /window\.crypto\.getRandomValues/);
  assert.match(source, /this\.locked=true/);
  assert.match(source, /setTimeout\(function\(\)\{TarotModule\._revealAll/);
  assert.match(source, /undoCard/);
});

test('tarot AI cost is enforced by the server from spread type', () => {
  const api = read('api/ai-tarot-reading.js');
  assert.match(api, /reading\.spread === 'celtic' \? 2 : 1/);
  assert.match(api, /celtic: 10/);
  assert.match(api, /new Set\(cards\.map/);
  assert.match(api, /api_consume_credits/);
  assert.match(api, /AI 服务暂不可用，本次未扣费/);
});

test('tarot UI provides shuffle-first three-row horizontal spread, vertical results and reduced motion', () => {
  const html = read('index.html');
  const css = read('css/tarot.css');
  const js = read('js/tarot.js');
  assert.match(html, /id="tarotReversalToggle" checked/);
  assert.match(html, /id="tarotQuestion"/);
  assert.match(css, /scroll-snap-type:\s*x proximity/);
  assert.match(css, /grid-template-rows:\s*repeat\(3,/);
  assert.match(css, /grid-auto-flow:\s*column/);
  assert.match(css, /\.tarot-carousel\.is-shuffling/);
  assert.match(css, /@keyframes tarotSpreadRight/);
  assert.match(js, /this\.shuffling\|\|this\.locked/);
  assert.match(css, /\.tarot-reading-list\s*\{\s*display:\s*grid/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
});

test('all local RWS artwork files exist after vendoring', () => {
  const cardsDir = path.join(root, 'assets', 'tarot', 'cards');
  const images = fs.existsSync(cardsDir) ? fs.readdirSync(cardsDir).filter((file) => /\.jpg$/i.test(file)) : [];
  assert.equal(images.length, 78);
  for (let id = 0; id < 78; id += 1) {
    const image = path.join(cardsDir, String(id).padStart(2, '0') + '.jpg');
    assert.ok(fs.existsSync(image), `missing card image ${id}`);
    assert.ok(fs.statSync(image).size > 10000, `card image ${id} is too small`);
  }
});
