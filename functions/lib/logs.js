"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function start() {
    console.log("🙂 Received event, starting the process");
}
exports.start = start;
function error(err) {
    console.log("😞 Unhandled error occurred during processing:", err);
}
exports.error = error;
function stripeError(err) {
    console.log("😞 An error happened when making a request to the Stripe API:", err);
}
exports.stripeError = stripeError;
function invoiceCreatedError(invoice) {
    console.log("😞 Error when creating the invoice:", invoice);
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