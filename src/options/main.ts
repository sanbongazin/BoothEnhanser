import { getAllItems, putItem } from '../lib/dbClient';
import { AVATAR_KEYWORDS, NON_AVATAR_KEYWORDS } from '../lib/keywordDictionary';

async function renderYomiTable(): Promise<void> {
  const items = await getAllItems();
  const tbody = document.querySelector('#yomi-table tbody');
  if (!tbody) return;

  tbody.innerHTML = '';
  for (const item of items) {
    const row = document.createElement('tr');

    const itemNameCell = document.createElement('td');
    itemNameCell.textContent = item.itemName;
    row.appendChild(itemNameCell);

    const shopNameCell = document.createElement('td');
    shopNameCell.textContent = item.shopName;
    row.appendChild(shopNameCell);

    const itemYomiCell = document.createElement('td');
    const itemYomiInput = document.createElement('input');
    itemYomiInput.value = item.yomiOverride.itemName ?? '';
    itemYomiInput.addEventListener('change', () => {
      void putItem({
        ...item,
        yomiOverride: { ...item.yomiOverride, itemName: itemYomiInput.value || undefined },
      });
    });
    itemYomiCell.appendChild(itemYomiInput);
    row.appendChild(itemYomiCell);

    const shopYomiCell = document.createElement('td');
    const shopYomiInput = document.createElement('input');
    shopYomiInput.value = item.yomiOverride.shopName ?? '';
    shopYomiInput.addEventListener('change', () => {
      void putItem({
        ...item,
        yomiOverride: { ...item.yomiOverride, shopName: shopYomiInput.value || undefined },
      });
    });
    shopYomiCell.appendChild(shopYomiInput);
    row.appendChild(shopYomiCell);

    tbody.appendChild(row);
  }
}

function renderKeywordDictionary(): void {
  const container = document.getElementById('keyword-dictionary');
  if (!container) return;

  const avatar = document.createElement('p');
  avatar.textContent = `アバター判定キーワード: ${AVATAR_KEYWORDS.join(', ')}`;
  container.appendChild(avatar);

  const nonAvatar = document.createElement('p');
  nonAvatar.textContent = `アバター以外判定キーワード: ${NON_AVATAR_KEYWORDS.join(', ')}`;
  container.appendChild(nonAvatar);
}

void renderYomiTable();
renderKeywordDictionary();
