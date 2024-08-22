/**
 * Helper component to log debug details to the browser console.
 *
 * A utility class that is used by payment buttons on the front-end, like the GooglePayButton.
 */
export default class ConsoleLogger {
	/**
	 * The prefix to display before every log output.
	 *
	 * @type {string}
	 */
	#prefix = '';

	/**
	 * Whether logging is enabled, disabled by default.
	 *
	 * @type {boolean}
	 */
	#enabled = false;

	constructor( ...prefixes ) {
		if ( prefixes.length ) {
			this.#prefix = `[${ prefixes.join( ' | ' ) }]`;
		}
	}

	/**
	 * Enable or disable logging. Only impacts `log()` output.
	 *
	 * @param {boolean} state True to enable log output.
	 */
	set enabled( state ) {
		this.#enabled = state;
	}

	/**
	 * Output log-level details to the browser console, if logging is enabled.
	 *
	 * @param {...any} args - All provided values are output to the browser console.
	 */
	log( ...args ) {
		if ( this.#enabled ) {
			// eslint-disable-next-line
			console.log( this.#prefix, ...args );
		}
	}

	/**
	 * Generate an error message in the browser's console.
	 *
	 * Error messages are always output, even when logging is disabled.
	 *
	 * @param {...any} args - All provided values are output to the browser console.
	 */
	error( ...args ) {
		console.error( this.#prefix, ...args );
	}
}