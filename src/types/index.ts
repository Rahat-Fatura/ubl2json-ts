/**
 * UBL2JSON TypeScript Type Definitions
 * Türkiye e-Belge sistemi için UBLTR XML formatı tip tanımlamaları
 */

// ============================================================================
// Enum Definitions
// ============================================================================

/** Invoice ProfileID değerleri */
export enum InvoiceProfileId {
  TICARIFATURA = 'TICARIFATURA',
  TEMELFATURA = 'TEMELFATURA',
  YOLCUBERABERFATURA = 'YOLCUBERABERFATURA',
  IHRACAT = 'IHRACAT',
  OZELFATURA = 'OZELFATURA',
  KAMU = 'KAMU',
  HKS = 'HKS',
  ILAC_TIBBICIHAZ = 'ILAC_TIBBICIHAZ',
}

/** Invoice TypeCode değerleri */
export enum InvoiceTypeCode {
  SATIS = 'SATIS',
  IADE = 'IADE',
  TEVKIFAT = 'TEVKIFAT',
  ISTISNA = 'ISTISNA',
  OZELMATRAH = 'OZELMATRAH',
  IHRACKAYITLI = 'IHRACKAYITLI',
  SGK = 'SGK',
  KOMISYONCU = 'KOMISYONCU',
}

/** Despatch ProfileID değerleri */
export enum DespatchProfileId {
  TEMELIRSALIYE = 'TEMELIRSALIYE',
  HKSIRSALIYE = 'HKSIRSALIYE',
}

/** Despatch TypeCode değerleri */
export enum DespatchTypeCode {
  SEVK = 'SEVK',
  MATBUDAN = 'MATBUDAN',
}

/** CreditNote ProfileID değerleri (UBL-TR e-Arşiv makbuz belgeleri) */
export enum CreditNoteProfileId {
  EARSIVBELGE = 'EARSIVBELGE',
}

/** CreditNote TypeCode değerleri (e-Müstahsil Makbuzu) */
export enum CreditNoteTypeCode {
  MUSTAHSILMAKBUZ = 'MUSTAHSILMAKBUZ',
}

// ============================================================================
// Raw XML Parser Types (fast-xml-parser tarafından üretilen ham yapı)
// ============================================================================

/** XML node value wrapper */
export interface XmlValue<T = string> {
  val: T;
  [key: string]: unknown;
}

/** XML amount with currency */
export interface XmlAmount extends XmlValue<number> {
  currencyID?: string;
}

/** XML quantity with unit */
export interface XmlQuantity extends XmlValue<number> {
  unitCode?: string;
}

/** XML ID with scheme */
export interface XmlId extends XmlValue<string> {
  schemeID?: string;
}

/** Raw Party Identification from XML */
export interface RawPartyIdentification {
  ID: XmlId;
}

/** Raw Person from XML */
export interface RawPerson {
  FirstName?: XmlValue;
  MiddleName?: XmlValue;
  FamilyName?: XmlValue;
}

/** Raw Party Name from XML */
export interface RawPartyName {
  Name?: XmlValue;
}

/** Raw Tax Scheme from XML */
export interface RawTaxScheme {
  Name?: XmlValue;
  TaxTypeCode?: XmlValue;
}

/** Raw Party Tax Scheme from XML */
export interface RawPartyTaxScheme {
  TaxScheme?: RawTaxScheme;
}

/** Raw Country from XML */
export interface RawCountry {
  Name?: XmlValue;
}

/** Raw Postal Address from XML */
export interface RawPostalAddress {
  StreetName?: XmlValue;
  BuildingName?: XmlValue;
  BuildingNumber?: XmlValue[];
  Room?: XmlValue;
  CityName?: XmlValue;
  CitySubdivisionName?: XmlValue;
  Country: RawCountry;
  PostalZone?: XmlValue;
}

/** Raw Contact from XML */
export interface RawContact {
  ElectronicMail?: XmlValue;
  Telephone?: XmlValue;
}

/** Raw Party Legal Entity from XML */
export interface RawPartyLegalEntity {
  CompanyID?: XmlValue;
}

