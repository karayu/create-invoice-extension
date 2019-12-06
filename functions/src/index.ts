import * as Stripe from "stripe";
import * as functions from "firebase-functions";
import * as logs from "./logs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

interface InvoicePayload {
  email: string;
  items: [OrderItem];
}

interface OrderItem {
  amount: number;
  currency: string;
  description: string;
}

const createInvoice = async function(
  customer: Stripe.customers.ICustomer,
  orderItems: Array<OrderItem>
) {
  try {
    // Create an invoice item for each item in the datastore JSON
    const itemPromises = orderItems.map(item => {
      return stripe.invoiceItems.create({
        customer: customer.id,
        amount: item.amount,
        currency: item.currency,
        description: item.description
      });
    });

    // Create the individual invoice items for this customer
    const items = await Promise.all(itemPromises);

    // Create an invoice
    const invoice = await stripe.invoices.create({
      customer: customer.id,
      collection_method: "send_invoice",
      days_until_due: 7, // TODO: Make this configurable with default of 7 days
      auto_advance: true
    });
    
    return invoice;
  } catch (e) {
    logs.stripeError(e);
    return null;
  }
};

// TODO: Use Firestore instead of realtime db and have it take collection name
export const sendInvoice = functions.database
  .ref("/invoices/{id}")
  .onCreate(async snap => {
    try {
      const payload = JSON.parse(snap.val()) as InvoicePayload;

      if (!payload.email || !payload.items.length) {
        console.log("Malformed payload", payload);
        return;
      }

      logs.start();

      // Check to see if we already have a Customer record in Stripe with email address
      let customers = await stripe.customers.list({ email: payload.email });
      let customer;

      if (customer.data.length) {
        customer = customers.data[0];
        logs.customerRetrieved(customer.id, payload.email);
      } else {
        // Create new Customer on Stripe with email
        // TODO: Allow more customization of Customer information (e.g. name)
        customer = await stripe.customers.create({
          email: payload.email,
          metadata: {
            createdFrom: "Created by Firebase extension" // optional metadata, adds a note
          }
        });
        logs.customerCreated(customer.id);
      }

      const invoice = await createInvoice(customer, payload.items);

      if (invoice.id) {
        // Stripe sends an email to the customer
        const result = await stripe.invoices.sendInvoice(invoice.id);
        if (result.status === "open") {
          logs.invoiceSent(result.id, payload.email, result.hosted_invoice_url);
        }
      } else {
        logs.invoiceCreatedError(invoice);
      }
    } catch (e) {
      logs.error(e);
    }
    return;
  });
