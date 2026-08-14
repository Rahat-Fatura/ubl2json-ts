import { describe, it, expect } from 'vitest';
import { CreditNoteConverter, UblParseError } from '../index';

/**
 * e-Müstahsil Makbuzu (CreditNote) dönüştürücü testleri.
 *
 * Fixture'lar üretim EMM belgelerinden YAPISAL olarak birebir türetilmiş,
 * kişisel veriler (TCKN/VKN/ad-soyad/adres/e-posta/telefon) sentetik
 * değerlerle MASKELENMİŞTİR. Tutar/vergi yapıları üretimdeki iki aileyi pinler:
 *  - EMM-ailesi (tek-kalem): TaxInclusive=0 + AllowanceTotal=stopaj + Payable=net
 *  - ILI-ailesi (çok-kalem): TaxInclusive=Payable=net, üçlü TaxSubtotal
 *    (SGK_PRIM sıfır-placeholder + 0003 stopaj + 8001 sıfır-placeholder)
 */

/** EMM-ailesi: tek kalem, stopaj TaxTotal'da (kod 0003), B-ailesi LegalMonetaryTotal */
const emmSingleLineXml = `<?xml version="1.0" encoding="UTF-8" standalone="no"?><CreditNote xmlns="urn:oasis:names:specification:ubl:schema:xsd:CreditNote-2" xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2" xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2" xmlns:ext="urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2">
  <cbc:UBLVersionID>2.1</cbc:UBLVersionID>
  <cbc:CustomizationID>TR1.2</cbc:CustomizationID>
  <cbc:ProfileID>EARSIVBELGE</cbc:ProfileID>
  <cbc:ID>EMM2026000000001</cbc:ID>
  <cbc:CopyIndicator>false</cbc:CopyIndicator>
  <cbc:UUID>e0000000-1111-4222-8333-444444444444</cbc:UUID>
  <cbc:IssueDate>2026-06-23</cbc:IssueDate>
  <cbc:IssueTime>14:45:31</cbc:IssueTime>
  <cbc:CreditNoteTypeCode>MUSTAHSILMAKBUZ</cbc:CreditNoteTypeCode>
  <cbc:DocumentCurrencyCode>TRY</cbc:DocumentCurrencyCode>
  <cbc:LineCountNumeric>1</cbc:LineCountNumeric>
  <cac:AdditionalDocumentReference>
    <cbc:ID>e0000000-1111-4222-8333-444444444444</cbc:ID>
    <cbc:IssueDate>2026-06-23</cbc:IssueDate>
    <cbc:DocumentType>XSLT</cbc:DocumentType>
    <cac:Attachment>
      <cbc:EmbeddedDocumentBinaryObject characterSetCode="UTF-8" encodingCode="Base64" filename="TEST0000000001.xslt" mimeCode="application/xml">QkFTRTY0S0lTQUxUTUE=</cbc:EmbeddedDocumentBinaryObject>
    </cac:Attachment>
  </cac:AdditionalDocumentReference>
  <cac:AccountingSupplierParty>
    <cac:Party>
      <cac:PartyIdentification>
        <cbc:ID schemeID="TCKN">12345678901</cbc:ID>
      </cac:PartyIdentification>
      <cac:PartyName>
        <cbc:Name>OSMAN TESTÇİ</cbc:Name>
      </cac:PartyName>
      <cac:PostalAddress>
        <cbc:StreetName>TEST MAH. DENEME SK. NO:1</cbc:StreetName>
        <cbc:CitySubdivisionName>ALANYA</cbc:CitySubdivisionName>
        <cbc:CityName>ANTALYA</cbc:CityName>
        <cbc:PostalZone>07400</cbc:PostalZone>
        <cbc:Region>TEST MAH</cbc:Region>
        <cac:Country>
          <cbc:Name>TÜRKİYE</cbc:Name>
        </cac:Country>
      </cac:PostalAddress>
      <cac:PartyTaxScheme>
        <cac:TaxScheme>
          <cbc:Name>ALANYA</cbc:Name>
        </cac:TaxScheme>
      </cac:PartyTaxScheme>
      <cac:Contact>
        <cbc:Telephone>555 000 00 00</cbc:Telephone>
        <cbc:ElectronicMail>test@example.com</cbc:ElectronicMail>
      </cac:Contact>
      <cac:Person>
        <cbc:FirstName>OSMAN</cbc:FirstName>
        <cbc:FamilyName>TESTÇİ</cbc:FamilyName>
      </cac:Person>
    </cac:Party>
  </cac:AccountingSupplierParty>
  <cac:AccountingCustomerParty>
    <cac:Party>
      <cac:PartyIdentification>
        <cbc:ID schemeID="TCKN">98765432109</cbc:ID>
      </cac:PartyIdentification>
      <cac:PostalAddress>
        <cbc:StreetName>...</cbc:StreetName>
        <cbc:CitySubdivisionName>ALANYA</cbc:CitySubdivisionName>
        <cbc:CityName>ANTALYA</cbc:CityName>
        <cbc:PostalZone>07400</cbc:PostalZone>
        <cbc:Region/>
        <cac:Country>
          <cbc:Name>TÜRKİYE</cbc:Name>
        </cac:Country>
      </cac:PostalAddress>
      <cac:PartyTaxScheme>
        <cac:TaxScheme>
          <cbc:Name>alanya</cbc:Name>
        </cac:TaxScheme>
      </cac:PartyTaxScheme>
      <cac:Contact>
        <cbc:Telephone/>
        <cbc:ElectronicMail/>
      </cac:Contact>
      <cac:Person>
        <cbc:FirstName>MEHMET</cbc:FirstName>
        <cbc:FamilyName>ÜRETİCİ</cbc:FamilyName>
      </cac:Person>
    </cac:Party>
  </cac:AccountingCustomerParty>
  <cac:Delivery>
    <cbc:ActualDeliveryDate>2026-06-23</cbc:ActualDeliveryDate>
  </cac:Delivery>
  <cac:TaxTotal>
    <cbc:TaxAmount currencyID="TRY">12870.00</cbc:TaxAmount>
    <cac:TaxSubtotal>
      <cbc:TaxableAmount currencyID="TRY">12870.00</cbc:TaxableAmount>
      <cbc:TaxAmount currencyID="TRY">12870.00</cbc:TaxAmount>
      <cbc:CalculationSequenceNumeric>1</cbc:CalculationSequenceNumeric>
      <cbc:Percent>4</cbc:Percent>
      <cac:TaxCategory>
        <cac:TaxScheme>
          <cbc:Name>G. V. Stopaj</cbc:Name>
          <cbc:TaxTypeCode>0003</cbc:TaxTypeCode>
        </cac:TaxScheme>
      </cac:TaxCategory>
    </cac:TaxSubtotal>
  </cac:TaxTotal>
  <cac:LegalMonetaryTotal>
    <cbc:LineExtensionAmount currencyID="TRY">321750.00</cbc:LineExtensionAmount>
    <cbc:TaxExclusiveAmount currencyID="TRY">308880.00</cbc:TaxExclusiveAmount>
    <cbc:TaxInclusiveAmount currencyID="TRY">0</cbc:TaxInclusiveAmount>
    <cbc:AllowanceTotalAmount currencyID="TRY">12870.00</cbc:AllowanceTotalAmount>
    <cbc:ChargeTotalAmount currencyID="TRY">0</cbc:ChargeTotalAmount>
    <cbc:PayableRoundingAmount currencyID="TRY">0</cbc:PayableRoundingAmount>
    <cbc:PayableAmount currencyID="TRY">308880.00</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>
  <cac:CreditNoteLine>
    <cbc:ID>1</cbc:ID>
    <cbc:CreditedQuantity unitCode="KGM">650.00000</cbc:CreditedQuantity>
    <cbc:LineExtensionAmount currencyID="TRY">321750.00000</cbc:LineExtensionAmount>
    <cac:OrderLineReference>
      <cbc:LineID>1</cbc:LineID>
    </cac:OrderLineReference>
    <cac:TaxTotal>
      <cbc:TaxAmount currencyID="TRY">12870.00</cbc:TaxAmount>
      <cac:TaxSubtotal>
        <cbc:TaxableAmount currencyID="TRY">308880.00</cbc:TaxableAmount>
        <cbc:TaxAmount currencyID="TRY">12870.00</cbc:TaxAmount>
        <cbc:CalculationSequenceNumeric>1</cbc:CalculationSequenceNumeric>
        <cbc:Percent>4</cbc:Percent>
        <cac:TaxCategory>
          <cac:TaxScheme>
            <cbc:Name>G. V. Stopaj</cbc:Name>
            <cbc:TaxTypeCode>0003</cbc:TaxTypeCode>
          </cac:TaxScheme>
        </cac:TaxCategory>
      </cac:TaxSubtotal>
    </cac:TaxTotal>
    <cac:Item>
      <cbc:Name>CEVİZ</cbc:Name>
    </cac:Item>
    <cac:Price>
      <cbc:PriceAmount currencyID="TRY">495.00000</cbc:PriceAmount>
    </cac:Price>
  </cac:CreditNoteLine>
</CreditNote>`;

