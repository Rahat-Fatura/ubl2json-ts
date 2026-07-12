import type {
  RawTaxTotal,
  RawTaxSubtotal,
  RawAllowanceCharge,
  RawInvoiceLine,
  RawCustomerParty,
  RawPartyIdentification,
  RawItemInstance,
  TaxSubtotal,
  TaxTotal,
  AllowanceCharge,
  InvoiceLine,
  Party,
  AddressDetails,
  ItemInstance,
  AdditionalIdentifier,
  InvoiceConverterOptions,
} from '../types';

/**
 * Varsayılan converter seçeneklerini ayarlar
 */
export function setDefaults(
  args?: Partial<InvoiceConverterOptions>
): InvoiceConverterOptions {
  return {
    setBuyerCustomerToReceiverForExportInvoices:
      args?.setBuyerCustomerToReceiverForExportInvoices ?? false,
  };
}

/**
 * Tax subtotal array'ini normalize eder
 */
export function normalizeTaxSubtotals(
  taxTotal: RawTaxTotal | undefined | null
): TaxSubtotal[] {
  if (!taxTotal?.TaxSubtotal) {
    return [];
  }

  return taxTotal.TaxSubtotal.map((taxSub: RawTaxSubtotal): TaxSubtotal => ({
    name: taxSub.TaxCategory?.TaxScheme?.Name?.val,
    code: taxSub.TaxCategory?.TaxScheme?.TaxTypeCode?.val,
    percent: taxSub.Percent?.val,
    taxable: taxSub.TaxableAmount?.val,
    taxableCurrency: taxSub.TaxableAmount?.currencyID,
    taxExemptionReasonCode: taxSub.TaxCategory?.TaxExemptionReasonCode?.val,
    amount: taxSub.TaxAmount?.val,
    amountCurrency: taxSub.TaxAmount?.currencyID,
  }));
}

/**
 * TÜM TaxTotal elementlerini normalize eder (çoklu-para desteği).
 * Mevcut normalizeTaxSubtotals (ilk-TaxTotal) davranışı korunur; bu fonksiyon EK'tir.
 */
export function normalizeTaxTotals(
  taxTotals: RawTaxTotal[] | undefined | null
): TaxTotal[] {
  if (!taxTotals) {
    return [];
  }

  return taxTotals.map((taxTotal: RawTaxTotal): TaxTotal => ({
    taxAmount: taxTotal.TaxAmount?.val,
    taxAmountCurrency: taxTotal.TaxAmount?.currencyID,
    taxSubtotals: normalizeTaxSubtotals(taxTotal),
  }));
}

/**
 * Allowance/Charge array'ini normalize eder
 */
export function normalizeAllowanceCharges(
  allowanceCharges: RawAllowanceCharge[] | undefined
): AllowanceCharge[] {
  if (!allowanceCharges) {
    return [];
  }

  return allowanceCharges.map(
    (charge: RawAllowanceCharge): AllowanceCharge => ({
      isCharge: charge.ChargeIndicator?.val,
      reason: charge.AllowanceChargeReason?.val,
      multiplier: charge.MultiplierFactorNumeric?.val ?? 0,
      amount: charge.Amount?.val ?? 0,
      amountCurrency: charge.Amount?.currencyID,
      baseAmount: charge.BaseAmount?.val ?? 0,
      baseAmountCurrency: charge.BaseAmount?.currencyID,
    })
  );
}

/**
 * Item instance array'ini normalize eder
 */
function normalizeItemInstances(
  instances: RawItemInstance[] | undefined
): ItemInstance[] {
  if (!instances) {
    return [];
  }

  return instances.map(
    (instance: RawItemInstance): ItemInstance => ({
      traceId: instance.ProductTraceID?.val ?? null,
      manufactureDate: instance.ManufactureDate?.val ?? null,
      manufactureTime: instance.ManufactureTime?.val ?? null,
      registrationId: instance.RegistrationID?.val ?? null,
      serialId: instance.SerialID?.val ?? null,
      lotId: instance.LotIdentification?.val ?? null,
    })
  );
}

/**
 * Invoice line array'ini normalize eder
 */
export function normalizeLines(lines: RawInvoiceLine[]): InvoiceLine[] {
  return lines.map((line: RawInvoiceLine): InvoiceLine => {
    const item = line.Item[0];
    const withholdingTaxTotal = line.WithholdingTaxTotal?.[0];

    const baseLine: InvoiceLine = {
      id: line.ID?.val,
      name: item?.Name?.val,
      note: line.Note?.val,
      quantity: line.InvoicedQuantity?.val ?? 0,
      quantityUnit: line.InvoicedQuantity?.unitCode,
      price: line.Price.PriceAmount?.val ?? 0,
      priceCurrency: line.Price?.PriceAmount?.currencyID,
      extensionAmount: line.LineExtensionAmount?.val ?? 0,
      extensionAmountCurrency: line.LineExtensionAmount?.currencyID,
      allowances: normalizeAllowanceCharges(line.AllowanceCharge),
      taxTotal: line.TaxTotal?.[0]?.TaxAmount?.val ?? 0,
      taxSubtotals: normalizeTaxSubtotals(line.TaxTotal?.[0]),
      taxTotals: normalizeTaxTotals(line.TaxTotal),
      additional: {
        description: item?.Description?.[0]?.val ?? null,
        keyword: item?.Keyword?.val ?? null,
        brandName: item?.BrandName?.val ?? null,
        modelName: item?.ModelName?.val ?? null,
        buyersItemId: item?.BuyersItemIdentification?.ID?.val ?? null,
        sellersItemId: item?.SellersItemIdentification?.ID?.val ?? null,
        manufacturersItemId:
          item?.ManufacturersItemIdentification?.ID?.val ?? null,
        originCountry: item?.OriginCountry?.val ?? null,
        gtip: item?.Delivery?.[0]?.Shipment?.[0]?.GoodsItem?.[0]?.RequiredCustomsID
          ?.val,
        instance: normalizeItemInstances(item?.ItemInstance),
      },
    };

    if (withholdingTaxTotal) {
      baseLine.withholdingTaxTotal = withholdingTaxTotal.TaxAmount?.val;
      baseLine.withholdingTaxSubtotals = normalizeTaxSubtotals(withholdingTaxTotal);
    }

    return baseLine;
  });
}

