import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ShoppingCart, Warehouse, Users, FileText } from 'lucide-react';

const sampleTrend = [
  { date: '2026-06-01', sales: 24000, purchase: 18000 },
  { date: '2026-06-08', sales: 32000, purchase: 21000 },
  { date: '2026-06-15', sales: 28000, purchase: 17000 },
  { date: '2026-06-22', sales: 41000, purchase: 26000 },
  { date: '2026-06-29', sales: 36000, purchase: 23000 },
];

const cards = [
  { title: 'Open Sales Orders', value: '14', icon: ShoppingCart, color: 'text-[var(--color-apple-blue)]' },
  { title: 'Inventory Items', value: '1,284', icon: Warehouse, color: 'text-emerald-600' },
  { title: 'Active Members', value: '38', icon: Users, color: 'text-orange-500' },
  { title: 'Pending Approvals', value: '7', icon: FileText, color: 'text-red-500' },
];

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-[var(--color-ink)]">Overview</h2>
        <p className="text-sm text-[var(--color-ink-secondary)]">Welcome to your ERP workspace.</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {cards.map((card) => (
          <div key={card.title} className="rounded-2xl border border-[var(--color-border)] bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-[var(--color-ink-secondary)]">{card.title}</div>
              <card.icon className={`h-5 w-5 ${card.color}`}/>
            </div>
            <div className="mt-2 text-3xl font-bold text-[var(--color-ink)]">{card.value}</div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-[var(--color-border)] bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-widest text-[var(--color-ink-secondary)]">Sales vs Purchases</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sampleTrend}>
              <defs>
                <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0071e3" stopOpacity={0.18}/>
                  <stop offset="95%" stopColor="#0071e3" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="purchaseGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#34c759" stopOpacity={0.18}/>
                  <stop offset="95%" stopColor="#34c759" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{fontSize:12}} tickLine={false} axisLine={false} stroke="#86868b"/>
              <YAxis tick={{fontSize:12}} tickLine={false} axisLine={false} stroke="#86868b"/>
              <CartesianGrid vertical={false} stroke="#e5e5ea"/>
              <Tooltip contentStyle={{borderRadius:12, border:'1px solid #d2d2d7'}}/>
              <Area type="monotone" dataKey="sales" stroke="#0071e3" fill="url(#salesGradient)" strokeWidth={2}/>
              <Area type="monotone" dataKey="purchase" stroke="#34c759" fill="url(#purchaseGradient)" strokeWidth={2}/>
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
