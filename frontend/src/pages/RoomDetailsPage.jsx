import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getRoomById, contactOwner } from '../api/rooms';
import { createBooking } from '../api/bookings';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/Loader';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1400&h=900&fit=crop';

function toImageUrl(imagePath) {
  if (!imagePath) return FALLBACK_IMAGE;
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) return imagePath;
  const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
  const origin = apiBase.replace(/\/api\/?$/, '');
  return `${origin}${imagePath}`;
}

function parseAmenities(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      return value.split(',').map((item) => item.trim()).filter(Boolean);
    }
  }
  return [];
}

export default function RoomDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [contact, setContact] = useState(null);
  const [selectedImage, setSelectedImage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [connectMessage, setConnectMessage] = useState('I am interested in this property and trying to connect with you.');

  useEffect(() => {
    let mounted = true;

    (async () => {
      setLoading(true);
      setError('');
      setSuccess('');
      try {
        const { data } = await getRoomById(id);
        if (!mounted) return;
        setRoom(data);

        const first = data?.images?.[0]?.image_url;
        setSelectedImage(toImageUrl(first));
      } catch (err) {
        if (!mounted) return;
        setError(err.response?.data?.message || 'Failed to load room details');
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [id]);

  useEffect(() => {
    if (!user) {
      setContact(null);
      return;
    }

    (async () => {
      try {
        const { data } = await contactOwner(id);
        setContact(data.owner);
      } catch (err) {
        setError(err.response?.data?.message || 'Could not fetch owner details');
      }
    })();
  }, [id, user]);

  const amenities = useMemo(() => parseAmenities(room?.amenities), [room?.amenities]);
  const gallery = useMemo(() => {
    const images = room?.images?.map((img) => toImageUrl(img.image_url)) || [];
    return images.length ? images : [FALLBACK_IMAGE];
  }, [room?.images]);

  useEffect(() => {
    if (gallery.length && !selectedImage) {
      setSelectedImage(gallery[0]);
    }
  }, [gallery, selectedImage]);

  const onConnect = async () => {
    setError('');
    setSuccess('');

    if (!user) {
      navigate('/login');
      return;
    }

    if (user.role !== 'user') {
      setError('Only users can connect with owners.');
      return;
    }

    try {
      setSubmitting(true);
      await createBooking({ roomId: Number(id), message: connectMessage.trim() });
      setSuccess('Connection request sent to owner successfully.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send connect request');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <section className="py-10">
        <Loader label="Loading property details..." />
      </section>
    );
  }

  if (!room) {
    return (
      <section className="py-10">
        <div className="mx-auto max-w-2xl rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
          <h2 className="text-xl font-bold text-red-700">Unable to load property</h2>
          <p className="mt-2 text-red-600">{error || 'Room not found.'}</p>
          <Link to="/" className="btn-primary mt-5">Go back to home</Link>
        </div>
      </section>
    );
  }

  return (
    <section className="pb-14 pt-6">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-8">
          <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="relative h-[260px] bg-slate-100 md:h-[430px]">
              <img
                src={selectedImage || FALLBACK_IMAGE}
                alt={room.title}
                className="h-full w-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = FALLBACK_IMAGE;
                }}
              />
              <span className="absolute right-4 top-4 rounded-full bg-blue-600 px-4 py-1.5 text-sm font-bold text-white shadow-lg">
                INR {room.price}/{room.pricing_type}
              </span>
            </div>

            {gallery.length > 1 && (
              <div className="grid grid-cols-4 gap-2 border-t border-slate-100 p-3 md:grid-cols-6">
                {gallery.map((img, idx) => (
                  <button
                    type="button"
                    key={`${img}-${idx}`}
                    onClick={() => setSelectedImage(img)}
                    className={`overflow-hidden rounded-lg border transition ${selectedImage === img ? 'border-blue-600 ring-2 ring-blue-200' : 'border-slate-200 hover:border-blue-300'}`}
                  >
                    <img
                      src={img}
                      alt={`preview-${idx + 1}`}
                      className="h-16 w-full object-cover md:h-20"
                      onError={(e) => {
                        e.currentTarget.src = FALLBACK_IMAGE;
                      }}
                    />
                  </button>
                ))}
              </div>
            )}
          </article>

          <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-7">
            <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
              <div>
                <h1 className="text-3xl font-extrabold text-slate-900">{room.title}</h1>
                <p className="mt-2 flex items-center gap-2 text-slate-600">
                  <i className="fas fa-location-dot text-red-500"></i>
                  {room.city}, {room.state} - {room.pincode}
                </p>
              </div>
              <span className="badge-success self-start">{room.status}</span>
            </div>

            <h3 className="mb-2 mt-6 text-lg font-bold text-slate-900">Description</h3>
            <p className="leading-7 text-slate-700">{room.description || 'No description provided.'}</p>

            <h3 className="mb-3 mt-7 text-lg font-bold text-slate-900">Amenities</h3>
            {amenities.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {amenities.map((item, idx) => (
                  <span key={`${item}-${idx}`} className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">
                    {item}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-slate-600">No amenities listed.</p>
            )}
          </article>
        </div>

        <aside className="space-y-5 lg:col-span-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:sticky lg:top-24">
            <h2 className="text-xl font-bold text-slate-900">Connect With Owner</h2>
            <p className="mt-1 text-sm text-slate-600">Send a connect request. Owner will receive your interest message and contact details.</p>

            <div className="mt-4 rounded-xl bg-slate-50 p-4">
              <div className="flex items-center justify-between text-sm text-slate-600">
                <span>Rate</span>
                <span>INR {room.price}/{room.pricing_type}</span>
              </div>
            </div>

            <label className="mt-4 block text-xs font-bold uppercase tracking-wide text-slate-500">Message To Owner</label>
            <textarea
              className="input mt-2 min-h-[92px]"
              value={connectMessage}
              onChange={(e) => setConnectMessage(e.target.value.slice(0, 500))}
              placeholder="Write a short message to owner"
            />

            <button type="button" className="btn-primary mt-4 h-11 w-full rounded-xl" disabled={submitting || user?.role === 'admin'} onClick={onConnect}>
              {user?.role === 'admin' ? 'Admin cannot connect' : submitting ? 'Sending...' : 'Connect Owner'}
            </button>

            {!user && (
              <p className="mt-3 text-xs text-slate-500">
                Login required to connect and view owner details.
              </p>
            )}
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900">Owner Contact</h3>
            <p className="mt-1 text-sm text-slate-600">
              {user ? 'Visible after login.' : 'Hidden for guest users.'}
            </p>

            {!user ? (
              <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
                <p>Owner details are protected.</p>
                <button className="btn-secondary mt-3" onClick={() => navigate('/login')}>Login to view details</button>
              </div>
            ) : (
              <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
                {contact ? (
                  <>
                    <p><span className="font-semibold">Name:</span> {contact.name}</p>
                    <p className="mt-1"><span className="font-semibold">Phone:</span> {contact.phone || 'Not shared'}</p>
                    <p className="mt-1"><span className="font-semibold">Email:</span> {contact.email || 'Not shared'}</p>
                  </>
                ) : (
                  <p>Loading contact...</p>
                )}
              </div>
            )}
          </div>

          {(error || success) && (
            <div className={`rounded-xl border p-4 text-sm font-semibold ${error ? 'border-red-200 bg-red-50 text-red-700' : 'border-green-200 bg-green-50 text-green-700'}`}>
              {error || success}
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}
