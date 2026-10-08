# Smart Chomka commerce — local working version

Start from this directory with `python server.py --port 8766` (Python 3.11+, standard library only).

- Buyer app: http://127.0.0.1:8766/#market → ទិញក្នុងកម្មវិធី
- Seller/admin app: http://127.0.0.1:8766/admin/
- Persistent SQLite database: `data/commerce.sqlite3`, outside the public web directory.

On first launch create an admin username and a password of at least 12 characters. The server binds only to this computer. There is no default password. Sessions expire after eight hours and are cleared when the server restarts.

## Seller workflow

The 20 researched catalogue listings are imported as drafts, with no price and zero stock. They do not establish a supplier agreement or imply goods are available. Edit a product to set its selling unit, USD price, actual stock, description, category and image URL. Publish to make it available in the buyer app. Unpublish instead of deleting products used by orders. Additional products, including farmer durian, can be entered in the admin app.

Stock uses whole selling units (for example a 1 kg unit or 25 kg bag). Price uses integer USD cents. A version check prevents stale admin edits from overwriting stock changes caused by checkout.

Order states: pending → confirmed → shipped → fulfilled, or pending/confirmed → cancelled. Admin may also complete a confirmed pickup order after payment is recorded. Placing an order reserves stock. Cancellation restores it exactly once. A paid cancellation requires a separate manual refund; this app does not initiate bank refunds.

## Payments

Cash on delivery is available immediately. Payment settings accepts the real merchant name and a PNG/JPG/WebP merchant KHQR image up to 1 MB. Use a QR for the intended USD merchant account. KHQR is unavailable until configured. Checkout displays a static merchant QR with the amount and order reference separately; it does not generate dynamic KHQR, validate the QR payload, contact a bank or verify receipt automatically. Check the bank account and amount before clicking **Confirm received**. Clearing the QR disables new KHQR checkouts. Set a flat USD delivery fee in Payment settings (0 means free delivery). Checkout includes this fee, and the server rejects changed fees until the buyer reviews checkout again. Each order preserves its original fee. Confirm delivery arrangements directly with the customer.

## Database tables

| Table | Contents |
|---|---|
| products | Product fields, price, available stock, publication state, edit version |
| orders | Customer/address, totals, order/payment status, private receipt token, deduplication key |
| order_items | Product name, unit and price snapshots at purchase |
| stock_movements | Admin adjustments, reservations and cancellation returns |
| admins | Salted scrypt password hashes |
| settings | Merchant name and QR image |

Admin tables show products, orders and the latest 200 stock movements. Customer receipts require their random private token; no public customer/order list exists. The buyer browser retains its most recent receipt and cart. New checkout requires a shared customer login. Earlier guest orders retain their private receipt access and are not automatically claimed by a phone number. The original device-only profile can still be used for offline browsing, but does not authenticate purchases.

For a consistent backup while running, use Python SQLite's `Connection.backup()`; do not copy only the database file while WAL writes are active. The database contains customer contact/address data and should not be published or committed.

## Validation

`python -m unittest -v test_server.py` uses an isolated temporary database. Tests cover admin access, request origins, first-run setup, concurrent stock reservation, current-price checks, duplicate submissions, receipt access, cancellation, KHQR configuration/manual payment confirmation and stale stock edits.

Browser checks and screenshots are in `../output/smart-chomka-market/`. Browser tests use a separate test database on port 8767; test products, passwords, orders and QR images are never inserted into the actual database.

## Hosting boundary

This is a local working system, not a deployed public shop. Existing Vercel deployment and Android APK have not been updated. The original farmer listing editor remains a device-local draft tool; admin-published durian can be purchased through the new shop. The supplier catalogue remains a research catalogue separate from the actual inventory.

Public launch needs a hosted backend with persistent storage and HTTPS, deployment configuration for the buyer app, restricted admin provisioning, abuse controls on guest orders, operational backups and a decision about delivery fees. Automatic payment verification needs the merchant's bank/payment integration. Do not deploy this local standard-library server directly as an internet service or place SQLite on Vercel's ephemeral function storage.


## Shared customer accounts (local upgrade)

Use **Account → Sign in / Create account**, or the shared-account button on the initial welcome screen. Register with a Cambodian phone number and a password of at least 12 characters. Numbers are normalized so local and +855 formats identify the same account. This is password authentication; SMS ownership verification and forgotten-password recovery are not yet configured. Do not describe the phone as verified.

- Profiles, farm details and saved delivery addresses persist in SQLite and can be loaded by signing in from a second browser connected to the same server. Stale profile saves are rejected rather than overwriting a newer edit.
- Customer sessions use random HttpOnly/SameSite cookies, expire after seven days, and are stored only as hashes in the database. Changing a password revokes every customer session. Login/register attempts are throttled locally.
- Existing local farm data is backed up in the browser before linking an account. The **Import saved farm** button lets the user explicitly copy that farm into their shared account.
- Account shows the latest 200 orders with items, delivery charge, payment status and status history. An unpaid pending cash order can be cancelled by its owner, returning stock exactly once. KHQR cancellations require seller review because money may have been transferred but not confirmed.
- Admin shows customer records (no passwords), order status, stock and delivery settings. KHQR orders cannot ship before payment is confirmed; every order requires recorded payment before completion. The merchant must actually check bank receipt or collect cash before confirming payment.
- Scan reports/photos and the original farmer-listing drafts still remain on the device. This upgrade does not upload those files or turn local farmer drafts into published seller inventory.

New tables: `customers`, `customer_sessions`, `order_events`. Existing orders gain nullable `customer_id` and `delivery_cents`; existing records are preserved. Run `python backup.py` for a consistent backup under `data/backups/`. A backup was taken before the initial migration. Keep these backups private.

Validation: `python -m unittest -v test_server.py test_accounts.py`. Browser end-to-end checks use a separate test database on port 8767 and cover registration, second-device sign-in, farm/address persistence, delivery-inclusive checkout, private order history and cancellation. No test accounts/products/orders are added to the real database.

The current server still binds to `127.0.0.1`. Separate browser sessions on this computer can test shared accounts now; other phones need the later hosting phase. Public hosting, HTTPS, verified recovery, operational monitoring and automatic bank verification remain separate work.
