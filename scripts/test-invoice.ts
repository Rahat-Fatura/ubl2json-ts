/**
 * InvoiceConverter Normal Kullanım Test Scripti
 * Çalıştırma: yarn test:invoice
 */

import * as fs from 'fs';
import * as path from 'path';
import { InvoiceConverter } from '../src';

const INVOICE_DIR = path.join(__dirname, '../src/__tests__/resources/invoices');

function main() {
  console.log('='.repeat(80));
  console.log('InvoiceConverter Test Scripti');
  console.log('='.repeat(80));
  console.log();

  // Invoice klasöründeki XML dosyalarını bul
  let xmlFiles: string[] = [];
  
  if (fs.existsSync(INVOICE_DIR)) {
    xmlFiles = fs.readdirSync(INVOICE_DIR).filter(f => f.endsWith('.xml'));
  }

  if (xmlFiles.length === 0) {
    console.log('⚠️  Invoice XML dosyası bulunamadı.');
    console.log(`   Klasör: ${INVOICE_DIR}`);
    console.log();
    console.log('Örnek XML ile test ediliyor...');
    console.log();
    testWithSampleXml();
    return;
  }

  console.log(`📁 ${xmlFiles.length} adet invoice XML dosyası bulundu.`);
  console.log();

  const converter = new InvoiceConverter();

  // İlk dosyayı detaylı göster
  const firstFile = xmlFiles[0]!;
  console.log(`📄 Detaylı Çıktı: ${firstFile}`);
  console.log('-'.repeat(80));

  const xmlContent = fs.readFileSync(path.join(INVOICE_DIR, firstFile), 'utf-8');
  
  try {
    const invoice = converter.convert(xmlContent);
    
    console.log(JSON.stringify(invoice, null, 2));
    console.log();
    console.log('-'.repeat(80));
    console.log();

    // Özet bilgiler
    console.log('📊 Özet Bilgiler:');
    console.log(`   UUID: ${invoice.uuid}`);
    console.log(`   Numara: ${invoice.number}`);
    console.log(`   Profil: ${invoice.profileId}`);
    console.log(`   Tip: ${invoice.typeCode}`);
    console.log(`   Tarih: ${invoice.issueDatetime.toISOString()}`);
    console.log(`   Gönderen: ${invoice.senderName} (${invoice.senderTax})`);
    console.log(`   Alıcı: ${invoice.receiverName} (${invoice.receiverTax})`);
    console.log(`   Para Birimi: ${invoice.currencyCode}`);
    console.log(`   Satır Sayısı: ${invoice.lines.length}`);
    console.log();

    // Tutarlar
    console.log('💰 Tutarlar:');
    console.log(`   Satır Toplamı: ${invoice.lineExtension}`);
    console.log(`   Vergi Hariç: ${invoice.taxExclusive}`);
    console.log(`   Vergi Dahil: ${invoice.taxInclusive}`);
    console.log(`   Vergi Toplamı: ${invoice.taxTotal}`);
    console.log(`   Ödenecek: ${invoice.payableAmount}`);
    console.log();

    // Vergi alt toplamları
    if (invoice.taxSubtotals.length > 0) {
      console.log('📋 Vergi Alt Toplamları:');
      invoice.taxSubtotals.forEach((tax, i) => {
        console.log(`   ${i + 1}. ${tax.name} (%${tax.percent}): ${tax.amount}`);
      });
      console.log();
    }

    // Satırlar
    console.log('📦 Satırlar (ilk 5):');
    invoice.lines.slice(0, 5).forEach((line, i) => {
      console.log(`   ${i + 1}. ${line.name} - ${line.quantity} ${line.quantityUnit || 'adet'} x ${line.price} = ${line.extensionAmount}`);
    });
    if (invoice.lines.length > 5) {
      console.log(`   ... ve ${invoice.lines.length - 5} satır daha`);
    }
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
        const xml = fs.readFileSync(path.join(INVOICE_DIR, file), 'utf-8');
        const inv = converter.convert(xml);
        console.log(`✅ ${file}`);
        console.log(`   ${inv.number} | ${inv.senderName} → ${inv.receiverName} | ${inv.payableAmount} ${inv.currencyCode}`);
      } catch (err) {
        console.log(`❌ ${file} - Hata: ${(err as Error).message}`);
      }
    }
  }
}

