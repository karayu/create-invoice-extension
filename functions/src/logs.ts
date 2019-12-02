export function start() {
  console.log("🙂 Received event, starting the process");
}

export function error(err: Error) {
  console.log("😞 Unhandled error occurred during processing:", err);
}

export function invoiceCreatedError(invoice: object) {
  console.log("😞 Error when creating the invoice:", invoice);
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
