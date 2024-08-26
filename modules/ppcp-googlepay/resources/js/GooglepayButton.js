import {
	combineStyles,
	combineWrapperIds,
} from '../../../ppcp-button/resources/js/modules/Helper/PaymentButtonHelpers';
import PaymentButton from '../../../ppcp-button/resources/js/modules/Renderer/PaymentButton';
import widgetBuilder from '../../../ppcp-button/resources/js/modules/Renderer/WidgetBuilder';
import UpdatePaymentData from './Helper/UpdatePaymentData';
import TransactionInfo from './Helper/TransactionInfo';
import { PaymentMethods } from '../../../ppcp-button/resources/js/modules/Helper/CheckoutMethodState';

/**
 * Plugin-specific styling.
 *
 * Note that most properties of this object do not apply to the Google Pay button.
 *
 * @typedef {Object} PPCPStyle
 * @property {string}  shape  - Outline shape.
 * @property {?number} height - Button height in pixel.
 */

/**
 * Style options that are defined by the Google Pay SDK and are required to render the button.
 *
 * @typedef {Object} GooglePayStyle
 * @property {string} type     - Defines the button label.
 * @property {string} color    - Button color
 * @property {string} language - The locale; an empty string will apply the user-agent's language.
 */

/**
 * Google Pay JS SDK
 *
 * @see https://developers.google.com/pay/api/web/reference/request-objects
 * @typedef {Object} GooglePaySDK
 * @property {typeof PaymentsClient} PaymentsClient - Main API client for payment actions.
 */

/**
 * The Payments Client class, generated by the Google Pay SDK.
 *
 * @see https://developers.google.com/pay/api/web/reference/client
 * @typedef {Object} PaymentsClient
 * @property {Function} createButton         - The convenience method is used to generate a Google Pay payment button styled with the latest Google Pay branding for insertion into a webpage.
 * @property {Function} isReadyToPay         - Use the isReadyToPay(isReadyToPayRequest) method to determine a user's ability to return a form of payment from the Google Pay API.
 * @property {Function} loadPaymentData      - This method presents a Google Pay payment sheet that allows selection of a payment method and optionally configured parameters
 * @property {Function} onPaymentAuthorized  - This method is called when a payment is authorized in the payment sheet.
 * @property {Function} onPaymentDataChanged - This method handles payment data changes in the payment sheet such as shipping address and shipping options.
 */

/**
 * This object describes the transaction details.
 *
 * @see https://developers.google.com/pay/api/web/reference/request-objects#TransactionInfo
 * @typedef {Object} TransactionInfo
 * @property {string} currencyCode     - Required. The ISO 4217 alphabetic currency code.
 * @property {string} countryCode      - Optional. required for EEA countries,
 * @property {string} transactionId    - Optional. A unique ID that identifies a facilitation attempt. Highly encouraged for troubleshooting.
 * @property {string} totalPriceStatus - Required. [ESTIMATED|FINAL] The status of the total price used:
 * @property {string} totalPrice       - Required. Total monetary value of the transaction with an optional decimal precision of two decimal places.
 * @property {Array}  displayItems     - Optional. A list of cart items shown in the payment sheet (e.g. subtotals, sales taxes, shipping charges, discounts etc.).
 * @property {string} totalPriceLabel  - Optional. Custom label for the total price within the display items.
 * @property {string} checkoutOption   - Optional. Affects the submit button text displayed in the Google Pay payment sheet.
 */

class GooglepayButton extends PaymentButton {
	/**
	 * @inheritDoc
	 */
	static methodId = PaymentMethods.GOOGLEPAY;

	/**
	 * @inheritDoc
	 */
	static cssClass = 'google-pay';

	/**
	 * Client reference, provided by the Google Pay JS SDK.
	 */
	#paymentsClient = null;

	/**
	 * Details about the processed transaction.
	 *
	 * @type {?TransactionInfo}
	 */
	#transactionInfo = null;

	googlePayConfig = null;

	/**
	 * @inheritDoc
	 */
	static getWrappers( buttonConfig, ppcpConfig ) {
		return combineWrapperIds(
			buttonConfig?.button?.wrapper || '',
			buttonConfig?.button?.mini_cart_wrapper || '',
			ppcpConfig?.button?.wrapper || '',
			'ppc-button-googlepay-container',
			'ppc-button-ppcp-googlepay'
		);
	}

