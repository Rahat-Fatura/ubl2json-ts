import { describe, it, expect, beforeAll } from 'vitest';
import { DespatchConverter, UblParseError, DespatchProfileId, DespatchTypeCode } from '../index';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const RESOURCES_PATH = join(__dirname, 'resources', 'despatches');

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
  return existsSync(RESOURCES_PATH);
};

/**
 * Klasördeki tüm XML dosyalarını listeler
 */
const getXmlFiles = (): string[] => {
  if (!existsSync(RESOURCES_PATH)) {
    return [];
  }
  const fs = require('fs');
  return fs.readdirSync(RESOURCES_PATH)
    .filter((file: string) => file.endsWith('.xml'));
};

const sampleDespatchXml = `<?xml version="1.0" encoding="UTF-8"?>
<DespatchAdvice xmlns="urn:oasis:names:specification:ubl:schema:xsd:DespatchAdvice-2">
  <UUID>550e8400-e29b-41d4-a716-446655440000</UUID>
  <ID>TSI2024000000001</ID>
  <ProfileID>TEMELIRSALIYE</ProfileID>
  <DespatchAdviceTypeCode>SEVK</DespatchAdviceTypeCode>
  <IssueDate>2024-01-15</IssueDate>
  <IssueTime>14:30:00</IssueTime>
  <Note>Test irsaliye notu</Note>
  <LineCountNumeric>1</LineCountNumeric>
  <DespatchSupplierParty>
    <Party>
      <PartyIdentification>
        <ID schemeID="VKN">1234567890</ID>
      </PartyIdentification>
      <PartyName>
        <Name>Test Tedarikçi A.Ş.</Name>
      </PartyName>
      <PostalAddress>
        <StreetName>Test Sokak</StreetName>
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
  </DespatchSupplierParty>
  <DeliveryCustomerParty>
    <Party>
      <PartyIdentification>
        <ID schemeID="VKN">0987654321</ID>
      </PartyIdentification>
      <PartyName>
        <Name>Test Alıcı Ltd.</Name>
      </PartyName>
      <PostalAddress>
        <StreetName>Alıcı Sokak</StreetName>
        <CitySubdivisionName>Alıcı İlçe</CitySubdivisionName>
        <CityName>Ankara</CityName>
        <Country>
          <Name>Türkiye</Name>
        </Country>
      </PostalAddress>
    </Party>
  </DeliveryCustomerParty>
  <Shipment>
    <ID/>
    <ShipmentStage>
      <TransportMeans>
        <RoadTransport>
          <LicensePlateID schemeID="PLAKA">34ABC123</LicensePlateID>
        </RoadTransport>
      </TransportMeans>
      <DriverPerson>
        <FirstName>Ahmet</FirstName>
        <FamilyName>Yılmaz</FamilyName>
        <Title>Şoför</Title>
        <NationalityID>12345678901</NationalityID>
      </DriverPerson>
    </ShipmentStage>
    <Delivery>
      <DeliveryAddress>
        <StreetName>Teslimat Adresi</StreetName>
        <CitySubdivisionName>Teslimat İlçe</CitySubdivisionName>
        <CityName>Ankara</CityName>
        <Country>
          <Name>Türkiye</Name>
        </Country>
      </DeliveryAddress>
      <CarrierParty>
        <PartyIdentification>
          <ID schemeID="VKN">1112223334</ID>
        </PartyIdentification>
        <PartyName>
          <Name>Test Kargo A.Ş.</Name>
        </PartyName>
      </CarrierParty>
      <Despatch>
        <ActualDespatchDate>2024-01-15</ActualDespatchDate>
        <ActualDespatchTime>14:30:00</ActualDespatchTime>
      </Despatch>
    </Delivery>
  </Shipment>
  <DespatchLine>
    <ID>1</ID>
    <Note>Test ürün notu</Note>
    <DeliveredQuantity unitCode="C62">10</DeliveredQuantity>
    <OrderLineReference>
      <LineID>1</LineID>
    </OrderLineReference>
    <Item>
      <Name>Test Ürün</Name>
      <SellersItemIdentification>
        <ID>SKU-001</ID>
      </SellersItemIdentification>
    </Item>
  </DespatchLine>
</DespatchAdvice>`;

