import { useEffect, useCallback, useState } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { Card } from '../Card';
import { STORE_NAME } from '../../stores/axoStore';

export const Payment = ( { fastlaneSdk, card, onPaymentLoad } ) => {
	const [ isCardElementReady, setIsCardElementReady ] = useState( false );

	const isGuest = useSelect( ( select ) =>
		select( STORE_NAME ).getIsGuest()
	);

	const isEmailLookupCompleted = useSelect( ( select ) =>
		select( STORE_NAME ).getIsEmailLookupCompleted()
	);

	const loadPaymentComponent = useCallback( async () => {
		if ( isGuest && isEmailLookupCompleted && isCardElementReady ) {
			const paymentComponent = await fastlaneSdk.FastlaneCardComponent(
				{}
			);
			paymentComponent.render( `#fastlane-card` );
			onPaymentLoad( paymentComponent );
		}
	}, [
		isGuest,
		isEmailLookupCompleted,
		isCardElementReady,
		fastlaneSdk,
		onPaymentLoad,
	] );

	useEffect( () => {
		if ( isGuest && isEmailLookupCompleted ) {
			setIsCardElementReady( true );
		}
	}, [ isGuest, isEmailLookupCompleted ] );

	useEffect( () => {
		loadPaymentComponent();
	}, [ loadPaymentComponent ] );

	if ( isGuest ) {
		if ( isEmailLookupCompleted ) {
			return <div id="fastlane-card" key="fastlane-card" />;
		}
		return (
			<div id="ppcp-axo-block-radio-content">
				Enter your email address above to continue.
			</div>
		);
	}
	return (
		<Card
			card={ card }
			fastlaneSdk={ fastlaneSdk }
			showWatermark={ ! isGuest }
		/>
	);
};
