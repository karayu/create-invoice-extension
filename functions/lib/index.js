"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const stripe_1 = __importDefault(require("stripe"));
const functions = __importStar(require("firebase-functions"));
const logs = __importStar(require("./logs"));
const admin = require("firebase-admin");
const stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2019-12-03"
});
admin.initializeApp();
/* Creates a new invoice using Stripe */
const createInvoice = async function (customer, orderItems, daysUntilDue) {
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
        // Create the individual invoice items for this customer from the items in payload
        const items = await Promise.all(itemPromises);
        const invoice = await stripe.invoices.create({
            customer: customer.id,
            collection_method: "send_invoice",
            days_until_due: daysUntilDue,
            auto_advance: true
        });
        return invoice;
    }
    catch (e) {
        logs.stripeError(e);
        return null;
    }
};
/* Emails an invoice to a customer when a new document is created */
exports.sendInvoice = functions.handler.firestore.document.onCreate(async (snap) => {
    try {
        const payload = snap.data();
        const daysUntilDue = payload.daysUntilDue || Number(process.env.DAYS_UNTIL_DUE_DEFAULT);
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
        }
        else {
            // Use the email provided in the payload
            email = payload.email;
        }
        // Check to see if we already have a customer in Stripe with email address
        let customers = await stripe.customers.list({ email: payload.email });
        let customer;
        if (customers.data.length) {
            // Use the existing customer
            customer = customers.data[0];
            logs.customerRetrieved(customer.id, payload.email);
        }
        else {
            // Create new customer on Stripe with email
            customer = await stripe.customers.create({
                email,
                metadata: {
                    createdBy: "Created by Stripe Firebase extension" // optional metadata, adds a note
                }
            });
            logs.customerCreated(customer.id);
        }
        const invoice = await createInvoice(customer, payload.items, daysUntilDue);
        if (invoice.id) {
            // Email the invoice to the customer
            const result = await stripe.invoices.sendInvoice(invoice.id);
            if (result.status === "open") {
                // Successfully emailed the invoice
                logs.invoiceSent(result.id, payload.email, result.hosted_invoice_url);
            }
            else {
                logs.invoiceCreatedError(result);
            }
        }
        else {
            logs.invoiceCreatedError(invoice);
        }
    }
    catch (e) {
        logs.error(e);
    }
    return;
});
//# sourceMappingURL=index.js.map