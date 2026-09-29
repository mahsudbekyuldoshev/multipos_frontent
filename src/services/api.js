// UI faqat shu `api` obyekti bilan ishlaydi. Qaysi drayver ishlatilishi .env orqali tanlanadi.
import { httpDriver } from './httpDriver';
import { localDriver } from './localDriver';

export const api = import.meta.env.VITE_USE_API === 'true' ? httpDriver : localDriver;
