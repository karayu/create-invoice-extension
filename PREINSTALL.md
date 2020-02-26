
An invoice is a document, associated with a sale, that a vendor provides a customer. It contains details about the exact goods or services in the sale and details on how the payment should be made. 

Stripe allows you to email beautiful invoices that offer multiple ways to pay with a hosted payment form. You can customize the invoice to use the logo and color theme of your business. Once you send the invoice you can track the whether the customer has paid through the Stripe Dashboard.

This extension sets up a Cloud Function that listens for Cloud Firestore events for a particular schema. The top-level required fields are `email` and `items`.

```
email: 'customer-email-address@example.com',
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

- `email` is the email address of your customer 
- `items` is a list of items to be itemized on the invoice

Stripe calculates the total amount and generates a hosted invoice page that allows the customer pay with either card or bank details. 

![An invoice page showing an itemized receipt, with options to pay with card or bank transfer](https://stripe.com/img/docs/billing/hosted-invoice-page.png)

That's it! Now your customer can pay you 💸.

## Pricing

This extension uses Cloud Firestore and Cloud Functions which may have associated charges depending on your plan.

It also uses [Stripe Billing](https://stripe.com/pricing#billing-pricing) to collect payments from your customers.