	/**
	 * @inheritDoc
	 */
	static getStyles( buttonConfig, ppcpConfig ) {
		const styles = combineStyles(
			ppcpConfig?.button || {},
			buttonConfig?.button || {}
		);

		if ( 'buy' === styles.MiniCart.type ) {
			styles.MiniCart.type = 'pay';
		}

		return styles;
	}

	constructor(
		context,
		externalHandler,
		buttonConfig,
		ppcpConfig,
		contextHandler
	) {
		// Disable debug output in the browser console:
		// buttonConfig.is_debug = false;

		super(
			context,
			externalHandler,
			buttonConfig,
			ppcpConfig,
			contextHandler
		);

		this.init = this.init.bind( this );
		this.onPaymentAuthorized = this.onPaymentAuthorized.bind( this );
		this.onPaymentDataChanged = this.onPaymentDataChanged.bind( this );
		this.onButtonClick = this.onButtonClick.bind( this );

		this.log( 'Create instance' );
	}

	/**
	 * @inheritDoc
	 */
	get requiresShipping() {
		return super.requiresShipping && this.buttonConfig.shipping?.enabled;
	}

	/**
	 * The Google Pay API.
	 *
	 * @return {?GooglePaySDK} API for the Google Pay JS SDK, or null when SDK is not ready yet.
	 */
	get googlePayApi() {
		return window.google?.payments?.api;
	}

	/**
	 * The Google Pay PaymentsClient instance created by this button.
	 * @see https://developers.google.com/pay/api/web/reference/client
	 *
	 * @return {?PaymentsClient} The SDK object, or null when SDK is not ready yet.
	 */
	get paymentsClient() {
		return this.#paymentsClient;
	}

	/**
	 * Details about the processed transaction.
	 *
	 * This object defines the price that is charged, and text that is displayed inside the
	 * payment sheet.
	 *
	 * @return {?TransactionInfo} The TransactionInfo object.
	 */
	get transactionInfo() {
		return this.#transactionInfo;
	}

	/**
	 * Assign the new transaction details to the payment button.
	 *
	 * @param {TransactionInfo} newTransactionInfo - Transaction details.
	 */
	set transactionInfo( newTransactionInfo ) {
		this.#transactionInfo = newTransactionInfo;

		this.refresh();
	}

	/**
	 * @inheritDoc
	 */
	validateConfiguration( silent = false ) {
		const validEnvs = [ 'PRODUCTION', 'TEST' ];

		const isInvalid = ( ...args ) => {
			if ( ! silent ) {
				this.error( ...args );
			}
			return false;
		};

		if ( ! validEnvs.includes( this.buttonConfig.environment ) ) {
			return isInvalid(
				'Invalid environment:',
				this.buttonConfig.environment
			);
		}

		// Preview buttons only need a valid environment.
		if ( this.isPreview ) {
			return true;
		}

		if ( ! this.googlePayConfig ) {
			return isInvalid(
				'No API configuration - missing configure() call?'
			);
		}

		if ( ! this.transactionInfo ) {
			return isInvalid(
				'No transactionInfo - missing configure() call?'
			);
		}

		if ( ! typeof this.contextHandler?.validateContext() ) {
			return isInvalid( 'Invalid context handler.', this.contextHandler );
		}

		return true;
	}

	/**
	 * Configures the button instance. Must be called before the initial `init()`.
	 *
	 * @param {Object} apiConfig       - API configuration.
	 * @param {Object} transactionInfo - Transaction details; required before "init" call.
	 */
	configure( apiConfig, transactionInfo ) {
		this.googlePayConfig = apiConfig;
		this.#transactionInfo = transactionInfo;

		this.allowedPaymentMethods = this.googlePayConfig.allowedPaymentMethods;
		this.baseCardPaymentMethod = this.allowedPaymentMethods[ 0 ];
	}

	init() {
		// Use `reinit()` to force a full refresh of an initialized button.
		if ( this.isInitialized ) {
			return;
		}

		// Stop, if configuration is invalid.
		if ( ! this.validateConfiguration() ) {
			return;
		}

		super.init();
		this.#paymentsClient = this.createPaymentsClient();

		if ( ! this.isPresent ) {
			this.log( 'Payment wrapper not found', this.wrapperId );
			return;
		}

		if ( ! this.paymentsClient ) {
			this.log( 'Could not initialize the payments client' );
			return;
		}

		this.paymentsClient
			.isReadyToPay(
				this.buildReadyToPayRequest(
					this.allowedPaymentMethods,
					this.googlePayConfig
				)
			)
			.then( ( response ) => {
				this.log( 'PaymentsClient.isReadyToPay response:', response );
				this.isEligible = !! response.result;
			} )
			.catch( ( err ) => {
				this.error( err );
				this.isEligible = false;
			} );
	}

