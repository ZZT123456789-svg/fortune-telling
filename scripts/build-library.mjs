import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const SOURCE_ROOT = path.join(ROOT, 'scripts', 'library-sources');
const API = 'https://zh.wikisource.org/w/api.php';
const HEXAGRAMS = ['乾','坤','屯','蒙','需','訟','師','比','小畜','履','泰','否','同人','大有','謙','豫','隨','蠱','臨','觀','噬嗑','賁','剝','復','無妄','大畜','頤','大過','坎','離','咸','恆','遯','大壯','晉','明夷','家人','睽','蹇','解','損','益','夬','姤','萃','升','困','井','革','鼎','震','艮','漸','歸妹','豐','旅','巽','兌','渙','節','中孚','小過','既濟','未濟'];

const BOOKS = [
  { id:'ditiansui', title:'滴天髓', category:'八字', dynasty:'明清命学', author:'题刘基撰，陈素庵辑', description:'《滴天髓辑要》原文及传本注文，讨论天干地支、阴阳五行、格局与命局气势。', pages:[{ title:'滴天髓', label:'滴天髓辑要' }], sourceName:'维基文库《滴天髓》', sourceUrl:'https://zh.wikisource.org/zh-hans/滴天髓' },
  { id:'yuanhaiziping', title:'渊海子平', category:'八字', dynasty:'宋元命学汇编', author:'题徐大升编', description:'《渊海子平大全》原文，涵盖五行、干支、格局、六亲、神煞、诗诀与行运。', pages:[{ title:'淵海子平大全', label:'渊海子平大全' }], sourceName:'维基文库《渊海子平大全》', sourceUrl:'https://zh.wikisource.org/zh-hans/淵海子平大全' },
  { id:'sanmingtonghui', title:'三命通会', category:'八字', dynasty:'明', author:'万民英', description:'四库全书本十二卷原文，汇总传统命学理论、格局、神煞、命例与诸赋。', pages:Array.from({length:12},(_,i)=>({ title:`三命通會 (四庫全書本)/卷${String(i+1).padStart(2,'0')}`, label:`卷${String(i+1).padStart(2,'0')}` })), sourceName:'维基文库《三命通会》（四库全书本）', sourceUrl:'https://zh.wikisource.org/zh-hans/三命通會_(四庫全書本)' },
  { id:'zhouyi', title:'周易', category:'易经', dynasty:'先秦经典', author:'传统经典，历代传承', description:'六十四卦卦辞、爻辞及页面所收彖、象等原文。', pages:HEXAGRAMS.map((name,i)=>({ title:`周易/${name}`, label:`${String(i+1).padStart(2,'0')} · ${name}卦`, forceSingle:true })), sourceName:'维基文库《周易》', sourceUrl:'https://zh.wikisource.org/zh-hans/周易' },
  { id:'ziweiquanshu', title:'紫微斗数全书', category:'紫微', dynasty:'明代传本', author:'传统题罗洪先序', description:'全览本原文，包含安星法、十二宫、星曜、格局、诸赋与运限论法。', pages:[{ title:'紫微斗數全書/全覽', label:'紫微斗数全书' }], sourceName:'维基文库《紫微斗数全书》全览', sourceUrl:'https://zh.wikisource.org/zh-hans/紫微斗數全書/全覽' }
];

const SOURCE_FILES = {
  ditiansui: 'ditiansui.txt',
  yuanhaiziping: 'yuanhaiziping.txt',
  sanmingtonghui: 'sanmingtonghui.txt',
  zhouyi: 'zhouyi.txt',
  ziweiquanshu: 'ziweiquanshu.txt'
};

function chaptersFromText(book, text) {
  const lines = String(text || '').replace(/^\uFEFF/, '').replace(/\r/g, '').split('\n')
    .map(line => line.replace(/[ \t\u00a0]+$/g, '')).filter(line => line.trim());
  const chapters = [];
  let chunk = [];
  let length = 0;
  // 约三千汉字一篇，手机端打开和滚动更顺畅，也避免单章 DOM 过大。
  const targetSize = 3000;

  function flush() {
    if (!chunk.length) return;
    const index = chapters.length + 1;
    chapters.push({
      id: `${book.id}-${index}`,
      title: `原文第${String(index).padStart(2, '0')}篇`,
      original: chunk
    });
    chunk = [];
    length = 0;
  }

  for (const line of lines) {
    if (length >= targetSize) flush();
    chunk.push(line);
    length += line.length;
  }
  flush();
  return chapters;
}

