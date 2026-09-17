# Saavic OrderFlow

Build a complete production-ready end-to-end restaurant/cafe ordering and table management system for:

SAAVIC HEALTHY CAFÉ

The system must be fully functional, not a prototype or static UI.

IMPORTANT:

Do not just create frontend screens.

Implement the complete frontend + backend + database + authentication + QR table system + order management + payment integration + manager dashboard + kitchen/order workflow.

The application must be deployable and usable by a real cafe.

==================================================

1. BRAND

==================================================

Brand:

SAAVIC HEALTHY CAFÉ

Tagline:

EAT CLEAN • FEEL STRONG • LIVE BETTER

Use the uploaded Saavic menu/poster designs as the visual reference for:

- Logo

- Typography

- Green/white natural color palette

- Healthy premium cafe appearance

- Food photography style

- Leaf/natural visual elements

- Overall branding

Do not copy the poster literally.

Create a modern responsive web application inspired by the same branding.

Primary visual direction:

- Premium healthy cafe

- Modern

- Clean

- Natural

- Fresh

- Minimal

- Mobile-first

- Professional

The customer ordering interface must feel similar to a premium food ordering application rather than an admin dashboard.

==================================================

2. MAIN SYSTEM

==================================================

Create THREE major interfaces:

A. CUSTOMER ORDERING PORTAL

B. MANAGER/ADMIN DASHBOARD

C. KITCHEN/ORDER DISPLAY SYSTEM

Customer does NOT need to create an account or login.

Manager/admin MUST have secure authentication.

==================================================

3. QR TABLE SYSTEM

==================================================

Every physical cafe table must have its own unique QR code.

Example:

Table 1

Table 2

Table 3

...

Table 20

Each QR code should open a URL similar to:

/menu?table=TABLE_ID

or preferably:

/t/TABLE_SLUG

Example:

/t/table-01

/t/table-02

Each table must have a unique permanent identifier.

When a customer scans a table QR:

1. Open customer menu.

2. Detect the table automatically.

3. Display:

   "You're ordering from Table 01"

4. Customer does NOT need to login.

5. Customer can immediately browse menu and order.

Do NOT ask the customer for their table number.

==================================================

4. TABLE SESSION MANAGEMENT

==================================================

Implement a proper table session system.

A table can have states:

AVAILABLE

OCCUPIED

ORDERING

FOOD_PREPARING

READY

BILL_REQUESTED

PAYMENT_PENDING

PAID

CLOSED

When the first customer places an order on a table:

Table becomes OCCUPIED.

Create a table session.

Example:

Table 01

Session #SAAVIC-20260912-001

All orders placed from that table during the active session belong to that session.

If multiple customers scan the same table QR during the same session, they must be able to add orders to the same active table session.

Do NOT create a separate table session for every customer scanning the QR.

When the manager closes the table:

1. Verify that the bill is paid or manager explicitly confirms payment.

2. Close the active session.

3. Mark table as AVAILABLE.

4. The next customer scanning the QR starts a new session.

Never mix orders from previous sessions with new customers.

==================================================

5. CUSTOMER LANDING EXPERIENCE

==================================================

When customer scans QR:

Show a small welcome header:

SAAVIC

HEALTHY CAFÉ

"Welcome! You're ordering from Table 01"

No login.

No registration.

No unnecessary forms.

Allow customer to immediately see:

- Menu

- Categories

- Search

- Cart

- Current order

- Table number

Sticky bottom navigation on mobile:

HOME

MENU

ORDERS

CART

==================================================

6. CUSTOMER MENU

==================================================

Create categories:

1. Smoothies

2. Fresh Salads

3. Quick Bites

4. Wellness Shots

5. 26 Days of Clean – Meal Plans

6. Add-ons

Use the following exact menu information from the supplied Saavic designs.

--------------------------------------------------

SMOOTHIES

--------------------------------------------------

1. Green Detox

Description:

Spinach, cucumber, apple, lemon & mint

Price: ₹149

2. Berry Blast

Description:

Mixed berries, banana & yogurt

Price: ₹189

3. Chocolate Peanut Butter

Description:

Peanut butter, banana, cocoa & milk

Price: ₹159

4. Tropical Smoothie

Description:

Mango, pineapple & banana

Price: ₹159

5. Creamy Coffee Smoothie

Description:

Coffee, banana, milk & cocoa

Price: ₹169

--------------------------------------------------

FRESH SALADS

--------------------------------------------------

1. Veg Garden Salad

Price: ₹149

2. High-Protein Chickpea Salad

Price: ₹189

3. Paneer Protein Salad

Price: ₹209

4. Chicken Protein Salad

Price: ₹219

--------------------------------------------------

QUICK BITES

--------------------------------------------------

1. Boiled Eggs

Quantity:

3 pcs

Price: ₹79

2. Avocado Toast

Price: ₹149

3. Egg Avocado Toast

Price: ₹179

4. Overnight Soaked Oats

Description:

Toppings of your choice

Price: ₹149

--------------------------------------------------

WELLNESS SHOTS

--------------------------------------------------

