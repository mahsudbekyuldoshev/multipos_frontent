// REST API drayveri — Django REST Framework backend (JWT). To'liq shartnoma: docs/BACKEND_API.md
// `.env.local` da VITE_USE_API=true qilinsa ishlatiladi.
//
// MUHIM: bu fayl "anti-corruption layer" — backend qaytargan ma'lumotni (snake_case, string
// sonlar, boshqa maydon nomlari, pagination o'rami, rol nomlari superadmin/cashier) ilovaning
// ICHKI, localDriver.js bilan bir xil shakliga o'giradi (id:string, stock/minStock/receivedAt,
// role: super_admin/kassir, number sonlar). Shu tufayli UI komponentlarining aksariyati
// o'zgarishsiz qoladi.

const ROOT_URL = (import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000').replace(/\/$/, '');
const V1 = `${ROOT_URL}/api/v1`;
const AUTH_KEY = 'multipos:auth'; // { access, refresh, user }

function getStoredAuth() {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
function storeAuth(data) {
  localStorage.setItem(AUTH_KEY, JSON.stringify(data));
}

function toFullPhone(phone) {
  const digits = String(phone ?? '').replace(/\D/g, '');
  if (digits.startsWith('998') && digits.length === 12) return digits;
  return `998${digits.slice(-9)}`;
}

const ROLE_FROM_BACKEND = { superadmin: 'super_admin', cashier: 'kassir' };

function extractErrorMessage(data) {
  if (!data) return "Noma'lum xatolik yuz berdi.";
  if (data.message) return data.message;
  if (data.detail) return data.detail;
  const firstField = Object.values(data)[0];
  if (Array.isArray(firstField)) return firstField[0];
  return "Ma'lumotlarni tekshiring.";
}

function productFromBackend(p) {
  return {
    id: String(p.id),
    sku: p.sku,
    name: p.name,
    category: p.category,
    unit: p.unit,
    price: Number(p.price),
    stock: Number(p.qty),
    minStock: Number(p.min),
    receivedAt: p.dateReceived,
  };
}
function productToBackend(p) {
  return {
    sku: p.sku,
    name: p.name,
    category: p.category,
    unit: p.unit,
    price: Number(p.price),
    qty: Number(p.stock),
    min: Number(p.minStock),
    date_received: p.receivedAt,
  };
}

function userFromBackend(u) {
  return {
    id: String(u.id),
    role: ROLE_FROM_BACKEND[u.role] ?? u.role,
    fullName: `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim(),
    phone: u.phoneNumber,
    centerName: u.markaz?.name ?? '',
    markazId: u.markaz?.id != null ? String(u.markaz.id) : null,
    subscriptionStatus: 'active',
    subscriptionExpiresAt: null,
  };
}

function saleFromBackend(s) {
  return {
    id: s.id,
    number: s.id,
    createdAt: s.date,
    total: Number(s.total),
    items: (s.items || []).map((it) => ({
      productId: String(it.productId),
      sku: it.sku,
      name: it.name,
      category: it.category,
      unit: it.unit,
      receivedAt: it.dateReceived,
      unitPrice: Number(it.price),
      quantity: Number(it.qty),
      lineTotal: Number(it.subtotal),
    })),
  };
}

function markazFromBackend(m) {
  return { id: String(m.id), name: m.name, address: m.address ?? '' };
}

async function rawFetch(url, options) {
  const auth = getStoredAuth();
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(auth?.access ? { Authorization: `Bearer ${auth.access}` } : {}),
      ...(options?.headers || {}),
    },
  });
}

async function refreshAccessToken() {
  const auth = getStoredAuth();
  if (!auth?.refresh) throw new Error('Sessiya tugagan. Qaytadan kiring.');
  const res = await fetch(`${ROOT_URL}/api/token/refresh/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh: auth.refresh }),
  });
  if (!res.ok) throw new Error('Sessiya tugagan. Qaytadan kiring.');
  const data = await res.json();
  storeAuth({ ...auth, access: data.access });
  return data.access;
}

async function request(path, options = {}) {
  let res = await rawFetch(`${V1}${path}`, options);

  if (res.status === 401) {
    try {
      await refreshAccessToken();
      res = await rawFetch(`${V1}${path}`, options);
    } catch (err) {
      localStorage.removeItem(AUTH_KEY);
      throw err;
    }
  }

  const raw = await res.text();
  let data = null;
  if (raw) {
    try {
      data = JSON.parse(raw);
    } catch {
      data = null;
    }
  }

  if (!res.ok) {
    throw new Error(extractErrorMessage(data));
  }
  return data;
}

async function requestList(path, options = {}) {
  const sep = path.includes('?') ? '&' : '?';
  const data = await request(`${path}${sep}page_size=200`, options);
  return Array.isArray(data) ? data : (data?.results ?? []);
}

