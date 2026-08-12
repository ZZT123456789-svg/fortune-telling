const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.join(__dirname, '..');

function loadBooks() {
  const context = {};
  context.globalThis = context;
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'data', 'library-books.js'), 'utf8'), context);
  return JSON.parse(JSON.stringify(context.DAO_LIBRARY_BOOKS));
}

test('书库首批同时包含指定五本古籍', () => {
  const books = loadBooks();
  assert.deepEqual(books.map(book => book.title), ['滴天髓','渊海子平','三命通会','周易','紫微斗数全书']);
  for (const book of books) {
    assert.ok(book.chapters.length >= 4, book.title + ' 至少应有四章首批内容');
    assert.match(book.sourceUrl, /^https:\/\//);
  }
});

test('每章均提供原文、原创白话与术语注释', () => {
  for (const book of loadBooks()) {
    for (const chapter of book.chapters) {
      assert.ok(chapter.original.join('').length > 8, book.title + chapter.title + ' 缺少原文');
      assert.ok(chapter.translation.join('').length > 20, book.title + chapter.title + ' 缺少白话解释');
      assert.ok(chapter.terms.length > 0, book.title + chapter.title + ' 缺少术语');
    }
  }
});

test('首页和生产路由均可进入独立书库', () => {
  const index = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const library = fs.readFileSync(path.join(ROOT, 'library.html'), 'utf8');
  const vercel = JSON.parse(fs.readFileSync(path.join(ROOT, 'vercel.json'), 'utf8'));
  assert.match(index, /命理书库/);
  assert.match(index, /window\.location\.href='library\.html'/);
  assert.ok(vercel.rewrites.some(rule => rule.source === '/library' && rule.destination === '/library.html'));
  assert.match(library, /古籍原文在上，原创白话解释在下/);
  assert.match(library, /data\/library-books\.js/);
  assert.match(library, /js\/library\.js/);
});

test('阅读器支持搜索、目录、进度与手机端布局', () => {
  const script = fs.readFileSync(path.join(ROOT, 'js', 'library.js'), 'utf8');
  const css = fs.readFileSync(path.join(ROOT, 'css', 'library.css'), 'utf8');
  assert.match(script, /localStorage\.setItem\(STORAGE_KEY/);
  assert.match(script, /searchableText/);
  assert.match(script, /data-chapter/);
  assert.match(script, /paperMode/);
  assert.match(css, /@media\(max-width:760px\)/);
  assert.match(css, /reader-toc\.mobile-open/);
});
