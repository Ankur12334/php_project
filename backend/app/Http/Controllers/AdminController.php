<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Room;
use App\Models\Booking;

class AdminController extends Controller
{
    public function dashboard()
    {
        $totalUsers = User::count();
        $totalListings = Room::count();
        $totalBookings = Booking::count();
        $pendingListings = Room::where('status', 'pending')->count();

        return response()->json([
            'totalUsers' => $totalUsers,
            'totalListings' => $totalListings,
            'totalBookings' => $totalBookings,
            'pendingListings' => $pendingListings,
        ]);
    }

    public function pendingRooms()
    {
        $rooms = Room::where('status', 'pending')
            ->with('images')
            ->orderBy('created_at', 'DESC')
            ->get();

        return response()->json($rooms);
    }

    public function approveRoom($id)
    {
        $room = Room::find($id);
        if (!$room) {
            return response()->json(['message' => 'Room not found'], 404);
        }

        $room->status = 'approved';
        $room->save();

        return response()->json([
            'message' => 'Room approved successfully',
            'room' => $room
        ]);
    }

    public function rejectRoom($id)
    {
        $room = Room::find($id);
        if (!$room) {
            return response()->json(['message' => 'Room not found'], 404);
        }

        $room->status = 'rejected';
        $room->save();

        return response()->json([
            'message' => 'Room rejected successfully',
            'room' => $room
        ]);
    }

    public function allUsers()
    {
        $users = User::select('id', 'name', 'email', 'phone', 'role', 'is_verified', 'created_at')
            ->orderBy('created_at', 'DESC')
            ->get();

        return response()->json($users);
    }

    public function reports()
    {
        $rooms = Room::all(['status']);
        $bookings = Booking::all(['status']);
        $users = User::all(['role']);

        $countBy = function ($items, $key) {
            $counts = [];
            foreach ($items as $item) {
                $val = $item->{$key};
                if ($val !== null) {
                    $counts[$val] = ($counts[$val] ?? 0) + 1;
                }
            }
            return $counts;
        };

        return response()->json([
            'listings' => $countBy($rooms, 'status'),
            'bookings' => $countBy($bookings, 'status'),
            'users' => $countBy($users, 'role'),
        ]);
    }
}
