export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-900 text-slate-100 mt-16">
      <div className="container-custom py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div>
            <div className="text-2xl font-bold mb-4 flex items-center gap-2">
              <i className="fas fa-home text-blue-400"></i>
              <span className="gradient-text">Flatex</span>
            </div>
            <p className="text-slate-400 text-sm mb-4">
              India's most trusted platform for finding and listing rental rooms.
            </p>
            <div className="flex gap-3">
              <a href="#" className="text-slate-400 hover:text-blue-400 transition text-lg">
                <i className="fab fa-facebook-f"></i>
              </a>
              <a href="#" className="text-slate-400 hover:text-blue-400 transition text-lg">
                <i className="fab fa-twitter"></i>
              </a>
              <a href="#" className="text-slate-400 hover:text-blue-400 transition text-lg">
                <i className="fab fa-instagram"></i>
              </a>
              <a href="#" className="text-slate-400 hover:text-blue-400 transition text-lg">
                <i className="fab fa-linkedin"></i>
              </a>
            </div>
          </div>

          {/* Renters */}
          <div>
            <h4 className="font-bold mb-4 flex items-center gap-2">
              <i className="fas fa-search text-blue-400"></i>
              For Renters
            </h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><a href="#" className="hover:text-blue-400 transition">Browse Rooms</a></li>
              <li><a href="#" className="hover:text-blue-400 transition">Booking History</a></li>
              <li><a href="#" className="hover:text-blue-400 transition">Safety Tips</a></li>
              <li><a href="#" className="hover:text-blue-400 transition">FAQ</a></li>
            </ul>
          </div>

          {/* Owners */}
          <div>
            <h4 className="font-bold mb-4 flex items-center gap-2">
              <i className="fas fa-building text-blue-400"></i>
              For Owners
            </h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><a href="#" className="hover:text-blue-400 transition">List Your Room</a></li>
              <li><a href="#" className="hover:text-blue-400 transition">Dashboard</a></li>
              <li><a href="#" className="hover:text-blue-400 transition">Pricing</a></li>
              <li><a href="#" className="hover:text-blue-400 transition">Support</a></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-bold mb-4 flex items-center gap-2">
              <i className="fas fa-info-circle text-blue-400"></i>
              Company
            </h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><a href="#" className="hover:text-blue-400 transition">About Us</a></li>
              <li><a href="#" className="hover:text-blue-400 transition">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-blue-400 transition">Terms of Service</a></li>
              <li><a href="#" className="hover:text-blue-400 transition">Contact Us</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-700 pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center text-sm text-slate-400">
            <div>&copy; {currentYear} Flatex. All rights reserved.</div>
            <div className="flex gap-6 mt-4 md:mt-0">
              <a href="#" className="hover:text-blue-400 transition">Terms</a>
              <a href="#" className="hover:text-blue-400 transition">Privacy</a>
              <a href="#" className="hover:text-blue-400 transition">Cookies</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
