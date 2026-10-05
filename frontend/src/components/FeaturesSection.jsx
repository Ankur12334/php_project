export default function FeaturesSection() {
  const features = [
    {
      icon: 'fas fa-shield-alt',
      title: 'Verified Listings',
      description: 'All rooms are verified and authenticated for your safety and peace of mind.',
      color: 'from-red-500 to-pink-600'
    },
    {
      icon: 'fas fa-bolt',
      title: 'Fast Booking',
      description: 'Quick and seamless booking process. Secure your room in minutes, not days.',
      color: 'from-yellow-500 to-orange-600'
    },
    {
      icon: 'fas fa-comments',
      title: 'Direct Contact',
      description: 'Chat directly with room owners to discuss terms, amenities, and more.',
      color: 'from-green-500 to-emerald-600'
    },
    {
      icon: 'fas fa-mobile-alt',
      title: 'Mobile Friendly',
      description: 'Access Flatex on any device. Browse and book on the go, anytime.',
      color: 'from-blue-500 to-cyan-600'
    },
    {
      icon: 'fas fa-filter',
      title: 'Smart Filters',
      description: 'Advanced search with price, location, and amenities to find exactly what you need.',
      color: 'from-purple-500 to-pink-600'
    },
    {
      icon: 'fas fa-headset',
      title: 'Support Available',
      description: '24/7 customer support to help you with any queries or issues.',
      color: 'from-indigo-500 to-blue-600'
    }
  ];

  return (
    <section className="py-20 bg-gradient-to-b from-slate-50 to-white">
      <div className="container-custom">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-slate-900 mb-4 flex items-center justify-center gap-3">
            <i className="fas fa-star text-yellow-500"></i>
            Why Choose Flatex?
          </h2>
          <p className="text-xl text-slate-600">The most trusted platform for room rentals in India</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, idx) => (
            <div
              key={idx}
              className="card p-8 hover:shadow-xl hover:-translate-y-2 transition-all duration-300 border-l-4 border-transparent group"
              style={{ borderLeftColor: '#2563eb' }}
            >
              <div className={`inline-flex items-center justify-center w-16 h-16 rounded-xl bg-gradient-to-br ${feature.color} mb-4 text-white group-hover:scale-110 transition-transform`}>
                <i className={`${feature.icon} text-2xl`}></i>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition">{feature.title}</h3>
              <p className="text-slate-600 text-sm leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