1. ABC Shot

Description:

Apple, Beetroot & Carrot

Price: ₹69

2. Immunity Booster

Description:

Carrot, Orange, Ginger & Lemon

Price: ₹69

3. Hydration Shot

Description:

Watermelon, Mint, Cucumber & Ginger

Price: ₹69

4. Anti-Bloat Shot

Description:

Pineapple, Celery, Green Apple & Ginger

Price: ₹69

5. Green Detox Shot

Description:

Spinach, Apple, Cucumber, Ginger, Mint & Lemon

Price: ₹69

==================================================

7. FEATURED 26-DAY MEAL PLANS

==================================================

Create a highly visible promotional section called:

"26 DAYS OF CLEAN, HIGH-PROTEIN MEALS"

Subtitle:

"Your daily dose of health. Zero stress."

Features:

FRESH

PROTEIN-RICH

BALANCED

DELIVERED DAILY

--------------------------------------------------

VEG FIT

--------------------------------------------------

Name:

Veg Fit

Includes:

Protein-Rich Veg Salad

+

Seasonal Fruit Bowl

Duration:

26 Days

Price:

₹3,999

Protein:

20–25g protein daily approximately

Every day includes:

1 Salad

+

1 Seasonal Fruit Bowl

+

Healthy Dressing

--------------------------------------------------

CHICKEN FIT

--------------------------------------------------

Name:

Chicken Fit

Includes:

Chicken Protein Salad

+

Seasonal Fruit Bowl

Duration:

26 Days

Price:

₹4,999

Protein:

30–40g protein daily approximately

Every day includes:

1 Salad

+

1 Seasonal Fruit Bowl

+

Healthy Dressing

--------------------------------------------------

OPTIONAL ADD-ON

--------------------------------------------------

Wellness Shot

100 ml × 26 Days

Fresh ingredients:

Ginger

Lemon

Add-on price:

₹999

Allow customers to add the Wellness Shot to either:

Veg Fit

or

Chicken Fit

==================================================

8. COMBO POPUP

==================================================

IMPORTANT:

Create a beautiful promotional popup for the 26-day meal plans.

The popup should NOT appear aggressively every time the user changes pages.

Show it:

- On first visit after a short delay

OR

- When customer clicks "26 Days of Clean"

OR

- When customer tries to leave the menu after browsing.

Store dismissal in localStorage/session storage so it does not repeatedly annoy the customer.

Popup design:

Header:

"26 DAYS OF CLEAN"

Subtitle:

"High-protein meals. Freshly prepared every day."

Show two cards:

VEG FIT

₹3,999

26 DAYS

20–25g protein daily

CHICKEN FIT

₹4,999

26 DAYS

30–40g protein daily

Each card has:

"VIEW PLAN"

Button.

Below:

"Add Wellness Shot"

+₹999 / 26 Days

Buttons:

VIEW VEG FIT

VIEW CHICKEN FIT

CLOSE

The popup must be responsive and beautiful on mobile.

==================================================

9. PRODUCT DETAILS

==================================================

Every menu item must have a product detail modal/page.

When clicking an item show:

- Product image

- Product name

- Description

- Price

- Ingredients

- Available customizations if applicable

- Quantity selector

- Add to Cart button

Optional product fields:

Calories

Protein

Carbohydrates

Fats

Allergens

Ingredients

These fields should be manageable from the manager dashboard.

==================================================

10. CART

==================================================

Customer cart must support:

- Add item

- Remove item

- Increase quantity

- Decrease quantity

- Add notes

- Product customizations

- Subtotal

- Taxes

- Discounts

- Final total

Example:

Chicken Protein Salad × 2

₹438

Subtotal

₹438

Tax

₹XX

Total

₹XXX

Before checkout, clearly show:

Table 01

"Your order will be prepared for Table 01."

==================================================

11. ORDER NOTES

==================================================

Allow customers to add order-level notes:

Example:

"Please make it less spicy."

Also allow item-specific notes:

"Don't add onion."

Do not allow arbitrary dangerous or inappropriate data.

==================================================

12. ORDER PLACEMENT

==================================================

When customer clicks:

"PLACE ORDER"

Create a proper order in database.

Generate:

Unique Order ID

Example:

SV-1001

Order should contain:

Order ID

Table

Session ID

Items

Quantities

Customizations

Notes

Subtotal

Tax

Discount

Total

Payment status

Order status

Created timestamp

Initial order status:

PLACED

==================================================

13. ORDER STATUS WORKFLOW

==================================================

Implement:

PLACED

↓

ACCEPTED

↓

PREPARING

↓

READY

↓

SERVED

↓

COMPLETED

Manager/kitchen staff can change status.

Customer can see live order status.

Example:

✓ Order placed

✓ Accepted

● Preparing

○ Ready

○ Served

Use realtime updates where possible.

Do not require customer login.

Use the table session/browser session + order/session identifier to display the customer's current orders.

==================================================

14. MULTIPLE ORDERS FROM SAME TABLE

==================================================

Customers must be able to place multiple orders.

Example:

Order #SV-1001

