# Availability Schema Documentation

About `availability.schema.ts`
Bu dosya, müsaitlik bloğu oluşturma istekleri için Zod validasyon şemalarını içerir. `schemas/` dizininde bulunur.

## Şemalar

### `CreateAvailabilityBlockSchema`
`POST /units/:unitId/availability/close` isteği için validasyon kuralları.

- **Body**:
  - `start_date` (string -> Date): ISO 8601 formatında olmalı.
  - `end_date` (string -> Date): ISO 8601 formatında olmalı.
  - `source` (enum, optional): Bloklama kaynağı. Geçerli değerler: `ownerBlocked`, `maintenance`, `renovation`.
- **Params**:
  - `unitId` (string): Boş olamaz.

- **Özel Kontroller (Refinements)**:
  - `end_date > start_date`: Bitiş tarihi başlangıçtan sonra olmalı.
  - `start_date >= now`: Başlangıç tarihi geçmişte olmamalı.
