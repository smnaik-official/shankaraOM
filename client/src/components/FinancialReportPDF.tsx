import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { formatDateDMY } from '../utils/date';

const styles = StyleSheet.create({
  page: {
    padding: 28,
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
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1e1b4b',
  },
  companySub: {
    fontSize: 8,
    color: '#6b7280',
    marginTop: 2,
  },
  reportTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#4f46e5',
    textAlign: 'right',
  },
  reportMeta: {
    fontSize: 8,
    color: '#4b5563',
    textAlign: 'right',
    marginTop: 2,
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
    fontSize: 7,
    color: '#6b7280',
    fontWeight: 'bold',
  },
  kpiValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 2,
  },
  kpiSub: {
    fontSize: 7,
    color: '#4b5563',
    marginTop: 1.5,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1e1b4b',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingBottom: 3,
    marginBottom: 5,
    marginTop: 6,
  },
  table: {
    display: 'flex',
    flexDirection: 'column',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 3,
    marginBottom: 8,
  },
  tableRowHeader: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderBottomWidth: 1,
    borderBottomColor: '#d1d5db',
    paddingVertical: 4.5,
    paddingHorizontal: 6,
  },
  tableHeaderCell: {
    fontWeight: 'bold',
    fontSize: 8,
    color: '#374151',
  },
  tableHeaderCellRight: {
    fontWeight: 'bold',
    fontSize: 8,
    color: '#374151',
    textAlign: 'right',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    paddingVertical: 3.5,
    paddingHorizontal: 6,
  },
  colMonth: { width: '22%' },
  colIncome: { width: '18%', textAlign: 'right' },
  colExpense: { width: '18%', textAlign: 'right' },
  colNet: { width: '18%', textAlign: 'right' },
  colMargin: { width: '12%', textAlign: 'right' },
  colGrowth: { width: '12%', textAlign: 'right' },
  footer: {
    position: 'absolute',
    bottom: 18,
    left: 28,
    right: 28,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 5,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 7.5,
    color: '#9ca3af',
  },
});

export interface FinancialReportPDFProps {
  displayData: any[];
  aggregates: {
    totalIncome: number;
    totalExpenses: number;
    totalNetProfit: number;
    overallMargin: number;
    avgMonthlyIncome: number;
    avgMonthlyExpense: number;
    overallEfficiency: number;
    costBreakdown: { name: string; value: number; percent: string }[];
  };
  quarterlyData: { quarter: string; income: number; expenses: number; netProfit: number }[];
  rangeDescription: string;
  timeRange: string;
  companyProfile?: any;
}

