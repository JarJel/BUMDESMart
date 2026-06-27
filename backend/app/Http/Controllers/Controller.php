<?php

namespace App\Http\Controllers;

use OpenApi\Attributes as OA;

#[OA\Info(
    title: "BUMDESMart API",
    version: "1.0.0",
    description: "Dokumentasi API BUMDESMart - Platform Digital UMKM Desa Lengkong"
)]
#[OA\Server(
    url: "http://localhost:8000/api/v1",
    description: "BUMDESMart Local API Server"
)]
#[OA\SecurityScheme(
    securityScheme: "sanctum",
    type: "http",
    scheme: "bearer",
    bearerFormat: "JWT",
    description: "Masukkan Token Bearer Sanctum Anda"
)]
abstract class Controller
{
    //
}
