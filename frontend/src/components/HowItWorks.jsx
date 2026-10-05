export default function HowItWorks() {
  const steps = [
    {
      id: 1,
      title: 'Search',
      description: 'Browse thousands of rooms with advanced filters for location, price, and amenities.',
      icon: 'fas fa-search'
    },
    {
      id: 2,
      title: 'View Details',
      description: 'Check room photos, descriptions, and contact the owner for more information.',
      icon: 'fas fa-eye'
    },
    {
      id: 3,
      title: 'Book',
      description: 'Select your dates and complete the booking process securely.',
      icon: 'fas fa-calendar-check'
    },
    {
      id: 4,
      title: 'Move In',
      description: 'Get keys, move in, and enjoy your new space with full support.',
      icon: 'fas fa-key'
    }
  ];

  return (
    <section className="py-20 bg-gradient-to-r from-blue-50 via-cyan-50 to-blue-50">
      <div className="container-custom">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-slate-900 mb-4 flex items-center justify-center gap-3">
            <i className="fas fa-road text-blue-600"></i>
            How Flatex Works
          </h2>
          <p className="text-xl text-slate-600">4 simple steps to find your perfect room</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-0">
          {steps.map((step, idx) => (
            <div key={step.id} className="relative">
              <div className="flex flex-col items-center px-4 py-8 md:py-0">
                {/* Step Circle */}
                <div className="relative z-10 mb-6 md:mb-0">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-300 mx-auto mb-6">
                    <span className="text-white text-4xl">
                      <i className={step.icon}></i>
                    </span>
                  </div>

                  {/* Step number */}
                  <div className="absolute -top-2 -right-2 w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center font-bold text-white shadow-lg">
                    {step.id}
                  </div>
                </div>

                {/* Content */}
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-slate-900 mb-3">{step.title}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed max-w-xs">{step.description}</p>
                </div>
              </div>

              {/* Connector line (hidden on last item, on mobile) */}
              {idx < steps.length - 1 && (
                <div className="hidden lg:block absolute right-0 top-1/2 w-full border-t-2 border-dashed border-blue-300 transform translate-x-full -translate-y-1/2" />
              )}
            </div>
          ))}
        </div>

        {/* CTA Button */}
        <div className="text-center mt-12">
          <button className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-10 py-4 rounded-xl font-bold text-lg hover:shadow-lg hover:scale-105 transition-all inline-flex items-center gap-2">
            <i className="fas fa-arrow-right"></i>
            Start Your Journey Now
          </button>
        </div>
      </div>
    </section>
  );
}
