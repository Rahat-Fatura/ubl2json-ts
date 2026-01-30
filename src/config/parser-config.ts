import type { X2jOptions } from 'fast-xml-parser';

/**
 * XML tagları ki her zaman array olarak parse edilmeli
 */
const ALWAYS_ARRAY_TAG_NAMES: readonly string[] = [
  'Note',
  'BillingReference',
  'DespatchDocumentReference',
  'ReceiptDocumentReference',
  'OriginatorDocumentReference',
  'ContractDocumentReference',
  'AdditionalDocumentReference',
  'Delivery',
  'PaymentMeans',
  'AllowanceCharge',
  'TaxTotal',
  'TaxSubtotal',
  'WithholdingTaxTotal',
  'InvoiceLine',
  'DespatchLine',
  'BuildingNumber',
  'BillingReferenceLine',
  'OtherCommunication',
  'JuridictionRegionAddress',
  'DeliveryTerms',
  'OutstandingReason',
  'DocumentReference',
  'Shipment',
  'Description',
  'DocumentDescription',
  'Item',
  'FreightAllowanceCharge',
  'Temperature',
  'MeasurementDimension',
  'OrderLineReference',
  'DespatchLineReference',
  'ReceiptLineReference',
  'SubInvoiceLine',
  'AdditionalItemIdentification',
  'CommodityClassification',
  'ItemInstance',
  'ShipsRequirements',
  'PackagingMaterial',
  'ContainedPackage',
  'GoodsItem',
  'PartyLegalEntity',
  'RejectReason',
  'SpecialInstructions',
  'TransportHandlingUnit',
  'TransitDirectionCode',
  'DriverPerson',
  'ShipmentStage',
  'Location',
  'DamageRemarks',
  'ActualPackage',
  'TransportEquipment',
  'TransportMeans',
  'HazardousGoodsTransit',
  'ShipmentDocumentReference',
  'CustomsDeclaration',
  'RegistrationNationality',
  'PartyIdentification',
  'Response',
] as const;

/**
 * Yok sayılacak XML tag yolları
 */
const IGNORE_TAGS: readonly string[] = [
  'Invoice.UBLExtensions',
  'Invoice.Signature',
  'DespatchAdvice.UBLExtensions',
  'DespatchAdvice.Signature',
] as const;

/**
 * Base64 encode edilmiş içerik için maksimum karakter limiti
 */
const BASE64_THRESHOLD = 1000;

/**
 * fast-xml-parser için parser konfigürasyonu
 */
export const parserOptions: X2jOptions = {
  ignoreAttributes: false,
  attributeNamePrefix: '',
  allowBooleanAttributes: true,
  alwaysCreateTextNode: true,
  textNodeName: 'val',
  cdataPropName: '',
  ignoreDeclaration: true,
  ignorePiTags: true,
  parseAttributeValue: true,
  removeNSPrefix: true,
  trimValues: true,
  numberParseOptions: {
    leadingZeros: false,
    hex: false,
  },
  isArray: (name: string, jpath: string): boolean => {
    return ALWAYS_ARRAY_TAG_NAMES.includes(name) || jpath.length === 0;
  },
  updateTag: (tag: string, jPath: string): string | false => {
    if (IGNORE_TAGS.includes(jPath)) {
      return false;
    }
    return tag;
  },
  tagValueProcessor: (
    _tagName: string,
    tagValue: string,
    _jPath: string,
    _hasAttributes: boolean,
    isLeafNode: boolean
  ): string => {
    if (isLeafNode && tagValue.length < BASE64_THRESHOLD) {
      return tagValue;
    }
    return '#base64encoded';
  },
};

export { ALWAYS_ARRAY_TAG_NAMES, IGNORE_TAGS, BASE64_THRESHOLD };
