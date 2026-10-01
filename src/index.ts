import type { Sentence, Stats } from './types';

// ============ التخزين ============
const STORAGE_KEY = 'sentence-memo-data';

function loadSentences(): Sentence[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Sentence[]) : [];
  } catch {
    return [];
  }
}

function saveSentences(sentences: Sentence[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sentences));
}

// ============ الحالة ============
let sentences: Sentence[] = loadSentences();
let searchQuery = '';
let currentPage = 0;
let lastScrollTop = 0;
const PAGE_SIZE = 100;

// ============ الألوان ============
const C = {
  bg: '#0f0f1e',
  card: '#1a1a2e',
  cardHover: '#252542',
  primary: '#7c3aed',
  accent: '#06b6d4',
  success: '#10b981',
  danger: '#ef4444',
  text: '#e5e7eb',
  muted: '#6b7280',
  border: '#2d2d44',
  subtitle: '#94a3b8',
};

// ============ أداة بناء DOM ============
type ElProps<T extends keyof HTMLElementTagNameMap> = Partial<
  Omit<HTMLElementTagNameMap[T], 'style' | 'children'>
> & {
  style?: Partial<CSSStyleDeclaration>;
};

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: ElProps<K> = {},
  ...children: (Node | string)[]
): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  const { style, ...rest } = props;
  Object.assign(e, rest);
  if (style) Object.assign(e.style, style);
  children.forEach((c) => e.append(c));
  return e;
}

// ============ الإحصائيات ============
function getStats(): Stats {
  const total = sentences.length;
  const done = sentences.filter((s) => s.done).length;
  return {
    total,
    done,
    remaining: total - done,
    percent: total ? Math.round((done / total) * 100) : 0,
  };
}

// ============ الفلترة ============
function getFiltered(): Sentence[] {
  if (!searchQuery.trim()) return sentences;
  const q = searchQuery.toLowerCase();
  return sentences.filter(
    (s) =>
      s.text.toLowerCase().includes(q) ||
      s.translation.toLowerCase().includes(q)
  );
}

// ============ Header ============
function renderHeader(): HTMLElement {
  const s = getStats();
  return el(
    'header',
    {
      style: {
        padding: '20px 30px',
        background: 'linear-gradient(135deg, #7c3aed 0%, #06b6d4 100%)',
        color: '#fff',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '15px',
        boxShadow: '0 4px 20px rgba(124,58,237,0.3)',
      },
    },
    el(
      'h1',
      { style: { margin: '0', fontSize: '24px', fontWeight: '800' } },
      '📚 حافظ الجمل'
    ),
    el(
      'div',
      {
        style: {
          display: 'flex',
          gap: '20px',
          fontSize: '14px',
          fontWeight: '600',
          alignItems: 'center',
        },
      },
      el('span', {}, `✅ ${s.done}`),
      el('span', {}, `📝 ${s.remaining}`),
      el('span', {}, `📊 ${s.total}`),
      el(
        'span',
        { style: { fontSize: '22px', fontWeight: '800' } },
        `${s.percent}%`
      )
    )
  );
}

// ============ شريط التقدم ============
function renderProgress(): HTMLElement {
  const s = getStats();
  return el(
    'div',
    { style: { height: '6px', background: C.border, width: '100%' } },
    el('div', {
      style: {
        height: '100%',
        width: `${s.percent}%`,
        background: 'linear-gradient(90deg, #10b981, #06b6d4)',
        transition: 'width 0.4s ease',
      },
    })
  );
}

// ============ شريط الأدوات ============
function renderToolbar(): HTMLElement {
  const search = el('input', {
    id: 'search-input',
    type: 'text',
    placeholder: '🔍 ابحث في الجمل...',
    value: searchQuery,
    style: {
      flex: '1',
      minWidth: '200px',
      padding: '12px 18px',
      border: `2px solid ${C.border}`,
      borderRadius: '12px',
      background: C.card,
      color: C.text,
      fontSize: '14px',
      outline: 'none',
      fontFamily: 'inherit',
    },
  });
  search.addEventListener('input', () => {
    searchQuery = search.value;
    currentPage = 0;
    render();
    const input = document.querySelector<HTMLInputElement>('#search-input');
    if (input) {
      input.focus();
      input.setSelectionRange(input.value.length, input.value.length);
    }
  });

  const makeBtn = (
    label: string,
    bg: string,
    color: string,
    handler: () => void
  ) => {
    const b = el(
      'button',
      {
        style: {
          padding: '12px 20px',
          border: 'none',
          borderRadius: '12px',
          background: bg,
          color,
          fontSize: '14px',
          fontWeight: '700',
          cursor: 'pointer',
          fontFamily: 'inherit',
          transition: 'transform 0.15s',
          whiteSpace: 'nowrap',
        },
      },
      label
    );
    b.addEventListener('mouseenter', () => (b.style.transform = 'translateY(-2px)'));
    b.addEventListener('mouseleave', () => (b.style.transform = 'translateY(0)'));
    b.addEventListener('click', handler);
    return b;
  };

  const btnAdd = makeBtn('✏️ إدراج الجمل', C.primary, '#fff', openAddDialog);
  const btnReset = makeBtn('🔄 إعادة تعيين', C.card, C.text, () => {
    if (!confirm('إعادة تعيين كل الشطب؟')) return;
    sentences = sentences.map((s) => ({ ...s, done: false }));
    saveSentences(sentences);
    render();
  });
  const btnClear = makeBtn('🗑️ مسح الكل', C.danger, '#fff', () => {
    if (!confirm('مسح كل الجمل نهائياً؟')) return;
    sentences = [];
    saveSentences(sentences);
    render();
  });

  return el(
    'div',
    {
      style: {
        padding: '15px 30px',
        display: 'flex',
        gap: '10px',
        background: C.card,
        borderBottom: `1px solid ${C.border}`,
        flexWrap: 'wrap',
      },
    },
    search,
    btnAdd,
    btnReset,
    btnClear
  );
}

