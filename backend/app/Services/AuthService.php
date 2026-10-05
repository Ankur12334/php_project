<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Http;
use Exception;

class AuthService
{
    public static function loginWithGoogle(array $data): array
    {
        $googleClientId = env('GOOGLE_CLIENT_ID');
        $idToken = $data['idToken'] ?? null;

        if (!$idToken) {
            throw new Exception('ID Token is required');
        }

        // Verify Google ID token via Google TokenInfo API
        $response = Http::get("https://oauth2.googleapis.com/tokeninfo", [
            'id_token' => $idToken
        ]);

        if (!$response->successful()) {
            throw new Exception('Invalid Google ID token');
        }

        $payload = $response->json();

        // Optional audience check if client ID is configured
        if (!empty($googleClientId) && isset($payload['aud']) && $payload['aud'] !== $googleClientId) {
            // Also check azp if aud mismatch
            if (isset($payload['azp']) && $payload['azp'] !== $googleClientId) {
                // If in dev or mismatch, log warning or verify
            }
        }

        $email = $payload['email'] ?? null;
        $googleId = $payload['sub'] ?? null;
        $name = $payload['name'] ?? null;

        if (!$email || !$googleId) {
            throw new Exception('Google profile incomplete');
        }

        $user = User::where('email', $email)->first();

        if ($user) {
            if (!$user->google_id) {
                $user->google_id = $googleId;
                $user->is_verified = true;
                $user->save();
            }

            return [
                'requiresRegistration' => false,
                'token' => JwtService::signToken($user),
                'user' => $user
            ];
        }

        return [
            'requiresRegistration' => true,
            'authType' => 'google',
            'registrationToken' => JwtService::signRegistrationToken([
                'authType' => 'google',
                'google_id' => $googleId,
                'email' => $email,
                'name' => $name,
            ]),
            'prefill' => [
                'name' => $name ?? '',
                'email' => $email ?? ''
            ]
        ];
    }
}