export const httpDriver = {
  async login(phone, password) {
    const res = await fetch(`${ROOT_URL}/api/token/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone_number: toFullPhone(phone), password }),
    });
    const raw = await res.text();
    const data = raw ? JSON.parse(raw) : null;

    if (!res.ok) {
      if (res.status === 401) throw new Error("Telefon raqam yoki parol noto'g'ri.");
      if (res.status === 403) {
        throw new Error(
          extractErrorMessage(data) ||
            "Obunangiz to'xtatilgan yoki muddati tugagan. Administrator bilan bog'laning.",
        );
      }
      throw new Error(extractErrorMessage(data));
    }

    storeAuth({ access: data.access, refresh: data.refresh, user: null });
    const profile = await request('/profile/');
    const user = userFromBackend(profile);
    storeAuth({ access: data.access, refresh: data.refresh, user });

    return { token: data.access, user };
  },

  async updateProfile(_userId, { phone, oldPassword, newPassword }) {
    const body = {};
    if (phone) body.phone_number = toFullPhone(phone);
    if (newPassword) {
      body.old_password = oldPassword;
      body.new_password = newPassword;
    }
    const updated = await request('/profile/', { method: 'PATCH', body: JSON.stringify(body) });
    return {
      fullName: `${updated.firstName ?? ''} ${updated.lastName ?? ''}`.trim(),
      phone: updated.phoneNumber,
      centerName: updated.markaz?.name ?? '',
    };
  },

  async listProducts() {
    return (await requestList('/products/')).map(productFromBackend);
  },
  async createProduct(data) {
    return productFromBackend(
      await request('/products/', { method: 'POST', body: JSON.stringify(productToBackend(data)) }),
    );
  },
  async updateProduct(id, data) {
    return productFromBackend(
      await request(`/products/${encodeURIComponent(id)}/`, {
        method: 'PUT',
        body: JSON.stringify(productToBackend(data)),
      }),
    );
  },
  async deleteProduct(id) {
    return request(`/products/${encodeURIComponent(id)}/`, { method: 'DELETE' });
  },

  async listSales() {
    return (await requestList('/sales/')).map(saleFromBackend);
  },
  async createSale({ items }) {
    const auth = getStoredAuth();
    const body = {
      items: items.map((i) => ({ product_id: Number(i.productId), qty: i.quantity })),
      cashier: auth?.user?.fullName ?? '',
    };
    return saleFromBackend(await request('/sales/', { method: 'POST', body: JSON.stringify(body) }));
  },
  async getTodayStats() {
    const data = await request('/sales/stats/today/');
    return { count: data.count ?? 0, total: Number(data.total ?? 0) };
  },

  async listUsers() {
    return (await requestList('/users/')).map(userFromBackend);
  },
  async createUser(data) {
    const [firstName, ...rest] = String(data.fullName ?? '').trim().split(' ');
    const body = {
      phone_number: toFullPhone(data.phone),
      first_name: firstName || '',
      last_name: rest.join(' '),
      password: data.password,
      markaz: data.markazId ? Number(data.markazId) : null,
    };
    return userFromBackend(await request('/users/', { method: 'POST', body: JSON.stringify(body) }));
  },
  async updateUser(id, data) {
    const [firstName, ...rest] = String(data.fullName ?? '').trim().split(' ');
    const body = {
      phone_number: toFullPhone(data.phone),
      first_name: firstName || '',
      last_name: rest.join(' '),
      markaz: data.markazId ? Number(data.markazId) : null,
    };
    if (data.password) body.password = data.password;
    return userFromBackend(
      await request(`/users/${encodeURIComponent(id)}/`, { method: 'PATCH', body: JSON.stringify(body) }),
    );
  },
  async updateSubscription(id, { status, expiresAt }) {
    return userFromBackend(
      await request(`/users/${encodeURIComponent(id)}/subscription/`, {
        method: 'PUT',
        body: JSON.stringify({ status, expiresAt }),
      }),
    );
  },
  async deleteUser(id) {
    return request(`/users/${encodeURIComponent(id)}/`, { method: 'DELETE' });
  },

  async listMarkazlar() {
    return (await requestList('/markazlar/')).map(markazFromBackend);
  },
  async createMarkaz(data) {
    return markazFromBackend(
      await request('/markazlar/', {
        method: 'POST',
        body: JSON.stringify({ name: data.name, address: data.address }),
      }),
    );
  },
  async updateMarkaz(id, data) {
    return markazFromBackend(
      await request(`/markazlar/${encodeURIComponent(id)}/`, {
        method: 'PUT',
        body: JSON.stringify({ name: data.name, address: data.address }),
      }),
    );
  },
  async deleteMarkaz(id) {
    return request(`/markazlar/${encodeURIComponent(id)}/`, { method: 'DELETE' });
  },

  async listCategories() {
    return requestList('/categories/');
  },
  async createCategory(data) {
    return request('/categories/', { method: 'POST', body: JSON.stringify(data) });
  },
  async updateCategory(key, data) {
    return request(`/categories/${encodeURIComponent(key)}/`, { method: 'PUT', body: JSON.stringify(data) });
  },
  async deleteCategory(key) {
    return request(`/categories/${encodeURIComponent(key)}/`, { method: 'DELETE' });
  },

  async submitContactMessage({ name, phone, message }) {
    return request('/contact/', { method: 'POST', body: JSON.stringify({ name, phone, message }) });
  },

  // getAuth/setAuth/removeAuth — bular backend endpointlari EMAS, faqat brauzer localStorage bilan ishlaydigan yordamchi metodlar (auth token saqlash uchun).
  getAuth() {
    const auth = getStoredAuth();
    if (!auth) return null;
    return auth.user ? { ...auth.user, token: auth.access } : null;
  },
  setAuth(data) {
    const current = getStoredAuth() || {};
    storeAuth({ ...current, user: data, access: data?.token || current.access });
  },
  removeAuth() {
    localStorage.removeItem(AUTH_KEY);
  },
};
