import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { deleteRoom, getMyListings } from '../../api/rooms';
import { getOwnerConnectRequests } from '../../api/bookings';

const statusClass = {
  approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  rejected: 'bg-rose-50 text-rose-700 border-rose-200',
  pending: 'bg-amber-50 text-amber-700 border-amber-200'
};


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
function ChartBlock({ title, rows, color }) {
  const max = Math.max(1, ...rows.map((r) => r.value));

  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{title}</p>
      <div className="mt-4 space-y-3">
        {rows.map((r) => (
          <div key={r.label}>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="capitalize text-slate-600">{r.label}</span>
              <span className="font-bold text-slate-900">{r.value}</span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-100">
              <div
                className={`h-2 rounded-full ${color}`}
                style={{ width: `${Math.max(8, Math.round((r.value / max) * 100))}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function OwnerDashboardPage() {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [connectRequests, setConnectRequests] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const pageSize = 8;

  const load = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoadingRooms(true);

      const [{ data: listings }, { data: requests }] = await Promise.all([
        getMyListings(),
        getOwnerConnectRequests()
      ]);
      setRooms(listings || []);
      setConnectRequests(requests || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboard data');
    } finally {
      setLoadingRooms(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filteredRooms = useMemo(() => {
    const term = search.trim().toLowerCase();

    return rooms
      .filter((room) => (statusFilter === 'all' ? true : room.status === statusFilter))
      .filter((room) => {
        if (!term) return true;
        const hay = `${room.title} ${room.city} ${room.state} ${room.pincode}`.toLowerCase();
        return hay.includes(term);
      })
      .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
  }, [rooms, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredRooms.length / pageSize));

  const pagedRooms = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredRooms.slice(start, start + pageSize);
  }, [filteredRooms, page]);

  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [page, totalPages]);

  const stats = useMemo(() => {
    const approved = rooms.filter((r) => r.status === 'approved').length;
    const pending = rooms.filter((r) => r.status === 'pending').length;
    const rejected = rooms.filter((r) => r.status === 'rejected').length;
    return {
      totalListings: rooms.length,
      approved,
      pending,
      rejected,
      connectRequests: connectRequests.length
    };
  }, [rooms, connectRequests]);

    const listingStatusRows = [
    { label: 'approved', value: stats.approved },
    { label: 'pending', value: stats.pending },
    { label: 'rejected', value: stats.rejected }
  ];

  const onDelete = async (id) => {
    setError('');
    setMessage('');

    const confirmed = window.confirm('Delete this listing?');
    if (!confirmed) return;

    try {
      await deleteRoom(id);
      setMessage('Listing deleted successfully.');
      await load(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete listing');
    }
  };

  const statCards = [
    {
      label: 'Total Listings',
      value: stats.totalListings,
      icon: 'fa-building',
      color: 'from-blue-600 to-cyan-500',
      hint: `${stats.approved} approved`
    },
    {
      label: 'Pending Review',
      value: stats.pending,
      icon: 'fa-clock',
      color: 'from-amber-500 to-orange-500',
      hint: 'Waiting for admin approval'
    },
    {
      label: 'Connect Requests',
      value: stats.connectRequests,
      icon: 'fa-bell',
      color: 'from-violet-600 to-indigo-500',
      hint: `${stats.connectRequests} total received`
    },
    {
      label: 'Rejected Listings',
      value: stats.rejected,
      icon: 'fa-triangle-exclamation',
      color: 'from-rose-500 to-red-500',
      hint: 'Needs improvement before repost'
    }
  ];

  return (
    <section className="space-y-6 pb-8">
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 p-6 text-white shadow-lg md:p-8">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-blue-100">
              <i className="fas fa-layer-group"></i>
              Owner Workspace
            </p>
            <h1 className="text-3xl font-bold md:text-4xl">Listings Dashboard</h1>
            <p className="mt-2 text-blue-100">Manage your listings and track connect requests from interested users.</p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => load(true)}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/10 px-4 text-sm font-semibold text-white transition hover:bg-white/20"
              disabled={refreshing}
            >
              <i className={`fas ${refreshing ? 'fa-spinner fa-spin' : 'fa-rotate-right'}`}></i>
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
            <button onClick={() => navigate('/post-listing')} className="btn bg-white text-blue-700 hover:bg-blue-50">
              <i className="fas fa-plus"></i>
              Post New Listing
            </button>
          </div>
        </div>
      </div>

      {error && <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</div>}
      {message && <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{message}</div>}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => (
          <article key={card.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-500">{card.label}</p>
                <p className="mt-2 text-3xl font-extrabold text-slate-900">{card.value}</p>
              </div>
              <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow ${card.color}`}>
                <i className={`fas ${card.icon}`}></i>
              </div>
            </div>
            <p className="mt-3 text-xs font-medium text-slate-500">{card.hint}</p>
          </article>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">Incoming Connect Requests</h2>
            <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-bold text-violet-700">
              {connectRequests.length} requests
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-2 py-3">Customer</th>
                  <th className="px-2 py-3">Contact</th>
                  <th className="px-2 py-3">Property</th>
                  <th className="px-2 py-3">Message</th>
                  <th className="px-2 py-3">Requested</th>
                </tr>
              </thead>
              <tbody>
                {connectRequests.map((req) => (
                  <tr key={req.id} className="border-b border-slate-100 align-middle">
                    <td className="px-2 py-3 font-semibold text-slate-900">{req.customer?.name || '-'}</td>
                    <td className="px-2 py-3 text-slate-600">{req.customer?.phone || req.customer?.email || '-'}</td>
                    <td className="px-2 py-3 text-slate-700">{req.room?.title || `Room #${req.room_id}`}</td>
                    <td className="px-2 py-3 text-slate-600">
                      <p className="line-clamp-2 max-w-xs">{req.message || 'Interested in this property.'}</p>
                    </td>
                    <td className="px-2 py-3 text-slate-600">{req.created_at ? new Date(req.created_at).toLocaleString() : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!connectRequests.length && (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm font-medium text-slate-500">
              No connect requests yet.
            </div>
          )}
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-4">
          <h2 className="text-xl font-bold text-slate-900">Basic Data Visualisation</h2>
          <p className="mt-1 text-sm text-slate-500">Quick bars for listing status.</p>

          <div className="mt-5 space-y-4">
            <ChartBlock title="Listing Status" rows={listingStatusRows} color="bg-emerald-500" />
          </div>
        </article>
      </div>

      <article className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="grid flex-1 gap-3 md:grid-cols-12">
            <div className="relative md:col-span-7">
              <i className="fas fa-search pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
              <input
                className="h-11 w-full rounded-xl border border-slate-300 bg-white pl-11 pr-4 text-sm font-medium text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                placeholder="Search by title, city, state, pincode"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>

            <CustomSelect
              className="md:col-span-3"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              options={[
                { value: 'all', label: 'All Statuses' },
                { value: 'approved', label: 'Approved' },
                { value: 'pending', label: 'Pending' },
                { value: 'rejected', label: 'Rejected' }
              ]}
            />

            <button
              type="button"
              className="btn-secondary h-11 md:col-span-2"
              onClick={() => {
                setSearch('');
                setStatusFilter('all');
                setPage(1);
              }}
            >
              Reset
            </button>
          </div>
          <span className="inline-flex h-8 items-center rounded-full bg-blue-100 px-3 text-xs font-bold text-blue-700">{filteredRooms.length} records</span>
        </div>

        {loadingRooms ? (
          <div className="p-6 text-sm text-slate-500">Loading listings...</div>
        ) : filteredRooms.length === 0 ? (
          <div className="p-10 text-center">
            <i className="fas fa-table-list text-4xl text-slate-300"></i>
            <p className="mt-3 text-sm text-slate-600">No listings match your filters.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-6 py-3">Title</th>
                    <th className="px-6 py-3">Location</th>
                    <th className="px-6 py-3">Pricing</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Created</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pagedRooms.map((room) => (
                    <tr key={room.id} className="hover:bg-slate-50/80">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-900">{room.title}</p>
                        <p className="text-xs text-slate-500">#{room.id}</p>
                      </td>
                      <td className="px-6 py-4 text-slate-700">{room.city}, {room.state} - {room.pincode}</td>
                      <td className="px-6 py-4 text-slate-700">INR {room.price}/{room.pricing_type}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${statusClass[room.status] || statusClass.pending}`}>{room.status}</span>
                      </td>
                      <td className="px-6 py-4 text-slate-500">{room.created_at ? new Date(room.created_at).toLocaleDateString() : '-'}</td>
                      <td className="px-6 py-4 text-right">
                        <button className="btn-danger btn-sm" onClick={() => onDelete(room.id)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between border-t border-slate-200 px-6 py-4">
              <p className="text-sm text-slate-500">Page {page} of {totalPages}</p>
              <div className="flex gap-2">
                <button className="btn-secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</button>
                <button className="btn-secondary" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</button>
              </div>
            </div>
          </>
        )}
      </article>
    </section>
  );
}








