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
const stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2019-12-03"
});
const createInvoice = async function (customer, orderItems) {
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
            days_until_due: 7,
            auto_advance: true
        });
        return invoice;
    }
    catch (e) {
        logs.stripeError(e);
        return null;
    }
};
// TODO: Use Firestore instead of realtime db and have it take collection name
exports.sendInvoice = functions.handler.database.ref.onCreate(async (snap) => {
    const data = snap.val();
    try {
        const payload = JSON.parse(snap.val());
        if (!payload.email || !payload.items.length) {
            console.log("Malformed payload", payload);
            return;
        }
        logs.start();
        // Check to see if we already have a Customer record in Stripe with email address
        let customers = await stripe.customers.list({ email: payload.email });
        let customer;
        if (customers.data.length) {
            customer = customers.data[0];
            logs.customerRetrieved(customer.id, payload.email);
        }
        else {
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