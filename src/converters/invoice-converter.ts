import { XMLParser } from 'fast-xml-parser';
import { parserOptions } from '../config/parser-config';
import { UblParseError } from '../errors/ubl-parse-error';
import {
  setDefaults,
  normalizeTaxSubtotals,
  normalizeTaxTotals,
  normalizeLines,
  normalizeParty,
} from '../utils/normalizers';
import type {
  ParsedXmlRoot,
  RawInvoice,
  Invoice,
  InvoiceConverterOptions,
  DespatchReference,
  PaymentMeans,
  AdditionalDocumentReference,
} from '../types';

/**
 * UBL-TR XML faturalarını JSON formatına dönüştüren sınıf
 *
 * @example
 * ```typescript
 * const converter = new InvoiceConverter();
 * const invoice = await converter.convert(xmlString);
 * console.log(invoice.uuid);
 * ```
 */
export class InvoiceConverter {
  private readonly parser: XMLParser;
  private readonly options: InvoiceConverterOptions;

  /**
   * InvoiceConverter instance oluşturur
   * @param options - Dönüştürme seçenekleri
   */
  constructor(options?: Partial<InvoiceConverterOptions>) {
    this.parser = new XMLParser(parserOptions);
    this.options = setDefaults(options);
  }

  /**
   * XML string'i parse edilmiş raw JSON'a dönüştürür
   * @param xml - UBL-TR XML string
   * @returns Parse edilmiş ham JSON objesi
   */
  public parseToRaw(xml: string): ParsedXmlRoot {
    try {
      return this.parser.parse(xml) as ParsedXmlRoot;
    } catch (error) {
      throw new UblParseError({
        message: 'XML parse edilirken hata oluştu.',
        cause: error,
      });
    }
  }

  /**
   * XML string'i normalize edilmiş Invoice objesine dönüştürür
   * @param xml - UBL-TR XML string
   * @returns Normalize edilmiş Invoice objesi
   */
  public convert(xml: string): Invoice {
    try {
      const rawJson = this.parseToRaw(xml);
      return this.normalizeInvoice(rawJson.Invoice);
    } catch (error) {
      if (error instanceof UblParseError) {
        throw error;
      }
      throw new UblParseError({
        message: 'Fatura dönüştürülürken hata oluştu.',
        cause: error,
      });
    }
  }

  /**
   * Raw Invoice objesini normalize eder
   */
  private normalizeInvoice(json: RawInvoice): Invoice {
    const taxSubtotals = normalizeTaxSubtotals(json.TaxTotal[0]);
    const withholdingTaxSubtotals = normalizeTaxSubtotals(
      json.WithholdingTaxTotal?.[0]
    );
    const lines = normalizeLines(json.InvoiceLine);

    const senderParty = normalizeParty(json.AccountingSupplierParty);
    const receiverParty = normalizeParty(json.AccountingCustomerParty);
    const buyerCustomer = json.BuyerCustomerParty
      ? normalizeParty(json.BuyerCustomerParty)
      : null;

    const invoice: Invoice = {
      uuid: json.UUID.val,
      envelopeUuid: null,
      number: json.ID.val,
      profileId: json.ProfileID.val,
      typeCode: json.InvoiceTypeCode.val,
      issueDatetime: this.parseDateTime(json.IssueDate.val, json.IssueTime?.val),
      envelopeDatetime: null,
      notes: this.extractNotes(json.Note),
      despatches: this.extractDespatches(json.DespatchDocumentReference),
      order: this.extractOrderReference(json.OrderReference),
      paymentMeans: this.extractPaymentMeans(json.PaymentMeans),
      additionalDocumentReference: this.extractAdditionalDocuments(
        json.AdditionalDocumentReference
      ),
      currencyCode: json.DocumentCurrencyCode.val,
      exchangeRate: json.PricingExchangeRate?.CalculationRate?.val ?? 1,
      senderObject: senderParty,
      senderName: senderParty.name,
      senderTax: senderParty.vknTckn,
      receiverObject: receiverParty,
      receiverName: receiverParty.name,
      receiverTax: receiverParty.vknTckn,
      buyerCustomerObject: buyerCustomer,
      buyerCustomerName: buyerCustomer?.name,
      buyerCustomerTax: buyerCustomer?.vknTckn,
      lineExtension: json.LegalMonetaryTotal.LineExtensionAmount.val ?? 0,
      taxExclusive: json.LegalMonetaryTotal.TaxExclusiveAmount.val ?? 0,
      taxInclusive: json.LegalMonetaryTotal.TaxInclusiveAmount.val ?? 0,
      taxTotal: json.TaxTotal[0]?.TaxAmount?.val ?? 0,
      taxSubtotals,
      taxTotals: normalizeTaxTotals(json.TaxTotal),
      withholdingTaxTotal: json.WithholdingTaxTotal?.[0]?.TaxAmount?.val ?? 0,
      withholdingTaxSubtotals,
      allowanceTotal: json.LegalMonetaryTotal.AllowanceTotalAmount?.val ?? 0,
      chargeTotal: json.LegalMonetaryTotal.ChargeTotalAmount?.val ?? 0,
      payableAmount: json.LegalMonetaryTotal.PayableAmount?.val ?? 0,
      lines,
    };

    return this.applyExportInvoiceLogic(invoice);
  }

