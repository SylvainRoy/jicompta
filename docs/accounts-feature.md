# Association Prestations & Expenses

## Context

Some services (prestations) are performed for associations. These services are not paid, but they can result in reimbursements to an account linked to the association. They should not be considered for taxes since there is no associated income, only reimbursement of associated expenses.

The concept of expenses allows tracking expenses made on an account.

## Design

### Association Prestations

These prestations are managed like normal prestations. They appear in the same tab as other prestations.

A new boolean field called "associatif" distinguishes them from regular prestations. This field is specified at creation and can be modified later.
By default, the field is not selected.

The status of these prestations is unique and is "associatif". They can be filtered like other statuses.

They have neither receipts nor invoices.

### Payments

Association prestations cannot have a payment. They are considered as paid by default.

### Clients

Any client can be used for an association prestation. That is, the client here is the association.

### Accounts

Accounts do not exist as objects that the user can create. They are automatically created for a client that has "association prestations" or "expenses".

Association prestations credit the associated account.

On the other hand, a special account exists by default and is associated with the application user; it is called "Mon compte" (My Account).
All non-associative received payments credit "Mon compte".

### Expenses

Expenses can be created, modified, and deleted by the user. They are a debit on an account, whether it's "Mon compte" or an account linked to a client.

An expense has the following fields:
- date
- account (to choose between a client or "Mon compte")
- amount
- description

Expenses have their own pages in the application UI, like payments.

### Dashboard

Association prestations are not mixed with other prestations:

- They are considered as paid by default.
- They do not generate revenue.

Accounts have their own section in the dashboard. In this section, each account with its balance is displayed, without further details. This section appears after the clients section.

### Tax Report

As with the dashboard, association prestations are not mixed with other prestations since they do not generate revenue.

However, the account status is included in the report with the details of prestations for each account.
That is, the list of accounts with, for each one, the prestations (credit) and expenses (debit). In the case of "Mon compte", it's the received payments (credit) and expenses (debit) that are displayed.

## Other Details

An association prestation cannot have a payment ID.

A client can only be deleted if they do not have an account.

## Google Drive

A new tab must be created to record expenses.

Accounts do not exist in Google Drive. They are calculated dynamically by the application.

The migration must be transparent to the user. That is, this new tab must be created dynamically by the application. In this tab, the columns must respect the order of the expense fields as given above.

The only other modification to make is the "associatif" field in the prestation tab.
