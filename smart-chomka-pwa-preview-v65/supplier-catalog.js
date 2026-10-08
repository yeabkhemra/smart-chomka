// Catalogue snapshot reviewed against Angkor Green product pages, 2026-09-16.
// Prices, availability and partnership status are not inferred from the public catalogue.
const angkorProducts = [
  {id:'yara-complex', name:'YARA MILA COMPLEX', category:'fertilizer', type:'ជីដាក់ដី', pack:'25 kg', formula:'12-11-18 + 3% MgO + 8% S + TE', origin:'Norway', source:'https://angkorgreen.com.kh/product/yara-mila-complex/', image:'https://angkorgreen.com.kh/wp-content/uploads/2022/05/Snapshot_416-117x108.png'},
  {id:'revus', name:'REVUS OPTI 440SC', category:'medicine', type:'ថ្នាំកម្ចាត់ផ្សិត', pack:'100 ml', formula:'Mandipropamid 40 g/L + Chlorothalonil 400 g/L SC', origin:'Vietnam', source:'https://angkorgreen.com.kh/product/rivus-oti/', image:'./assets/products/ag_revus_opti.webp'},
  {id:'nitrabor', name:'YARA LIVA NITRABOR', category:'fertilizer', type:'ជីដាក់ដី', pack:'25 kg', formula:'15.4-0-0 + 26% CaO + 0.3% B', origin:'Norway', source:'https://angkorgreen.com.kh/product/yara-liva-nitrabor/', image:'https://angkorgreen.com.kh/wp-content/uploads/2022/05/Snapshot_412-117x108.png'},
  {id:'perfect', name:'PERFECT 72%WP', category:'medicine', type:'ថ្នាំកម្ចាត់ផ្សិត', pack:'500 g / 1 kg', formula:'Metalaxyl 8% + Mencozeb 64% WP', origin:'China', source:'https://angkorgreen.com.kh/product/perfect-72wp/', image:'./assets/products/ag_perfect_72wp.webp'},
  {id:'humicali', name:'HUMICALI', category:'fertilizer', type:'ជីបាញ់ស្លឹក និងតាមប្រព័ន្ធទឹក', pack:'1 kg / 10 kg / 25 kg', formula:'22% K2O + 15% Humic Acid + 15% Fuvic Acid + 60% Organic Matter', origin:'Thailand', source:'https://angkorgreen.com.kh/product/humicali/', image:'https://angkorgreen.com.kh/wp-content/uploads/2022/04/Hnet.com-image-100-117x108.png'},
  {id:'tilt', name:'TILT SUPER 300EC', category:'medicine', type:'ថ្នាំកម្ចាត់ផ្សិត', pack:'250 ml', formula:'Propiconazole 150 g/L + Difenoconazole 150 g/L EC', origin:'Vietnam', source:'https://angkorgreen.com.kh/product/tilt-super-300ec/', image:'./assets/products/ag_tilt_super.webp'},
  {id:'hi-phos', name:'HI PHOS', category:'fertilizer', type:'ជីបាញ់ស្លឹក និងតាមប្រព័ន្ធទឹក', pack:'500 ml / 1 L', formula:'0-17-5 + TE', origin:'Thailand', source:'https://angkorgreen.com.kh/product/hi-phos/', image:'https://angkorgreen.com.kh/wp-content/uploads/2022/04/Hnet.com-image-2022-05-05T174253.933-117x108.png'},
  {id:'buta', name:'BUTA (អាសេតាប្រូ)', category:'medicine', type:'ថ្នាំកម្ចាត់សត្វល្អិត', pack:'1 kg', formula:'Buprofezin 150 g + Acetamiprid 150 g WP', origin:'China', source:'https://angkorgreen.com.kh/product/buta-%E1%9E%A2%E1%9E%B6%E1%9E%9F%E1%9F%81%E1%9E%8F%E1%9E%B6%E1%9E%94%E1%9F%92%E1%9E%9A%E1%9E%BC/', image:'./assets/products/ag_buta.webp'},
  {id:'aquatek', name:'AQUATEK GAIN (ហៃកា)', category:'fertilizer', type:'ជីបាញ់ស្លឹក និងតាមប្រព័ន្ធទឹក', pack:'1 L', formula:'5-5-9 + 0.5% Mg + 0.5% Zn', origin:'Thailand', source:'https://angkorgreen.com.kh/product/aquatek-gain-%E1%9E%A0%E1%9F%83%E1%9E%80%E1%9E%B6/', image:'https://angkorgreen.com.kh/wp-content/uploads/2022/04/Hnet.com-image-2022-04-30T112057.944-117x108.png'}
];

