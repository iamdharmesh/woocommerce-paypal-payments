const { test } = require( '@playwright/test' );
const qit = require( '/qitHelpers' );
const { loginAsCustomer } = require( './utils/user' );
const { openPaypalPopup, loginIntoPaypal } = require( './utils/paypal-popup' );
const {
	expectOrderReceivedPage,
	fillCheckoutForm,
	clearCart,
	blockFillBillingDetails,
} = require( './utils/checkout' );
const config = require( '../config/config.json' );

test.slow(); // Make sure that test have enough time to complete.

// TODO: Skipping this tests as of now as it is failing due to fatal error, need to investigate and fix it.
test.skip( 'PayPal logged-in user free trial subscription without payment token with shipping callback enabled', async ( {
	page,
} ) => {
	await qit.wp( 'pcp settings update blocks_final_review_enabled true' );

	await loginAsCustomer( page );
	await page.goto( '/product/free-trial' );
	await page.click( 'text=Sign up now' );
	await page.goto( '/classic-checkout' );
	await fillCheckoutForm( page );

	// Wait for overlay to disappear
	await page
		.locator( '.blockUI.blockOverlay' )
		.last()
		.waitFor( { state: 'detached' } );
	await page.locator( 'li.payment_method_ppcp-gateway' ).click();
	const popup = await openPaypalPopup( page );
	await loginIntoPaypal( popup );
	await Promise.all( [
		popup.waitForEvent( 'close', { timeout: 15000 } ),
		popup.locator( '#consentButton' ).click(),
	] );

	await expectOrderReceivedPage( page );
} );

test( 'ACDC logged-in user free trial subscription without payment token', async ( {
	page,
} ) => {
	await loginAsCustomer( page );
	await clearCart( page );
	await page.goto( '/product/free-trial' );
	await page.click( 'text=Sign up now' );
	await page.goto( '/classic-checkout' );
	await fillCheckoutForm( page );

	await page.click( 'text=Credit Cards' );
	// Wait for overlay to disappear
	await page
		.locator( '.blockUI.blockOverlay' )
		.last()
		.waitFor( { state: 'detached' } );
	if (
		await page
			.locator( '#wc-ppcp-credit-card-gateway-payment-token-new' )
			.isVisible()
	) {
		await page
			.locator( '#wc-ppcp-credit-card-gateway-payment-token-new' )
			.check();
	}
	// Wait for overlay to disappear
	await page
		.locator( '.blockUI.blockOverlay' )
		.last()
		.waitFor( { state: 'detached' } );
	const creditCardNumber = await page
		.frameLocator( '[title="paypal_card_number_field"]' )
		.locator( '.card-field-number' );
	await creditCardNumber.fill( config.card.number );

	const expirationDate = await page
		.frameLocator( 'iframe[title="paypal_card_expiry_field"]' )
		.locator( 'input.card-field-expiry' );
	await expirationDate.click();
	await page.keyboard.type( '0' );
	await page.keyboard.type( '1' );
	await page.waitForTimeout( 500 );
	await page.keyboard.type( '4' );
	await page.keyboard.type( '2' );

	const cvv = await page
		.frameLocator( '[title="paypal_card_cvv_field"]' )
		.locator( '.card-field-cvv' );
	await cvv.fill( config.card.cvc );

	await page.locator( '.ppcp-dcc-order-button' ).click();

	await expectOrderReceivedPage( page );
} );

test( 'ACDC purchase free trial in Block checkout page as logged-in without saved card payments', async ( {
	page,
} ) => {
	await loginAsCustomer( page );
	await page.goto( '/product/free-trial' );
	await page.click( 'text=Sign up now' );
	await page.goto( '/checkout', { timeout: 15000 } );
	await blockFillBillingDetails( page );

	await page
		.locator(
			'#radio-control-wc-payment-method-options-ppcp-credit-card-gateway'
		)
		.click();

	const creditCardNumber = await page
		.frameLocator( '[title="paypal_card_number_field"]' )
		.locator( '.card-field-number' );
	await creditCardNumber.fill( config.card.number );

	const expirationDate = await page
		.frameLocator( 'iframe[title="paypal_card_expiry_field"]' )
		.locator( 'input.card-field-expiry' );
	await expirationDate.click();
	await page.keyboard.type( '0' );
	await page.keyboard.type( '1' );
	await page.waitForTimeout( 500 );
	await page.keyboard.type( '4' );
	await page.keyboard.type( '2' );

	const cvv = await page
		.frameLocator( '[title="paypal_card_cvv_field"]' )
		.locator( '.card-field-cvv' );
	await cvv.fill( config.card.cvc );

	await page
		.locator( '.wc-block-components-checkout-place-order-button' )
		.click();

	await page.waitForURL( '**/order-received/**', { timeout: 15000 } );
} );
