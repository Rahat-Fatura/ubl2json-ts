/**
 * DespatchConverter Normal Kullanım Test Scripti
 * Çalıştırma: npx ts-node scripts/test-despatch.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { DespatchConverter, DespatchProfileId, DespatchTypeCode } from '../src';

const DESPATCH_DIR = path.join(__dirname, '../src/__tests__/resources/despatches');

function main() {
  console.log('='.repeat(80));
  console.log('DespatchConverter Test Scripti');
  console.log('='.repeat(80));
  console.log();

  // Despatch klasöründeki XML dosyalarını bul
  let xmlFiles: string[] = [];
  
  if (fs.existsSync(DESPATCH_DIR)) {
    xmlFiles = fs.readdirSync(DESPATCH_DIR).filter(f => f.endsWith('.xml'));
  }

  if (xmlFiles.length === 0) {
    console.log('⚠️  Despatch XML dosyası bulunamadı.');
    console.log(`   Klasör: ${DESPATCH_DIR}`);
    console.log();
    console.log('Örnek XML ile test ediliyor...');
    console.log();
    testWithSampleXml();
    return;
  }

  console.log(`📁 ${xmlFiles.length} adet despatch XML dosyası bulundu.`);
  console.log();

  const converter = new DespatchConverter();

  // İlk dosyayı detaylı göster
  const firstFile = xmlFiles[0]!;
  console.log(`📄 Detaylı Çıktı: ${firstFile}`);
  console.log('-'.repeat(80));

  const xmlContent = fs.readFileSync(path.join(DESPATCH_DIR, firstFile), 'utf-8');
  
  try {
    const despatch = converter.convert(xmlContent);
    
    console.log(JSON.stringify(despatch, null, 2));
    console.log();
    console.log('-'.repeat(80));
    console.log();

    // Özet bilgiler
    console.log('📊 Özet Bilgiler:');
    console.log(`   UUID: ${despatch.uuid}`);
    console.log(`   Numara: ${despatch.number}`);
    console.log(`   Profil: ${despatch.profileId}`);
    console.log(`   Tip: ${despatch.typeCode}`);
    console.log(`   Tarih: ${despatch.issueDatetime.toISOString()}`);
    console.log(`   Gönderen: ${despatch.senderName} (${despatch.senderTax})`);
    console.log(`   Alıcı: ${despatch.receiverName} (${despatch.receiverTax})`);
    console.log(`   Satır Sayısı: ${despatch.lines.length}`);
    console.log();

    // ProfileID ve TypeCode enum kontrolü
    console.log('🔍 Enum Kontrolleri:');
    if (Object.values(DespatchProfileId).includes(despatch.profileId as DespatchProfileId)) {
      console.log(`   ✅ ProfileID geçerli: ${despatch.profileId}`);
    } else {
      console.log(`   ⚠️  ProfileID bilinmiyor: ${despatch.profileId}`);
    }

    if (Object.values(DespatchTypeCode).includes(despatch.typeCode as DespatchTypeCode)) {
      console.log(`   ✅ TypeCode geçerli: ${despatch.typeCode}`);
    } else {
      console.log(`   ⚠️  TypeCode bilinmiyor: ${despatch.typeCode}`);
    }
    console.log();

    // Shipment bilgisi
    if (despatch.shipment) {
      console.log('🚚 Shipment Bilgisi:');
      console.log(`   Plaka: ${despatch.shipment.licensePlate || 'Yok'}`);
      console.log(`   Transport Mode: ${despatch.shipment.transportModeCode || 'Yok'}`);
      if (despatch.shipment.driver) {
        console.log(`   Sürücü: ${despatch.shipment.driver.firstName} ${despatch.shipment.driver.familyName}`);
      }
      if (despatch.shipment.carrierParty) {
        console.log(`   Taşıyıcı: ${despatch.shipment.carrierParty.name}`);
      }
      if (despatch.shipment.deliveryAddress) {
        console.log(`   Teslimat: ${despatch.shipment.deliveryAddress.city}`);
      }
      console.log();
    }

    // Satırlar
    console.log('📦 Satırlar:');
    despatch.lines.forEach((line, i) => {
      console.log(`   ${i + 1}. ${line.name} - ${line.quantity} ${line.quantityUnit || 'adet'}`);
    });
    console.log();

  } catch (error) {
    console.error('❌ Hata:', error);
  }

  // Diğer dosyaları özet olarak göster
  if (xmlFiles.length > 1) {
    console.log('='.repeat(80));
    console.log('Diğer Dosyalar (Özet):');
    console.log('='.repeat(80));
    console.log();

    for (let i = 1; i < xmlFiles.length; i++) {
      const file = xmlFiles[i]!;
      try {
        const xml = fs.readFileSync(path.join(DESPATCH_DIR, file), 'utf-8');
        const d = converter.convert(xml);
        console.log(`✅ ${file}`);
        console.log(`   ${d.number} | ${d.senderName} → ${d.receiverName} | ${d.lines.length} satır`);
      } catch (err) {
        console.log(`❌ ${file} - Hata: ${(err as Error).message}`);
      }
    }
  }
}

function testWithSampleXml() {
  const sampleXml = `<?xml version="1.0" encoding="UTF-8"?>
<DespatchAdvice xmlns="urn:oasis:names:specification:ubl:schema:xsd:DespatchAdvice-2">
  <UBLVersionID>2.1</UBLVersionID>
  <CustomizationID>TR1.2</CustomizationID>
  <ProfileID>TEMELIRSALIYE</ProfileID>
  <ID>GIB2024000000001</ID>
  <CopyIndicator>false</CopyIndicator>
  <UUID>550e8400-e29b-41d4-a716-446655440000</UUID>
  <IssueDate>2024-01-15</IssueDate>
  <IssueTime>10:30:00</IssueTime>
  <DespatchAdviceTypeCode>SEVK</DespatchAdviceTypeCode>
  <Note>Test irsaliyesi notu</Note>
  <LineCountNumeric>2</LineCountNumeric>
  <DespatchSupplierParty>
    <Party>
      <PartyIdentification><ID schemeID="VKN">1234567890</ID></PartyIdentification>
      <PartyIdentification><ID schemeID="MERSISNO">0123456789012345</ID></PartyIdentification>
      <PartyName><Name>Test Gönderici A.Ş.</Name></PartyName>
      <PostalAddress>
        <StreetName>Test Caddesi</StreetName>
        <BuildingName>Test Plaza</BuildingName>
        <BuildingNumber>123</BuildingNumber>
        <CitySubdivisionName>Merkez</CitySubdivisionName>
        <CityName>İstanbul</CityName>
        <PostalZone>34000</PostalZone>
        <Country><Name>Türkiye</Name></Country>
      </PostalAddress>
      <PartyTaxScheme>
        <TaxScheme><Name>İstanbul VD</Name></TaxScheme>
      </PartyTaxScheme>
      <Contact>
        <Telephone>02121234567</Telephone>
        <ElectronicMail>info@testgonderici.com</ElectronicMail>
      </Contact>
    </Party>
  </DespatchSupplierParty>
  <DeliveryCustomerParty>
    <Party>
      <PartyIdentification><ID schemeID="VKN">0987654321</ID></PartyIdentification>
      <PartyName><Name>Test Alıcı Ltd. Şti.</Name></PartyName>
      <PostalAddress>
        <StreetName>Alıcı Sokak</StreetName>
        <BuildingName>Alıcı Apt</BuildingName>
        <BuildingNumber>45</BuildingNumber>
        <CitySubdivisionName>Çankaya</CitySubdivisionName>
        <CityName>Ankara</CityName>
        <PostalZone>06000</PostalZone>
        <Country><Name>Türkiye</Name></Country>
      </PostalAddress>
      <PartyTaxScheme>
        <TaxScheme><Name>Çankaya VD</Name></TaxScheme>
      </PartyTaxScheme>
    </Party>
  </DeliveryCustomerParty>
  <Shipment>
    <ID>1</ID>
    <ShipmentStage>
      <TransportModeCode>3</TransportModeCode>
      <TransportMeans>
        <RoadTransport>
          <LicensePlateID>34ABC123</LicensePlateID>
        </RoadTransport>
      </TransportMeans>
      <DriverPerson>
        <FirstName>Ahmet</FirstName>
        <FamilyName>Yılmaz</FamilyName>
      </DriverPerson>
    </ShipmentStage>
    <Delivery>
      <DeliveryAddress>
        <CitySubdivisionName>Çankaya</CitySubdivisionName>
        <CityName>Ankara</CityName>
        <Country><Name>Türkiye</Name></Country>
      </DeliveryAddress>
      <CarrierParty>
        <PartyIdentification><ID schemeID="VKN">1112223334</ID></PartyIdentification>
        <PartyName><Name>Hızlı Kargo A.Ş.</Name></PartyName>
      </CarrierParty>
    </Delivery>
  </Shipment>
  <DespatchLine>
    <ID>1</ID>
    <Note>Satır notu 1</Note>
    <DeliveredQuantity unitCode="NIU">100</DeliveredQuantity>
    <OrderLineReference>
      <LineID>ORD-001</LineID>
    </OrderLineReference>
    <Item>
      <Name>Test Ürün 1</Name>
      <SellersItemIdentification><ID>SKU-001</ID></SellersItemIdentification>
      <BuyersItemIdentification><ID>BYR-001</ID></BuyersItemIdentification>
    </Item>
  </DespatchLine>
  <DespatchLine>
    <ID>2</ID>
    <DeliveredQuantity unitCode="KGM">50.5</DeliveredQuantity>
    <Item>
      <Name>Test Ürün 2</Name>
      <SellersItemIdentification><ID>SKU-002</ID></SellersItemIdentification>
    </Item>
  </DespatchLine>
</DespatchAdvice>`;

  const converter = new DespatchConverter();
  
  try {
    const despatch = converter.convert(sampleXml);
    
    console.log('📄 Örnek XML Çıktısı:');
    console.log('-'.repeat(80));
    console.log(JSON.stringify(despatch, null, 2));
    console.log();
    console.log('-'.repeat(80));
    console.log();
    
    console.log('📊 Özet:');
    console.log(`   UUID: ${despatch.uuid}`);
    console.log(`   Numara: ${despatch.number}`);
    console.log(`   Profil: ${despatch.profileId}`);
    console.log(`   Tip: ${despatch.typeCode}`);
    console.log(`   Tarih: ${despatch.issueDatetime.toISOString()}`);
    console.log(`   Gönderen: ${despatch.senderName}`);
    console.log(`   Alıcı: ${despatch.receiverName}`);
    console.log(`   Satır Sayısı: ${despatch.lines.length}`);
    
    if (despatch.shipment) {
      console.log(`   Plaka: ${despatch.shipment.licensePlate}`);
      console.log(`   Sürücü: ${despatch.shipment.driver?.firstName} ${despatch.shipment.driver?.familyName}`);
    }
    
    console.log();
    console.log('✅ Test başarılı!');
    
  } catch (error) {
    console.error('❌ Hata:', error);
  }
}

main();
