(function () {
  'use strict';
  var books = Array.isArray(window.DAO_LIBRARY_BOOKS) ? window.DAO_LIBRARY_BOOKS : [];
  var state = { category: '全部', query: '', book: null, chapter: 0 };
  var STORAGE_KEY = 'daowen_library_state_v1';
  var SETTINGS_KEY = 'daowen_library_settings_v1';
  var shelf = document.getElementById('libraryShelf');
  var reader = document.getElementById('reader');
  var article = document.getElementById('readerArticle');

  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (char) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char];
    });
  }

  function readJson(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) || fallback; } catch (e) { return fallback; }
  }

  function saveProgress() {
    if (!state.book) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        bookId: state.book.id,
        chapterIndex: state.chapter,
        scrollTop: article.scrollTop,
        updatedAt: Date.now()
      }));
    } catch (e) {}
  }

  function categories() {
    return ['全部'].concat(Array.from(new Set(books.map(function (book) { return book.category; }))));
  }

  function renderFilters() {
    document.getElementById('libraryFilters').innerHTML = categories().map(function (category) {
      return '<button type="button" data-category="' + escapeHtml(category) + '" class="' + (category === state.category ? 'active' : '') + '">' + escapeHtml(category) + '</button>';
    }).join('');
  }

  function searchableText(book) {
    return [book.title, book.category, book.author, book.description].concat(book.chapters.flatMap(function (chapter) {
      return [chapter.title].concat(chapter.original, chapter.translation, chapter.terms.flat());
    })).join(' ').toLowerCase();
  }

  function visibleBooks() {
    var query = state.query.trim().toLowerCase();
    return books.filter(function (book) {
      return (state.category === '全部' || book.category === state.category) && (!query || searchableText(book).indexOf(query) >= 0);
    });
  }

  function renderShelf() {
    var progress = readJson(STORAGE_KEY, {});
    var list = visibleBooks();
    shelf.innerHTML = list.map(function (book, index) {
      var lastRead = progress.bookId === book.id ? ' · 上次读到「' + escapeHtml(book.chapters[progress.chapterIndex || 0].title) + '」' : '';
      return '<article class="book-card" data-book-id="' + escapeHtml(book.id) + '" style="--book-index:' + index + '">' +
        '<div class="book-cover"><span>' + escapeHtml(book.category) + '</span><b>' + escapeHtml(book.title) + '</b><i>道问校勘</i></div>' +
        '<div class="book-info"><p class="book-era">' + escapeHtml(book.dynasty) + '</p><h2>' + escapeHtml(book.title) + '</h2>' +
        '<p class="book-author">' + escapeHtml(book.author) + '</p><p class="book-desc">' + escapeHtml(book.description) + '</p>' +
        '<p class="book-status">首批校勘版 · ' + book.chapters.length + ' 章' + lastRead + '</p>' +
        '<button type="button" data-open-book="' + escapeHtml(book.id) + '">开始阅读</button></div></article>';
    }).join('');
    document.getElementById('libraryEmpty').hidden = list.length > 0;
  }

  function paragraphHtml(paragraphs) {
    return paragraphs.map(function (text) { return '<p>' + escapeHtml(text) + '</p>'; }).join('');
  }

  function openBook(bookId, chapterIndex, restoreScroll) {
    var book = books.find(function (item) { return item.id === bookId; });
    if (!book) return;
    state.book = book;
    state.chapter = Math.max(0, Math.min(Number(chapterIndex) || 0, book.chapters.length - 1));
    reader.classList.add('open');
    reader.setAttribute('aria-hidden', 'false');
    document.body.classList.add('reader-open');
    renderReader(restoreScroll);
    history.replaceState(null, '', '#read=' + encodeURIComponent(book.id) + '&chapter=' + state.chapter);
  }

  function renderReader(restoreScroll) {
    var book = state.book;
    var chapter = book.chapters[state.chapter];
    document.getElementById('readerBookName').textContent = book.title;
    document.getElementById('readerBookMeta').textContent = book.dynasty + ' · ' + book.author;
    document.getElementById('readerChapterTitle').textContent = chapter.title;
    document.getElementById('readerOriginal').innerHTML = paragraphHtml(chapter.original);
    document.getElementById('readerTranslation').innerHTML = paragraphHtml(chapter.translation);
    document.getElementById('readerTerms').innerHTML = chapter.terms.map(function (term) {
      return '<details><summary>' + escapeHtml(term[0]) + '</summary><p>' + escapeHtml(term[1]) + '</p></details>';
    }).join('');
    document.getElementById('readerSource').innerHTML = '原文校勘参考：<a href="' + escapeHtml(book.sourceUrl) + '" target="_blank" rel="noopener noreferrer">' + escapeHtml(book.sourceName) + '</a><br>白话解释为道问原创整理，仅作传统文化阅读参考。';
    document.getElementById('readerToc').innerHTML = '<h3>目录</h3>' + book.chapters.map(function (item, index) {
      return '<button type="button" data-chapter="' + index + '" class="' + (index === state.chapter ? 'active' : '') + '"><small>' + String(index + 1).padStart(2, '0') + '</small>' + escapeHtml(item.title) + '</button>';
    }).join('');
    document.getElementById('readerPrev').disabled = state.chapter === 0;
    document.getElementById('readerNext').disabled = state.chapter === book.chapters.length - 1;
    document.getElementById('readerProgress').style.width = (((state.chapter + 1) / book.chapters.length) * 100) + '%';
    article.scrollTop = restoreScroll || 0;
    saveProgress();
    article.focus({ preventScroll: true });
  }

  function closeReader() {
    saveProgress();
    reader.classList.remove('open');
    reader.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('reader-open');
    document.getElementById('readerToc').classList.remove('mobile-open');
    document.getElementById('readerSettings').classList.remove('open');
    history.replaceState(null, '', location.pathname);
    renderShelf();
  }

  function selectChapter(index) {
    saveProgress();
    state.chapter = index;
    renderReader(0);
    document.getElementById('readerToc').classList.remove('mobile-open');
    document.getElementById('readerTocToggle').setAttribute('aria-expanded', 'false');
    history.replaceState(null, '', '#read=' + encodeURIComponent(state.book.id) + '&chapter=' + state.chapter);
  }

  function applySettings(settings) {
    document.documentElement.style.setProperty('--reader-size', settings.fontSize + 'px');
    document.documentElement.style.setProperty('--reader-line', String(settings.lineHeight / 10));
    document.body.classList.toggle('paper-mode', !!settings.paperMode);
    document.getElementById('fontSizeSetting').value = settings.fontSize;
    document.getElementById('lineHeightSetting').value = settings.lineHeight;
    document.getElementById('paperModeSetting').checked = !!settings.paperMode;
  }

  function currentSettings() {
    return readJson(SETTINGS_KEY, { fontSize: 20, lineHeight: 19, paperMode: false });
  }

  function updateSettings() {
    var settings = {
      fontSize: Number(document.getElementById('fontSizeSetting').value),
      lineHeight: Number(document.getElementById('lineHeightSetting').value),
      paperMode: document.getElementById('paperModeSetting').checked
    };
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); } catch (e) {}
    applySettings(settings);
  }

  document.getElementById('libraryFilters').addEventListener('click', function (event) {
    var button = event.target.closest('[data-category]');
    if (!button) return;
    state.category = button.dataset.category;
    renderFilters(); renderShelf();
  });
  document.getElementById('librarySearch').addEventListener('input', function (event) { state.query = event.target.value; renderShelf(); });
  document.getElementById('librarySearchClear').addEventListener('click', function () { state.query = ''; document.getElementById('librarySearch').value = ''; renderShelf(); });
  shelf.addEventListener('click', function (event) { var button = event.target.closest('[data-open-book]'); if (button) openBook(button.dataset.openBook, 0, 0); });
  document.getElementById('readerClose').addEventListener('click', closeReader);
  document.getElementById('readerToc').addEventListener('click', function (event) { var button = event.target.closest('[data-chapter]'); if (button) selectChapter(Number(button.dataset.chapter)); });
  document.getElementById('readerPrev').addEventListener('click', function () { if (state.chapter > 0) selectChapter(state.chapter - 1); });
  document.getElementById('readerNext').addEventListener('click', function () { if (state.chapter < state.book.chapters.length - 1) selectChapter(state.chapter + 1); });
  document.getElementById('readerTocToggle').addEventListener('click', function (event) { var open = document.getElementById('readerToc').classList.toggle('mobile-open'); event.currentTarget.setAttribute('aria-expanded', String(open)); });
  document.getElementById('readerSettingsToggle').addEventListener('click', function (event) { var open = document.getElementById('readerSettings').classList.toggle('open'); event.currentTarget.setAttribute('aria-expanded', String(open)); });
  document.getElementById('readerSettingsClose').addEventListener('click', function () { document.getElementById('readerSettings').classList.remove('open'); document.getElementById('readerSettingsToggle').setAttribute('aria-expanded', 'false'); });
  ['fontSizeSetting','lineHeightSetting','paperModeSetting'].forEach(function (id) { document.getElementById(id).addEventListener('input', updateSettings); });
  document.querySelectorAll('[data-toggle-block]').forEach(function (button) {
    button.addEventListener('click', function () { var section = button.closest('.text-block'); var collapsed = section.classList.toggle('collapsed'); button.textContent = collapsed ? '展开' : '收起'; });
  });
  article.addEventListener('scroll', function () {
    var max = article.scrollHeight - article.clientHeight;
    var chapterBase = state.chapter / state.book.chapters.length;
    var within = max > 0 ? (article.scrollTop / max) / state.book.chapters.length : 0;
    document.getElementById('readerProgress').style.width = Math.min(100, (chapterBase + within) * 100) + '%';
    clearTimeout(article._saveTimer); article._saveTimer = setTimeout(saveProgress, 180);
  });
  document.addEventListener('keydown', function (event) { if (event.key === 'Escape' && reader.classList.contains('open')) closeReader(); });

  applySettings(currentSettings());
  renderFilters(); renderShelf();
  var hash = new URLSearchParams(location.hash.replace(/^#/, ''));
  if (hash.get('read')) openBook(hash.get('read'), Number(hash.get('chapter') || 0), 0);
  else {
    var progress = readJson(STORAGE_KEY, null);
    if (progress && progress.bookId) document.querySelector('[data-book-id="' + progress.bookId + '"]')?.classList.add('last-read');
  }
})();
