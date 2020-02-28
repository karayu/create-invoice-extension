"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function start() {
    console.log("🙂 Received event, starting the process");
}
exports.start = start;
function error(err) {
    console.log("😞[Error] Unhandled error occurred during processing:", err);
}
exports.error = error;
function missingPayload(payload) {
    if (!payload.items.length) {
        console.log("😞[Error] Missing at least one line item in items[]");
    }
    if (!payload.email && !payload.uid) {
        console.log("😞[Error] Missing either a customer email address or Firebase Auth uid ");
    }
}
exports.missingPayload = missingPayload;
function stripeError(err) {
    console.log("😞[Error] An error happened when making a request to the Stripe API:", err);
}
exports.stripeError = stripeError;
function invoiceCreatedError(invoice) {
    console.log("😞[Error] Error when creating the invoice:", invoice);
}
exports.invoiceCreatedError = invoiceCreatedError;
function customerCreated(id) {
    console.log(`👤 Created a new customer: https://dashboard.stripe.com/test/customers/${id}`);
}
exports.customerCreated = customerCreated;
function customerRetrieved(id, email) {
    console.log(`🙋 Found existing customer with email ${email}: https://dashboard.stripe.com/test/customers/${id}`);
}
exports.customerRetrieved = customerRetrieved;
function invoiceCreated(id) {
    console.log(`🧾 Created invoice: https://dashboard.stripe.com/test/invoices/${id}`);
}
exports.invoiceCreated = invoiceCreated;
function invoiceSent(id, email, hostedInvoiceUrl) {
    console.log(`📧 Sent invoice ${id} to ${email}: ${hostedInvoiceUrl}`);
}
exports.invoiceSent = invoiceSent;
//# sourceMappingURL=logs.js.map