<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use App\Models\Booking;
use App\Models\Room;

class BookingController extends Controller
{
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'roomId' => 'required|integer|min:1',
            'message' => 'nullable|string|min:5|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()->all()
            ], 400);
        }

        $user = $request->user();
        $roomId = $request->input('roomId');
        $message = $request->input('message');

        $room = Room::find($roomId);
        if (!$room || $room->status !== 'approved') {
            return response()->json(['message' => 'Room not available'], 404);
        }

        if ($room->owner_id === $user->id) {
            return response()->json(['message' => 'You cannot connect to your own listing'], 400);
        }

        $existing = Booking::where('user_id', $user->id)
            ->where('room_id', $roomId)
            ->whereIn('status', ['pending', 'confirmed'])
            ->first();

        if ($existing) {
            return response()->json(['message' => 'You already sent a connect request for this property'], 409);
        }

        $defaultMessage = ($user->name ?? 'A user') . ' is interested in this property and trying to connect with you.';
        $finalMessage = !empty(trim((string) $message)) ? trim((string) $message) : $defaultMessage;

        $booking = Booking::create([
            'user_id' => $user->id,
            'room_id' => $roomId,
            'start_date' => null,
            'end_date' => null,
            'message' => $finalMessage,
            'status' => 'pending',
        ]);

        return response()->json([
            'message' => 'Connect request sent to owner',
            'data' => $booking
        ], 201);
    }

    public function userBookings(Request $request)
    {
        $user = $request->user();

        $bookings = Booking::where('user_id', $user->id)
            ->with([
                'room' => function ($q) {
                    $q->with([
                        'images',
                        'owner' => function ($ownerQuery) {
                            $ownerQuery->select('id', 'name', 'phone', 'email');
                        }
                    ]);
                }
            ])
            ->orderBy('created_at', 'DESC')
            ->get();

        return response()->json($bookings);
    }

    public function ownerNotifications(Request $request)
    {
        $user = $request->user();

        $requests = Booking::whereHas('room', function ($q) use ($user) {
            $q->where('owner_id', $user->id);
        })
        ->with([
            'customer' => function ($q) {
                $q->select('id', 'name', 'email', 'phone');
            },
            'room' => function ($q) {
                $q->select('id', 'title', 'city', 'state', 'owner_id');
            }
        ])
        ->orderBy('created_at', 'DESC')
        ->get();

        return response()->json($requests);
    }
}
