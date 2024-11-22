/* eslint-disable no-console */
const { test } = require( '@playwright/test' );
const qit = require( '/qitHelpers' );

test.slow(); // Make sure that entrypoint has enough time to run.

/**
 * Setup the test environment
 *
 * This is act as a Isolated setup for the PayPal Payments tests.
 */
async function setup() {
	const commands = [
		'option set woocommerce_store_address "60 29th Street"',
		'option set woocommerce_store_address_2 "#343"',
		'option set woocommerce_store_city "San Francisco"',
		'option set woocommerce_default_country "US:CA"',
		'option set woocommerce_store_postcode "94110"',
		'option set woocommerce_currency "USD"',
		'option set woocommerce_product_type "both"',
		'option set woocommerce_allow_tracking "no"',
		'option set woocommerce_coming_soon "no"',
		'theme install storefront --activate',
		'wc --user=admin tool run install_pages',
	];

	for ( const command of commands ) {
		await qit.wp( command );
	}

	console.log( 'Creating Cart and Checkout shortcode pages' );
	const blockCartRes = await qit.wp( 'option get woocommerce_cart_page_id' );
	const blockCartPageId = blockCartRes?.output;
	qit.setEnv( 'BLOCK_CART_PAGE_ID', blockCartPageId );
	const cartRes = await qit.wp(
		'post create --post_type=page --post_title="Classic Cart" --post_name="classic-cart" --post_status=publish --page_template="template-fullwidth.php" --post_content="<!-- wp:shortcode -->[woocommerce_cart]<!-- /wp:shortcode -->" --porcelain'
	);
	const cartPageId = cartRes?.output;
	qit.setEnv( 'CART_PAGE_ID', cartPageId );

	//  Create shortcode checkout page.
	const checkoutRes = await qit.wp(
		'post create --post_type=page --post_title="Classic Checkout" --post_name="classic-checkout" --post_status=publish --page_template="template-fullwidth.php" --post_content="<!-- wp:shortcode -->[woocommerce_checkout]<!-- /wp:shortcode -->" --porcelain'
	);
	const checkoutPageId = checkoutRes?.output;
	qit.setEnv( 'CHECKOUT_PAGE_ID', checkoutPageId );

	const blockCheckoutRes = await qit.wp(
		'option get woocommerce_checkout_page_id'
	);
	const blockCheckoutPageId = blockCheckoutRes?.output;
	qit.setEnv( 'BLOCK_CHECKOUT_PAGE_ID', blockCheckoutPageId );

	// Set the product id for the test
	await qit.wp(
		'wc product create --name="Simple Product" --slug="simple-product" --user=admin --regular_price=10 --porcelain'
	);

	await qit.wp(
		'wc product create --name="Free Trial" --slug="free-trial" --user=1 --regular_price=10 --type=subscription --meta_data=\'[{"key":"_subscription_price","value":"10"},{"key":"_subscription_period","value":"month"},{"key":"_subscription_period_interval","value":"1"},{"key":"_subscription_trial_length","value":"15"},{"key":"_subscription_trial_period","value":"day"}]\''
	);

	console.log( 'Setup completed.' );
}

/**
 * @param {import('@playwright/test').FullConfig} config
 */
test( 'Entrypoint', async ( { page } ) => {
	// Do Initial Setup
	await setup();

	// While we're here, let's add a consumer token for API access
	// This step was failing occasionally, and globalsetup doesn't retry, so make it retry
	let customerKeyConfigured = false;
	const nRetries = 5;
	for ( let i = 0; i < nRetries; i++ ) {
		try {
			await qit.loginAsAdmin( page );
			console.log( 'Trying to add consumer token...' );
			await page.goto(
				`/wp-admin/admin.php?page=wc-settings&tab=advanced&section=keys&create-key=1`
			);
			await page
				.locator( '#key_description' )
				.fill( 'Key for API access' );
			await page
				.locator( '#key_permissions' )
				.selectOption( 'read_write' );
			await page.locator( 'text=Generate API key' ).click();
			qit.setEnv(
				'CONSUMER_KEY',
				await page.locator( '#key_consumer_key' ).inputValue()
			);
			qit.setEnv(
				'CONSUMER_SECRET',
				await page.locator( '#key_consumer_secret' ).inputValue()
			);
			console.log( 'Added consumer token successfully.' );
			customerKeyConfigured = true;
			break;
		} catch ( e ) {
			console.log(
				`Failed to add consumer token. Retrying... ${ i }/${ nRetries }`
			);
			console.log( e );
		}
	}

	if ( ! customerKeyConfigured ) {
		console.error(
			'Cannot proceed e2e test, as we could not set the customer key. Please check if the test site has been setup correctly.'
		);
		process.exit( 1 );
	}
} );
