<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ReviewReport;
use App\Models\UserReport;
use App\Support\ApiAuth;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    public function reviewReports(Request $request): JsonResponse
    {
        if (!ApiAuth::isAdmin($request->user())) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        $reports = ReviewReport::with([
            'review.user',
            'review.clothingItem',
            'reporter',
        ])->latest()->get();

        return response()->json($reports);
    }

    public function userReports(Request $request): JsonResponse
    {
        if (!ApiAuth::isAdmin($request->user())) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        $reports = UserReport::with([
            'reportedUser',
            'reporter',
        ])->latest()->get();

        return response()->json($reports);
    }

    public function destroyReviewReport(Request $request, ReviewReport $report): JsonResponse
    {
        if (!ApiAuth::isAdmin($request->user())) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        $report->delete();
        return response()->json(null, 204);
    }

    public function destroyUserReport(Request $request, UserReport $report): JsonResponse
    {
        if (!ApiAuth::isAdmin($request->user())) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        $report->delete();
        return response()->json(null, 204);
    }
}
