<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Services\JwtService;
use App\Models\User;
use Symfony\Component\HttpFoundation\Response;

class AuthenticateJwt
{
    public function handle(Request $request, Closure $next, bool $optional = false): Response
    {
        $authHeader = $request->header('Authorization');

        if (!$authHeader || !str_starts_with($authHeader, 'Bearer ')) {
            if ($optional) {
                return $next($request);
            }
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $token = substr($authHeader, 7);
        $payload = JwtService::decodeToken($token);

        if (!$payload || !isset($payload['id'])) {
            return response()->json(['message' => 'Invalid or expired token'], 401);
        }

        $user = User::find($payload['id']);
        if (!$user) {
            return response()->json(['message' => 'Invalid token'], 401);
        }

        $request->setUserResolver(function () use ($user) {
            return $user;
        });
        $request->attributes->set('user', $user);
        auth()->setUser($user);

        return $next($request);
    }
}
