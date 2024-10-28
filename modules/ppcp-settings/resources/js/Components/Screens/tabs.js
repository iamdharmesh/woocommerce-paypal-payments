import { __ } from '@wordpress/i18n';
import Onboarding from './Onboarding/Onboarding';
import TabDashboard from './Dashboard/TabDashboard';
import TabPaymentMethods from './Dashboard/TabPaymentMethods';
import TabSettings from './Dashboard/TabSettings';
import TabStyling from './Dashboard/TabStyling';

export const getSettingsTabs = () => {
	const tabs = [];

	// TODO: Use the store to find out if onboarding is complete

	if ( 0 ) {
		tabs.push( {
			name: 'onboarding',
			component: <Onboarding />,
		} );
	}

	if ( 1 ) {
		tabs.push( {
			name: 'dashboard',
			title: __( 'Dashboard', 'woocommerce-paypal-payments' ),
			component: <TabDashboard />,
		} );

		tabs.push( {
			name: 'payment-methods',
			title: __( 'Payment Methods', 'woocommerce-paypal-payments' ),
			component: <TabPaymentMethods />,
		} );

		tabs.push( {
			name: 'settings',
			title: __( 'Settings', 'woocommerce-paypal-payments' ),
			component: <TabSettings />,
		} );

		tabs.push( {
			name: 'styling',
			title: __( 'Styling', 'woocommerce-paypal-payments' ),
			component: <TabStyling />,
		} );
	}

	return tabs;
};