function decode(text) {
  const named = { amp:'&', lt:'<', gt:'>', quot:'"', apos:"'", nbsp:' ', ensp:' ', emsp:' ', ndash:'–', mdash:'—' };
  return String(text || '').replace(/&#(x?[0-9a-f]+);/gi, (_,n)=>String.fromCodePoint(n[0].toLowerCase()==='x'?parseInt(n.slice(1),16):parseInt(n,10))).replace(/&([a-z]+);/gi, (_,n)=>named[n] ?? '');
}

function plain(html) {
  return decode(String(html || '')
    .replace(/<style[\s\S]*?<\/style>|<script[\s\S]*?<\/script>|<sup[^>]*class="reference"[\s\S]*?<\/sup>/gi,'')
    .replace(/<br\s*\/?\s*>/gi,'\n').replace(/<\/(p|li|dd|dt|div|blockquote)>/gi,'\n')
    .replace(/<[^>]+>/g,'')).replace(/[ \t\u00a0]+/g,' ').replace(/\n\s*\n+/g,'\n').trim();
}

function slug(value, index) {
  return plain(value).toLowerCase().replace(/[^\p{L}\p{N}]+/gu,'-').replace(/^-|-$/g,'').slice(0,70) || `chapter-${index+1}`;
}

function sectionsFromHtml(html, page) {
  const cleaned = String(html || '').replace(/<table[^>]*class="[^\"]*(?:ws-header|navbox|ambox)[^\"]*"[\s\S]*?<\/table>/gi,'');
  if (page.forceSingle) {
    const body = plain(cleaned);
    return body ? [{ id:slug(page.label,0), title:page.label, original:body.split('\n').filter(Boolean) }] : [];
  }
  const tokens = cleaned.split(/(<h[2-4][^>]*>[\s\S]*?<\/h[2-4]>)/gi);
  const sections = [];
  let title = page.label;
  let buffer = [];
  function flush() {
    const text = plain(buffer.join(''));
    buffer = [];
    if (!text || text.length < 8) return;
    const cleanTitle = title.replace(/\[?编辑\]?/g,'').trim();
    if (!cleanTitle || /^(目录|导航|参见|注释|参考资料|外部链接)$/.test(cleanTitle)) return;
    sections.push({ id:slug(`${page.label}-${cleanTitle}`,sections.length), title:cleanTitle === page.label ? page.label : `${page.label} · ${cleanTitle}`, original:text.split('\n').filter(Boolean) });
  }
  for (const token of tokens) {
    if (/^<h[2-4]/i.test(token)) { flush(); title = plain(token); }
    else buffer.push(token);
  }
  flush();
  return sections;
}

async function fetchPage(page) {
  const url = `${API}?action=parse&prop=text&format=json&formatversion=2&variant=zh-hans&origin=*&page=${encodeURIComponent(page.title)}`;
  let response;
  let lastError;
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    try {
      response = await fetch(url, { headers:{ 'User-Agent':'DaoWen-library-builder/1.0' }, signal:AbortSignal.timeout(30000) });
      break;
    } catch (error) {
      lastError = error;
      await new Promise(resolve => setTimeout(resolve, attempt * 1500));
    }
  }
  if (!response) throw new Error(`${page.title}: ${lastError?.message || 'network failed'}`);
  if (!response.ok) throw new Error(`${page.title}: HTTP ${response.status}`);
  const data = await response.json();
  if (data.error || !data.parse?.text) throw new Error(`${page.title}: ${data.error?.info || 'empty page'}`);
  return sectionsFromHtml(data.parse.text, page);
}

async function mapLimit(items, limit, worker) {
  const out = new Array(items.length); let cursor = 0;
  await Promise.all(Array.from({length:Math.min(limit,items.length)}, async()=>{ while (cursor < items.length) { const i = cursor++; out[i] = await worker(items[i]); } }));
  return out;
}

for (const book of BOOKS) {
  const sourceFile = SOURCE_FILES[book.id];
  const sourceText = await fs.readFile(path.join(SOURCE_ROOT, sourceFile), 'utf8');
  book.chapters = chaptersFromText(book, sourceText);
  delete book.pages;
  if (!book.chapters.length) throw new Error(`${book.title}: no chapters`);
  console.log(`${book.title}: ${book.chapters.length} chapters, ${book.chapters.reduce((n,c)=>n+c.original.join('').length,0)} chars`);
}

const payload = `(function(root){'use strict';root.DAO_LIBRARY_BOOKS=${JSON.stringify(BOOKS)};})(typeof window!=='undefined'?window:globalThis);\n`;
await fs.writeFile(path.join(ROOT,'data','library-books.js'), payload, 'utf8');
