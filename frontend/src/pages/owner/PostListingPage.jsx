import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createRoom } from '../../api/rooms';

const MAX_IMAGES = 4;
const MAX_IMAGE_SIZE = 2 * 1024 * 1024;
const MAX_TOTAL_SIZE = 8 * 1024 * 1024;

const ALLOWED_FORMATS = new Set([
  'image/jpeg',
  'image/png',
  'image/webp'
]);

const ALLOWED_EXTENSIONS = /\.(jpe?g|png|webp)$/i;

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

const formatBytes = (bytes) => {
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const isAllowedImage = (file) => {
  const validMime = ALLOWED_FORMATS.has(file.type.toLowerCase());
  const validExtension = ALLOWED_EXTENSIONS.test(file.name);

  return validMime || (!file.type && validExtension);
};

/**
 * Decode an image without requiring an external compression library.
 */
async function loadImage(file) {
  if ('createImageBitmap' in window) {
    return createImageBitmap(file);
  }

  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error(`Unable to read image: ${file.name}`));
    };

    image.src = objectUrl;
  });
}

/**
 * Compress an image into WebP.
 *
 * The output must be no larger than 2 MB.
 * Image dimensions and quality are reduced progressively if necessary.
 */
async function compressImage(file) {
  let image;

  try {
    image = await loadImage(file);

    const originalWidth = image.width;
    const originalHeight = image.height;

    if (!originalWidth || !originalHeight) {
      throw new Error('The selected image is invalid.');
    }

    const MAX_DIMENSION = 1920;
    let scale = Math.min(
      1,
      MAX_DIMENSION / Math.max(originalWidth, originalHeight)
    );

    const qualities = [0.88, 0.82, 0.76, 0.70, 0.64, 0.58, 0.52, 0.46];

    for (let round = 0; round < 6; round++) {
      const canvas = document.createElement('canvas');

      canvas.width = Math.max(1, Math.round(originalWidth * scale));
      canvas.height = Math.max(1, Math.round(originalHeight * scale));

      const context = canvas.getContext('2d');

      if (!context) {
        throw new Error('Image compression is not supported by this browser.');
      }

      context.drawImage(image, 0, 0, canvas.width, canvas.height);

      for (const quality of qualities) {
        const blob = await new Promise((resolve, reject) => {
          canvas.toBlob(
            (result) => {
              if (result) {
                resolve(result);
              } else {
                reject(new Error('Image compression failed.'));
              }
            },
            'image/webp',
            quality
          );
        });

        if (blob.type !== 'image/webp') {
          throw new Error(
            'WebP compression is not supported by this browser.'
          );
        }

        if (blob.size <= MAX_IMAGE_SIZE) {
          const originalName = file.name.replace(/\.[^.]+$/, '');

          const compressedFile = new File(
            [blob],
            `${originalName}.webp`,
            {
              type: 'image/webp',
              lastModified: Date.now()
            }
          );

          compressedFile.originalName = file.name;
          compressedFile.originalSize = file.size;
          compressedFile.uid = crypto.randomUUID();

          return compressedFile;
        }
      }

      // Reduce dimensions before the next compression round.
      scale *= 0.8;
    }

    throw new Error(
      `Unable to compress "${file.name}" below 2 MB. Please choose a smaller image.`
    );
  } finally {
    if (image && typeof image.close === 'function') {
      image.close();
    }
  }
}

function CustomSelect({
  value,
  onChange,
  options,
  className = ''
}) {
  return (
    <div className={`relative ${className}`}>
      <select
        className="h-11 w-full appearance-none rounded-xl border border-slate-300 bg-white px-4 pr-10 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
        value={value}
        onChange={onChange}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <i className="fas fa-chevron-down pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400"></i>
    </div>
  );
}

