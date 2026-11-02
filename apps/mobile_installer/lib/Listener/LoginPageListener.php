<?php

declare(strict_types=1);

namespace OCA\MobileInstaller\Listener;

use OCA\MobileInstaller\AppInfo\Application;
use OCP\AppFramework\Http\Events\BeforeLoginTemplateRenderedEvent;
use OCP\EventDispatcher\Event;
use OCP\EventDispatcher\IEventListener;
use OCP\Util;

/**
 * Adiciona o botão "Instalar o app Empresa Exemplo Chat" na tela de login.
 *
 * @template-implements IEventListener<BeforeLoginTemplateRenderedEvent>
 */
class LoginPageListener implements IEventListener {
	public function handle(Event $event): void {
		if (!$event instanceof BeforeLoginTemplateRenderedEvent) {
			return;
		}
		Util::addStyle(Application::APP_ID, 'instalar');
		Util::addScript(Application::APP_ID, 'instalar');
	}
}
