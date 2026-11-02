<?php

declare(strict_types=1);

namespace OCA\MobileInstaller\Listener;

use OCA\MobileInstaller\AppInfo\Application;
use OCP\AppFramework\Http\Events\BeforeTemplateRenderedEvent;
use OCP\EventDispatcher\Event;
use OCP\EventDispatcher\IEventListener;
use OCP\Util;

/**
 * Carrega o script de avisos (som, título piscando e badge) para quem está logado.
 *
 * @template-implements IEventListener<BeforeTemplateRenderedEvent>
 */
class AlertasListener implements IEventListener {
	public function handle(Event $event): void {
		if (!$event instanceof BeforeTemplateRenderedEvent || !$event->isLoggedIn()) {
			return;
		}
		Util::addStyle(Application::APP_ID, 'inicio');
		Util::addScript(Application::APP_ID, 'alertas');
		Util::addScript(Application::APP_ID, 'inicio');
		Util::addScript(Application::APP_ID, 'transcrever');
		Util::addScript(Application::APP_ID, 'novamensagem');
	}
}