// ============ بطاقة جملة ============
function renderSentenceCard(s: Sentence): HTMLElement {
  const card = el('div', {
    style: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: '15px',
      padding: '16px 20px',
      margin: '8px 30px',
      background: s.done ? 'rgba(16,185,129,0.08)' : C.card,
      borderRadius: '14px',
      borderRight: `4px solid ${s.done ? C.success : C.accent}`,
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      opacity: s.done ? '0.7' : '1',
    },
  });

  card.addEventListener('mouseenter', () => {
    card.style.background = s.done ? 'rgba(16,185,129,0.14)' : C.cardHover;
    card.style.transform = 'translateX(-4px)';
  });
  card.addEventListener('mouseleave', () => {
    card.style.background = s.done ? 'rgba(16,185,129,0.08)' : C.card;
    card.style.transform = 'translateX(0)';
  });

  const checkbox = el('div', {
    style: {
      width: '26px',
      height: '26px',
      minWidth: '26px',
      border: `2px solid ${s.done ? C.success : C.accent}`,
      borderRadius: '8px',
      background: s.done ? C.success : 'transparent',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#fff',
      fontWeight: '800',
      fontSize: '16px',
      marginTop: '2px',
      transition: 'all 0.2s ease',
    },
  });
  if (s.done) checkbox.textContent = '✓';

  const content = el(
    'div',
    { style: { flex: '1', minWidth: '0' } },
    el(
      'div',
      {
        style: {
          fontSize: '17px',
          fontWeight: '700',
          color: s.done ? C.muted : C.text,
          textDecoration: s.done ? 'line-through' : 'none',
          marginBottom: s.translation ? '6px' : '0',
          lineHeight: '1.7',
          wordBreak: 'break-word',
        },
      },
      s.text
    ),
    s.translation
      ? el(
          'div',
          {
            style: {
              fontSize: '15px',
              color: s.done ? C.muted : C.subtitle,
              textDecoration: s.done ? 'line-through' : 'none',
              lineHeight: '1.7',
              wordBreak: 'break-word',
            },
          },
          s.translation
        )
      : ''
  );

  card.append(checkbox, content);
  card.addEventListener('click', () => {
    s.done = !s.done;
    saveSentences(sentences);
    const list = document.querySelector<HTMLElement>('#list-container');
    if (list) lastScrollTop = list.scrollTop;
    render();
  });

  return card;
}

// ============ قائمة الجمل ============
function renderList(): HTMLElement {
  const filtered = getFiltered();
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE) || 1;
  if (currentPage >= totalPages) currentPage = totalPages - 1;

  const pageItems = filtered.slice(
    currentPage * PAGE_SIZE,
    (currentPage + 1) * PAGE_SIZE
  );

  const container = el('div', {
    style: { flex: '1', overflowY: 'auto', padding: '10px 0' },
  });
  container.id = 'list-container';
  container.addEventListener('scroll', () => {
    lastScrollTop = container.scrollTop;
  });

  if (pageItems.length === 0) {
    container.append(
      el(
        'div',
        {
          style: {
            textAlign: 'center',
            padding: '60px 20px',
            color: C.muted,
            fontSize: '16px',
          },
        },
        sentences.length === 0
          ? 'لا توجد جمل بعد. اضغط "إدراج الجمل" للبدء 📝'
          : 'لا توجد نتائج مطابقة 🔍'
      )
    );
  } else {
    pageItems.forEach((s) => container.append(renderSentenceCard(s)));
  }

  const makePageBtn = (label: string, disabled: boolean, onClick: () => void) => {
    const b = el(
      'button',
      {
        style: {
          padding: '8px 18px',
          border: 'none',
          borderRadius: '8px',
          background: disabled ? C.border : C.primary,
          color: '#fff',
          cursor: disabled ? 'not-allowed' : 'pointer',
          fontFamily: 'inherit',
          fontWeight: '600',
          fontSize: '14px',
        },
      },
      label
    );
    if (!disabled) b.addEventListener('click', onClick);
    return b;
  };

  const pagination = el(
    'div',
    {
      style: {
        padding: '15px 30px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '15px',
        background: C.card,
        borderTop: `1px solid ${C.border}`,
        flexWrap: 'wrap',
      },
    },
    makePageBtn('◀ السابق', currentPage === 0, () => {
      currentPage--;
      render();
    }),
    el(
      'span',
      { style: { color: C.text, fontSize: '14px', fontWeight: '600' } },
      `صفحة ${currentPage + 1} من ${totalPages} (${filtered.length} جملة)`
    ),
    makePageBtn('التالي ▶', currentPage >= totalPages - 1, () => {
      currentPage++;
      render();
    })
  );

  return el(
    'div',
    {
      style: {
        flex: '1',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      },
    },
    container,
    pagination
  );
}

