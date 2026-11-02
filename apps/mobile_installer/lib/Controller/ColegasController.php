<?php

declare(strict_types=1);

namespace OCA\MobileInstaller\Controller;

use OCA\MobileInstaller\AppInfo\Application;
use OCP\AppFramework\Controller;
use OCP\AppFramework\Http\Attribute\NoAdminRequired;
use OCP\AppFramework\Http\JSONResponse;
use OCP\IGroupManager;
use OCP\IRequest;
use OCP\IUserSession;

/**
 * Lista os colegas (grupo "Todos") para o botão "Nova mensagem" do Conversas.
 */
class ColegasController extends Controller {
	public function __construct(
		IRequest $request,
		private IUserSession $userSession,
		private IGroupManager $groupManager,
	) {
		parent::__construct(Application::APP_ID, $request);
	}

	#[NoAdminRequired]
	public function lista(): JSONResponse {
		$eu = $this->userSession->getUser();
		$todos = $this->groupManager->get('Todos');
		if ($eu === null || $todos === null) {
			return new JSONResponse([]);
		}
		$colegas = [];
		foreach ($todos->getUsers() as $u) {
			if ($u->getUID() === $eu->getUID() || !$u->isEnabled()) {
				continue;
			}
			$setores = array_values(array_diff($this->groupManager->getUserGroupIds($u), ['Todos']));
			$colegas[] = [
				'uid' => $u->getUID(),
				'nome' => $u->getDisplayName(),
				'setor' => $setores[0] ?? '',
			];
		}
		usort($colegas, fn ($a, $b) => strcasecmp($a['nome'], $b['nome']));
		return new JSONResponse($colegas);
	}
}
