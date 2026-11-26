# PDF Invoice Generation Guide

For generating the exact invoices provided in the Excel examples, the recommended approach is using `@react-pdf/renderer`. It allows you to build PDFs using React primitives.

## 1. Install Dependencies
```bash
npm install @react-pdf/renderer qrcode.react
```
*(Note: For the QR code in the PDF, you usually need to generate a data URI from the QR code and pass it to the PDF `<Image />` component.)*

## 2. Sample Invoice PDF Component

```tsx
import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font, Image } from '@react-pdf/renderer';

// Register standard fonts matching the theme if needed, or use defaults
Font.register({
  family: 'Open Sans',
  src: 'https://fonts.gstatic.com/s/opensans/v34/memvYaGs126MiZpBA-UvWbX2vVnXBbObj2OVTS-mu0SC55I.woff2'
});

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Helvetica', // Fallback to standard PDF fonts
    fontSize: 10,
    color: '#333'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 10,
  },
  table: {
    display: 'flex',
    flexDirection: 'column',
    width: 'auto',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#bfbfbf',
    marginBottom: 20
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#bfbfbf',
  },
  tableColHeader: {
    width: '20%',
    padding: 5,
    backgroundColor: '#f0f0f0',
    fontWeight: 'bold'
  },
  tableCol: {
    width: '20%',
    padding: 5,
  }
});

export const InvoicePDF = ({ invoiceData, qrCodeDataUri }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header section */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{invoiceData.type === 'COMPANY' ? 'SHANKARA ONLINE SOLUTIONS LLP' : 'MANJUNATH NAIK S'}</Text>
          <Text>{invoiceData.companyAddress}</Text>
        </View>
        <View>
          <Text style={{ fontSize: 16, fontWeight: 'bold' }}>INVOICE</Text>
          <Text>Invoice #: {invoiceData.invoiceNumber}</Text>
          <Text>Date: {invoiceData.date}</Text>
        </View>
      </View>

      {/* Bill To */}
      <View style={styles.section}>
        <Text style={{ fontWeight: 'bold' }}>BILL TO:</Text>
        <Text>{invoiceData.clientName}</Text>
        <Text>{invoiceData.clientAddress}</Text>
        {invoiceData.clientGst && <Text>GST: {invoiceData.clientGst}</Text>}
      </View>

      {/* Items Table */}
      <View style={styles.table}>
        <View style={styles.tableRow}>
          <Text style={styles.tableColHeader}>Description</Text>
          <Text style={styles.tableColHeader}>Units</Text>
          <Text style={styles.tableColHeader}>Rate</Text>
          <Text style={styles.tableColHeader}>Amount</Text>
        </View>
        {invoiceData.items.map((item, i) => (
          <View style={styles.tableRow} key={i}>
            <Text style={styles.tableCol}>{item.description}</Text>
            <Text style={styles.tableCol}>{item.units}</Text>
            <Text style={styles.tableCol}>{item.rate}</Text>
            <Text style={styles.tableCol}>{item.amount}</Text>
          </View>
        ))}
      </View>

      {/* Totals & Payment Details */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <View style={{ width: '50%' }}>
          <Text style={{ fontWeight: 'bold' }}>PAYMENT DETAILS:</Text>
          <Text>A/c Name: {invoiceData.paymentDetails.accountName}</Text>
          <Text>A/c No: {invoiceData.paymentDetails.accountNo}</Text>
          <Text>IFSC: {invoiceData.paymentDetails.ifsc}</Text>
          <Text>UPI: {invoiceData.paymentDetails.upi}</Text>
          {/* Inject generated QR Code */}
          {qrCodeDataUri && <Image src={qrCodeDataUri} style={{ width: 100, height: 100, marginTop: 10 }} />}
        </View>
        <View style={{ width: '40%' }}>
          <Text>Sub Total: {invoiceData.subTotal}</Text>
          {invoiceData.type === 'COMPANY' && (
            <>
              <Text>CGST: {invoiceData.cgst}</Text>
              <Text>SGST: {invoiceData.sgst}</Text>
              <Text>IGST: {invoiceData.igst}</Text>
            </>
          )}
          <Text style={{ fontWeight: 'bold', marginTop: 5 }}>TOTAL: {invoiceData.total}</Text>
        </View>
      </View>

      {/* Footer */}
      <View style={{ marginTop: 50, textAlign: 'right' }}>
        <Text>Signature</Text>
        <Text>{invoiceData.type === 'COMPANY' ? 'Manjunath Naik S (Founder, CEO)' : 'Manjunath Naik S'}</Text>
      </View>
    </Page>
  </Document>
);
```

## Integrating in your React App

```tsx
import { PDFDownloadLink } from '@react-pdf/renderer';
import { InvoicePDF } from './InvoicePDF';

const DownloadInvoiceButton = ({ invoiceData, qrCodeDataUri }) => (
  <PDFDownloadLink 
    document={<InvoicePDF invoiceData={invoiceData} qrCodeDataUri={qrCodeDataUri} />} 
    fileName={`invoice_${invoiceData.invoiceNumber}.pdf`}
  >
    {({ blob, url, loading, error }) =>
      loading ? 'Generating PDF...' : 'Download Invoice'
    }
  </PDFDownloadLink>
);
```

This ensures your invoices perfectly match the CSV structures you supplied, handling dynamic toggling between your LLP and Personal accounts.