Chicken Salad

₹219

Later:

Order #SV-1002

Smoothie

₹149

Both belong to:

Table 01

Same active table session.

The manager dashboard must show:

TABLE 01

2 Orders

₹368

ACTIVE

==================================================

15. BILLING

==================================================

Create a table bill.

Bill should automatically calculate:

All orders in current table session

+

Taxes

-

Discounts

=

Final payable amount

Example:

Table 01

Order #1001 ₹438

Order #1002 ₹149

Subtotal ₹587

Tax ₹XX

Grand Total ₹XXX

The manager must be able to view the complete bill.

==================================================

16. RAZORPAY PAYMENT INTEGRATION

==================================================

Integrate Razorpay properly.

IMPORTANT:

Never trust the frontend payment success response alone.

Use secure server-side payment verification.

Flow:

Customer clicks:

"PAY BILL"

Backend creates Razorpay Order.

Frontend opens Razorpay Checkout.

Customer completes payment.

Backend verifies:

razorpay_order_id

razorpay_payment_id

razorpay_signature

Use Razorpay webhook handling for payment confirmation where appropriate.

Store payment information securely:

Payment ID

Razorpay Order ID

Amount

Currency

Payment status

Timestamp

Method if available

Table session

Bill ID

Payment states:

PENDING

SUCCESS

FAILED

REFUNDED

Never store card numbers, CVV, UPI PINs, or sensitive payment credentials.

Razorpay secret keys MUST ONLY exist in backend/server environment variables.

Use environment variables:

RAZORPAY_KEY_ID

RAZORPAY_KEY_SECRET

RAZORPAY_WEBHOOK_SECRET

Do not hardcode secrets.

==================================================

17. PAYMENT FAILURE

==================================================

If payment fails:

Do not close the table.

Show:

"Payment failed. Your order is still active."

Allow:

TRY AGAIN

If payment succeeds:

Show:

"Payment Successful"

Payment ID

Amount paid

Table number

Then show:

"Please wait while your order is served."

The manager can see payment confirmation.

==================================================

18. TABLE CLOSING

==================================================

Only manager/admin can close a table.

Manager clicks:

CLOSE TABLE

Before closing:

Show confirmation:

Table 01

Total Bill ₹XXX

Payment Status: PAID

"Are you sure you want to close this table?"

Actions:

CANCEL

CLOSE TABLE

If unpaid:

Do NOT automatically allow closure.

Show:

"Payment is still pending."

Allow manager to explicitly select:

MARK AS CASH PAID

only if cash payment was actually received.

Record:

Payment method:

CASH

Manager:

[manager user]

Timestamp.

Every manual payment action must be logged.

After closing:

Table status:

AVAILABLE

Create new session for the next customer.

==================================================

19. MANAGER LOGIN

==================================================

Customers do NOT need login.

Manager dashboard requires authentication.

Create secure manager authentication.

Roles:

SUPER_ADMIN

MANAGER

KITCHEN_STAFF

CASHIER

Permissions:

SUPER_ADMIN:

Everything

MANAGER:

Orders

Tables

Menu

Payments

Reports

Customers

Settings

KITCHEN_STAFF:

Kitchen orders

Order status

CASHIER:

Bills

Payments

Tables

Orders

Use secure authentication and authorization.

Never expose admin pages to unauthenticated users.

==================================================

20. MANAGER DASHBOARD

==================================================

Create a professional desktop-first manager dashboard.

Sidebar:

Dashboard

Orders

Tables

Kitchen

Menu

Categories

Meal Plans

Payments

Customers

Inventory

Offers

Reports

Staff

Settings

Top bar:

Cafe name

Current date

Notifications

Manager profile

Logout

==================================================

21. DASHBOARD OVERVIEW

==================================================

Display cards:

Today's Sales

Today's Orders

Active Tables

Pending Orders

Pending Payments

Example:

Today's Sales

₹18,450

Orders

74

Active Tables

8 / 20

Pending Orders

6

Pending Payments

2

==================================================

22. LIVE TABLE MAP

==================================================

Create visual table layout.

Example:

TABLE 01

AVAILABLE

TABLE 02

₹568

3 ITEMS

TABLE 03

PREPARING

TABLE 04

PAID

Use different visual states.

Click table:

Open table details.

Show:

Table number

Session ID

Customer orders

Items

Total

Payment status

Order status

Time occupied

Actions

Actions:

VIEW BILL

ADD ORDER

MARK PAID

CLOSE TABLE

==================================================

23. ORDER MANAGEMENT

==================================================

Orders page must support:

Search by Order ID

Search by table

Filter by status

Filter by payment

Filter by date

Filter by order type

Columns:

Order ID

Table

Items

Amount

Payment

Status

Time

Actions

Order details:

Order ID

Table

Customer/session

Items

Modifiers

Notes

Subtotal

Tax

Discount

Total

Payment status

Order status

Timeline

==================================================

24. KITCHEN DISPLAY SYSTEM

==================================================

Create a dedicated kitchen screen.

Large cards.

Columns:

NEW

ACCEPTED

