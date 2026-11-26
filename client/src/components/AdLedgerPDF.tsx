import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { formatDateDMY } from '../utils/date';
import { AdLedgerEntry } from './AdLedger';

const styles = StyleSheet.create({
  page: {
    padding: 28,
    paddingBottom: 36,
    fontFamily: 'Helvetica',
    fontSize: 8.5,
    color: '#1f2937',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1.5,
    borderBottomColor: '#4f46e5',
    paddingBottom: 10,
    marginBottom: 12,
  },
  companyName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e1b4b',
  },
  companySub: {
    fontSize: 7.5,
    color: '#6b7280',
    marginTop: 2,
    lineHeight: 1.3,
  },
  reportTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#4f46e5',
    textAlign: 'right',
  },
  reportMeta: {
    fontSize: 7.5,
    color: '#4b5563',
    textAlign: 'right',
    marginTop: 2,
  },
  reportBadge: {
    backgroundColor: '#eef2ff',
    color: '#4338ca',
    fontSize: 7,
    fontWeight: 'bold',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 3,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  kpiGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  kpiCard: {
    width: '23.5%',
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 4,
    padding: 7,
  },
  kpiLabel: {
    fontSize: 6.5,
    color: '#6b7280',
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  kpiValue: {
    fontSize: 11,
    fontWeight: 'bold',
    marginTop: 2,
  },
  kpiSub: {
    fontSize: 6.5,
    color: '#6b7280',
    marginTop: 1.5,
  },
  sectionTitle: {
    fontSize: 9.5,
    fontWeight: 'bold',
    color: '#1e1b4b',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingBottom: 3,
    marginBottom: 6,
  },
  table: {
    display: 'flex',
    flexDirection: 'column',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 3,
    marginBottom: 10,
  },
  tableRowHeader: {
    flexDirection: 'row',
    backgroundColor: '#4f46e5',
    paddingVertical: 5,
    paddingHorizontal: 6,
    alignItems: 'center',
  },
  tableHeaderCell: {
    fontWeight: 'bold',
    fontSize: 7.5,
    color: '#ffffff',
  },
  tableHeaderCellRight: {
    fontWeight: 'bold',
    fontSize: 7.5,
    color: '#ffffff',
    textAlign: 'right',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    paddingVertical: 4.5,
    paddingHorizontal: 6,
    alignItems: 'center',
    minHeight: 20,
  },
  tableRowEven: {
    backgroundColor: '#ffffff',
  },
  tableRowOdd: {
    backgroundColor: '#fafbfc',
  },
  colDate: { width: '15%', fontSize: 7.5 },
  colTxn: { width: '18%', fontSize: 7.5, color: '#4b5563' },
  colClient: { width: '27%', fontSize: 7.5, fontWeight: 'bold', color: '#111827' },
  colPlatform: { width: '17%', fontSize: 7.5, color: '#4b5563' },
  colType: { width: '10%' },
  colAmount: { width: '13%', textAlign: 'right', fontSize: 7.5, fontWeight: 'bold' },
  typeBadgeSpend: {
    backgroundColor: '#fef3c7',
    color: '#92400e',
    paddingVertical: 1.5,
    paddingHorizontal: 4,
    borderRadius: 2,
    fontSize: 6.5,
    textAlign: 'center',
    width: 36,
    fontWeight: 'bold',
  },
  typeBadgeDeposit: {
    backgroundColor: '#d1fae5',
    color: '#065f46',
    paddingVertical: 1.5,
    paddingHorizontal: 4,
    borderRadius: 2,
    fontSize: 6.5,
    textAlign: 'center',
    width: 36,
    fontWeight: 'bold',
  },
  tableRowTotal: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderTopWidth: 1.5,
    borderTopColor: '#cbd5e1',
    paddingVertical: 6,
    paddingHorizontal: 6,
    alignItems: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 14,
    left: 28,
    right: 28,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 5,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 7,
    color: '#9ca3af',
  },
});

export interface AdLedgerPDFProps {
  entries: AdLedgerEntry[];
  clientFilter: string;
  timeRangeDescription: string;
  remainingBalance: number;
  periodDeposit: number;
  periodSpend: number;
  companyProfile?: any;
}

