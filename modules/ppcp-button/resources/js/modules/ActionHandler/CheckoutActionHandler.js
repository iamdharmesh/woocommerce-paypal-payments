import onApprove from '../OnApproveHandler/onApproveForPayNow.js';
import {payerData} from "../Helper/PayerData";

class CheckoutActionHandler {

    constructor(config, errorHandler, spinner) {
        this.config = config;
        this.errorHandler = errorHandler;
        this.spinner = spinner;
    }

    configuration() {
        const spinner = this.spinner;
        const createOrder = (data, actions) => {
            const payer = payerData();
            const bnCode = typeof this.config.bn_codes[this.config.context] !== 'undefined' ?
                this.config.bn_codes[this.config.context] : '';

            const errorHandler = this.errorHandler;

            const formSelector = this.config.context === 'checkout' ? 'form.checkout' : 'form#order_review';
            spinner.setTarget(formSelector);
            spinner.block();

            const formValues = jQuery(formSelector).serialize();

            return fetch(this.config.ajax.create_order.endpoint, {
                method: 'POST',
                body: JSON.stringify({
                    nonce: this.config.ajax.create_order.nonce,
                    payer,
                    bn_code:bnCode,
                    context:this.config.context,
                    order_id:this.config.order_id,
                    form:formValues
                })
            }).then(function (res) {
                return res.json();
            }).then(function (data) {
                if (!data.success) {
                    spinner.unblock();
                    errorHandler.message(data.messages);
                    return;
                }
                const input = document.createElement('input');
                input.setAttribute('type', 'hidden');
                input.setAttribute('name', 'ppcp-resume-order');
                input.setAttribute('value', data.data.purchase_units[0].custom_id);
                document.querySelector(formSelector).append(input);
                return data.data.id;
            });
        }
        return {
            createOrder,
            onApprove:onApprove(this, this.errorHandler, this.spinner),
            onError: (error) => {
                this.errorHandler.genericError();
            }
        }
    }
}

export default CheckoutActionHandler;
