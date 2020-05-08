# Send invoice using Stripe

**Description**: Creates and sends brandable customer invoices using the Stripe payments platform



**Details**: **IMPORTANT: This extension is part of the Firebase Alpha program. [Alpha extensions](https://accounts.google.com/AccountChooser?service=gerritcodereview&continue=https://dev-partners.googlesource.com/login/samples/firebase/extensions-alpha/) are confidential, and their functionality might change in backward-incompatible ways before official, public release. We do not recommend installing Alpha extensions in production apps.**

Use this extension to create and send brandable customer invoices using the payments platform [Stripe](https://www.stripe.com/).

The invoices are automatically customized with the logo and color theme of your business that you've set up in Stripe. After the invoice is sent, you can use the Stripe dashboard to track whether the customer has paid and how much money you processed with detailed reporting and charts.

This extension listens to your specified Cloud Firestore collection for new documents (like the example below). When you add a document, Stripe uses the invoice information in the document to create an invoice in their system then sends the invoice to the email address specified in the document. You can optionally manage your customer email addresses using [Firebase Authentication](https://firebase.google.com/docs/auth) user IDs. 

```js
email: "customer@example.com",
items: [{
    amount: 2000,
    currency: "usd",
    description: "Growth plan"
}]
```

Here's an example of what your customized invoice will look like!

![An invoice page showing an itemized receipt, with options to pay with card or bank transfer](https://www.gstatic.com/mobilesdk/200421_mobilesdk/hosted-invoice-page.png)

An optional feature of this extension is to automatically update the invoice's status in its Cloud Firestore document. You can configure this feature after installing the extension by registering a Stripe webhook that listens for [Stripe invoice events](https://stripe.com/docs/api/events/types#event_types-invoice.created). If you want to use this optional feature, leave the parameter `Stripe webhook secret` empty during installation, then reconfigure your installed extension later with the actual value for your registered webhook. More details about this process are provided after installation.

#### Additional setup

Before installing this extension, set up the following Firebase services in your Firebase project:

* [Cloud Firestore](https://firebase.google.com/docs/firestore) to store invoice information and optionally invoice status
* [Firebase Authentication](https://firebase.google.com/docs/auth) to optionally manage email and customer data

You must also have a Stripe account and a [Stripe API key](https://dashboard.stripe.com/apikeys) before installing this extension.

**Note:** Stripe has a test mode that lets you make API calls without making actual payments. To use this extension with Stripe's test mode, set the extension's `Stripe secret API key` parameter (during extension configuration) to use the test mode key. A test mode key looks like `sk_test_12345`, whereas a live mode key would be `sk_12345`.

#### Pricing

This extension uses the following Firebase services which may have associated charges:

* Cloud Firestore
* Cloud Functions
* Firebase Authentication (optional)

When you use Firebase Extensions, you're only charged for the underlying resources that you use. A paid-tier billing plan is only required if the extension uses a service that requires a paid-tier plan, for example calling to a Google Cloud Platform API or making outbound network requests to non-Google services. All Firebase services offer a free tier of usage. [Learn more about Firebase billing.](https://firebase.google.com/pricing)

Usage of this extension also requires you to have a Stripe account. You are responsible for any associated costs with your usage of Stripe and the [Stripe Billing product](https://stripe.com/pricing#billing-pricing).




**Configuration Parameters:**

* Cloud Functions deployment location: Where do you want to deploy the functions created for this extension? You usually want a location close to your database. For help selecting a location, refer to the [location selection guide](https://firebase.google.com/docs/functions/locations).

* Invoices collection: What is the path to the Cloud Firestore collection where you'll store your invoices?

* Stripe secret API key: What is your Stripe secret API key for sending invoices? If desired, you can optionally use a test mode API key for initial testing of your extension, but you'll need to later reconfigure your extension to use a live mode key. Learn more about API keys in your [Stripe dashboard](https://dashboard.stripe.com/apikeys).

* Days until payment is due: What is the default number of days the customer has before their payment is due? The invoice automatically closes after this number of days. You can override this default value for each invoice.

* Stripe webhook secret: This is your signing secret for a Stripe-registered webhook that updates each Cloud Firestore document with the invoice's status from the Stripe dashboard. This webhook can only be registered after installation. To use this optional feature, leave this value empty during installation, then follow the postinstall instructions for registering your webhook and configuring this value.



**Cloud Functions:**

* **sendInvoice:** Creates a Stripe Invoice when a new invoice document is created in your specified Cloud Firestore collection

* **updateInvoice:** If registered as a Stripe webhook, this function updates the appropriate invoice document in Cloud Firestore when a new Stripe Event is received.



**Access Required**:



This extension will operate with the following project IAM roles:

* firebaseauth.viewer (Reason: Allows the extension to find the email of a user based on their Firebase Authentication user ID.)

* datastore.user (Reason: Allows the extension to update invoices in Cloud Firestore with data from Stripe.)
