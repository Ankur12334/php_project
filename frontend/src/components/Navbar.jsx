import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import roomFinderLogo from '../assets/roomfinder-logo.png';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const navClass = ({ isActive }) =>
    isActive
      ? 'text-blue-600 font-semibold'
      : 'text-slate-600 hover:text-blue-600 transition';

  const closeMenuAndGo = (path) => {
    navigate(path);
    setMenuOpen(false);
  };

  const onLogout = () => {
    logout();
    navigate('/');
    setMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/60 bg-white/95 backdrop-blur-md shadow-sm">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center">
            <img src={roomFinderLogo} alt="Flatex" className="h-9 w-auto" />
          </Link>

          <nav className="hidden md:flex items-center gap-7 text-sm font-medium">
            <NavLink to="/" className={navClass}>Home</NavLink>
            {user?.role === 'user' && <NavLink to="/dashboard" className={navClass}>Dashboard</NavLink>}
            {user?.role === 'user' && <NavLink to="/post-listing" className={navClass}>Post Listing</NavLink>}
            {user?.role === 'user' && <NavLink to="/bookings" className={navClass}>My Bookings</NavLink>}
            {user?.role === 'admin' && <NavLink to="/admin" className={navClass}>Admin</NavLink>}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            {!user ? (
              <>
                <button onClick={() => navigate('/login')} className="btn-secondary">Login</button>
                <button onClick={() => navigate('/login')} className="btn-primary">Get Started</button>
              </>
            ) : (
              <button onClick={onLogout} className="btn-secondary">Logout</button>
            )}
          </div>

          <button
            type="button"
            onClick={() => setMenuOpen((s) => !s)}
            className="md:hidden rounded-lg p-2 text-slate-700 hover:bg-slate-100"
            aria-label="Toggle navigation"
          >
            <i className={`fas ${menuOpen ? 'fa-times' : 'fa-bars'}`}></i>
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden border-t border-slate-200 py-4 space-y-3">
            <NavLink to="/" onClick={() => setMenuOpen(false)} className="block text-slate-700 font-medium">Home</NavLink>
            {user?.role === 'user' && <NavLink to="/dashboard" onClick={() => setMenuOpen(false)} className="block text-slate-700 font-medium">Dashboard</NavLink>}
            {user?.role === 'user' && <NavLink to="/post-listing" onClick={() => setMenuOpen(false)} className="block text-slate-700 font-medium">Post Listing</NavLink>}
            {user?.role === 'user' && <NavLink to="/bookings" onClick={() => setMenuOpen(false)} className="block text-slate-700 font-medium">My Bookings</NavLink>}
            {user?.role === 'admin' && <NavLink to="/admin" onClick={() => setMenuOpen(false)} className="block text-slate-700 font-medium">Admin</NavLink>}

            <div className="pt-3 border-t border-slate-200 flex gap-2">
              {!user ? (
                <>
                  <button onClick={() => closeMenuAndGo('/login')} className="btn-secondary flex-1">Login</button>
                  <button onClick={() => closeMenuAndGo('/login')} className="btn-primary flex-1">Start</button>
                </>
              ) : (
                <button onClick={onLogout} className="btn-secondary w-full">Logout</button>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
