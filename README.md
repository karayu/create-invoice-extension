
This extension allows you to invoice customers from documents added to a Firestore collection. 

The top-level fields required are `email` and `items`.
`email` is the email address of the customer you want to send the invoice to.
`items` is a list of items that will be itemized on the invoice. 

Stripe will calculate the total amount and generate a hosted invoice page that lets the customer pay with either cards or bank details.

![An invoice page showing an itemized receipt, with options to pay with card or bank transfer](https://stripe.com/img/docs/billing/hosted-invoice-page.png)

```
admin.firestore().collection('invoices').add({
  email: 'someone@example.com',
  items: [{
    amount: 1999,
    currency: 'usd',
    description: 'My super cool item'
  },
  {
      amount: 540,
      currency: 'usd',
      description: 'Shipping cost'
  }],
})
```

## Pricing

This extension uses [Stripe Billing](https://stripe.com/pricing#billing-pricing).

It also uses Cloud Firestore and Cloud Functions on Google Cloud Platform.