/** Raw Party from XML */
export interface RawParty {
  PartyIdentification: RawPartyIdentification[];
  PartyName?: RawPartyName;
  Person?: RawPerson;
  PartyTaxScheme?: RawPartyTaxScheme;
  PostalAddress?: RawPostalAddress;
  Contact?: RawContact;
  PartyLegalEntity?: RawPartyLegalEntity[];
}

/** Raw Customer/Supplier Party from XML */
export interface RawCustomerParty {
  Party: RawParty;
}

/** Raw Tax Category from XML */
export interface RawTaxCategory {
  TaxScheme?: RawTaxScheme;
  TaxExemptionReasonCode?: XmlValue;
  TaxExemptionReason?: XmlValue;
}

/** Raw Tax Subtotal from XML */
export interface RawTaxSubtotal {
  TaxCategory?: RawTaxCategory;
  Percent?: XmlValue<number>;
  TaxableAmount?: XmlAmount;
  TaxAmount?: XmlAmount;
}

/** Raw Tax Total from XML */
export interface RawTaxTotal {
  TaxAmount: XmlAmount;
  TaxSubtotal?: RawTaxSubtotal[];
}

/** Raw Allowance Charge from XML */
export interface RawAllowanceCharge {
  ChargeIndicator?: XmlValue<boolean>;
  AllowanceChargeReason?: XmlValue;
  MultiplierFactorNumeric?: XmlValue<number>;
  Amount?: XmlAmount;
  BaseAmount?: XmlAmount;
}

/** Raw Price from XML */
export interface RawPrice {
  PriceAmount?: XmlAmount;
}

/** Raw Shipment Goods Item from XML */
export interface RawGoodsItem {
  RequiredCustomsID?: XmlValue;
}

/** Raw Shipment from XML */
export interface RawShipment {
  GoodsItem?: RawGoodsItem[];
}

/** Raw Delivery from XML */
export interface RawDelivery {
  Shipment?: RawShipment[];
}

/** Raw Item Instance from XML */
export interface RawItemInstance {
  ProductTraceID?: XmlValue;
  ManufactureDate?: XmlValue;
  ManufactureTime?: XmlValue;
  RegistrationID?: XmlValue;
  SerialID?: XmlValue;
  LotIdentification?: XmlValue;
}

/** Raw Item from XML */
export interface RawItem {
  Name?: XmlValue;
  Description?: XmlValue[];
  Keyword?: XmlValue;
  BrandName?: XmlValue;
  ModelName?: XmlValue;
  BuyersItemIdentification?: { ID?: XmlValue };
  SellersItemIdentification?: { ID?: XmlValue };
  ManufacturersItemIdentification?: { ID?: XmlValue };
  OriginCountry?: XmlValue;
  Delivery?: RawDelivery[];
  ItemInstance?: RawItemInstance[];
}

/** Raw Invoice Line from XML */
export interface RawInvoiceLine {
  ID?: XmlValue;
  Note?: XmlValue;
  InvoicedQuantity?: XmlQuantity;
  LineExtensionAmount?: XmlAmount;
  TaxTotal?: RawTaxTotal[];
  WithholdingTaxTotal?: RawTaxTotal[];
  Item: RawItem[];
  Price: RawPrice;
  AllowanceCharge?: RawAllowanceCharge[];
}

/** Raw Legal Monetary Total from XML */
export interface RawLegalMonetaryTotal {
  LineExtensionAmount: XmlAmount;
  TaxExclusiveAmount: XmlAmount;
  TaxInclusiveAmount: XmlAmount;
  AllowanceTotalAmount?: XmlAmount;
  ChargeTotalAmount?: XmlAmount;
  PayableAmount?: XmlAmount;
}

/** Raw Pricing Exchange Rate from XML */
export interface RawPricingExchangeRate {
  CalculationRate: XmlValue<number>;
}

/** Raw Despatch Document Reference from XML */
export interface RawDespatchDocumentReference {
  ID?: XmlValue;
  IssueDate?: XmlValue;
}

/** Raw Order Reference from XML */
export interface RawOrderReference {
  ID?: XmlValue;
  IssueDate?: XmlValue;
}

/** Raw Invoice Document Reference from XML (BillingReference içi) */
export interface RawInvoiceDocumentReference {
  ID?: XmlValue;
  IssueDate?: XmlValue;
  DocumentTypeCode?: XmlValue;
  DocumentDescription?: XmlValue[];
}

