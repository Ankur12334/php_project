import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function HeroSection() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="relative w-full min-h-[calc(100vh-72px)] mb-0 overflow-hidden flex items-center py-6 sm:py-12 md:py-0">
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
      <div className="relative z-10 w-full container-custom">
        <div className="max-w-2xl">
          {/* Main heading */}
          <div className="mb-4 sm:mb-8 animate-fade-in-up">
            <div className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-3 sm:mb-6 leading-tight">
              <span className="block mb-1 sm:mb-2">Find Your</span>
              <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
                Perfect Room
              </span>
            </div>
          </div>

          {/* Subheading */}
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-100 mb-5 sm:mb-8 leading-relaxed max-w-xl animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            Discover verified rooms, amazing amenities, and find your ideal living space across 125+ cities.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6 sm:mb-12 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <button
              onClick={() => {
                document.querySelector('#search-section')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="w-full sm:w-fit justify-center px-6 sm:px-8 py-3.5 sm:py-4 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-all shadow-lg text-base sm:text-lg inline-flex items-center gap-2"
            >
              <i className="fas fa-search"></i>
              Start Your Search
            </button>
            {!user && (
              <button
                onClick={() => navigate('/login')}
                className="w-full sm:w-fit justify-center px-6 sm:px-8 py-3.5 sm:py-4 border-2 border-white text-white font-bold rounded-lg hover:bg-white/10 transition-all text-base sm:text-lg inline-flex items-center gap-2 backdrop-blur-sm"
              >
                <i className="fas fa-plus-circle"></i>
                List Your Room
              </button>
            )}
          </div>

          {/* Trust indicators */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4 md:gap-6 max-w-2xl animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2 sm:p-3 md:p-4 border border-white/20 min-w-0 flex flex-col justify-between">
              <div className="text-lg sm:text-2xl md:text-3xl font-bold text-cyan-300 mb-0.5 sm:mb-1 flex items-center gap-1 sm:gap-1.5 whitespace-nowrap min-w-0">
                <i className="fas fa-door-open text-xs sm:text-base md:text-lg flex-shrink-0"></i>
                <span>2.4K</span>
              </div>
              <div className="text-gray-200 text-xs sm:text-xs md:text-sm font-semibold leading-tight">Active Rooms</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2 sm:p-3 md:p-4 border border-white/20 min-w-0 flex flex-col justify-between">
              <div className="text-lg sm:text-2xl md:text-3xl font-bold text-cyan-300 mb-0.5 sm:mb-1 flex items-center gap-1 sm:gap-1.5 whitespace-nowrap min-w-0">
                <i className="fas fa-users text-xs sm:text-base md:text-lg flex-shrink-0"></i>
                <span>18.5K</span>
              </div>
              <div className="text-gray-200 text-xs sm:text-xs md:text-sm font-semibold leading-tight">Happy Users</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2 sm:p-3 md:p-4 border border-white/20 min-w-0 flex flex-col justify-between">
              <div className="text-lg sm:text-2xl md:text-3xl font-bold text-cyan-300 mb-0.5 sm:mb-1 flex items-center gap-1 sm:gap-1.5 whitespace-nowrap min-w-0">
                <i className="fas fa-star text-xs sm:text-base md:text-lg flex-shrink-0"></i>
                <span>4.9★</span>
              </div>
              <div className="text-gray-200 text-xs sm:text-xs md:text-sm font-semibold leading-tight">Trusted</div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-2 sm:bottom-6 md:bottom-8 left-1/2 -translate-x-1/2 z-20 animate-bounce pointer-events-none">
        <i className="fas fa-chevron-down text-white text-xl sm:text-2xl"></i>
      </div>
    </div>
  );
}



