import Stripe from "stripe";
import { InvoicePayload } from "./interfaces";

export function startInvoiceCreate() {
  console.log("🙂 Received new invoice, starting processing");
}

export function startInvoiceUpdate(eventType: string) {
  console.log(`🙂 Received new invoice event "eventType", starting processing`);
}

export function error(err: Error) {
  console.error("😞[Error] Unhandled error occurred during processing", err);
}

export function missingPayload(payload: InvoicePayload) {
  if (!payload.items.length) {
    console.error(
      new Error("😞[Error] Missing at least one line item in items[]")
    );
  }
  if (!payload.email && !payload.uid) {
    console.error(
      new Error(
        "😞[Error] Missing either a customer email address or Firebase Auth uid"
      )
    );
  }
}

export function stripeError(err: Stripe.StripeCardError) {
  console.error(
    "😞[Error] An error happened when making a request to the Stripe API:",
    err
  );
}

export function invoiceCreatedError(invoice: Stripe.Invoice) {
  console.error(
    new Error("😞[Error] Error when creating the invoice:"),
    invoice
  );
}

export function customerCreated(id: string) {
  console.log(
    `👤 Created a new customer: https://dashboard.stripe.com/test/customers/${id}`
  );
}

export function customerRetrieved(id: string) {
  console.log(
    `🙋 Found existing customer by email: https://dashboard.stripe.com/test/customers/${id}`
  );
}

export function invoiceCreated(id: string) {
  console.log(
    `🧾 Created invoice: https://dashboard.stripe.com/test/invoices/${id}`
  );
}

export function invoiceSent(
  id: string,
  email: string,
  hostedInvoiceUrl: string
) {
  console.log(`📧 Sent invoice ${id} to ${email}: ${hostedInvoiceUrl}`);
}

export function badSignature(err: Error) {
  console.error(
    "😞[Error] Webhook signature verification failed. Is your STRIPE_ENDPOINT_SECRET configured correctly?",
    err
  );
}

export function malformedEvent(event: Stripe.Event) {
  let err;

  if (!event?.data?.object) {
    err = new Error("Could not find event.data.object");
  } else if (!event?.type) {
    err = new Error("Could not find event.type");
  }

  console.error("😞[Error] Malformed event", err);
}

export function ignoreEvent(eventType: string) {
  console.log(
    `🙈 Ignoring event "${eventType}" because it because it isn't a relevant part of the invoice lifecycle`
  );
}

export function unexpectedInvoiceAmount(
  numInvoices: number,
  invoiceId: string
) {
  console.error(
    "😞[Error] could not find invoice",
    new Error(
      `Expected 1 invoice with ID "${invoiceId}", but found ${numInvoices}`
    )
  );
}

export function statusUpdateComplete(
  invoiceId: string,
  newStatus: string,
  eventType: string
) {
  console.log(
    `🙂 Updated invoice "${invoiceId}" to status "${newStatus}" on event type "${eventType}"`
  );
}
