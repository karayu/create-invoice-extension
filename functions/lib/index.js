"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const stripeClient = require("stripe");
const functions = require("firebase-functions");
const logs = require("./logs");
const stripe = stripeClient("sk_test_5SHRAcQ7me1GkzbvoQznE1i5009MwZMGh4");
exports.sendInvoice = functions.database
    .ref("/invoices/{id}")
    .onCreate(async (snap) => {
    try {
        const payload = snap.val();
        if (!payload.email || !payload.items.length) {
            console.log("Malformed payload", payload);
            return;
        }
        logs.start();
        let customer = await stripe.customers.list({ email: payload.email });
        if (customer.data.length) {
            customer = customer.data[0];
            logs.customerRetrieved(customer.id, payload.email);
        }
        else {
            customer = await stripe.customers.create({
                email: payload.email,
                metadata: {
                    createdFrom: "firebase function"
                }
            });
            logs.customerCreated(customer.id);
        }
        const itemPromises = payload.items.map(item => {
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
            days_until_due: "7",
            auto_advance: true
        });
        if (invoice.id) {
            // Stripe sends an email to the customer
            const result = await stripe.invoices.sendInvoice(invoice.id);
            if (result.status === "open") {
                logs.invoiceSent(result.id, payload.email, result.hosted_invoice_url);
            }
        }
    }
    catch (e) {
        logs.error(e);
    }
    return;
});
//# sourceMappingURL=index.js.map