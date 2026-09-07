<?php

return [
    'enabled' => env('ELASTICSEARCH_ENABLED', true),
    'hosts' => explode(',', env('ELASTICSEARCH_HOSTS', 'http://localhost:9200')),
    'index_prefix' => env('ELASTICSEARCH_INDEX_PREFIX', 'bumdesmart_'),
    'username' => env('ELASTICSEARCH_USERNAME', null),
    'password' => env('ELASTICSEARCH_PASSWORD', null),
    'cloud_id' => env('ELASTICSEARCH_CLOUD_ID', null),
    'api_key'  => env('ELASTICSEARCH_API_KEY', null),
];