export const AdLedgerPDF = ({
  entries,
  clientFilter,
  timeRangeDescription,
  remainingBalance,
  periodDeposit,
  periodSpend,
  companyProfile,
}: AdLedgerPDFProps) => {
  const companyName = companyProfile?.legalName || 'SHANKARA ONLINE SOLUTIONS LLP';
  const companyAddress =
    companyProfile?.address ||
    '#33, 2nd Cross, Shankarappa Layout, H.V Halli, Rajarajeshwari Nagar, Bengaluru - 560098';
  const currentDate = formatDateDMY(new Date());

  const periodNetFlow = periodDeposit - periodSpend;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={{ width: '56%' }}>
            <Text style={styles.companyName}>{companyName}</Text>
            <Text style={styles.companySub}>{companyAddress}</Text>
            {companyProfile?.gstin && (
              <Text style={styles.companySub}>GSTIN: {companyProfile.gstin}</Text>
            )}
            {companyProfile?.phone && (
              <Text style={styles.companySub}>Phone: {companyProfile.phone} | Email: {companyProfile.email}</Text>
            )}
          </View>
          <View style={{ width: '44%' }}>
            <Text style={styles.reportTitle}>CLIENT AD SPEND LEDGER</Text>
            <Text style={styles.reportMeta}>Reporting Period: {timeRangeDescription}</Text>
            <Text style={styles.reportMeta}>Generated on: {currentDate}</Text>
            <Text style={styles.reportBadge}>
              Client: {clientFilter === 'All' ? 'All Clients' : clientFilter}
            </Text>
          </View>
        </View>

        {/* Executive KPI Summary Cards */}
        <View style={styles.kpiGrid}>
          {/* Card 1: Account Balance */}
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>REMAINING BALANCE</Text>
            <Text
              style={[
                styles.kpiValue,
                { color: remainingBalance >= 0 ? '#047857' : '#b91c1c' },
              ]}
            >
              Rs. {remainingBalance.toLocaleString('en-IN')}
            </Text>
            <Text style={styles.kpiSub}>
              {clientFilter === 'All' ? 'Overall Account Balance' : 'Client Live Balance'}
            </Text>
          </View>

          {/* Card 2: Period Deposits */}
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>PERIOD DEPOSITS</Text>
            <Text style={[styles.kpiValue, { color: '#047857' }]}>
              Rs. {periodDeposit.toLocaleString('en-IN')}
            </Text>
            <Text style={styles.kpiSub}>Deposited in timeframe</Text>
          </View>

          {/* Card 3: Period Spends */}
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>PERIOD AD SPEND</Text>
            <Text style={[styles.kpiValue, { color: '#b45309' }]}>
              Rs. {periodSpend.toLocaleString('en-IN')}
            </Text>
            <Text style={styles.kpiSub}>Spent across platforms</Text>
          </View>

          {/* Card 4: Net Flow in Period */}
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>PERIOD NET FLOW</Text>
            <Text
              style={[
                styles.kpiValue,
                { color: periodNetFlow >= 0 ? '#4338ca' : '#dc2626' },
              ]}
            >
              {periodNetFlow >= 0 ? '+' : ''}Rs. {periodNetFlow.toLocaleString('en-IN')}
            </Text>
            <Text style={styles.kpiSub}>Deposits minus Spends</Text>
          </View>
        </View>

        {/* Section Heading */}
        <Text style={styles.sectionTitle}>
          Transaction Ledger Records ({entries.length} {entries.length === 1 ? 'entry' : 'entries'})
        </Text>

        {/* Table of Entries */}
        <View style={styles.table}>
          <View style={styles.tableRowHeader}>
            <Text style={[styles.colDate, styles.tableHeaderCell]}>Date</Text>
            <Text style={[styles.colTxn, styles.tableHeaderCell]}>Transaction ID</Text>
            <Text style={[styles.colClient, styles.tableHeaderCell]}>Client Name</Text>
            <Text style={[styles.colPlatform, styles.tableHeaderCell]}>Platform / Method</Text>
            <Text style={[styles.colType, styles.tableHeaderCell]}>Type</Text>
            <Text style={[styles.colAmount, styles.tableHeaderCellRight]}>Amount (INR)</Text>
          </View>

          {entries.length === 0 ? (
            <View style={[styles.tableRow, { justifyContent: 'center', paddingVertical: 12 }]}>
              <Text style={{ color: '#9ca3af', fontSize: 8 }}>
                No ad ledger entries found for the selected time range and filters.
              </Text>
            </View>
          ) : (
            entries.map((item, index) => {
              const isDeposit = item.type === 'Deposit';
              return (
                <View
                  key={item.id || index}
                  style={[
                    styles.tableRow,
                    index % 2 === 1 ? styles.tableRowOdd : styles.tableRowEven,
                  ]}
                >
                  <Text style={styles.colDate}>{formatDateDMY(item.date)}</Text>
                  <Text style={styles.colTxn}>{item.transactionId}</Text>
                  <Text style={styles.colClient}>{item.client}</Text>
                  <Text style={styles.colPlatform}>{item.platform}</Text>
                  <View style={styles.colType}>
                    <Text
                      style={
                        isDeposit ? styles.typeBadgeDeposit : styles.typeBadgeSpend
                      }
                    >
                      {item.type}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.colAmount,
                      { color: isDeposit ? '#047857' : '#b45309' },
                    ]}
                  >
                    {isDeposit ? '+' : '-'}
                    {item.amount.toLocaleString('en-IN')}
                  </Text>
                </View>
              );
            })
          )}

          {/* Summary / Total Row */}
          {entries.length > 0 && (
            <View style={styles.tableRowTotal}>
              <Text style={{ width: '33%', fontSize: 7.5, fontWeight: 'bold', color: '#1e1b4b' }}>
                Summary for {entries.length} {entries.length === 1 ? 'record' : 'records'}
              </Text>
              <Text style={{ width: '37%', fontSize: 7, color: '#64748b' }}>
                Deposits: Rs. {periodDeposit.toLocaleString('en-IN')} | Spends: Rs. {periodSpend.toLocaleString('en-IN')}
              </Text>
              <Text style={{ width: '30%', textAlign: 'right', fontSize: 8, fontWeight: 'bold', color: '#1e1b4b' }}>
                Net: {periodNetFlow >= 0 ? '+' : ''}Rs. {periodNetFlow.toLocaleString('en-IN')}
              </Text>
            </View>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text>Confidential • Generated from Shankara Admin Panel • {companyName}</Text>
          <Text
            render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  );
};

export default AdLedgerPDF;
