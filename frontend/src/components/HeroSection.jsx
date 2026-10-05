import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function HeroSection() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="relative w-full min-h-[calc(100vh-72px)] mb-0 overflow-hidden flex items-center">
      {/* Background Image with overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&h=800&fit=crop')`,
          filter: 'brightness(0.4)'
        }}
      ></div>

      {/* Dark overlay for better text visibility */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-transparent"></div>

      {/* Content */}
      <div className="relative z-10 w-full px-4 sm:px-6 lg:px-8 container-custom">
        <div className="max-w-2xl">
          {/* Main heading */}
          <div className="mb-8 animate-fade-in-up">
            <div className="text-6xl md:text-7xl font-bold text-white mb-6 leading-tight">
              <span className="block mb-2">Find Your</span>
              <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
                Perfect Room
              </span>
            </div>
          </div>

          {/* Subheading */}
          <p className="text-xl md:text-2xl text-gray-100 mb-8 leading-relaxed max-w-xl animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            Discover verified rooms, amazing amenities, and find your ideal living space across 125+ cities.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col md:flex-row gap-4 mb-12 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <button
              onClick={() => {
                document.querySelector('#search-section')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-8 py-4 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-all shadow-lg text-lg inline-flex items-center gap-2 w-fit"
            >
              <i className="fas fa-search"></i>
              Start Your Search
            </button>
            {!user && (
              <button
                onClick={() => navigate('/login')}
                className="px-8 py-4 border-2 border-white text-white font-bold rounded-lg hover:bg-white/10 transition-all text-lg inline-flex items-center gap-2 w-fit backdrop-blur-sm"
              >
                <i className="fas fa-plus-circle"></i>
                List Your Room
              </button>
            )}
          </div>

          {/* Trust indicators */}
          <div className="grid grid-cols-3 gap-6 max-w-2xl animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <div className="text-3xl font-bold text-cyan-300 mb-1 flex items-center gap-1">
                <i className="fas fa-door-open text-lg"></i>
                2.4K
              </div>
              <div className="text-gray-200 text-sm font-semibold">Active Rooms</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <div className="text-3xl font-bold text-cyan-300 mb-1 flex items-center gap-1">
                <i className="fas fa-users text-lg"></i>
                18.5K
              </div>
              <div className="text-gray-200 text-sm font-semibold">Happy Users</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <div className="text-3xl font-bold text-cyan-300 mb-1 flex items-center gap-1">
                <i className="fas fa-star text-lg"></i>
                4.9★
              </div>
              <div className="text-gray-200 text-sm font-semibold">Trusted</div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 animate-bounce">
        <i className="fas fa-chevron-down text-white text-2xl"></i>
      </div>
    </div>
  );
}


