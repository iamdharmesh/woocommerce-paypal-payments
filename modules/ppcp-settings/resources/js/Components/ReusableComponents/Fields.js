import data from '../../utils/data';

export const PayPalCheckbox = ( props ) => {
	return (
		<div className="ppcp-r__checkbox">
			<input
				className="ppcp-r__checkbox-value"
				type="checkbox"
				checked={ props.currentValue.includes( props.value ) }
				name={ props.name }
				value={ props.value }
				onChange={ ( e ) =>
					props.handleCheckboxState( e.target.checked, props )
				}
			/>
			<span className="ppcp-r__checkbox-presentation">
				{ data().getImage( 'icon-checkbox.svg' ) }
			</span>
		</div>
	);
};

export const PayPalRdb = ( props ) => {
	return (
		<div className="ppcp-r__radio">
			<input
				id={ props?.id }
				className="ppcp-r__radio-value"
				type="radio"
				checked={ props.value === props.currentValue }
				name={ props.name }
				value={ props.value }
				onChange={ () => props.handleRdbState( props.value ) }
			/>
			<span className="ppcp-r__radio-presentation"></span>
		</div>
	);
};

export const PayPalRdbWithContent = ( props ) => {
	const className = [ 'ppcp-r__radio-wrapper' ];

	if ( props?.className ) {
		className.push( props.className );
	}

	return (
		<div className="ppcp-r__radio-outer-wrapper">
			<div className={ className }>
				<PayPalRdb { ...props } />
				<div className="ppcp-r__radio-content">
					<label htmlFor={ props?.id }>{ props.label }</label>
					{ props.description && (
						<p
							className="ppcp-r__radio-description"
							dangerouslySetInnerHTML={ {
								__html: props.description,
							} }
						/>
					) }
				</div>
			</div>
			{ props?.toggleAdditionalContent &&
				props.children &&
				props.value === props.currentValue && (
					<div className="ppcp-r__radio-content-additional">
						{ props.children }
					</div>
				) }
		</div>
	);
};

export const handleCheckboxState = ( checked, props ) => {
	let newValue = null;
	if ( checked ) {
		newValue = [ ...props.currentValue, props.value ];
		props.changeCallback( newValue );
	} else {
		newValue = props.currentValue.filter(
			( value ) => value !== props.value
		);
	}
	props.changeCallback( newValue );
};