describe('DespatchConverter', () => {
  describe('constructor', () => {
    it('instance oluşturulabilmeli', () => {
      const converter = new DespatchConverter();
      expect(converter).toBeInstanceOf(DespatchConverter);
    });
  });

  describe('parseToRaw', () => {
    it('geçerli XML\'i raw JSON\'a parse etmeli', () => {
      const converter = new DespatchConverter();
      const raw = converter.parseToRaw(sampleDespatchXml);

      expect(raw.DespatchAdvice).toBeDefined();
      expect(raw.DespatchAdvice.UUID.val).toBe('550e8400-e29b-41d4-a716-446655440000');
      expect(raw.DespatchAdvice.ID.val).toBe('TSI2024000000001');
    });

    it('geçersiz XML için UblParseError fırlatmalı', () => {
      const converter = new DespatchConverter();
      const malformedXml = '<DespatchAdvice><UUID>test</UUID';

      expect(() => converter.parseToRaw(malformedXml)).toThrow(UblParseError);
    });
  });

  describe('convert', () => {
    it('XML\'i normalize edilmiş DespatchAdvice\'a dönüştürmeli', () => {
      const converter = new DespatchConverter();
      const despatch = converter.convert(sampleDespatchXml);

      expect(despatch.uuid).toBe('550e8400-e29b-41d4-a716-446655440000');
      expect(despatch.number).toBe('TSI2024000000001');
      expect(despatch.profileId).toBe('TEMELIRSALIYE');
      expect(despatch.typeCode).toBe('SEVK');
    });

    it('tarih ve saati doğru parse etmeli', () => {
      const converter = new DespatchConverter();
      const despatch = converter.convert(sampleDespatchXml);

      expect(despatch.issueDatetime).toBeInstanceOf(Date);
      expect(despatch.issueDatetime.toISOString()).toContain('2024-01-15');
    });

    it('sender bilgilerini doğru normalize etmeli', () => {
      const converter = new DespatchConverter();
      const despatch = converter.convert(sampleDespatchXml);

      expect(despatch.senderName).toBe('Test Tedarikçi A.Ş.');
      expect(despatch.senderTax).toBe('1234567890');
      expect(despatch.senderObject.city).toBe('İstanbul');
    });

    it('receiver bilgilerini doğru normalize etmeli', () => {
      const converter = new DespatchConverter();
      const despatch = converter.convert(sampleDespatchXml);

      expect(despatch.receiverName).toBe('Test Alıcı Ltd.');
      expect(despatch.receiverTax).toBe('0987654321');
      expect(despatch.receiverObject.city).toBe('Ankara');
    });

    it('shipment bilgilerini doğru parse etmeli', () => {
      const converter = new DespatchConverter();
      const despatch = converter.convert(sampleDespatchXml);

      // Shipment tanımlı olmalı
      expect(despatch.shipment).toBeDefined();
      
      // Shipment varsa yapısı doğru olmalı
      if (despatch.shipment) {
        expect(typeof despatch.shipment).toBe('object');
        
        // Opsiyonel alanlar varsa doğru tipte olmalı
        if (despatch.shipment.licensePlate) {
          expect(typeof despatch.shipment.licensePlate).toBe('string');
        }
        if (despatch.shipment.driver) {
          expect(typeof despatch.shipment.driver).toBe('object');
        }
        if (despatch.shipment.carrierParty) {
          expect(typeof despatch.shipment.carrierParty).toBe('object');
        }
        if (despatch.shipment.deliveryAddress) {
          expect(typeof despatch.shipment.deliveryAddress).toBe('object');
        }
      }
    });

    it('satır bilgilerini doğru normalize etmeli', () => {
      const converter = new DespatchConverter();
      const despatch = converter.convert(sampleDespatchXml);

      expect(despatch.lines).toHaveLength(1);
      expect(despatch.lines[0]?.name).toBe('Test Ürün');
      expect(despatch.lines[0]?.quantity).toBe(10);
      expect(despatch.lines[0]?.sellersItemId).toBe('SKU-001');
    });

    it('notları doğru parse etmeli', () => {
      const converter = new DespatchConverter();
      const despatch = converter.convert(sampleDespatchXml);

      expect(despatch.notes).toContain('Test irsaliye notu');
    });

    it('başında 0 olan vergi numaralarını string olarak korumalı', () => {
      const converter = new DespatchConverter();
      const despatch = converter.convert(sampleDespatchXml);

      // Receiver VKN başında 0 var
      expect(despatch.receiverTax).toBe('0987654321');
      expect(despatch.receiverTax).toHaveLength(10);
      expect(typeof despatch.receiverTax).toBe('string');
    });
  });
});

