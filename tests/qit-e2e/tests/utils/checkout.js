import { expect } from '@playwright/test';
import config from '../../config/config.json';

const { customer } = config;

export const fillCheckoutForm = async ( page ) => {
	await page.fill( '#billing_first_name', customer.first_name );
	await page.fill( '#billing_last_name', customer.last_name );
	await page.selectOption( 'select#billing_country', customer.country );
	await page.selectOption( 'select#billing_state', customer.state );
	await page.fill( '#billing_address_1', customer.address );
	await page.fill( '#billing_postcode', customer.postcode );
	await page.fill( '#billing_city', customer.city );
	await page.fill( '#billing_phone', customer.phone );
	await page.fill( '#billing_email', customer.email );

	const differentShippingLocator = page.locator(
		'[name="ship_to_different_address"]'
	);
	if ( ( await differentShippingLocator.count() ) > 0 ) {
		await differentShippingLocator.uncheck();
	}

	await acceptTerms( page );
};

/**
 * Fill Billing details on block checkout page
 *
 * @param {Page} page Playwright page object
 */
export async function blockFillBillingDetails( page ) {
	const card = await page.locator( '.wc-block-components-address-card' );
	if ( await card.isVisible() ) {
		await card.locator( '.wc-block-components-address-card__edit' ).click();
	}
	await page.locator( '#email' ).fill( customer.email );
	await page.locator( '#billing-first_name' ).fill( customer.first_name );
	await page.locator( '#billing-last_name' ).fill( customer.last_name );
	await page.locator( '#billing-country' ).selectOption( customer.country );
	await page.locator( '#billing-address_1' ).fill( customer.address );

	await page.locator( '#billing-city' ).fill( customer.city );
	if (
		customer.state &&
		( await page.locator( '#billing-state' ).isVisible() )
	) {
		await page.locator( '#billing-state' ).selectOption( customer.state );
	}
	await page.locator( '#billing-postcode' ).fill( customer.postcode );
	await page.locator( '#billing-postcode' ).blur();
	await page.waitForLoadState( 'networkidle' );
}

export const acceptTerms = async ( page ) => {
	const termsLocator = page.locator( '[name="terms"]' );
	if ( ( await termsLocator.count() ) > 0 ) {
		await termsLocator.check();
	}
};

export const expectOrderReceivedPage = async ( page ) => {
	await page.waitForURL( '**/order-received/**', { timeout: 30000 } );
	const title = await page.locator( '.entry-title' );
	await expect( title ).toHaveText( 'Order received' );
};

export const addProductToCart = async ( page, slug ) => {
	await page.goto( `/product/${ slug }` );
	await page.locator( '.single_add_to_cart_button' ).click();
};

/**
 * Clear cart.
 *
 * @param {Page} page Playwright page object
 */
export async function clearCart( page ) {
	await page.goto( '/classic-cart/' );
	const rows = await page.locator( '.cart td a.remove' );
	const count = await rows.count();

	for ( let i = 0; i < count; i++ ) {
		await rows.nth( 0 ).click();
		await page.locator( '.woocommerce-message' ).waitFor();
	}
}

/**
 * Select payment method
 *
 * @param {Page}    page            Playwright page object
 * @param {string}  paymentMethod   Payment method name
 * @param {boolean} isBlockCheckout Is block checkout?
 */
export async function selectPaymentMethod( page, paymentMethod ) {
	// Wait for overlay to disappear
	await page
		.locator( '.blockUI.blockOverlay' )
		.last()
		.waitFor( { state: 'detached' } );

	// Wait for payment method to appear
	const payMethod = await page
		.locator(
			`ul.wc_payment_methods li.payment_method_ppcp-${ paymentMethod } label`
		)
		.first();
	await expect( payMethod ).toBeVisible();

	// Select payment method
	await page
		.locator( `label[for="payment_method_ppcp-${ paymentMethod }"]` )
		.waitFor();
	await payMethod.click();
}
