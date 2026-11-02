<?php

declare(strict_types=1);

return [
	'routes' => [
		['name' => 'transcricao#audio', 'url' => '/api/audio', 'verb' => 'POST'],
		['name' => 'inicio#apps', 'url' => '/api/apps', 'verb' => 'GET'],
		['name' => 'colegas#lista', 'url' => '/api/colegas', 'verb' => 'GET'],
		['name' => 'transcricao#presenca', 'url' => '/api/presenca', 'verb' => 'POST'],
	],
];
