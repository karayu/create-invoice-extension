"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const admin = __importStar(require("firebase-admin"));
const functions = __importStar(require("firebase-functions"));
const stripe_1 = __importDefault(require("stripe"));
const logs = __importStar(require("./logs"));
const stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2019-12-03"
});
admin.initializeApp();
/* Creates a new invoice using Stripe */
const createInvoice = async function (customer, orderItems, daysUntilDue, idempotencyKey) {
    try {
        // Create an invoice item for each item in the datastore JSON
        const itemPromises = orderItems.map(item => {
            return stripe.invoiceItems.create({
                customer: customer.id,
                amount: item.amount,
                currency: item.currency,
                description: item.description
            }, { idempotencyKey: `invoiceItems-create-${idempotencyKey}` });
        });
        // Create the individual invoice items for this customer from the items in payload
        const items = await Promise.all(itemPromises);
        const invoice = await stripe.invoices.create({
            customer: customer.id,
            collection_method: "send_invoice",
            days_until_due: daysUntilDue,
            auto_advance: true
        }, { idempotencyKey: `invoices-create-${idempotencyKey}` });
        return invoice;
    }
    catch (e) {
        logs.stripeError(e);
        return null;
    }
};
/* Emails an invoice to a customer when a new document is created */
exports.sendInvoice = functions.handler.firestore.document.onCreate(async (snap, context) => {
    try {
        const payload = snap.data();
        const daysUntilDue = payload.daysUntilDue || Number(process.env.DAYS_UNTIL_DUE_DEFAULT);
        if (!(payload.email || payload.uid) || !payload.items.length) {
            logs.missingPayload(payload);
            return;
        }
        // Background functions fire "at least once"
        // https://firebase.google.com/docs/functions/locations#background_functions
        //
        // This event id will be the same for the same Firestore write
        // Use this as an idempotency key when calling the Stripe API
        const eventId = context.eventId;
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
            }, { idempotencyKey: `customers-create-${eventId}` });
            logs.customerCreated(customer.id);
        }
        const invoice = await createInvoice(customer, payload.items, daysUntilDue, eventId);
        if (invoice.id) {
            // Write the Stripe Invoice ID back to the document in Firestore
            // so that we can find it in the webhook
            await snap.ref.update({
                stripeInvoiceId: invoice.id,
                stripeInvoiceRecord: `https://dashboard.stripe.com/invoices/${invoice.id}`
            });
            // Email the invoice to the customer
            const result = await stripe.invoices.sendInvoice(invoice.id, { idempotencyKey: `invoices-sendInvoice-${eventId}` });
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
const relevantInvoiceEvents = new Set([
    "invoice.created",
    "invoice.finalized",
    "invoice.payment_failed",
    "invoice.payment_succeeded",
    "invoice.payment_action_required",
    "invoice.voided",
    "invoice.marked_uncollectible"
]);
/* A Stripe webhook that updates invoices in Firestore */
exports.updateInvoice = functions.handler.https.onRequest(async (req, resp) => {
    let event;
    // Instead of getting the `Stripe.Event`
    // object directly from `req.body`,
    // use the Stripe webhooks API to make sure
    // this webhook call came from a trusted source
    try {
        event = stripe.webhooks.constructEvent(req.rawBody, req.headers["stripe-signature"], process.env.STRIPE_ENDPOINT_SECRET);
    }
    catch (err) {
        console.log(`⚠️ Webhook signature verification failed.`);
        resp.sendStatus(400);
        return;
    }
    let invoice;
    let eventType;
    try {
        invoice = event.data.object;
        eventType = event.type;
    }
    catch (err) {
        resp.status(400).send(`Webhook Error: ${err.message}`);
    }
    if (!relevantInvoiceEvents.has(eventType)) {
        console.log(`Ignoring event "${eventType}" because it isn't a relevant part of the invoice lifecycle`);
        // Return a response to Stripe acknowledge receipt of the event
        resp.json({ received: true });
        return;
    }
    let invoicesInFirestore = await admin
        .firestore()
        .collection(process.env.DB_PATH)
        .where("stripeInvoiceId", "==", invoice.id)
        .get();
    // If we don't have exactly 1 invoice, something went wrong
    if (invoicesInFirestore.size !== 1) {
        throw new Error(`Expected 1 document with invoiceId "${invoice.id}", but found ${invoicesInFirestore.size}.`);
    }
    // Keep a special status for payment_failed
    // because otherwise the invoice would still be marked "open"
    const invoiceStatus = eventType === "invoice.payment_failed"
        ? "payment_failed"
        : invoice.status;
    const doc = invoicesInFirestore.docs[0];
    await doc.ref.update({
        stripeInvoiceStatus: invoiceStatus,
        lastStripeEvent: eventType
    });
    console.log(`Updated invoice "${invoice.id}" to status "${invoiceStatus}" on event type "${eventType}"`);
    // Return a response to Stripe to acknowledge receipt of the event
    resp.json({ received: true });
});
//# sourceMappingURL=index.js.map