describe('UblParseError (Despatch)', () => {
  it('doğru mesaj ile oluşturulmalı', () => {
    const error = new UblParseError({ message: 'Despatch parse error' });

    expect(error.message).toBe('Despatch parse error');
    expect(error.name).toBe('UblParseError');
  });
});

/**
 * Gerçek XML dosyalarından testler
 * Bu testler src/__tests__/resources/despatches/ klasöründeki XML dosyalarını kullanır.
 * XML dosyaları gizli veriler içerebileceği için .gitignore'da hariç tutulmuştur.
 * 
 * NOT: Bu testler belirli XML değerlerine bağlı değildir. Yapısal ve tip kontrolleri yapar.
 */
describe('Gerçek Despatch XML Dosyaları ile Testler', () => {
  const converter = new DespatchConverter();

  // Geçerli ProfileID değerleri (enum'dan)
  const validProfileIds = Object.values(DespatchProfileId);

  // Geçerli DespatchAdviceTypeCode değerleri (enum'dan)
  const validTypeCodes = Object.values(DespatchTypeCode);

  /**
   * Genel yapısal testler - Tüm XML dosyaları için çalışır
   */
  const testDespatchStructure = (xml: string, filename: string) => {
    describe(`${filename} - Yapısal Testler`, () => {
      let despatch: ReturnType<typeof converter.convert>;

      beforeAll(() => {
        despatch = converter.convert(xml);
      });

      it('zorunlu alanlar tanımlı olmalı', () => {
        expect(despatch.uuid).toBeDefined();
        expect(typeof despatch.uuid).toBe('string');
        
        expect(despatch.number).toBeDefined();
        expect(typeof despatch.number).toBe('string');
        
        expect(despatch.profileId).toBeDefined();
        expect(validProfileIds).toContain(despatch.profileId);
        
        expect(despatch.typeCode).toBeDefined();
        
        expect(despatch.issueDatetime).toBeInstanceOf(Date);
      });

      it('sender bilgileri doğru yapıda olmalı', () => {
        expect(despatch.senderObject).toBeDefined();
        expect(despatch.senderName).toBeDefined();
        expect(typeof despatch.senderName).toBe('string');
        
        expect(despatch.senderTax).toBeDefined();
        expect(typeof despatch.senderTax).toBe('string');
        
        if (despatch.senderTax) {
          expect([10, 11]).toContain(despatch.senderTax.length);
        }
      });

      it('receiver bilgileri doğru yapıda olmalı', () => {
        expect(despatch.receiverObject).toBeDefined();
        expect(despatch.receiverName).toBeDefined();
        expect(typeof despatch.receiverName).toBe('string');
        
        expect(despatch.receiverTax).toBeDefined();
        expect(typeof despatch.receiverTax).toBe('string');
        
        if (despatch.receiverTax) {
          expect([10, 11]).toContain(despatch.receiverTax.length);
        }
      });

      it('en az 1 satır (DespatchLine) olmalı', () => {
        expect(Array.isArray(despatch.lines)).toBe(true);
        expect(despatch.lines.length).toBeGreaterThanOrEqual(1);
        
        despatch.lines.forEach((line, index) => {
          expect(line.id, `Satır ${index + 1} id tanımlı olmalı`).toBeDefined();
          expect(line.name, `Satır ${index + 1} name tanımlı olmalı`).toBeDefined();
        });
      });

      it('opsiyonel alanlar doğru tipte olmalı', () => {
        expect(Array.isArray(despatch.notes)).toBe(true);
        expect(Array.isArray(despatch.additionalDocumentReference)).toBe(true);
        expect(typeof despatch.lineCount).toBe('number');
      });

      it('shipment varsa doğru yapıda olmalı', () => {
        if (despatch.shipment) {
          expect(typeof despatch.shipment).toBe('object');
          
          if (despatch.shipment.driver) {
            expect(typeof despatch.shipment.driver).toBe('object');
          }
          
          if (despatch.shipment.carrierParty) {
            expect(typeof despatch.shipment.carrierParty).toBe('object');
          }
          
          if (despatch.shipment.deliveryAddress) {
            expect(typeof despatch.shipment.deliveryAddress).toBe('object');
          }
        }
      });
    });
  };

  // Mevcut XML dosyaları için yapısal testleri çalıştır
  const xmlFiles = getXmlFiles();
  
  if (xmlFiles.length > 0) {
    xmlFiles.forEach(filename => {
      const xml = loadTestXml(filename);
      if (xml) {
        testDespatchStructure(xml, filename);
      }
    });
  } else {
    it.skip('Test XML dosyaları bulunamadı', () => {});
  }
});
