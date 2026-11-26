# Project Specification: Invoice & Business Management Admin Panel

## 1. Objectives
Build a flexible, single-page application (SPA) using React that acts as an internal ERP for business operations. The application will track sales, manage client/employee data, track internal expenses, handle third-party client ad spends, and generate invoices and payslips as PDFs.

## 2. Core Modules

### 2.1 Dashboard (Analytics)
- **Visuals:** Line/Bar charts showing monthly sales performance and income vs. expenses.
- **Metrics Cards:** 
  - Total Revenue (MTD, YTD).
  - Growth Metrics: MoM (Month-on-Month), QoQ (Quarter-on-Quarter), YoY (Year-on-Year) growth percentages.
  - Total pending invoice amounts.
  - Active ad funds available.

### 2.2 Client Management
- **List View:** Table of clients with search and filter functionality.
- **Details Required:** Company/Individual Name, Contact Person, Phone, Email, Billing Address, GSTIN (optional).

### 2.3 Invoice Management
- **List View:** Invoices with Status (Draft, Sent, Paid, Partial, Overdue).
- **Invoice Generation Form:**
  - **Billing Profile Toggle:** 
    - *Company (e.g., Shankara Online Solutions LLP)*: Applies GST (CGST/SGST/IGST), uses company bank details, Pan, and UPI.
    - *Personal (e.g., Manjunath Naik S)*: No GST, uses personal bank details, Pan, and UPI.
  - **Inputs:** Client select, Date, Line Items (Description, SAC/HSN, Units, Rate, Amount), Discount.
  - **Output:** PDF generation matching the provided Excel format. Incorporates a dynamically generated QR Code for the specified UPI ID and amount.

### 2.4 Employee & Payslip Management
- **Employee Directory:** Name, Role, Date of Joining, Basic Salary Details, Bank Details, PAN.
- **Payslip Generator:** Select employee, month/year, input variable components (bonuses, deductions), and generate a PDF payslip.

### 2.5 Expense Tracking
- **Internal Expenses:** Date, Category (e.g., Software Subscriptions, Office Rent, Utilities), Amount, Payment Method.
- **Recurring Expenses:** Ability to set up and visualize monthly fixed costs.

### 2.6 Client Ad Spend Ledger
- **Purpose:** Track money received from clients specifically for Ad campaigns and how it is spent.
- **Ledger Entries:**
  - **Date**
  - **Particulars** (e.g., "Received fund for Meta Ads", "Spent on Google Ads")
  - **Amount Received** (Credit)
  - **Amount Spent** (Debit)
  - **Transaction Details/Reference ID**
  - **Running Balance** per client.

## 3. UI/UX Guidelines
- **Typography:** 
  - Headings (H1 to H6, Card Titles, Table Headers): `Poppins`
  - Body Text (Paragraphs, Inputs, Table Cells): `Open Sans`
- **Layout:** Standard admin dashboard layout with a collapsible sidebar navigation and a top header (containing user profile, notifications).
- **Forms:** Clean inputs with validation, clear error messages, and logical grouping (e.g., Billing Details vs. Line Items).
- **PDFs:** The generated PDFs must strictly mirror the professional layouts provided in the user's templates (clean tables, proper alignment of totals, and clear payment details).

## 4. Proposed Database Schema (JSON/NoSQL structure for frontend state/backend API)

### `clients`
- `id` (string)
- `billingName` (string)
- `contactName` (string)
- `phone` (string)
- `email` (string)
- `address` (string)
- `gstin` (string, optional)

### `invoices`
- `id` (string)
- `invoiceNumber` (string)
- `type` (enum: 'COMPANY', 'PERSONAL')
- `clientId` (string)
- `date` (date)
- `lineItems` (array of objects: `desc`, `sac`, `units`, `rate`, `amount`)
- `subtotal` (number)
- `taxDetails` (object: `cgst`, `sgst`, `igst`) - *0 for personal*
- `total` (number)
- `status` (enum: 'PENDING', 'PAID')
- `paymentDetails` (object: `bankName`, `accNo`, `ifsc`, `pan`, `upi`)

### `adSpendLedgers`
- `id` (string)
- `clientId` (string)
- `date` (date)
- `particulars` (string)
- `type` (enum: 'RECEIVED', 'SPENT')
- `amount` (number)
- `transactionRef` (string)

### `employees`
- `id` (string)
- `name` (string)
- `designation` (string)
- `baseSalary` (number)
- `bankDetails` (object)

### `expenses`
- `id` (string)
- `date` (date)
- `category` (string)
- `amount` (number)
- `isRecurring` (boolean)
- `description` (string)

## 5. Development Milestones
1. **Setup & Scaffolding:** React + Vite, TailwindCSS, Font Setup, Routing.
2. **Layout Implementation:** Sidebar, Header, empty page shells.
3. **Clients & Employees CRUD:** Basic forms and tables.
4. **Invoice Module:** Form state management, calculations, and PDF generation with QR code integration.
5. **Ad Spend & Expense Modules:** Ledgers and running balance logic.
6. **Dashboard:** Aggregate data from other modules and display charts/metrics.
