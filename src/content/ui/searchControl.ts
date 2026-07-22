const DEBOUNCE_MS = 250;
const SVG_NS = 'http://www.w3.org/2000/svg';

/** design_handoff_logo_ui: 検索欄が空のときだけ表示する、ブランドアクセント色の虫眼鏡アイコン。
 * クエリ入力中は同じ位置に be-search__clear(×ボタン)が表示されるため、両者は排他にする。 */
function renderSearchIcon(): SVGElement {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('class', 'be-search__icon');
  svg.setAttribute('width', '13');
  svg.setAttribute('height', '13');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('aria-hidden', 'true');

  const circle = document.createElementNS(SVG_NS, 'circle');
  circle.setAttribute('cx', '10');
  circle.setAttribute('cy', '10');
  circle.setAttribute('r', '7');
  circle.setAttribute('fill', 'none');
  circle.setAttribute('stroke', '#4f6fd6');
  circle.setAttribute('stroke-width', '2.5');
  svg.appendChild(circle);

  const line = document.createElementNS(SVG_NS, 'line');
  line.setAttribute('x1', '15');
  line.setAttribute('y1', '15');
  line.setAttribute('x2', '21');
  line.setAttribute('y2', '21');
  line.setAttribute('stroke', '#4f6fd6');
  line.setAttribute('stroke-width', '2.5');
  line.setAttribute('stroke-linecap', 'round');
  svg.appendChild(line);

  return svg;
}

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
  } else {
    wrap.appendChild(renderSearchIcon());
  }

  return wrap;
}
