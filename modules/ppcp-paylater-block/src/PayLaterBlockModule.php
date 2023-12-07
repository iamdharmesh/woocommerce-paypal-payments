<?php
/**
 * The Pay Later block module.
 *
 * @package WooCommerce\PayPalCommerce\PayLaterBlock
 */

declare(strict_types=1);

namespace WooCommerce\PayPalCommerce\PayLaterBlock;

use WooCommerce\PayPalCommerce\Button\Endpoint\CartScriptParamsEndpoint;
use WooCommerce\PayPalCommerce\Vendor\Dhii\Container\ServiceProvider;
use WooCommerce\PayPalCommerce\Vendor\Dhii\Modular\Module\ModuleInterface;
use WooCommerce\PayPalCommerce\Vendor\Interop\Container\ServiceProviderInterface;
use WooCommerce\PayPalCommerce\Vendor\Psr\Container\ContainerInterface;

/**
 * Class PayLaterBlockModule
 */
class PayLaterBlockModule implements ModuleInterface {
	/**
	 * {@inheritDoc}
	 */
	public function setup(): ServiceProviderInterface {
		return new ServiceProvider(
			require __DIR__ . '/../services.php',
			require __DIR__ . '/../extensions.php'
		);
	}

	/**
	 * {@inheritDoc}
	 */
	public function run( ContainerInterface $c ): void {
		add_action(
			'init',
			function () use ( $c ): void {
				$script_handle = 'ppcp-paylater-block';
				wp_register_script(
					$script_handle,
					$c->get( 'paylater-block.url' ) . '/assets/js/paylater-block.js',
					array(),
					$c->get( 'ppcp.asset-version' ),
					true
				);
				wp_localize_script(
					$script_handle,
					'PcpPayLaterBlock',
					array(
						'ajax' => array(
							'cart_script_params' => array(
								'endpoint' => \WC_AJAX::get_endpoint( CartScriptParamsEndpoint::ENDPOINT ),
							),
						),
					)
				);

				/**
				 * Cannot return false for this path.
				 *
				 * @psalm-suppress PossiblyFalseArgument
				 */
				register_block_type( dirname( realpath( __FILE__ ), 2 ) );
			}
		);
	}

	/**
	 * Returns the key for the module.
	 *
	 * @return string|void
	 */
	public function getKey() {
	}
}