/** Raw Billing Reference from XML (İADE faturasının atıf yaptığı fatura) */
export interface RawBillingReference {
  InvoiceDocumentReference?: RawInvoiceDocumentReference;
}

/** Raw Period from XML (InvoicePeriod) */
export interface RawPeriod {
  StartDate?: XmlValue;
  StartTime?: XmlValue;
  EndDate?: XmlValue;
  EndTime?: XmlValue;
  DurationMeasure?: XmlQuantity;
  Description?: XmlValue[];
}

/** Raw Financial Account from XML */
export interface RawFinancialAccount {
  ID?: XmlValue;
  PaymentNote?: XmlValue;
  CurrencyCode?: XmlValue;
}

/** Raw Payment Means from XML */
export interface RawPaymentMeans {
  PaymentID?: XmlValue;
  PaymentMeansCode?: XmlValue;
  PaymentDueDate?: XmlValue;
  PaymentChannelCode?: XmlValue;
  PayeeFinancialInstitutionBranch?: unknown;
  PayeeFinancialAccount?: RawFinancialAccount;
  PayerFinancialInstitutionBranch?: unknown;
  PayerFinancialAccount?: RawFinancialAccount;
  InstructionNote?: XmlValue;
}

/** Raw Attachment from XML */
export interface RawAttachment {
  EmbeddedDocumentBinaryObject?: XmlValue;
  ExternalReference?: unknown;
}

/** Raw Additional Document Reference from XML */
export interface RawAdditionalDocumentReference {
  ID?: XmlValue;
  IssueDate?: XmlValue;
  DocumentTypeCode?: XmlValue;
  DocumentType?: XmlValue;
  DocumentDescription?: XmlValue;
  Attachment?: RawAttachment;
}

/** Raw Invoice from XML */
export interface RawInvoice {
  UUID: XmlValue;
  ID: XmlValue;
  ProfileID: XmlValue;
  InvoiceTypeCode: XmlValue;
  IssueDate: XmlValue;
  IssueTime?: XmlValue;
  Note?: XmlValue[];
  InvoicePeriod?: RawPeriod;
  BillingReference?: RawBillingReference[];
  DespatchDocumentReference?: RawDespatchDocumentReference[];
  OrderReference?: RawOrderReference;
  PaymentMeans?: RawPaymentMeans[];
  AdditionalDocumentReference?: RawAdditionalDocumentReference[];
  DocumentCurrencyCode: XmlValue;
  PricingExchangeRate?: RawPricingExchangeRate;
  AccountingSupplierParty: RawCustomerParty;
  AccountingCustomerParty: RawCustomerParty;
  BuyerCustomerParty?: RawCustomerParty;
  AllowanceCharge?: RawAllowanceCharge[];
  TaxTotal: RawTaxTotal[];
  WithholdingTaxTotal?: RawTaxTotal[];
  LegalMonetaryTotal: RawLegalMonetaryTotal;
  InvoiceLine: RawInvoiceLine[];
}

/** Root parsed Invoice XML object */
export interface ParsedInvoiceXmlRoot {
  Invoice: RawInvoice;
}

// ============================================================================
// Raw CreditNote Types (e-Müstahsil Makbuzu — UBL CreditNote kökü)
// ============================================================================

/** Raw Credit Note Line from XML — InvoiceLine muadili; miktar CreditedQuantity'de gelir */
export interface RawCreditNoteLine {
  ID?: XmlValue;
  Note?: XmlValue;
  CreditedQuantity?: XmlQuantity;
  LineExtensionAmount?: XmlAmount;
  OrderLineReference?: RawOrderLineReference;
  TaxTotal?: RawTaxTotal[];
  WithholdingTaxTotal?: RawTaxTotal[];
  Item: RawItem[];
  Price: RawPrice;
  AllowanceCharge?: RawAllowanceCharge[];
}

/** Raw Credit Note from XML.
 * NOT: ProfileID/CreditNoteTypeCode bilinçli OPSİYONEL — kütüphane default doldurmaz,
 * yokluk kararı tüketicinin ingest katmanına bırakılır (fail-fast felsefesi). */
