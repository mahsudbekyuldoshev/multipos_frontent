import { useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { fmtMoney, fmtQty } from '../utils/format';

// ── Davr tanlash ──────────────────────────────────────────────
const PERIODS = [
  { key: 'day', label: 'Kunlik' },
  { key: 'week', label: 'Haftalik' },
  { key: 'month', label: 'Oylik' },
  { key: 'year', label: 'Yillik' },
];

// Sana labellarini yaratish
function getDateLabel(dateKey, period) {
  const [y, m, d] = dateKey.split('-').map(Number);
  if (period === 'day') return `${d < 10 ? '0' + d : d}:00`;
  if (period === 'week') {
    const days = ['Yak', 'Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh'];
    return days[new Date(y, m - 1, d).getDay()] + ` ${d < 10 ? '0' + d : d}`;
  }
  if (period === 'month') return `${d < 10 ? '0' + d : d}.${m < 10 ? '0' + m : m}`;
  if (period === 'year') {
    const months = ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyn', 'Iyl', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek'];
    return months[m - 1];
  }
  return dateKey;
}

// Sales ma'lumotlarini davr bo'yicha guruhlaymiz
function buildChartData(sales, period) {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');

  // Qaysi sotuvlarni ko'rsatamiz va qanday kalit bilan guruhlaymiz
  let filtered = [];
  let keyOf;

  if (period === 'day') {
    // Bugungi sotuv, soat bo'yicha
    const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    filtered = sales.filter((s) => s.createdAt.slice(0, 10) === todayStr);
    keyOf = (s) => `${s.createdAt.slice(0, 10)}-${pad(new Date(s.createdAt).getHours())}`;
  } else if (period === 'week') {
    // Oxirgi 7 kun
    const cutoff = new Date(now);
    cutoff.setDate(now.getDate() - 6);
    cutoff.setHours(0, 0, 0, 0);
    filtered = sales.filter((s) => new Date(s.createdAt) >= cutoff);
    keyOf = (s) => s.createdAt.slice(0, 10);
  } else if (period === 'month') {
    // Joriy oy
    const monthStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}`;
    filtered = sales.filter((s) => s.createdAt.slice(0, 7) === monthStr);
    keyOf = (s) => s.createdAt.slice(0, 10);
  } else {
    // Joriy yil, oy bo'yicha
    const yearStr = `${now.getFullYear()}`;
    filtered = sales.filter((s) => s.createdAt.slice(0, 4) === yearStr);
    keyOf = (s) => s.createdAt.slice(0, 7) + '-01';
  }

  // Guruhlaymiz
  const map = new Map();
  for (const sale of filtered) {
    const k = keyOf(sale);
    const prev = map.get(k) ?? { revenue: 0, count: 0, items: 0 };
    map.set(k, {
      revenue: prev.revenue + sale.total,
      count: prev.count + 1,
      items: prev.items + sale.items.reduce((s, i) => s + i.quantity, 0),
    });
  }

  // Bo'sh nuqtalar uchun to'liq qator yaratamiz
  const slots = buildSlots(period, now);
  return slots.map(({ key, label }) => {
    const d = map.get(key) ?? { revenue: 0, count: 0, items: 0 };
    return { key, label, ...d };
  });
}

function buildSlots(period, now) {
  const pad = (n) => String(n).padStart(2, '0');
  const slots = [];

  if (period === 'day') {
    const dateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    for (let h = 0; h < 24; h++) {
      const key = `${dateStr}-${pad(h)}`;
      slots.push({ key, label: `${pad(h)}:00` });
    }
  } else if (period === 'week') {
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const key = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
      slots.push({ key, label: getDateLabel(key, 'week') });
    }
  } else if (period === 'month') {
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const daysInMonth = new Date(year, month, 0).getDate();
    for (let day = 1; day <= daysInMonth; day++) {
      const key = `${year}-${pad(month)}-${pad(day)}`;
      slots.push({ key, label: `${pad(day)}` });
    }
  } else {
    const year = now.getFullYear();
    for (let m = 1; m <= 12; m++) {
      const key = `${year}-${pad(m)}-01`;
      const months = ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyn', 'Iyl', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek'];
      slots.push({ key, label: months[m - 1] });
    }
  }
  return slots;
}

// ── Tooltip ──────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-line bg-panel px-4 py-3 text-xs shadow-xl">
      <div className="mb-1 font-head text-xs uppercase text-mute">{label}</div>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
          <span className="text-mute">{p.name}:</span>
          <span className="font-semibold text-ink">
            {p.dataKey === 'revenue' ? `${fmtMoney(p.value)} so'm` : fmtQty(p.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Katta raqam kartasi ───────────────────────────────────────
function StatCard({ label, value, sub, color = 'text-ink' }) {
  return (
    <div className="rounded-xl border border-line bg-paper px-5 py-4">
      <div className="text-xs text-mute">{label}</div>
      <div className={`mt-1 font-num text-2xl font-semibold ${color}`}>{value}</div>
      {sub && <div className="mt-0.5 text-xs text-mute">{sub}</div>}
    </div>
  );
}

// ── Asosiy komponent ──────────────────────────────────────────
export default function SalesChart({ sales }) {
  const [period, setPeriod] = useState('week');
  const [chartType, setChartType] = useState('revenue'); // 'revenue' | 'count' | 'items'

  const data = useMemo(() => buildChartData(sales, period), [sales, period]);

  const totals = useMemo(() => {
    const revenue = data.reduce((s, d) => s + d.revenue, 0);
    const count = data.reduce((s, d) => s + d.count, 0);
    const items = data.reduce((s, d) => s + d.items, 0);
    return { revenue, count, items };
  }, [data]);

  const periodLabel = PERIODS.find((p) => p.key === period)?.label ?? '';

  const chartConfig = {
    revenue: { name: 'Tushum', color: '#4E97C4', gradient: 'revenueGrad' },
    count: { name: 'Cheklar soni', color: '#F0821E', gradient: 'countGrad' },
    items: { name: 'Sotilgan dona', color: '#67B26F', gradient: 'itemsGrad' },
  };
  const cfg = chartConfig[chartType];

  const yTickFormatter = (v) =>
    chartType === 'revenue'
      ? v >= 1_000_000
        ? `${(v / 1_000_000).toFixed(1)}M`
        : v >= 1_000
        ? `${(v / 1_000).toFixed(0)}K`
        : String(v)
      : String(v);

  return (
    <div className="mt-6 space-y-4">
      {/* Sarlavha + davr tugmalari */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-head text-base uppercase tracking-wide">Sotuv statistikasi</h3>
        <div className="flex gap-1 rounded-xl border border-line bg-paper p-1">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => setPeriod(p.key)}
              className={`rounded-lg px-3 py-1.5 font-head text-xs uppercase tracking-wide transition-all ${
                period === p.key
                  ? 'bg-steel text-onaccent shadow'
                  : 'text-mute hover:text-ink'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stat kartalar */}
      <div className="grid grid-cols-3 gap-3">
        <button type="button" onClick={() => setChartType('revenue')} className="text-left">
          <div
            className={`rounded-xl border px-5 py-4 transition-all ${
              chartType === 'revenue'
                ? 'border-steel/60 bg-steel/10'
                : 'border-line bg-paper hover:border-steel/30'
            }`}
          >
            <div className="text-xs text-mute">{periodLabel} tushum</div>
            <div className="mt-1 font-num text-2xl font-semibold text-steel">
              {fmtMoney(totals.revenue)}
              <span className="ml-1 text-sm font-normal text-mute">so'm</span>
            </div>
          </div>
        </button>

        <button type="button" onClick={() => setChartType('count')} className="text-left">
          <div
            className={`rounded-xl border px-5 py-4 transition-all ${
              chartType === 'count'
                ? 'border-safety/60 bg-safety/10'
                : 'border-line bg-paper hover:border-safety/30'
            }`}
          >
            <div className="text-xs text-mute">{periodLabel} cheklar</div>
            <div className="mt-1 font-num text-2xl font-semibold text-safety">
              {totals.count}
              <span className="ml-1 text-sm font-normal text-mute">ta chek</span>
            </div>
          </div>
        </button>

        <button type="button" onClick={() => setChartType('items')} className="text-left">
          <div
            className={`rounded-xl border px-5 py-4 transition-all ${
              chartType === 'items'
                ? 'border-moss/60 bg-moss/10'
                : 'border-line bg-paper hover:border-moss/30'
            }`}
          >
            <div className="text-xs text-mute">{periodLabel} sotilgan</div>
            <div className="mt-1 font-num text-2xl font-semibold text-moss">
              {fmtQty(totals.items)}
              <span className="ml-1 text-sm font-normal text-mute">dona</span>
            </div>
          </div>
        </button>
      </div>

      {/* Chart */}
      <div className="rounded-xl border border-line bg-paper p-4 pt-5">
        <div className="mb-3 flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: cfg.color }} />
          <span className="font-head text-xs uppercase tracking-wide text-mute">{cfg.name}</span>
        </div>

        {totals.count === 0 ? (
          <div className="flex h-48 items-center justify-center text-sm text-mute">
            {periodLabel} uchun sotuv ma'lumotlari yo'q
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            {period === 'year' || period === 'month' ? (
              <BarChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id={cfg.gradient} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={cfg.color} stopOpacity={0.9} />
                    <stop offset="95%" stopColor={cfg.color} stopOpacity={0.5} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#2E3340" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fill: '#8F929B', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  interval={period === 'month' ? 4 : 0}
                />
                <YAxis
                  tickFormatter={yTickFormatter}
                  tick={{ fill: '#8F929B', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={50}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(78,151,196,0.08)' }} />
                <Bar
                  dataKey={chartType}
                  name={cfg.name}
                  fill={`url(#${cfg.gradient})`}
                  radius={[4, 4, 0, 0]}
                  maxBarSize={40}
                />
              </BarChart>
            ) : (
              <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id={cfg.gradient} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={cfg.color} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={cfg.color} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#2E3340" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fill: '#8F929B', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  interval={period === 'day' ? 2 : 0}
                />
                <YAxis
                  tickFormatter={yTickFormatter}
                  tick={{ fill: '#8F929B', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={50}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey={chartType}
                  name={cfg.name}
                  stroke={cfg.color}
                  strokeWidth={2}
                  fill={`url(#${cfg.gradient})`}
                  dot={false}
                  activeDot={{ r: 5, fill: cfg.color }}
                />
              </AreaChart>
            )}
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
