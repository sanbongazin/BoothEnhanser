const DEBOUNCE_MS = 250;

/**
 * キーワード検索欄。入力のたびに親(index.ts)のrender()を呼ぶと、日本語入力(IME)の
 * 変換中に再描画が挟まってカーソル位置や変換候補が壊れるため、
 * - IME変換中(compositionstart〜compositionend)はonChangeを呼ばない
 * - 通常入力もDEBOUNCE_MSだけ間引く
 * ようにしている。フォーカス/カーソル位置の再描画後の復元はindex.ts側(render())で行う。
 */
export function renderSearchControl(query: string, onChange: (query: string) => void): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = 'be-search';

  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'be-search__input';
  input.placeholder = '商品名・ショップ名・対応アバターで検索';
  input.value = query;
  input.autocomplete = 'off';

  let composing = false;
  let debounceTimer: ReturnType<typeof setTimeout> | undefined;

  const scheduleChange = () => {
    if (debounceTimer !== undefined) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => onChange(input.value), DEBOUNCE_MS);
  };

  input.addEventListener('compositionstart', () => {
    composing = true;
  });
  input.addEventListener('compositionend', () => {
    composing = false;
    scheduleChange();
  });
  input.addEventListener('input', () => {
    if (composing) return;
    scheduleChange();
  });

  wrap.appendChild(input);

  if (query) {
    const clearButton = document.createElement('button');
    clearButton.type = 'button';
    clearButton.className = 'be-search__clear';
    clearButton.textContent = '×';
    clearButton.setAttribute('aria-label', '検索条件をクリア');
    clearButton.addEventListener('click', () => onChange(''));
    wrap.appendChild(clearButton);
  }

  return wrap;
}
