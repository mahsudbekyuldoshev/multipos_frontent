import { useCallback, useState } from 'react';
import { api } from '../services/api';

const AUTH_KEY = 'multipos:auth';

export function useAuth() {
  const [user, setUser] = useState(() => api.getAuth());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const login = useCallback(async (phone, password) => {
    setLoading(true);
    setError('');
    try {
      const cleanPhone = String(phone).replace(/\D/g, '').slice(-9);
      if (!cleanPhone || cleanPhone.length < 9) {
        throw new Error("Telefon raqamni to'liq 9 xonali qilib kiriting.");
      }
      if (!password || String(password).trim().length < 3) {
        throw new Error("Parolni kiriting.");
      }

      const res = await api.login(cleanPhone, password);
      // Backend yoki localDriver qaytargan ma'lumot
      const userData = res.user ? { ...res.user, token: res.token } : res;

      api.setAuth(userData);
      setUser(userData);
      return userData;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateProfile = useCallback(async (payload) => {
    if (!user?.id) return;
    setLoading(true);
    setError('');
    try {
      const updated = await api.updateProfile(user.id, payload);
      const newUserData = {
        ...user,
        fullName: updated.fullName ?? user.fullName,
        phone: updated.phone ?? user.phone,
        centerName: updated.centerName !== undefined ? updated.centerName : user.centerName,
      };
      api.setAuth(newUserData);
      setUser(newUserData);
      return newUserData;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const logout = useCallback(() => {
    api.removeAuth();
    setUser(null);
  }, []);

  return { user, loading, error, login, updateProfile, logout };
}
