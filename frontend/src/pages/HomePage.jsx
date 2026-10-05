import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getRooms } from '../api/rooms';
import RoomCard from '../components/RoomCard';
import Loader from '../components/Loader';
import HeroSection from '../components/HeroSection';
import StatsBlock from '../components/StatsBlock';
import FeaturesSection from '../components/FeaturesSection';
import HowItWorks from '../components/HowItWorks';
import Testimonials from '../components/Testimonials';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';

const initialFilter = {
  city: '',
  minPrice: '',
  maxPrice: '',
  amenities: ''
};

export default function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });
  const [filters, setFilters] = useState(initialFilter);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const buildQueryParams = (targetPage) => {
    const params = { page: targetPage, limit: 9 };

    if (filters.city.trim()) params.city = filters.city.trim();
    if (filters.minPrice !== '') params.minPrice = filters.minPrice;
    if (filters.maxPrice !== '') params.maxPrice = filters.maxPrice;
    if (filters.amenities.trim()) params.amenities = filters.amenities.trim();

    return params;
  };

  const fetchRooms = async (targetPage = page) => {
    setLoading(true);
    setError('');
    try {
      const { data } = await getRooms(buildQueryParams(targetPage));
      setRooms(data.data || []);
      setMeta(data.meta || { page: targetPage, totalPages: 1, total: 0 });
    } catch (err) {
      const firstValidationError = err.response?.data?.errors?.[0]?.msg;
      setError(firstValidationError || err.response?.data?.message || 'Failed to load rooms');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms(page);
  }, [page]);

  const onSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchRooms(1);
  };

  const clearFilters = () => {
    setFilters(initialFilter);
    setPage(1);
    setTimeout(() => fetchRooms(1), 0);
  };

  const hasActiveFilters = Object.values(filters).some((v) => String(v).trim() !== '');

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <HeroSection />

      <div id="search-section" className="relative z-20 -mt-8 pb-10">
        <div className="container-custom">
          <div className="mx-auto max-w-6xl rounded-3xl border border-slate-200 bg-white p-5 shadow-xl md:p-7">
            <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-3xl font-bold text-slate-900">Find Your Perfect Room</h2>
                <p className="text-slate-600">Search by city, budget and amenities with smart filters.</p>
              </div>
              <div className="inline-flex items-center gap-2 rounded-xl bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700">
                <i className="fas fa-bolt"></i>
                Fast Search
              </div>
            </div>

            <form onSubmit={onSearch} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
                <div className="md:col-span-3">
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">City</label>
                  <input
                    className="input h-11"
                    placeholder="e.g. Pune"
                    value={filters.city}
                    onChange={(e) => setFilters({ ...filters, city: e.target.value })}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">Min Price</label>
                  <input
                    className="input h-11"
                    placeholder="1000"
                    type="number"
                    value={filters.minPrice}
                    onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">Max Price</label>
                  <input
                    className="input h-11"
                    placeholder="15000"
                    type="number"
                    value={filters.maxPrice}
                    onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                  />
                </div>

                <div className="md:col-span-3">
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">Amenities</label>
                  <input
                    className="input h-11"
                    placeholder="wifi, ac, parking"
                    value={filters.amenities}
                    onChange={(e) => setFilters({ ...filters, amenities: e.target.value })}
                  />
                </div>

                <div className="flex items-end md:col-span-2">
                  <button className="btn-primary h-11 w-full rounded-xl">
                    <i className="fas fa-search"></i>
                    Search
                  </button>
                </div>
              </div>

              {hasActiveFilters && (
                <button type="button" onClick={clearFilters} className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-800">
                  <i className="fas fa-rotate-left"></i>
                  Clear all filters
                </button>
              )}
            </form>
          </div>
        </div>
      </div>

      <div className="container-custom py-10">
        <div className="mx-auto max-w-6xl">
          {!loading && rooms.length > 0 && (
            <div className="mb-8 flex flex-col gap-2 border-b border-slate-200 pb-6 md:flex-row md:items-center md:justify-between">
              <h2 className="text-3xl font-bold text-slate-900">{hasActiveFilters ? 'Filtered Results' : 'Featured Rooms'}</h2>
              <span className="inline-flex rounded-full bg-blue-100 px-4 py-1 text-sm font-semibold text-blue-700">{meta.total || rooms.length} found</span>
            </div>
          )}

          {loading && <Loader label="Searching rooms..." />}

          {error && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="text-sm font-semibold text-red-700">Validation failed: {error}</p>
            </div>
          )}

          {!loading && rooms.length === 0 && !error && (
            <div className="py-16 text-center">
              <div className="mb-4 text-6xl text-slate-300"><i className="fas fa-search"></i></div>
              <h3 className="h4 mb-2">No rooms found</h3>
              <p className="mb-6 text-slate-600">Try different city/budget combinations.</p>
              <button onClick={clearFilters} className="btn-primary"><i className="fas fa-rotate-left"></i>Reset Filters</button>
            </div>
          )}

          {!loading && rooms.length > 0 && (
            <div className="mb-10 grid justify-items-center gap-6 md:grid-cols-2 xl:grid-cols-3">
              {rooms.map((room) => (
                <div key={room.id} className="w-full max-w-md">
                  <RoomCard room={room} />
                </div>
              ))}
            </div>
          )}

          {!loading && rooms.length > 0 && meta.totalPages > 1 && (
            <div className="flex flex-col items-center justify-center gap-4 border-t border-slate-200 pt-8 md:flex-row">
              <button className="btn-secondary" disabled={page <= 1} onClick={() => { setPage((p) => p - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
                <i className="fas fa-chevron-left"></i>
                Previous
              </button>

              <span className="text-sm font-semibold text-slate-600">Page {meta.page || page} of {meta.totalPages || 1}</span>

              <button className="btn-secondary" disabled={page >= (meta.totalPages || 1)} onClick={() => { setPage((p) => p + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
                Next
                <i className="fas fa-chevron-right"></i>
              </button>
            </div>
          )}
        </div>
      </div>

      {!hasActiveFilters && (
        <div className="bg-white">
          <div className="container-custom">
            <StatsBlock />
          </div>
        </div>
      )}

      <div className="container-custom"><FeaturesSection /></div>
      <HowItWorks />
      <div className="container-custom"><Testimonials /></div>

      <section className="relative my-16 overflow-hidden rounded-3xl px-8 py-20 text-white md:px-16">
        <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&h=600&fit=crop')`, filter: 'brightness(0.3)' }}></div>
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/90 via-blue-500/80 to-cyan-600/90"></div>

        <div className="relative z-10 mx-auto max-w-3xl text-center">
          <h2 className="mb-4 flex items-center justify-center gap-3 text-4xl font-bold md:text-5xl"><i className="fas fa-rocket"></i>Ready to Find Your Perfect Room?</h2>
          <p className="mb-8 text-lg text-blue-50 md:text-xl">Join thousands of satisfied users and find verified, secure rental spaces today.</p>
          <div className="flex flex-col justify-center gap-4 md:flex-row">
            <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="flex items-center justify-center gap-2 rounded-lg bg-white px-10 py-4 text-lg font-bold text-blue-600 shadow-lg transition-all hover:bg-blue-50"><i className="fas fa-arrow-up"></i>Start Searching Now</button>
            {!user && <button onClick={() => navigate('/login')} className="flex items-center justify-center gap-2 rounded-lg border-2 border-white px-10 py-4 text-lg font-bold text-white transition-all hover:bg-white/10"><i className="fas fa-building"></i>List Your Room</button>}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