	reinit() {
		// Missing (invalid) configuration indicates, that the first `init()` call did not happen yet.
		if ( ! this.validateConfiguration( true ) ) {
			return;
		}

		super.reinit();

		this.init();
	}

	/**
	 * Provides an object with relevant paymentDataCallbacks for the current button instance.
	 *
	 * @return {Object} An object containing callbacks for the current scope & configuration.
	 */
	preparePaymentDataCallbacks() {
		const callbacks = {};

		// We do not attach any callbacks to preview buttons.
		if ( this.isPreview ) {
			return callbacks;
		}

		callbacks.onPaymentAuthorized = this.onPaymentAuthorized;

		if ( this.requiresShipping ) {
			callbacks.onPaymentDataChanged = this.onPaymentDataChanged;
		}

		return callbacks;
	}

	createPaymentsClient() {
		if ( ! this.googlePayApi ) {
			return null;
		}

		const callbacks = this.preparePaymentDataCallbacks();

		/**
		 * Consider providing merchant info here:
		 *
		 * @see https://developers.google.com/pay/api/web/reference/request-objects#PaymentOptions
		 */
		return new this.googlePayApi.PaymentsClient( {
			environment: this.buttonConfig.environment,
			paymentDataCallbacks: callbacks,
		} );
	}

	buildReadyToPayRequest( allowedPaymentMethods, baseRequest ) {
		this.log( 'Ready To Pay request', baseRequest, allowedPaymentMethods );

		return Object.assign( {}, baseRequest, {
			allowedPaymentMethods,
		} );
	}

	/**
	 * Creates the payment button and calls `this.insertButton()` to make the button visible in the
	 * correct wrapper.
	 */
	addButton() {
		if ( ! this.paymentsClient ) {
			return;
		}

		const baseCardPaymentMethod = this.baseCardPaymentMethod;
		const { color, type, language } = this.style;

		/**
		 * @see https://developers.google.com/pay/api/web/reference/client#createButton
		 */
		const button = this.paymentsClient.createButton( {
			onClick: this.onButtonClick,
			allowedPaymentMethods: [ baseCardPaymentMethod ],
			buttonColor: color || 'black',
			buttonType: type || 'pay',
			buttonLocale: language || 'en',
			buttonSizeMode: 'fill',
		} );

		this.insertButton( button );
	}

	//------------------------
	// Button click
	//------------------------

	/**
	 * Show Google Pay payment sheet when Google Pay payment button is clicked
	 */
	onButtonClick() {
		this.log( 'onButtonClick' );

		const initiatePaymentRequest = () => {
			window.ppcpFundingSource = 'googlepay';
			const paymentDataRequest = this.paymentDataRequest();
			this.log(
				'onButtonClick: paymentDataRequest',
				paymentDataRequest,
				this.context
			);
			this.paymentsClient.loadPaymentData( paymentDataRequest );
		};

		const validateForm = () => {
			if ( 'function' !== typeof this.contextHandler.validateForm ) {
				return Promise.resolve();
			}

			return this.contextHandler.validateForm().catch( ( error ) => {
				this.error( 'Form validation failed:', error );
				throw error;
			} );
		};

		const getTransactionInfo = () => {
			if ( 'function' !== typeof this.contextHandler.transactionInfo ) {
				return Promise.resolve();
			}

			return this.contextHandler
				.transactionInfo()
				.then( ( transactionInfo ) => {
					this.transactionInfo = transactionInfo;
				} )
				.catch( ( error ) => {
					this.error( 'Failed to get transaction info:', error );
					throw error;
				} );
		};

		validateForm()
			.then( getTransactionInfo )
			.then( initiatePaymentRequest );
	}

	paymentDataRequest() {
		const baseRequest = {
			apiVersion: 2,
			apiVersionMinor: 0,
		};

		const googlePayConfig = this.googlePayConfig;
		const paymentDataRequest = Object.assign( {}, baseRequest );
		paymentDataRequest.allowedPaymentMethods =
			googlePayConfig.allowedPaymentMethods;
		paymentDataRequest.transactionInfo = this.transactionInfo.finalObject;
		paymentDataRequest.merchantInfo = googlePayConfig.merchantInfo;

		if ( this.requiresShipping ) {
			paymentDataRequest.callbackIntents = [
				'SHIPPING_ADDRESS',
				'SHIPPING_OPTION',
				'PAYMENT_AUTHORIZATION',
			];
			paymentDataRequest.shippingAddressRequired = true;
			paymentDataRequest.shippingAddressParameters =
				this.shippingAddressParameters();
			paymentDataRequest.shippingOptionRequired = true;
		} else {
			paymentDataRequest.callbackIntents = [ 'PAYMENT_AUTHORIZATION' ];
		}

		return paymentDataRequest;
	}

