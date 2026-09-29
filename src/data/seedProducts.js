// Boshlang'ich (demo) mahsulotlar. Faqat localStorage bo'sh bo'lganda ishlatiladi.
//
// Mahsulot (Product) strukturasi — backend bilan bir xil bo'lishi mo'ljallangan:
// {
//   id:          string   — unikal identifikator
//   sku:         string   — artikul (unikal)
//   name:        string   — nomi
//   category:    string   — 'qurilish' | 'elektrika' | 'santexnika' | 'avto'
//   unit:        string   — 'dona' | 'metr' | 'kg' | 'litr' | 'quti' | 'quop' | 'rulon'
//   price:       number   — 1 birlik narxi (so'm)
//   stock:       number   — ombordagi qoldiq (birlikda, kasr bo'lishi mumkin)
//   minStock:    number   — shundan kam bo'lsa "kam qoldi" deb belgilanadi
//   receivedAt:  string   — oxirgi kelgan sana, 'YYYY-MM-DD'
// }

export const SEED_PRODUCTS = [
  // Qurilish
  { id: 'p1', sku: 'QM-001', category: 'qurilish', name: 'Portlandsement M400 (26kg quop)', unit: 'quop', price: 45000, stock: 120, minStock: 30, receivedAt: '2026-08-10' },
  { id: 'p2', sku: 'QM-002', category: 'qurilish', name: "Qizil g'isht", unit: 'dona', price: 1200, stock: 5000, minStock: 500, receivedAt: '2026-07-15' },
  { id: 'p3', sku: 'QM-003', category: 'qurilish', name: 'Armatura 12mm', unit: 'metr', price: 18500, stock: 300, minStock: 50, receivedAt: '2026-08-20' },
  { id: 'p4', sku: 'QM-004', category: 'qurilish', name: "Devor bo'yog'i oq 15L", unit: 'dona', price: 210000, stock: 40, minStock: 10, receivedAt: '2026-08-01' },
  { id: 'p5', sku: 'QM-005', category: 'qurilish', name: 'Silikat blok', unit: 'dona', price: 3200, stock: 800, minStock: 100, receivedAt: '2026-08-05' },
  { id: 'p6', sku: 'QM-006', category: 'qurilish', name: 'Gipsokarton list 12mm', unit: 'dona', price: 65000, stock: 60, minStock: 15, receivedAt: '2026-08-12' },
  { id: 'p7', sku: 'QM-007', category: 'qurilish', name: 'Mix (shurup) 4x50', unit: 'quti', price: 25000, stock: 15, minStock: 20, receivedAt: '2026-06-30' },
  { id: 'p8', sku: 'QM-008', category: 'qurilish', name: 'Metall profil', unit: 'dona', price: 42000, stock: 90, minStock: 20, receivedAt: '2026-08-08' },

  // Elektrika
  { id: 'p9', sku: 'EL-001', category: 'elektrika', name: 'Elektr kabel VVG 3x2.5', unit: 'metr', price: 12000, stock: 340.5, minStock: 50, receivedAt: '2026-08-14' },
  { id: 'p10', sku: 'EL-002', category: 'elektrika', name: 'Avtomatik uzgich 16A', unit: 'dona', price: 28000, stock: 75, minStock: 15, receivedAt: '2026-08-02' },
  { id: 'p11', sku: 'EL-003', category: 'elektrika', name: 'Rozetka (ustki)', unit: 'dona', price: 21000, stock: 60, minStock: 10, receivedAt: '2026-07-28' },
  { id: 'p12', sku: 'EL-004', category: 'elektrika', name: 'LED lampochka 9W', unit: 'dona', price: 15000, stock: 5, minStock: 20, receivedAt: '2026-06-25' },

  // Santexnika
  { id: 'p13', sku: 'SN-001', category: 'santexnika', name: 'Metall-plastik truba 20mm', unit: 'metr', price: 14500, stock: 210, minStock: 40, receivedAt: '2026-08-16' },
  { id: 'p14', sku: 'SN-002', category: 'santexnika', name: 'Sharobran kran', unit: 'dona', price: 65000, stock: 22, minStock: 8, receivedAt: '2026-08-09' },
  { id: 'p15', sku: 'SN-003', category: 'santexnika', name: 'Silikon germetik', unit: 'dona', price: 32000, stock: 8, minStock: 12, receivedAt: '2026-07-19' },
  { id: 'p16', sku: 'SN-004', category: 'santexnika', name: 'Dush shlangasi', unit: 'dona', price: 48000, stock: 30, minStock: 10, receivedAt: '2026-08-03' },

  // Avto ehtiyot qismlari
  { id: 'p17', sku: 'AV-001', category: 'avto', name: 'Motor moyi 5W-40', unit: 'litr', price: 95000, stock: 60.5, minStock: 15, receivedAt: '2026-08-11' },
  { id: 'p18', sku: 'AV-002', category: 'avto', name: 'Tormoz kolodkasi (juft)', unit: 'dona', price: 180000, stock: 14, minStock: 10, receivedAt: '2026-07-30' },
  { id: 'p19', sku: 'AV-003', category: 'avto', name: 'Akkumulyator 60Ah', unit: 'dona', price: 650000, stock: 6, minStock: 5, receivedAt: '2026-08-06' },
  { id: 'p20', sku: 'AV-004', category: 'avto', name: "Yoqilg'i filtri", unit: 'dona', price: 45000, stock: 3, minStock: 10, receivedAt: '2026-06-28' },
];
