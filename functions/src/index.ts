import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
import Stripe from "stripe";
import { InvoicePayload, OrderItem } from "./interfaces";
import * as logs from "./logs";
import config from "./config";

const stripe = new Stripe(config.stripeSecretKey, {
  apiVersion: "2019-12-03",
  // Register extension as a Stripe plugin
  // https://stripe.com/docs/building-plugins#setappinfo
  appInfo: {
    name: "Firebase firestore-invoice-stripe",
    version: "0.1.0"
  }
});

admin.initializeApp();

/* Creates a new invoice using Stripe */
const createInvoice = async function(
  customer: Stripe.Customer,
  orderItems: Array<OrderItem>,
  daysUntilDue: number,
  idempotencyKey: string
) {
  try {
    // Create an invoice item for each item in the document
    const itemPromises: Array<Promise<Stripe.InvoiceItem>> = orderItems.map(
      item => {
        return stripe.invoiceItems.create(
          {
            customer: customer.id,
            amount: item.amount,
            currency: item.currency,
            description: item.description
          },
          { idempotencyKey: `invoiceItems-create-${idempotencyKey}` }
        );
      }
    );

    // Create the individual invoice items for this customer from the items in payload
    const items: Array<Stripe.InvoiceItem> = await Promise.all(itemPromises);

    const invoice: Stripe.Invoice = await stripe.invoices.create(
      {
        customer: customer.id,
        collection_method: "send_invoice",
        days_until_due: daysUntilDue,
        auto_advance: true
      },
      { idempotencyKey: `invoices-create-${idempotencyKey}` }
    );
    logs.invoiceCreated(invoice.id, invoice.livemode)
    return invoice;
  } catch (e) {
    logs.stripeError(e);
    return null;
  }
};

/* Emails an invoice to a customer when a new document is created */
export const sendInvoice = functions.handler.firestore.document.onCreate(
  async (snap, context) => {
    try {
      const payload = snap.data() as InvoicePayload;
      const daysUntilDue =
        payload.daysUntilDue || config.daysUntilDue;

      if (!(payload.email || payload.uid) || !payload.items.length) {
        logs.missingPayload(payload);
        return;
      }

      // Background functions fire "at least once"
      // https://firebase.google.com/docs/functions/locations#background_functions
      //
      // This event ID will be the same for the same Cloud Firestore write
      // Use this as an idempotency key when calling the Stripe API
      const eventId = context.eventId;

      logs.startInvoiceCreate();

      let email;

      if (payload.uid) {
        // Look up the Firebase Authentication UserRecord to get the email
        const user = await admin.auth().getUser(payload.uid);
        email = user.email;
      } else {
        // Use the email provided in the payload
        email = payload.email;
      }

      // Check to see if there's a Stripe customer associated with the email address
      let customers: Stripe.ApiList<Stripe.Customer> = await stripe.customers.list(
        { email: payload.email }
      );
      let customer: Stripe.Customer;

      if (customers.data.length) {
        // Use the existing customer
        customer = customers.data[0];
        logs.customerRetrieved(customer.id, customer.livemode);
      } else {
        // Create new Stripe customer with this email
        customer = await stripe.customers.create(
          {
            email,
            metadata: {
              createdBy: "Created by the Firebase Extension: Send Invoices using Stripe" // optional metadata, adds a note
            }
          },
          { idempotencyKey: `customers-create-${eventId}` }
        );

        logs.customerCreated(customer.id, customer.livemode);
      }

      const invoice: Stripe.Invoice = await createInvoice(
        customer,
        payload.items,
        daysUntilDue,
        eventId
      );

      if (invoice) {
        // Write the Stripe Invoice ID back to the document in Cloud Firestore
        // so that we can find it in the webhook
        await snap.ref.update({
          stripeInvoiceId: invoice.id,
          stripeInvoiceRecord: `https://dashboard.stripe.com${invoice.livemode ? "" : "/test"}/invoices/${invoice.id}`
        });

        // Email the invoice to the customer
        const result: Stripe.Invoice = await stripe.invoices.sendInvoice(
          invoice.id,
          { idempotencyKey: `invoices-sendInvoice-${eventId}` }
        );
        if (result.status === "open") {
          // Successfully emailed the invoice
          logs.invoiceSent(result.id, email, result.hosted_invoice_url);
        } else {
          logs.invoiceCreatedError(result);
        }
      } else {
        logs.invoiceCreatedError();
      }
    } catch (e) {
      logs.error(e);
    }
    return;
  }
);

const relevantInvoiceEvents = new Set([
  "invoice.created",
  "invoice.finalized",
  "invoice.payment_failed",
  "invoice.payment_succeeded",
  "invoice.payment_action_required",
  "invoice.voided",
  "invoice.marked_uncollectible"
]);

/* A Stripe webhook that updates each invoice's status in Cloud Firestore */
export const updateInvoice = functions.handler.https.onRequest(
  async (req: functions.https.Request, resp) => {
    let event: Stripe.Event;

    // Instead of getting the `Stripe.Event`
    // object directly from `req.body`,
    // use the Stripe webhooks API to make sure
    // this webhook call came from a trusted source
    try {
      event = stripe.webhooks.constructEvent(
        req.rawBody,
        req.headers["stripe-signature"],
        config.stripeWebhookSecret
      );
    } catch (err) {
      logs.badSignature(err);
      resp.status(401).send("Webhook Error: Invalid Secret");
      return;
    }

    let invoice: Stripe.Invoice;
    let eventType: string;

    try {
      invoice = event.data.object as Stripe.Invoice;
      eventType = event.type;
    } catch (err) {
      logs.malformedEvent(event);
      resp.status(400).send(`Webhook Error: ${err.message}`);
      return;
    }

    if (!relevantInvoiceEvents.has(eventType)) {
      logs.ignoreEvent(eventType);

      // Return a response to Stripe to acknowledge receipt of the event
      resp.json({ received: true });
      return;
    }

    logs.startInvoiceUpdate(eventType);

    let invoicesInFirestore = await admin
      .firestore()
      .collection(config.invoicesCollectionPath)
      .where("stripeInvoiceId", "==", invoice.id)
      .get();

    if (invoicesInFirestore.size !== 1) {
      logs.unexpectedInvoiceAmount(invoicesInFirestore.size, invoice.id);

      resp.status(500).send(`Invoice not found.`);
      return;
    }

    // Keep a special status for `payment_failed`
    // because otherwise the invoice would still be marked `open`
    const invoiceStatus =
      eventType === "invoice.payment_failed"
        ? "payment_failed"
        : invoice.status;

    const doc = invoicesInFirestore.docs[0];
    await doc.ref.update({
      stripeInvoiceStatus: invoiceStatus,
      lastStripeEvent: eventType
    });

    logs.statusUpdateComplete(invoice.id, invoiceStatus, eventType);

    // Return a response to Stripe to acknowledge receipt of the event
    resp.json({ received: true });
  }
);
