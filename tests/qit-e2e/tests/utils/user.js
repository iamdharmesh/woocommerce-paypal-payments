import qit from '/qitHelpers';
import config from '../../config/config.json';

export const loginAsCustomer = async ( page ) => {
	await qit.loginAs(
		page,
		config.customer.username,
		config.customer.password
	);
};