export default function PostListingPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const processingRef = useRef(false);

  const [form, setForm] = useState(initialForm);
  const [amenityInput, setAmenityInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [processingImages, setProcessingImages] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const addAmenity = (rawValue) => {
    const value = String(rawValue || '').trim();

    if (!value) return;

    setForm((previous) => {
      const exists = previous.amenities.some(
        (amenity) => amenity.toLowerCase() === value.toLowerCase()
      );

      if (exists) return previous;

      return {
        ...previous,
        amenities: [...previous.amenities, value]
      };
    });

    setAmenityInput('');
  };

  const removeAmenity = (target) => {
    setForm((previous) => ({
      ...previous,
      amenities: previous.amenities.filter(
        (amenity) => amenity !== target
      )
    }));
  };

  const addFiles = async (fileList) => {
    if (processingRef.current || saving) return;

    const incomingFiles = Array.from(fileList || []);

    if (!incomingFiles.length) return;

    processingRef.current = true;
    setProcessingImages(true);
    setError('');
    setMessage('');

    try {
      const invalidFiles = incomingFiles.filter(
        (file) => !isAllowedImage(file)
      );

      if (invalidFiles.length) {
        throw new Error(
          'Unsupported image format. Use JPG, JPEG, PNG, or WebP.'
        );
      }

      // Read the latest selection before processing new files.
      const existingImages = form.images;

      const uniqueIncoming = incomingFiles.filter((file, index, array) => {
        const duplicateInSelection = array.findIndex(
          (candidate) =>
            candidate.name === file.name &&
            candidate.size === file.size &&
            candidate.lastModified === file.lastModified
        );

        const alreadySelected = existingImages.some(
          (image) =>
            image.originalName === file.name &&
            image.originalSize === file.size
        );

        return duplicateInSelection === index && !alreadySelected;
      });

      if (!uniqueIncoming.length) {
        throw new Error('These images have already been selected.');
      }

      if (existingImages.length + uniqueIncoming.length > MAX_IMAGES) {
        throw new Error(
          `Maximum ${MAX_IMAGES} images allowed. You can add ${
            MAX_IMAGES - existingImages.length
          } more image(s).`
        );
      }

      const compressedImages = [];

      for (const file of uniqueIncoming) {
        const compressed = await compressImage(file);

        if (compressed.size > MAX_IMAGE_SIZE) {
          throw new Error(
            `Image "${file.name}" exceeds the 2 MB limit after compression.`
          );
        }

        compressedImages.push(compressed);
      }

      const allImages = [...existingImages, ...compressedImages];

      const totalSize = allImages.reduce(
        (total, image) => total + image.size,
        0
      );

      if (totalSize > MAX_TOTAL_SIZE) {
        throw new Error(
          'Total image size must not exceed 8 MB. Remove an image and try again.'
        );
      }

      setForm((previous) => ({
        ...previous,
        images: [...previous.images, ...compressedImages]
      }));

      setError('');
    } catch (err) {
      setError(err.message || 'Unable to process the selected images.');
    } finally {
      processingRef.current = false;
      setProcessingImages(false);

      // Reset the input so the same file can be selected again if needed.
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeImage = (uid) => {
    setForm((previous) => ({
      ...previous,
      images: previous.images.filter((image) => image.uid !== uid)
    }));

    setError('');
  };

  const onSubmit = async (event) => {
    event.preventDefault();

    if (processingRef.current || processingImages) {
      setError('Please wait until image processing is complete.');
      return;
    }

    if (saving) return;

    if (form.images.length > MAX_IMAGES) {
      setError('Maximum 4 images allowed per listing.');
      return;
    }

    const oversizedImage = form.images.find(
      (image) => image.size > MAX_IMAGE_SIZE
    );

    if (oversizedImage) {
      setError('Each image must be no larger than 2 MB.');
      return;
    }

    const totalSize = form.images.reduce(
      (total, image) => total + image.size,
      0
    );

    if (totalSize > MAX_TOTAL_SIZE) {
      setError('Total image size must not exceed 8 MB.');
      return;
    }

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
        payload.append('images[]', file, file.name);
      }

      await createRoom(payload);

      setMessage(
        'Listing submitted successfully. It is now pending admin verification.'
      );

      setForm(initialForm);
      setAmenityInput('');

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      const statusCode = err.response?.status;
      const serverMessage =
        err.response?.data?.message ||
        err.response?.data?.error ||
        '';

      if (statusCode === 413) {
        setError(
          'Image upload failed because the request is too large. Please use smaller images.'
        );
      } else if (
        /post_max_size|upload_max_filesize|request entity too large|payload too large/i.test(
          serverMessage
        )
      ) {
        setError(
          'Image upload limit exceeded. Please use smaller images or contact the administrator.'
        );
      } else {
        setError(serverMessage || 'Failed to create the listing.');
      }
    } finally {
      setSaving(false);
    }
  };

  const totalImageSize = form.images.reduce(
    (total, image) => total + image.size,
    0
  );

  return (
    <section className="space-y-6 pb-8">
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-700 p-6 text-white shadow-lg md:p-8">
        <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-blue-100">
          <i className="fas fa-pen-nib"></i>
          Post Listing
        </p>

        <h1 className="text-3xl font-bold md:text-4xl">
          Create New Property Listing
        </h1>

        <p className="mt-2 text-sm text-blue-100">
          Add complete details and images for faster approval and better visibility.
        </p>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-7">
        {error && (
          <div
            role="alert"
            className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700"
          >
            {error}
          </div>
        )}

        {message && (
          <div
            role="status"
            className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700"
          >
            {message}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                Title *
              </label>

              <input
                className="input h-11"
                placeholder="Furnished 1BHK Near City Center"
                value={form.title}
                onChange={(event) =>
                  setForm((previous) => ({
                    ...previous,
                    title: event.target.value
                  }))
                }
                required
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                Price *
              </label>

              <input
                className="input h-11"
                placeholder="12000"
                type="number"
                min="1"
                value={form.price}
                onChange={(event) =>
                  setForm((previous) => ({
                    ...previous,
                    price: event.target.value
                  }))
                }
                required
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                Pricing Type *
              </label>

              <select
                className="input h-11"
                value={form.pricing_type}
                onChange={(event) =>
                  setForm((previous) => ({
                    ...previous,
                    pricing_type: event.target.value
                  }))
                }
              >
                <option value="night">Per night</option>
                <option value="month">Per month</option>
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                City *
              </label>

              <input
                className="input h-11"
                placeholder="Mumbai"
                value={form.city}
                onChange={(event) =>
                  setForm((previous) => ({
                    ...previous,
                    city: event.target.value
                  }))
                }
                required
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                State *
              </label>

              <input
                className="input h-11"
                placeholder="Maharashtra"
                value={form.state}
                onChange={(event) =>
                  setForm((previous) => ({
                    ...previous,
                    state: event.target.value
                  }))
                }
                required
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                Pincode *
              </label>

              <input
                className="input h-11"
                placeholder="400001"
                value={form.pincode}
                onChange={(event) =>
                  setForm((previous) => ({
                    ...previous,
                    pincode: event.target.value
                  }))
                }
                required
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">
              Amenities
            </label>

            <div className="rounded-2xl border border-slate-300 p-3">
              <div className="flex flex-wrap gap-2">
                {form.amenities.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700"
                  >
                    {tag}

                    <button
                      type="button"
                      className="text-blue-700/80 hover:text-blue-900"
                      onClick={() => removeAmenity(tag)}
                      aria-label={`Remove ${tag}`}
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  </span>
                ))}

                {!form.amenities.length && (
                  <p className="text-sm text-slate-500">
                    No amenities selected.
                  </p>
                )}
              </div>

              <div className="mt-3 flex flex-col gap-2 md:flex-row">
                <input
                  className="input h-10"
                  placeholder="Type amenity and press Enter"
                  value={amenityInput}
                  onChange={(event) => setAmenityInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ',') {
                      event.preventDefault();
                      addAmenity(amenityInput);
                    }
                  }}
                />

                <button
                  type="button"
                  className="btn-secondary h-10"
                  onClick={() => addAmenity(amenityInput)}
                >
                  Add
                </button>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {AMENITY_SUGGESTIONS.map((item) => {
                  const active = form.amenities.some(
                    (amenity) =>
                      amenity.toLowerCase() === item.toLowerCase()
                  );

                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => {
                        if (active) {
                          const existing = form.amenities.find(
                            (amenity) =>
                              amenity.toLowerCase() === item.toLowerCase()
                          );

                          removeAmenity(existing);
                        } else {
                          addAmenity(item);
                        }
                      }}
                      className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                        active
                          ? 'border-blue-200 bg-blue-50 text-blue-700'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:text-blue-700'
                      }`}
                    >
                      {item}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">
              Room Images (maximum 4)
            </label>

            <input
              ref={fileInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
              multiple
              disabled={saving || processingImages}
              className="hidden"
              onChange={(event) => addFiles(event.target.files)}
            />

            <button
              type="button"
              disabled={saving || processingImages}
              className={`w-full rounded-2xl border-2 border-dashed p-6 text-center transition disabled:cursor-not-allowed disabled:opacity-60 ${
                dragActive
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-slate-300 bg-slate-50 hover:border-blue-300 hover:bg-blue-50/40'
              }`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(event) => {
                event.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={(event) => {
                event.preventDefault();
                setDragActive(false);
              }}
              onDrop={(event) => {
                event.preventDefault();
                setDragActive(false);

                if (!saving && !processingImages) {
                  addFiles(event.dataTransfer.files);
                }
              }}
            >
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                <i
                  className={`fas ${
                    processingImages
                      ? 'fa-spinner fa-spin'
                      : 'fa-cloud-arrow-up'
                  } text-lg`}
                ></i>
              </div>

              <p className="mt-3 text-sm font-semibold text-slate-700">
                {processingImages
                  ? 'Compressing images...'
                  : 'Drag and drop images here, or click to upload'}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                JPG, JPEG, PNG, WebP · Maximum 4 images · 2 MB per image · 8 MB total
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Images are automatically compressed before upload.
              </p>
            </button>

            {form.images.length > 0 && (
              <div className="mt-3 rounded-xl border border-slate-200 p-3">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                    Selected Images ({form.images.length}/{MAX_IMAGES})
                  </p>

                  <p className="text-xs font-semibold text-slate-600">
                    Total: {formatBytes(totalImageSize)} / 8 MB
                  </p>
                </div>

                <div className="grid gap-2 md:grid-cols-2">
                  {form.images.map((file) => (
                    <div
                      key={file.uid}
                      className="flex min-w-0 items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2 text-sm"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium text-slate-700">
                          {file.originalName || file.name}
                        </p>

                        <p className="text-xs text-slate-500">
                          {formatBytes(file.size)}
                          {file.originalSize > file.size &&
                            ` · Compressed from ${formatBytes(file.originalSize)}`}
                        </p>
                      </div>

                      <button
                        type="button"
                        className="shrink-0 text-rose-600 hover:text-rose-700 disabled:opacity-50"
                        disabled={saving || processingImages}
                        onClick={() => removeImage(file.uid)}
                        aria-label={`Remove ${file.originalName || file.name}`}
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">
              Description *
            </label>

            <textarea
              className="input min-h-[130px]"
              placeholder="Write complete details: room size, furnishing, nearby facilities, rules and other highlights."
              value={form.description}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  description: event.target.value
                }))
              }
              required
            />
          </div>

          <div className="flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              className="btn-secondary"
              disabled={saving || processingImages}
              onClick={() => navigate('/dashboard')}
            >
              Back to Listings
            </button>

            <button
              type="submit"
              className="btn-primary"
              disabled={saving || processingImages}
            >
              {processingImages
                ? 'Compressing Images...'
                : saving
                  ? 'Submitting...'
                  : 'Submit For Verification'}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}