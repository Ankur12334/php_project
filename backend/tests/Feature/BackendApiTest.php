<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Room;
use App\Models\Booking;
use App\Services\JwtService;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Http\UploadedFile;

class BackendApiTest extends TestCase
{
    use DatabaseTransactions;

    public function test_health_check()
    {
        $response = $this->getJson('/health');
        $response->assertStatus(200)
                 ->assertJson(['status' => 'ok']);
    }

    public function test_send_and_verify_otp_flow()
    {
        $phone = '9876543210';

        $sendResponse = $this->postJson('/api/auth/otp/send', ['phone' => $phone]);
        $sendResponse->assertStatus(200)
                     ->assertJsonStructure(['message', 'userExists']);

        $verifyResponse = $this->postJson('/api/auth/otp/verify', [
            'phone' => $phone,
            'code' => '123456'
        ]);
        $verifyResponse->assertStatus(200)
                       ->assertJsonStructure(['requiresRegistration', 'authType', 'registrationToken']);

        $registrationToken = $verifyResponse->json('registrationToken');

        $regResponse = $this->postJson('/api/auth/register', [
            'registrationToken' => $registrationToken,
            'name' => 'Test User Flow',
            'email' => 'testuserflow@example.com'
        ]);
        $regResponse->assertStatus(201)
                   ->assertJsonStructure(['token', 'user']);
    }

    public function test_room_crud_and_listings_flow()
    {
        $user = User::create([
            'name' => 'Listing Owner',
            'email' => 'owner@example.com',
            'phone' => '9111111111',
            'role' => 'user',
            'is_verified' => true,
        ]);

        $token = JwtService::signToken($user);
        $headers = ['Authorization' => 'Bearer ' . $token];

        $createResponse = $this->postJson('/api/rooms', [
            'title' => 'Cozy Apartment',
            'description' => 'Beautiful sea view room',
            'price' => 2500.00,
            'pricing_type' => 'night',
            'city' => 'Mumbai',
            'state' => 'Maharashtra',
            'pincode' => '400001',
            'amenities' => ['WiFi', 'AC'],
        ], $headers);

        $createResponse->assertStatus(201)
                       ->assertJsonFragment(['title' => 'Cozy Apartment', 'status' => 'pending']);

        $roomId = $createResponse->json('id');

        $ownerListings = $this->getJson('/api/rooms/my/listings', $headers);
        $ownerListings->assertStatus(200)
                      ->assertJsonCount(1);

        $room = Room::find($roomId);
        $room->status = 'approved';
        $room->save();

        $listResponse = $this->getJson('/api/rooms?city=Mumbai');
        $listResponse->assertStatus(200)
                     ->assertJsonStructure(['data', 'meta'])
                     ->assertJsonFragment(['title' => 'Cozy Apartment']);

        $getRoom = $this->getJson('/api/rooms/' . $roomId);
        $getRoom->assertStatus(200)
                ->assertJsonFragment(['id' => $roomId]);

        $updateResponse = $this->putJson('/api/rooms/' . $roomId, [
            'title' => 'Updated Cozy Apartment',
            'price' => 3000.00,
        ], $headers);
        $updateResponse->assertStatus(200)
                       ->assertJsonFragment(['title' => 'Updated Cozy Apartment']);

        $contactResponse = $this->getJson('/api/rooms/' . $roomId . '/contact', $headers);
        $contactResponse->assertStatus(200)
                        ->assertJsonStructure(['owner', 'message']);
    }

    public function test_booking_connect_flow()
    {
        $owner = User::create([
            'name' => 'Room Owner',
            'email' => 'roomowner@example.com',
            'phone' => '9222222222',
            'role' => 'user',
            'is_verified' => true,
        ]);

        $room = Room::create([
            'owner_id' => $owner->id,
            'title' => 'Luxury Villa',
            'description' => 'Spacious room',
            'price' => 5000.00,
            'pricing_type' => 'night',
            'city' => 'Goa',
            'state' => 'Goa',
            'pincode' => '403001',
            'amenities' => ['Pool'],
            'status' => 'approved',
        ]);

        $customer = User::create([
            'name' => 'Customer User',
            'email' => 'customer@example.com',
            'phone' => '9333333333',
            'role' => 'user',
            'is_verified' => true,
        ]);

        $customerToken = JwtService::signToken($customer);
        $customerHeaders = ['Authorization' => 'Bearer ' . $customerToken];

        $bookingResponse = $this->postJson('/api/bookings', [
            'roomId' => $room->id,
            'message' => 'Hi, I want to book this room!'
        ], $customerHeaders);

        $bookingResponse->assertStatus(201)
                        ->assertJsonFragment(['message' => 'Connect request sent to owner']);

        $userBookings = $this->getJson('/api/bookings/user', $customerHeaders);
        $userBookings->assertStatus(200)
                     ->assertJsonCount(1);

        $ownerToken = JwtService::signToken($owner);
        $ownerHeaders = ['Authorization' => 'Bearer ' . $ownerToken];

        $ownerNotifications = $this->getJson('/api/bookings/owner', $ownerHeaders);
        $ownerNotifications->assertStatus(200)
                           ->assertJsonCount(1);
    }

    public function test_admin_flow()
    {
        $admin = User::create([
            'name' => 'Admin Controller Test',
            'email' => 'admintest@roomfinder.com',
            'phone' => '9000000000',
            'role' => 'admin',
            'is_verified' => true,
        ]);

        $adminToken = JwtService::signToken($admin);
        $adminHeaders = ['Authorization' => 'Bearer ' . $adminToken];

        $dashboard = $this->getJson('/api/admin/dashboard', $adminHeaders);
        $dashboard->assertStatus(200)
                  ->assertJsonStructure(['totalUsers', 'totalListings', 'totalBookings', 'pendingListings']);

        $pending = $this->getJson('/api/admin/rooms/pending', $adminHeaders);
        $pending->assertStatus(200);

        $users = $this->getJson('/api/admin/users', $adminHeaders);
        $users->assertStatus(200);

        $reports = $this->getJson('/api/admin/reports', $adminHeaders);
        $reports->assertStatus(200)
                ->assertJsonStructure(['listings', 'bookings', 'users']);
    }
}
