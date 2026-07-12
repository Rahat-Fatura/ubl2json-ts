import { XMLParser } from 'fast-xml-parser';
import { parserOptions } from '../config/parser-config';
import { UblParseError } from '../errors/ubl-parse-error';
import { normalizeParty } from '../utils/normalizers';
import type {
  ParsedDespatchXmlRoot,
  RawDespatchAdvice,
  RawDespatchLine,
  RawDespatchShipment,
  RawDriverPerson,
  RawCarrierParty,
  RawDeliveryAddress,
  RawPartyIdentification,
  DespatchAdvice,
  DespatchLine,
  ShipmentInfo,
  DriverPerson,
  CarrierParty,
  DeliveryAddress,
  AdditionalDocumentReference,
} from '../types';

/**
 * Array ise ilk elemanı, değilse kendisini döndürür.
 * 'Shipment' ve 'Delivery' ALWAYS_ARRAY listesinde olduğundan parser bunları DAİMA array üretir;
 * normalizeShipment eski tek-obje varsayımıyla alanları BOŞ döndürüyordu (kütüphane bug'ı).
 */
function firstOf<T>(value: T | T[] | undefined): T | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/**
 * UBLTR DespatchAdvice XML'lerini JSON'a dönüştüren sınıf
 */
export class DespatchConverter {
  private parser: XMLParser;

  constructor() {
    this.parser = new XMLParser(parserOptions);
  }

  /**
   * XML string'i raw JSON'a parse eder
   */
  parseToRaw(xml: string): ParsedDespatchXmlRoot {
    try {
      return this.parser.parse(xml) as ParsedDespatchXmlRoot;
    } catch (error) {
      throw new UblParseError({
        message: 'Failed to parse despatch XML',
        cause: error,
      });
    }
  }

  /**
   * XML string'i normalize edilmiş DespatchAdvice nesnesine dönüştürür
   */
  convert(xml: string): DespatchAdvice {
    const parsed = this.parseToRaw(xml);
    return this.convertDespatch(parsed.DespatchAdvice);
  }

  /**
   * Raw DespatchAdvice'ı normalize edilmiş DespatchAdvice'a dönüştürür
   */
  private convertDespatch(json: RawDespatchAdvice): DespatchAdvice {
    const issueDateStr = json.IssueDate.val.substring(0, 10);
    const issueTimeStr = json.IssueTime?.val?.substring(0, 8) ?? '00:00:00';

    const senderParty = normalizeParty(json.DespatchSupplierParty);
    const receiverParty = normalizeParty(json.DeliveryCustomerParty);

    return {
      uuid: json.UUID.val,
      envelopeUuid: null,
      number: json.ID.val,
      profileId: json.ProfileID.val,
      typeCode: json.DespatchAdviceTypeCode.val,
      issueDatetime: new Date(`${issueDateStr}T${issueTimeStr}Z`),
      envelopeDatetime: null,
      notes: this.normalizeNotes(json.Note),
      lineCount: json.LineCountNumeric?.val ?? json.DespatchLine.length,
      additionalDocumentReference: this.normalizeAdditionalDocumentReferences(
        json.AdditionalDocumentReference
      ),
      senderObject: senderParty,
      senderName: senderParty.name,
      senderTax: senderParty.vknTckn,
      senderDespatchContact: json.DespatchSupplierParty.DespatchContact?.Name?.val,
      receiverObject: receiverParty,
      receiverName: receiverParty.name,
      receiverTax: receiverParty.vknTckn,
      shipment: this.normalizeShipment(json.Shipment),
      lines: this.normalizeLines(json.DespatchLine),
    };
  }

  /**
   * Note array'ini normalize eder
   */
  private normalizeNotes(notes: RawDespatchAdvice['Note']): string[] {
    if (!notes) {
      return [];
    }
    return notes
      .map((note) => note.val)
      .filter((val): val is string => val !== undefined && val !== null && val !== '');
  }

