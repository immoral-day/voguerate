<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ReviewReport;
use App\Models\UserReport;
use Illuminate\Http\JsonResponse;

class ReportController extends Controller
{
    public function reviewReports(): JsonResponse
    {
        $reports = ReviewReport::with([
            'review.user',
            'review.clothingItem',
            'reporter',
        ])->latest()->get();

        return response()->json($reports);
    }

    public function userReports(): JsonResponse
    {
        $reports = UserReport::with([
            'reportedUser',
            'reporter',
        ])->latest()->get();

        return response()->json($reports);
    }

    public function destroyReviewReport(ReviewReport $report): JsonResponse
    {
        $report->delete();
        return response()->json(null, 204);
    }

    public function destroyUserReport(UserReport $report): JsonResponse
    {
        $report->delete();
        return response()->json(null, 204);
    }
}
