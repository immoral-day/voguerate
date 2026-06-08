<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ApiResponseTiming
{
    public function handle(Request $request, Closure $next): Response
    {
        $startedAt = hrtime(true);
        $response = $next($request);
        $durationMs = (hrtime(true) - $startedAt) / 1_000_000;
        $formatted = number_format($durationMs, 1, '.', '');

        $response->headers->set('Server-Timing', "app;dur={$formatted}");
        $response->headers->set('X-Response-Time', "{$formatted}ms");

        return $response;
    }
}
