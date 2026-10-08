import { supplierProducts, suppliers } from './supplier-catalog.js?v=116';
const panel = document.querySelector('#marketSupplierPanel');
const search = panel.querySelector('#supplierSearch');
const grid = panel.querySelector('#supplierGrid');
const dialog = document.querySelector('#supplierDetail');
let category = '';
let inventory = new Map();
let inventoryError = false;
const purchasable = item => inventory.get(item.id);
function buyButton(item){const p=purchasable(item);return `<button type="button" class="market-primary supplier-buy" data-catalog-buy="${item.id}" ${p?.stock>0?'':'disabled'}>${p?.stock>0?'ទិញឥឡូវនេះ':p?'អស់ស្តុក':'ទិញ · មិនទាន់មានលក់'}</button>`;}
const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const categoryName = value => ({medicine:'ថ្នាំកសិកម្ម', fertilizer:'ជីកសិកម្ម', tools:'ឧបករណ៍ និងស្រោចស្រព'}[value]);
const supplierFor = item => suppliers.find(supplier => supplier.id === item.supplier);
const unknown = 'សាកសួរអ្នកផ្គត់ផ្គង់';
function productImage(item) {
  return `<div class="supplier-product-image"><span class="supplier-image-fallback">${esc(supplierFor(item).name)}<br><strong>${esc(item.name)}</strong></span>${item.image ? `<img src="${esc(item.image)}" alt="${esc(item.name)}" loading="lazy" referrerpolicy="no-referrer">` : ''}</div>`;
}
function handleImages(container) {
  container.querySelectorAll('img').forEach(img => {
    img.addEventListener('load', () => { img.previousElementSibling.hidden = true; img.classList.add('is-loaded'); }, {once:true});
    if (img.complete && img.naturalWidth) { img.previousElementSibling.hidden = true; img.classList.add('is-loaded'); }
    img.addEventListener('error', () => { img.hidden = true; img.previousElementSibling.hidden = false; }, {once:true});
  });
}
function render() {
  const query = search.value.trim().toLocaleLowerCase();
  const supplierId = panel.querySelector('#supplierSelect').value;
  const products = supplierProducts.filter(item => (!category || item.category === category) && (!supplierId || item.supplier === supplierId) && `${item.name} ${item.type} ${item.formula || ''} ${item.pack || ''} ${supplierFor(item).name}`.toLocaleLowerCase().includes(query));
  panel.querySelector('#supplierCount').textContent = `${products.length} ផលិតផល · ${supplierId ? suppliers.find(s => s.id === supplierId).name : `${suppliers.length} អ្នកផ្គត់ផ្គង់`}`;
  grid.innerHTML = products.length ? products.map(item => `<article class="supplier-product-card"><button type="button" class="supplier-image-button" data-supplier-product="${item.id}" aria-label="មើល ${esc(item.name)}">${productImage(item)}<span class="supplier-category-badge ${item.category}">${categoryName(item.category)}</span></button><div class="supplier-product-body"><small>${esc(supplierFor(item).name)} · ${esc(item.type)}</small><h3>${esc(item.name)}</h3><p class="supplier-pack">${esc(item.pack || unknown)}</p><p class="supplier-quote">${purchasable(item) ? `$${(purchasable(item).price_cents/100).toFixed(2)} / ${esc(purchasable(item).unit)}` : 'តម្លៃមិនទាន់កំណត់'}</p>${buyButton(item)}<button type="button" data-supplier-product="${item.id}">ព័ត៌មានផលិតផល <span aria-hidden="true">↗</span></button></div></article>`).join('') : '<div class="market-empty"><h3>រកមិនឃើញផលិតផល</h3><p>សាកល្បងឈ្មោះ ឬប្រភេទផ្សេង។</p><button type="button" id="supplierClear">សម្អាតការស្វែងរក</button></div>';
  handleImages(grid);
}
panel.addEventListener('click', event => {
  const button = event.target.closest('button'); if (!button) return;
  if (button.dataset.catalogBuy) {window.dispatchEvent(new CustomEvent('chomka-buy',{detail:{id:button.dataset.catalogBuy}}));return;}
  if (button.hasAttribute('data-supplier-category')) {
    category = button.dataset.supplierCategory;
    panel.querySelectorAll('[data-supplier-category]').forEach(tab => tab.setAttribute('aria-pressed',String(tab === button)));
    render();
  }
  if (button.id === 'supplierClear') {
    search.value = ''; category = ''; panel.querySelector('#supplierSelect').value = '';
    panel.querySelectorAll('[data-supplier-category]').forEach(tab => tab.setAttribute('aria-pressed',String(!tab.dataset.supplierCategory)));
    render(); search.focus();
  }
  const item = supplierProducts.find(product => product.id === button.dataset.supplierProduct);
  if (!item) return;
  const supplier = supplierFor(item);
  dialog.querySelector('header>span').textContent = supplier.name;
  dialog.querySelector('#supplierDetailBody').innerHTML = `${productImage(item)}<span class="market-eyebrow">${esc(supplier.name)} · ${esc(item.type)}</span><h2 id="supplierDetailTitle">${esc(item.name)}</h2><dl class="supplier-facts"><div><dt>ទំហំកញ្ចប់ / ជម្រើស</dt><dd>${esc(item.pack || unknown)}</dd></div><div><dt>ប្រទេសផលិតតាមកាតាឡុក</dt><dd>${esc(item.origin || 'មិនបានបញ្ជាក់')}</dd></div>${item.formula ? `<div class="supplier-formula"><dt>សមាសធាតុតាមកាតាឡុក</dt><dd>${esc(item.formula)}</dd></div>` : ''}</dl><p class="supplier-detail-note">${item.durianListed ? 'អ្នកផ្គត់ផ្គង់បានរាយឈ្មោះទុរេននៅក្នុងព័ត៌មានផលិតផល។ សូមបញ្ជាក់ស្លាក និងការប្រើជាមួយអ្នកជំនាញ។' : item.category === 'tools' ? esc(item.notes || 'សូមបញ្ជាក់ទំហំ និងលក្ខណៈបច្ចេកទេសសម្រាប់ចម្ការរបស់អ្នក។') : 'ផលិតផលកសិកម្មទូទៅ។ សូមបញ្ជាក់ភាពសមស្របសម្រាប់ទុរេន ស្លាក និងការប្រើជាមួយអ្នកជំនាញ។'}<br>តម្លៃ និងស្តុក៖ ${unknown}។</p><a class="supplier-inquiry" href="${esc(item.source)}" target="_blank" rel="noopener noreferrer">មើលប្រភព / សាកសួរ ${esc(supplier.name)} ↗</a>${supplier.phone ? `<a class="supplier-phone" href="tel:${supplier.phone}">ទូរស័ព្ទ៖ ${supplier.phone}</a>` : ''}<p class="supplier-attribution">ប្រភព៖ ${esc(supplier.name)} · បានពិនិត្យ ${esc(item.reviewed)}។ ការបង្ហាញក្នុងបញ្ជីមិនមានន័យថាជាដៃគូដែលបានបញ្ជាក់ទេ។</p>`;
  handleImages(dialog); dialog.showModal();
});
dialog.querySelector('[data-supplier-close]').addEventListener('click',()=>dialog.close());
search.addEventListener('input',render);
panel.querySelector('#supplierSelect').innerHTML = '<option value="">អ្នកផ្គត់ផ្គង់ទាំងអស់</option>' + suppliers.map(supplier => `<option value="${supplier.id}">${esc(supplier.name)}</option>`).join('');
panel.querySelector('#supplierSelect').addEventListener('change',render);
panel.querySelector('#supplierDirectory').innerHTML = suppliers.map(supplier => `<article><strong>${esc(supplier.name)}</strong><p>${esc(supplier.focus)}</p><a href="${esc(supplier.site)}" target="_blank" rel="noopener noreferrer">គេហទំព័រ ↗</a>${supplier.phone ? `<a href="tel:${supplier.phone}">${supplier.phone}</a>` : ''}</article>`).join('');
panel.querySelectorAll('[data-supplier-category]').forEach(button => { button.querySelector('span').textContent = supplierProducts.filter(item => !button.dataset.supplierCategory || item.category === button.dataset.supplierCategory).length; });
render();

async function refreshInventory(){try{const response=await fetch('/commerce-api/products',{cache:'no-store'});if(!response.ok)throw Error();inventory=new Map((await response.json()).map(item=>[item.id,item]));inventoryError=false;}catch{inventory=new Map();inventoryError=true;}panel.querySelector('#supplierAvailabilityNote').textContent=inventoryError?'មិនអាចពិនិត្យស្តុកបាន។ សូមព្យាយាមម្ដងទៀត។':'ចុច «ទិញឥឡូវនេះ» សម្រាប់ទំនិញមានតម្លៃ និងស្តុក។ ទំនិញផ្សេងទៀតរង់ចាំអ្នកលក់ផ្សាយលក់។';render();}
refreshInventory();
document.querySelector('[data-market-section="suppliers"]').addEventListener('click',refreshInventory);
