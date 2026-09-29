import { useMemo, useState } from 'react';
import ChekModal from './components/ChekModal';
import Header from './components/Header';
import HomePage from './components/HomePage';
import Kassa from './components/Kassa';
import LoginPage from './components/LoginPage';
import Ombor from './components/Ombor';
import ProfileModal from './components/ProfileModal';
import SuperAdminDashboard from './components/SuperAdminDashboard';
import { useAuth } from './hooks/useAuth';
import { useCart } from './hooks/useCart';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useProducts } from './hooks/useProducts';
import { useSales } from './hooks/useSales';
import { dateKeyOf, todayKey } from './utils/format';

const DEFAULT_STORE_NAME = 'MUSTAHKAM SAVDO MARKAZI';

export default function App() {
  const { user, loading: authLoading, error: authError, login, updateProfile, logout } = useAuth();

  // Sahifalar: 'home' | 'login'
  const [guestPage, setGuestPage] = useState('home');

  // Profil modal holati
  const [showProfile, setShowProfile] = useState(false);

  const { products, loading, error, reload, saveProduct, deleteProduct } = useProducts();
  const { sales, createSale } = useSales();
  const cart = useCart(products);

  const [tab, setTab] = useState('kassa');
  const [receipt, setReceipt] = useState(null); // oxirgi sotuv (chek oynasi uchun)
  const [storeName, setStoreName] = useLocalStorage('multipos:storeName', DEFAULT_STORE_NAME);

  const today = useMemo(() => {
    const key = todayKey();
    const list = sales.filter((s) => dateKeyOf(s.createdAt) === key);
    return { count: list.length, sum: list.reduce((sum, s) => sum + s.total, 0) };
  }, [sales]);

  // Sotuvni yakunlash
  const handleCheckout = async () => {
    if (cart.lines.length === 0) return;
    const sale = await createSale(
      cart.lines.map((l) => ({ productId: l.product.id, quantity: l.quantity })),
    );
    await reload();
    cart.clear();
    setReceipt(sale);
  };

  const handleLogout = () => {
    logout();
    setGuestPage('home');
  };

  // 1. Agar foydalanuvchi tizimga kirmagan bo'lsa
  if (!user) {
    if (guestPage === 'login') {
      return (
        <LoginPage
          onLogin={async (phone, pass) => {
            await login(phone, pass);
          }}
          loading={authLoading}
          error={authError}
          onBack={() => setGuestPage('home')}
        />
      );
    }
    return <HomePage onGoLogin={() => setGuestPage('login')} />;
  }

  // 2. Agar foydalanuvchi Super Admin bo'lsa — uning o'ziga xos boshqaruv paneli
  if (user.role === 'super_admin') {
    return (
      <>
        <SuperAdminDashboard
          user={user}
          onLogout={handleLogout}
          onOpenProfile={() => setShowProfile(true)}
        />

        {showProfile && (
          <ProfileModal
            user={user}
            onClose={() => setShowProfile(false)}
            onUpdateProfile={updateProfile}
          />
        )}
      </>
    );
  }

  // 3. Kassir tizimi (Kassa & Ombor)
  const effectiveStoreName = user.centerName || storeName || DEFAULT_STORE_NAME;

  return (
    <div className="min-h-screen bg-bg text-ink">
      <Header
        storeName={effectiveStoreName}
        onStoreNameChange={setStoreName}
        tab={tab}
        onTabChange={setTab}
        salesCount={today.count}
        salesSum={today.sum}
        user={user}
        onLogout={handleLogout}
        onOpenProfile={() => setShowProfile(true)}
      />

      <main className="mx-auto max-w-[1500px] px-5 py-6">
        {error && (
          <div
            role="alert"
            className="mb-4 flex items-center justify-between gap-4 border border-rust/50 bg-rust/10 px-4 py-3 text-sm text-rust"
          >
            <span>{error}</span>
            <button type="button" onClick={reload} className="btn btn-ghost py-1">
              Qayta urinish
            </button>
          </div>
        )}

        {tab === 'kassa' ? (
          <Kassa products={products} loading={loading} cart={cart} onCheckout={handleCheckout} />
        ) : (
          <Ombor
            products={products}
            loading={loading}
            onSave={saveProduct}
            onDelete={deleteProduct}
            sales={sales}
          />
        )}
      </main>

      {/* Chek Modali */}
      {receipt && (
        <ChekModal
          sale={receipt}
          storeName={effectiveStoreName.trim() || DEFAULT_STORE_NAME}
          onClose={() => setReceipt(null)}
        />
      )}

      {/* Profil Modali */}
      {showProfile && (
        <ProfileModal
          user={user}
          onClose={() => setShowProfile(false)}
          onUpdateProfile={updateProfile}
        />
      )}
    </div>
  );
}