  /**
   * İhracat faturası için BuyerCustomer -> Receiver ataması yapar
   */
  private applyExportInvoiceLogic(invoice: Invoice): Invoice {
    if (
      this.options.setBuyerCustomerToReceiverForExportInvoices &&
      invoice.profileId === 'IHRACAT' &&
      invoice.buyerCustomerObject
    ) {
      return {
        ...invoice,
        receiverObject: invoice.buyerCustomerObject,
        receiverName: invoice.buyerCustomerName ?? '',
        receiverTax: invoice.buyerCustomerTax,
        buyerCustomerObject: null,
        buyerCustomerName: undefined,
        buyerCustomerTax: undefined,
      };
    }
    return invoice;
  }

  /**
   * Tarih ve saati parse eder
   */
  private parseDateTime(dateStr: string, timeStr?: string): Date {
    const datePart = dateStr.substring(0, 10);
    const timePart = timeStr ? timeStr.substring(0, 8) : '00:00:00';
    return new Date(`${datePart}T${timePart}Z`);
  }

  /**
   * Not array'ini extract eder
   */
  private extractNotes(
    notes: { val: string }[] | undefined
  ): string[] {
    if (!notes) {
      return [];
    }
    return notes.map((note) => note.val);
  }

  /**
   * İrsaliye referanslarını extract eder
   */
  private extractDespatches(
    despatches: { ID?: { val: string }; IssueDate?: { val: string } }[] | undefined
  ): DespatchReference[] {
    if (!Array.isArray(despatches)) {
      return [];
    }
    return despatches.map((despatch) => ({
      id: despatch.ID?.val,
      date: despatch.IssueDate?.val,
    }));
  }

  /**
   * Sipariş referansını extract eder
   */
  private extractOrderReference(
    order: { ID?: { val: string }; IssueDate?: { val: string } } | undefined
  ): { id: string | undefined; date: string | undefined } | null {
    if (!order?.ID) {
      return null;
    }
    return {
      id: order.ID?.val,
      date: order.IssueDate?.val,
    };
  }

  /**
   * Ödeme bilgilerini extract eder
   */
  private extractPaymentMeans(
    payments: {
      PaymentID?: { val: string };
      PaymentMeansCode?: { val: string };
      PaymentDueDate?: { val: string };
      PaymentChannelCode?: { val: string };
      PayeeFinancialInstitutionBranch?: unknown;
      PayeeFinancialAccount?: {
        ID?: { val: string };
        PaymentNote?: { val: string };
        CurrencyCode?: { val: string };
      };
      PayerFinancialInstitutionBranch?: unknown;
      PayerFinancialAccount?: {
        ID?: { val: string };
        PaymentNote?: { val: string };
        CurrencyCode?: { val: string };
      };
      InstructionNote?: { val: string };
    }[] | undefined
  ): PaymentMeans[] {
    if (!Array.isArray(payments)) {
      return [];
    }
    return payments.map((payment) => ({
      id: payment.PaymentID?.val,
      paymentMeansCode: payment.PaymentMeansCode?.val,
      paymentDueDate: payment.PaymentDueDate?.val,
      paymentChannel: payment.PaymentChannelCode?.val,
      payeeInstitution: payment.PayeeFinancialInstitutionBranch,
      payeeAccountId: payment.PayeeFinancialAccount?.ID?.val,
      payeeAccountNote: payment.PayeeFinancialAccount?.PaymentNote?.val,
      payeeCurrency: payment.PayeeFinancialAccount?.CurrencyCode?.val,
      payerInstitution: payment.PayerFinancialInstitutionBranch,
      payerAccountId: payment.PayerFinancialAccount?.ID?.val,
      payerAccountNote: payment.PayerFinancialAccount?.PaymentNote?.val,
      payerCurrency: payment.PayerFinancialAccount?.CurrencyCode?.val,
      instructionNote: payment.InstructionNote?.val,
    }));
  }

  /**
   * Ek belge referanslarını extract eder
   */
  private extractAdditionalDocuments(
    docs: {
      ID?: { val: string };
      IssueDate?: { val: string };
      DocumentTypeCode?: { val: string };
      DocumentType?: { val: string };
      DocumentDescription?: { val: string };
      Attachment?: unknown;
    }[] | undefined
  ): AdditionalDocumentReference[] {
    if (!Array.isArray(docs)) {
      return [];
    }
    return docs.map((doc) => ({
      id: doc.ID?.val,
      date: doc.IssueDate?.val,
      documentTypeCode: doc.DocumentTypeCode?.val,
      documentType: doc.DocumentType?.val,
      documentDescription: doc.DocumentDescription?.val,
      attachment: doc.Attachment as AdditionalDocumentReference['attachment'],
    }));
  }

  /**
   * Converter options'ı günceller
   */
  public updateOptions(options: Partial<InvoiceConverterOptions>): void {
    Object.assign(this.options, setDefaults({ ...this.options, ...options }));
  }

  /**
   * Mevcut options'ı döndürür
   */
  public getOptions(): InvoiceConverterOptions {
    return { ...this.options };
  }
}
