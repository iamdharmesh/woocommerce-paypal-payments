<?php
/**
 * The webhook module.
 *
 * @package Inpsyde\PayPalCommerce\Webhooks
 */

declare(strict_types=1);

namespace Inpsyde\PayPalCommerce\Webhooks;

use Dhii\Modular\Module\ModuleInterface;

return static function (): ModuleInterface {
	return new WebhookModule();
};
