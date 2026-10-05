const { Op } = require('sequelize');
const { sequelize, User, Room, RoomImage } = require('../src/models');

const OWNER_ID = 2;
const TOTAL = 500;
const STATUS_TARGET = { approved: 400, pending: 50, rejected: 50 };

const cityData = [
  { city: 'Mumbai', state: 'Maharashtra', pinPrefix: '400' },
  { city: 'Pune', state: 'Maharashtra', pinPrefix: '411' },
  { city: 'Nagpur', state: 'Maharashtra', pinPrefix: '440' },
  { city: 'Delhi', state: 'Delhi', pinPrefix: '110' },
  { city: 'Noida', state: 'Uttar Pradesh', pinPrefix: '201' },
  { city: 'Lucknow', state: 'Uttar Pradesh', pinPrefix: '226' },
  { city: 'Kanpur', state: 'Uttar Pradesh', pinPrefix: '208' },
  { city: 'Bengaluru', state: 'Karnataka', pinPrefix: '560' },
  { city: 'Mysuru', state: 'Karnataka', pinPrefix: '570' },
  { city: 'Hyderabad', state: 'Telangana', pinPrefix: '500' },
  { city: 'Chennai', state: 'Tamil Nadu', pinPrefix: '600' },
  { city: 'Coimbatore', state: 'Tamil Nadu', pinPrefix: '641' },
  { city: 'Kolkata', state: 'West Bengal', pinPrefix: '700' },
  { city: 'Jaipur', state: 'Rajasthan', pinPrefix: '302' },
  { city: 'Ahmedabad', state: 'Gujarat', pinPrefix: '380' },
  { city: 'Surat', state: 'Gujarat', pinPrefix: '395' },
  { city: 'Indore', state: 'Madhya Pradesh', pinPrefix: '452' },
  { city: 'Bhopal', state: 'Madhya Pradesh', pinPrefix: '462' },
  { city: 'Kochi', state: 'Kerala', pinPrefix: '682' },
  { city: 'Bhubaneswar', state: 'Odisha', pinPrefix: '751' },
  { city: 'Patna', state: 'Bihar', pinPrefix: '800' },
  { city: 'Chandigarh', state: 'Chandigarh', pinPrefix: '160' }
];

const amenityPool = [
  'Wifi', 'Parking', 'AC', 'Power Backup', 'Lift', 'CCTV', 'Furnished', 'RO Water', 'Security Guard', 'Geyser'
];

const shutterstockImages = [
  'https://image.shutterstock.com/image-photo/luxury-modern-bedroom-interior-design-260nw-1725551161.jpg',
  'https://image.shutterstock.com/image-photo/modern-living-room-interior-design-260nw-1716454693.jpg',
  'https://image.shutterstock.com/image-photo/modern-kitchen-interior-design-clean-260nw-1749473624.jpg',
  'https://image.shutterstock.com/image-photo/beautiful-apartment-interior-living-room-260nw-1928491655.jpg',
  'https://image.shutterstock.com/image-photo/cozy-bedroom-interior-scandinavian-style-260nw-1676932237.jpg',
  'https://image.shutterstock.com/image-photo/real-estate-house-exterior-evening-260nw-1704273043.jpg',
  'https://image.shutterstock.com/image-photo/modern-bathroom-interior-white-tiles-260nw-1909422802.jpg',
  'https://image.shutterstock.com/image-photo/stylish-home-office-interior-workspace-260nw-1714891414.jpg',
  'https://image.shutterstock.com/image-photo/furnished-studio-apartment-interior-small-260nw-1941772278.jpg',
  'https://image.shutterstock.com/image-photo/interior-living-room-modern-style-260nw-1656921205.jpg'
];

const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const pickAmenities = () => {
  const size = randomInt(3, 6);
  const copy = [...amenityPool].sort(() => Math.random() - 0.5);
  return copy.slice(0, size);
};

const shuffle = (arr) => {
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

async function run() {
  const owner = await User.findByPk(OWNER_ID);
  if (!owner) {
    throw new Error(`User with id=${OWNER_ID} not found`);
  }

  const batchTag = `RFB${Date.now()}`;

  const statuses = [
    ...Array(STATUS_TARGET.approved).fill('approved'),
    ...Array(STATUS_TARGET.pending).fill('pending'),
    ...Array(STATUS_TARGET.rejected).fill('rejected')
  ];
  shuffle(statuses);

  const roomsPayload = Array.from({ length: TOTAL }, (_, idx) => {
    const c = cityData[idx % cityData.length];
    const pricingType = Math.random() < 0.72 ? 'month' : 'night';
    const price = pricingType === 'month' ? randomInt(6500, 52000) : randomInt(650, 4200);
    const pin = `${c.pinPrefix}${String(randomInt(1, 999)).padStart(3, '0')}`;

    return {
      owner_id: OWNER_ID,
      title: `${batchTag} Listing ${idx + 1} - ${c.city}`,
      description: `Well-maintained ${Math.random() < 0.5 ? '1BHK' : '2BHK'} rental in ${c.city}, ${c.state}. Ideal for professionals and students.`,
      price,
      pricing_type: pricingType,
      city: c.city,
      state: c.state,
      pincode: pin,
      amenities: pickAmenities(),
      status: statuses[idx]
    };
  });

  await sequelize.transaction(async (t) => {
    await Room.bulkCreate(roomsPayload, { transaction: t });

    const createdRooms = await Room.findAll({
      attributes: ['id', 'title', 'status'],
      where: {
        owner_id: OWNER_ID,
        title: { [Op.like]: `${batchTag}%` }
      },
      transaction: t
    });

    const imageRows = createdRooms.flatMap((room) => {
      const imgCount = randomInt(1, 3);
      return Array.from({ length: imgCount }, (_, i) => ({
        room_id: room.id,
        image_url: shutterstockImages[(room.id + i) % shutterstockImages.length]
      }));
    });

    await RoomImage.bulkCreate(imageRows, { transaction: t });

    const statusCount = createdRooms.reduce((acc, r) => {
      acc[r.status] = (acc[r.status] || 0) + 1;
      return acc;
    }, {});

    console.log('Seed completed successfully');
    console.log(`Owner id: ${OWNER_ID}`);
    console.log(`Batch tag: ${batchTag}`);
    console.log(`Rooms created: ${createdRooms.length}`);
    console.log(`Images created: ${imageRows.length}`);
    console.log('Status distribution:', statusCount);
  });
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Seed failed:', err.message);
    process.exit(1);
  });
