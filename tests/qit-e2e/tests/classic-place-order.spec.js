const { test, expect } = require( '@playwright/test' );
const qit = require( '/qitHelpers' );
const {
	fillCheckoutForm,
	expectOrderReceivedPage,
} = require( './utils/checkout' );
const {
	openPaypalPopup,
	loginIntoPaypal,
	completePaypalPayment,
} = require( './utils/paypal-popup' );

const config = require( '../config/config.json' );

async function expectContinuation( page ) {
	await expect(
		page.locator( '#payment_method_ppcp-gateway' )
	).toBeChecked();

	await expect( page.locator( '.component-frame' ) ).toHaveCount( 0 );
}

async function completeContinuation( page ) {
	await expectContinuation( page );
	await page.locator( '#place_order' ).click();
}

test.slow(); // Make sure that test have enough time to complete.

test.beforeAll( async ( {} ) => {
	await qit.wp(
		`option update woocommerce_checkout_page_id "${ qit.getEnv(
			'CHECKOUT_PAGE_ID'
		) }"`
	);
} );

test( 'PayPal button place order from Product page', async ( { page } ) => {
	await qit.wp( 'pcp settings update blocks_final_review_enabled true' );

	await page.goto( '/product/simple-product' );

	const popup = await openPaypalPopup( page );

	await loginIntoPaypal( popup );

	await completePaypalPayment( popup );

	await fillCheckoutForm( page );

	await completeContinuation( page );

	await expectOrderReceivedPage( page );
} );

test( 'Advanced Credit and Debit Card place order from Checkout page', async ( {
	page,
} ) => {
	await page.goto( '/product/simple-product' );
	await page.locator( '.single_add_to_cart_button' ).click();

	await page.goto( `/?p=${ qit.getEnv( 'CHECKOUT_PAGE_ID' ) }` );
	await fillCheckoutForm( page );

	await page.click( 'text=Credit Cards' );

	const expirationDate = await page
		.frameLocator( 'iframe[title="paypal_card_expiry_field"]' )
		.locator( 'input.card-field-expiry' );
	await expirationDate.click();
	await page.keyboard.type( '0' );
	await page.keyboard.type( '1' );
	await page.keyboard.type( '4' );
	await page.keyboard.type( '2' );

	const creditCardNumber = await page
		.frameLocator( '[title="paypal_card_number_field"]' )
		.locator( '.card-field-number' );
	await creditCardNumber.fill( config.card.number );

	const cvv = await page
		.frameLocator( '[title="paypal_card_cvv_field"]' )
		.locator( '.card-field-cvv' );
	await cvv.fill( config.card.cvc );

	await page.locator( '.ppcp-dcc-order-button' ).click();

	await expectOrderReceivedPage( page );
} );
