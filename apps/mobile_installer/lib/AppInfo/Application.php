<?php

declare(strict_types=1);

namespace OCA\MobileInstaller\AppInfo;

use OCA\MobileInstaller\Listener\AlertasListener;
use OCA\MobileInstaller\Listener\LoginPageListener;
use OCP\AppFramework\App;
use OCP\AppFramework\Bootstrap\IBootContext;
use OCP\AppFramework\Bootstrap\IBootstrap;
use OCP\AppFramework\Bootstrap\IRegistrationContext;
use OCP\AppFramework\Http\Events\BeforeLoginTemplateRenderedEvent;
use OCP\AppFramework\Http\Events\BeforeTemplateRenderedEvent;

class Application extends App implements IBootstrap {
	public const APP_ID = 'mobile_installer';

	public function __construct() {
		parent::__construct(self::APP_ID);
	}

	public function register(IRegistrationContext $context): void {
		$context->registerEventListener(BeforeLoginTemplateRenderedEvent::class, LoginPageListener::class);
		$context->registerEventListener(BeforeTemplateRenderedEvent::class, AlertasListener::class);
	}

	public function boot(IBootContext $context): void {
	}
}
