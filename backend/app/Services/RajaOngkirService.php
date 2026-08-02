<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;

class RajaOngkirService
{
    private string $apiKey;
    private string $baseUrl;

    public function __construct()
    {
        $this->apiKey  = config('services.rajaongkir.api_key');
        $this->baseUrl = config('services.rajaongkir.base_url');
    }

    // Ambil semua kota, di-cache 24 jam
    public function getCities(): array
    {
        return Cache::remember('rajaongkir_cities', 86400, function () {
            $res = Http::withHeaders(['key' => $this->apiKey])
                ->get("{$this->baseUrl}/city");
            return $res->json('rajaongkir.results') ?? [];
        });
    }

    // Cari city_id berdasarkan nama kota (fuzzy)
    public function findCityId(string $cityName): ?string
    {
        $cities = $this->getCities();
        $name   = strtolower(trim($cityName));

        foreach ($cities as $city) {
            if (str_contains(strtolower($city['city_name']), $name)) {
                return $city['city_id'];
            }
        }
        return null;
    }

    // Hitung ongkir: origin & destination adalah city_id, weight dalam gram
    public function getCost(string $originCityId, string $destinationCityId, int $weightGram, string $courier = 'jne'): array
    {
        $res = Http::withHeaders(['key' => $this->apiKey])
            ->post("{$this->baseUrl}/cost", [
                'origin'      => $originCityId,
                'destination' => $destinationCityId,
                'weight'      => max(1000, $weightGram), // min 1kg untuk starter
                'courier'     => $courier,
            ]);

        return $res->json('rajaongkir.results.0.costs') ?? [];
    }

    // Ambil semua opsi ongkir dari beberapa kurir sekaligus
    public function getAllCosts(string $originCityId, string $destinationCityId, int $weightGram): array
    {
        $couriers = ['jne', 'tiki', 'pos'];
        $results  = [];

        foreach ($couriers as $courier) {
            $costs = $this->getCost($originCityId, $destinationCityId, $weightGram, $courier);
            foreach ($costs as $cost) {
                $results[] = [
                    'courier'    => strtoupper($courier),
                    'service'    => $cost['service'] ?? '',
                    'name'       => strtoupper($courier) . ' ' . ($cost['service'] ?? ''),
                    'price'      => $cost['cost'][0]['value'] ?? 0,
                    'estimation' => ($cost['cost'][0]['etd'] ?? '?') . ' hari',
                ];
            }
        }

        // Urutkan dari termurah
        usort($results, fn($a, $b) => $a['price'] <=> $b['price']);

        return $results;
    }
}
