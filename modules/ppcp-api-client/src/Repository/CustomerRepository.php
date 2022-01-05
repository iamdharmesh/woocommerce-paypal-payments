<?php
/**
 * The customer repository.
 *
 * @package WooCommerce\PayPalCommerce\ApiClient\Repository
 */

declare(strict_types=1);

namespace WooCommerce\PayPalCommerce\ApiClient\Repository;

/**
 * Class CustomerRepository
 */
class CustomerRepository {

	/**
	 * The prefix.
	 *
	 * @var string
	 */
	protected $prefix;

	/**
	 * CustomerRepository constructor.
	 *
	 * @param string $prefix The prefix.
	 */
	public function __construct( string $prefix ) {
		$this->prefix = $prefix;
	}

	/**
	 * Returns a unique ID for the given user ID.
	 *
	 * @param int $user_id The user ID.
	 * @return string
	 */
	public function customer_id_for_user( int $user_id ): string {
		$guest_customer_id = get_user_meta( $user_id, 'ppcp_guest_customer_id', true );
		if ( $guest_customer_id ) {
			$user_id = $guest_customer_id;
		}

		if ( 0 === $user_id ) {
			$user_id = uniqid();
			WC()->session->set( 'ppcp_guest_customer_id', $user_id );
		}

		return $this->prefix . $user_id;
	}
}