PREPARING

READY

Example:

ORDER #SV-1023

TABLE 07

Chicken Protein Salad × 2

Green Detox × 1

Notes:

"No onion"

Buttons:

ACCEPT

START PREPARING

READY

Use large text so kitchen staff can easily read it.

Automatically refresh/realtime update orders.

Use sound/browser notification for new orders where possible.

==================================================

25. MENU MANAGEMENT

==================================================

Manager can:

Add product

Edit product

Delete/deactivate product

Change price

Change image

Change description

Change ingredients

Set availability

Set category

Set tax

Set preparation time

Set nutritional information

Product status:

AVAILABLE

OUT OF STOCK

HIDDEN

If an item is OUT OF STOCK:

Customer sees:

"Currently unavailable"

and cannot add it to cart.

==================================================

26. CATEGORY MANAGEMENT

==================================================

Manager can create/edit/delete categories.

Examples:

Smoothies

Fresh Salads

Quick Bites

Wellness Shots

Meal Plans

Allow category ordering.

==================================================

27. CUSTOMIZATIONS / MODIFIERS

==================================================

Build a reusable modifier system.

Example:

Overnight Soaked Oats:

Toppings:

Fruit

Nuts

Seeds

Example salad modifiers:

Dressing:

Healthy Dressing

No Dressing

Extra Dressing

Example:

Add-ons:

Extra Paneer

Extra Chicken

Extra Egg

Manager must be able to configure modifiers without editing code.

==================================================

28. INVENTORY

==================================================

Implement basic inventory management.

Track:

Ingredient

Unit

Current stock

Minimum stock

Cost

Supplier

Status

Example:

Chicken

kg

12 kg

Minimum 5 kg

When ingredients are low:

LOW STOCK

When below minimum:

CRITICAL STOCK

Dashboard should show low-stock alerts.

The inventory system should be designed so menu items can optionally consume ingredients when an order is confirmed.

Do not make inventory unnecessarily complicated.

Keep it practical for a small/medium cafe.

==================================================

29. CUSTOMER INFORMATION

==================================================

Since customers do not login, do NOT force account creation.

For ordering, optionally collect:

Name

Mobile number

Only if needed for:

- Order communication

- Delivery

- Receipt

For dine-in ordering, name/mobile should be optional.

Do not block ordering because the customer refuses to provide personal information unless legally/business necessary.

==================================================

30. RECEIPTS

==================================================

After successful payment, generate a digital receipt.

Receipt:

SAAVIC HEALTHY CAFÉ

Order ID

Table

Date

Time

Items

Quantity

Price

Subtotal

Tax

Discount

TOTAL

Payment:

Razorpay / Cash

Payment ID

Include:

"Thank you for choosing Saavic Healthy Café."

Allow:

Download Receipt

Print Receipt

==================================================

31. TAX SYSTEM

==================================================

Do NOT hardcode tax logic into the frontend.

Create configurable tax settings.

Manager can configure:

Tax name

Tax percentage

Inclusive/exclusive

Example:

GST

5%

The manager must be able to change this later.

Prices displayed in the menu should remain configurable.

==================================================

32. DISCOUNTS AND OFFERS

==================================================

Create a basic discount system.

Manager can create:

Percentage discount

Fixed discount

Coupon code

Minimum order value

Start date

End date

Usage limit

Active/inactive

Example:

WELCOME10

10% OFF

Do not allow discounts that result in invalid negative totals.

==================================================

33. REPORTS

==================================================

Create reports:

Daily sales

Weekly sales

Monthly sales

Orders

Best-selling products

Category sales

Payment method breakdown

Table utilization

Cancelled orders

Refunds

Discounts

Average order value

Allow date filtering.

Provide:

Total Sales

Total Orders

Average Order Value

Top Products

Allow CSV export.

==================================================

34. AUDIT LOG

==================================================

Implement audit logs.

Record important manager actions:

Login

Logout

Order status changes

Price changes

Menu changes

Payment overrides

Cash payment marking

Table closing

Refund

Discount creation

Staff changes

Each log:

User

Action

Timestamp

Relevant object/order/table

Description

This is important for accountability.

==================================================

35. TABLE MANAGEMENT

==================================================

Manager can:

Add table

Edit table

Disable table

Generate QR

Download QR

Print QR

Regenerate QR if necessary

Each table should have:

Table ID

Table number/name

QR slug

Capacity

Status

Active session

Provide:

"Download QR"

and

"Print QR"

The QR should open that exact table's customer ordering portal.

==================================================

36. QR DESIGN

==================================================

Create printable QR cards.

Example:

SAAVIC

SCAN TO ORDER

Table 01

[QR CODE]

"Scan • Order • Enjoy"

Use Saavic branding.

Allow QR generation for all tables.

Create a page:

/admin/tables/qr

where manager can download/print QR codes.

==================================================

37. CUSTOMER ACTIVE ORDER PAGE

==================================================

Customer should be able to see:

Current Table

Current Session

Active orders:

Order #SV-1021

Preparing

Order #SV-1022

Ready

Current bill:

₹XXX

