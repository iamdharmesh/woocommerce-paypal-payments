import OnboardingHeader from '../../ReusableComponents/OnboardingHeader';
import { __ } from '@wordpress/i18n';
import { Button, Icon } from '@wordpress/components';

const StepCompleteSetup = ( {
	setStep,
	currentStep,
	stepperOrder,
	setCompleted,
} ) => {
	const ButtonIcon = () => (
		<Icon
			icon={ () => (
				<svg
					width="24"
					height="24"
					viewBox="0 0 24 24"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
				>
					<path
						d="M19.5001 4.5H12.5001V6H16.9394L10.9697 11.9697L12.0304 13.0303L18.0001 7.06066V11.5H19.5001V4.5Z"
						fill="white"
					/>
					<path
						d="M6.5 5.5C5.39543 5.5 4.5 6.39543 4.5 7.5V17.5C4.5 18.6046 5.39543 19.5 6.5 19.5H16.5C17.6046 19.5 18.5 18.6046 18.5 17.5V14.5H17V17.5C17 17.7761 16.7761 18 16.5 18H6.5C6.22386 18 6 17.7761 6 17.5V7.5C6 7.22386 6.22386 7 6.5 7H9.5V5.5H6.5Z"
						fill="white"
					/>
				</svg>
			) }
		/>
	);

	return (
		<div className="ppcp-r-page-products">
			<OnboardingHeader
				title={ __(
					'Complete Your Payment Setup',
					'woocommerce-paypal-payments'
				) }
				description={ __(
					'To finalize your payment setup, please log in to PayPal. If you don’t have an account yet, don’t worry - we’ll guide you through the easy process of creating one.',
					'woocommerce-paypal-payments'
				) }
			/>
			<div className="ppcp-r-inner-container">
				<div className="ppcp-r-onboarding-header__description">
					<Button
						variant="primary"
						icon={ ButtonIcon }
						onClick={ () => {} }
					>
						{ __(
							'Connect to PayPal',
							'woocommerce-paypal-payments'
						) }
					</Button>
				</div>
			</div>
		</div>
	);
};

export default StepCompleteSetup;
