<?php

declare(strict_types=1);

namespace OCA\MobileInstaller\Controller;

use OCA\MobileInstaller\AppInfo\Application;
use OCP\AppFramework\Controller;
use OCP\AppFramework\Http;
use OCP\AppFramework\Http\Attribute\NoAdminRequired;
use OCP\AppFramework\Http\JSONResponse;
use OCP\IConfig;
use OCP\IDBConnection;
use OCP\IRequest;
use OCP\IUserSession;

/**
 * Recebe, de cada participante da chamada, trechos do áudio da PRÓPRIA voz (para saber
 * sempre quem falou) e sinais de presença. A transcrição, o resumo e o mapa mental são
 * feitos depois por /opt/app/app-transcricoes.py (cron).
 */
class TranscricaoController extends Controller {
	private const MAX_BYTES = 5 * 1024 * 1024;

	public function __construct(
		IRequest $request,
		private IUserSession $userSession,
		private IDBConnection $db,
		private IConfig $config,
	) {
		parent::__construct(Application::APP_ID, $request);
	}

	#[NoAdminRequired]
	public function audio(string $token = '', int $inicio = 0, int $agora = 0, int $duracao = 0): JSONResponse {
		$uid = $this->usuarioDaConversa($token);
		if ($uid === null) {
			return new JSONResponse(['ok' => false], Http::STATUS_FORBIDDEN);
		}
		$arq = $this->request->getUploadedFile('audio');
		$tipo = strtolower((string)($arq['type'] ?? ''));
		$ext = str_contains($tipo, 'webm') ? 'webm' : (str_contains($tipo, 'mp4') ? 'm4a' : (str_contains($tipo, 'ogg') ? 'ogg' : ''));
		if (!is_array($arq) || ($arq['error'] ?? 1) !== UPLOAD_ERR_OK || $ext === ''
			|| $arq['size'] < 500 || $arq['size'] > self::MAX_BYTES || $inicio <= 0 || $agora <= 0) {
			return new JSONResponse(['ok' => false], Http::STATUS_BAD_REQUEST);
		}

		// Corrige diferença entre o relógio do aparelho e o do servidor.
		$inicioServidor = $inicio + ((int)(microtime(true) * 1000) - $agora);
		$dir = $this->base() . '/' . $token . '/audio/' . $uid;
		if (!is_dir($dir) && !mkdir($dir, 0750, true) && !is_dir($dir)) {
			return new JSONResponse(['ok' => false], Http::STATUS_INTERNAL_SERVER_ERROR);
		}
		$destino = sprintf('%s/%013d-%s.%s', $dir, $inicioServidor, bin2hex(random_bytes(3)), $ext);
		if (!move_uploaded_file($arq['tmp_name'], $destino)) {
			return new JSONResponse(['ok' => false], Http::STATUS_INTERNAL_SERVER_ERROR);
		}
		return new JSONResponse(['ok' => true]);
	}

	#[NoAdminRequired]
	public function presenca(string $token = '', string $estado = ''): JSONResponse {
		$uid = $this->usuarioDaConversa($token);
		if ($uid === null || !preg_match('/^[a-z-]{1,20}$/', $estado)) {
			return new JSONResponse(['ok' => false], Http::STATUS_FORBIDDEN);
		}
		$dir = $this->base() . '/' . $token . '/presenca';
		if (!is_dir($dir) && !mkdir($dir, 0750, true) && !is_dir($dir)) {
			return new JSONResponse(['ok' => false], Http::STATUS_INTERNAL_SERVER_ERROR);
		}
		$linha = json_encode(['t' => time(), 'uid' => $uid, 'estado' => $estado]);
		file_put_contents($dir . '/' . $uid . '.jsonl', $linha . "\n", FILE_APPEND | LOCK_EX);
		return new JSONResponse(['ok' => true]);
	}

	private function base(): string {
		return rtrim($this->config->getSystemValue('datadirectory', ''), '/') . '/exemplo_transcricoes';
	}

	/** Devolve o usuário logado se ele participa da conversa, senão null. */
	private function usuarioDaConversa(string $token): ?string {
		$user = $this->userSession->getUser();
		if ($user === null || !preg_match('/^[a-z0-9]{4,32}$/', $token)) {
			return null;
		}
		$q = $this->db->getQueryBuilder();
		$q->select('a.id')
			->from('talk_attendees', 'a')
			->join('a', 'talk_rooms', 'r', $q->expr()->eq('a.room_id', 'r.id'))
			->where($q->expr()->eq('r.token', $q->createNamedParameter($token)))
			->andWhere($q->expr()->eq('a.actor_type', $q->createNamedParameter('users')))
			->andWhere($q->expr()->eq('a.actor_id', $q->createNamedParameter($user->getUID())))
			->setMaxResults(1);
		return $q->executeQuery()->fetchOne() === false ? null : $user->getUID();
	}
}