Button:

VIEW BILL

If bill is payable:

PAY BILL

If already paid:

PAID ✓

==================================================

38. TABLE BILL PAGE

==================================================

Customer bill should show all orders belonging to the active table session.

Example:

TABLE 07

Order #SV-1001

₹438

Order #SV-1002

₹149

Subtotal

₹587

GST

₹XX

Total

₹XXX

PAY NOW

After payment:

PAID ✓

==================================================

39. SPLIT BILL

==================================================

Implement optional split bill support.

Manager can split bill by:

Order

Item

Equal amount

Example:

Bill ₹1,200

Person A

₹600

Person B

₹600

However, keep the first version simple and reliable.

Do not allow split payment logic to break the main payment system.

==================================================

40. ORDER CANCELLATION

==================================================

Customer may request cancellation only before the order is accepted.

Manager can cancel orders.

Cancellation requires:

Reason

Examples:

Customer request

Item unavailable

Kitchen issue

Other

If a paid order is cancelled:

Mark:

REFUND_REQUIRED

Do not automatically fake a refund.

Manager can initiate refund through the supported Razorpay API flow if implemented.

==================================================

41. NOTIFICATIONS

==================================================

Manager should receive notifications for:

New order

Payment successful

Payment failed

Cancellation request

Low stock

Customer should receive UI notifications for:

Order accepted

Preparing

Ready

Payment successful

Use realtime updates where possible.

==================================================

42. DATABASE DESIGN

==================================================

Use a relational database.

Preferred:

PostgreSQL

If using Supabase:

Use Supabase PostgreSQL + Supabase Auth + Realtime.

Tables should include at minimum:

users

roles

staff

tables

table_sessions

categories

products

product_images

modifiers

modifier_options

product_modifiers

meal_plans

meal_plan_addons

orders

order_items

order_item_modifiers

payments

bills

bill_items

discounts

coupons

inventory_items

inventory_transactions

customers

notifications

audit_logs

settings

Use proper foreign keys.

Use indexes on:

table_id

session_id

order_id

payment_id

created_at

status

Use UUIDs for internal database IDs where appropriate.

Do not rely only on frontend state.

All important business data must be persisted in the database.

==================================================

43. SECURITY

==================================================

Implement proper authorization.

Customer endpoints must only allow access to their current table/session/order context.

Manager endpoints require authenticated staff.

Never expose:

Database service keys

Razorpay secret

Admin credentials

Environment variables

to frontend.

Validate all API input server-side.

Prevent:

SQL injection

Unauthorized order access

Unauthorized table closure

Price manipulation

Payment manipulation

Coupon manipulation

IMPORTANT:

Never trust the price sent by the frontend.

When an order is submitted:

Backend must retrieve the current product prices from database and calculate:

subtotal

tax

discount

total

The frontend total is only informational.

Similarly, Razorpay payment amount must be generated by the backend.

==================================================

44. CUSTOMER SESSION SECURITY

==================================================

Because customers don't login, create a secure anonymous session mechanism.

Use:

table session ID

signed/session token

browser session identifier

Do not expose internal database IDs unnecessarily.

Customer should only be able to access their active table session.

Do not allow:

Table 01 customer to manipulate Table 02 orders.

==================================================

45. RESPONSIVE DESIGN

==================================================

Customer portal:

MOBILE FIRST.

Must work beautifully on:

iPhone

Android

Tablet

Desktop

Manager dashboard:

Desktop-first

Tablet responsive

Mobile usable

Kitchen:

Large-screen optimized.

==================================================

46. CUSTOMER UI

==================================================

Customer homepage should include:

Top:

SAAVIC

HEALTHY CAFÉ

Table 01

Search bar:

"What are you craving?"

Category horizontal scrolling.

Featured:

26 DAYS OF CLEAN

Then menu cards.

Each card:

Image

Product name

Short description

Price

ADD button

Example:

Chicken Protein Salad

₹219

[ + ADD ]

Use bottom sticky cart:

"3 items • ₹487"

VIEW CART

==================================================

47. FOOD IMAGES

==================================================

Use high-quality healthy food imagery.

Visual style:

Natural lighting

Fresh vegetables

Premium cafe photography

Indian-friendly healthy food

Clean backgrounds

Do not use random unrelated stock images.

If image generation/placeholders are needed, create relevant images for each category/product.

Manager should be able to replace images later.

==================================================

48. EMPTY STATES

==================================================

Implement polished empty states.

Cart empty:

"Your cart is waiting for something fresh."

No active orders:

"No active orders yet."

No available tables:

"Please contact our staff."

No menu items:

"Menu is currently unavailable."

==================================================

49. ERROR HANDLING

==================================================

Every API request must have proper:

Loading

Success

Error

Retry

states.

If network fails while ordering:

Do NOT accidentally create duplicate orders.

Use idempotency protection for order creation and payment creation.

If customer clicks PLACE ORDER twice:

Only one order should be created.

==================================================

50. ORDER IDEMPOTENCY

==================================================

Implement idempotency keys for:

Order creation

Payment creation

This is extremely important.

