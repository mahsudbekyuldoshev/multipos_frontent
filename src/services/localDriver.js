// localStorage asosidagi "soxta backend".
// httpDriver.js bilan BIR XIL interfeysga ega — shuning uchun keyin backendga
// o'tish uchun UI kodiga tegish shart emas.

import { SEED_PRODUCTS } from '../data/seedProducts';
import { fmtQty, round2, todayKey, dateKeyOf } from '../utils/format';
import { makeId } from '../utils/id';
import { EPS, lineTotal } from '../utils/stock';

const KEY_PRODUCTS = 'multipos:products:v1';
const KEY_SALES = 'multipos:sales:v1';
const KEY_USERS = 'multipos:users:v1';
const KEY_MARKAZLAR = 'multipos:markazlar:v1';
const KEY_CATEGORIES = 'multipos:categories:v1';

const SEED_MARKAZLAR = [{ id: 'm1', name: 'Mustahkam Savdo Markazi', address: 'Toshkent shahri' }];
const SEED_CATEGORIES = [
  { key: 'qurilish', label: 'Qurilish', icon: '🧱', accent: '#4E97C4' },
  { key: 'elektrika', label: 'Elektrika', icon: '🔌', accent: '#E8B23B' },
  { key: 'santexnika', label: 'Santexnika', icon: '🚰', accent: '#3FB6AE' },
  { key: 'avto', label: 'Avto-detal', icon: '🚗', accent: '#C9564B' },
];

function loadMarkazlar() {
  const stored = read(KEY_MARKAZLAR, null);
  if (Array.isArray(stored)) return stored;
  write(KEY_MARKAZLAR, SEED_MARKAZLAR);
  return SEED_MARKAZLAR;
}

function loadCategories() {
  const stored = read(KEY_CATEGORIES, null);
  if (Array.isArray(stored)) return stored;
  write(KEY_CATEGORIES, SEED_CATEGORIES);
  return SEED_CATEGORIES;
}

// Keyingi yilgi standart sana
const getDefaultNextYear = () => {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().slice(0, 10);
};

const SEED_USERS = [
  {
    id: 'u_admin',
    role: 'super_admin',
    fullName: 'Super Administrator',
    phone: '991112233',
    password: 'admin',
    centerName: 'Boshqaruv Markazi',
    subscriptionStatus: 'active',
    subscriptionExpiresAt: '2030-01-01',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'u_kassir1',
    role: 'kassir',
    fullName: 'Ali Valiyev',
    phone: '901234567',
    password: '1234',
    centerName: 'Mustahkam Savdo Markazi',
    subscriptionStatus: 'active',
    subscriptionExpiresAt: getDefaultNextYear(),
    createdAt: new Date().toISOString(),
  },
];

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

const write = (key, value) => localStorage.setItem(key, JSON.stringify(value));

function loadProducts() {
  const stored = read(KEY_PRODUCTS, null);
  if (Array.isArray(stored)) return stored;
  const seeded = SEED_PRODUCTS.map((p) => ({ ...p }));
  write(KEY_PRODUCTS, seeded);
  return seeded;
}

function loadUsers() {
  const stored = read(KEY_USERS, null);
  if (Array.isArray(stored) && stored.length > 0) {
    // Agar eski obuna maydoni bo'lmagan foydalanuvchilar bo'lsa, to'ldirib qo'yamiz
    return stored.map((u) => ({
      ...u,
      subscriptionStatus: u.subscriptionStatus || 'active',
      subscriptionExpiresAt: u.subscriptionExpiresAt || getDefaultNextYear(),
    }));
  }
  write(KEY_USERS, SEED_USERS);
  return SEED_USERS;
}

const sameSku = (a, b) => String(a).trim().toLowerCase() === String(b).trim().toLowerCase();

function cleanProduct(data) {
  return {
    sku: String(data.sku).trim(),
    name: String(data.name).trim(),
    category: data.category,
    unit: data.unit,
    price: Number(data.price),
    stock: round2(Number(data.stock)),
    minStock: round2(Number(data.minStock)),
    receivedAt: data.receivedAt,
  };
}