/** ILI-ailesi: çok kalemli, A-ailesi LegalMonetaryTotal, EMM_* üstveri referansları,
 * üçlü TaxSubtotal (SGK_PRIM + 0003 + 8001) */
const iliMultiLineXml = `<CreditNote xmlns="urn:oasis:names:specification:ubl:schema:xsd:CreditNote-2" xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2" xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2" xmlns:ext="urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2">
  <cbc:UBLVersionID>2.1</cbc:UBLVersionID>
  <cbc:CustomizationID>TR1.2</cbc:CustomizationID>
  <cbc:ProfileID>EARSIVBELGE</cbc:ProfileID>
  <cbc:ID>ILI2023000000087</cbc:ID>
  <cbc:CopyIndicator>false</cbc:CopyIndicator>
  <cbc:UUID>a0000000-5555-4666-8777-888888888888</cbc:UUID>
  <cbc:IssueDate>2023-04-09</cbc:IssueDate>
  <cbc:IssueTime>18:04:17</cbc:IssueTime>
  <cbc:CreditNoteTypeCode>MUSTAHSILMAKBUZ</cbc:CreditNoteTypeCode>
  <cbc:Note>Müstahsil Faturası (87)</cbc:Note>
  <cbc:DocumentCurrencyCode>TRY</cbc:DocumentCurrencyCode>
  <cbc:LineCountNumeric>1</cbc:LineCountNumeric>
  <cac:AdditionalDocumentReference>
    <cbc:ID>0.00</cbc:ID>
    <cbc:IssueDate>2023-04-09</cbc:IssueDate>
    <cbc:DocumentTypeCode>EMM_KOMISYON</cbc:DocumentTypeCode>
    <cbc:DocumentType>Komisyon % 0</cbc:DocumentType>
  </cac:AdditionalDocumentReference>
  <cac:AdditionalDocumentReference>
    <cbc:ID>0.00</cbc:ID>
    <cbc:IssueDate>2023-04-09</cbc:IssueDate>
    <cbc:DocumentTypeCode>EMM_KOMISYON_KDV</cbc:DocumentTypeCode>
    <cbc:DocumentType>Komisyon KDV % 0</cbc:DocumentType>
  </cac:AdditionalDocumentReference>
  <cac:AdditionalDocumentReference>
    <cbc:ID>0.00</cbc:ID>
    <cbc:IssueDate>2023-04-09</cbc:IssueDate>
    <cbc:DocumentTypeCode>EMM_DIGER1</cbc:DocumentTypeCode>
    <cbc:DocumentType>Diğer-1 % 0</cbc:DocumentType>
  </cac:AdditionalDocumentReference>
  <cac:AdditionalDocumentReference>
    <cbc:ID>0.00</cbc:ID>
    <cbc:IssueDate>2023-04-09</cbc:IssueDate>
    <cbc:DocumentTypeCode>EMM_DIGER2</cbc:DocumentTypeCode>
    <cbc:DocumentType>Diğer-2 % 0</cbc:DocumentType>
  </cac:AdditionalDocumentReference>
  <cac:AdditionalDocumentReference>
    <cbc:ID>0.00</cbc:ID>
    <cbc:IssueDate>2023-04-09</cbc:IssueDate>
    <cbc:DocumentTypeCode>EMM_NAKLIYE</cbc:DocumentTypeCode>
    <cbc:DocumentType>Nakliye</cbc:DocumentType>
  </cac:AdditionalDocumentReference>
  <cac:AdditionalDocumentReference>
    <cbc:ID>0.00</cbc:ID>
    <cbc:IssueDate>2023-04-09</cbc:IssueDate>
    <cbc:DocumentTypeCode>EMM_HAMALIYE</cbc:DocumentTypeCode>
    <cbc:DocumentType>Hamaliye</cbc:DocumentType>
  </cac:AdditionalDocumentReference>
  <cac:AdditionalDocumentReference>
    <cbc:ID>a0000000-5555-4666-8777-888888888888</cbc:ID>
    <cbc:IssueDate>2023-04-09</cbc:IssueDate>
    <cbc:DocumentType>XSLT</cbc:DocumentType>
    <cac:Attachment>
      <cbc:EmbeddedDocumentBinaryObject characterSetCode="UTF-8" encodingCode="Base64" filename="ILI2023000000087.xslt" mimeCode="application/xml">QkFTRTY0S0lTQUxUTUE=</cbc:EmbeddedDocumentBinaryObject>
    </cac:Attachment>
  </cac:AdditionalDocumentReference>
  <cac:AdditionalDocumentReference>
    <cbc:ID>        100.00</cbc:ID>
    <cbc:IssueDate>2023-04-09</cbc:IssueDate>
    <cbc:DocumentTypeCode>ATL_MIKTAR_TOPLAM</cbc:DocumentTypeCode>
    <cbc:DocumentType>Miktar Toplam</cbc:DocumentType>
  </cac:AdditionalDocumentReference>
  <cac:AccountingSupplierParty>
    <cac:Party>
      <cbc:WebsiteURI/>
      <cac:PartyIdentification>
        <cbc:ID schemeID="VKN">1234567890</cbc:ID>
      </cac:PartyIdentification>
      <cac:PartyIdentification>
        <cbc:ID schemeID="MERSISNO"/>
      </cac:PartyIdentification>
      <cac:PartyName>
        <cbc:Name>TEST HAL KOMİSYONCUSU TİC.A.Ş</cbc:Name>
      </cac:PartyName>
      <cac:PostalAddress>
        <cbc:StreetName>TEST HAL KOMPLEKSİ 1.PERON NO:1</cbc:StreetName>
        <cbc:BuildingName/>
        <cbc:BuildingNumber/>
        <cbc:CitySubdivisionName>SEYHAN</cbc:CitySubdivisionName>
        <cbc:CityName>ADANA</cbc:CityName>
        <cbc:PostalZone/>
        <cbc:Region>SEYHAN</cbc:Region>
        <cac:Country>
          <cbc:Name>TR</cbc:Name>
        </cac:Country>
      </cac:PostalAddress>
      <cac:PartyTaxScheme>
        <cac:TaxScheme>
          <cbc:Name>TESTDAİRE</cbc:Name>
        </cac:TaxScheme>
      </cac:PartyTaxScheme>
      <cac:Contact>
        <cbc:Telephone>03220000000</cbc:Telephone>
        <cbc:Telefax/>
        <cbc:ElectronicMail>info@example.com</cbc:ElectronicMail>
      </cac:Contact>
    </cac:Party>
  </cac:AccountingSupplierParty>
  <cac:AccountingCustomerParty>
    <cac:Party>
      <cbc:WebsiteURI/>
      <cac:PartyIdentification>
        <cbc:ID schemeID="TCKN">00123456789</cbc:ID>
      </cac:PartyIdentification>
      <cac:PartyName>
        <cbc:Name>VELİ ÜRETİCİ</cbc:Name>
      </cac:PartyName>
      <cac:PostalAddress>
        <cbc:StreetName/>
        <cbc:BuildingNumber/>
        <cbc:CitySubdivisionName>MERKEZ</cbc:CitySubdivisionName>
        <cbc:CityName>ADANA</cbc:CityName>
        <cbc:PostalZone/>
        <cbc:Region/>
        <cac:Country>
          <cbc:Name>Türkiye</cbc:Name>
        </cac:Country>
      </cac:PostalAddress>
      <cac:PartyTaxScheme>
        <cac:TaxScheme>
          <cbc:Name>
</cbc:Name>
        </cac:TaxScheme>
      </cac:PartyTaxScheme>
      <cac:Contact>
        <cbc:Telephone/>
        <cbc:Telefax/>
        <cbc:ElectronicMail/>
      </cac:Contact>
      <cac:Person>
        <cbc:FirstName>VELİ</cbc:FirstName>
        <cbc:FamilyName>ÜRETİCİ</cbc:FamilyName>
      </cac:Person>
    </cac:Party>
  </cac:AccountingCustomerParty>
  <cac:Delivery>
    <cbc:ActualDeliveryDate>2023-04-09</cbc:ActualDeliveryDate>
  </cac:Delivery>
  <cac:TaxTotal>
    <cbc:TaxAmount currencyID="TRY">318.46</cbc:TaxAmount>
    <cac:TaxSubtotal>
      <cbc:TaxableAmount currencyID="TRY">15922.95</cbc:TaxableAmount>
      <cbc:TaxAmount currencyID="TRY">0.00</cbc:TaxAmount>
      <cbc:CalculationSequenceNumeric>1</cbc:CalculationSequenceNumeric>
      <cbc:Percent>0.00</cbc:Percent>
      <cac:TaxCategory>
        <cac:TaxScheme>
          <cbc:Name>SGK Prim Kesintisi</cbc:Name>
          <cbc:TaxTypeCode>SGK_PRIM</cbc:TaxTypeCode>
        </cac:TaxScheme>
      </cac:TaxCategory>
    </cac:TaxSubtotal>
    <cac:TaxSubtotal>
      <cbc:TaxableAmount currencyID="TRY">15922.95</cbc:TaxableAmount>
      <cbc:TaxAmount currencyID="TRY">318.46</cbc:TaxAmount>
      <cbc:CalculationSequenceNumeric>1</cbc:CalculationSequenceNumeric>
      <cbc:Percent>2.00</cbc:Percent>
      <cac:TaxCategory>
        <cac:TaxScheme>
          <cbc:Name>GV. STOPAJI</cbc:Name>
          <cbc:TaxTypeCode>0003</cbc:TaxTypeCode>
        </cac:TaxScheme>
      </cac:TaxCategory>
    </cac:TaxSubtotal>
    <cac:TaxSubtotal>
      <cbc:TaxableAmount currencyID="TRY">15922.95</cbc:TaxableAmount>
      <cbc:TaxAmount currencyID="TRY">0.00</cbc:TaxAmount>
      <cbc:CalculationSequenceNumeric>1</cbc:CalculationSequenceNumeric>
      <cbc:Percent>0.00</cbc:Percent>
      <cac:TaxCategory>
        <cac:TaxScheme>
          <cbc:Name>BORSA TES.ÜC.</cbc:Name>
          <cbc:TaxTypeCode>8001</cbc:TaxTypeCode>
        </cac:TaxScheme>
      </cac:TaxCategory>
    </cac:TaxSubtotal>
  </cac:TaxTotal>
  <cac:LegalMonetaryTotal>
    <cbc:LineExtensionAmount currencyID="TRY">15922.95</cbc:LineExtensionAmount>
    <cbc:TaxExclusiveAmount currencyID="TRY">15922.95</cbc:TaxExclusiveAmount>
    <cbc:TaxInclusiveAmount currencyID="TRY">15604.49</cbc:TaxInclusiveAmount>
    <cbc:PayableAmount currencyID="TRY">15604.49</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>
  <cac:CreditNoteLine>
    <cbc:ID>1</cbc:ID>
    <cbc:CreditedQuantity unitCode="KGM">13.00</cbc:CreditedQuantity>
    <cbc:LineExtensionAmount currencyID="TRY">1074.45</cbc:LineExtensionAmount>
    <cac:TaxTotal>
      <cbc:TaxAmount currencyID="TRY">21.49</cbc:TaxAmount>
      <cac:TaxSubtotal>
        <cbc:TaxableAmount currencyID="TRY">1074.45</cbc:TaxableAmount>
        <cbc:TaxAmount currencyID="TRY">21.49</cbc:TaxAmount>
        <cbc:CalculationSequenceNumeric>1</cbc:CalculationSequenceNumeric>
        <cbc:Percent>2.00</cbc:Percent>
        <cac:TaxCategory>
          <cac:TaxScheme>
            <cbc:Name>GV. STOPAJI</cbc:Name>
            <cbc:TaxTypeCode>0003</cbc:TaxTypeCode>
          </cac:TaxScheme>
        </cac:TaxCategory>
      </cac:TaxSubtotal>
    </cac:TaxTotal>
    <cac:Item>
      <cbc:Name>BİBER ÇARLİSTON</cbc:Name>
      <cac:SellersItemIdentification>
        <cbc:ID>000076</cbc:ID>
      </cac:SellersItemIdentification>
    </cac:Item>
    <cac:Price>
      <cbc:PriceAmount currencyID="TRY">82.6500</cbc:PriceAmount>
    </cac:Price>
  </cac:CreditNoteLine>
  <cac:CreditNoteLine>
    <cbc:ID>2</cbc:ID>
    <cbc:CreditedQuantity unitCode="KGM">15.00</cbc:CreditedQuantity>
    <cbc:LineExtensionAmount currencyID="TRY">1482.00</cbc:LineExtensionAmount>
    <cac:TaxTotal>
      <cbc:TaxAmount currencyID="TRY">29.64</cbc:TaxAmount>
      <cac:TaxSubtotal>
        <cbc:TaxableAmount currencyID="TRY">1482.00</cbc:TaxableAmount>
        <cbc:TaxAmount currencyID="TRY">29.64</cbc:TaxAmount>
        <cbc:CalculationSequenceNumeric>1</cbc:CalculationSequenceNumeric>
        <cbc:Percent>2.00</cbc:Percent>
        <cac:TaxCategory>
          <cac:TaxScheme>
            <cbc:Name>GV. STOPAJI</cbc:Name>
            <cbc:TaxTypeCode>0003</cbc:TaxTypeCode>
          </cac:TaxScheme>
        </cac:TaxCategory>
      </cac:TaxSubtotal>
    </cac:TaxTotal>
    <cac:Item>
      <cbc:Name>BİBER SİVRİ</cbc:Name>
      <cac:SellersItemIdentification>
        <cbc:ID>000019</cbc:ID>
      </cac:SellersItemIdentification>
    </cac:Item>
    <cac:Price>
      <cbc:PriceAmount currencyID="TRY">98.8000</cbc:PriceAmount>
    </cac:Price>
  </cac:CreditNoteLine>
  <cac:CreditNoteLine>
    <cbc:ID>3</cbc:ID>
    <cbc:CreditedQuantity unitCode="KGM">15.00</cbc:CreditedQuantity>
    <cbc:LineExtensionAmount currencyID="TRY">1197.00</cbc:LineExtensionAmount>
    <cac:TaxTotal>
      <cbc:TaxAmount currencyID="TRY">23.94</cbc:TaxAmount>
      <cac:TaxSubtotal>
        <cbc:TaxableAmount currencyID="TRY">1197.00</cbc:TaxableAmount>
        <cbc:TaxAmount currencyID="TRY">23.94</cbc:TaxAmount>
        <cbc:CalculationSequenceNumeric>1</cbc:CalculationSequenceNumeric>
        <cbc:Percent>2.00</cbc:Percent>
        <cac:TaxCategory>
          <cac:TaxScheme>
            <cbc:Name>GV. STOPAJI</cbc:Name>
            <cbc:TaxTypeCode>0003</cbc:TaxTypeCode>
          </cac:TaxScheme>
        </cac:TaxCategory>
      </cac:TaxSubtotal>
    </cac:TaxTotal>
    <cac:Item>
      <cbc:Name>DOMATES KARIŞIK PREMİUM</cbc:Name>
      <cac:SellersItemIdentification>
        <cbc:ID>000259</cbc:ID>
      </cac:SellersItemIdentification>
    </cac:Item>
    <cac:Price>
      <cbc:PriceAmount currencyID="TRY">79.8000</cbc:PriceAmount>
    </cac:Price>
  </cac:CreditNoteLine>
  <cac:CreditNoteLine>
    <cbc:ID>4</cbc:ID>
    <cbc:CreditedQuantity unitCode="KGM">50.00</cbc:CreditedQuantity>
    <cbc:LineExtensionAmount currencyID="TRY">4322.50</cbc:LineExtensionAmount>
    <cac:TaxTotal>
      <cbc:TaxAmount currencyID="TRY">86.45</cbc:TaxAmount>
      <cac:TaxSubtotal>
        <cbc:TaxableAmount currencyID="TRY">4322.50</cbc:TaxableAmount>
        <cbc:TaxAmount currencyID="TRY">86.45</cbc:TaxAmount>
        <cbc:CalculationSequenceNumeric>1</cbc:CalculationSequenceNumeric>
        <cbc:Percent>2.00</cbc:Percent>
        <cac:TaxCategory>
          <cac:TaxScheme>
            <cbc:Name>GV. STOPAJI</cbc:Name>
            <cbc:TaxTypeCode>0003</cbc:TaxTypeCode>
          </cac:TaxScheme>
        </cac:TaxCategory>
      </cac:TaxSubtotal>
    </cac:TaxTotal>
    <cac:Item>
      <cbc:Name>DOMATES</cbc:Name>
      <cac:SellersItemIdentification>
        <cbc:ID>000003</cbc:ID>
      </cac:SellersItemIdentification>
    </cac:Item>
    <cac:Price>
      <cbc:PriceAmount currencyID="TRY">86.4500</cbc:PriceAmount>
    </cac:Price>
  </cac:CreditNoteLine>
  <cac:CreditNoteLine>
    <cbc:ID>5</cbc:ID>
    <cbc:CreditedQuantity unitCode="KGM">7.00</cbc:CreditedQuantity>
    <cbc:LineExtensionAmount currencyID="TRY">7847.00</cbc:LineExtensionAmount>
    <cac:TaxTotal>
      <cbc:TaxAmount currencyID="TRY">156.94</cbc:TaxAmount>
      <cac:TaxSubtotal>
        <cbc:TaxableAmount currencyID="TRY">7847.00</cbc:TaxableAmount>
        <cbc:TaxAmount currencyID="TRY">156.94</cbc:TaxAmount>
        <cbc:CalculationSequenceNumeric>1</cbc:CalculationSequenceNumeric>
        <cbc:Percent>2.00</cbc:Percent>
        <cac:TaxCategory>
          <cac:TaxScheme>
            <cbc:Name>GV. STOPAJI</cbc:Name>
            <cbc:TaxTypeCode>0003</cbc:TaxTypeCode>
          </cac:TaxScheme>
        </cac:TaxCategory>
      </cac:TaxSubtotal>
    </cac:TaxTotal>
    <cac:Item>
      <cbc:Name>KUZU GÖBEK MANTAR</cbc:Name>
      <cac:SellersItemIdentification>
        <cbc:ID>000474</cbc:ID>
      </cac:SellersItemIdentification>
    </cac:Item>
    <cac:Price>
      <cbc:PriceAmount currencyID="TRY">1121.0000</cbc:PriceAmount>
    </cac:Price>
  </cac:CreditNoteLine>
</CreditNote>`;

