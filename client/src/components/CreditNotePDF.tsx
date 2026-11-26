import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';
import { formatDateDMY } from '../utils/date';

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#333',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1e1b4b',
  },
  cnBadge: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#b91c1c',
  },
  refBox: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    padding: 8,
    borderRadius: 4,
    marginBottom: 15,
  },
  refTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#991b1b',
    marginBottom: 2,
  },
  refText: {
    fontSize: 9,
    color: '#7f1d1d',
  },
  section: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontWeight: 'bold',
    fontSize: 10,
    marginBottom: 3,
    color: '#111827',
  },
  table: {
    display: 'flex',
    flexDirection: 'column',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#d1d5db',
    marginBottom: 20,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tableColHeader: {
    width: '25%',
    padding: 6,
    backgroundColor: '#f3f4f6',
    fontWeight: 'bold',
    fontSize: 9,
  },
  tableColDesc: {
    width: '45%',
    padding: 6,
    fontSize: 9,
  },
  tableCol: {
    width: '18%',
    padding: 6,
    fontSize: 9,
    textAlign: 'right',
  },
  tableColHeaderRight: {
    width: '18%',
    padding: 6,
    backgroundColor: '#f3f4f6',
    fontWeight: 'bold',
    fontSize: 9,
    textAlign: 'right',
  },
  tableColHeaderDesc: {
    width: '45%',
    padding: 6,
    backgroundColor: '#f3f4f6',
    fontWeight: 'bold',
    fontSize: 9,
  },
  totalsBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
  },
  signatureBox: {
    marginTop: 35,
    textAlign: 'right',
    alignItems: 'flex-end',
  },
});

