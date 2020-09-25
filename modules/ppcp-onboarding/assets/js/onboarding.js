function onboardingCallback(authCode, sharedId) {
	const sandboxSwitchElement = document.querySelector('#ppcp-sandbox_on')
	fetch(
		PayPalCommerceGatewayOnboarding.endpoint,
		{
			method: 'POST',
			headers: {
				'content-type': 'application/json'
			},
			body: JSON.stringify(
				{
					authCode: authCode,
					sharedId: sharedId,
					nonce: PayPalCommerceGatewayOnboarding.nonce,
					env: sandboxSwitchElement && sandboxSwitchElement.checked ? 'sandbox' : 'production'
				}
			)
		}
	)
		.then( response => response.json() )
		.then(
			(data) => {
				if (data.success) {
					return;
				}
				alert( PayPalCommerceGatewayOnboarding.error )
			}
		);
}

/**
 * Since the PayPal modal will redirect the user a dirty form
 * provokes an alert if the user wants to leave the page. Since the user
 * needs to toggle the sandbox switch, we disable this dirty state with the
 * following workaround for checkboxes.
 *
 * @param event
 */
const checkBoxOnClick = (event) => {
	const value = event.target.checked;
	if (event.target.getAttribute('id') === 'ppcp-sandbox_on') {
		toggleSandboxProduction(! value);
	}
	event.preventDefault();
	event.stopPropagation();
	setTimeout( () => {
		event.target.checked = value;
		},1
	);
}

/**
 * Toggles the credential input fields.
 *
 * @param forProduction
 */
const credentialToggle = (forProduction) => {

	const sandboxClassSelectors = [
		'#field-merchant_email_sandbox',
		'#field-merchant_id_sandbox',
		'#field-client_id_sandbox',
		'#field-client_secret_sandbox',
	];
	const productionClassSelectors = [
		'#field-merchant_email_production',
		'#field-merchant_id_production',
		'#field-client_id_production',
		'#field-client_secret_production',
	];

	const selectors = forProduction ? productionClassSelectors : sandboxClassSelectors;
	document.querySelectorAll(selectors.join()).forEach(
		(element) => {element.classList.toggle('show')}
	)
}

/**
 * Toggles the visibility of the sandbox/production input fields.
 *
 * @param showProduction
 */
const toggleSandboxProduction = (showProduction) => {
	const productionDisplaySelectors = [
		'#field-credentials_production_heading',
		'#field-production_toggle_manual_input',
		'#field-ppcp_onboarding_production',
	];
	const productionClassSelectors = [
		'#field-merchant_email_production',
		'#field-merchant_id_production',
		'#field-client_id_production',
		'#field-client_secret_production',
	];
	const sandboxDisplaySelectors = [
		'#field-credentials_sandbox_heading',
		'#field-sandbox_toggle_manual_input',
		'#field-ppcp_onboarding_sandbox',
	];
	const sandboxClassSelectors = [
		'#field-merchant_email_sandbox',
		'#field-merchant_id_sandbox',
		'#field-client_id_sandbox',
		'#field-client_secret_sandbox',
	];

	if (showProduction) {
		document.querySelectorAll(productionDisplaySelectors.join()).forEach(
			(element) => {element.style.display = ''}
		)
		document.querySelectorAll(sandboxDisplaySelectors.join()).forEach(
			(element) => {element.style.display = 'none'}
		)
		document.querySelectorAll(sandboxClassSelectors.join()).forEach(
			(element) => {element.classList.remove('show')}
		)
		return;
	}
	document.querySelectorAll(productionDisplaySelectors.join()).forEach(
		(element) => {element.style.display = 'none'}
	)
	document.querySelectorAll(sandboxDisplaySelectors.join()).forEach(
		(element) => {element.style.display = ''}
	)
	document.querySelectorAll(productionClassSelectors.join()).forEach(
		(element) => {element.classList.remove('show')}
	)
}

(() => {
	const sandboxSwitchElement = document.querySelector('#ppcp-sandbox_on');
	if (sandboxSwitchElement) {
		toggleSandboxProduction(! sandboxSwitchElement.checked);
	}

	document.querySelectorAll('#mainform input[type="checkbox"]').forEach(
		(checkbox) => {
			checkbox.addEventListener('click', checkBoxOnClick);
		}
	);

	document.querySelectorAll('#field-sandbox_toggle_manual_input button, #field-production_toggle_manual_input button').forEach(
		(button) => {
			button.addEventListener(
				'click',
				(event) => {
					event.preventDefault();
					const isProduction = event.target.classList.contains('production-toggle');
					credentialToggle(isProduction);
				}
			)
		}
	)

})();