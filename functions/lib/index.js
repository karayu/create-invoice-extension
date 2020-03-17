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
const admin = __importStar(require("firebase-admin"));
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
            // Write the Stripe Invoice ID back to the document in Firestore
            // so that we can find it in the webhook
            await snap.ref.update({
                stripeInvoiceId: invoice.id
            });
            // Email the invoice to the customer
            const result = await stripe.invoices.sendInvoice(invoice.id);
            if (result.status === "open") {
                // Successfully emailed the invoice
                logs.invoiceSent(result.id, email, result.hosted_invoice_url);
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
// call this function to easily
exports.dummyData = functions.handler.https.onRequest(async (req, resp) => {
    const db = admin.firestore();
    db.collection(process.env.DB_PATH).add({
        email: "test@tester.com",
        items: [
            {
                amount: 2000,
                currency: "usd",
                description: "Growth plan"
            }
        ]
    });
});
const relevantInvoiceEvents = new Set([
    "invoice.created",
    "invoice.finalized",
    "invoice.payment_failed",
    "invoice.payment_succeeded"
]);
exports.updateInvoice = functions.handler.https.onRequest(async (req, resp) => {
    let invoice;
    let event;
    try {
        invoice = req.body.data.object;
        event = req.body.type;
    }
    catch (err) {
        resp.status(400).send(`Webhook Error: ${err.message}`);
    }
    if (!relevantInvoiceEvents.has(event)) {
        console.log(`Ignoring event "${event}" because it isn't a relevant part of the invoice lifecycle`);
        // Return a response to acknowledge receipt of the event
        resp.json({ received: true });
        return;
    }
    let invoicesInFirestore = await admin
        .firestore()
        .collection(process.env.DB_PATH)
        .where("stripeInvoiceId", "==", invoice.id)
        .get();
    // If we don't have exactly 1 invoice, something went wrong
    if (invoicesInFirestore.size === 0) {
        // throw new Error(`Could not find invoiceId "${invoice.id}"`);
        /// TEMPORARY
        await admin
            .firestore()
            .collection(process.env.DB_PATH)
            .add({
            stripeInvoiceId: invoice.id,
            email: "test@tester.com",
            items: [
                {
                    amount: 2000,
                    currency: "usd",
                    description: "Growth plan"
                }
            ]
        });
        invoicesInFirestore = await admin
            .firestore()
            .collection(process.env.DB_PATH)
            .where("stripeInvoiceId", "==", invoice.id)
            .get();
        ///
    }
    else if (invoicesInFirestore.size > 1) {
        throw new Error(`Found multiple items matching invoiceId "${invoice.id}"`);
    }
    const doc = invoicesInFirestore.docs[0];
    await doc.ref.update({
        stripeInvoiceStatus: event
    });
    console.log(`Updated invoice "${invoice.id}" to status "${event}"`);
    resp.json({ received: true });
});
//# sourceMappingURL=index.js.map