export interface RawCreditNote {
  UUID: XmlValue;
  ID: XmlValue;
  ProfileID?: XmlValue;
  CreditNoteTypeCode?: XmlValue;
  IssueDate: XmlValue;
  IssueTime?: XmlValue;
  Note?: XmlValue[];
  DocumentCurrencyCode?: XmlValue;
  LineCountNumeric?: XmlValue<number>;
  AdditionalDocumentReference?: RawAdditionalDocumentReference[];
  PricingExchangeRate?: RawPricingExchangeRate;
  AccountingSupplierParty: RawCustomerParty;
  AccountingCustomerParty: RawCustomerParty;
  /** cac:Delivery ALWAYS_ARRAY'dedir; içeriği şimdilik tüketilmiyor */
  Delivery?: unknown;
  AllowanceCharge?: RawAllowanceCharge[];
  TaxTotal?: RawTaxTotal[];
  WithholdingTaxTotal?: RawTaxTotal[];
  LegalMonetaryTotal: RawLegalMonetaryTotal;
  CreditNoteLine: RawCreditNoteLine[];
}

/** Root parsed CreditNote XML object */
export interface ParsedCreditNoteXmlRoot {
  CreditNote: RawCreditNote;
}

/** @deprecated Use ParsedInvoiceXmlRoot instead */
export type ParsedXmlRoot = ParsedInvoiceXmlRoot;

// ============================================================================
// Raw Despatch Advice Types
// ============================================================================

/** Raw Driver Person from XML */
export interface RawDriverPerson {
  FirstName?: XmlValue;
  FamilyName?: XmlValue;
  Title?: XmlValue;
  NationalityID?: XmlValue;
}

/** Raw Road Transport from XML */
export interface RawRoadTransport {
  LicensePlateID?: XmlId;
}

/** Raw Transport Means from XML */
export interface RawTransportMeans {
  RoadTransport?: RawRoadTransport;
}

/** Raw Shipment Stage from XML */
export interface RawShipmentStage {
  TransportModeCode?: XmlValue;
  TransportMeans?: RawTransportMeans[];
  DriverPerson?: RawDriverPerson[];
}

/** Raw Carrier Party from XML */
export interface RawCarrierParty {
  PartyIdentification?: RawPartyIdentification[];
  PartyName?: RawPartyName;
  PostalAddress?: RawPostalAddress;
}

/** Raw Despatch from XML */
export interface RawDespatch {
  ActualDespatchDate?: XmlValue;
  ActualDespatchTime?: XmlValue;
}

/** Raw Delivery Address from XML */
export interface RawDeliveryAddress {
  StreetName?: XmlValue;
  CitySubdivisionName?: XmlValue;
  CityName?: XmlValue;
  PostalZone?: XmlValue;
  Country?: RawCountry;
}

/** Raw Shipment Delivery from XML */
export interface RawShipmentDelivery {
  DeliveryAddress?: RawDeliveryAddress;
  CarrierParty?: RawCarrierParty;
  Despatch?: RawDespatch;
}

/** Raw Despatch Shipment from XML.
 * NOT: 'Delivery' ALWAYS_ARRAY listesindedir — runtime'da DAİMA array gelir;
 * union tip geriye-uyum içindir (normalizeShipment her iki şekli tolere eder). */
export interface RawDespatchShipment {
  ID?: XmlValue;
  ShipmentStage?: RawShipmentStage[];
  Delivery?: RawShipmentDelivery | RawShipmentDelivery[];
  TransportHandlingUnit?: unknown;
}

/** Raw Despatch Contact from XML */
export interface RawDespatchContact {
  Name?: XmlValue;
}

/** Raw Despatch Supplier Party from XML */
export interface RawDespatchSupplierParty {
  Party: RawParty;
  DespatchContact?: RawDespatchContact;
}

/** Raw Delivery Customer Party from XML */
export interface RawDeliveryCustomerParty {
  Party: RawParty;
}

/** Raw Order Line Reference from XML */
export interface RawOrderLineReference {
  LineID?: XmlValue;
}

/** Raw Despatch Line from XML */
export interface RawDespatchLine {
  ID?: XmlValue;
  Note?: XmlValue;
  DeliveredQuantity?: XmlQuantity;
  OrderLineReference?: RawOrderLineReference;
  Item: RawItem[];
}

