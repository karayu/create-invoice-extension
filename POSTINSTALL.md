# How to use 

Add a document with information about the invoice. 

Required fields:

**email** [string] the email address of your customer

OR

**uid** [string] the UID of the Firebase Auth user

**items** [array]

Optional field:
**daysUntilDue** [number] the number of days the customer has to pay the invoice before it's marked as closed. Defaults to the config value DAYS_UNTIL_DUE_DEFAULT. 

# Test the extension 

Thanks for installing the Stripe Invoicing extension! Getting started is simple:

1. [Sign up](https://dashboard.stripe.com/register) for a new Stripe account or [login in](https://dashboard.stripe.com/login) to an existing account.

2. Go to your [Firebase dashboard](console.firebase.google.com).

3. Create the collection at the path you specified during installation when prompted for DB_PATH (default path is `invoices`).

4. Stripe has a test mode so you can safely test payments without being charged. Find your testmode keys at [https://dashboard.stripe.com/test/apikeys](https://dashboard.stripe.com/test/apikeys).

5. Add a document to your collection to test the invoicing functionality. You must provide either an email address or Firebase Auth UID in the document. 

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

6. Look in your [Stripe dashboard](https://dashboard.stripe.com/test/invoices) for a record of the test invoice. Stripe will not automatically send an email in test mode, but will send an email to your customer in live mode.

# Deploy live 

When you are ready to use the extension in production, be sure to: 

1. Use your Stripe [live mode API key](https://dashboard.stripe.com/apikeys) (should look like sk_123456789 not sk_test_123456789).

2. Understand how Stripe prices invoices by reading about the [Stripe Billing pricing tier.](https://stripe.com/billing/pricing)

3. Read about the Stripe [invoicing workflow](https://stripe.com/docs/billing/invoices/workflow) to understand how invoices are processed. 

4. Customize the colors and logo on your invoice in your Stripe [branding settings page](https://dashboard.stripe.com/settings/branding) in the dashboard.

Enjoy and please send any feedback to dev-feedback@stripe.com!