export const FinancialReportPDF = ({
  displayData,
  aggregates,
  quarterlyData,
  rangeDescription,
  companyProfile,
}: FinancialReportPDFProps) => {
  const companyName = companyProfile?.legalName || 'Shankara Online Solutions LLP';
  const companyAddress = companyProfile?.address || 'Bangalore, Karnataka, India';
  const currentDate = formatDateDMY(new Date());

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={{ width: '55%' }}>
            <Text style={styles.companyName}>{companyName}</Text>
            <Text style={styles.companySub}>{companyAddress}</Text>
            {companyProfile?.gstin && (
              <Text style={styles.companySub}>GSTIN: {companyProfile.gstin}</Text>
            )}
          </View>
          <View style={{ width: '45%' }}>
            <Text style={styles.reportTitle}>FINANCIAL & BUSINESS ANALYSIS</Text>
            <Text style={styles.reportMeta}>Reporting Period: {rangeDescription}</Text>
            <Text style={styles.reportMeta}>Generated on: {currentDate}</Text>
          </View>
        </View>

        {/* Executive KPI Grid */}
        <View style={styles.kpiGrid}>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>GROSS REVENUE</Text>
            <Text style={[styles.kpiValue, { color: '#047857' }]}>
              Rs. {aggregates.totalIncome?.toLocaleString() || '0'}
            </Text>
            <Text style={styles.kpiSub}>Avg: Rs. {aggregates.avgMonthlyIncome?.toLocaleString() || '0'}/mo</Text>
          </View>

          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>OPERATING EXPENSES</Text>
            <Text style={[styles.kpiValue, { color: '#b91c1c' }]}>
              Rs. {aggregates.totalExpenses?.toLocaleString() || '0'}
            </Text>
            <Text style={styles.kpiSub}>Avg: Rs. {aggregates.avgMonthlyExpense?.toLocaleString() || '0'}/mo</Text>
          </View>

          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>NET PROFIT</Text>
            <Text style={[styles.kpiValue, { color: '#4338ca' }]}>
              Rs. {aggregates.totalNetProfit?.toLocaleString() || '0'}
            </Text>
            <Text style={styles.kpiSub}>Margin: {aggregates.overallMargin}%</Text>
          </View>

          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>EXPENSE RATIO</Text>
            <Text style={styles.kpiValue}>{aggregates.overallEfficiency}%</Text>
            <Text style={styles.kpiSub}>Costs / Income</Text>
          </View>
        </View>

        {/* Section 1: Monthly Financial Performance */}
        <Text style={styles.sectionTitle}>1. Monthly Revenue, Expense & Profit Breakdown</Text>
        <View style={styles.table}>
          <View style={styles.tableRowHeader}>
            <Text style={[styles.colMonth, styles.tableHeaderCell]}>Month</Text>
            <Text style={[styles.colIncome, styles.tableHeaderCellRight]}>Revenue (Rs.)</Text>
            <Text style={[styles.colExpense, styles.tableHeaderCellRight]}>Expenses (Rs.)</Text>
            <Text style={[styles.colNet, styles.tableHeaderCellRight]}>Net Profit (Rs.)</Text>
            <Text style={[styles.colMargin, styles.tableHeaderCellRight]}>Margin (%)</Text>
            <Text style={[styles.colGrowth, styles.tableHeaderCellRight]}>MoM Growth</Text>
          </View>
          {displayData.map((d, i) => (
            <View
              key={i}
              style={[
                styles.tableRow,
                i % 2 === 1 ? { backgroundColor: '#fcfcfd' } : {},
              ]}
            >
              <Text style={styles.colMonth}>{d.fullMonth}</Text>
              <Text style={styles.colIncome}>{d.income?.toLocaleString() || '0'}</Text>
              <Text style={styles.colExpense}>{d.expenses?.toLocaleString() || '0'}</Text>
              <Text style={[styles.colNet, { color: d.netProfit >= 0 ? '#111827' : '#b91c1c', fontWeight: 'bold' }]}>
                {d.netProfit?.toLocaleString() || '0'}
              </Text>
              <Text style={styles.colMargin}>{d.profitMargin}%</Text>
              <Text style={styles.colGrowth}>
                {d.momIncomeGrowth !== null && d.momIncomeGrowth !== undefined ? `${d.momIncomeGrowth}%` : '-'}
              </Text>
            </View>
          ))}
          {/* Table Totals Row */}
          <View
            style={[
              styles.tableRow,
              { backgroundColor: '#eef2ff', borderTopWidth: 1, borderTopColor: '#c7d2fe' },
            ]}
          >
            <Text style={[styles.colMonth, { fontWeight: 'bold' }]}>Period Total</Text>
            <Text style={[styles.colIncome, { fontWeight: 'bold', color: '#047857' }]}>
              {aggregates.totalIncome?.toLocaleString() || '0'}
            </Text>
            <Text style={[styles.colExpense, { fontWeight: 'bold', color: '#b91c1c' }]}>
              {aggregates.totalExpenses?.toLocaleString() || '0'}
            </Text>
            <Text style={[styles.colNet, { fontWeight: 'bold', color: '#4338ca' }]}>
              {aggregates.totalNetProfit?.toLocaleString() || '0'}
            </Text>
            <Text style={[styles.colMargin, { fontWeight: 'bold' }]}>{aggregates.overallMargin}%</Text>
            <Text style={styles.colGrowth}>-</Text>
          </View>
        </View>

        {/* Section 2: Expense Allocation & Quarterly Overview */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          {/* Expense Categories */}
          <View style={{ width: '48.5%' }}>
            <Text style={styles.sectionTitle}>2. Operating Cost Allocation</Text>
            <View style={styles.table}>
              <View style={styles.tableRowHeader}>
                <Text style={[{ width: '50%' }, styles.tableHeaderCell]}>Category</Text>
                <Text style={[{ width: '30%' }, styles.tableHeaderCellRight]}>Amount (Rs.)</Text>
                <Text style={[{ width: '20%' }, styles.tableHeaderCellRight]}>Share</Text>
              </View>
              {aggregates.costBreakdown.map((c, i) => (
                <View key={i} style={styles.tableRow}>
                  <Text style={{ width: '50%' }}>{c.name}</Text>
                  <Text style={{ width: '30%', textAlign: 'right' }}>{c.value?.toLocaleString() || '0'}</Text>
                  <Text style={{ width: '20%', textAlign: 'right' }}>{c.percent}%</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Quarterly Summary */}
          <View style={{ width: '48.5%' }}>
            <Text style={styles.sectionTitle}>3. Quarterly Aggregation</Text>
            <View style={styles.table}>
              <View style={styles.tableRowHeader}>
                <Text style={[{ width: '30%' }, styles.tableHeaderCell]}>Quarter</Text>
                <Text style={[{ width: '35%' }, styles.tableHeaderCellRight]}>Revenue (Rs.)</Text>
                <Text style={[{ width: '35%' }, styles.tableHeaderCellRight]}>Net Profit (Rs.)</Text>
              </View>
              {quarterlyData.map((q, i) => (
                <View key={i} style={styles.tableRow}>
                  <Text style={{ width: '30%' }}>{q.quarter}</Text>
                  <Text style={{ width: '35%', textAlign: 'right' }}>{q.income?.toLocaleString() || '0'}</Text>
                  <Text style={{ width: '35%', textAlign: 'right', fontWeight: 'bold', color: '#4338ca' }}>
                    {q.netProfit?.toLocaleString() || '0'}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Confidential • Generated from Business Admin Panel • {companyName}</Text>
          <Text>Page 1 of 1</Text>
        </View>
      </Page>
    </Document>
  );
};

export default FinancialReportPDF;
