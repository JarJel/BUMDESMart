<?php

namespace App\Helpers;

class HaversineHelper
{
    public static function distanceKm(float $lat1, float $lng1, float $lat2, float $lng2): float
    {
        $earthRadius = 6371;

        $dLat = deg2rad($lat2 - $lat1);
        $dLng = deg2rad($lng2 - $lng1);

        $a = sin($dLat / 2) ** 2
            + cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * sin($dLng / 2) ** 2;

        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return $earthRadius * $c;
    }

    public static function shippingCost(float $distanceKm, string $vehicleType = 'motor'): int
    {
        $baseCost = 5000;
        if ($distanceKm <= 1) return $baseCost;

        $perKm = match ($vehicleType) {
            'pickup_box', 'pickup_bak' => 3500,
            'mobil'                    => 3000,
            default                    => 2000, // motor
        };
        return $baseCost + (int) round(($distanceKm - 1) * $perKm);
    }
}
