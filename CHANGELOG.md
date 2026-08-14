# Changelog

## 1.2.0 (2026-08-14)

### Added

- **CreditNoteConverter**: UBL-TR `CreditNote` documents (e-Müstahsil Makbuzu / producer receipts) are now converted to normalized JSON, mirroring `InvoiceConverter`'s surface (`parseToRaw` / `convert`). New output type `CreditNote`, raw types `RawCreditNote` / `RawCreditNoteLine` / `ParsedCreditNoteXmlRoot`, and enums `CreditNoteProfileId` / `CreditNoteTypeCode`.
- **Parser config**: `CreditNoteLine` added to `ALWAYS_ARRAY_TAG_NAMES`; `CreditNote.UBLExtensions` and `CreditNote.Signature` added to `IGNORE_TAGS`.
- **Line quantity tolerance**: `normalizeLines` now reads `CreditedQuantity` when `InvoicedQuantity` is absent, so credit note lines share the `InvoiceLine` output shape.

### Changed (intentional break from the legacy JS library)

- No default filling on credit notes: `profileId`, `typeCode` and `currencyCode` are `undefined` when the XML omits `ProfileID` / `CreditNoteTypeCode` / `DocumentCurrencyCode` — the legacy library silently filled `EARSIVBELGE` / `MUSTAHSILMAKBUZ` / `TRY`. Absence decisions belong to the consumer's ingest layer (fail-fast philosophy).

## 1.1.0 (2026-07-12)

All changes are backward-compatible additions — existing fields and behaviour are preserved.

### Added

- **Structured address**: `Party.addressDetails` object with `streetName`, `buildingName`, `buildingNumber`, `room`, `citySubdivision`, `city`, `postalZone` and `country`. The flat `Party.address` string is unchanged.
- **Multiple TaxTotal support**: new `taxTotals[]` array on both `Invoice` (document level) and `InvoiceLine` (line level) carrying every `TaxTotal` element (`taxAmount`, `taxAmountCurrency`, `taxSubtotals`). Closes the dual-currency data loss on IHRACAT (export) invoices. The existing `taxTotal`/`taxSubtotals` fields keep their first-TaxTotal behaviour. New exported utility: `normalizeTaxTotals`.
- **Return-invoice attribution**: `Invoice.billingReferences[]` from `BillingReference/InvoiceDocumentReference` (`id`, `date`, `documentTypeCode`, `documentDescription`).
- **Invoice period**: `Invoice.invoicePeriod` (`startDate`, `endDate`, `durationMeasure`, `durationUnit`), `null` when absent.
- **Tax exemption reason text**: `TaxSubtotal.taxExemptionReason` (free-text `cbc:TaxExemptionReason`; the code field already existed).
- **Document-level allowances**: `Invoice.allowanceCharges[]` from document-level `cac:AllowanceCharge`.

### Fixed

- **Long free-text no longer truncated**: the ≥1000-char leaf replacement with `#base64encoded` now applies only to genuine base64 carrier tags (UBL `BinaryObjectType` elements: `EmbeddedDocumentBinaryObject`, `BinaryObject`, `Graphic`, `Picture`, `Sound`, `Video`). Long `Note` and other free-text leaves survive intact. Attachment truncation behaviour is unchanged.
- **Shipment fields no longer empty**: `Shipment` and `Delivery` are `ALWAYS_ARRAY` tags, but `DespatchConverter.normalizeShipment` assumed single objects, so all `ShipmentInfo` fields (`licensePlate`, `driver`, `carrierParty`, `deliveryAddress`, `actualDespatchDate`/`Time`) silently came out empty. Both array and legacy single-object shapes are now tolerated.

## 1.0.2

- Version bump and Invoice enum type exports.

## 1.0.1

- Invoice enum types added.

## 1.0.0

- Initial release with Invoice and Despatch converters.
