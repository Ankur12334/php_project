import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createRoom } from '../../api/rooms';

const AMENITY_SUGGESTIONS = [
  'Wifi',
  'AC',
  'Parking',
  'Power Backup',
  'Lift',
  'Kitchen',
  'Security',
  'Furnished',
  'Gym',
  'CCTV'
];

const initialForm = {
  title: '',
  description: '',
  price: '',
  pricing_type: 'night',
  city: '',
  state: '',
  pincode: '',
  amenities: [],
  images: []
};

export default function PostListingPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [form, setForm] = useState(initialForm);
  const [amenityInput, setAmenityInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const addAmenity = (rawValue) => {
    const value = String(rawValue || '').trim();
    if (!value) return;

    setForm((prev) => {
      const exists = prev.amenities.some((a) => a.toLowerCase() === value.toLowerCase());
      if (exists) return prev;
      return { ...prev, amenities: [...prev.amenities, value] };
    });
    setAmenityInput('');
  };

  const removeAmenity = (target) => {
    setForm((prev) => ({
      ...prev,
      amenities: prev.amenities.filter((a) => a !== target)
    }));
  };

  const addFiles = (fileList) => {
    const files = Array.from(fileList || []).filter((f) => f.type.startsWith('image/'));
    if (!files.length) return;

    setForm((prev) => {
      const existing = prev.images;
      const merged = [...existing];

      files.forEach((file) => {
        const duplicate = merged.some((m) => m.name === file.name && m.size === file.size);
        if (!duplicate) merged.push(file);
      });

      return { ...prev, images: merged.slice(0, 8) };
    });
  };

  const removeImage = (name) => {
    setForm((prev) => ({
      ...prev,
      images: prev.images.filter((img) => img.name !== name)
    }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');

    try {
      const payload = new FormData();
      payload.append('title', form.title);
      payload.append('description', form.description);
      payload.append('price', form.price);
      payload.append('pricing_type', form.pricing_type);
      payload.append('city', form.city);
      payload.append('state', form.state);
      payload.append('pincode', form.pincode);
      payload.append('amenities', JSON.stringify(form.amenities));

      for (const file of form.images) {
        payload.append('images', file);
      }

      await createRoom(payload);
      setMessage('Listing submitted successfully. It is now pending admin verification.');
      setForm(initialForm);
      setAmenityInput('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create listing');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="space-y-6 pb-8">
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-700 p-6 text-white shadow-lg md:p-8">
        <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-blue-100">
          <i className="fas fa-pen-nib"></i>
          Post Listing
        </p>
        <h1 className="text-3xl font-bold md:text-4xl">Create New Property Listing</h1>
        <p className="mt-2 text-sm text-blue-100">Add complete details and rich media for faster approval and better visibility.</p>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-7">
        {error && <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</div>}
        {message && <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{message}</div>}

        <form onSubmit={onSubmit} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">Title *</label>
              <input
                className="input h-11"
                placeholder="Furnished 1BHK Near City Center"
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                required
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">Price *</label>
              <input
                className="input h-11"
                placeholder="12000"
                type="number"
                value={form.price}
                onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))}
                required
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">Pricing Type *</label>
              <select className="input h-11" value={form.pricing_type} onChange={(e) => setForm((p) => ({ ...p, pricing_type: e.target.value }))}>
                <option value="night">Per night</option>
                <option value="month">Per month</option>
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">City *</label>
              <input className="input h-11" placeholder="Mumbai" value={form.city} onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))} required />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">State *</label>
              <input className="input h-11" placeholder="Maharashtra" value={form.state} onChange={(e) => setForm((p) => ({ ...p, state: e.target.value }))} required />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">Pincode *</label>
              <input className="input h-11" placeholder="400001" value={form.pincode} onChange={(e) => setForm((p) => ({ ...p, pincode: e.target.value }))} required />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">Amenities</label>

            <div className="rounded-2xl border border-slate-300 p-3">
              <div className="flex flex-wrap gap-2">
                {form.amenities.map((tag) => (
                  <span key={tag} className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                    {tag}
                    <button type="button" className="text-blue-700/80 hover:text-blue-900" onClick={() => removeAmenity(tag)}>
                      <i className="fas fa-times"></i>
                    </button>
                  </span>
                ))}
                {!form.amenities.length && <p className="text-sm text-slate-500">No amenities selected.</p>}
              </div>

              <div className="mt-3 flex flex-col gap-2 md:flex-row">
                <input
                  className="input h-10"
                  placeholder="Type amenity and press Enter"
                  value={amenityInput}
                  onChange={(e) => setAmenityInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ',') {
                      e.preventDefault();
                      addAmenity(amenityInput);
                    }
                  }}
                />
                <button type="button" className="btn-secondary h-10" onClick={() => addAmenity(amenityInput)}>Add</button>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {AMENITY_SUGGESTIONS.map((item) => {
                  const active = form.amenities.some((a) => a.toLowerCase() === item.toLowerCase());
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => (active ? removeAmenity(form.amenities.find((a) => a.toLowerCase() === item.toLowerCase())) : addAmenity(item))}
                      className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${active ? 'border-blue-200 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:text-blue-700'}`}
                    >
                      {item}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">Room Images (max 8)</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => addFiles(e.target.files)}
            />

            <button
              type="button"
              className={`w-full rounded-2xl border-2 border-dashed p-6 text-center transition ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-slate-300 bg-slate-50 hover:border-blue-300 hover:bg-blue-50/40'}`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                setDragActive(false);
              }}
              onDrop={(e) => {
                e.preventDefault();
                setDragActive(false);
                addFiles(e.dataTransfer.files);
              }}
            >
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                <i className="fas fa-cloud-arrow-up text-lg"></i>
              </div>
              <p className="mt-3 text-sm font-semibold text-slate-700">Drag and drop images here, or click to upload</p>
              <p className="mt-1 text-xs text-slate-500">PNG, JPG, JPEG up to 8 files</p>
            </button>

            {form.images.length > 0 && (
              <div className="mt-3 rounded-xl border border-slate-200 p-3">
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Selected Files ({form.images.length})</p>
                <div className="grid gap-2 md:grid-cols-2">
                  {form.images.map((file) => (
                    <div key={`${file.name}-${file.size}`} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm">
                      <span className="line-clamp-1 text-slate-700">{file.name}</span>
                      <button type="button" className="text-rose-600 hover:text-rose-700" onClick={() => removeImage(file.name)}>
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">Description *</label>
            <textarea
              className="input min-h-[130px]"
              placeholder="Write complete details: room size, furnishing, nearby facilities, rules and other highlights."
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              required
            />
          </div>

          <div className="flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:justify-end">
            <button type="button" className="btn-secondary" onClick={() => navigate('/dashboard')}>Back to Listings</button>
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Submitting...' : 'Submit For Verification'}</button>
          </div>
        </form>
      </div>
    </section>
  );
}