/** Raw Despatch Advice from XML */
export interface RawDespatchAdvice {
  UUID: XmlValue;
  ID: XmlValue;
  ProfileID: XmlValue;
  DespatchAdviceTypeCode: XmlValue;
  IssueDate: XmlValue;
  IssueTime?: XmlValue;
  Note?: XmlValue[];
  LineCountNumeric?: XmlValue<number>;
  AdditionalDocumentReference?: RawAdditionalDocumentReference[];
  DespatchSupplierParty: RawDespatchSupplierParty;
  DeliveryCustomerParty: RawDeliveryCustomerParty;
  /** 'Shipment' ALWAYS_ARRAY listesindedir — runtime'da DAİMA array gelir;
   * union tip geriye-uyum içindir (normalizeShipment her iki şekli tolere eder). */
  Shipment?: RawDespatchShipment | RawDespatchShipment[];
  DespatchLine: RawDespatchLine[];
}

/** Root parsed Despatch Advice XML object */
export interface ParsedDespatchXmlRoot {
  DespatchAdvice: RawDespatchAdvice;
}

// ============================================================================
// Normalized Output Types (Kütüphanenin çıktı tipleri)
// ============================================================================

/** Normalized tax subtotal */
export interface TaxSubtotal {
  name: string | undefined;
  code: string | undefined;
  percent: number | undefined;
  taxable: number | undefined;
  taxableCurrency: string | undefined;
  taxExemptionReasonCode: string | undefined;
  /** İstisna gerekçe METNİ (cbc:TaxExemptionReason; kod-alanının serbest-metin karşılığı) */
  taxExemptionReason: string | undefined;
  amount: number | undefined;
  amountCurrency: string | undefined;
}

/** Normalized tax total — bir TaxTotal elementinin tam görünümü (çoklu-TaxTotal desteği) */
export interface TaxTotal {
  taxAmount: number | undefined;
  taxAmountCurrency: string | undefined;
  taxSubtotals: TaxSubtotal[];
}

/** Normalized allowance/charge */
export interface AllowanceCharge {
  isCharge: boolean | undefined;
  reason: string | undefined;
  multiplier: number;
  amount: number;
  amountCurrency: string | undefined;
  baseAmount: number;
  baseAmountCurrency: string | undefined;
}

/** Normalized item instance */
export interface ItemInstance {
  traceId: string | null;
  manufactureDate: string | null;
  manufactureTime: string | null;
  registrationId: string | null;
  serialId: string | null;
  lotId: string | null;
}

/** Normalized line additional info */
export interface LineAdditional {
  description: string | null;
  keyword: string | null;
  brandName: string | null;
  modelName: string | null;
  buyersItemId: string | null;
  sellersItemId: string | null;
  manufacturersItemId: string | null;
  originCountry: string | null;
  gtip: string | undefined;
  instance: ItemInstance[];
}

/** Normalized invoice line */
export interface InvoiceLine {
  id: string | undefined;
  name: string | undefined;
  note: string | undefined;
  quantity: number;
  quantityUnit: string | undefined;
  price: number;
  priceCurrency: string | undefined;
  extensionAmount: number;
  extensionAmountCurrency: string | undefined;
  allowances: AllowanceCharge[];
  taxTotal: number;
  taxSubtotals: TaxSubtotal[];
  /** TÜM TaxTotal elementleri (çoklu-para dahil); mevcut taxTotal/taxSubtotals ilk-elemanı korur */
  taxTotals: TaxTotal[];
  withholdingTaxTotal?: number;
  withholdingTaxSubtotals?: TaxSubtotal[];
  additional: LineAdditional;
}

/** Additional identifier */
export interface AdditionalIdentifier {
  scheme: string | undefined;
  value: string | undefined;
}

/** Structured postal address components (backward-compatible addition to Party.address flat string) */
export interface AddressDetails {
  streetName: string | undefined;
  buildingName: string | undefined;
  buildingNumber: string | undefined;
  room: string | undefined;
  citySubdivision: string | undefined;
  city: string | undefined;
  postalZone: string | undefined;
  country: string | undefined;
}

/** Normalized party */
export interface Party {
  name: string;
  vknTckn: string | undefined;
  taxOffice: string | undefined;
  address: string;
  addressDetails: AddressDetails;
  city: string | undefined;
  citySubdivision: string | undefined;
  country: string | undefined;
  postalZone: string | undefined;
  email: string | undefined;
  phoneNumber: string | undefined;
  additionalIdentifiers: AdditionalIdentifier[];
}

