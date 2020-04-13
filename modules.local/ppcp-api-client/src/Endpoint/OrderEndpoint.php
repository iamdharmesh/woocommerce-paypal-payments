<?php
declare(strict_types=1);

namespace Inpsyde\PayPalCommerce\ApiClient\Endpoint;

use Inpsyde\PayPalCommerce\ApiClient\Authentication\Bearer;
use Inpsyde\PayPalCommerce\ApiClient\Entity\Order;
use Inpsyde\PayPalCommerce\ApiClient\Entity\OrderStatus;
use Inpsyde\PayPalCommerce\ApiClient\Entity\PurchaseUnit;
use Inpsyde\PayPalCommerce\ApiClient\Exception\RuntimeException;
use Inpsyde\PayPalCommerce\ApiClient\Factory\OrderFactory;
use Inpsyde\PayPalCommerce\ApiClient\Factory\PatchCollectionFactory;

class OrderEndpoint
{

    private $host;
    private $bearer;
    private $orderFactory;
    private $patchCollectionFactory;
    private $intent;

    public function __construct(
        string $host,
        Bearer $bearer,
        OrderFactory $orderFactory,
        PatchCollectionFactory $patchCollectionFactory,
        string $intent
    ) {

        $this->host = $host;
        $this->bearer = $bearer;
        $this->orderFactory = $orderFactory;
        $this->patchCollectionFactory = $patchCollectionFactory;
        $this->intent = $intent;
    }

    public function createForPurchaseUnits(PurchaseUnit ...$items) : Order
    {
        $bearer = $this->bearer->bearer();
        $data = [
            'intent' => $this->intent, // TODO: read this from the global settings
            'purchase_units' => array_map(
                function (PurchaseUnit $item) : array {
                    return $item->toArray();
                },
                $items
            ),
        ];
        $url = trailingslashit($this->host) . 'v2/checkout/orders';
        $args = [
            'headers' => [
                'Authorization' => 'Bearer ' . $bearer,
                'Content-Type' => 'application/json',
                'Prefer' => 'return=representation',
            ],
            'body' => json_encode($data),
        ];
        $response = wp_remote_post($url, $args);
        if (is_wp_error($response) || wp_remote_retrieve_response_code($response) !== 201) {
            throw new RuntimeException(__('Could not create order.', 'woocommerce-paypal-commerce-gateway'));
        }
        $json = json_decode($response['body']);
        $order = $this->orderFactory->fromPayPalResponse($json);
        return $order;
    }

    public function capture(Order $order) : Order
    {
        if ($order->status()->is(OrderStatus::COMPLETED)) {
            return $order;
        }
        $bearer = $this->bearer->bearer();
        $url = trailingslashit($this->host) . 'v2/checkout/orders/' . $order->id() . '/capture';
        $args = [
            'headers' => [
                'Authorization' => 'Bearer ' . $bearer,
                'Content-Type' => 'application/json',
                'Prefer' => 'return=representation',
            ],
        ];
        $response = wp_remote_post($url, $args);

        if (is_wp_error($response)) {
            throw new RuntimeException(__('Could not capture order.', 'woocommerce-paypal-commerce-gateway'));
        }
        if (wp_remote_retrieve_response_code($response) !== 422) {
            $json = json_decode($response['body']);
            if (is_array($json->details) && count(array_filter(
                $json->details,
                function ($detail) : bool {
                    return $detail->issue === 'ORDER_ALREADY_CAPTURED';
                }
            ))
            ) {
                return $this->order($order->id());
            }
        }

        if (wp_remote_retrieve_response_code($response) !== 201) {
            throw new RuntimeException(__('Could not capture order.', 'woocommerce-paypal-commerce-gateway'));
        }
        $json = json_decode($response['body']);
        $order = $this->orderFactory->fromPayPalResponse($json);
        return $order;
    }

    public function authorize(string $orderId) {
        $bearer = $this->bearer->bearer();
        $url = trailingslashit($this->host) . 'v2/checkout/orders/' . $orderId . '/authorize';
        $args = [
            'headers' => [
                'Authorization' => 'Bearer ' . $bearer,
                'Content-Type' => 'application/json',
                'Prefer' => 'return=representation',
            ],
        ];
        $response = wp_remote_post($url, $args);

        if (is_wp_error($response)) {
            throw new RuntimeException(__('Could not authorize order.', 'woocommerce-paypal-commerce-gateway'));
        }
        if (wp_remote_retrieve_response_code($response) !== 201) {
            throw new RuntimeException(__('Could not capture order.', 'woocommerce-paypal-commerce-gateway'));
        }
        return $orderId;
    }

    public function order(string $id) : Order
    {
        $bearer = $this->bearer->bearer();
        $url = trailingslashit($this->host) . 'v2/checkout/orders/' . $id;
        $args = [
            'headers' => [
                'Authorization' => 'Bearer ' . $bearer,
                'Content-Type' => 'application/json',
            ],
        ];
        $response = wp_remote_get($url, $args);
        if (is_wp_error($response) || wp_remote_retrieve_response_code($response) !== 200) {
            throw new RuntimeException(__('Could not retrieve order.', 'woocommerce-paypal-commerce-gateway'));
        }
        $json = json_decode($response['body']);
        return $this->orderFactory->fromPayPalResponse($json);
    }

    public function patchOrderWith(Order $orderToUpdate, Order $orderToCompare) : Order
    {
        $patches = $this->patchCollectionFactory->fromOrders($orderToCompare, $orderToCompare);
        if (! count($patches->patches())) {
            return $orderToUpdate;
        }

        $bearer = $this->bearer->bearer();
        $url = trailingslashit($this->host) . 'v2/checkout/orders/' . $orderToUpdate->id();
        $args = [
            'method' => 'PATCH',
            'headers' => [
                'Authorization' => 'Bearer ' . $bearer,
                'Content-Type' => 'application/json',
                'Prefer' => 'return=representation',
            ],
            'body' => json_encode($patches->toArray()),
        ];
        $response = wp_remote_post($url, $args);
        if (is_wp_error($response) || wp_remote_retrieve_response_code($response) !== 204) {
            throw new RuntimeException(__('Could not patch order.', 'woocommerce-paypal-commerce-gateway'));
        }

        $newOrder = $this->order($orderToUpdate->id());
        return $newOrder;
    }
}
