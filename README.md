This extension allows you to invoice customers from documents added to a Firestore collection.

The top-level fields required are `email` and `items`.
`email` is the email address of the customer you want to send the invoice to.
`items` is a list of items that will be itemized on the invoice.

Stripe will calculate the total amount and generate a hosted invoice page that lets the customer pay with either cards or bank details.

```
admin.firestore().collection('invoices').add({
  email: 'adreyfus@stripe.com',
  items: [{
    amount: 1299,
    currency: 'usd',
    description: 'Three applie'
  }],
})
```

This document will generate the payment page below and automatically send an email to adreyfus@stripe.com with details on how to pay.

![An invoice page showing an itemized receipt, with options to pay with card or bank transfer](./test-invoice.png)

You can see this test invoice live at https://pay.stripe.com/invoice/invst_QtLCaOZqu2P8ZceuvsJIF6xpHC

## Pricing

This extension uses [Stripe Billing](https://stripe.com/pricing#billing-pricing).

It also uses Cloud Firestore and Cloud Functions on Google Cloud Platform.
