<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use App\Models\User;
use App\Services\AuthService;
use App\Services\JwtService;
use App\Services\OtpService;
use Exception;

class AuthController extends Controller
{
    private function normalizeIndianPhone(?string $phone): string
    {
        $digits = preg_replace('/\D/', '', (string) $phone);
        if (strlen($digits) === 12 && str_starts_with($digits, '91')) {
            return substr($digits, 2);
        }
        if (strlen($digits) === 10) {
            return $digits;
        }
        return '';
    }

    private function buildPhoneVariants(string $normalized): array
    {
        return [$normalized, "+91{$normalized}"];
    }

    public function googleAuth(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'idToken' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()->all()
            ], 400);
        }

        try {
            $result = AuthService::loginWithGoogle($request->all());
            return response()->json($result);
        } catch (Exception $e) {
            return response()->json(['message' => $e->getMessage()], 400);
        }
    }

    public function sendOtp(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'phone' => ['required', 'regex:/^[6-9]\d{9}$/'],
        ], [
            'phone.regex' => 'Phone must be a valid 10-digit Indian mobile number',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()->all()
            ], 400);
        }

        $normalizedPhone = $this->normalizeIndianPhone($request->phone);
        $phoneVariants = $this->buildPhoneVariants($normalizedPhone);

        $existingUser = User::whereIn('phone', $phoneVariants)->first();
        $otpPhone = "+91{$normalizedPhone}";
        $result = OtpService::sendOtp($otpPhone);

        $response = [
            'message' => 'OTP sent successfully',
            'userExists' => (bool) $existingUser,
        ];

        if (env('APP_ENV') !== 'production') {
            if (isset($result['devCode'])) $response['devCode'] = $result['devCode'];
            if (isset($result['warning'])) $response['warning'] = $result['warning'];
        }

        return response()->json($response);
    }

    public function verifyOtp(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'phone' => ['required', 'regex:/^[6-9]\d{9}$/'],
            'code' => 'required|string|min:4|max:8',
            'registrationToken' => 'nullable|string',
        ], [
            'phone.regex' => 'Phone must be a valid 10-digit Indian mobile number',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()->all()
            ], 400);
        }

        $normalizedPhone = $this->normalizeIndianPhone($request->phone);
        $code = $request->code;
        $registrationToken = $request->registrationToken;
        $otpPhone = "+91{$normalizedPhone}";

        $isValid = OtpService::verifyOtp($otpPhone, $code);

        if (!$isValid) {
            return response()->json(['message' => 'Invalid OTP'], 400);
        }

        if ($registrationToken) {
            try {
                $regPayload = JwtService::verifyRegistrationToken($registrationToken);
            } catch (Exception $err) {
                return response()->json(['message' => 'Invalid registration token'], 400);
            }

            if (($regPayload['authType'] ?? null) !== 'google') {
                return response()->json(['message' => 'OTP verification context is invalid'], 400);
            }

            $phoneVariants = $this->buildPhoneVariants($normalizedPhone);
            $existingUser = User::whereIn('phone', $phoneVariants)->first();
            if ($existingUser) {
                return response()->json([
                    'message' => 'Phone number is already registered. Please login with phone OTP.'
                ], 409);
            }

            return response()->json([
                'verified' => true,
                'phone' => $normalizedPhone,
                'phoneVerificationToken' => JwtService::signPhoneVerificationToken([
                    'authType' => 'google',
                    'google_id' => $regPayload['google_id'],
                    'phone' => $normalizedPhone
                ])
            ]);
        }

        $phoneVariants = $this->buildPhoneVariants($normalizedPhone);
        $user = User::whereIn('phone', $phoneVariants)->first();

        if ($user) {
            if (!$user->is_verified) {
                $user->is_verified = true;
                $user->save();
            }

            return response()->json([
                'requiresRegistration' => false,
                'token' => JwtService::signToken($user),
                'user' => $user
            ]);
        }

        return response()->json([
            'requiresRegistration' => true,
            'authType' => 'phone',
            'registrationToken' => JwtService::signRegistrationToken(['authType' => 'phone', 'phone' => $normalizedPhone]),
            'prefill' => ['phone' => $normalizedPhone]
        ]);
    }

    public function completeRegistration(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'registrationToken' => 'required|string',
            'name' => 'required|string|min:2',
            'email' => 'nullable|email',
            'phone' => ['nullable', 'regex:/^[6-9]\d{9}$/'],
            'phoneVerificationToken' => 'nullable|string',
        ], [
            'phone.regex' => 'Phone must be a valid 10-digit Indian mobile number',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()->all()
            ], 400);
        }

        $registrationToken = $request->registrationToken;
        $name = $request->name;
        $email = $request->email;
        $phone = $request->phone;
        $phoneVerificationToken = $request->phoneVerificationToken;

        try {
            $payload = JwtService::verifyRegistrationToken($registrationToken);
        } catch (Exception $e) {
            return response()->json(['message' => 'Invalid registration token'], 400);
        }

        $userData = [
            'name' => $name,
            'role' => 'user',
            'is_verified' => true,
        ];

        if (($payload['authType'] ?? null) === 'phone') {
            $userData['phone'] = $payload['phone'];
            if ($email) {
                $userData['email'] = $email;
            }
        }

        if (($payload['authType'] ?? null) === 'google') {
            $normalizedPhone = $this->normalizeIndianPhone($phone);
            if (!$normalizedPhone) {
                return response()->json(['message' => 'Phone number is required for Google registration'], 400);
            }

            if (!$phoneVerificationToken) {
                return response()->json(['message' => 'Please verify your phone number with OTP before registration'], 400);
            }

            try {
                $verificationPayload = JwtService::verifyPhoneVerificationToken($phoneVerificationToken);
            } catch (Exception $err) {
                return response()->json(['message' => 'Phone verification expired. Please verify OTP again.'], 400);
            }

            if (
                ($verificationPayload['authType'] ?? null) !== 'google' ||
                ($verificationPayload['google_id'] ?? null) !== ($payload['google_id'] ?? null) ||
                ($verificationPayload['phone'] ?? null) !== $normalizedPhone
            ) {
                return response()->json(['message' => 'Phone verification does not match registration details'], 400);
            }

            $userData['google_id'] = $payload['google_id'];
            $userData['email'] = $payload['email'] ?? $email ?? null;
            $userData['phone'] = $normalizedPhone;
        }

        $query = User::query();
        $conditions = false;

        if (!empty($userData['email'])) {
            $query->where('email', $userData['email']);
            $conditions = true;
        }

        if (!empty($userData['phone'])) {
            $phoneVariants = $this->buildPhoneVariants($userData['phone']);
            if ($conditions) {
                $query->orWhereIn('phone', $phoneVariants);
            } else {
                $query->whereIn('phone', $phoneVariants);
                $conditions = true;
            }
        }

        if ($conditions) {
            $existing = $query->first();
            if ($existing) {
                return response()->json(['message' => 'User already exists. Please login.'], 409);
            }
        }

        $user = User::create($userData);

        return response()->json([
            'token' => JwtService::signToken($user),
            'user' => $user
        ], 201);
    }
}
