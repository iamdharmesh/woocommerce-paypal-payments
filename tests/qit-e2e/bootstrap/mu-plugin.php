<?php
/**
 * Plugin name: WooCommerce PayPal Payments E2E Test plugin
 */

// Disable WP CLI notices
if ( ! isset( $_SERVER['HTTP_HOST'] ) ) {
	error_reporting(
		E_ALL
		& ~E_PARSE
		& ~E_NOTICE
		& ~E_USER_NOTICE
		& ~E_STRICT
		& ~E_DEPRECATED
		& ~E_USER_DEPRECATED
	);
}

add_filter( 'woocommerce_order_number', 'wc_paypal_payments_woocommerce_order_number' );

/**
 * Add timestamp to order number to make it unique
 *
 * @param string $order_id Order number.
 * @return string $order_id Order number with timestamp
 */
function wc_paypal_payments_woocommerce_order_number( $order_id ) {
	$random_number = get_option( 'wc_paypal_payments_order_number_test_random_number' );
	if ( ! $random_number ) {
		$random_number = wp_rand(0, 9999);
		update_option( 'wc_paypal_payments_order_number_test_random_number', $random_number );
	}
	return date( 'Ymd' ) . ' - ' . $random_number  . ' - ' . $order_id;
}
