export default function Testimonials() {
  const testimonials = [
    {
      name: 'Priya Sharma',
      role: 'Student',
      image: 'fas fa-user-circle',
      text: 'Flatex made finding my hostel so easy! The search filters were exactly what I needed.',
      rating: 5
    },
    {
      name: 'Rajesh Kumar',
      role: 'Professional',
      image: 'fas fa-briefcase',
      text: 'As a room owner, this platform helped me quickly find reliable tenants. Excellent service!',
      rating: 5
    },
    {
      name: 'Anaya Patel',
      role: 'Working Mom',
      image: 'fas fa-woman',
      text: 'Found a beautiful apartment near my office within days. Highly recommend Flatex!',
      rating: 5
    },
    {
      name: 'Vikram Singh',
      role: 'Entrepreneur',
      image: 'fas fa-user-tie',
      text: 'The platform is user-friendly and secure. Perfect for finding accommodation in a new city.',
      rating: 5
    }
  ];

  return (
    <section className="py-20 bg-gradient-to-b from-slate-50 to-white">
      <div className="container-custom">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-slate-900 mb-4 flex items-center justify-center gap-3">
            <i className="fas fa-comments text-blue-600"></i>
            What Our Users Say
          </h2>
          <p className="text-xl text-slate-600">Join thousands of satisfied customers</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {testimonials.map((testimonial, idx) => (
            <div
              key={idx}
              className="card-elevated p-6 hover:shadow-2xl hover:-translate-y-3 transition-all duration-300 relative overflow-hidden group"
            >
              {/* Background accent */}
              <div className="absolute top-0 right-0 w-20 h-20 bg-blue-50 rounded-full -mr-10 -mt-10 opacity-0 group-hover:opacity-100 transition-opacity"></div>

              {/* Rating */}
              <div className="flex gap-1 mb-4 text-yellow-400">
                {Array(testimonial.rating)
                  .fill(0)
                  .map((_, i) => (
                    <i key={i} className="fas fa-star"></i>
                  ))}
              </div>

              {/* Quote */}
              <p className="text-slate-600 text-sm leading-relaxed italic mb-6 relative z-10">
                "{testimonial.text}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-3 relative z-10">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-xl">
                  <i className={testimonial.image}></i>
                </div>
                <div>
                  <div className="font-bold text-slate-900">{testimonial.name}</div>
                  <div className="text-xs text-slate-500 font-semibold">{testimonial.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Trust indicator */}
        <div className="text-center mt-12 p-8 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl border border-blue-200">
          <div className="flex items-center justify-center gap-2 mb-2">
            <i className="fas fa-star text-yellow-400 text-xl"></i>
            <span className="text-3xl font-bold text-slate-900">4.9</span>
            <i className="fas fa-star text-yellow-400 text-xl"></i>
          </div>
          <p className="text-slate-600 font-semibold">Based on 18,500+ happy users</p>
        </div>
      </div>
    </section>
  );
}
