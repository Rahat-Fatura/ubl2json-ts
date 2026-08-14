import { XMLParser } from 'fast-xml-parser';
import { parserOptions } from '../config/parser-config';
import { UblParseError } from '../errors/ubl-parse-error';
import {
  normalizeTaxSubtotals,
  normalizeTaxTotals,
  normalizeLines,
  normalizeParty,
} from '../utils/normalizers';
import type {
  ParsedCreditNoteXmlRoot,
  RawCreditNote,
  RawAdditionalDocumentReference,
  XmlValue,
  CreditNote,
  AdditionalDocumentReference,
} from '../types';

/**
 * UBL-TR CreditNote (e-Müstahsil Makbuzu) XML'lerini JSON formatına dönüştüren sınıf.
 *
 * Port notu: eski JS-kütüphanenin producerReceipt servisinin TS karşılığıdır; ancak
 * default-dolgu felsefesi bilinçli kırılmıştır — ProfileID/CreditNoteTypeCode/DocumentCurrencyCode
 * XML'de yoksa 'EARSIVBELGE'/'MUSTAHSILMAKBUZ'/'TRY' UYDURULMAZ, undefined döner.
 * Yokluk kararı (ör. 400-red) tüketicinin ingest katmanınındır.
 *
 * @example
 * ```typescript
 * const converter = new CreditNoteConverter();
 * const receipt = converter.convert(xmlString);
 * console.log(receipt.uuid, receipt.typeCode);
 * ```
 */
export class CreditNoteConverter {
  private readonly parser: XMLParser;

  constructor() {
    this.parser = new XMLParser(parserOptions);
  }

  /**
   * XML string'i parse edilmiş raw JSON'a dönüştürür
   * @param xml - UBL-TR CreditNote XML string
   * @returns Parse edilmiş ham JSON objesi
   */
  public parseToRaw(xml: string): ParsedCreditNoteXmlRoot {
    try {
      return this.parser.parse(xml) as ParsedCreditNoteXmlRoot;
    } catch (error) {
      throw new UblParseError({
        message: 'XML parse edilirken hata oluştu.',
        cause: error,
      });
    }
  }

  /**
   * XML string'i normalize edilmiş CreditNote objesine dönüştürür
   * @param xml - UBL-TR CreditNote XML string
   * @returns Normalize edilmiş CreditNote objesi
   */
  public convert(xml: string): CreditNote {
    try {
      const rawJson = this.parseToRaw(xml);
      return this.normalizeCreditNote(rawJson.CreditNote);
    } catch (error) {
      if (error instanceof UblParseError) {
        throw error;
      }
      throw new UblParseError({
        message: 'Makbuz dönüştürülürken hata oluştu.',
        cause: error,
      });
    }
  }

  /**
   * Raw CreditNote objesini normalize eder
   */
  private normalizeCreditNote(json: RawCreditNote): CreditNote {
    // TaxTotal'sız belge tolere edilir (boş subtotal + 0 toplam) — makbuzlarda
    // stopaj TaxTotal'da taşınır ama yokluğu parse'ı düşürmez.
    const taxSubtotals = normalizeTaxSubtotals(json.TaxTotal?.[0]);
    const withholdingTaxSubtotals = normalizeTaxSubtotals(
      json.WithholdingTaxTotal?.[0]
    );
    const lines = normalizeLines(json.CreditNoteLine);

    const senderParty = normalizeParty(json.AccountingSupplierParty);
    const receiverParty = normalizeParty(json.AccountingCustomerParty);

    return {
      uuid: json.UUID.val,
      envelopeUuid: null,
      number: json.ID.val,
      // default-dolgu YOK: yoksa undefined (JS-kütüphane 'EARSIVBELGE' doldururdu)
      profileId: json.ProfileID?.val,
      // default-dolgu YOK: yoksa undefined (JS-kütüphane 'MUSTAHSILMAKBUZ' doldururdu)
      typeCode: json.CreditNoteTypeCode?.val,
      issueDatetime: this.parseDateTime(json.IssueDate.val, json.IssueTime?.val),
      envelopeDatetime: null,
      notes: this.extractNotes(json.Note),
      additionalDocumentReference: this.extractAdditionalDocuments(
        json.AdditionalDocumentReference
      ),
      // default-dolgu YOK: yoksa undefined (JS-kütüphane 'TRY' doldururdu)
      currencyCode: json.DocumentCurrencyCode?.val,
      exchangeRate: json.PricingExchangeRate?.CalculationRate?.val ?? 1,
      senderObject: senderParty,
      senderName: senderParty.name,
      senderTax: senderParty.vknTckn,
      receiverObject: receiverParty,
      receiverName: receiverParty.name,
      receiverTax: receiverParty.vknTckn,
      lineExtension: json.LegalMonetaryTotal.LineExtensionAmount?.val ?? 0,
      taxExclusive: json.LegalMonetaryTotal.TaxExclusiveAmount?.val ?? 0,
      taxInclusive: json.LegalMonetaryTotal.TaxInclusiveAmount?.val ?? 0,
      taxTotal: json.TaxTotal?.[0]?.TaxAmount?.val ?? 0,
      taxSubtotals,
      taxTotals: normalizeTaxTotals(json.TaxTotal),
      withholdingTaxTotal: json.WithholdingTaxTotal?.[0]?.TaxAmount?.val ?? 0,
      withholdingTaxSubtotals,
      allowanceTotal: json.LegalMonetaryTotal.AllowanceTotalAmount?.val ?? 0,
      chargeTotal: json.LegalMonetaryTotal.ChargeTotalAmount?.val ?? 0,
      payableAmount: json.LegalMonetaryTotal.PayableAmount?.val ?? 0,
      lines,
    };
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
   * Not array'ini extract eder — boş notlar elenir, sayısal parse edilen
   * yapraklar string'e sabitlenir (JS-referans davranışı).
   */
  private extractNotes(notes: XmlValue[] | undefined): string[] {
    if (!notes) {
      return [];
    }
    return notes
      .map((note) =>
        note?.val === undefined || note.val === null ? '' : String(note.val)
      )
      .filter((val) => val !== '');
  }

  /**
   * Ek belge referanslarını extract eder (EMM_KOMISYON vb. üstveri satırları + XSLT eki)
   */
  private extractAdditionalDocuments(
    docs: RawAdditionalDocumentReference[] | undefined
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
      attachment: doc.Attachment,
    }));
  }
}