export const localDriver = {
  // ---------- Mahsulotlar ----------
  async listProducts() {
    return loadProducts();
  },

  async createProduct(data) {
    const products = loadProducts();
    if (products.some((p) => sameSku(p.sku, data.sku))) {
      throw new Error(`«${data.sku}» artikuli allaqachon mavjud.`);
    }
    const product = { id: makeId('p'), ...cleanProduct(data) };
    write(KEY_PRODUCTS, [...products, product]);
    return product;
  },

  async updateProduct(id, data) {
    const products = loadProducts();
    const index = products.findIndex((p) => p.id === id);
    if (index === -1) throw new Error('Mahsulot topilmadi.');
    if (products.some((p) => p.id !== id && sameSku(p.sku, data.sku))) {
      throw new Error(`«${data.sku}» artikuli boshqa mahsulotda ishlatilgan.`);
    }
    const product = { id, ...cleanProduct(data) };
    const next = [...products];
    next[index] = product;
    write(KEY_PRODUCTS, next);
    return product;
  },

  async deleteProduct(id) {
    write(
      KEY_PRODUCTS,
      loadProducts().filter((p) => p.id !== id),
    );
  },

  // ---------- Sotuvlar ----------
  async listSales() {
    return read(KEY_SALES, []);
  },

  async createSale({ items }) {
    if (!Array.isArray(items) || items.length === 0) throw new Error("Savat bo'sh.");

    const products = loadProducts().map((p) => ({ ...p }));
    const sales = read(KEY_SALES, []);

    // Bir xil mahsulot takrorlansa, miqdorlarini qo'shib olamiz
    const wanted = new Map();
    for (const { productId, quantity } of items) {
      wanted.set(productId, round2((wanted.get(productId) ?? 0) + Number(quantity)));
    }

    const saleItems = [];
    for (const [productId, quantity] of wanted) {
      const p = products.find((x) => x.id === productId);
      if (!p) throw new Error('Savatdagi mahsulot omborda topilmadi.');
      if (!(quantity > 0)) throw new Error(`«${p.name}» uchun miqdor noto'g'ri.`);
      if (quantity > p.stock + EPS) {
        throw new Error(
          `«${p.name}» uchun omborda yetarli qoldiq yo'q (qoldiq: ${fmtQty(p.stock)} ${p.unit}).`,
        );
      }
      saleItems.push({
        productId: p.id,
        sku: p.sku,
        name: p.name,
        category: p.category,
        unit: p.unit,
        receivedAt: p.receivedAt,
        unitPrice: p.price,
        quantity,
        lineTotal: lineTotal(p.price, quantity),
      });
      p.stock = round2(Math.max(0, p.stock - quantity)); // qoldiqni kamaytirish
    }

    const sale = {
      id: makeId('s'),
      number: String(sales.length + 1).padStart(6, '0'),
      createdAt: new Date().toISOString(),
      total: saleItems.reduce((sum, i) => sum + i.lineTotal, 0),
      items: saleItems,
    };

    write(KEY_PRODUCTS, products);
    write(KEY_SALES, [...sales, sale]);
    return sale;
  },

  // ---------- Foydalanuvchilar va Rollar (Super Admin & Kassirlar) ----------
  async listUsers() {
    return loadUsers();
  },

  async createUser(data) {
    const users = loadUsers();
    const cleanPhone = String(data.phone).replace(/\D/g, '').slice(-9);

    if (users.some((u) => u.phone === cleanPhone)) {
      throw new Error(`Ushbu telefon raqam (${cleanPhone}) bilan foydalanuvchi allaqachon mavjud.`);
    }

    const newUser = {
      id: makeId('u'),
      role: data.role || 'kassir',
      fullName: String(data.fullName || '').trim(),
      phone: cleanPhone,
      password: String(data.password || '').trim(),
      centerName: String(data.centerName || '').trim(),
      subscriptionStatus: data.subscriptionStatus || 'active',
      subscriptionExpiresAt: data.subscriptionExpiresAt || getDefaultNextYear(),
      createdAt: new Date().toISOString(),
    };

    const next = [...users, newUser];
    write(KEY_USERS, next);
    return newUser;
  },

  async updateUser(id, data) {
    const users = loadUsers();
    const index = users.findIndex((u) => u.id === id);
    if (index === -1) throw new Error('Foydalanuvchi topilmadi.');

    const cleanPhone = String(data.phone || users[index].phone).replace(/\D/g, '').slice(-9);
    if (users.some((u) => u.id !== id && u.phone === cleanPhone)) {
      throw new Error(`Ushbu telefon raqam (${cleanPhone}) boshqa foydalanuvchida mavjud.`);
    }

    const updated = {
      ...users[index],
      fullName: data.fullName !== undefined ? String(data.fullName).trim() : users[index].fullName,
      phone: cleanPhone,
      password: data.password !== undefined && String(data.password).trim() !== '' ? String(data.password).trim() : users[index].password,
      centerName: data.centerName !== undefined ? String(data.centerName).trim() : users[index].centerName,
      subscriptionStatus: data.subscriptionStatus !== undefined ? data.subscriptionStatus : users[index].subscriptionStatus,
      subscriptionExpiresAt: data.subscriptionExpiresAt !== undefined ? data.subscriptionExpiresAt : users[index].subscriptionExpiresAt,
    };

    const next = [...users];
    next[index] = updated;
    write(KEY_USERS, next);
    return updated;
  },

  async updateSubscription(id, { status, expiresAt }) {
    const users = loadUsers();
    const index = users.findIndex((u) => u.id === id);
    if (index === -1) throw new Error('Foydalanuvchi topilmadi.');

    users[index] = {
      ...users[index],
      subscriptionStatus: status !== undefined ? status : users[index].subscriptionStatus,
      subscriptionExpiresAt: expiresAt !== undefined ? expiresAt : users[index].subscriptionExpiresAt,
    };

    write(KEY_USERS, [...users]);
    return users[index];
  },

  async deleteUser(id) {
    const users = loadUsers();
    const target = users.find((u) => u.id === id);
    if (target && target.role === 'super_admin') {
      throw new Error('Super admin hisobini o\'chirib bo\'lmaydi.');
    }
    const next = users.filter((u) => u.id !== id);
    write(KEY_USERS, next);
  },

  async login(phone, password) {
    const users = loadUsers();
    const cleanPhone = String(phone).replace(/\D/g, '').slice(-9);
    const cleanPass = String(password).trim();

    const user = users.find((u) => u.phone === cleanPhone && u.password === cleanPass);
    if (!user) {
      throw new Error('Telefon raqam yoki parol noto\'g\'ri.');
    }

    return {
      id: user.id,
      role: user.role,
      fullName: user.fullName,
      phone: user.phone,
      centerName: user.centerName,
      subscriptionStatus: user.subscriptionStatus || 'active',
      subscriptionExpiresAt: user.subscriptionExpiresAt || getDefaultNextYear(),
      token: 'local-token-' + user.id,
    };
  },

  async updateProfile(userId, { phone, oldPassword, newPassword }) {
    const users = loadUsers();
    const index = users.findIndex((u) => u.id === userId);
    if (index === -1) throw new Error('Foydalanuvchi topilmadi.');

    if (newPassword) {
      if (!oldPassword || users[index].password !== oldPassword) {
        throw new Error('Joriy parol noto\'g\'ri.');
      }
    }

    const cleanPhone = phone
      ? String(phone).replace(/\D/g, '').slice(-9)
      : users[index].phone;
    if (phone && users.some((u) => u.id !== userId && u.phone === cleanPhone)) {
      throw new Error(`Ushbu telefon raqam (${cleanPhone}) boshqa foydalanuvchida mavjud.`);
    }

    const updated = {
      ...users[index],
      phone: cleanPhone,
      password: newPassword || users[index].password,
    };
    const next = [...users];
    next[index] = updated;
    write(KEY_USERS, next);
    return updated;
  },

  async listMarkazlar() {
    return loadMarkazlar();
  },
  async createMarkaz({ name, address }) {
    const list = loadMarkazlar();
    const m = { id: makeId('m'), name: String(name).trim(), address: String(address ?? '').trim() };
    write(KEY_MARKAZLAR, [...list, m]);
    return m;
  },
  async updateMarkaz(id, { name, address }) {
    const list = loadMarkazlar();
    const idx = list.findIndex((m) => m.id === id);
    if (idx === -1) throw new Error('Markaz topilmadi.');
    const updated = { ...list[idx], name: String(name).trim(), address: String(address ?? '').trim() };
    const next = [...list];
    next[idx] = updated;
    write(KEY_MARKAZLAR, next);
    return updated;
  },
  async deleteMarkaz(id) {
    write(KEY_MARKAZLAR, loadMarkazlar().filter((m) => m.id !== id));
  },

  async listCategories() {
    return loadCategories();
  },
  async createCategory({ key, label, icon, accent }) {
    const categories = loadCategories();
    const cleanKey = String(key || label || '').trim().toLowerCase().replace(/\s+/g, '-');
    if (!cleanKey) throw new Error('Kategoriya kaliti yoki nomi kiritilishi shart.');
    if (categories.some((c) => c.key === cleanKey)) {
      throw new Error(`«${cleanKey}» kalitli kategoriya allaqachon mavjud.`);
    }
    const newCat = {
      key: cleanKey,
      label: String(label || cleanKey).trim(),
      icon: String(icon || '📦').trim(),
      accent: String(accent || '#4E97C4').trim(),
    };
    write(KEY_CATEGORIES, [...categories, newCat]);
    return newCat;
  },
  async updateCategory(key, { label, icon, accent }) {
    const categories = loadCategories();
    const idx = categories.findIndex((c) => c.key === key);
    if (idx === -1) throw new Error('Kategoriya topilmadi.');
    const updated = {
      ...categories[idx],
      label: label !== undefined ? String(label).trim() : categories[idx].label,
      icon: icon !== undefined ? String(icon).trim() : categories[idx].icon,
      accent: accent !== undefined ? String(accent).trim() : categories[idx].accent,
    };
    const next = [...categories];
    next[idx] = updated;
    write(KEY_CATEGORIES, next);
    return updated;
  },
  async deleteCategory(key) {
    const categories = loadCategories();
    write(KEY_CATEGORIES, categories.filter((c) => c.key !== key));
  },

  async getTodayStats() {
    const sales = read(KEY_SALES, []);
    const key = todayKey();
    const todays = sales.filter((s) => dateKeyOf(s.createdAt) === key);
    return { count: todays.length, total: todays.reduce((sum, s) => sum + s.total, 0) };
  },

  async submitContactMessage({ name, phone, message }) {
    const cleanName = String(name ?? '').trim();
    const cleanPhone = String(phone ?? '').trim();
    const cleanMessage = String(message ?? '').trim();

    if (!cleanName) throw new Error('Ismingizni kiriting.');
    if (!cleanPhone) throw new Error('Telefon raqamingizni kiriting.');
    if (!cleanMessage) throw new Error('Xabar matnini kiriting.');

    const KEY_CONTACT_MESSAGES = 'multipos:contactMessages:v1';
    const raw = localStorage.getItem(KEY_CONTACT_MESSAGES);
    const list = raw ? JSON.parse(raw) : [];

    const entry = {
      id: makeId('cm'),
      name: cleanName,
      phone: cleanPhone,
      message: cleanMessage,
      createdAt: new Date().toISOString(),
    };

    localStorage.setItem(KEY_CONTACT_MESSAGES, JSON.stringify([...list, entry]));
    return entry;
  },

  // ---------- Auth Storage ----------
  getAuth() {
    try {
      const raw = localStorage.getItem('multipos:auth');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },
  setAuth(data) {
    localStorage.setItem('multipos:auth', JSON.stringify(data));
  },
  removeAuth() {
    localStorage.removeItem('multipos:auth');
  },
};
