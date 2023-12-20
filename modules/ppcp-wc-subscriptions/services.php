<?php
/**
 * The services
 *
 * @package WooCommerce\PayPalCommerce\WcSubscriptions
 */

declare(strict_types=1);

namespace WooCommerce\PayPalCommerce\WcSubscriptions;

use WooCommerce\PayPalCommerce\PayPalSubscriptions\DeactivatePlanEndpoint;
use WooCommerce\PayPalCommerce\PayPalSubscriptions\SubscriptionsApiHandler;
use WooCommerce\PayPalCommerce\Vaulting\PaymentTokenRepository;
use Psr\Container\ContainerInterface;
use WooCommerce\PayPalCommerce\WcSubscriptions\Helper\SubscriptionHelper;

return array(
	'wc-subscriptions.helper'                   => static function ( ContainerInterface $container ): SubscriptionHelper {
		return new SubscriptionHelper( $container->get( 'wcgateway.settings' ) );
	},
	'wc-subscriptions.renewal-handler'          => static function ( ContainerInterface $container ): RenewalHandler {
		$logger                = $container->get( 'woocommerce.logger.woocommerce' );
		$repository            = $container->get( 'vaulting.repository.payment-token' );
		$endpoint              = $container->get( 'api.endpoint.order' );
		$purchase_unit_factory = $container->get( 'api.factory.purchase-unit' );
		$payer_factory         = $container->get( 'api.factory.payer' );
		$environment           = $container->get( 'onboarding.environment' );
		$settings                      = $container->get( 'wcgateway.settings' );
		$authorized_payments_processor = $container->get( 'wcgateway.processor.authorized-payments' );
		return new RenewalHandler(
			$logger,
			$repository,
			$endpoint,
			$purchase_unit_factory,
			$container->get( 'api.factory.shipping-preference' ),
			$payer_factory,
			$environment,
			$settings,
			$authorized_payments_processor
		);
	},
	'wc-subscriptions.repository.payment-token' => static function ( ContainerInterface $container ): PaymentTokenRepository {
		$factory  = $container->get( 'api.factory.payment-token' );
		$endpoint = $container->get( 'api.endpoint.payment-token' );
		return new PaymentTokenRepository( $factory, $endpoint );
	},
);