	//------------------------
	// Shipping processing
	//------------------------

	shippingAddressParameters() {
		return {
			allowedCountryCodes: this.buttonConfig.shipping.countries,
			phoneNumberRequired: true,
		};
	}

	onPaymentDataChanged( paymentData ) {
		this.log( 'onPaymentDataChanged', paymentData );

		return new Promise( async ( resolve, reject ) => {
			try {
				const paymentDataRequestUpdate = {};

				const updatedData = await new UpdatePaymentData(
					this.buttonConfig.ajax.update_payment_data
				).update( paymentData );
				const transactionInfo = this.transactionInfo;

				// Check, if the current context uses the WC cart.
				const hasRealCart = [
					'checkout-block',
					'checkout',
					'cart-block',
					'cart',
					'mini-cart',
					'pay-now',
				].includes( this.context );

				this.log( 'onPaymentDataChanged:updatedData', updatedData );
				this.log(
					'onPaymentDataChanged:transactionInfo',
					transactionInfo
				);

				updatedData.country_code = transactionInfo.countryCode;
				updatedData.currency_code = transactionInfo.currencyCode;

				// Handle unserviceable address.
				if ( ! updatedData.shipping_options?.shippingOptions?.length ) {
					paymentDataRequestUpdate.error =
						this.unserviceableShippingAddressError();
					resolve( paymentDataRequestUpdate );
					return;
				}

				if (
					[ 'INITIALIZE', 'SHIPPING_ADDRESS' ].includes(
						paymentData.callbackTrigger
					)
				) {
					paymentDataRequestUpdate.newShippingOptionParameters =
						this.sanitizeShippingOptions(
							updatedData.shipping_options
						);
				}

				if ( updatedData.total && hasRealCart ) {
					transactionInfo.setTotal(
						updatedData.total,
						updatedData.shipping_fee
					);

					// This page contains a real cart and potentially a form for shipping options.
					this.syncShippingOptionWithForm(
						paymentData?.shippingOptionData?.id
					);
				} else {
					transactionInfo.shippingFee = this.getShippingCosts(
						paymentData?.shippingOptionData?.id,
						updatedData.shipping_options
					);
				}

				paymentDataRequestUpdate.newTransactionInfo =
					this.calculateNewTransactionInfo( transactionInfo );

				resolve( paymentDataRequestUpdate );
			} catch ( error ) {
				this.error( 'Error during onPaymentDataChanged:', error );
				reject( error );
			}
		} );
	}

	/**
	 * Google Pay throws an error, when the shippingOptions entries contain
	 * custom properties. This function strips unsupported properties from the
	 * provided ajax response.
	 *
	 * @param {Object} responseData Data returned from the ajax endpoint.
	 * @return {Object} Sanitized object.
	 */
	sanitizeShippingOptions( responseData ) {
		const cleanOptions = [];

		responseData.shippingOptions.forEach( ( item ) => {
			cleanOptions.push( {
				id: item.id,
				label: item.label,
				description: item.description,
			} );
		} );

		responseData.shippingOptions = cleanOptions;

		return { ...responseData, shippingOptions: cleanOptions };
	}

	/**
	 * Returns the shipping costs as numeric value.
	 *
	 * TODO - Move this to the PaymentButton base class
	 *
	 * @param {string} shippingId                           - The shipping method ID.
	 * @param {Object} shippingData                         - The PaymentDataRequest object that
	 *                                                      contains shipping options.
	 * @param {Array}  shippingData.shippingOptions
	 * @param {string} shippingData.defaultSelectedOptionId
	 *
	 * @return {number} The shipping costs.
	 */
	getShippingCosts(
		shippingId,
		{ shippingOptions = [], defaultSelectedOptionId = '' } = {}
	) {
		if ( ! shippingOptions?.length ) {
			this.log( 'Cannot calculate shipping cost: No Shipping Options' );
			return 0;
		}

		const findOptionById = ( id ) =>
			shippingOptions.find( ( option ) => option.id === id );

		const getValidShippingId = () => {
			if (
				'shipping_option_unselected' === shippingId ||
				! findOptionById( shippingId )
			) {
				// Entered on initial call, and when changing the shipping country.
				return defaultSelectedOptionId;
			}

			return shippingId;
		};

		const currentOption = findOptionById( getValidShippingId() );

		return Number( currentOption?.cost ) || 0;
	}

