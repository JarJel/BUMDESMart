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

    public static function shippingCost(float $distanceKm): int
    {
        $baseCost    = (int) \App\Models\PlatformSetting::getValue('shipping_base_cost', 2000);
        $costPerKm   = (int) \App\Models\PlatformSetting::getValue('shipping_cost_per_km', 1500);

        return $baseCost + (int) round($distanceKm * $costPerKm);
    }
}