describe('CreditNoteConverter', () => {
  describe('parseToRaw', () => {
    it('geçerli XML\'i raw JSON\'a parse etmeli (imza/UBLExtensions atılır)', () => {
      const converter = new CreditNoteConverter();
      const raw = converter.parseToRaw(emmSingleLineXml);

      expect(raw.CreditNote).toBeDefined();
      expect(raw.CreditNote.UUID.val).toBe('e0000000-1111-4222-8333-444444444444');
      expect(raw.CreditNote.ID.val).toBe('EMM2026000000001');
    });

    it('CreditNoteLine tek-kalemde de ARRAY gelmeli (ALWAYS_ARRAY pini)', () => {
      const converter = new CreditNoteConverter();
      const raw = converter.parseToRaw(emmSingleLineXml);

      expect(Array.isArray(raw.CreditNote.CreditNoteLine)).toBe(true);
      expect(raw.CreditNote.CreditNoteLine).toHaveLength(1);
    });

    it('geçersiz XML için UblParseError fırlatmalı', () => {
      const converter = new CreditNoteConverter();
      const malformedXml = '<CreditNote><UUID>test</UUID';

      expect(() => converter.parseToRaw(malformedXml)).toThrow(UblParseError);
    });
  });

  describe('convert — EMM-ailesi (tek kalem)', () => {
    const converter = new CreditNoteConverter();
    const receipt = converter.convert(emmSingleLineXml);

    it('kimlik alanlarını doğru vermeli', () => {
      expect(receipt.uuid).toBe('e0000000-1111-4222-8333-444444444444');
      expect(receipt.number).toBe('EMM2026000000001');
      expect(receipt.profileId).toBe('EARSIVBELGE');
      expect(receipt.typeCode).toBe('MUSTAHSILMAKBUZ');
      expect(receipt.currencyCode).toBe('TRY');
      expect(receipt.issueDatetime).toBeInstanceOf(Date);
      expect(receipt.issueDatetime.toISOString()).toContain('2026-06-23');
    });

    it('rol-tersliği: düzenleyen=Supplier, müstahsil(çiftçi)=Customer', () => {
      // Düzenleyen (TCKN + PartyName + Person; TCKN olduğundan Person-dalı isimlenir)
      expect(receipt.senderName).toBe('OSMAN TESTÇİ');
      expect(receipt.senderTax).toBe('12345678901');
      expect(typeof receipt.senderTax).toBe('string');

      // Müstahsil: PartyName YOK — isim Person'dan kurulur; TCKN sayısal parse
      // edilse de String+padStart ile 11 haneye sabitlenir
      expect(receipt.receiverName).toBe('MEHMET ÜRETİCİ');
      expect(receipt.receiverTax).toBe('98765432109');
      expect(receipt.receiverTax).toHaveLength(11);
    });

    it('CreditedQuantity kalem miktarına akmalı (InvoicedQuantity yok)', () => {
      expect(receipt.lines).toHaveLength(1);
      expect(receipt.lines[0]?.quantity).toBe(650);
      expect(receipt.lines[0]?.quantityUnit).toBe('KGM');
      expect(receipt.lines[0]?.price).toBe(495);
      expect(receipt.lines[0]?.extensionAmount).toBe(321750);
      expect(receipt.lines[0]?.name).toBe('CEVİZ');
    });

    it('stopaj TaxTotal\'da taşınmalı (kod 0003; WithholdingTaxTotal boş)', () => {
      expect(receipt.taxTotal).toBe(12870);
      expect(receipt.taxSubtotals).toHaveLength(1);
      // 0003 baştaki sıfır sayesinde STRING kalır (leadingZeros:false)
      expect(receipt.taxSubtotals[0]?.code).toBe('0003');
      expect(receipt.taxSubtotals[0]?.percent).toBe(4);
      // Prod değişmezi: WithholdingTaxTotal EMM'lerde kullanılmıyor
      expect(receipt.withholdingTaxTotal).toBe(0);
      expect(receipt.withholdingTaxSubtotals).toEqual([]);

      // Kalem-düzeyi stopaj
      expect(receipt.lines[0]?.taxTotal).toBe(12870);
      expect(receipt.lines[0]?.taxSubtotals[0]?.taxable).toBe(308880);
    });

    it('B-ailesi LegalMonetaryTotal: TaxIncl=0 + AllowanceTotal=stopaj + Payable=net', () => {
      expect(receipt.lineExtension).toBe(321750);
      expect(receipt.taxExclusive).toBe(308880);
      expect(receipt.taxInclusive).toBe(0);
      expect(receipt.allowanceTotal).toBe(12870);
      expect(receipt.chargeTotal).toBe(0);
      expect(receipt.payableAmount).toBe(308880);
    });

    it('XSLT ekini additionalDocumentReference ile vermeli', () => {
      expect(receipt.additionalDocumentReference).toHaveLength(1);
      expect(receipt.additionalDocumentReference[0]?.documentType).toBe('XSLT');
      expect(receipt.additionalDocumentReference[0]?.attachment).toBeDefined();
    });
  });

  describe('convert — ILI-ailesi (çok kalemli)', () => {
    const converter = new CreditNoteConverter();
    const receipt = converter.convert(iliMultiLineXml);

    it('çok-kalem: 5 kalem sırasıyla ve miktarlarıyla gelmeli', () => {
      expect(receipt.lines).toHaveLength(5);
      expect(receipt.lines.map((l) => l.quantity)).toEqual([13, 15, 15, 50, 7]);
      expect(receipt.lines[0]?.name).toBe('BİBER ÇARLİSTON');
      expect(receipt.lines[4]?.name).toBe('KUZU GÖBEK MANTAR');
      expect(receipt.lines[0]?.additional.sellersItemId).toBe('000076');
      expect(receipt.lines[0]?.taxSubtotals[0]?.percent).toBe(2);
    });

    it('TaxTypeCode-NUMBER tuzağı: 8001 sayı, 0003 ve SGK_PRIM string kalır', () => {
      expect(receipt.taxSubtotals).toHaveLength(3);
      expect(receipt.taxSubtotals[0]?.code).toBe('SGK_PRIM');
      expect(receipt.taxSubtotals[1]?.code).toBe('0003');
      // TUZAK: baştaki sıfırı olmayan sayısal kod fast-xml-parser'da NUMBER'a
      // parse edilir — tüketici String() ile normalize etmek ZORUNDA (pin).
      expect(receipt.taxSubtotals[2]?.code).toBe(8001);
      // Pozitif stopaj yalnız 0003'te; SGK_PRIM/8001 sıfır-placeholder
      expect(receipt.taxSubtotals[0]?.amount).toBe(0);
      expect(receipt.taxSubtotals[1]?.amount).toBe(318.46);
      expect(receipt.taxSubtotals[2]?.amount).toBe(0);
      expect(receipt.taxTotal).toBe(318.46);
    });

    it('TCKN padStart: baştaki sıfırlar korunup 11 haneye sabitlenmeli', () => {
      expect(receipt.receiverTax).toBe('00123456789');
      expect(receipt.receiverTax).toHaveLength(11);
      expect(typeof receipt.receiverTax).toBe('string');
      // Müşteride PartyName VARSA da TCKN+Person → isim Person'dan kurulur
      expect(receipt.receiverName).toBe('VELİ ÜRETİCİ');
    });

    it('boş MERSISNO kimliğine rağmen VKN seçilmeli', () => {
      expect(receipt.senderTax).toBe('1234567890');
      expect(receipt.senderName).toBe('TEST HAL KOMİSYONCUSU TİC.A.Ş');
      // MERSISNO ek-kimlik olarak listelenir
      expect(
        receipt.senderObject.additionalIdentifiers.some(
          (id) => id.scheme === 'MERSISNO'
        )
      ).toBe(true);
    });

    it('A-ailesi LegalMonetaryTotal: TaxIncl=Payable=net', () => {
      expect(receipt.lineExtension).toBe(15922.95);
      expect(receipt.taxExclusive).toBe(15922.95);
      expect(receipt.taxInclusive).toBe(15604.49);
      expect(receipt.payableAmount).toBe(15604.49);
      // Bu ailede AllowanceTotal alanı hiç yok → 0
      expect(receipt.allowanceTotal).toBe(0);
    });

    it('EMM_* üstveri referansları ve XSLT eki additionalDocumentReference\'ta olmalı', () => {
      expect(receipt.additionalDocumentReference).toHaveLength(8);
      expect(receipt.additionalDocumentReference[0]?.documentTypeCode).toBe(
        'EMM_KOMISYON'
      );
      const xsltRef = receipt.additionalDocumentReference.find(
        (ref) => ref.documentType === 'XSLT'
      );
      expect(xsltRef?.attachment).toBeDefined();
    });

    it('notlar ve taxTotals[] dolu gelmeli', () => {
      expect(receipt.notes).toContain('Müstahsil Faturası (87)');
      expect(receipt.taxTotals).toHaveLength(1);
      expect(receipt.taxTotals[0]?.taxAmount).toBe(318.46);
      expect(receipt.taxTotals[0]?.taxSubtotals).toHaveLength(3);
    });
  });

  describe('convert — zorunlu-alan felsefesi ve tolerans', () => {
    const minimalXml = `<?xml version="1.0" encoding="UTF-8"?>
<CreditNote xmlns="urn:oasis:names:specification:ubl:schema:xsd:CreditNote-2">
  <UUID>c0000000-9999-4000-8000-000000000009</UUID>
  <ID>TST2026000000001</ID>
  <IssueDate>2026-01-15</IssueDate>
  <AccountingSupplierParty>
    <Party>
      <PartyIdentification>
        <ID schemeID="VKN">1234567890</ID>
      </PartyIdentification>
      <PartyName><Name>Test İşletme</Name></PartyName>
      <PostalAddress><Country><Name>TR</Name></Country></PostalAddress>
    </Party>
  </AccountingSupplierParty>
  <AccountingCustomerParty>
    <Party>
      <PartyIdentification>
        <ID schemeID="TCKN">12345678901</ID>
      </PartyIdentification>
      <Person><FirstName>Test</FirstName><FamilyName>Müstahsil</FamilyName></Person>
      <PostalAddress><Country><Name>TR</Name></Country></PostalAddress>
    </Party>
  </AccountingCustomerParty>
  <LegalMonetaryTotal>
    <LineExtensionAmount currencyID="TRY">100.00</LineExtensionAmount>
    <TaxExclusiveAmount currencyID="TRY">98.00</TaxExclusiveAmount>
    <TaxInclusiveAmount currencyID="TRY">98.00</TaxInclusiveAmount>
    <PayableAmount currencyID="TRY">98.00</PayableAmount>
  </LegalMonetaryTotal>
  <CreditNoteLine>
    <ID>1</ID>
    <CreditedQuantity unitCode="KGM">10</CreditedQuantity>
    <LineExtensionAmount currencyID="TRY">100.00</LineExtensionAmount>
    <Item><Name>Ürün</Name></Item>
    <Price><PriceAmount currencyID="TRY">10.00</PriceAmount></Price>
  </CreditNoteLine>
</CreditNote>`;

    it('default-dolgu YOK: ProfileID/CreditNoteTypeCode/DocumentCurrencyCode yoksa undefined', () => {
      // JS-kütüphane 'EARSIVBELGE'/'MUSTAHSILMAKBUZ'/'TRY' doldururdu — bilinçli kırıldı;
      // yokluk kararı (ör. 400-red) tüketicinin ingest katmanının.
      const converter = new CreditNoteConverter();
      const receipt = converter.convert(minimalXml);

      expect(receipt.profileId).toBeUndefined();
      expect(receipt.typeCode).toBeUndefined();
      expect(receipt.currencyCode).toBeUndefined();
      // Yapısal çekirdek yine dolu
      expect(receipt.uuid).toBe('c0000000-9999-4000-8000-000000000009');
      expect(receipt.number).toBe('TST2026000000001');
    });

    it('TaxTotal\'sız belge tolere edilmeli (boş subtotal + 0 toplam)', () => {
      const converter = new CreditNoteConverter();
      const receipt = converter.convert(minimalXml);

      expect(receipt.taxTotal).toBe(0);
      expect(receipt.taxSubtotals).toEqual([]);
      expect(receipt.taxTotals).toEqual([]);
      expect(receipt.withholdingTaxTotal).toBe(0);
      // Kalem yine normalize edilir
      expect(receipt.lines).toHaveLength(1);
      expect(receipt.lines[0]?.quantity).toBe(10);
      expect(receipt.payableAmount).toBe(98);
    });

    it('exchangeRate PricingExchangeRate yoksa 1 olmalı', () => {
      const converter = new CreditNoteConverter();
      const receipt = converter.convert(minimalXml);

      expect(receipt.exchangeRate).toBe(1);
    });
  });
});