A repeated network request must not create duplicate orders or duplicate payments.

==================================================

51. TIMEZONE

==================================================

Cafe location:

Secunderabad / Hyderabad, Telangana, India

Use:

Asia/Kolkata

All displayed times should use Indian Standard Time.

Store timestamps in UTC where appropriate and convert to IST in UI.

Currency:

INR / ₹

==================================================

52. CAFE SETTINGS

==================================================

Manager Settings should include:

Cafe name

Logo

Phone

WhatsApp number

Address

GST/tax settings

Currency

Opening time

Closing time

Order acceptance status

Manager can temporarily disable ordering.

Example:

"Online ordering currently unavailable."

==================================================

53. BUSINESS HOURS

==================================================

Implement cafe opening/closing settings.

If ordering is closed:

Customer sees:

"Saavic Healthy Café is currently closed."

Show:

Opening at 9:00 AM

Do not allow new orders while ordering is disabled.

Manager can override this.

==================================================

54. ORDER NUMBER

==================================================

Create human-friendly order numbers.

Example:

SV-1001

SV-1002

SV-1003

Do not expose raw database UUIDs as the primary customer-facing order number.

==================================================

55. PERFORMANCE

==================================================

Optimize for:

Fast initial load

Lazy-loaded images

Compressed images

Efficient database queries

Realtime subscriptions only where necessary

Mobile performance

Do not unnecessarily load the entire menu multiple times.

==================================================

56. ACCESSIBILITY

==================================================

Use:

Readable fonts

High contrast

Proper button sizes

Keyboard navigation

ARIA labels where appropriate

Accessible forms

==================================================

57. PWA

==================================================

Make the customer ordering portal installable as a Progressive Web App where practical.

It should feel like a mobile app.

However, do NOT require customers to install anything.

QR scan should immediately open the ordering page in browser.

==================================================

58. ADMIN DASHBOARD UX

==================================================

Dashboard should look premium and modern.

Use:

Cards

Tables

Charts

Status badges

Modal dialogs

Confirmation dialogs

Toast notifications

Do not make it visually cluttered.

Use Saavic branding but keep admin interface highly functional.

==================================================

59. REALTIME REQUIREMENTS

==================================================

Use realtime database subscriptions/websockets for:

New orders

Order status

Payment confirmation

Table status

Example:

Customer places order.

Manager dashboard immediately shows:

NEW ORDER

TABLE 07

ORDER #SV-1032

Kitchen immediately receives it.

Manager accepts.

Customer sees:

ORDER ACCEPTED ✓

Kitchen changes to:

PREPARING

Customer sees:

PREPARING

Kitchen changes:

READY

Customer sees:

READY

==================================================

60. PAYMENT RECONCILIATION

==================================================

Payment status must be based on verified backend payment information.

Possible states:

UNPAID

PAYMENT_PENDING

PAID

FAILED

REFUND_PENDING

REFUNDED

CASH_PAID

Do not mark a bill as PAID just because Razorpay checkout returned successfully on the browser.

Verify server-side/webhook.

==================================================

61. MANAGER TABLE CLOSE RULE

==================================================

A table can only become AVAILABLE when:

All active orders are completed/cancelled

AND

Bill is paid

OR

Manager explicitly records an authorized manual settlement such as cash.

When closing:

Create audit log.

Example:

MANAGER

Closed Table 07

Bill: ₹1,250

Payment: Razorpay

Time: 8:42 PM

==================================================

62. DATA CONSISTENCY

==================================================

Use database transactions wherever needed.

Especially:

Order creation

Bill calculation

Payment recording

Table session creation

Table closing

Prevent race conditions where two customers order simultaneously from the same table.

==================================================

63. SEED DATA

==================================================

Create initial database seed data using the Saavic menu provided above.

Create sample tables:

Table 01

Table 02

Table 03

Table 04

Table 05

Table 06

Table 07

Table 08

Table 09

Table 10

Make the number of tables configurable.

Create the full menu with the exact names and prices supplied.

Create:

Veg Fit ₹3,999

Chicken Fit ₹4,999

Wellness Shot Add-on ₹999

==================================================

64. DEMO MODE

==================================================

Provide a development/demo mode if Razorpay credentials are not configured.

However:

Do NOT fake payment success in production.

Clearly separate:

DEMO MODE

PRODUCTION MODE

In production, Razorpay must be properly configured.

==================================================

65. ENVIRONMENT VARIABLES

==================================================

Create a clear .env.example file.

Include placeholders for:

DATABASE_URL

SUPABASE_URL

SUPABASE_ANON_KEY

SUPABASE_SERVICE_ROLE_KEY

RAZORPAY_KEY_ID

RAZORPAY_KEY_SECRET

RAZORPAY_WEBHOOK_SECRET

APP_URL

Do not put real secrets into source code.

==================================================

66. API ARCHITECTURE

==================================================

Use clean REST or server actions/API architecture.

Example endpoints:

GET /api/menu

GET /api/tables/:slug

GET /api/table-session

POST /api/table-session

POST /api/orders

GET /api/orders/:id

