import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getUserBookings } from '../../api/bookings';

const statusClass = {
  pending: 'bg-amber-100 text-amber-700',
  confirmed: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-rose-100 text-rose-700'
};

function StatCard({ label, value, hint, icon, color }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-extrabold text-slate-900">{value}</p>
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow ${color}`}>
          <i className={`fas ${icon}`}></i>
        </div>
      </div>
      <p className="mt-3 text-xs font-medium text-slate-500">{hint}</p>
    </article>
  );
}

function CustomSelect({ value, onChange, options, className = '' }) {
  return (
    <div className={`relative ${className}`}>
      <select
        className="h-11 w-full appearance-none rounded-xl border border-slate-300 bg-white px-4 pr-10 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
        value={value}
        onChange={onChange}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      <i className="fas fa-chevron-down pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400"></i>
    </div>
  );
}

export default function BookingHistoryPage() {
  const [bookings, setBookings] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const loadBookings = async () => {
    try {
      setLoading(true);
      setError('');
      const { data } = await getUserBookings();
      setBookings(data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load connect requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, []);

  const filteredBookings = useMemo(() => {
    const term = search.trim().toLowerCase();

    return bookings
      .filter((item) => (statusFilter === 'all' ? true : item.status === statusFilter))
      .filter((item) => {
        if (!term) return true;
        const title = item.room?.title || '';
        const ownerName = item.room?.owner?.name || '';
        const city = item.room?.city || '';
        const state = item.room?.state || '';
        const haystack = `${title} ${ownerName} ${city} ${state}`.toLowerCase();
        return haystack.includes(term);
      })
      .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
  }, [bookings, search, statusFilter]);

  const stats = useMemo(() => {
    const pending = bookings.filter((b) => b.status === 'pending').length;
    const confirmed = bookings.filter((b) => b.status === 'confirmed').length;
    const cancelled = bookings.filter((b) => b.status === 'cancelled').length;

    return {
      total: bookings.length,
      pending,
      confirmed,
      cancelled
    };
  }, [bookings]);

  return (
    <section className="space-y-6 pb-8">
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 p-6 text-white shadow-lg md:p-8">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-blue-100">
              <i className="fas fa-link"></i>
              Customer Workspace
            </p>
            <h1 className="text-3xl font-bold md:text-4xl">My Connect Requests</h1>
            <p className="mt-2 text-blue-100">Track your requests, contact status, and owner responses in one place.</p>
          </div>

          <button
            type="button"
            onClick={loadBookings}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/10 px-4 text-sm font-semibold text-white transition hover:bg-white/20"
            disabled={loading}
          >
            <i className={`fas ${loading ? 'fa-spinner fa-spin' : 'fa-rotate-right'}`}></i>
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {error && <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</div>}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Requests" value={stats.total} hint="All requests sent" icon="fa-paper-plane" color="from-blue-600 to-cyan-500" />
        <StatCard label="Pending" value={stats.pending} hint="Awaiting owner response" icon="fa-clock" color="from-amber-500 to-orange-500" />
        <StatCard label="Confirmed" value={stats.confirmed} hint="Owners responded positively" icon="fa-circle-check" color="from-emerald-600 to-teal-500" />
        <StatCard label="Cancelled" value={stats.cancelled} hint="Closed connect requests" icon="fa-circle-xmark" color="from-rose-500 to-red-500" />
      </div>

      <article className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="grid flex-1 gap-3 md:grid-cols-12">
            <div className="relative md:col-span-8">
              <i className="fas fa-search pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
              <input
                className="h-11 w-full rounded-xl border border-slate-300 bg-white pl-11 pr-4 text-sm font-medium text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                placeholder="Search by property, owner, city or state"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <CustomSelect
              className="md:col-span-4"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: 'all', label: 'All Statuses' },
                { value: 'pending', label: 'Pending' },
                { value: 'confirmed', label: 'Confirmed' },
                { value: 'cancelled', label: 'Cancelled' }
              ]}
            />
          </div>
          <span className="inline-flex h-8 items-center rounded-full bg-blue-100 px-3 text-xs font-bold text-blue-700">{filteredBookings.length} records</span>
        </div>

        {loading ? (
          <div className="p-6 text-sm text-slate-500">Loading connect requests...</div>
        ) : filteredBookings.length === 0 ? (
          <div className="p-10 text-center">
            <i className="fas fa-inbox text-4xl text-slate-300"></i>
            <p className="mt-3 text-sm text-slate-600">No connect requests found.</p>
            <Link to="/" className="btn-primary mt-4 inline-flex">Browse Properties</Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-6 py-3">Property</th>
                  <th className="px-6 py-3">Owner</th>
                  <th className="px-6 py-3">Message</th>
                  <th className="px-6 py-3">Requested</th>
                  <th className="px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-slate-50/80 align-top">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-900">{booking.room?.title || `Room #${booking.room_id}`}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {booking.room?.city && booking.room?.state ? `${booking.room.city}, ${booking.room.state}` : '-'}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-slate-700">
                      <p className="font-medium text-slate-800">{booking.room?.owner?.name || '-'}</p>
                      <p className="text-xs text-slate-500">{booking.room?.owner?.phone || booking.room?.owner?.email || '-'}</p>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      <p className="max-w-md whitespace-pre-wrap leading-6">{booking.message || 'Interested in this property and trying to connect.'}</p>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {booking.created_at ? new Date(booking.created_at).toLocaleString() : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusClass[booking.status] || statusClass.pending}`}>
                        {booking.status || 'pending'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </article>
    </section>
  );
}