/** Normalized despatch reference */
export interface DespatchReference {
  id: string | undefined;
  date: string | undefined;
}

/** Normalized order reference */
export interface OrderReference {
  id: string | undefined;
  date: string | undefined;
}

/** Normalized billing reference (İADE faturasının atıf yaptığı fatura) */
export interface BillingReference {
  id: string | undefined;
  date: string | undefined;
  documentTypeCode: string | undefined;
  documentDescription: string | undefined;
}

/** Normalized invoice period */
export interface InvoicePeriod {
  startDate: string | undefined;
  endDate: string | undefined;
  durationMeasure: number | undefined;
  durationUnit: string | undefined;
}

/** Normalized payment means */
export interface PaymentMeans {
  id: string | undefined;
  paymentMeansCode: string | undefined;
  paymentDueDate: string | undefined;
  paymentChannel: string | undefined;
  payeeInstitution: unknown;
  payeeAccountId: string | undefined;
  payeeAccountNote: string | undefined;
  payeeCurrency: string | undefined;
  payerInstitution: unknown;
  payerAccountId: string | undefined;
  payerAccountNote: string | undefined;
  payerCurrency: string | undefined;
  instructionNote: string | undefined;
}

/** Normalized additional document reference */
export interface AdditionalDocumentReference {
  id: string | undefined;
  date: string | undefined;
  documentTypeCode: string | undefined;
  documentType: string | undefined;
  documentDescription: string | undefined;
  attachment: RawAttachment | undefined;
}

/** Normalized invoice - Main output type */
export interface Invoice {
  uuid: string;
  envelopeUuid: string | null;
  number: string;
  profileId: string;
  typeCode: string;
  issueDatetime: Date;
  envelopeDatetime: Date | null;
  notes: string[];
  despatches: DespatchReference[];
  order: OrderReference | null;
  /** İADE atfı: BillingReference/InvoiceDocumentReference listesi */
  billingReferences: BillingReference[];
  /** Fatura dönemi (cac:InvoicePeriod); yoksa null */
  invoicePeriod: InvoicePeriod | null;
  paymentMeans: PaymentMeans[];
  additionalDocumentReference: AdditionalDocumentReference[];
  currencyCode: string;
  exchangeRate: number;
  senderObject: Party;
  senderName: string;
  senderTax: string | undefined;
  receiverObject: Party;
  receiverName: string;
  receiverTax: string | undefined;
  buyerCustomerObject: Party | null;
  buyerCustomerName: string | undefined;
  buyerCustomerTax: string | undefined;
  lineExtension: number;
  taxExclusive: number;
  taxInclusive: number;
  taxTotal: number;
  taxSubtotals: TaxSubtotal[];
  /** TÜM belge-düzeyi TaxTotal elementleri (çoklu-para İHRACAT dahil); taxTotal/taxSubtotals ilk-elemanı korur */
  taxTotals: TaxTotal[];
  withholdingTaxTotal: number;
  withholdingTaxSubtotals: TaxSubtotal[];
  allowanceTotal: number;
  chargeTotal: number;
  payableAmount: number;
  /** Belge-düzeyi iskonto/artırımlar (cac:AllowanceCharge) */
  allowanceCharges: AllowanceCharge[];
  lines: InvoiceLine[];
}

/** Normalized credit note (e-Müstahsil Makbuzu) - Main output type.
 * profileId/typeCode default-dolgusuz: XML'de yoksa undefined döner —
 * eski JS-kütüphane 'EARSIVBELGE'/'MUSTAHSILMAKBUZ' doldururdu, bilinçli kırıldı. */
