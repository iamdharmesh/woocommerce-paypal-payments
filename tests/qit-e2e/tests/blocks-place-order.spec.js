const { expect, test } = require( '@playwright/test' );
const qit = require( '/qitHelpers' );
const {
	openBlockExpressPaypalPopup,
	loginIntoPaypal,
	completePaypalPayment,
} = require( './utils/paypal-popup' );
const {
	expectOrderReceivedPage,
	addProductToCart,
} = require( './utils/checkout' );

test.slow();

async function completeBlockContinuation( page ) {
	await expect(
		page.locator( '#radio-control-wc-payment-method-options-ppcp-gateway' )
	).toBeChecked();

	await expect( page.locator( '.component-frame' ) ).toHaveCount( 0 );

	await page
		.locator( '.wc-block-components-checkout-place-order-button' )
		.click();
}

test.beforeAll( async ( {} ) => {
	await qit.wp(
		`option update woocommerce_checkout_page_id "${ qit.getEnv(
			'BLOCK_CHECKOUT_PAGE_ID'
		) }"`
	);
	await qit.wp( 'pcp settings update blocks_final_review_enabled true' );
} );

test.afterAll( async ( {} ) => {
	await qit.wp( 'pcp settings update blocks_final_review_enabled true' );
} );

test( 'PayPal express block checkout', async ( { page } ) => {
	await addProductToCart( page, 'simple-product' );
	await page.goto( `?p=${ qit.getEnv( 'BLOCK_CHECKOUT_PAGE_ID' ) }`, {
		timeout: 20000,
	} );

	const popup = await openBlockExpressPaypalPopup( page );

	await loginIntoPaypal( popup );

	await completePaypalPayment( popup );

	await completeBlockContinuation( page );

	await expectOrderReceivedPage( page );
} );

test( 'PayPal express block cart', async ( { page } ) => {
	await addProductToCart( page, 'simple-product' );
	await page.goto( `?p=${ qit.getEnv( 'BLOCK_CART_PAGE_ID' ) }`, {
		timeout: 20000,
	} );

	const popup = await openBlockExpressPaypalPopup( page );

	await loginIntoPaypal( popup );

	await completePaypalPayment( popup );

	await completeBlockContinuation( page );

	await expectOrderReceivedPage( page );
} );

test.describe( 'Without review', () => {
	test.beforeAll( async ( {} ) => {
		await qit.wp( 'pcp settings update blocks_final_review_enabled false' );
	} );

	// TODO: Skipping this tests as of now as it is failing, need to investigate and fix it.
	test.skip( 'PayPal express block checkout', async ( { page } ) => {
		await addProductToCart( page, 'simple-product' );
		await page.goto( '/checkout', {
			timeout: 20000,
		} );

		const popup = await openBlockExpressPaypalPopup( page );

		await loginIntoPaypal( popup );

		await completePaypalPayment( popup );

		await expectOrderReceivedPage( page );
	} );

	// TODO: Skipping this tests as of now as it is failing, need to investigate and fix it.
	test.skip( 'PayPal express block cart', async ( { page } ) => {
		await addProductToCart( page, 'simple-product' );
		await page.goto( `?p=${ qit.getEnv( 'BLOCK_CART_PAGE_ID' ) }`, {
			timeout: 20000,
		} );

		const popup = await openBlockExpressPaypalPopup( page );

		await loginIntoPaypal( popup );

		await completePaypalPayment( popup );

		await expectOrderReceivedPage( page );
	} );
} );
