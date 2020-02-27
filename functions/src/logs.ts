import Stripe from "stripe";
import { InvoicePayload } from "./interfaces";

export function start() {
  console.log("🙂 Received event, starting the process");
}

export function error(err: Error) {
  console.log("😞[Error] Unhandled error occurred during processing:", err);
}

export function missingPayload(payload: InvoicePayload) {
  if (!payload.items.length) {
    console.log("😞[Error] Missing at least one line item in items[]");
  }
  if (!payload.email && !payload.uid) {
    console.log(
      "😞[Error] Missing either a customer email address or Firebase Auth uid "
    );
  }
}

export function stripeError(err: Stripe.StripeCardError) {
  console.log(
    "😞[Error] An error happened when making a request to the Stripe API:",
    err
  );
}

export function invoiceCreatedError(invoice: Stripe.Invoice) {
  console.log("😞[Error] Error when creating the invoice:", invoice);
}

export function customerCreated(id: string) {
  console.log(
    `👤 Created a new customer: https://dashboard.stripe.com/test/customers/${id}`
  );
}

export function customerRetrieved(id: string, email: string) {
  console.log(
    `🙋 Found existing customer with email ${email}: https://dashboard.stripe.com/test/customers/${id}`
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
