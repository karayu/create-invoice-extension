
An invoice is a document, associated with a sale, that a vendor provides a customer. It contains details about the exact goods or services in the sale and details on how the payment should be made. 

[Stripe](https://stripe.com/) is a payments platform that lets you send hosted invoices to your customers. You can customize the invoice to use the logo and color theme of your business. Once you send the invoice, use the Stripe dashboard to track the whether the customer has paid and how much money you processed with detailed reporting and charts.

This extension requires a Stripe account ([sign up](http://dashboard.stripe.com/register) today!) and a previously configured Firestore collection. Upon installation, the extension sets up a Cloud Function that is triggered when you add a document to the Firestore collection. For example this document:

```
email: 'jenny-rosen@example.com',
items: [{
    amount: 2000,
    currency: 'usd',
    description: 'Growth plan'
}]
```

will send an invoice to jenny-rosen@example that looks like:

![An invoice page showing an itemized receipt, with options to pay with card or bank transfer](https://stripe.com/img/docs/billing/hosted-invoice-page.png)

That's it, now you have a way to easily collect payments 💸!

## Pricing

This extension uses Cloud Firestore and Cloud Functions which may have associated charges depending on your plan. It also allows you to optionally use Firebase Auth to manage email and customer data.  

It also uses [Stripe Billing](https://stripe.com/pricing#billing-pricing) to collect payments from your customers and send invoices. You are responsible for any associated costs with your usage of Stripe. 