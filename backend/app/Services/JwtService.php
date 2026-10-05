<?php

namespace App\Services;

use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Exception;

class JwtService
{
    private static function getSecret(): string
    {
        $secret = env('JWT_SECRET', 'supersecretjwt_roomfinder_app_jwt_secret_key');
        if (strlen($secret) < 32) {
            $secret = str_pad($secret, 32, '0');
        }
        return $secret;
    }

    public static function signToken($user): string
    {
        $payload = [
            'id' => $user->id,
            'role' => $user->role,
            'iat' => time(),
            'exp' => time() + (7 * 24 * 60 * 60), // 7 days
        ];

        return JWT::encode($payload, self::getSecret(), 'HS256');
    }

    public static function signRegistrationToken(array $payload): string
    {
        $data = array_merge($payload, [
            'flow' => 'registration',
            'iat' => time(),
            'exp' => time() + (15 * 60), // 15 mins
        ]);

        return JWT::encode($data, self::getSecret(), 'HS256');
    }

    public static function verifyRegistrationToken(string $token): array
    {
        $decoded = (array) JWT::decode($token, new Key(self::getSecret(), 'HS256'));
        if (($decoded['flow'] ?? null) !== 'registration') {
            throw new Exception('Invalid registration token');
        }

        return $decoded;
    }

    public static function signPhoneVerificationToken(array $payload): string
    {
        $data = array_merge($payload, [
            'flow' => 'phone_verification',
            'iat' => time(),
            'exp' => time() + (15 * 60), // 15 mins
        ]);

        return JWT::encode($data, self::getSecret(), 'HS256');
    }

    public static function verifyPhoneVerificationToken(string $token): array
    {
        $decoded = (array) JWT::decode($token, new Key(self::getSecret(), 'HS256'));
        if (($decoded['flow'] ?? null) !== 'phone_verification') {
            throw new Exception('Invalid phone verification token');
        }

        return $decoded;
    }

    public static function decodeToken(string $token): ?array
    {
        try {
            return (array) JWT::decode($token, new Key(self::getSecret(), 'HS256'));
        } catch (Exception $e) {
            return null;
        }
    }
}
