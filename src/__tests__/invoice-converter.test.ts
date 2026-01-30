import { describe, it, expect, beforeAll } from 'vitest';
import { InvoiceConverter, UblParseError } from '../index';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const RESOURCES_PATH = join(__dirname, 'resources', 'invoices');

/**
 * Test XML dosyalarını yükler
 */
const loadTestXml = (filename: string): string | null => {
  const filePath = join(RESOURCES_PATH, filename);
  if (!existsSync(filePath)) {
    return null;
  }
  return readFileSync(filePath, 'utf-8');
};

/**
 * Test XML dosyalarının varlığını kontrol eder
 */
const hasTestFiles = (): boolean => {
  return existsSync(RESOURCES_PATH) && existsSync(join(RESOURCES_PATH, 'test1.xml'));
};

const sampleInvoiceXml = `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2">
  <UUID>550e8400-e29b-41d4-a716-446655440000</UUID>
  <ID>ABC2024000000001</ID>
  <ProfileID>TICARIFATURA</ProfileID>
  <InvoiceTypeCode>SATIS</InvoiceTypeCode>
  <IssueDate>2024-01-15</IssueDate>
  <IssueTime>14:30:00</IssueTime>
  <Note>Test faturası notu</Note>
  <DocumentCurrencyCode>TRY</DocumentCurrencyCode>
  <AccountingSupplierParty>
    <Party>
      <PartyIdentification>
        <ID schemeID="VKN">1234567890</ID>
      </PartyIdentification>
      <PartyName>
        <Name>Test Satıcı A.Ş.</Name>
      </PartyName>
      <PostalAddress>
        <StreetName>Test Sokak</StreetName>
        <BuildingName>Test Bina</BuildingName>
        <BuildingNumber>1</BuildingNumber>
        <CitySubdivisionName>Test İlçe</CitySubdivisionName>
        <CityName>İstanbul</CityName>
        <Country>
          <Name>Türkiye</Name>
        </Country>
      </PostalAddress>
      <PartyTaxScheme>
        <TaxScheme>
          <Name>Test Vergi Dairesi</Name>
        </TaxScheme>
      </PartyTaxScheme>
      <Contact>
        <Telephone>02121234567</Telephone>
        <ElectronicMail>test@test.com</ElectronicMail>
      </Contact>
    </Party>
  </AccountingSupplierParty>
  <AccountingCustomerParty>
    <Party>
      <PartyIdentification>
        <ID schemeID="TCKN">12345678901</ID>
      </PartyIdentification>
      <Person>
        <FirstName>Ali</FirstName>
        <FamilyName>Yılmaz</FamilyName>
      </Person>
      <PostalAddress>
        <StreetName>Müşteri Sokak</StreetName>
        <CityName>Ankara</CityName>
        <Country>
          <Name>Türkiye</Name>
        </Country>
      </PostalAddress>
    </Party>
  </AccountingCustomerParty>
  <TaxTotal>
    <TaxAmount currencyID="TRY">180.00</TaxAmount>
    <TaxSubtotal>
      <TaxableAmount currencyID="TRY">1000.00</TaxableAmount>
      <TaxAmount currencyID="TRY">180.00</TaxAmount>
      <Percent>18</Percent>
      <TaxCategory>
        <TaxScheme>
          <Name>KDV</Name>
          <TaxTypeCode>0015</TaxTypeCode>
        </TaxScheme>
      </TaxCategory>
    </TaxSubtotal>
  </TaxTotal>
  <LegalMonetaryTotal>
    <LineExtensionAmount currencyID="TRY">1000.00</LineExtensionAmount>
    <TaxExclusiveAmount currencyID="TRY">1000.00</TaxExclusiveAmount>
    <TaxInclusiveAmount currencyID="TRY">1180.00</TaxInclusiveAmount>
    <PayableAmount currencyID="TRY">1180.00</PayableAmount>
  </LegalMonetaryTotal>
  <InvoiceLine>
    <ID>1</ID>
    <InvoicedQuantity unitCode="C62">10</InvoicedQuantity>
    <LineExtensionAmount currencyID="TRY">1000.00</LineExtensionAmount>
    <TaxTotal>
      <TaxAmount currencyID="TRY">180.00</TaxAmount>
      <TaxSubtotal>
        <TaxableAmount currencyID="TRY">1000.00</TaxableAmount>
        <TaxAmount currencyID="TRY">180.00</TaxAmount>
        <Percent>18</Percent>
        <TaxCategory>
          <TaxScheme>
            <Name>KDV</Name>
            <TaxTypeCode>0015</TaxTypeCode>
          </TaxScheme>
        </TaxCategory>
      </TaxSubtotal>
    </TaxTotal>
    <Item>
      <Name>Test Ürün</Name>
      <Description>Test ürün açıklaması</Description>
    </Item>
    <Price>
      <PriceAmount currencyID="TRY">100.00</PriceAmount>
    </Price>
  </InvoiceLine>
</Invoice>`;

