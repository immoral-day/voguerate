<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        RateLimiter::for('api', function (Request $request) {
            return Limit::perMinute(120)->by($this->rateKey($request));
        });

        RateLimiter::for('auth', function (Request $request) {
            $login = (string) $request->input('username', $request->input('email', 'guest'));

            return Limit::perMinute(5)->by($request->ip() . '|' . strtolower($login));
        });

        RateLimiter::for('writes', function (Request $request) {
            return Limit::perMinute(30)->by($this->rateKey($request));
        });

        RateLimiter::for('reviews', function (Request $request) {
            return Limit::perMinute(3)->by($this->rateKey($request));
        });

        RateLimiter::for('messages', function (Request $request) {
            return Limit::perMinute(20)->by($this->rateKey($request));
        });
    }

    private function rateKey(Request $request): string
    {
        $user = $request->user();
        if ($user) {
            return 'user:' . $user->getAuthIdentifier();
        }

        return 'ip:' . (string) $request->ip();
    }
}
