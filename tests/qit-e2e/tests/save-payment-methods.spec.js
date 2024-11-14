const { test, expect } = require( '@playwright/test' );
const qit = require( '/qitHelpers' );
const { loginAsCustomer } = require( './utils/user' );
const {
	openPaypalPopup,
	loginIntoPaypal,
	completePaypalPayment,
} = require( './utils/paypal-popup' );
const {
	fillCheckoutForm,
	expectOrderReceivedPage,
} = require( './utils/checkout' );

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

// preconditions: shipping callback disabled and no saved payments
test( 'Save during purchase', async ( { page } ) => {
	await qit.wp(
		`option update woocommerce_checkout_page_id "${ qit.getEnv(
			'CHECKOUT_PAGE_ID'
		) }"`
	);
	await qit.wp( 'pcp settings update blocks_final_review_enabled true' );
	await loginAsCustomer( page );

	await page.goto( '/product/simple-product' );
	const popup = await openPaypalPopup( page );

	await loginIntoPaypal( popup );
	await completePaypalPayment( popup );
	await fillCheckoutForm( page );

	await completeContinuation( page );

	await expectOrderReceivedPage( page );
} );

// TODO: Skipping this tests as of now as it is failing, need to investigate and fix it.
test.skip( 'PayPal add payment method', async ( { page } ) => {
	await loginAsCustomer( page );
	await page.goto( '/my-account/add-payment-method' );

	const popup = await openPaypalPopup( page );
	await loginIntoPaypal( popup );
	popup.locator( '#consentButton' ).click();

	await page.waitForURL( '**/my-account/payment-methods/**', {
		timeout: 15000,
	} );
} );

test( 'ACDC add payment method', async ( { page } ) => {
	await loginAsCustomer( page );
	await page.goto( '/my-account/add-payment-method' );

	await page.click( 'text=Debit & Credit Cards' );

	const creditCardNumber = await page
		.frameLocator( '[title="paypal_card_number_field"]' )
		.locator( '.card-field-number' );
	await creditCardNumber.fill( '4005519200000004' );

	const expirationDate = await page
		.frameLocator( 'iframe[title="paypal_card_expiry_field"]' )
		.locator( 'input.card-field-expiry' );
	await expirationDate.click();
    await page.keyboard.type( '1' );
	await page.keyboard.type( '2' );
    await page.waitForTimeout( 500 );
	await page.keyboard.type( '2' );
	await page.keyboard.type( '5' );

	const cvv = await page
		.frameLocator( '[title="paypal_card_cvv_field"]' )
		.locator( '.card-field-cvv' );
	await cvv.fill( '123' );

	await page.getByRole( 'button', { name: 'Add payment method' } ).click();

	await page.waitForURL( '**/my-account/payment-methods/**', {
		timeout: 15000,
	} );
} );