function testWithSampleXml() {
  const sampleXml = `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
         xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
         xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
  <cbc:UBLVersionID>2.1</cbc:UBLVersionID>
  <cbc:CustomizationID>TR1.2</cbc:CustomizationID>
  <cbc:ProfileID>TICARIFATURA</cbc:ProfileID>
  <cbc:ID>ABC2024000000001</cbc:ID>
  <cbc:CopyIndicator>false</cbc:CopyIndicator>
  <cbc:UUID>550e8400-e29b-41d4-a716-446655440001</cbc:UUID>
  <cbc:IssueDate>2024-01-15</cbc:IssueDate>
  <cbc:IssueTime>10:30:00</cbc:IssueTime>
  <cbc:InvoiceTypeCode>SATIS</cbc:InvoiceTypeCode>
  <cbc:Note>Test fatura notu</cbc:Note>
  <cbc:DocumentCurrencyCode>TRY</cbc:DocumentCurrencyCode>
  <cbc:LineCountNumeric>1</cbc:LineCountNumeric>
  <cac:AccountingSupplierParty>
    <cac:Party>
      <cac:PartyIdentification><cbc:ID schemeID="VKN">1234567890</cbc:ID></cac:PartyIdentification>
      <cac:PartyName><cbc:Name>Test Satıcı A.Ş.</cbc:Name></cac:PartyName>
      <cac:PostalAddress>
        <cbc:StreetName>Test Caddesi</cbc:StreetName>
        <cbc:BuildingName>Test Plaza</cbc:BuildingName>
        <cbc:BuildingNumber>123</cbc:BuildingNumber>
        <cbc:CitySubdivisionName>Merkez</cbc:CitySubdivisionName>
        <cbc:CityName>İstanbul</cbc:CityName>
        <cbc:PostalZone>34000</cbc:PostalZone>
        <cac:Country><cbc:Name>Türkiye</cbc:Name></cac:Country>
      </cac:PostalAddress>
      <cac:PartyTaxScheme>
        <cac:TaxScheme><cbc:Name>İstanbul VD</cbc:Name></cac:TaxScheme>
      </cac:PartyTaxScheme>
    </cac:Party>
  </cac:AccountingSupplierParty>
  <cac:AccountingCustomerParty>
    <cac:Party>
      <cac:PartyIdentification><cbc:ID schemeID="VKN">0987654321</cbc:ID></cac:PartyIdentification>
      <cac:PartyName><cbc:Name>Test Alıcı Ltd. Şti.</cbc:Name></cac:PartyName>
      <cac:PostalAddress>
        <cbc:StreetName>Alıcı Sokak</cbc:StreetName>
        <cbc:BuildingName>Alıcı Apt</cbc:BuildingName>
        <cbc:CitySubdivisionName>Çankaya</cbc:CitySubdivisionName>
        <cbc:CityName>Ankara</cbc:CityName>
        <cbc:PostalZone>06000</cbc:PostalZone>
        <cac:Country><cbc:Name>Türkiye</cbc:Name></cac:Country>
      </cac:PostalAddress>
      <cac:PartyTaxScheme>
        <cac:TaxScheme><cbc:Name>Çankaya VD</cbc:Name></cac:TaxScheme>
      </cac:PartyTaxScheme>
    </cac:Party>
  </cac:AccountingCustomerParty>
  <cac:TaxTotal>
    <cbc:TaxAmount currencyID="TRY">180.00</cbc:TaxAmount>
    <cac:TaxSubtotal>
      <cbc:TaxableAmount currencyID="TRY">1000.00</cbc:TaxableAmount>
      <cbc:TaxAmount currencyID="TRY">180.00</cbc:TaxAmount>
      <cac:TaxCategory>
        <cac:TaxScheme>
          <cbc:Name>KDV</cbc:Name>
          <cbc:TaxTypeCode>0015</cbc:TaxTypeCode>
        </cac:TaxScheme>
      </cac:TaxCategory>
      <cbc:Percent>18</cbc:Percent>
    </cac:TaxSubtotal>
  </cac:TaxTotal>
  <cac:LegalMonetaryTotal>
    <cbc:LineExtensionAmount currencyID="TRY">1000.00</cbc:LineExtensionAmount>
    <cbc:TaxExclusiveAmount currencyID="TRY">1000.00</cbc:TaxExclusiveAmount>
    <cbc:TaxInclusiveAmount currencyID="TRY">1180.00</cbc:TaxInclusiveAmount>
    <cbc:AllowanceTotalAmount currencyID="TRY">0.00</cbc:AllowanceTotalAmount>
    <cbc:ChargeTotalAmount currencyID="TRY">0.00</cbc:ChargeTotalAmount>
    <cbc:PayableAmount currencyID="TRY">1180.00</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>
  <cac:InvoiceLine>
    <cbc:ID>1</cbc:ID>
    <cbc:Note>Satır notu</cbc:Note>
    <cbc:InvoicedQuantity unitCode="NIU">10</cbc:InvoicedQuantity>
    <cbc:LineExtensionAmount currencyID="TRY">1000.00</cbc:LineExtensionAmount>
    <cac:TaxTotal>
      <cbc:TaxAmount currencyID="TRY">180.00</cbc:TaxAmount>
      <cac:TaxSubtotal>
        <cbc:TaxableAmount currencyID="TRY">1000.00</cbc:TaxableAmount>
        <cbc:TaxAmount currencyID="TRY">180.00</cbc:TaxAmount>
        <cac:TaxCategory>
          <cac:TaxScheme>
            <cbc:Name>KDV</cbc:Name>
            <cbc:TaxTypeCode>0015</cbc:TaxTypeCode>
          </cac:TaxScheme>
        </cac:TaxCategory>
        <cbc:Percent>18</cbc:Percent>
      </cac:TaxSubtotal>
    </cac:TaxTotal>
    <cac:Item>
      <cbc:Name>Test Ürün</cbc:Name>
      <cac:SellersItemIdentification><cbc:ID>SKU-001</cbc:ID></cac:SellersItemIdentification>
    </cac:Item>
    <cac:Price>
      <cbc:PriceAmount currencyID="TRY">100.00</cbc:PriceAmount>
    </cac:Price>
  </cac:InvoiceLine>
</Invoice>`;

  const converter = new InvoiceConverter();
  
  try {
    const invoice = converter.convert(sampleXml);
    
    console.log('📄 Örnek XML Çıktısı:');
    console.log('-'.repeat(80));
    console.log(JSON.stringify(invoice, null, 2));
    console.log();
    console.log('-'.repeat(80));
    console.log();
    
    console.log('📊 Özet:');
    console.log(`   UUID: ${invoice.uuid}`);
    console.log(`   Numara: ${invoice.number}`);
    console.log(`   Profil: ${invoice.profileId}`);
    console.log(`   Tip: ${invoice.typeCode}`);
    console.log(`   Tarih: ${invoice.issueDatetime.toISOString()}`);
    console.log(`   Gönderen: ${invoice.senderName}`);
    console.log(`   Alıcı: ${invoice.receiverName}`);
    console.log(`   Ödenecek: ${invoice.payableAmount} ${invoice.currencyCode}`);
    console.log(`   Satır Sayısı: ${invoice.lines.length}`);
    
    console.log();
    console.log('✅ Test başarılı!');
    
  } catch (error) {
    console.error('❌ Hata:', error);
  }
}

main();
