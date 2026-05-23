import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ShoppingCart, Search } from 'lucide-react';
import { adminAPI } from '@/lib/api';
import { formatCurrency, formatDate, getOrderStatusColor } from '@/lib/utils';
import { GoldDivider } from '@/components/brand';
import { MandalaSpinner } from '@/components/brand/MandalaSpinner';
import toast from 'react-hot-toast';

const STATUS_OPTIONS = ['all', 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

export default function AdminOrdersPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-orders', search, status, page],
    queryFn: async () => {
      const res = await adminAPI.orders.list({
        q: search || undefined,
        status: status !== 'all' ? status : undefined,
        page,
        page_size: 20,
      });
      return res.data;
    },
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, nextStatus }) => adminAPI.orders.updateStatus(id, nextStatus),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-orders'] });
      toast.success('Order status updated');
    },
    onError: () => toast.error('Failed to update status'),
  });

  const orders = data?.items ?? [];
  const totalPages = data?.total_pages ?? 1;

  return (
    <div className="p-6 space-y-5">
      <div>
        <p className="text-xs text-[#C9933A] uppercase tracking-widest mb-1">Manage</p>
        <h1 className="text-2xl font-bold text-[#1a0e0e]" style={{ fontFamily: 'var(--font-cormorant)' }}>
          Orders
        </h1>
      </div>

      <GoldDivider />

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#C9933A]" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by order number…"
            className="w-full pl-10 pr-4 py-2.5 text-sm border border-[#E8C97A]/50 rounded-xl outline-none focus:border-[#C9933A]"
          />
        </div>

        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className="px-4 py-2.5 text-sm border border-[#E8C97A]/50 rounded-xl outline-none focus:border-[#C9933A] bg-white capitalize"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s} className="capitalize">
              {s === 'all' ? 'All Statuses' : s}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <MandalaSpinner size={56} />
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#F0E8D5] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#F8F4E8]">
                <tr className="text-left text-xs text-[#9e9790] uppercase tracking-wider">
                  <th className="px-4 py-3">Order</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Payment</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F8F4E8]">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center">
                      <ShoppingCart size={36} className="text-[#E8C97A] mx-auto mb-2" />
                      <p className="text-[#9e9790]">No orders found</p>
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <tr key={order.id} className="hover:bg-[#FEFDF9] transition-colors">
                      <td className="px-4 py-3 font-mono text-xs font-medium text-[#C9933A]">#{order.order_number}</td>
                      <td className="px-4 py-3 text-[#1a0e0e]">{order.shipping_name}</td>
                      <td className="px-4 py-3 text-xs text-[#9e9790]">{formatDate(order.created_at)}</td>
                      <td className="px-4 py-3 font-semibold">{formatCurrency(order.total)}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs px-2 py-1 rounded-full font-medium ${
                            order.payment_verified
                              ? 'bg-green-100 text-green-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}
                        >
                          {order.payment_verified ? 'paid' : 'pending'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={order.status}
                          onChange={(e) => updateStatus.mutate({ id: order.id, nextStatus: e.target.value })}
                          className={`text-xs px-2 py-1.5 rounded-lg border-0 font-medium outline-none cursor-pointer ${getOrderStatusColor(order.status)}`}
                        >
                          {STATUS_OPTIONS.filter((s) => s !== 'all').map((s) => (
                            <option key={s} value={s} className="bg-white text-[#1a0e0e]">
                              {s}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center gap-2 p-4 border-t border-[#F0E8D5]">
              {Array.from({ length: totalPages }, (_, i) => i + 1).slice(0, 10).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-8 h-8 text-xs rounded-lg border transition-colors ${
                    page === p ? 'bg-[#C9933A] text-white border-[#C9933A]' : 'border-[#E8C97A]/50 hover:border-[#C9933A]'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