// ============ نافذة الإدراج ============
function openAddDialog() {
  const overlay = el('div', {
    style: {
      position: 'fixed',
      inset: '0',
      background: 'rgba(0,0,0,0.75)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: '100',
      padding: '20px',
    },
  });

  const textarea = el('textarea', {
    placeholder:
      'Hello World | مرحبا بالعالم\nHow are you? | كيف حالك؟\n\nكل جملة في سطر، افصل بين الجملة والترجمة بـ |',
    style: {
      width: '100%',
      height: '320px',
      padding: '15px',
      border: `2px solid ${C.border}`,
      borderRadius: '12px',
      background: C.bg,
      color: C.text,
      fontSize: '14px',
      fontFamily: 'inherit',
      resize: 'vertical',
      outline: 'none',
      lineHeight: '1.8',
      direction: 'rtl',
      boxSizing: 'border-box',
    },
  });

  const makeBtn = (label: string, bg: string, color: string, onClick: () => void) => {
    const b = el(
      'button',
      {
        style: {
          padding: '12px 24px',
          border: 'none',
          borderRadius: '10px',
          background: bg,
          color,
          cursor: 'pointer',
          fontFamily: 'inherit',
          fontWeight: '700',
          fontSize: '14px',
        },
      },
      label
    );
    b.addEventListener('click', onClick);
    return b;
  };

  const dialog = el(
    'div',
    {
      style: {
        background: C.card,
        borderRadius: '20px',
        padding: '30px',
        width: '700px',
        maxWidth: '100%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
      },
    },
    el(
      'h2',
      { style: { color: C.text, margin: '0 0 10px', fontSize: '22px' } },
      '✏️ إدراج الجمل'
    ),
    el(
      'p',
      { style: { color: C.muted, fontSize: '13px', margin: '0 0 15px' } },
      'كل جملة في سطر واحد بالشكل: الجملة | الترجمة'
    ),
    textarea,
    el(
      'div',
      {
        style: {
          display: 'flex',
          gap: '10px',
          marginTop: '20px',
          justifyContent: 'flex-end',
        },
      },
      makeBtn('إلغاء', C.border, C.text, () => overlay.remove()),
      makeBtn('💾 حفظ الجمل', C.success, '#fff', () => {
        const lines = textarea.value
          .split('\n')
          .map((l) => l.trim())
          .filter(Boolean);

        let nextId = sentences.length
          ? Math.max(...sentences.map((s) => s.id)) + 1
          : 1;

        const added: Sentence[] = [];
        lines.forEach((line) => {
          const idx = line.indexOf('|');
          const t = idx >= 0 ? line.slice(0, idx).trim() : line.trim();
          const tr = idx >= 0 ? line.slice(idx + 1).trim() : '';
          if (t) {
            added.push({ id: nextId++, text: t, translation: tr, done: false });
          }
        });

        sentences.push(...added);
        saveSentences(sentences);
        overlay.remove();
        render();
        alert(`✅ تمت إضافة ${added.length} جملة`);
      })
    )
  );

  overlay.append(dialog);
  document.body.append(overlay);
  textarea.focus();
}

// ============ الرسم الرئيسي ============
function render() {
  const root = document.getElementById('app');
  if (!root) return;

  const existingList = root.querySelector<HTMLElement>('#list-container');
  if (existingList) lastScrollTop = existingList.scrollTop;

  root.innerHTML = '';
  root.style.cssText = `
    display: flex;
    flex-direction: column;
    height: 100vh;
    background: ${C.bg};
    font-family: 'Segoe UI', Tahoma, Arial, sans-serif;
    direction: rtl;
    overflow: hidden;
    color: ${C.text};
  `;

  root.append(renderHeader());
  root.append(renderProgress());
  root.append(renderToolbar());
  root.append(renderList());

  const newList = root.querySelector<HTMLElement>('#list-container');
  if (newList) newList.scrollTop = lastScrollTop;
}

// ============ الإقلاع ============
document.body.style.cssText = 'margin:0; padding:0; overflow:hidden;';
render();