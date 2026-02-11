# About `Account.model.ts`

Defines the `Account` model, which represents a tenant in the system.

## Schema: `AccountSchema`

*   **Fields**:
    *   `name` (String, required): The name of the account/tenant.
    *   `status` (String, enum: ['active', 'inactive'], default: 'active'): The status of the account.
    *   `settings` (Object, optional): Flexible object for future account-specific settings.
*   **Plugins**:
    *   `timestamps`: Adds `createdAt` and `updatedAt` fields.

## Usage

*   Used as the root entity for multi-tenancy.
*   Referenced by almost all other models via `account_id`.