POST /api/orders/:id/cancel

GET /api/admin/orders

PATCH /api/admin/orders/:id/status

GET /api/admin/tables

POST /api/admin/tables

PATCH /api/admin/tables/:id

POST /api/payments/create

POST /api/payments/verify

POST /api/payments/webhook

GET /api/admin/reports

Use whichever architecture best fits the chosen framework, but maintain clear separation between customer and admin functionality.

==================================================

67. TECHNOLOGY

==================================================

Preferred stack:

Frontend:

Next.js / React

TypeScript

Styling:

Tailwind CSS

UI:

Modern component library such as shadcn/ui if appropriate

Backend:

Next.js server/API routes OR equivalent secure backend

Database:

PostgreSQL

Preferred:

Supabase

Authentication:

Supabase Auth or equivalent secure authentication

Realtime:

Supabase Realtime / WebSockets

Payments:

Razorpay

QR:

Standard QR generation library

Charts:

Recharts or equivalent

Deployment:

Vercel / Replit / equivalent

Use TypeScript throughout.

Avoid unnecessary technologies.

==================================================

68. FOLDER STRUCTURE

==================================================

Organize the application cleanly.

Example:

/app

  /(customer)

  /admin

  /kitchen

  /api

/components

/lib

/services

/types

/hooks

/database

/public

/scripts

Separate:

UI

Business logic

Database

Payment logic

Authentication

Validation

==================================================

69. VALIDATION

==================================================

Use proper schema validation.

Recommended:

Zod

Validate:

Orders

Products

Tables

Payments

Coupons

Staff

Settings

Never rely only on frontend validation.

==================================================

70. SECURITY RULES FOR DATABASE

==================================================

If Supabase is used:

Implement Row Level Security.

Customers must NOT be able to query all orders/tables.

Staff access must be role-based.

Service role key must only run server-side.

==================================================

71. ADMIN ACTION CONFIRMATIONS

==================================================

Dangerous actions require confirmation:

Delete product

Deactivate product

Close table

Cancel order

Refund payment

Delete table

Change staff permissions

Use confirmation modal.

==================================================

72. AUDITABLE PAYMENTS

==================================================

Never allow a manager to silently modify a paid bill.

If correction is needed:

Create adjustment/audit record.

Never overwrite historical payment records.

==================================================

73. CUSTOMER BILL QR

==================================================

Optionally provide:

"Scan to View Bill"

QR/session URL should allow the active table customer to reopen their current bill.

However, protect it using the active session mechanism.

==================================================

74. WHATSAPP / CONTACT

==================================================

Use the cafe's supplied contact details only where appropriate.

Provide buttons where useful:

Contact Cafe

WhatsApp

Call

Do not make WhatsApp mandatory for ordering.

==================================================

75. FOOTER

==================================================

Customer footer:

SAAVIC HEALTHY CAFÉ

EAT CLEAN • FEEL STRONG • LIVE BETTER

Fresh

Natural

Made to Order

Include cafe contact information configurable through admin settings.

==================================================

76. ADMIN REPORT EXPORT

==================================================

Allow:

Export Orders CSV

Export Sales CSV

Export Payments CSV

Export Inventory CSV

Use server-side generation where appropriate.

==================================================

77. PRINTING

==================================================

Manager should be able to print:

Bills

Receipts

Table QR codes

Kitchen orders

Create print-friendly layouts.

==================================================

78. MOBILE CUSTOMER ORDER FLOW

==================================================

The ideal customer flow must be:

SCAN QR

↓

TABLE DETECTED

↓

MENU

↓

SELECT FOOD

↓

CUSTOMIZE

↓

ADD TO CART

↓

PLACE ORDER

↓

ORDER CONFIRMED

↓

KITCHEN PREPARES

↓

CUSTOMER TRACKS ORDER

↓

VIEW TABLE BILL

↓

PAY WITH RAZORPAY

↓

PAYMENT VERIFIED

↓

MANAGER CLOSES TABLE

↓

TABLE AVAILABLE

There must be no customer login requirement.

==================================================

79. MANAGER FLOW

==================================================

Manager:

LOGIN

↓

DASHBOARD

↓

SEE TABLE MAP

↓

SEE NEW ORDER

↓

ACCEPT

↓

KITCHEN PREPARES

↓

READY

↓

SERVED

↓

CUSTOMER PAYS

↓

PAYMENT VERIFIED

↓

VIEW FINAL BILL

↓

CLOSE TABLE

↓

TABLE AVAILABLE

==================================================

80. IMPORTANT EDGE CASES

==================================================

Handle all of these:

1. Customer scans QR twice.

2. Multiple customers use same table.

3. Two customers place orders simultaneously.

4. Customer refreshes page.

5. Customer closes browser.

6. Customer returns later.

7. Payment fails.

8. Payment succeeds but browser closes.

9. Razorpay webhook arrives twice.

10. Customer clicks Pay multiple times.

11. Customer clicks Place Order multiple times.

12. Item becomes unavailable while in cart.

13. Price changes while item is in cart.

