# About `Unit.model.ts`

Defines the `Unit` model, representing a rentable property or room belonging to an account.

## Schema: `UnitSchema`

*   **Fields**:
    *   `account_id` (ObjectId, ref: 'Account', required): The tenant this unit belongs to.
    *   `name` (String, required): The name of the unit.
*   **Indexes**:
    *   `{ account_id: 1 }`: Optimized for fetching all units for a specific account.
*   **Plugins**:
    *   `timestamps`: Adds `createdAt` and `updatedAt`.

## Usage

*   Represents the physical inventory that can be reserved.
