<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Twilio\Rest\Client;
use Exception;

class OtpService
{
    private static function canUseTwilio(): bool
    {
        return !empty(env('TWILIO_ACCOUNT_SID')) &&
            !empty(env('TWILIO_AUTH_TOKEN')) &&
            !empty(env('TWILIO_VERIFY_SERVICE_SID'));
    }

    public static function sendOtp(string $phone): array
    {
        $accountSid = env('TWILIO_ACCOUNT_SID');
        $authToken = env('TWILIO_AUTH_TOKEN');
        $verifyServiceSid = env('TWILIO_VERIFY_SERVICE_SID');
        $isProd = env('APP_ENV') === 'production';

        if (self::canUseTwilio()) {
            try {
                $twilio = new Client($accountSid, $authToken);
                $twilio->verify->v2->services($verifyServiceSid)
                    ->verifications
                    ->create($phone, 'sms');

                Cache::forget('twilio_fallback_' . $phone);
                return ['success' => true];
            } catch (Exception $e) {
                if ($isProd) {
                    throw $e;
                }

                Cache::put('twilio_fallback_' . $phone, true, now()->addMinutes(15));
                Cache::put('dev_otp_' . $phone, '123456', now()->addMinutes(15));

                return [
                    'success' => true,
                    'devCode' => '123456',
                    'warning' => 'Twilio send failed. Using dev OTP fallback.'
                ];
            }
        }

        Cache::put('dev_otp_' . $phone, '123456', now()->addMinutes(15));

        return [
            'success' => true,
            'devCode' => '123456'
        ];
    }

    public static function verifyOtp(string $phone, string $code): bool
    {
        $accountSid = env('TWILIO_ACCOUNT_SID');
        $authToken = env('TWILIO_AUTH_TOKEN');
        $verifyServiceSid = env('TWILIO_VERIFY_SERVICE_SID');
        $isProd = env('APP_ENV') === 'production';
        $isFallback = Cache::get('twilio_fallback_' . $phone, false);

        if (self::canUseTwilio() && !$isFallback) {
            try {
                $twilio = new Client($accountSid, $authToken);
                $result = $twilio->verify->v2->services($verifyServiceSid)
                    ->verificationChecks
                    ->create([
                        'to' => $phone,
                        'code' => $code
                    ]);

                return $result->status === 'approved';
            } catch (Exception $e) {
                if ($isProd) {
                    throw $e;
                }

                $stored = Cache::get('dev_otp_' . $phone, '123456');
                return $stored === $code;
            }
        }

        $stored = Cache::get('dev_otp_' . $phone, '123456');
        return $stored === $code;
    }
}
