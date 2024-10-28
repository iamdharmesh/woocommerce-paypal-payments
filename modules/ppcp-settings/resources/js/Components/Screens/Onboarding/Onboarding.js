import Container, {
	PAGE_ONBOARDING,
} from '../../ReusableComponents/Container.js';
import StepWelcome from './StepWelcome.js';
import StepBusiness from './StepBusiness.js';
import StepProducts from './StepProducts.js';
import { useState } from '@wordpress/element';

const Onboarding = () => {
	const [ step, setStep ] = useState( 0 );

	return (
		<Container page={ PAGE_ONBOARDING }>
			<div className="ppcp-r-card">
				<Stepper currentStep={ step } setStep={ setStep } />
			</div>
		</Container>
	);
};

const Stepper = ( { currentStep, setStep } ) => {
	const stepperOrder = [ StepWelcome, StepBusiness, StepProducts ];

	const renderSteps = () => {
		return stepperOrder.map( ( Step, index ) => {
			return (
				<div
					key={ index }
					style={ index !== currentStep ? { display: 'none' } : {} }
				>
					<Step
						setStep={ setStep }
						currentStep={ currentStep }
						stepperOrder={ stepperOrder }
					/>
				</div>
			);
		} );
	};

	return <>{ renderSteps() }</>;
};

export default Onboarding;
