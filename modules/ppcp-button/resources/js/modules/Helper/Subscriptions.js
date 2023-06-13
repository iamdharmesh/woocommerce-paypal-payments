export const isChangePaymentPage = () => {
    const urlParams = new URLSearchParams(window.location.search)
    return urlParams.has('change_payment_method');
}

export const subscriptionHasPlan = () => {
    if (PayPalCommerceGateway.data_client_id.has_subscriptions) {
        if (PayPalCommerceGateway.subscription_plan_id !== '') {
            return true;
        }

        return false;
    }

    return true;
}
