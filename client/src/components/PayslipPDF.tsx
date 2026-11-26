import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica' },
  header: { marginBottom: 20, borderBottom: '1px solid #ccc', paddingBottom: 10 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  subtitle: { fontSize: 12, color: '#666', marginTop: 5 },
  section: { marginTop: 20 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  boldText: { fontSize: 12, fontWeight: 'bold' },
  text: { fontSize: 12 },
  amount: { fontSize: 12, textAlign: 'right' },
  tableHeader: { flexDirection: 'row', borderBottom: '1px solid #000', paddingBottom: 5, marginBottom: 10, marginTop: 20 },
  tableRow: { flexDirection: 'row', borderBottom: '1px solid #eee', paddingVertical: 5 },
  col1: { width: '50%' },
  col2: { width: '50%', textAlign: 'right' },
  totalRow: { flexDirection: 'row', borderTop: '2px solid #000', paddingTop: 10, marginTop: 10 },
});

export const PayslipPDF = ({ employee, data }: any) => {
  const netPayable = employee.grossSalary - (Number(data.tds) || 0) - (Number(data.pt) || 0);

  const formatMonth = (monthString: string) => {
    if (!monthString) return '';
    const [year, month] = monthString.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleString('default', { month: 'long', year: 'numeric' });
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Payslip</Text>
          <Text style={styles.subtitle}>For the month of {formatMonth(data.month)}</Text>
        </View>

        <View style={styles.section}>
          <View style={styles.row}>
            <Text style={styles.boldText}>Employee Name:</Text>
            <Text style={styles.text}>{employee.name}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.boldText}>Designation:</Text>
            <Text style={styles.text}>{employee.role}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.boldText}>PAN:</Text>
            <Text style={styles.text}>{employee.pan || 'N/A'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.boldText}>Bank Account:</Text>
            <Text style={styles.text}>{employee.accountNumber || 'N/A'} ({employee.bankName || 'N/A'})</Text>
          </View>
        </View>

        <View style={styles.tableHeader}>
          <View style={styles.col1}><Text style={styles.boldText}>Earnings & Deductions</Text></View>
          <View style={styles.col2}><Text style={styles.boldText}>Amount (INR)</Text></View>
        </View>

        <View style={styles.tableRow}>
          <View style={styles.col1}><Text style={styles.text}>Gross Salary</Text></View>
          <View style={styles.col2}><Text style={styles.amount}>{employee.grossSalary?.toLocaleString()}</Text></View>
        </View>
        
        {Number(data.tds) > 0 && (
          <View style={styles.tableRow}>
            <View style={styles.col1}><Text style={styles.text}>Less: TDS</Text></View>
            <View style={styles.col2}><Text style={styles.amount}>-{Number(data.tds).toLocaleString()}</Text></View>
          </View>
        )}

        {Number(data.pt) > 0 && (
          <View style={styles.tableRow}>
            <View style={styles.col1}><Text style={styles.text}>Less: Professional Tax</Text></View>
            <View style={styles.col2}><Text style={styles.amount}>-{Number(data.pt).toLocaleString()}</Text></View>
          </View>
        )}

        <View style={styles.totalRow}>
          <View style={styles.col1}><Text style={styles.boldText}>Net Payable</Text></View>
          <View style={styles.col2}><Text style={styles.boldText}>{netPayable.toLocaleString()}</Text></View>
        </View>
      </Page>
    </Document>
  );
};
