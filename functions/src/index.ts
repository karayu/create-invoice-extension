import Stripe from "stripe";
import * as functions from "firebase-functions";
import { InvoicePayload, OrderItem } from "./interfaces";
import * as logs from "./logs";

const admin = require("firebase-admin");
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2019-12-03"
});

admin.initializeApp();

const createInvoice = async function(
  customer: Stripe.Customer,
  orderItems: Array<OrderItem>,
  daysUntilDue: number
) {
  try {
    // Create an invoice item for each item in the datastore JSON
    const itemPromises: Array<Promise<Stripe.InvoiceItem>> = orderItems.map(
      item => {
        return stripe.invoiceItems.create({
          customer: customer.id,
          amount: item.amount,
          currency: item.currency,
          description: item.description
        });
      }
    );

    // Create the individual invoice items for this customer
    const items: Array<Stripe.InvoiceItem> = await Promise.all(itemPromises);

    // Create an invoice
    const invoice: Stripe.Invoice = await stripe.invoices.create({
      customer: customer.id,
      collection_method: "send_invoice",
      days_until_due: daysUntilDue, // TODO: Make this configurable with default of 7 days
      auto_advance: true
    });

    return invoice;
  } catch (e) {
    logs.stripeError(e);
    return null;
  }
};

// TODO: Use Firestore instead of realtime db and have it take collection name
export const sendInvoice = functions.handler.firestore.document.onCreate(
  async snap => {
    try {
      const payload = snap.data() as InvoicePayload;
      const daysUntilDue =
        payload.daysUntilDue || Number(process.env.DAYS_UNTIL_DUE_DEFAULT);

      if (!(payload.email || payload.uid) || !payload.items.length) {
        logs.missingPayload(payload);
        return;
      }

      logs.start();

      let email;

      if (payload.uid) {
        // Look up the Firebase Auth UserRecord to get the email
        const user = await admin.auth().getUser(payload.uid);
        email = user.email;
      } else {
        // Use the email provided in the payload
        email = payload.email;
      }

      // Check to see if we already have a Customer record in Stripe with email address
      let customers: Stripe.ApiList<
        Stripe.Customer
      > = await stripe.customers.list({ email: payload.email });
      let customer: Stripe.Customer;

      if (customers.data.length) {
        // Use the existing customer
        customer = customers.data[0];
        logs.customerRetrieved(customer.id, payload.email);
      } else {
        // Create new Customer on Stripe with email
        customer = await stripe.customers.create({
          email,
          metadata: {
            createdBy: "Created by Stripe Firebase extension" // optional metadata, adds a note
          }
        });

        logs.customerCreated(customer.id);
      }

      const invoice: Stripe.Invoice = await createInvoice(
        customer,
        payload.items,
        daysUntilDue
      );

      if (invoice.id) {
        // Email the invoice to the customer
        const result: Stripe.Invoice = await stripe.invoices.sendInvoice(
          invoice.id
        );
        if (result.status === "open") {
          // Successfully emailed the invoice
          logs.invoiceSent(result.id, payload.email, result.hosted_invoice_url);
        } else {
          logs.invoiceCreatedError(result);
        }
      } else {
        logs.invoiceCreatedError(invoice);
      }
    } catch (e) {
      logs.error(e);
    }
    return;
  }
);
