<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use App\Models\Room;
use App\Models\RoomImage;

class RoomController extends Controller
{
    private function parseAmenities($input): array
    {
        if (empty($input)) {
            return [];
        }
        if (is_array($input)) {
            return $input;
        }
        if (is_string($input)) {
            $trimmed = trim($input);
            if (str_starts_with($trimmed, '[')) {
                $decoded = json_decode($trimmed, true);
                if (is_array($decoded)) {
                    return $decoded;
                }
            }
            return array_values(array_filter(array_map('trim', explode(',', $trimmed))));
        }
        return [];
    }

    public function index(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'page' => 'nullable|integer|min:1',
            'limit' => 'nullable|integer|min:1|max:100',
            'minPrice' => 'nullable|numeric|min:0',
            'maxPrice' => 'nullable|numeric|min:0',
            'city' => 'nullable|string',
            'state' => 'nullable|string',
            'amenities' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()->all()
            ], 400);
        }

        $page = (int) $request->query('page', 1);
        $limit = (int) $request->query('limit', 10);
        $offset = ($page - 1) * $limit;

        $query = Room::query()->where('status', 'approved');

        if ($request->filled('city')) {
            $query->where('city', 'LIKE', '%' . $request->query('city') . '%');
        }

        if ($request->filled('state')) {
            $query->where('state', 'LIKE', '%' . $request->query('state') . '%');
        }

        if ($request->filled('minPrice')) {
            $query->where('price', '>=', (float) $request->query('minPrice'));
        }

        if ($request->filled('maxPrice')) {
            $query->where('price', '<=', (float) $request->query('maxPrice'));
        }

        if ($request->filled('amenities')) {
            $amenitiesList = array_values(array_filter(array_map('trim', explode(',', $request->query('amenities')))));
            foreach ($amenitiesList as $amenity) {
                $query->whereRaw("JSON_CONTAINS(amenities, ?)", [json_encode($amenity)]);
            }
        }

        $total = $query->count();
        $rows = $query->with([
            'images',
            'owner' => function ($q) {
                $q->select('id', 'name', 'phone', 'email');
            }
        ])
        ->orderBy('created_at', 'DESC')
        ->offset($offset)
        ->limit($limit)
        ->get();

        return response()->json([
            'data' => $rows,
            'meta' => [
                'page' => $page,
                'limit' => $limit,
                'total' => $total,
                'totalPages' => (int) ceil($total / $limit)
            ]
        ]);
    }

    public function show(Request $request, $id)
    {
        $room = Room::with([
            'images',
            'owner' => function ($q) {
                $q->select('id', 'name', 'phone', 'email');
            }
        ])->find($id);

        if (!$room) {
            return response()->json(['message' => 'Room not found'], 404);
        }

        if ($room->status !== 'approved') {
            $user = $request->user();
            if (!$user || ($user->role !== 'admin' && $user->id !== $room->owner_id)) {
                return response()->json(['message' => 'Room is not publicly available'], 403);
            }
        }

        return response()->json($room);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|min:2',
            'description' => 'required|string|min:3',
            'price' => 'required|numeric|min:1',
            'pricing_type' => 'required|in:night,month',
            'city' => 'required|string',
            'state' => 'required|string',
            'pincode' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()->all()
            ], 400);
        }

        $user = $request->user();
        $amenities = $this->parseAmenities($request->input('amenities'));

        $room = Room::create([
            'owner_id' => $user->id,
            'title' => $request->title,
            'description' => $request->description,
            'price' => $request->price,
            'pricing_type' => $request->pricing_type,
            'city' => $request->city,
            'state' => $request->state,
            'pincode' => $request->pincode,
            'amenities' => $amenities,
            'status' => 'pending',
        ]);

        $files = $request->file('images');
        if ($files) {
            if (!is_array($files)) {
                $files = [$files];
            }
            $targetDir = public_path('uploads/rooms');
            if (!file_exists($targetDir)) {
                mkdir($targetDir, 0755, true);
            }

            foreach ($files as $file) {
                $filename = time() . '-' . rand(100000000, 999999999) . '.' . $file->getClientOriginalExtension();
                $file->move($targetDir, $filename);

                RoomImage::create([
                    'room_id' => $room->id,
                    'image_url' => "/uploads/rooms/{$filename}"
                ]);
            }
        }

        $saved = Room::with('images')->find($room->id);
        return response()->json($saved, 201);
    }

    public function update(Request $request, $id)
    {
        $room = Room::find($id);
        if (!$room) {
            return response()->json(['message' => 'Room not found'], 404);
        }

        $user = $request->user();
        if ($room->owner_id !== $user->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $validator = Validator::make($request->all(), [
            'title' => 'nullable|string|min:2',
            'description' => 'nullable|string|min:3',
            'price' => 'nullable|numeric|min:1',
            'pricing_type' => 'nullable|in:night,month',
            'city' => 'nullable|string',
            'state' => 'nullable|string',
            'pincode' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()->all()
            ], 400);
        }

        $amenities = $request->has('amenities')
            ? $this->parseAmenities($request->input('amenities'))
            : $room->amenities;

        $room->update([
            'title' => $request->input('title', $room->title),
            'description' => $request->input('description', $room->description),
            'price' => $request->input('price', $room->price),
            'pricing_type' => $request->input('pricing_type', $room->pricing_type),
            'city' => $request->input('city', $room->city),
            'state' => $request->input('state', $room->state),
            'pincode' => $request->input('pincode', $room->pincode),
            'amenities' => $amenities,
            'status' => 'pending',
        ]);

        $files = $request->file('images');
        if ($files) {
            if (!is_array($files)) {
                $files = [$files];
            }
            $targetDir = public_path('uploads/rooms');
            if (!file_exists($targetDir)) {
                mkdir($targetDir, 0755, true);
            }

            foreach ($files as $file) {
                $filename = time() . '-' . rand(100000000, 999999999) . '.' . $file->getClientOriginalExtension();
                $file->move($targetDir, $filename);

                RoomImage::create([
                    'room_id' => $room->id,
                    'image_url' => "/uploads/rooms/{$filename}"
                ]);
            }
        }

        $updated = Room::with('images')->find($room->id);
        return response()->json($updated);
    }

    public function destroy(Request $request, $id)
    {
        $room = Room::find($id);
        if (!$room) {
            return response()->json(['message' => 'Room not found'], 404);
        }

        $user = $request->user();
        if ($room->owner_id !== $user->id && $user->role !== 'admin') {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $room->delete();
        return response()->json(['message' => 'Room deleted successfully']);
    }

    public function ownerRooms(Request $request)
    {
        $user = $request->user();
        $rooms = Room::where('owner_id', $user->id)
            ->with('images')
            ->orderBy('created_at', 'DESC')
            ->get();

        return response()->json($rooms);
    }

    public function contactOwner(Request $request, $id)
    {
        $room = Room::with(['owner' => function ($q) {
            $q->select('id', 'name', 'email', 'phone');
        }])->find($id);

        if (!$room) {
            return response()->json(['message' => 'Room not found'], 404);
        }

        return response()->json([
            'owner' => $room->owner,
            'message' => 'Use these details to contact the owner directly.'
        ]);
    }
}