/**
 * Party bilgisini normalize eder
 */
export function normalizeParty(partyJson: RawCustomerParty): Party {
  const party = partyJson.Party;

  const identificationWithTaxId = party.PartyIdentification.find(
    (id: RawPartyIdentification) =>
      id?.ID?.schemeID === 'TCKN' ||
      id?.ID?.schemeID === 'VKN' ||
      id?.ID?.schemeID === 'PARTYTYPE'
  );

  if (!identificationWithTaxId) {
    throw new Error('Party identification (TCKN/VKN/PARTYTYPE) not found');
  }

  const { ID } = identificationWithTaxId;
  const scheme = ID.schemeID;

  const buildName = (): string => {
    if (scheme === 'TCKN' && party.Person) {
      const firstName = party.Person.FirstName?.val ?? '';
      const middleName = party.Person.MiddleName?.val;
      const familyName = party.Person.FamilyName?.val ?? '';

      return middleName
        ? `${firstName} ${middleName} ${familyName}`
        : `${firstName} ${familyName}`;
    }
    return party.PartyName?.Name?.val ?? '';
  };

  const buildAddress = (): string => {
    const parts = [
      party.PostalAddress?.StreetName?.val,
      party.PostalAddress?.BuildingName?.val,
      party.PostalAddress?.BuildingNumber?.[0]?.val,
      party.PostalAddress?.Room?.val,
    ].filter(Boolean);

    return parts.join(' ');
  };

  // Sayısal parse edilebilen yapraklar (bina no, oda, posta kodu) runtime'da number dönebilir →
  // string'e sabitle; yoksa undefined.
  const asString = (value: unknown): string | undefined =>
    value === undefined || value === null ? undefined : String(value);

  const buildAddressDetails = (): AddressDetails => {
    const postal = party.PostalAddress;
    return {
      streetName: asString(postal?.StreetName?.val),
      buildingName: asString(postal?.BuildingName?.val),
      buildingNumber: asString(postal?.BuildingNumber?.[0]?.val),
      room: asString(postal?.Room?.val),
      citySubdivision: asString(postal?.CitySubdivisionName?.val),
      city: asString(postal?.CityName?.val),
      postalZone: asString(postal?.PostalZone?.val),
      country: asString(postal?.Country?.Name?.val),
    };
  };

  const buildAdditionalIdentifiers = (): AdditionalIdentifier[] => {
    return party.PartyIdentification.filter(
      (id: RawPartyIdentification) =>
        id?.ID?.schemeID !== 'TCKN' && id?.ID?.schemeID !== 'VKN'
    ).map(
      (id: RawPartyIdentification): AdditionalIdentifier => ({
        scheme: id?.ID?.schemeID,
        value: id?.ID?.val,
      })
    );
  };

  const getVknTckn = (): string | undefined => {
    let rawValue: string | number | undefined;
    
    if (scheme === 'TCKN' || scheme === 'VKN') {
      rawValue = ID?.val;
    } else {
      rawValue = party.PartyLegalEntity?.[0]?.CompanyID?.val;
    }
    
    if (rawValue === undefined || rawValue === null) {
      return undefined;
    }
    
    const strValue = String(rawValue);
    
    // VKN: 10 hane, TCKN: 11 hane - başındaki sıfırları koru
    if (scheme === 'TCKN') {
      return strValue.padStart(11, '0');
    } else if (scheme === 'VKN') {
      return strValue.padStart(10, '0');
    }
    return strValue;
  };

  return {
    name: buildName(),
    vknTckn: getVknTckn(),
    taxOffice: party.PartyTaxScheme?.TaxScheme?.Name?.val,
    address: buildAddress(),
    addressDetails: buildAddressDetails(),
    city: party.PostalAddress?.CityName?.val,
    citySubdivision: party.PostalAddress?.CitySubdivisionName?.val,
    country: party.PostalAddress?.Country?.Name?.val,
    postalZone: party.PostalAddress?.PostalZone?.val,
    email: party.Contact?.ElectronicMail?.val,
    phoneNumber: party.Contact?.Telephone?.val,
    additionalIdentifiers: buildAdditionalIdentifiers(),
  };
}