	unserviceableShippingAddressError() {
		return {
			reason: 'SHIPPING_ADDRESS_UNSERVICEABLE',
			message: 'Cannot ship to the selected address',
			intent: 'SHIPPING_ADDRESS',
		};
	}

	/**
	 * Recalculates and returns the plain transaction info object.
	 *
	 * @param {TransactionInfo} transactionInfo - Internal transactionInfo instance.
	 * @return {{totalPrice: string, countryCode: string, totalPriceStatus: string, currencyCode: string}} Updated details.
	 */
	calculateNewTransactionInfo( transactionInfo ) {
		return transactionInfo.finalObject;
	}

	//------------------------
	// Payment process
	//------------------------

	onPaymentAuthorized( paymentData ) {
		this.log( 'onPaymentAuthorized' );
		return this.processPayment( paymentData );
	}

	async processPayment( paymentData ) {
		this.log( 'processPayment' );

		return new Promise( async ( resolve, reject ) => {
			try {
				const id = await this.contextHandler.createOrder();

				this.log( 'processPayment: createOrder', id );

				const confirmOrderResponse = await widgetBuilder.paypal
					.Googlepay()
					.confirmOrder( {
						orderId: id,
						paymentMethodData: paymentData.paymentMethodData,
					} );

				this.log(
					'processPayment: confirmOrder',
					confirmOrderResponse
				);

				/** Capture the Order on the Server */
				if ( confirmOrderResponse.status === 'APPROVED' ) {
					let approveFailed = false;
					await this.contextHandler.approveOrder(
						{
							orderID: id,
						},
						{
							// actions mock object.
							restart: () =>
								new Promise( ( resolve, reject ) => {
									approveFailed = true;
									resolve();
								} ),
							order: {
								get: () =>
									new Promise( ( resolve, reject ) => {
										resolve( null );
									} ),
							},
						}
					);

					if ( ! approveFailed ) {
						resolve( this.processPaymentResponse( 'SUCCESS' ) );
					} else {
						resolve(
							this.processPaymentResponse(
								'ERROR',
								'PAYMENT_AUTHORIZATION',
								'FAILED TO APPROVE'
							)
						);
					}
				} else {
					resolve(
						this.processPaymentResponse(
							'ERROR',
							'PAYMENT_AUTHORIZATION',
							'TRANSACTION FAILED'
						)
					);
				}
			} catch ( err ) {
				resolve(
					this.processPaymentResponse(
						'ERROR',
						'PAYMENT_AUTHORIZATION',
						err.message
					)
				);
			}
		} );
	}

	processPaymentResponse( state, intent = null, message = null ) {
		const response = {
			transactionState: state,
		};

		if ( intent || message ) {
			response.error = {
				intent,
				message,
			};
		}

		this.log( 'processPaymentResponse', response );

		return response;
	}

	/**
	 * Updates the shipping option in the checkout form, if a form with shipping options is
	 * detected.
	 *
	 * @param {string} shippingOption - The shipping option ID, e.g. "flat_rate:4".
	 * @return {boolean} - True if a shipping option was found and selected, false otherwise.
	 */
	syncShippingOptionWithForm( shippingOption ) {
		const wrappers = [
			// Classic checkout, Classic cart.
			'.woocommerce-shipping-methods',
			// Block checkout.
			'.wc-block-components-shipping-rates-control',
			// Block cart.
			'.wc-block-components-totals-shipping',
		];

		const sanitizedShippingOption = shippingOption.replace( /"/g, '' );

		// Check for radio buttons with shipping options.
		for ( const wrapper of wrappers ) {
			const selector = `${ wrapper } input[type="radio"][value="${ sanitizedShippingOption }"]`;
			const radioInput = document.querySelector( selector );

			if ( radioInput ) {
				radioInput.click();
				return true;
			}
		}

		// Check for select list with shipping options.
		for ( const wrapper of wrappers ) {
			const selector = `${ wrapper } select option[value="${ sanitizedShippingOption }"]`;
			const selectOption = document.querySelector( selector );

			if ( selectOption ) {
				const selectElement = selectOption.closest( 'select' );

				if ( selectElement ) {
					selectElement.value = sanitizedShippingOption;
					selectElement.dispatchEvent( new Event( 'change' ) );
					return true;
				}
			}
		}

		return false;
	}
}

export default GooglepayButton;
