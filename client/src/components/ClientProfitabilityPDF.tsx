import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { ClientProfitabilityRecord, ProfitabilityPeriod, ProfitabilitySummary } from '../data/clientProfitability';
import { formatDateDMY } from '../utils/date';

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
  badge: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 3,
    fontSize: 7,
    fontWeight: 'bold',
    alignSelf: 'flex-start',
    marginTop: 3,
  },
  badgeProfitable: {
    backgroundColor: '#ecfdf5',
    color: '#065f46',
  },
  badgeLoss: {
    backgroundColor: '#fef2f2',
    color: '#991b1b',
  },
  sectionCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 4,
    padding: 9,
    marginBottom: 10,
    borderWidth: 0.5,
    borderColor: '#e2e8f0',
  },
  sectionTitle: {
    fontSize: 9.5,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 6,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
  },
  kpiGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  kpiBox: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderWidth: 0.5,
    borderColor: '#e2e8f0',
    borderRadius: 4,
    padding: 7,
  },
  kpiLabel: {
    fontSize: 7,
    color: '#64748b',
    textTransform: 'uppercase',
    fontWeight: 'bold',
  },
  kpiValue: {
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 2,
  },
  kpiSub: {
    fontSize: 6.5,
    color: '#64748b',
    marginTop: 2,
  },
  table: {
    width: '100%',
    marginBottom: 10,
    borderWidth: 0.5,
    borderColor: '#e2e8f0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderBottomWidth: 0.5,
    borderBottomColor: '#cbd5e1',
    paddingVertical: 5,
    paddingHorizontal: 6,
  },
  tableHeaderCell: {
    fontSize: 7,
    fontWeight: 'bold',
    color: '#334155',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: '#f1f5f9',
    paddingVertical: 4.5,
    paddingHorizontal: 6,
  },
  tableCell: {
    fontSize: 7.5,
    color: '#1e293b',
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 28,
    right: 28,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 0.5,
    borderTopColor: '#e2e8f0',
    paddingTop: 6,
  },
  footerText: {
    fontSize: 6.5,
    color: '#94a3b8',
  },
});

interface Props {
  record: ClientProfitabilityRecord;
  period: ProfitabilityPeriod;
  companyInfo?: {
    legalName?: string;
    tradeName?: string;
    address?: string;
    gstin?: string;
    pan?: string;
  };
}