export const CreditNotePDF = ({ creditNoteData }: { creditNoteData: any }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ width: '60%' }}>
          <Text style={styles.title}>
            {creditNoteData.companyName || (creditNoteData.type === 'COMPANY' ? 'SHANKARA ONLINE SOLUTIONS LLP' : 'MANJUNATH NAIK S')}
          </Text>
          <Text style={{ fontSize: 9, color: '#4b5563', marginTop: 2 }}>{creditNoteData.companyAddress}</Text>
          {creditNoteData.companyGst && <Text style={{ fontSize: 9, color: '#4b5563', marginTop: 1 }}>GSTIN: {creditNoteData.companyGst}</Text>}
          {creditNoteData.companyPan && <Text style={{ fontSize: 9, color: '#4b5563' }}>PAN: {creditNoteData.companyPan}</Text>}
          {(creditNoteData.companyEmail || creditNoteData.companyPhone) && (
            <Text style={{ fontSize: 8.5, color: '#6b7280', marginTop: 1 }}>
              {[creditNoteData.companyEmail, creditNoteData.companyPhone].filter(Boolean).join(' | ')}
            </Text>
          )}
        </View>
        <View style={{ width: '38%', textAlign: 'right' }}>
          <Text style={styles.cnBadge}>CREDIT NOTE</Text>
          <Text style={{ fontSize: 9, fontWeight: 'bold', marginTop: 3 }}>
            CN #: {creditNoteData.creditNoteNumber}
          </Text>
          <Text style={{ fontSize: 9, color: '#4b5563' }}>Date: {formatDateDMY(creditNoteData.date)}</Text>
        </View>
      </View>

      {/* Invoice Reference Callout */}
      <View style={styles.refBox}>
        <Text style={styles.refTitle}>ORIGINAL INVOICE REFERENCE (Sec 34 CGST Act):</Text>
        <Text style={styles.refText}>
          Against Invoice #: <Text style={{ fontWeight: 'bold' }}>{creditNoteData.originalInvoiceNumber}</Text>  |  
          Invoice Date: <Text style={{ fontWeight: 'bold' }}>{formatDateDMY(creditNoteData.originalInvoiceDate)}</Text>
        </Text>
        {creditNoteData.reason && (
          <Text style={[styles.refText, { marginTop: 2 }]}>
            Reason: <Text style={{ fontWeight: 'bold' }}>{creditNoteData.reason}</Text>
          </Text>
        )}
      </View>

      {/* Bill To */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>CREDITED TO (BUYER):</Text>
        <Text style={{ fontSize: 10, fontWeight: 'bold' }}>{creditNoteData.clientName}</Text>
        <Text style={{ fontSize: 9, color: '#4b5563', marginTop: 1 }}>{creditNoteData.clientAddress}</Text>
        {creditNoteData.clientGst && (
          <Text style={{ fontSize: 9, fontWeight: 'bold', marginTop: 2 }}>GSTIN: {creditNoteData.clientGst}</Text>
        )}
      </View>

      {/* Items Table */}
      <View style={styles.table}>
        <View style={styles.tableRow}>
          <Text style={styles.tableColHeaderDesc}>Credit Description / Service Adjustment</Text>
          <Text style={styles.tableColHeaderRight}>Units</Text>
          <Text style={styles.tableColHeaderRight}>Rate (Rs.)</Text>
          <Text style={styles.tableColHeaderRight}>Credit Amount (Rs.)</Text>
        </View>
        {creditNoteData.items.map((item: any, i: number) => (
          <View style={styles.tableRow} key={i}>
            <Text style={styles.tableColDesc}>{item.description}</Text>
            <Text style={styles.tableCol}>{item.units}</Text>
            <Text style={styles.tableCol}>{item.rate.toLocaleString()}</Text>
            <Text style={[styles.tableCol, { fontWeight: 'bold' }]}>{item.amount.toLocaleString()}</Text>
          </View>
        ))}
      </View>

      {/* Summary / Totals */}
      <View style={styles.totalsBox}>
        <View style={{ width: '50%' }}>
          <Text style={{ fontSize: 9, fontWeight: 'bold', color: '#374151' }}>TERMS & NOTES:</Text>
          <Text style={{ fontSize: 8.5, color: '#6b7280', marginTop: 2 }}>
            {creditNoteData.notes || 'This credit note reduces the outstanding receivable against the referenced invoice.'}
          </Text>
        </View>

        <View style={{ width: '40%' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 }}>
            <Text style={{ fontSize: 9 }}>Subtotal Credit:</Text>
            <Text style={{ fontSize: 9 }}>Rs. {creditNoteData.subTotal.toLocaleString()}</Text>
          </View>

          {creditNoteData.type === 'COMPANY' && (
            <>
              {creditNoteData.isInterState || creditNoteData.igst > 0 ? (
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 }}>
                  <Text style={{ fontSize: 9 }}>IGST (18%):</Text>
                  <Text style={{ fontSize: 9 }}>Rs. {(creditNoteData.igst || 0).toLocaleString()}</Text>
                </View>
              ) : (
                <>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 }}>
                    <Text style={{ fontSize: 9 }}>CGST (9%):</Text>
                    <Text style={{ fontSize: 9 }}>Rs. {(creditNoteData.cgst || 0).toLocaleString()}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 }}>
                    <Text style={{ fontSize: 9 }}>SGST (9%):</Text>
                    <Text style={{ fontSize: 9 }}>Rs. {(creditNoteData.sgst || 0).toLocaleString()}</Text>
                  </View>
                </>
              )}
            </>
          )}

          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              borderTopWidth: 1,
              borderTopColor: '#d1d5db',
              paddingTop: 4,
              marginTop: 4,
            }}
          >
            <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#b91c1c' }}>TOTAL CREDIT:</Text>
            <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#b91c1c' }}>
              Rs. {creditNoteData.total.toLocaleString()}
            </Text>
          </View>
        </View>
      </View>

      {/* Signature */}
      <View style={styles.signatureBox}>
        <Text style={{ fontSize: 8.5, color: '#6b7280' }}>For {creditNoteData.companyName || (creditNoteData.type === 'COMPANY' ? 'SHANKARA ONLINE SOLUTIONS LLP' : 'MANJUNATH NAIK S')}</Text>
        {creditNoteData.signatory?.signatureImage ? (
          <Image
            src={creditNoteData.signatory.signatureImage}
            style={{ width: 110, height: 40, objectFit: 'contain', marginTop: 6, marginBottom: 2 }}
          />
        ) : (
          <View style={{ height: 35 }} />
        )}
        <Text style={{ fontSize: 10, fontWeight: 'bold' }}>
          {creditNoteData.signatory?.name || 'Manjunath Naik S'}
        </Text>
        {creditNoteData.signatory?.designation && (
          <Text style={{ fontSize: 8.5, color: '#6b7280' }}>{creditNoteData.signatory.designation}</Text>
        )}
      </View>
    </Page>
  </Document>
);
export default CreditNotePDF;