describe('InvoiceConverter', () => {
  describe('constructor', () => {
    it('varsayılan options ile oluşturulabilmeli', () => {
      const converter = new InvoiceConverter();
      const options = converter.getOptions();

      expect(options.setBuyerCustomerToReceiverForExportInvoices).toBe(false);
    });

    it('özel options ile oluşturulabilmeli', () => {
      const converter = new InvoiceConverter({
        setBuyerCustomerToReceiverForExportInvoices: true,
      });
      const options = converter.getOptions();

      expect(options.setBuyerCustomerToReceiverForExportInvoices).toBe(true);
    });
  });

  describe('parseToRaw', () => {
    it('geçerli XML\'i raw JSON\'a parse etmeli', () => {
      const converter = new InvoiceConverter();
      const raw = converter.parseToRaw(sampleInvoiceXml);

      expect(raw.Invoice).toBeDefined();
      expect(raw.Invoice.UUID.val).toBe('550e8400-e29b-41d4-a716-446655440000');
      expect(raw.Invoice.ID.val).toBe('ABC2024000000001');
    });

    it('geçersiz XML için UblParseError fırlatmalı', () => {
      const converter = new InvoiceConverter();
      const malformedXml = '<Invoice><UUID>test</UUID';

      expect(() => converter.parseToRaw(malformedXml)).toThrow(UblParseError);
    });
  });

  describe('convert', () => {
    it('XML\'i normalize edilmiş Invoice\'a dönüştürmeli', () => {
      const converter = new InvoiceConverter();
      const invoice = converter.convert(sampleInvoiceXml);

      expect(invoice.uuid).toBe('550e8400-e29b-41d4-a716-446655440000');
      expect(invoice.number).toBe('ABC2024000000001');
      expect(invoice.profileId).toBe('TICARIFATURA');
      expect(invoice.typeCode).toBe('SATIS');
      expect(invoice.currencyCode).toBe('TRY');
    });

    it('tarih ve saati doğru parse etmeli', () => {
      const converter = new InvoiceConverter();
      const invoice = converter.convert(sampleInvoiceXml);

      expect(invoice.issueDatetime).toBeInstanceOf(Date);
      expect(invoice.issueDatetime.toISOString()).toContain('2024-01-15');
    });

    it('sender bilgilerini doğru normalize etmeli', () => {
      const converter = new InvoiceConverter();
      const invoice = converter.convert(sampleInvoiceXml);

      expect(invoice.senderName).toBe('Test Satıcı A.Ş.');
      expect(invoice.senderTax).toBe('1234567890');
      expect(invoice.senderObject.city).toBe('İstanbul');
      expect(invoice.senderObject.email).toBe('test@test.com');
    });

    it('receiver bilgilerini doğru normalize etmeli (TCKN ile)', () => {
      const converter = new InvoiceConverter();
      const invoice = converter.convert(sampleInvoiceXml);

      expect(invoice.receiverName).toBe('Ali Yılmaz');
      expect(invoice.receiverTax).toBe('12345678901');
      expect(invoice.receiverObject.city).toBe('Ankara');
    });

    it('başında 0 olan vergi numaralarını string olarak korumalı', () => {
      const xmlWithLeadingZeros = `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2">
  <UUID>test-uuid</UUID>
  <ID>TEST001</ID>
  <ProfileID>TICARIFATURA</ProfileID>
  <InvoiceTypeCode>SATIS</InvoiceTypeCode>
  <IssueDate>2024-01-15</IssueDate>
  <DocumentCurrencyCode>TRY</DocumentCurrencyCode>
  <AccountingSupplierParty>
    <Party>
      <PartyIdentification>
        <ID schemeID="VKN">0123456789</ID>
      </PartyIdentification>
      <PartyName><Name>Test</Name></PartyName>
      <PostalAddress><Country><Name>TR</Name></Country></PostalAddress>
    </Party>
  </AccountingSupplierParty>
  <AccountingCustomerParty>
    <Party>
      <PartyIdentification>
        <ID schemeID="TCKN">00012345678</ID>
      </PartyIdentification>
      <Person><FirstName>Test</FirstName><FamilyName>User</FamilyName></Person>
      <PostalAddress><Country><Name>TR</Name></Country></PostalAddress>
    </Party>
  </AccountingCustomerParty>
  <TaxTotal>
    <TaxAmount currencyID="TRY">0</TaxAmount>
  </TaxTotal>
  <LegalMonetaryTotal>
    <LineExtensionAmount currencyID="TRY">0</LineExtensionAmount>
    <TaxExclusiveAmount currencyID="TRY">0</TaxExclusiveAmount>
    <TaxInclusiveAmount currencyID="TRY">0</TaxInclusiveAmount>
  </LegalMonetaryTotal>
  <InvoiceLine>
    <ID>1</ID>
    <InvoicedQuantity unitCode="C62">1</InvoicedQuantity>
    <LineExtensionAmount currencyID="TRY">0</LineExtensionAmount>
    <Item><Name>Test</Name></Item>
    <Price><PriceAmount currencyID="TRY">0</PriceAmount></Price>
  </InvoiceLine>
</Invoice>`;

      const converter = new InvoiceConverter();
      const invoice = converter.convert(xmlWithLeadingZeros);

      // VKN 10 hane olmalı, başındaki 0 korunmalı
      expect(invoice.senderTax).toBe('0123456789');
      expect(invoice.senderTax).toHaveLength(10);
      expect(typeof invoice.senderTax).toBe('string');

      // TCKN 11 hane olmalı, başındaki 0'lar korunmalı
      expect(invoice.receiverTax).toBe('00012345678');
      expect(invoice.receiverTax).toHaveLength(11);
      expect(typeof invoice.receiverTax).toBe('string');
    });

    it('vergi bilgilerini doğru hesaplamalı', () => {
      const converter = new InvoiceConverter();
      const invoice = converter.convert(sampleInvoiceXml);

      expect(invoice.taxTotal).toBe(180);
      expect(invoice.taxSubtotals).toHaveLength(1);
      expect(invoice.taxSubtotals[0]?.name).toBe('KDV');
      expect(invoice.taxSubtotals[0]?.percent).toBe(18);
    });

    it('tutar bilgilerini doğru hesaplamalı', () => {
      const converter = new InvoiceConverter();
      const invoice = converter.convert(sampleInvoiceXml);

      expect(invoice.lineExtension).toBe(1000);
      expect(invoice.taxExclusive).toBe(1000);
      expect(invoice.taxInclusive).toBe(1180);
      expect(invoice.payableAmount).toBe(1180);
    });

    it('satır bilgilerini doğru normalize etmeli', () => {
      const converter = new InvoiceConverter();
      const invoice = converter.convert(sampleInvoiceXml);

      expect(invoice.lines).toHaveLength(1);
      expect(invoice.lines[0]?.name).toBe('Test Ürün');
      expect(invoice.lines[0]?.quantity).toBe(10);
      expect(invoice.lines[0]?.price).toBe(100);
      expect(invoice.lines[0]?.extensionAmount).toBe(1000);
    });

    it('notları doğru parse etmeli', () => {
      const converter = new InvoiceConverter();
      const invoice = converter.convert(sampleInvoiceXml);

      expect(invoice.notes).toContain('Test faturası notu');
    });
  });

  describe('updateOptions', () => {
    it('options güncellenmeli', () => {
      const converter = new InvoiceConverter();

      expect(converter.getOptions().setBuyerCustomerToReceiverForExportInvoices).toBe(
        false
      );

      converter.updateOptions({
        setBuyerCustomerToReceiverForExportInvoices: true,
      });

      expect(converter.getOptions().setBuyerCustomerToReceiverForExportInvoices).toBe(
        true
      );
    });
  });
});

