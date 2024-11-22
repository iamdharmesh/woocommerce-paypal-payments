const { test, expect } = require( '@playwright/test' );
const config = require( '../config/config.json' );

const {
	fillCheckoutForm,
	expectOrderReceivedPage,
	acceptTerms,
	selectPaymentMethod,
} = require( './utils/checkout' );
const {
	openPaypalPopup,
	completePaypalPayment,
	loginIntoPaypal,
} = require( './utils/paypal-popup' );

async function expectContinuation( page ) {
	await expect(
		page.locator( '#payment_method_ppcp-gateway' )
	).toBeChecked();

	await expect( page.locator( '.component-frame' ) ).toHaveCount( 0 );
}

async function completeContinuation( page ) {
	await expectContinuation( page );

	await Promise.all( [
		page.waitForNavigation(),
		page.locator( '#place_order' ).click(),
	] );
}

test.slow(); // Make sure that test have enough time to complete.

test( 'PayPal APM button place order', async ( { page } ) => {
	await page.goto( '/product/simple-product' );
	await page.locator( '.single_add_to_cart_button' ).click();

	await page.goto( '/classic-checkout' );

	await fillCheckoutForm( page );

	await selectPaymentMethod( page, 'gateway' );
	const popup = await openPaypalPopup( page, {
		fundingSource: config.apm_id,
	} );

	await loginIntoPaypal( popup );
	// await popup.getByText( 'Continue', { exact: true } ).click();
	await completePaypalPayment( popup, {} );

	await expectOrderReceivedPage( page );
} );

// TODO: Skipping this tests as of now as it is failing, need to investigate and fix it.
test.skip( 'PayPal APM button place order when redirect fails', async ( {
	page,
} ) => {
	await page.goto( '/product/simple-product' );
	await page.locator( '.single_add_to_cart_button' ).click();

	await page.goto( '/classic-checkout' );

	await fillCheckoutForm( page );

	await page.evaluate( 'PayPalCommerceGateway.ajax.approve_order = null' );

	await selectPaymentMethod( page, 'gateway' );
	const popup = await openPaypalPopup( page, {
		fundingSource: config.apm_id,
	} );

	await loginIntoPaypal( popup );
	// await popup.getByText( 'Continue', { exact: true } ).click();
	await completePaypalPayment( popup, {} );

	await expect( page.locator( '.woocommerce-error' ) ).toBeVisible();

	await page.reload();
	await expectContinuation( page );

	await acceptTerms( page );

	await completeContinuation( page );

	await expectOrderReceivedPage( page );
} );
