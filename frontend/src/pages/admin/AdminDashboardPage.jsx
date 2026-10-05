import { useEffect, useMemo, useState } from 'react';
import {
  approveRoom,
  getAdminDashboard,
  getPendingRooms,
  getReports,
  getUsers,
  rejectRoom
} from '../../api/admin';

function fmtDate(value) {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
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

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState(null);
  const [pendingRooms, setPendingRooms] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [actionKey, setActionKey] = useState('');
  const [userQuery, setUserQuery] = useState('');

  const load = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    setError('');
    try {
      const [statsRes, usersRes, reportsRes, pendingRes] = await Promise.all([
        getAdminDashboard(),
        getUsers(),
        getReports(),
        getPendingRooms()
      ]);

      setStats(statsRes.data);
      setUsers(usersRes.data || []);
      setReports(reportsRes.data || null);
      setPendingRooms(pendingRes.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onRoomAction = async (id, action) => {
    const key = `${action}-${id}`;
    setActionKey(key);
    setError('');
    try {
      if (action === 'approve') await approveRoom(id);
      if (action === 'reject') await rejectRoom(id);
      await load(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Room status update failed');
    } finally {
      setActionKey('');
    }
  };

  const userRows = useMemo(() => {
    const q = userQuery.trim().toLowerCase();
    return users.filter((u) => {
      if (!q) return true;
      return [u.name, u.email, u.phone, u.role].some((v) => String(v || '').toLowerCase().includes(q));
    });
  }, [users, userQuery]);

  const statCards = [
    {
      label: 'Total Users',
      value: stats?.totalUsers || 0,
      icon: 'fa-users',
      color: 'from-blue-600 to-cyan-500',
      hint: `${reports?.users?.admin || 0} admin, ${reports?.users?.user || 0} users`
    },
    {
      label: 'Total Listings',
      value: stats?.totalListings || 0,
      icon: 'fa-building',
      color: 'from-emerald-600 to-teal-500',
      hint: `${reports?.listings?.approved || 0} approved`
    },
    {
      label: 'Total Connect Requests',
      value: stats?.totalBookings || 0,
      icon: 'fa-bell',
      color: 'from-violet-600 to-indigo-500',
      hint: `${reports?.bookings?.pending || 0} pending`
    },
    {
      label: 'Pending Approvals',
      value: stats?.pendingListings || 0,
      icon: 'fa-clock',
      color: 'from-amber-500 to-orange-500',
      hint: 'Needs admin action'
    }
  ];

  const listingRows = Object.entries(reports?.listings || {}).map(([label, value]) => ({ label, value }));
  const bookingRows = Object.entries(reports?.bookings || {}).map(([label, value]) => ({ label, value }));
  const userRoleRows = Object.entries(reports?.users || {}).map(([label, value]) => ({ label, value }));

  if (loading) {
    return (
      <section className="py-8">
        <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <p className="text-sm font-semibold text-slate-500">Loading admin dashboard...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-6 pb-8">
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 p-6 text-white shadow-lg md:p-8">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-blue-100">
              <i className="fas fa-shield-halved"></i>
              Admin Control Center
            </p>
            <h1 className="text-3xl font-bold md:text-4xl">Operations Dashboard</h1>
            <p className="mt-2 text-blue-100">Approvals + platform analytics. Connect requests are handled by owners only.</p>
          </div>

          <button
            onClick={() => load(true)}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/10 px-5 text-sm font-semibold text-white transition hover:bg-white/20"
            disabled={refreshing}
          >
            <i className={`fas ${refreshing ? 'fa-spinner fa-spin' : 'fa-rotate-right'}`}></i>
            {refreshing ? 'Refreshing...' : 'Refresh Data'}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">
          {error}
        </div>
      )}

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
            <h2 className="text-xl font-bold text-slate-900">Pending Listing Approvals</h2>
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">
              {pendingRooms.length} pending
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-2 py-3">Property</th>
                  <th className="px-2 py-3">Location</th>
                  <th className="px-2 py-3">Price</th>
                  <th className="px-2 py-3">Created</th>
                  <th className="px-2 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingRooms.map((room) => (
                  <tr key={room.id} className="border-b border-slate-100 align-middle">
                    <td className="px-2 py-3">
                      <p className="font-semibold text-slate-900">{room.title}</p>
                      <p className="text-xs text-slate-500">ID: {room.id}</p>
                    </td>
                    <td className="px-2 py-3 text-slate-700">{room.city}, {room.state}</td>
                    <td className="px-2 py-3 font-semibold text-slate-900">INR {room.price}</td>
                    <td className="px-2 py-3 text-slate-600">{fmtDate(room.created_at)}</td>
                    <td className="px-2 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700"
                          onClick={() => onRoomAction(room.id, 'approve')}
                          disabled={actionKey === `approve-${room.id}`}
                        >
                          {actionKey === `approve-${room.id}` ? 'Approving...' : 'Approve'}
                        </button>
                        <button
                          className="rounded-lg bg-rose-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-rose-700"
                          onClick={() => onRoomAction(room.id, 'reject')}
                          disabled={actionKey === `reject-${room.id}`}
                        >
                          {actionKey === `reject-${room.id}` ? 'Rejecting...' : 'Reject'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!pendingRooms.length && (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm font-medium text-slate-500">
              No pending listings right now.
            </div>
          )}
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-4">
          <h2 className="text-xl font-bold text-slate-900">Basic Data Visualisation</h2>
          <p className="mt-1 text-sm text-slate-500">Quick bars for listings, connect requests, and user roles.</p>

          <div className="mt-5 space-y-4">
            <ChartBlock title="Listings" rows={listingRows.length ? listingRows : [{ label: 'none', value: 0 }]} color="bg-emerald-500" />
            <ChartBlock title="Connect Requests" rows={bookingRows.length ? bookingRows : [{ label: 'none', value: 0 }]} color="bg-violet-500" />
            <ChartBlock title="Users" rows={userRoleRows.length ? userRoleRows : [{ label: 'none', value: 0 }]} color="bg-blue-500" />
          </div>
        </article>
      </div>

      <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h2 className="text-xl font-bold text-slate-900">Users Directory</h2>
          <input
            className="input h-10 md:w-80"
            placeholder="Search by name, email, phone or role"
            value={userQuery}
            onChange={(e) => setUserQuery(e.target.value)}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-2 py-3">Name</th>
                <th className="px-2 py-3">Email</th>
                <th className="px-2 py-3">Phone</th>
                <th className="px-2 py-3">Role</th>
                <th className="px-2 py-3">Verified</th>
                <th className="px-2 py-3">Joined</th>
              </tr>
            </thead>
            <tbody>
              {userRows.map((u) => (
                <tr key={u.id} className="border-b border-slate-100">
                  <td className="px-2 py-3 font-semibold text-slate-900">{u.name}</td>
                  <td className="px-2 py-3 text-slate-700">{u.email || '-'}</td>
                  <td className="px-2 py-3 text-slate-700">{u.phone || '-'}</td>
                  <td className="px-2 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${u.role === 'admin' ? 'bg-violet-100 text-violet-700' : 'bg-blue-100 text-blue-700'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-2 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${u.is_verified ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>
                      {u.is_verified ? 'Verified' : 'Pending'}
                    </span>
                  </td>
                  <td className="px-2 py-3 text-slate-600">{fmtDate(u.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!userRows.length && (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm font-medium text-slate-500">
            No users found for this search.
          </div>
        )}
      </article>
    </section>
  );
}