export const suppliers = [
  {
    "id": "angkor",
    "name": "Angkor Green",
    "site": "https://angkorgreen.com.kh/our-product-market/product/",
    "focus": "ជី និងថ្នាំកសិកម្ម"
  },
  {
    "id": "nileda",
    "name": "Nileda",
    "site": "https://niledagroup.com/en/",
    "phone": "+85577887666",
    "focus": "ជីបំប៉ន និងផលិតផលការពារដំណាំ"
  },
  {
    "id": "cam",
    "name": "CAM Agriculture",
    "site": "https://www.camagriculture.com/camvision/",
    "phone": "+85587292333",
    "focus": "ជី Haifa និងប្រព័ន្ធស្រោចស្រព"
  },
  {
    "id": "elite",
    "name": "Elite KH",
    "site": "https://www.elitekh.com/",
    "focus": "ក្បាលបាញ់ទឹក និងឧបករណ៍ស្រោចស្រព"
  }
];
const additionalProducts = [
  {
    "id": "nileda-0",
    "supplier": "nileda",
    "name": "Bacria 200SC",
    "category": "medicine",
    "type": "ថ្នាំសម្រាប់ជំងឺបាក់តេរី",
    "source": "https://niledagroup.com/products/%e1%9e%90%e1%9f%92%e1%9e%93%e1%9e%b6%e1%9f%86%e1%9e%96%e1%9f%92%e1%9e%99%e1%9e%b6%e1%9e%94%e1%9e%b6%e1%9e%9b%e1%9e%87%e1%9f%86%e1%9e%84%e1%9e%ba%e1%9e%94%e1%9e%b6%e1%9e%80%e1%9f%8b%e1%9e%8f%e1%9f%81/",
    "image": "https://niledagroup.com/wp-content/uploads/2022/06/Bacria-200SC-01-1-scaled.jpg",
    "formula": "",
    "durianListed": true
  },
  {
    "id": "nileda-1",
    "supplier": "nileda",
    "name": "Uthane 80WP",
    "category": "medicine",
    "type": "ថ្នាំកម្ចាត់ផ្សិត",
    "source": "https://niledagroup.com/products/%e1%9e%99%e1%9e%bc%e1%9e%90%e1%9e%b6%e1%9e%93-uthane-80wp/",
    "image": "https://niledagroup.com/wp-content/uploads/2019/08/Uthane_01.jpg",
    "formula": "",
    "durianListed": false
  },
  {
    "id": "nileda-2",
    "supplier": "nileda",
    "name": "Melspray 29-10-10 + 3MgO + TE",
    "category": "fertilizer",
    "type": "ជីបំប៉ន",
    "source": "https://niledagroup.com/products/%e1%9e%87%e1%9e%b8%e1%9e%94%e1%9f%86%e1%9e%94%e1%9f%89%e1%9e%93%e1%9e%9f%e1%9e%98%e1%9f%92%e1%9e%9a%e1%9e%b6%e1%9e%94%e1%9f%8b%e1%9e%8a%e1%9f%86%e1%9e%8e%e1%9e%b6%e1%9f%86%e1%9e%91%e1%9e%bc%e1%9e%91-2/",
    "image": "https://niledagroup.com/wp-content/uploads/2019/09/Melsoray29-10-10_01.jpg",
    "formula": "29-10-10 + 3MgO + TE",
    "durianListed": false
  },
  {
    "id": "nileda-3",
    "supplier": "nileda",
    "name": "Melspray 10-60-10 + TE",
    "category": "fertilizer",
    "type": "ជីបំប៉ន",
    "source": "https://niledagroup.com/products/%e1%9e%87%e1%9e%b8%e1%9e%94%e1%9f%86%e1%9e%94%e1%9f%89%e1%9e%93%e1%9e%9f%e1%9e%98%e1%9f%92%e1%9e%9a%e1%9e%b6%e1%9e%94%e1%9f%8b%e1%9e%8a%e1%9f%86%e1%9e%8e%e1%9e%b6%e1%9f%86%e1%9e%91%e1%9e%bc%e1%9e%91/",
    "image": "https://niledagroup.com/wp-content/uploads/2019/09/Melspray10-60-10_01.jpg",
    "formula": "10-60-10 + TE",
    "durianListed": false
  },
  {
    "id": "nileda-4",
    "supplier": "nileda",
    "name": "Melspray 5-5-40 + TE",
    "category": "fertilizer",
    "type": "ជីបំប៉ន",
    "source": "https://niledagroup.com/products/%e1%9e%87%e1%9e%b8%e1%9e%94%e1%9f%86%e1%9e%94%e1%9f%89%e1%9e%93%e1%9e%9f%e1%9e%98%e1%9f%92%e1%9e%9a%e1%9e%b6%e1%9e%94%e1%9f%8b%e1%9e%8a%e1%9f%86%e1%9e%8e%e1%9e%b6%e1%9f%86%e1%9e%91%e1%9e%bc%e1%9e%91-3/",
    "image": "https://niledagroup.com/wp-content/uploads/2019/09/Melspray_5-5-40_01.jpg",
    "formula": "5-5-40 + TE",
    "durianListed": false
  },
  {
    "id": "cam-map",
    "supplier": "cam",
    "name": "CAM Haifa MAP",
    "category": "fertilizer",
    "type": "ជីរលាយក្នុងទឹក",
    "formula": "N 12%; P2O5 61%",
    "source": "https://www.camagriculture.com/soluble-fertilizers/",
    "image": "https://www.camagriculture.com/wp-content/uploads/2022/07/Cam-MAP-227x300.png"
  },
  {
    "id": "cam-mkp",
    "supplier": "cam",
    "name": "CAM Haifa MKP",
    "category": "fertilizer",
    "type": "ជីរលាយក្នុងទឹក",
    "formula": "P2O5 52%; K2O 34%",
    "source": "https://www.camagriculture.com/soluble-fertilizers/",
    "image": "https://www.camagriculture.com/wp-content/uploads/2022/07/Cam-MKP-227x300.png"
  },
  {
    "id": "cam-calcium",
    "supplier": "cam",
    "name": "CAM Haifa Calcium",
    "category": "fertilizer",
    "type": "ជីរលាយក្នុងទឹក",
    "formula": "N 15.5%; CaO 26.5%",
    "source": "https://www.camagriculture.com/soluble-fertilizers/",
    "image": "https://www.camagriculture.com/wp-content/uploads/2022/07/Cam-Calcium-227x300.png"
  },
  {
    "id": "cam-drip",
    "supplier": "cam",
    "name": "ប្រព័ន្ធស្រោចស្រពតំណក់ទឹក",
    "category": "tools",
    "type": "ប្រព័ន្ធស្រោចស្រព",
    "source": "https://www.camagriculture.com/drip-irrigation-system/",
    "notes": "សាកសួរការរៀបចំប្រព័ន្ធសម្រាប់ទំហំចម្ការ និងប្រភពទឹករបស់អ្នក។"
  },
  {
    "id": "elite-bb9011tr",
    "supplier": "elite",
    "name": "Black Sprinkler BB9011TR",
    "category": "tools",
    "type": "ក្បាលបាញ់ទឹក",
    "source": "https://www.elitekh.com/",
    "notes": "សាកសួរទំហំតំណ សម្ពាធទឹក និងចម្ងាយបាញ់មុនជ្រើសរើស។"
  },
  {
    "id": "elite-vs966",
    "supplier": "elite",
    "name": "Black Sprinkler Male Thread (17–21) with Valve VS966",
    "category": "tools",
    "type": "ក្បាលបាញ់ទឹក",
    "source": "https://www.elitekh.com/",
    "notes": "សាកសួរទំហំតំណ សម្ពាធទឹក និងចម្ងាយបាញ់មុនជ្រើសរើស។"
  }
];
export const supplierProducts = [...angkorProducts.map(item => ({...item, supplier:'angkor', reviewed:'16/09/2026'})), ...additionalProducts.map(item => ({...item, reviewed:'17/09/2026'}))];