  /**
   * AdditionalDocumentReference array'ini normalize eder
   */
  private normalizeAdditionalDocumentReferences(
    refs: RawDespatchAdvice['AdditionalDocumentReference']
  ): AdditionalDocumentReference[] {
    if (!refs) {
      return [];
    }
    return refs.map((ref) => ({
      id: ref.ID?.val,
      date: ref.IssueDate?.val,
      documentTypeCode: ref.DocumentTypeCode?.val,
      documentType: ref.DocumentType?.val,
      documentDescription: ref.DocumentDescription?.val,
      attachment: ref.Attachment,
    }));
  }

  /**
   * Shipment bilgisini normalize eder (Shipment/Delivery array-toleranslı — ALWAYS_ARRAY uyumu)
   */
  private normalizeShipment(
    shipmentInput: RawDespatchShipment | RawDespatchShipment[] | undefined
  ): ShipmentInfo | null {
    const shipment = firstOf(shipmentInput);
    if (!shipment) {
      return null;
    }

    const shipmentStage = shipment.ShipmentStage?.[0];
    const delivery = firstOf(shipment.Delivery);

    return {
      transportModeCode: shipmentStage?.TransportModeCode?.val,
      licensePlate: shipmentStage?.TransportMeans?.[0]?.RoadTransport?.LicensePlateID?.val,
      driver: this.normalizeDriver(shipmentStage?.DriverPerson?.[0]),
      carrierParty: this.normalizeCarrierParty(delivery?.CarrierParty),
      deliveryAddress: this.normalizeDeliveryAddress(delivery?.DeliveryAddress),
      actualDespatchDate: delivery?.Despatch?.ActualDespatchDate?.val,
      actualDespatchTime: delivery?.Despatch?.ActualDespatchTime?.val,
    };
  }

  /**
   * Driver bilgisini normalize eder
   */
  private normalizeDriver(driver: RawDriverPerson | undefined): DriverPerson | null {
    if (!driver) {
      return null;
    }
    return {
      firstName: driver.FirstName?.val,
      familyName: driver.FamilyName?.val,
      title: driver.Title?.val,
      nationalityId: driver.NationalityID?.val,
    };
  }

  /**
   * Carrier party bilgisini normalize eder
   */
  private normalizeCarrierParty(carrier: RawCarrierParty | undefined): CarrierParty | null {
    if (!carrier) {
      return null;
    }

    const vknTcknId = carrier.PartyIdentification?.find(
      (id: RawPartyIdentification) => id?.ID?.schemeID === 'VKN' || id?.ID?.schemeID === 'TCKN'
    );

    let vknTckn: string | undefined;
    if (vknTcknId?.ID?.val) {
      const strValue = String(vknTcknId.ID.val);
      if (vknTcknId.ID.schemeID === 'TCKN') {
        vknTckn = strValue.padStart(11, '0');
      } else {
        vknTckn = strValue.padStart(10, '0');
      }
    }

    return {
      vknTckn,
      name: carrier.PartyName?.Name?.val,
      address: carrier.PostalAddress?.StreetName?.val,
      city: carrier.PostalAddress?.CityName?.val,
      country: carrier.PostalAddress?.Country?.Name?.val,
    };
  }

  /**
   * Delivery address bilgisini normalize eder
   */
  private normalizeDeliveryAddress(address: RawDeliveryAddress | undefined): DeliveryAddress | null {
    if (!address) {
      return null;
    }
    return {
      streetName: address.StreetName?.val,
      citySubdivision: address.CitySubdivisionName?.val,
      city: address.CityName?.val,
      postalZone: address.PostalZone?.val,
      country: address.Country?.Name?.val,
    };
  }

  /**
   * Despatch line array'ini normalize eder
   */
  private normalizeLines(lines: RawDespatchLine[]): DespatchLine[] {
    return lines.map((line): DespatchLine => {
      const item = line.Item?.[0];
      return {
        id: line.ID?.val,
        name: item?.Name?.val,
        note: line.Note?.val,
        quantity: line.DeliveredQuantity?.val ?? 0,
        quantityUnit: line.DeliveredQuantity?.unitCode,
        orderLineId: line.OrderLineReference?.LineID?.val,
        sellersItemId: item?.SellersItemIdentification?.ID?.val,
        buyersItemId: item?.BuyersItemIdentification?.ID?.val,
      };
    });
  }
}
