const root = document.querySelector('#marketPanel');
const storageKey = 'smart-chomka-market-v1';
let listings = [];
let photo = '';
let editingId = null;
let photoPending = false;
const $ = (selector) => root.querySelector(selector);
const escape = (value) => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const categoryName = () => 'ទុរេនពីកសិករ';
const price = (item) => `${Number(item.price).toLocaleString()} ${item.currency === 'USD' ? '$' : '៛'} / ${item.unit}`;
const status = (text) => { $('#marketStatus').textContent = text; };
function load() {
  try {
    const data = JSON.parse(localStorage.getItem(storageKey) || '[]');
    listings = Array.isArray(data) ? data.filter(item => item && typeof item.id === 'string' && ['durian','medicine'].includes(item.category) && Number.isFinite(item.price)) : [];
  } catch { listings = []; status('មិនអាចអានទិន្នន័យទីផ្សារបាន។'); }
}
function persist(next) {
  try { localStorage.setItem(storageKey, JSON.stringify(next)); listings = next; render(); return true; }
  catch { status('មិនអាចរក្សាទុកបាន។ សូមពិនិត្យទំហំផ្ទុកក្នុងឧបករណ៍។'); return false; }
}
function image(item) {
  return /^data:image\/(jpeg|png|webp);base64,/.test(item.photo || '') ? `<img src="${escape(item.photo)}" alt="${escape(item.title)}">` : `<span class="market-placeholder" aria-hidden="true">${item.category === 'durian' ? '🌳' : '🌿'}</span>`;
}
function render() {
  const query = $('#marketSearch').value.trim().toLocaleLowerCase();
  const location = $('#marketLocation').value;
  const basis = $('#marketPriceBasis').value;
  const available = $('#marketAvailable').checked;
  const locations = [...new Set(listings.filter(item => item.category === 'durian').map(item => item.location))].sort();
  $('#marketLocation').innerHTML = '<option value="">គ្រប់ទីតាំង</option>' + locations.map(value => `<option value="${escape(value)}">${escape(value)}</option>`).join('');
  $('#marketLocation').value = locations.includes(location) ? location : '';

  const sort = $('#marketSort').value;
  const visible = listings.filter(item => item.category === 'durian' && (!location || item.location === location) && (!available || !item.sold) && (!basis || `${item.currency}|${item.unit}` === basis) && `${item.title} ${item.location} ${item.seller} ${item.variety || ''}`.toLocaleLowerCase().includes(query));
  if (sort.startsWith('price-') && basis) visible.sort((a,b) => sort === 'price-asc' ? a.price - b.price : b.price - a.price);
  $('#marketSortHint').textContent = sort.startsWith('price-') && !basis ? 'សូមជ្រើសរូបិយប័ណ្ណ និងឯកតា ដើម្បីតម្រៀបតម្លៃឱ្យត្រឹមត្រូវ។' : '';

  if (sort === 'name') visible.sort((a,b) => a.title.localeCompare(b.title));
  $('#marketCount').textContent = `${visible.length} មុខទំនិញ`;
  $('#marketGrid').innerHTML = visible.length ? visible.map(item => `<article class="market-card"><button class="market-photo" data-detail="${escape(item.id)}" aria-label="មើល ${escape(item.title)}">${image(item)}<span class="market-badge">${categoryName(item.category)}</span></button><div class="market-card-body"><small>${escape(item.location)}</small><h2>${escape(item.title)}</h2><strong class="market-price">${escape(price(item))}</strong><p>${escape(item.seller)} · ${item.sold ? 'លក់អស់' : 'មានស្តុក'}</p><p>${escape(item.variety || 'មិនទាន់បញ្ជាក់ពូជ')}</p><button class="market-primary" data-detail="${escape(item.id)}">មើលព័ត៌មាន</button></div></article>`).join('') : `<div class="market-empty"><span aria-hidden="true">🌱</span><h2>${listings.length ? 'រកមិនឃើញទំនិញ' : 'ចាប់ផ្តើមទីផ្សាររបស់អ្នក'}</h2><p>${listings.length ? 'សាកល្បងពាក្យស្វែងរក ឬប្រភេទផ្សេង។' : 'ដាក់ទុរេនដំបូងរបស់អ្នក។ ទិន្នន័យនេះរក្សាទុកតែក្នុងឧបករណ៍នេះ។'}</p><button class="market-primary" data-new>＋ ដាក់លក់ទុរេន</button></div>`;
}
function openEditor(item) {
  if (item && item.category !== 'durian') return;
  const form = $('#marketForm');
  form.reset(); editingId = item?.id || null; photo = item?.photo || '';
  $('#marketFormStatus').textContent = '';
  let account = {};
  try { account = JSON.parse(localStorage.getItem('smart-chomka-farmer-account-v1') || '{}'); } catch {}
  for (const key of ['title','price','currency','unit','location','seller','phone','description','variety','harvest','quantity']) {
    if (item) form.elements[key].value = item[key] || '';
  }
  if (!item) { form.elements.seller.value = account.name || ''; form.elements.phone.value = account.phone || ''; }
  $('#marketPhotoPreview').src = photo || ''; $('#marketPhotoPreview').hidden = !photo;
  $('#marketEditorTitle').textContent = item ? 'កែប្រែទំនិញ' : 'ដាក់លក់ទុរេន';
  $('#marketEditor').showModal();
}
function details(item) {
  $('#marketDetailContent').innerHTML = `<div class="market-detail-photo">${image(item)}</div><span class="market-eyebrow">${categoryName(item.category)}</span><h2 id="marketDetailTitle">${escape(item.title)}</h2><strong class="market-price">${escape(price(item))}</strong><p>${escape(item.location)} · ${item.sold ? 'លក់អស់' : 'មានស្តុក'}</p><dl class="market-facts"><div><dt>ពូជ</dt><dd>${escape(item.variety || 'មិនទាន់បញ្ជាក់')}</dd></div><div><dt>ថ្ងៃប្រមូលផល</dt><dd>${escape(item.harvest || 'មិនទាន់បញ្ជាក់')}</dd></div><div><dt>បរិមាណ</dt><dd>${item.quantity ? `${escape(item.quantity)} ${escape(item.unit)}` : 'មិនទាន់បញ្ជាក់'}</dd></div></dl><p class="market-description">${escape(item.description)}</p><div class="market-seller"><strong>${escape(item.seller)}</strong><p>${escape(item.phone)}</p></div><p class="market-local-note">ទំនិញនេះរក្សាទុកតែក្នុងឧបករណ៍នេះ។ អ្នកប្រើផ្សេងទៀតមិនទាន់អាចមើលឃើញបានទេ។</p><div class="market-detail-actions"><button data-edit="${escape(item.id)}">កែប្រែ</button><button data-sold="${escape(item.id)}">${item.sold ? 'មានស្តុកវិញ' : 'សម្គាល់ថាលក់អស់'}</button><button data-delete="${escape(item.id)}">លុប</button></div>`;
  $('#marketDetail').showModal();
}
root.addEventListener('click', event => {
  const button = event.target.closest('button'); if (!button) return;
  if (button.dataset.marketSection) {
    const suppliers = button.dataset.marketSection === 'suppliers';
    $('#marketSupplierPanel').hidden = !suppliers;
    $('#marketDurianPanel').hidden = button.dataset.marketSection !== 'durian';
    $('#marketShopPanel').hidden = button.dataset.marketSection !== 'shop';
    root.querySelectorAll('[data-market-section]').forEach(tab => tab.setAttribute('aria-pressed', String(tab === button)));
    root.querySelector('.market-hero [data-new]').hidden = button.dataset.marketSection !== 'durian';
    root.querySelector('.market-local-note').hidden = button.dataset.marketSection !== 'durian';
  }
  if (button.hasAttribute('data-new')) openEditor();
  if (button.hasAttribute('data-close')) button.closest('dialog').close();
  for (const action of ['detail','edit','sold','delete']) {
    const item = listings.find(item => item.id === button.dataset[action]); if (!item) continue;
    if (action === 'detail') details(item);
    if (action === 'edit') { $('#marketDetail').close(); openEditor(item); }
    if (action === 'sold' && persist(listings.map(row => row.id === item.id ? {...row, sold: !row.sold} : row))) $('#marketDetail').close();
    if (action === 'delete' && window.confirm('លុបទំនិញនេះ?') && persist(listings.filter(row => row.id !== item.id))) $('#marketDetail').close();
  }
});
$('#marketPhoto').addEventListener('change', async event => {
  const file = event.target.files[0]; if (!file) return;
  if (!['image/jpeg','image/png','image/webp'].includes(file.type) || file.size > 8 * 1024 * 1024) { $('#marketFormStatus').textContent = 'សូមជ្រើសរូប JPG, PNG ឬ WebP តូចជាង 8 MB។'; event.target.value = ''; return; }
  photoPending = true; $('#marketSave').disabled = true;
  try {
    const bitmap = await createImageBitmap(file);
    const canvas = document.createElement('canvas'); const scale = Math.min(1, 900 / Math.max(bitmap.width, bitmap.height));
    canvas.width = Math.round(bitmap.width * scale); canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height); bitmap.close();
    photo = canvas.toDataURL('image/jpeg', 0.75); $('#marketPhotoPreview').src = photo; $('#marketPhotoPreview').hidden = false;
    $('#marketFormStatus').textContent = '';
  } catch { $('#marketFormStatus').textContent = 'មិនអាចអានរូបភាពបាន។'; }
  finally { photoPending = false; $('#marketSave').disabled = false; }
});
$('#marketForm').addEventListener('submit', event => {
  event.preventDefault(); if (photoPending) return;
  const values = Object.fromEntries(new FormData(event.target));
  const amount = Number(values.price);
  if (values.category !== 'durian' || !['KHR','USD'].includes(values.currency) || !['គីឡូក្រាម','ផ្លែ'].includes(values.unit)) { $('#marketFormStatus').textContent = 'កសិករអាចដាក់លក់តែទុរេនប៉ុណ្ណោះ។'; return; }

  if (!values.title.trim() || !values.seller.trim() || !values.location.trim() || !Number.isFinite(amount) || amount <= 0 || !/^\+?[\d\s()-]{7,20}$/.test(values.phone.trim())) { $('#marketFormStatus').textContent = 'សូមបំពេញឈ្មោះ តម្លៃ ទីតាំង និងលេខទូរស័ព្ទឱ្យបានត្រឹមត្រូវ។'; return; }
  const old = listings.find(item => item.id === editingId);
  const item = {...old, id: editingId || crypto.randomUUID(), category: 'durian', variety: values.variety.trim(), harvest: values.harvest, quantity: values.quantity ? Number(values.quantity) : null, title: values.title.trim(), price: amount, currency: values.currency, unit: values.unit, seller: values.seller.trim(), phone: values.phone.trim(), location: values.location.trim(), description: values.description.trim(), photo, sold: old?.sold || false};
  if (persist([item, ...listings.filter(row => row.id !== item.id)])) { $('#marketEditor').close(); status('បានរក្សាទុកក្នុងឧបករណ៍នេះ។ មិនទាន់បានផ្សាយជាសាធារណៈ។'); }
  else $('#marketFormStatus').textContent = 'មិនអាចរក្សាទុកបាន។ សូមកាត់បន្ថយទំហំរូបភាព។';
});
for (const id of ['#marketSearch','#marketLocation','#marketSort','#marketPriceBasis','#marketAvailable']) $(id).addEventListener('input', render);
window.addEventListener('storage', event => { if (event.key === storageKey) { load(); render(); } });
load(); render();

root.querySelector('.market-local-note').hidden = true;
root.querySelector('.market-hero [data-new]').hidden = true;
