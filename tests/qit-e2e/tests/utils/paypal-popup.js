import { expect } from '@playwright/test';

const { PAYPAL_CUSTOMER_EMAIL, PAYPAL_CUSTOMER_PASSWORD } = process.env;

/**
 * Opens the PayPal popup by pressing the button, and returns the popup object.
 * @param {Object}                                  page    Playwright page object
 * @param {{timeout: ?int, fundingSource: ?string}} options Options for the popup opening
 * @param {boolean}                                 retry   Retries the button click if the popup did not appear after timeout.
 */
export const openPaypalPopup = async ( page, options = {}, retry = true ) => {
	options = {
		...{
			timeout: 5000,
			fundingSource: 'paypal',
		},
		...options,
	};

	try {
		await page
			.locator( '.component-frame' )
			.first()
			.scrollIntoViewIfNeeded();

		const [ popup ] = await Promise.all( [
			page.waitForEvent( 'popup', { timeout: options.timeout } ),
			page
				.frameLocator( '.component-frame' )
				.locator( `[data-funding-source="${ options.fundingSource }"]` )
				.click(),
		] );

		await popup.waitForLoadState();

		return popup;
	} catch ( err ) {
		try {
			for ( const f of page.mainFrame().childFrames() ) {
				if ( f.name().startsWith( '__paypal_checkout' ) ) {
					for ( const f2 of f.childFrames() ) {
						if ( f.name().includes( '__paypal_checkout' ) ) {
							await f2.waitForLoadState();
							await expect(
								await f2.locator( '#main' )
							).toBeVisible();
							return f2;
						}
					}
				}
			}
		} catch ( frameErr ) {
			console.log( frameErr );
		}

		if ( retry ) {
			return openPaypalPopup( page, options, false );
		}
		throw err;
	}
};

/**
 * Opens the PayPal popup by pressing the button, and returns the popup object.
 * @param                                           page
 * @param {{timeout: ?int, fundingSource: ?string}} options
 * @param {boolean}                                 retry   Retries the button click if the popup did not appear after timeout.
 */
export const openBlockExpressPaypalPopup = async (
	page,
	options = {},
	retry = true
) => {
	options = {
		...{
			timeout: 20000,
			fundingSource: 'paypal',
		},
		...options,
	};

	try {
		await page
			.locator( '.component-frame' )
			.first()
			.scrollIntoViewIfNeeded();

		const [ popup ] = await Promise.all( [
			page.waitForEvent( 'popup', { timeout: options.timeout } ),
			page
				.locator(
					`#express-payment-method-ppcp-gateway-${ options.fundingSource }`
				)
				.frameLocator( '.component-frame' )
				.locator( `[data-funding-source="${ options.fundingSource }"]` )
				.click(),
		] );

		await popup.waitForLoadState();

		return popup;
	} catch ( err ) {
		if ( retry ) {
			return openPaypalPopup( page, options, false );
		}
		throw err;
	}
};

export const loginIntoPaypal = async ( popup, retry = true ) => {
	await Promise.any( [
		popup.locator( '[name="login_email"]' ),
		popup.locator( 'text=Log in' ).first(),
	] );

	await popup.fill( '[name="login_email"]', PAYPAL_CUSTOMER_EMAIL );

	const nextButtonLocator = popup.locator( '#btnNext' );
	// Sometimes we get a popup with email and password fields at the same screen
	if ( ( await nextButtonLocator.count() ) > 0 ) {
		await nextButtonLocator.click();
	}

	// Wait for the spinner to disappear
	await popup
		.locator( '.transitioning.spinnerWithLockIcon.spinner' )
		.last()
		.waitFor( { state: 'detached' } );
	if (
		await popup.getByText( 'Log in with a password instead' ).isVisible()
	) {
		await popup.getByText( 'Log in with a password instead' ).click();
	}

	try {
		await popup.fill( '[name="login_password"]', PAYPAL_CUSTOMER_PASSWORD, {
			timeout: 5000,
		} );
	} catch ( err ) {
		console.log(
			'Failed to fill password, possibly need to enter email again, retrying'
		);
		if ( retry ) {
			return loginIntoPaypal( popup, false );
		}
		throw err;
	}

	await popup.locator( '#btnLogin' ).click();
};

/**
 * Waits up to 15 sec for the shipping methods list to load.
 * @param  popup
 * @return {Promise<void>}
 */
export const waitForPaypalShippingList = async ( popup ) => {
	await expect( popup.locator( '#shippingMethodsDropdown' ) ).toBeVisible( {
		timeout: 15000,
	} );
};

/**
 * @param                                      popup
 * @param {{timeout: ?int, selector: ?string}} options
 */
export const completePaypalPayment = async ( popup, options ) => {
	options = {
		...{
			timeout: 20000,
			selector: '#payment-submit-btn',
		},
		...options,
	};
	await Promise.all( [
		popup.waitForEvent( 'close', { timeout: options.timeout } ),
		popup.click( options.selector ),
	] );
};