export const ClientProfitabilityPDF: React.FC<Props> = ({
  record,
  period,
  companyInfo,
}) => {
  const companyName = companyInfo?.legalName || 'SHANKARA ONLINE SOLUTIONS LLP';
  const companyTrade = companyInfo?.tradeName || 'Shankara Solutions';
  const companyAddress = companyInfo?.address || 'No. 33, Gerupalya, Kumbalagodu, Bangalore, Karnataka - 560074';
  const companyGst = companyInfo?.gstin || '29ABICS5363G1ZY';

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.companyName}>{companyName}</Text>
            <Text style={styles.companySub}>{companyTrade} | GSTIN: {companyGst}</Text>
            <Text style={styles.companySub}>{companyAddress}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.reportTitle}>CLIENT PROFITABILITY REPORT</Text>
            <Text style={styles.reportMeta}>Analysis Period: {period.label}</Text>
            <Text style={styles.reportMeta}>Generated: {formatDateDMY(new Date().toISOString().slice(0, 10))}</Text>
            <View
              style={[
                styles.badge,
                record.isProfitable ? styles.badgeProfitable : styles.badgeLoss,
              ]}
            >
              <Text>
                {record.isProfitable ? 'PROFITABLE ACCOUNT' : 'LOSS-MAKING ACCOUNT'}
              </Text>
            </View>
          </View>
        </View>

        {/* Client Profile Card */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Client Account Information</Text>
          <View style={styles.rowBetween}>
            <Text style={{ fontSize: 8, color: '#475569' }}>
              Client Name: <Text style={{ fontWeight: 'bold', color: '#0f172a' }}>{record.clientName}</Text>
            </Text>
            <Text style={{ fontSize: 8, color: '#475569' }}>
              GSTIN: <Text style={{ fontWeight: 'bold' }}>{record.clientGstin || 'Unregistered / Non-GST'}</Text>
            </Text>
          </View>
          {record.clientAddress && (
            <Text style={{ fontSize: 7.5, color: '#64748b', marginTop: 2 }}>
              Address: {record.clientAddress}
            </Text>
          )}
          {(record.clientEmail || record.clientPhone) && (
            <Text style={{ fontSize: 7.5, color: '#64748b', marginTop: 1 }}>
              Contact: {[record.clientEmail, record.clientPhone].filter(Boolean).join(' | ')}
            </Text>
          )}
        </View>

        {/* 4 Executive KPI Cards */}
        <View style={styles.kpiGrid}>
          <View style={styles.kpiBox}>
            <Text style={styles.kpiLabel}>Net Revenue (Ex-GST)</Text>
            <Text style={[styles.kpiValue, { color: '#0284c7' }]}>
              ₹{record.netEarnedRevenue.toLocaleString()}
            </Text>
            <Text style={styles.kpiSub}>
              Cash: ₹{record.cashReceived.toLocaleString()} | Due: ₹{record.outstandingReceivables.toLocaleString()}
            </Text>
          </View>

          <View style={styles.kpiBox}>
            <Text style={styles.kpiLabel}>Total Direct Costs</Text>
            <Text style={[styles.kpiValue, { color: '#dc2626' }]}>
              ₹{record.totalDirectCosts.toLocaleString()}
            </Text>
            <Text style={styles.kpiSub}>
              Staff: ₹{record.allocatedEmployeeCost.toLocaleString()} | Direct: ₹{(record.totalDirectCosts - record.allocatedEmployeeCost).toLocaleString()}
            </Text>
          </View>

          <View style={styles.kpiBox}>
            <Text style={styles.kpiLabel}>Contribution Margin</Text>
            <Text style={[styles.kpiValue, { color: record.contribution >= 0 ? '#16a34a' : '#dc2626' }]}>
              {record.contributionMargin.toFixed(1)}%
            </Text>
            <Text style={styles.kpiSub}>
              Contribution: ₹{record.contribution.toLocaleString()}
            </Text>
          </View>

          <View style={styles.kpiBox}>
            <Text style={styles.kpiLabel}>Net Profit & Margin</Text>
            <Text style={[styles.kpiValue, { color: record.netProfit >= 0 ? '#16a34a' : '#dc2626' }]}>
              ₹{record.netProfit.toLocaleString()} ({record.netProfitMargin.toFixed(1)}%)
            </Text>
            <Text style={styles.kpiSub}>
              Overheads Share: ₹{record.allocatedOverheads.toLocaleString()}
            </Text>
          </View>
        </View>

        {/* P&L Statement Table */}
        <View style={{ marginBottom: 10 }}>
          <Text style={styles.sectionTitle}>Client Profit & Loss Statement (Ex-GST)</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, { flex: 3 }]}>Line Item / Cost Component</Text>
              <Text style={[styles.tableHeaderCell, { flex: 2, textAlign: 'right' }]}>Amount (INR)</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1.5, textAlign: 'right' }]}>% of Revenue</Text>
            </View>

            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, { flex: 3, fontWeight: 'bold' }]}>Gross Invoiced Revenue (Ex-GST)</Text>
              <Text style={[styles.tableCell, { flex: 2, textAlign: 'right', fontWeight: 'bold' }]}>₹{record.invoicedGrossRevenue.toLocaleString()}</Text>
              <Text style={[styles.tableCell, { flex: 1.5, textAlign: 'right' }]}>-</Text>
            </View>

            {record.creditNotesDeduction > 0 && (
              <View style={[styles.tableRow, { backgroundColor: '#fff1f2' }]}>
                <Text style={[styles.tableCell, { flex: 3, color: '#be123c' }]}>Less: Credit Notes & Adjustments</Text>
                <Text style={[styles.tableCell, { flex: 2, textAlign: 'right', color: '#be123c' }]}>-₹{record.creditNotesDeduction.toLocaleString()}</Text>
                <Text style={[styles.tableCell, { flex: 1.5, textAlign: 'right', color: '#be123c' }]}>
                  {record.invoicedGrossRevenue > 0 ? `-${((record.creditNotesDeduction / record.invoicedGrossRevenue) * 100).toFixed(1)}%` : '0%'}
                </Text>
              </View>
            )}

            <View style={[styles.tableRow, { backgroundColor: '#f0fdf4' }]}>
              <Text style={[styles.tableCell, { flex: 3, fontWeight: 'bold', color: '#166534' }]}>Net Earned Revenue</Text>
              <Text style={[styles.tableCell, { flex: 2, textAlign: 'right', fontWeight: 'bold', color: '#166534' }]}>₹{record.netEarnedRevenue.toLocaleString()}</Text>
              <Text style={[styles.tableCell, { flex: 1.5, textAlign: 'right', fontWeight: 'bold', color: '#166534' }]}>100.0%</Text>
            </View>

            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, { flex: 3, paddingLeft: 8 }]}>• Allocated Employee Costs</Text>
              <Text style={[styles.tableCell, { flex: 2, textAlign: 'right' }]}>₹{record.allocatedEmployeeCost.toLocaleString()}</Text>
              <Text style={[styles.tableCell, { flex: 1.5, textAlign: 'right' }]}>
                {record.netEarnedRevenue > 0 ? `${((record.allocatedEmployeeCost / record.netEarnedRevenue) * 100).toFixed(1)}%` : '0%'}
              </Text>
            </View>

            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, { flex: 3, paddingLeft: 8 }]}>• Freelancer & Outsourced Work</Text>
              <Text style={[styles.tableCell, { flex: 2, textAlign: 'right' }]}>₹{record.freelancerCost.toLocaleString()}</Text>
              <Text style={[styles.tableCell, { flex: 1.5, textAlign: 'right' }]}>
                {record.netEarnedRevenue > 0 ? `${((record.freelancerCost / record.netEarnedRevenue) * 100).toFixed(1)}%` : '0%'}
              </Text>
            </View>

            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, { flex: 3, paddingLeft: 8 }]}>• Client Software & Subscriptions</Text>
              <Text style={[styles.tableCell, { flex: 2, textAlign: 'right' }]}>₹{record.clientSoftwareCost.toLocaleString()}</Text>
              <Text style={[styles.tableCell, { flex: 1.5, textAlign: 'right' }]}>
                {record.netEarnedRevenue > 0 ? `${((record.clientSoftwareCost / record.netEarnedRevenue) * 100).toFixed(1)}%` : '0%'}
              </Text>
            </View>

            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, { flex: 3, paddingLeft: 8 }]}>• Travel, Ad Spend & Other Direct Expenses</Text>
              <Text style={[styles.tableCell, { flex: 2, textAlign: 'right' }]}>₹{record.otherDirectCosts.toLocaleString()}</Text>
              <Text style={[styles.tableCell, { flex: 1.5, textAlign: 'right' }]}>
                {record.netEarnedRevenue > 0 ? `${((record.otherDirectCosts / record.netEarnedRevenue) * 100).toFixed(1)}%` : '0%'}
              </Text>
            </View>

            <View style={[styles.tableRow, { backgroundColor: '#fef2f2' }]}>
              <Text style={[styles.tableCell, { flex: 3, fontWeight: 'bold', color: '#991b1b' }]}>Total Direct Client Costs</Text>
              <Text style={[styles.tableCell, { flex: 2, textAlign: 'right', fontWeight: 'bold', color: '#991b1b' }]}>₹{record.totalDirectCosts.toLocaleString()}</Text>
              <Text style={[styles.tableCell, { flex: 1.5, textAlign: 'right', fontWeight: 'bold', color: '#991b1b' }]}>
                {record.netEarnedRevenue > 0 ? `${((record.totalDirectCosts / record.netEarnedRevenue) * 100).toFixed(1)}%` : '0%'}
              </Text>
            </View>

            <View style={[styles.tableRow, { backgroundColor: '#eef2ff' }]}>
              <Text style={[styles.tableCell, { flex: 3, fontWeight: 'bold', color: '#3730a3' }]}>Client Contribution</Text>
              <Text style={[styles.tableCell, { flex: 2, textAlign: 'right', fontWeight: 'bold', color: '#3730a3' }]}>₹{record.contribution.toLocaleString()}</Text>
              <Text style={[styles.tableCell, { flex: 1.5, textAlign: 'right', fontWeight: 'bold', color: '#3730a3' }]}>{record.contributionMargin.toFixed(1)}%</Text>
            </View>

            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, { flex: 3, paddingLeft: 8 }]}>Less: Allocated Common Agency Overheads</Text>
              <Text style={[styles.tableCell, { flex: 2, textAlign: 'right' }]}>₹{record.allocatedOverheads.toLocaleString()}</Text>
              <Text style={[styles.tableCell, { flex: 1.5, textAlign: 'right' }]}>
                {record.netEarnedRevenue > 0 ? `${((record.allocatedOverheads / record.netEarnedRevenue) * 100).toFixed(1)}%` : '0%'}
              </Text>
            </View>

            <View style={[styles.tableRow, { backgroundColor: record.netProfit >= 0 ? '#dcfce7' : '#fee2e2' }]}>
              <Text style={[styles.tableCell, { flex: 3, fontWeight: 'bold', color: record.netProfit >= 0 ? '#166534' : '#991b1b' }]}>
                Net Client Profit (EBITDA Contribution)
              </Text>
              <Text style={[styles.tableCell, { flex: 2, textAlign: 'right', fontWeight: 'bold', color: record.netProfit >= 0 ? '#166534' : '#991b1b' }]}>
                ₹{record.netProfit.toLocaleString()}
              </Text>
              <Text style={[styles.tableCell, { flex: 1.5, textAlign: 'right', fontWeight: 'bold', color: record.netProfit >= 0 ? '#166534' : '#991b1b' }]}>
                {record.netProfitMargin.toFixed(1)}%
              </Text>
            </View>
          </View>
        </View>

        {/* Employee Allocation Breakdown */}
        {record.employeeAllocations.length > 0 && (
          <View style={{ marginBottom: 10 }}>
            <Text style={styles.sectionTitle}>Employee Cost Allocations (From Employee Cost Analysis)</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Employee Name</Text>
                <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Role / Designation</Text>
                <Text style={[styles.tableHeaderCell, { flex: 1.5, textAlign: 'right' }]}>Monthly Gross</Text>
                <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'right' }]}>Alloc. %</Text>
                <Text style={[styles.tableHeaderCell, { flex: 1.5, textAlign: 'right' }]}>Period Cost</Text>
              </View>
              {record.employeeAllocations.map((emp, idx) => (
                <View key={idx} style={styles.tableRow}>
                  <Text style={[styles.tableCell, { flex: 2, fontWeight: 'bold' }]}>{emp.employeeName}</Text>
                  <Text style={[styles.tableCell, { flex: 2, color: '#475569' }]}>{emp.role}</Text>
                  <Text style={[styles.tableCell, { flex: 1.5, textAlign: 'right' }]}>₹{emp.grossSalary.toLocaleString()}</Text>
                  <Text style={[styles.tableCell, { flex: 1, textAlign: 'right', fontWeight: 'bold', color: '#4f46e5' }]}>{emp.allocationPercentage}%</Text>
                  <Text style={[styles.tableCell, { flex: 1.5, textAlign: 'right', fontWeight: 'bold' }]}>₹{emp.periodCost.toLocaleString()}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Shankara Online Solutions Management Accounting • Strictly Confidential</Text>
          <Text style={styles.footerText}>Page 1 of 1</Text>
        </View>
      </Page>
    </Document>
  );
};

export interface RegisterPDFProps {
  records: ClientProfitabilityRecord[];
  summary: ProfitabilitySummary;
  period: ProfitabilityPeriod;
  companyInfo?: {
    legalName?: string;
    tradeName?: string;
    address?: string;
    gstin?: string;
    pan?: string;
  };
}

export const ClientProfitabilityRegisterPDF: React.FC<RegisterPDFProps> = ({
  records,
  summary,
  period,
  companyInfo,
}) => {
  const companyName = companyInfo?.legalName || 'SHANKARA ONLINE SOLUTIONS LLP';
  const companyTrade = companyInfo?.tradeName || 'Shankara Solutions';
  const companyAddress = companyInfo?.address || 'No. 33, Gerupalya, Kumbalagodu, Bangalore, Karnataka - 560074';
  const companyGst = companyInfo?.gstin || '29ABICS5363G1ZY';

  return (
    <Document title={`Client-Profitability-Register-${period.value}`}>
      <Page size="A4" orientation="landscape" style={[styles.page, { padding: 24 }]}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.companyName}>{companyName}</Text>
            <Text style={styles.companySub}>{companyTrade} • GSTIN: {companyGst}</Text>
            <Text style={styles.companySub}>{companyAddress}</Text>
          </View>
          <View>
            <Text style={styles.reportTitle}>Client Profitability Register</Text>
            <Text style={styles.reportMeta}>Analysis Period: {period.label}</Text>
            <Text style={styles.reportMeta}>Generated: {formatDateDMY(new Date().toISOString())}</Text>
          </View>
        </View>

        {/* Executive Summary KPIs */}
        <View style={styles.kpiGrid}>
          <View style={styles.kpiBox}>
            <Text style={styles.kpiLabel}>Total Client Revenue (Ex-GST)</Text>
            <Text style={[styles.kpiValue, { color: '#0f172a' }]}>₹{summary.totalClientRevenue.toLocaleString()}</Text>
            <Text style={styles.kpiSub}>Recv: ₹{summary.totalCashReceived.toLocaleString()} • Due: ₹{summary.totalOutstandingReceivables.toLocaleString()}</Text>
          </View>
          <View style={styles.kpiBox}>
            <Text style={styles.kpiLabel}>Total Direct Costs</Text>
            <Text style={[styles.kpiValue, { color: '#dc2626' }]}>₹{summary.totalDirectCosts.toLocaleString()}</Text>
            <Text style={styles.kpiSub}>Staff: ₹{summary.totalEmployeeCost.toLocaleString()}</Text>
          </View>
          <View style={styles.kpiBox}>
            <Text style={styles.kpiLabel}>Agency Contribution</Text>
            <Text style={[styles.kpiValue, { color: summary.totalContribution >= 0 ? '#4f46e5' : '#dc2626' }]}>
              ₹{summary.totalContribution.toLocaleString()}
            </Text>
            <Text style={styles.kpiSub}>Contr. Margin: {summary.overallContributionMargin.toFixed(1)}%</Text>
          </View>
          <View style={styles.kpiBox}>
            <Text style={styles.kpiLabel}>Net Client Profit</Text>
            <Text style={[styles.kpiValue, { color: summary.totalNetProfit >= 0 ? '#16a34a' : '#dc2626' }]}>
              ₹{summary.totalNetProfit.toLocaleString()}
            </Text>
            <Text style={styles.kpiSub}>Net Margin: {summary.overallNetProfitMargin.toFixed(1)}% ({summary.profitableClientsCount} Profitable, {summary.lossMakingClientsCount} Loss)</Text>
          </View>
        </View>

        {/* Register Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, { flex: 2.5 }]}>Client Account</Text>
            <Text style={[styles.tableHeaderCell, { flex: 1.5, textAlign: 'right' }]}>Revenue (Ex-GST)</Text>
            <Text style={[styles.tableHeaderCell, { flex: 1.3, textAlign: 'right' }]}>Employee Cost</Text>
            <Text style={[styles.tableHeaderCell, { flex: 1.3, textAlign: 'right' }]}>Other Direct</Text>
            <Text style={[styles.tableHeaderCell, { flex: 1.3, textAlign: 'right' }]}>Total Direct</Text>
            <Text style={[styles.tableHeaderCell, { flex: 1.4, textAlign: 'right' }]}>Contribution</Text>
            <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'right' }]}>Contr. %</Text>
            <Text style={[styles.tableHeaderCell, { flex: 1.3, textAlign: 'right' }]}>Overheads</Text>
            <Text style={[styles.tableHeaderCell, { flex: 1.4, textAlign: 'right' }]}>Net Profit</Text>
            <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'right' }]}>Net %</Text>
            <Text style={[styles.tableHeaderCell, { flex: 1.2, textAlign: 'center' }]}>Status</Text>
          </View>
          {records.map((r, idx) => (
            <View key={idx} style={[styles.tableRow, { backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }]}>
              <Text style={[styles.tableCell, { flex: 2.5, fontWeight: 'bold' }]}>{r.clientName}</Text>
              <Text style={[styles.tableCell, { flex: 1.5, textAlign: 'right', fontWeight: 'bold' }]}>₹{r.netEarnedRevenue.toLocaleString()}</Text>
              <Text style={[styles.tableCell, { flex: 1.3, textAlign: 'right' }]}>₹{r.allocatedEmployeeCost.toLocaleString()}</Text>
              <Text style={[styles.tableCell, { flex: 1.3, textAlign: 'right' }]}>₹{(r.totalDirectCosts - r.allocatedEmployeeCost).toLocaleString()}</Text>
              <Text style={[styles.tableCell, { flex: 1.3, textAlign: 'right', color: '#dc2626' }]}>₹{r.totalDirectCosts.toLocaleString()}</Text>
              <Text style={[styles.tableCell, { flex: 1.4, textAlign: 'right', fontWeight: 'bold', color: r.contribution >= 0 ? '#4f46e5' : '#dc2626' }]}>
                ₹{r.contribution.toLocaleString()}
              </Text>
              <Text style={[styles.tableCell, { flex: 1, textAlign: 'right' }]}>{r.contributionMargin.toFixed(1)}%</Text>
              <Text style={[styles.tableCell, { flex: 1.3, textAlign: 'right', color: '#64748b' }]}>₹{r.allocatedOverheads.toLocaleString()}</Text>
              <Text style={[styles.tableCell, { flex: 1.4, textAlign: 'right', fontWeight: 'bold', color: r.netProfit >= 0 ? '#16a34a' : '#dc2626' }]}>
                ₹{r.netProfit.toLocaleString()}
              </Text>
              <Text style={[styles.tableCell, { flex: 1, textAlign: 'right' }]}>{r.netProfitMargin.toFixed(1)}%</Text>
              <Text style={[styles.tableCell, { flex: 1.2, textAlign: 'center', fontWeight: 'bold', color: r.isProfitable ? '#16a34a' : '#dc2626' }]}>
                {r.isProfitable ? 'Profitable' : 'Loss-Making'}
              </Text>
            </View>
          ))}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Shankara Online Solutions Management Accounting • Strictly Confidential</Text>
          <Text style={styles.footerText}>Client Profitability Register • Page 1 of 1</Text>
        </View>
      </Page>
    </Document>
  );
};

export default ClientProfitabilityPDF;
