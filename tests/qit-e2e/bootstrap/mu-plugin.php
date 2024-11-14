<?php
/**
 * Plugin name: WooCommerce PayPal Payments E2E Test plugin
 */

add_filter( 'woocommerce_order_number', 'wc_paypal_payments_woocommerce_order_number' );

/**
 * Add timestamp to order number to make it unique
 *
 * @param string $order_id Order number.
 * @return string $order_id Order number with timestamp
 */
function wc_paypal_payments_woocommerce_order_number( $order_id ) {
	return time() . ' - ' . $order_id;
}