14. Manager closes table while customer has page open.

15. Network disconnects during order.

16. Kitchen changes order status.

17. Order gets cancelled.

18. Payment is refunded.

19. Manager manually records cash payment.

20. Table has multiple orders.

21. Previous table session must never appear in a new session.

22. Customer tries to access another table's order.

23. Cafe ordering is disabled.

24. Cafe is outside business hours.

25. Razorpay credentials are missing.

26. Database temporarily unavailable.

Build graceful handling for all of these.

==================================================

81. UI COPY

==================================================

Use friendly customer-facing language.

Examples:

"Fresh food. Simple ordering."

"You're ordering from Table 07"

"Added to your cart"

"Your order is on its way to the kitchen."

"Your food is being freshly prepared."

"Your order is ready!"

"Your table bill is ready."

"Payment successful ✓"

"Thank you for choosing Saavic."

==================================================

82. DO NOT DO THESE THINGS

==================================================

DO NOT:

- Require customer registration.

- Create fake payment success.

- Store Razorpay secrets in frontend.

- Trust frontend prices.

- Trust frontend payment status.

- Hardcode menu prices in multiple places.

- Use mock orders in production.

- Use fake database data instead of real persistence.

- Create separate table sessions every time QR is scanned.

- Allow customers to close tables.

- Allow customers to access other tables.

- Automatically mark unpaid bills as paid.

- Delete historical payment records.

- Build only frontend UI.

- Leave TODO placeholders for core functionality.

- Leave critical features as "coming soon".

==================================================

83. ACCEPTANCE TEST

==================================================

Before considering the application complete, test the entire system.

TEST 1:

Scan Table 01 QR.

Expected:

Customer opens Table 01 menu without login.

TEST 2:

Add Green Detox.

Expected:

₹149 added.

TEST 3:

Add Chicken Protein Salad.

Expected:

₹219 added.

TEST 4:

Place order.

Expected:

Database order created.

Table 01 becomes occupied.

Kitchen receives order.

Manager sees order.

TEST 5:

Kitchen accepts.

Expected:

Customer sees ACCEPTED.

TEST 6:

Kitchen starts preparing.

Expected:

Customer sees PREPARING.

TEST 7:

Kitchen marks ready.

Expected:

Customer sees READY.

TEST 8:

Customer places another order.

Expected:

Second order belongs to same table session.

TEST 9:

Customer views bill.

Expected:

All active session orders included.

TEST 10:

Customer pays with Razorpay.

Expected:

Backend verifies payment.

Payment record created.

Bill marked PAID.

TEST 11:

Manager closes table.

Expected:

Table becomes AVAILABLE.

Session becomes CLOSED.

Audit log created.

TEST 12:

New customer scans Table 01.

Expected:

New session.

Old orders are NOT shown.

TEST 13:

Two customers scan Table 01 before table closes.

Expected:

Both can order against the same active table session.

TEST 14:

Customer double-clicks Place Order.

Expected:

Only one order created.

TEST 15:

Customer double-clicks Pay.

Expected:

Only one valid payment/order flow.

TEST 16:

Frontend attempts to manipulate product price.

Expected:

Backend ignores manipulated price and calculates using database price.

TEST 17:

Customer attempts to access another table's order.

Expected:

Access denied.

==================================================

84. FINAL DELIVERY REQUIREMENT

==================================================

Deliver a COMPLETE working application.

The final implementation must include:

✓ Customer QR ordering

✓ No customer login

✓ Unique QR per table

✓ Table sessions

✓ Multiple orders per table

✓ Live order tracking

✓ Kitchen display

✓ Manager dashboard

✓ Table management

✓ Menu management

✓ Meal plans

✓ Combo popup

✓ Cart

✓ Billing

✓ Razorpay

✓ Server-side payment verification

✓ Payment webhook

✓ Table closing

✓ Cash payment handling

✓ Inventory

✓ Discounts

✓ Reports

✓ Receipts

✓ QR generation

✓ Staff roles

✓ Audit logs

✓ Realtime updates

✓ Error handling

✓ Security

✓ Responsive UI

✓ Database persistence

✓ Production environment configuration

==================================================

85. FINAL DEVELOPMENT INSTRUCTION

==================================================

Do not stop after generating the UI.

First design the database architecture.

Then implement backend business logic.

Then implement customer portal.

Then implement manager dashboard.

Then implement kitchen display.

Then implement Razorpay integration.

Then connect realtime events.

Then seed the Saavic menu.

Then test all critical workflows.

Fix all TypeScript errors, build errors, database errors, API errors, broken links, broken states, and responsive issues.

Run the application and verify the complete customer → order → kitchen → bill → payment → table closure workflow.

If a requested library or service cannot be configured automatically, create the correct integration structure and clearly identify ONLY the environment variables/credentials that need to be supplied.

Do not leave core functionality mocked.

The final result should be a real cafe management and QR ordering system, not a landing page or demo.

==================================================

END OF REQUIREMENTS

==================================================

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://saavic-dine-flow.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/dfca58d2-4757-4567-aa7d-3c0868b1e624).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
