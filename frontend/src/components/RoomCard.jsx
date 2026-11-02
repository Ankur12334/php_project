import { Link } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { deleteRoom } from '../api/rooms';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=500&h=400&fit=crop';

function toImageUrl(imagePath) {
  if (!imagePath) return FALLBACK_IMAGE;

  // Already full URL.
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) return imagePath;

  const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
  const origin = apiBase.replace(/\/api\/?$/, '');
  return `${origin}${imagePath}`;
}

export default function RoomCard({ room, onDelete }) {
  const { user } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);
  const initialImage = useMemo(() => toImageUrl(room.images?.[0]?.image_url), [room.images]);
  const [imageSrc, setImageSrc] = useState(initialImage);

  const amenitiesList = Array.isArray(room.amenities)
    ? room.amenities
    : typeof room.amenities === 'string'
    ? (() => {
        try {
          return JSON.parse(room.amenities).slice(0, 2);
        } catch (err) {
          return room.amenities.split(',').map((i) => i.trim()).filter(Boolean).slice(0, 2);
        }
      })()
    : [];

  const handleDelete = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (isDeleting) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete room "${room.title}" (ID: #${room.id})? This will permanently delete the listing.`
    );
    if (!confirmed) return;

    try {
      setIsDeleting(true);
      await deleteRoom(room.id);
      if (onDelete) {
        onDelete(room.id, `Room "${room.title}" was successfully deleted.`);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete room');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <article className="card-hover overflow-hidden group h-full flex flex-col justify-between">
      <Link to={`/rooms/${room.id}`} className="block">
        <div className="relative h-48 overflow-hidden bg-slate-200">
          <img
            src={imageSrc}
            alt={room.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            onError={() => setImageSrc(FALLBACK_IMAGE)}
          />

          <div className="absolute top-3 right-3 bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
            INR {room.price}/{room.pricing_type}
          </div>

          {amenitiesList.length > 0 && (
            <div className="absolute bottom-3 left-3 flex gap-1">
              {amenitiesList.slice(0, 2).map((tag, idx) => (
                <span key={idx} className="badge-primary" title={tag}>
                  {tag.length > 8 ? `${tag.slice(0, 6)}...` : tag}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 space-y-3">
          <div>
            <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition line-clamp-1">
              {room.title}
            </h3>
          </div>

          <div className="flex items-center gap-1 text-sm text-slate-600">
            <i className="fas fa-map-marker-alt text-red-500"></i>
            <span className="line-clamp-1">{room.city ? `${room.city}, ${room.state}` : 'Location not specified'}</span>
          </div>

          <p className="text-sm text-slate-600 line-clamp-2 h-10 leading-5">{room.description}</p>
        </div>
      </Link>

      <div className="p-4 pt-0">
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <div className="text-xs text-slate-500 flex items-center gap-1">
            <i className="fas fa-images"></i>
            {room.images?.length || 0} photos
          </div>
          <div className="flex items-center gap-2">
            <Link to={`/rooms/${room.id}`} className="btn-primary btn-sm flex items-center gap-1">
              <i className="fas fa-eye"></i>
              View Room
            </Link>
            {user?.role === 'admin' && (
              <button
                type="button"
                className="btn-danger btn-sm flex items-center gap-1"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                <i className={`fas ${isDeleting ? 'fa-spinner fa-spin' : 'fa-trash'}`}></i>
                {isDeleting ? 'Deleting...' : 'Delete Room'}
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
