#!/usr/bin/env bash

echo "Start uploading QIT Custom E2E tests tags";

# Create a temporary directory to copy tests to upload.
tmp_dir=$(mktemp -d)
tmp_tests_dir="$tmp_dir/woocommerce-paypal-payments-qit-tests"
mkdir -p "$tmp_tests_dir"

cp -r ./tests/qit-e2e/ $tmp_tests_dir

echo "Uploading default tests tag";
./vendor/bin/qit tag:upload woocommerce-paypal-payments:default "$tmp_tests_dir"

echo "Uploading subscriptions tests tag";
# Only include the subscriptions tests
rm -rf "$tmp_tests_dir/tests/"
mkdir -p "$tmp_tests_dir/tests/subscriptions"
cp -r ./tests/qit-e2e/tests/subscriptions/ $tmp_tests_dir/tests/subscriptions
cp -r ./tests/qit-e2e/tests/utils/ $tmp_tests_dir/tests/utils
./vendor/bin/qit tag:upload woocommerce-paypal-payments:subscriptions-tests "$tmp_tests_dir"

# Remove the temporary directory
rm -rf "$tmp_dir"

echo "Finished uploading QIT Custom E2E tests tags";
