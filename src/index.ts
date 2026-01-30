/**
 * UBL2JSON-TS
 * Türkiye e-Belge sistemi için UBLTR XML formatını JSON'a dönüştüren modern TypeScript kütüphanesi
 *
 * @packageDocumentation
 */

// Main converter classes
export { InvoiceConverter } from './converters/invoice-converter';
export { DespatchConverter } from './converters/despatch-converter';

// Enums
export { DespatchProfileId, DespatchTypeCode } from './types';

// Error classes
export { UblParseError } from './errors/ubl-parse-error';

// Configuration
export { parserOptions } from './config/parser-config';

// Types - All exported for library users
export type {
  // Raw XML types
  XmlValue,
  XmlAmount,
  XmlQuantity,
  XmlId,
  RawPartyIdentification,
  RawPerson,
  RawPartyName,
  RawTaxScheme,
  RawPartyTaxScheme,
  RawCountry,
  RawPostalAddress,
  RawContact,
  RawPartyLegalEntity,
  RawParty,
  RawCustomerParty,
  RawTaxCategory,
  RawTaxSubtotal,
  RawTaxTotal,
  RawAllowanceCharge,
  RawPrice,
  RawGoodsItem,
  RawShipment,
  RawDelivery,
  RawItemInstance,
  RawItem,
  RawInvoiceLine,
  RawLegalMonetaryTotal,
  RawPricingExchangeRate,
  RawDespatchDocumentReference,
  RawOrderReference,
  RawFinancialAccount,
  RawPaymentMeans,
  RawAttachment,
  RawAdditionalDocumentReference,
  RawInvoice,
  ParsedXmlRoot,
  ParsedInvoiceXmlRoot,
  // Raw Despatch types
  RawDriverPerson,
  RawRoadTransport,
  RawTransportMeans,
  RawShipmentStage,
  RawCarrierParty,
  RawDespatch,
  RawDeliveryAddress,
  RawShipmentDelivery,
  RawDespatchShipment,
  RawDespatchContact,
  RawDespatchSupplierParty,
  RawDeliveryCustomerParty,
  RawOrderLineReference,
  RawDespatchLine,
  RawDespatchAdvice,
  ParsedDespatchXmlRoot,
  // Normalized output types
  TaxSubtotal,
  AllowanceCharge,
  ItemInstance,
  LineAdditional,
  InvoiceLine,
  AdditionalIdentifier,
  Party,
  DespatchReference,
  OrderReference,
  PaymentMeans,
  AdditionalDocumentReference,
  Invoice,
  // Normalized Despatch types
  DriverPerson,
  CarrierParty,
  DeliveryAddress,
  ShipmentInfo,
  DespatchLine,
  DespatchAdvice,
  // Config types
  InvoiceConverterOptions,
  ParserConfig,
  UblParseErrorData,
} from './types';

// Utility functions (for advanced users)
export {
  setDefaults,
  normalizeTaxSubtotals,
  normalizeAllowanceCharges,
  normalizeLines,
  normalizeParty,
} from './utils/normalizers';
