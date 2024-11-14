import { Icon } from '@wordpress/components';
import { chevronDown, chevronUp } from '@wordpress/icons';

import { useState } from 'react';

const Accordion = ( {
	title,
	initiallyOpen = false,
	className = '',
	children,
} ) => {
	const [ isOpen, setIsOpen ] = useState( initiallyOpen );

	const toggleOpen = ( ev ) => {
		setIsOpen( ! isOpen );
		ev?.preventDefault();
		return false;
	};

	const wrapperClasses = [ 'ppcp-r-accordion' ];
	if ( className ) {
		wrapperClasses.push( className );
	}
	if ( isOpen ) {
		wrapperClasses.push( 'ppcp--is-open' );
	}

	return (
		<div className={ wrapperClasses.join( ' ' ) }>
			<button
				onClick={ toggleOpen }
				className="ppcp-r-accordion--title"
				type="button"
			>
				<span>{ title }</span>
				<Icon icon={ isOpen ? chevronUp : chevronDown } />
			</button>
			{ isOpen && (
				<div className="ppcp-r-accordion--content">{ children }</div>
			) }
		</div>
	);
};

export default Accordion;
