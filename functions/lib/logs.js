"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function startInvoiceCreate() {
    console.log("🙂 Received new invoice, starting processing");
}
exports.startInvoiceCreate = startInvoiceCreate;
function startInvoiceUpdate(eventType) {
    console.log(`🙂 Received new invoice event ${eventType}, starting processing`);
}
exports.startInvoiceUpdate = startInvoiceUpdate;
function error(err) {
    console.error("😞[Error] Unhandled error occurred during processing", err);
}
exports.error = error;
function missingPayload(payload) {
    if (!payload.items.length) {
        console.error(new Error("😞[Error] Missing at least one line item in items[]"));
    }
    if (!payload.email && !payload.uid) {
        console.error(new Error("😞[Error] Missing either a customer email address or Firebase Auth uid"));
    }
}
exports.missingPayload = missingPayload;
function stripeError(err) {
    console.error("😞[Error] An error happened when making a request to the Stripe API:", err);
}
exports.stripeError = stripeError;
function invoiceCreatedError(invoice) {
    console.error(new Error("😞[Error] Error when creating the invoice:"), invoice);
}
exports.invoiceCreatedError = invoiceCreatedError;
function customerCreated(id) {
    console.log(`👤 Created a new customer: https://dashboard.stripe.com/test/customers/${id}`);
}
exports.customerCreated = customerCreated;
function customerRetrieved(id) {
    console.log(`🙋 Found existing customer by email: https://dashboard.stripe.com/test/customers/${id}`);
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
function badSignature(err) {
    console.error("😞[Error] Webhook signature verification failed. Is your STRIPE_WEBHOOK_SECRET configured correctly?", err);
}
exports.badSignature = badSignature;
function malformedEvent(event) {
    var _a, _b, _c;
    let err;
    if (!((_b = (_a = event) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.object)) {
        err = new Error("Could not find event.data.object");
    }
    else if (!((_c = event) === null || _c === void 0 ? void 0 : _c.type)) {
        err = new Error("Could not find event.type");
    }
    console.error("😞[Error] Malformed event", err);
}
exports.malformedEvent = malformedEvent;
function ignoreEvent(eventType) {
    console.log(`🙈 Ignoring event "${eventType}" because it because it isn't a relevant part of the invoice lifecycle`);
}
exports.ignoreEvent = ignoreEvent;
function unexpectedInvoiceAmount(numInvoices, invoiceId) {
    console.error("😞[Error] could not find invoice", new Error(`Expected 1 invoice with ID "${invoiceId}", but found ${numInvoices}`));
}
exports.unexpectedInvoiceAmount = unexpectedInvoiceAmount;
function statusUpdateComplete(invoiceId, newStatus, eventType) {
    console.log(`🙂 Updated invoice "${invoiceId}" to status "${newStatus}" on event type "${eventType}"`);
}
exports.statusUpdateComplete = statusUpdateComplete;
//# sourceMappingURL=logs.js.map