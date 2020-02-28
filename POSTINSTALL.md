# How to use

The Cloud Function is triggered when you add a new document to your Firestore collection. The function expects a payload

The function expects three pieces of data:

| Parameter        | Description                                                                                                                                                      | Required? |
| :--------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------- | :-------- |
| `email` or `uid` | Either `email` or `uid` is required to send the invoice. Email is a plaintext string, while UID is a Firebase Auth User ID that has an associated email address. | Yes       |
| `items`          | A list of items to include on the invoice. Each item has an amount, currency, and description.                                                                   | Yes       |
| `daysUntilDue`   | The number of days a customer has to pay the invoice before it is closed. Will default to DAYS_UNTIL_DUE_DEFAULT in the config if it's not included.             | No        |

Example valid documents:

```json
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

or

```json
uid: 'your-email-address@example.com',
items: [{
    amount: 1999,
    currency: 'usd',
    description: 'My super cool item'
}],
daysUntilDue: 2
```

# Testing the extension

Thanks for installing the Stripe invoicing extension! Getting started is simple:

1. [Sign up](https://dashboard.stripe.com/register) for a new Stripe account or [login in](https://dashboard.stripe.com/login) to an existing account.

2. Create the collection at the path you specified during installation when prompted for DB_PATH (default path is `invoices`).

3. Stripe has a test mode so you can safely test payments without being charged. Find your test mode keys at [https://dashboard.stripe.com/test/apikeys](https://dashboard.stripe.com/test/apikeys) and use it as the STRIPE_SECRET_KEY config value.

4. Add a document to your collection to test the invoicing functionality, e.g:

```json
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

5. Look in your [Stripe dashboard](https://dashboard.stripe.com/test/invoices) for a record of the test invoice. Stripe will not automatically send an email in test mode, but will send an email to your customer in live mode.

# Deploying live

When you are ready to use the extension in production, be sure to:

1. Use your Stripe [live mode API key](https://dashboard.stripe.com/apikeys) (should look like sk_123456789 not sk_test_123456789).

2. Read about the Stripe [invoicing workflow](https://stripe.com/docs/billing/invoices/workflow) to understand how invoices are processed.

3. Customize the colors and logo on your invoice in your Stripe [branding settings page](https://dashboard.stripe.com/settings/branding) in the dashboard.

Enjoy and please send any feedback to dev-feedback@stripe.com!
