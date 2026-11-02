<?php

declare(strict_types=1);

namespace OCA\MobileInstaller\Controller;

use OCA\MobileInstaller\AppInfo\Application;
use OCP\AppFramework\Controller;
use OCP\AppFramework\Http\Attribute\NoAdminRequired;
use OCP\AppFramework\Http\JSONResponse;
use OCP\IConfig;
use OCP\IGroupManager;
use OCP\INavigationManager;
use OCP\IRequest;
use OCP\IURLGenerator;
use OCP\IUserSession;

/**
 * Atalhos dos aplicativos para a tela inicial do Conversas: os mesmos do menu de
 * aplicativos, na ordem de cada pessoa, e "Loja de aplicativos" só para administrador.
 */
class InicioController extends Controller {
	public function __construct(
		IRequest $request,
		private IUserSession $userSession,
		private INavigationManager $navigation,
		private IConfig $config,
		private IGroupManager $groupManager,
		private IURLGenerator $urlGenerator,
	) {
		parent::__construct(Application::APP_ID, $request);
	}

	#[NoAdminRequired]
	public function apps(): JSONResponse {
		$user = $this->userSession->getUser();
		if ($user === null) {
			return new JSONResponse([]);
		}
		$ordem = json_decode($this->config->getUserValue($user->getUID(), 'core', 'apporder', '{}'), true) ?: [];
		$lista = [];
		foreach ($this->navigation->getAll('link') as $id => $e) {
			$lista[] = [
				'id' => (string)$id,
				'nome' => (string)($e['name'] ?? $id),
				'href' => (string)($e['href'] ?? ''),
				'icone' => (string)($e['icon'] ?? ''),
				'_ordem' => (int)($ordem[$id]['order'] ?? (1000 + (int)($e['order'] ?? 0))),
			];
		}
		usort($lista, fn ($a, $b) => $a['_ordem'] <=> $b['_ordem']);
		foreach ($lista as &$item) {
			unset($item['_ordem']);
		}
		unset($item);
		if ($this->groupManager->isAdmin($user->getUID())) {
			$lista[] = [
				'id' => 'appstore',
				'nome' => 'Loja de aplicativos',
				'href' => $this->urlGenerator->linkToRoute('settings.AppSettings.viewApps'),
				'icone' => $this->urlGenerator->imagePath('core', 'actions/add.svg'),
			];
		}
		return new JSONResponse($lista);
	}
}