describe('UblParseError', () => {
  it('doğru mesaj ile oluşturulmalı', () => {
    const error = new UblParseError({ message: 'Test error' });

    expect(error.message).toBe('Test error');
    expect(error.name).toBe('UblParseError');
  });

  it('cause ile oluşturulabilmeli', () => {
    const cause = new Error('Original error');
    const error = new UblParseError({ message: 'Wrapper error', cause });

    expect(error.cause).toBe(cause);
  });
});

/**
 * Gerçek XML dosyalarından testler
 * Bu testler src/__tests__/resources/invoices/ klasöründeki XML dosyalarını kullanır.
 * XML dosyaları gizli veriler içerebileceği için .gitignore'da hariç tutulmuştur.
 * 
 * NOT: Bu testler belirli XML değerlerine bağlı değildir. Yapısal ve tip kontrolleri yapar.
 */
describe('Gerçek XML Dosyaları ile Testler', () => {
  const converter = new InvoiceConverter();

  // Geçerli ProfileID değerleri
  const validProfileIds = [
    'TICARIFATURA', 'TEMELFATURA', 'YOLCUBERABERFATURA', 
    'IHRACAT', 'OZELFATURA', 'KAMU', 'HKS', 'ILAC_TIBBICIHAZ'
  ];

  // Geçerli InvoiceTypeCode değerleri
  const validTypeCodes = [
    'SATIS', 'IADE', 'TEVKIFAT', 'ISTISNA', 
    'OZELMATRAH', 'IHRACKAYITLI', 'SGK', 'KOMISYONCU'
  ];

  /**
   * Genel yapısal testler - Tüm XML dosyaları için çalışır
   */
  const testInvoiceStructure = (xml: string, filename: string) => {
    describe(`${filename} - Yapısal Testler`, () => {
      let invoice: ReturnType<typeof converter.convert>;

      beforeAll(() => {
        invoice = converter.convert(xml);
      });

      it('zorunlu alanlar tanımlı olmalı', () => {
        // Zorunlu alanlar
        expect(invoice.uuid).toBeDefined();
        expect(typeof invoice.uuid).toBe('string');
        
        expect(invoice.number).toBeDefined();
        expect(typeof invoice.number).toBe('string');
        
        expect(invoice.profileId).toBeDefined();
        expect(validProfileIds).toContain(invoice.profileId);
        
        expect(invoice.typeCode).toBeDefined();
        expect(validTypeCodes).toContain(invoice.typeCode);
        
        expect(invoice.issueDatetime).toBeInstanceOf(Date);
        
        expect(invoice.currencyCode).toBeDefined();
        expect(typeof invoice.currencyCode).toBe('string');
      });

      it('sender bilgileri doğru yapıda olmalı', () => {
        expect(invoice.senderObject).toBeDefined();
        expect(invoice.senderName).toBeDefined();
        expect(typeof invoice.senderName).toBe('string');
        
        // VKN/TCKN string olmalı
        expect(invoice.senderTax).toBeDefined();
        expect(typeof invoice.senderTax).toBe('string');
        
        // VKN 10, TCKN 11 hane
        if (invoice.senderTax) {
          expect([10, 11]).toContain(invoice.senderTax.length);
        }
      });

      it('receiver bilgileri doğru yapıda olmalı', () => {
        expect(invoice.receiverObject).toBeDefined();
        expect(invoice.receiverName).toBeDefined();
        expect(typeof invoice.receiverName).toBe('string');
        
        // VKN/TCKN string olmalı
        expect(invoice.receiverTax).toBeDefined();
        expect(typeof invoice.receiverTax).toBe('string');
        
        // VKN 10, TCKN 11 hane
        if (invoice.receiverTax) {
          expect([10, 11]).toContain(invoice.receiverTax.length);
        }
      });

      it('LegalMonetaryTotal alanları tanımlı olmalı', () => {
        // Bu alanlar her zaman olmayabilir ama tanımlıysa sayısal olmalı
        if (invoice.lineExtension !== undefined) {
          expect(typeof invoice.lineExtension).toBe('number');
        }
        if (invoice.taxExclusive !== undefined) {
          expect(typeof invoice.taxExclusive).toBe('number');
        }
        if (invoice.taxInclusive !== undefined) {
          expect(typeof invoice.taxInclusive).toBe('number');
        }
        if (invoice.payableAmount !== undefined) {
          expect(typeof invoice.payableAmount).toBe('number');
        }
      });

      it('en az 1 satır (InvoiceLine) olmalı', () => {
        expect(Array.isArray(invoice.lines)).toBe(true);
        expect(invoice.lines.length).toBeGreaterThanOrEqual(1);
        
        // Her satırın temel alanları olmalı
        invoice.lines.forEach((line, index) => {
          expect(line.id, `Satır ${index + 1} id tanımlı olmalı`).toBeDefined();
          expect(line.name, `Satır ${index + 1} name tanımlı olmalı`).toBeDefined();
        });
      });

      it('opsiyonel alanlar doğru tipte olmalı', () => {
        // Notes array olmalı (boş olabilir)
        expect(Array.isArray(invoice.notes)).toBe(true);
        
        // Despatches array olmalı (boş olabilir)
        expect(Array.isArray(invoice.despatches)).toBe(true);
        
        // TaxSubtotals array olmalı (boş olabilir)
        expect(Array.isArray(invoice.taxSubtotals)).toBe(true);
        
        // exchangeRate yoksa varsayılan 1 olmalı
        expect(typeof invoice.exchangeRate).toBe('number');
        expect(invoice.exchangeRate).toBeGreaterThanOrEqual(1);
      });

      it('taxTotal sayısal olmalı (0 olabilir)', () => {
        expect(typeof invoice.taxTotal).toBe('number');
        expect(invoice.taxTotal).toBeGreaterThanOrEqual(0);
      });
    });
  };

  /**
   * İhracat faturası için özel testler
   */
  describe.skipIf(!existsSync(join(RESOURCES_PATH, 'ihracat.xml')))('ihracat.xml - İhracat Faturası', () => {
    let xml: string;
    let invoice: ReturnType<typeof converter.convert>;

    beforeAll(() => {
      const loaded = loadTestXml('ihracat.xml');
      if (loaded) {
        xml = loaded;
        invoice = converter.convert(xml);
      }
    });

    it('IHRACAT profil ID\'sine sahip olmalı', () => {
      expect(invoice.profileId).toBe('IHRACAT');
    });

    it('BuyerCustomerParty tanımlı olmalı', () => {
      expect(invoice.buyerCustomerObject).toBeDefined();
      expect(invoice.buyerCustomerName).toBeDefined();
      expect(typeof invoice.buyerCustomerName).toBe('string');
    });

    it('BuyerCustomerParty vkn_tckn string olmalı', () => {
      // PARTYTYPE durumunda serbest format (yurt dışı vergi no)
      expect(invoice.buyerCustomerObject?.vknTckn).toBeDefined();
      expect(typeof invoice.buyerCustomerObject?.vknTckn).toBe('string');
    });

    it('setBuyerCustomerToReceiverForExportInvoices seçeneği çalışmalı', () => {
      const exportConverter = new InvoiceConverter({
        setBuyerCustomerToReceiverForExportInvoices: true,
      });
      const exportInvoice = exportConverter.convert(xml);

      // BuyerCustomer, receiver'a taşınmalı
      expect(exportInvoice.receiverObject?.name).toBe(invoice.buyerCustomerObject?.name);
      // buyerCustomerObject null veya undefined olmalı
      expect(exportInvoice.buyerCustomerObject).toBeFalsy();
    });
  });

  // Mevcut XML dosyaları için yapısal testleri çalıştır
  const testFiles = ['test1.xml', 'test2.xml', 'test3.xml', 'test4.xml'];
  
  testFiles.forEach(filename => {
    const filePath = join(RESOURCES_PATH, filename);
    if (existsSync(filePath)) {
      const xml = readFileSync(filePath, 'utf-8');
      testInvoiceStructure(xml, filename);
    }
  });
});
