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

    public function test_google_registration_flow_without_otp()
    {
        $registrationToken = JwtService::signRegistrationToken([
            'authType' => 'google',
            'google_id' => 'google_sub_test_123',
            'email' => 'newgoogleuser@example.com',
            'name' => 'New Google User',
        ]);

        $regResponse = $this->postJson('/api/auth/register', [
            'registrationToken' => $registrationToken,
            'name' => 'New Google User',
            'phone' => '9876543219',
        ]);

        $regResponse->assertStatus(201)
                   ->assertJsonStructure(['token', 'user'])
                   ->assertJsonFragment([
                       'name' => 'New Google User',
                       'email' => 'newgoogleuser@example.com',
                       'phone' => '9876543219',
                       'is_verified' => true,
                   ]);

        $this->assertDatabaseHas('users', [
            'email' => 'newgoogleuser@example.com',
            'phone' => '9876543219',
            'google_id' => 'google_sub_test_123',
            'is_verified' => 1,
        ]);

        $dupRegistrationToken = JwtService::signRegistrationToken([
            'authType' => 'google',
            'google_id' => 'google_sub_test_another',
            'email' => 'anothergoogleuser@example.com',
            'name' => 'Another Google User',
        ]);

        $dupResponse = $this->postJson('/api/auth/register', [
            'registrationToken' => $dupRegistrationToken,
            'name' => 'Another Google User',
            'phone' => '9876543219',
        ]);

        $dupResponse->assertStatus(409)
                    ->assertJsonFragment(['message' => 'Phone number is already registered.']);
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

    public function test_room_image_limit_maximum_three()
    {
        $user = User::create([
            'name' => 'Image Limit Owner',
            'email' => 'imagelimit@example.com',
            'phone' => '9444444444',
            'role' => 'user',
            'is_verified' => true,
        ]);
        $token = JwtService::signToken($user);
        $headers = ['Authorization' => 'Bearer ' . $token];

        // 3 images succeeds
        $img1 = UploadedFile::fake()->image('img1.jpg');
        $img2 = UploadedFile::fake()->image('img2.jpg');
        $img3 = UploadedFile::fake()->image('img3.jpg');

        $response3 = $this->postJson('/api/rooms', [
            'title' => 'Room with 3 images',
            'description' => 'Test room with three images',
            'price' => 1500.00,
            'pricing_type' => 'night',
            'city' => 'Delhi',
            'state' => 'Delhi',
            'pincode' => '110001',
            'images' => [$img1, $img2, $img3],
        ], $headers);

        $response3->assertStatus(201);
        $this->assertCount(3, $response3->json('images'));

        // 4 images rejected
        $img4 = UploadedFile::fake()->image('img4.jpg');
        $response4 = $this->postJson('/api/rooms', [
            'title' => 'Room with 4 images',
            'description' => 'Test room with four images',
            'price' => 1500.00,
            'pricing_type' => 'night',
            'city' => 'Delhi',
            'state' => 'Delhi',
            'pincode' => '110001',
            'images' => [$img1, $img2, $img3, $img4],
        ], $headers);

        $response4->assertStatus(400)
                  ->assertJsonFragment(['Maximum 3 images allowed per room listing']);
    }

    public function test_admin_can_delete_room_and_regular_user_cannot()
    {
        $owner = User::create([
            'name' => 'Room Owner For Delete',
            'email' => 'ownerdelete@example.com',
            'phone' => '9555555555',
            'role' => 'user',
            'is_verified' => true,
        ]);
        $ownerToken = JwtService::signToken($owner);

        $admin = User::create([
            'name' => 'Admin For Room Delete',
            'email' => 'adminroomdelete@example.com',
            'phone' => '9666666666',
            'role' => 'admin',
            'is_verified' => true,
        ]);
        $adminToken = JwtService::signToken($admin);

        $room = Room::create([
            'owner_id' => $owner->id,
            'title' => 'Room To Be Deleted',
            'description' => 'Will be deleted by admin',
            'price' => 2000.00,
            'pricing_type' => 'night',
            'city' => 'Bangalore',
            'state' => 'Karnataka',
            'pincode' => '560001',
            'amenities' => ['WiFi'],
            'status' => 'approved',
        ]);

        // Regular user cannot delete room (even if owner) -> 403 Forbidden
        $userDeleteResponse = $this->deleteJson('/api/rooms/' . $room->id, [], [
            'Authorization' => 'Bearer ' . $ownerToken,
        ]);
        $userDeleteResponse->assertStatus(403);
        $this->assertDatabaseHas('rooms', ['id' => $room->id]);

        // Admin can delete room -> 200 OK
        $adminDeleteResponse = $this->deleteJson('/api/rooms/' . $room->id, [], [
            'Authorization' => 'Bearer ' . $adminToken,
        ]);
        $adminDeleteResponse->assertStatus(200)
                            ->assertJsonFragment(['message' => 'Room deleted successfully']);
        $this->assertDatabaseMissing('rooms', ['id' => $room->id]);

        // Deleting nonexistent room returns 404
        $notFoundResponse = $this->deleteJson('/api/rooms/999999', [], [
            'Authorization' => 'Bearer ' . $adminToken,
        ]);
        $notFoundResponse->assertStatus(404);
    }

    public function test_admin_permanent_user_account_deletion_flow()
    {
        $admin = User::create([
            'name' => 'Admin Deleting User',
            'email' => 'admindeleteuser@example.com',
            'phone' => '9777777777',
            'role' => 'admin',
            'is_verified' => true,
        ]);
        $adminToken = JwtService::signToken($admin);

        $regularUser = User::create([
            'name' => 'Regular User To Delete',
            'email' => 'regulartodelete@example.com',
            'phone' => '9888888888',
            'role' => 'user',
            'google_id' => 'google_sub_to_delete_123',
            'is_verified' => true,
        ]);
        $userToken = JwtService::signToken($regularUser);
        $userId = $regularUser->id;

        // User has a room
        $userRoom = Room::create([
            'owner_id' => $userId,
            'title' => 'Deleted User Room',
            'description' => 'Should be removed on user delete',
            'price' => 1000.00,
            'pricing_type' => 'night',
            'city' => 'Kolkata',
            'state' => 'West Bengal',
            'pincode' => '700001',
            'amenities' => ['AC'],
            'status' => 'approved',
        ]);

        // Verify user can access protected endpoint before deletion
        $beforeRes = $this->getJson('/api/rooms/my/listings', [
            'Authorization' => 'Bearer ' . $userToken,
        ]);
        $beforeRes->assertStatus(200);

        // Admin permanently deletes user
        $deleteRes = $this->deleteJson('/api/admin/users/' . $userId, [], [
            'Authorization' => 'Bearer ' . $adminToken,
        ]);
        $deleteRes->assertStatus(200)
                  ->assertJsonFragment(['message' => 'User account and associated records deleted permanently']);

        // Database records removed
        $this->assertDatabaseMissing('users', ['id' => $userId]);
        $this->assertDatabaseMissing('rooms', ['id' => $userRoom->id]);

        // Old token cannot access protected endpoints
        $afterRes = $this->getJson('/api/rooms/my/listings', [
            'Authorization' => 'Bearer ' . $userToken,
        ]);
        $afterRes->assertStatus(401);

        // Re-registration with the same email creates a NEW account with a NEW ID
        $newRegToken = JwtService::signRegistrationToken([
            'authType' => 'google',
            'google_id' => 'google_sub_to_delete_123',
            'email' => 'regulartodelete@example.com',
            'name' => 'New Re-registered User',
        ]);
        $reRegRes = $this->postJson('/api/auth/register', [
            'registrationToken' => $newRegToken,
            'name' => 'New Re-registered User',
            'phone' => '9888888889',
        ]);
        $reRegRes->assertStatus(201);
        $newUserId = $reRegRes->json('user.id');
        $this->assertNotEquals($userId, $newUserId);
    }

    public function test_admin_cannot_delete_admin_or_self_and_regular_user_cannot_delete()
    {
        $admin1 = User::create([
            'name' => 'Admin One',
            'email' => 'adminone@example.com',
            'phone' => '9991111111',
            'role' => 'admin',
            'is_verified' => true,
        ]);
        $admin1Token = JwtService::signToken($admin1);

        $admin2 = User::create([
            'name' => 'Admin Two',
            'email' => 'admintwo@example.com',
            'phone' => '9992222222',
            'role' => 'admin',
            'is_verified' => true,
        ]);

        $regularUser = User::create([
            'name' => 'Regular User Trying To Delete',
            'email' => 'regularattacker@example.com',
            'phone' => '9993333333',
            'role' => 'user',
            'is_verified' => true,
        ]);
        $regularUserToken = JwtService::signToken($regularUser);

        // 1. Admin cannot delete another admin -> 403
        $deleteAdminRes = $this->deleteJson('/api/admin/users/' . $admin2->id, [], [
            'Authorization' => 'Bearer ' . $admin1Token,
        ]);
        $deleteAdminRes->assertStatus(403)
                       ->assertJsonFragment(['message' => 'Cannot delete an administrator account']);
        $this->assertDatabaseHas('users', ['id' => $admin2->id]);

        // 2. Admin cannot delete self -> 400
        $deleteSelfRes = $this->deleteJson('/api/admin/users/' . $admin1->id, [], [
            'Authorization' => 'Bearer ' . $admin1Token,
        ]);
        $deleteSelfRes->assertStatus(400)
                      ->assertJsonFragment(['message' => 'Administrators cannot delete their own account']);
        $this->assertDatabaseHas('users', ['id' => $admin1->id]);

        // 3. Regular user cannot delete user -> 403 Forbidden
        $regularDeleteRes = $this->deleteJson('/api/admin/users/' . $regularUser->id, [], [
            'Authorization' => 'Bearer ' . $regularUserToken,
        ]);
        $regularDeleteRes->assertStatus(403);
    }
}
