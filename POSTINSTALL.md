# Test the extension 

Thanks for installing the Stripe Invoicing extension! Get started by testing out the 

1. Go to your [Firebase dashboard](console.firebase.google.com)

2. Create the collection you specified during installation when prompted for DB_PATH (default collection name is `invoices`)

3. Stripe has a test mode so you can safely test an API integration without being charged. Make sure you are using your Stripe test API key if you 

4. Add a document to your collection to test the invoicing functionality. Use your email address so you can verify that the email was sent

```
email: 'your-email-address@example.com',
items: [{
    amount: 1999,
    currency: 'usd',
    description: 'My super cool item'
},
{
    amount: 540,
    currency: 'usd',
    description: 'Shipping cost'
}]

```

5. Look in your [Stripe dashboard](https://dashboard.stripe.com/test/invoices) for a record of the test invoice!

# Deploy live 

When you are ready to use the extension in production, be sure to: 

1. Use your Stripe live mode API key (should look like sk_123456789 not sk_test_123456789).

2. Understand how Stripe prices invoices by reading about our [Billing pricing tier.](https://stripe.com/billing/pricing)

3. Read about the Stripe [invoicing workflow](https://stripe.com/docs/billing/invoices/workflow) to understand how invoices are processed. 

4. Customize the colors and logo on your invoice in your Stripe [branding settings page](https://dashboard.stripe.com/settings/branding) in the dashboard.

Enjoy and please send any feedback to dev-feedback@stripe.com!