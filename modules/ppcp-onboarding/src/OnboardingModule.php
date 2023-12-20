<?php
/**
 * The onboarding module.
 *
 * @package WooCommerce\PayPalCommerce\Onboarding
 */

declare(strict_types=1);

namespace WooCommerce\PayPalCommerce\Onboarding;

use WooCommerce\PayPalCommerce\Onboarding\Endpoint\UpdateSignupLinksEndpoint;
use WooCommerce\PayPalCommerce\Onboarding\Assets\OnboardingAssets;
use WooCommerce\PayPalCommerce\Onboarding\Endpoint\LoginSellerEndpoint;
use WooCommerce\PayPalCommerce\Onboarding\Render\OnboardingRenderer;
use Inpsyde\Modularity\Module\ExecutableModule;
use Inpsyde\Modularity\Module\ExtendingModule;
use Inpsyde\Modularity\Module\ModuleClassNameIdTrait;
use Inpsyde\Modularity\Module\ServiceModule;
use Psr\Container\ContainerInterface;

/**
 * Class OnboardingModule
 */
class OnboardingModule implements ServiceModule, ExtendingModule, ExecutableModule {
	use ModuleClassNameIdTrait;

	/**
	 * {@inheritDoc}
	 */
	public function services(): array {
		return require __DIR__ . '/../services.php';
	}

	/**
	 * {@inheritDoc}
	 */
	public function extensions(): array {
		return require __DIR__ . '/../extensions.php';
	}

	/**
	 * {@inheritDoc}
	 */
	public function run( ContainerInterface $c ): bool {

		$asset_loader = $c->get( 'onboarding.assets' );
		/**
		 * The OnboardingAssets.
		 *
		 * @var OnboardingAssets $asset_loader
		 */
		add_action(
			'admin_enqueue_scripts',
			array(
				$asset_loader,
				'register',
			)
		);
		add_action(
			'woocommerce_settings_checkout',
			array(
				$asset_loader,
				'enqueue',
			)
		);

		add_filter(
			'woocommerce_form_field',
			static function ( $field, $key, $config ) use ( $c ) {
				if ( 'ppcp_onboarding' !== $config['type'] ) {
					return $field;
				}

				$renderer = $c->get( 'onboarding.render' );
				assert( $renderer instanceof OnboardingRenderer );

				$is_production = 'production' === $config['env'];
				$products      = $config['products'];

				ob_start();
				$renderer->render( $is_production, $products );
				$content = ob_get_contents();
				ob_end_clean();
				return $content;
			},
			10,
			3
		);

		add_action(
			'wc_ajax_' . LoginSellerEndpoint::ENDPOINT,
			static function () use ( $c ) {
				$endpoint = $c->get( 'onboarding.endpoint.login-seller' );

				/**
				 * The LoginSellerEndpoint.
				 *
				 * @var LoginSellerEndpoint $endpoint
				 */
				$endpoint->handle_request();
			}
		);

		add_action(
			'wc_ajax_' . UpdateSignupLinksEndpoint::ENDPOINT,
			static function () use ( $c ) {
				$endpoint = $c->get( 'onboarding.endpoint.pui' );
				$endpoint->handle_request();
			}
		);

		// Initialize REST routes at the appropriate time.
		$rest_controller = $c->get( 'onboarding.rest' );
		add_action( 'rest_api_init', array( $rest_controller, 'register_routes' ) );

		return true;
	}
}