export interface CreditNote {
  uuid: string;
  envelopeUuid: string | null;
  number: string;
  /** cbc:ProfileID — yoksa undefined (default-dolgu YOK) */
  profileId: string | undefined;
  /** cbc:CreditNoteTypeCode — yoksa undefined (default-dolgu YOK; karar tüketicinin) */
  typeCode: string | undefined;
  issueDatetime: Date;
  envelopeDatetime: Date | null;
  notes: string[];
  additionalDocumentReference: AdditionalDocumentReference[];
  /** cbc:DocumentCurrencyCode — yoksa undefined (default-dolgu YOK) */
  currencyCode: string | undefined;
  exchangeRate: number;
  senderObject: Party;
  senderName: string;
  senderTax: string | undefined;
  receiverObject: Party;
  receiverName: string;
  receiverTax: string | undefined;
  lineExtension: number;
  taxExclusive: number;
  taxInclusive: number;
  taxTotal: number;
  taxSubtotals: TaxSubtotal[];
  /** TÜM belge-düzeyi TaxTotal elementleri; taxTotal/taxSubtotals ilk-elemanı korur */
  taxTotals: TaxTotal[];
  withholdingTaxTotal: number;
  withholdingTaxSubtotals: TaxSubtotal[];
  allowanceTotal: number;
  chargeTotal: number;
  payableAmount: number;
  /** Kalemler InvoiceLine şeklinde normalize edilir (miktar CreditedQuantity'den gelir) */
  lines: InvoiceLine[];
}

// ============================================================================
// Normalized Despatch Advice Output Types
// ============================================================================

/** Normalized driver person */
export interface DriverPerson {
  firstName: string | undefined;
  familyName: string | undefined;
  title: string | undefined;
  nationalityId: string | undefined;
}

/** Normalized carrier party */
export interface CarrierParty {
  vknTckn: string | undefined;
  name: string | undefined;
  address: string | undefined;
  city: string | undefined;
  country: string | undefined;
}

/** Normalized delivery address */
export interface DeliveryAddress {
  streetName: string | undefined;
  citySubdivision: string | undefined;
  city: string | undefined;
  postalZone: string | undefined;
  country: string | undefined;
}

/** Normalized shipment info */
export interface ShipmentInfo {
  transportModeCode: string | undefined;
  licensePlate: string | undefined;
  driver: DriverPerson | null;
  carrierParty: CarrierParty | null;
  deliveryAddress: DeliveryAddress | null;
  actualDespatchDate: string | undefined;
  actualDespatchTime: string | undefined;
}

/** Normalized despatch line */
export interface DespatchLine {
  id: string | undefined;
  name: string | undefined;
  note: string | undefined;
  quantity: number;
  quantityUnit: string | undefined;
  orderLineId: string | undefined;
  sellersItemId: string | undefined;
  buyersItemId: string | undefined;
}

/** Normalized despatch advice - Main output type */
export interface DespatchAdvice {
  uuid: string;
  envelopeUuid: string | null;
  number: string;
  profileId: string;
  typeCode: string;
  issueDatetime: Date;
  envelopeDatetime: Date | null;
  notes: string[];
  lineCount: number;
  additionalDocumentReference: AdditionalDocumentReference[];
  senderObject: Party;
  senderName: string;
  senderTax: string | undefined;
  senderDespatchContact: string | undefined;
  receiverObject: Party;
  receiverName: string;
  receiverTax: string | undefined;
  shipment: ShipmentInfo | null;
  lines: DespatchLine[];
}

// ============================================================================
// Configuration Types
// ============================================================================

/** Invoice converter options */
export interface InvoiceConverterOptions {
  /**
   * İhracat faturalarında BuyerCustomerParty'yi ReceiverParty olarak ata
   * @default false
   */
  setBuyerCustomerToReceiverForExportInvoices?: boolean;
}

/** Parser configuration options */
export interface ParserConfig {
  ignoreAttributes: boolean;
  attributeNamePrefix: string;
  allowBooleanAttributes: boolean;
  alwaysCreateTextNode: boolean;
  textNodeName: string;
  cdataPropName: string;
  ignoreDeclaration: boolean;
  ignorePiTags: boolean;
  parseAttributeValue: boolean;
  removeNSPrefix: boolean;
  trimValues: boolean;
  numberParseOptions: {
    leadingZeros: boolean;
  };
  isArray: (name: string, jpath: string) => boolean;
  updateTag: (tag: string, jPath: string) => string | false;
  tagValueProcessor: (
    tagName: string,
    tagValue: string,
    jPath: string,
    hasAttributes: boolean,
    isLeafNode: boolean
  ) => string;
}

// ============================================================================
// Error Types
// ============================================================================

/** Custom error data */
export interface UblParseErrorData {
  message: string;
  cause?: Error | unknown;
}
