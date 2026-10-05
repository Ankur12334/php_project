export default function StatsBlock() {
  const stats = [
    {
      label: 'Active Rooms',
      value: '2,450+',
      icon: 'fas fa-door-open',
      gradient: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      label: 'Happy Users',
      value: '18,500+',
      icon: 'fas fa-face-smile',
      gradient: 'from-green-500 to-emerald-600',
      bgColor: 'bg-green-50'
    },
    {
      label: 'Bookings Made',
      value: '45,200+',
      icon: 'fas fa-check-circle',
      gradient: 'from-cyan-500 to-blue-600',
      bgColor: 'bg-cyan-50'
    },
    {
      label: 'Cities Covered',
      value: '125+',
      icon: 'fas fa-globe',
      gradient: 'from-purple-500 to-pink-600',
      bgColor: 'bg-purple-50'
    }
  ];

  return (
    <section className="py-16 bg-gradient-to-b from-white to-slate-50">
      <div className="container-custom">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-slate-900 mb-3">Our Impact</h2>
          <p className="text-xl text-slate-600">Trusted by thousands of renters and room owners</p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, idx) => (
            <div
              key={idx}
              className={`${stat.bgColor} rounded-2xl p-8 text-center hover:shadow-xl hover:-translate-y-2 transition-all duration-300 border-2 border-transparent hover:border-blue-200`}
            >
              <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br ${stat.gradient} mb-4 text-white`}>
                <i className={`${stat.icon} text-2xl`}></i>
              </div>
              <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-2">
                {stat.value}
              </div>
              <div className="text-slate-700 font-semibold text-lg">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
