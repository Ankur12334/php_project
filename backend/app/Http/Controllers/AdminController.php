<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
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

    public function deleteUser(Request $request, $id)
    {
        $admin = $request->user();
        if (!$admin || $admin->role !== 'admin') {
            return response()->json(['message' => 'Forbidden: Administrator privileges required'], 403);
        }

        $targetId = (int) $id;
        if ($targetId <= 0) {
            return response()->json(['message' => 'Invalid user ID'], 400);
        }

        if ($targetId === (int) $admin->id) {
            return response()->json(['message' => 'Administrators cannot delete their own account'], 400);
        }

        $targetUser = User::find($targetId);
        if (!$targetUser) {
            return response()->json(['message' => 'User not found'], 404);
        }

        if ($targetUser->role === 'admin') {
            return response()->json(['message' => 'Cannot delete an administrator account'], 403);
        }

        DB::transaction(function () use ($targetUser) {
            // 1. Delete rooms owned by target user and clean up physical images
            $rooms = Room::where('owner_id', $targetUser->id)->with('images')->get();
            foreach ($rooms as $room) {
                foreach ($room->images as $image) {
                    if ($image->image_url) {
                        $localPath = public_path(ltrim($image->image_url, '/'));
                        if (file_exists($localPath) && is_file($localPath)) {
                            @unlink($localPath);
                        }
                    }
                }
                $room->images()->delete();
                $room->bookings()->delete();
                $room->delete();
            }

            // 2. Delete bookings made by the target user on other owners' rooms
            Booking::where('user_id', $targetUser->id)->delete();

            // 3. Clear any cached auth records / dev OTPs
            if ($targetUser->phone) {
                Cache::forget('dev_otp_' . $targetUser->phone);
                Cache::forget('dev_otp_+91' . $targetUser->phone);
                Cache::forget('twilio_fallback_' . $targetUser->phone);
                Cache::forget('twilio_fallback_+91' . $targetUser->phone);
            }

            // 4. Permanently delete the user record from the database
            $targetUser->delete();
        });

        return response()->json([
            'message' => 'User account and associated records deleted permanently'
        ]);
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
