import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';
import {
  SHANKARA_LOGO_DATA_URI,
  SIGNATURE_DATA_URI,
  UPI_QR_DATA_URI,
  PERSONAL_UPI_QR_DATA_URI,
} from '../assets/invoiceAssets';
import { formatDateDMY } from '../utils/date';

const styles = StyleSheet.create({
  page: {
    paddingTop: 28,
    paddingBottom: 28,
    paddingLeft: 24,
    paddingRight: 24,
    fontFamily: 'Helvetica',
    fontSize: 8.5,
    color: '#000000',
    backgroundColor: '#ffffff',
  },
  // Top Header
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  logoImage: {
    width: 185,
    height: 52,
    objectFit: 'contain',
  },
  invoiceTitleCompany: {
    fontSize: 24,
    fontFamily: 'Helvetica-Bold',
    color: '#1e3a5f',
    letterSpacing: 0.5,
    paddingRight: 6,
  },
  personalHeaderName: {
    fontSize: 26,
    fontFamily: 'Helvetica-Bold',
    color: '#0070c0',
    letterSpacing: 0.25,
  },
  invoiceTitlePersonal: {
    fontSize: 21,
    fontFamily: 'Helvetica-Bold',
    color: '#0070c0',
    letterSpacing: 0.5,
    paddingRight: 6,
  },
  headerDivider: {
    height: 1.5,
    backgroundColor: '#1e3a5f',
    marginBottom: 10,
  },
  headerDividerBlack: {
    height: 1.5,
    backgroundColor: '#000000',
    marginBottom: 10,
  },

  // Mailing Info & Invoice / Client Meta Info Section
  infoSection: {
    flexDirection: 'row',
    marginBottom: 10,
    minHeight: 105,
  },
  // Left side: Mailing Info
  mailingCol: {
    width: '53%',
    flexDirection: 'row',
    paddingRight: 4,
  },
  mailingLabelBox: {
    width: 62,
    alignItems: 'center',
    paddingTop: 2,
    paddingRight: 4,
  },
  mailingLabelBold: {
    fontSize: 8.5,
    fontFamily: 'Helvetica-Bold',
    color: '#222222',
    textAlign: 'center',
  },
  mailingLabelSub: {
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    color: '#222222',
    textAlign: 'center',
    marginTop: 1,
  },
  verticalDividerMailing: {
    width: 1,
    backgroundColor: '#000000',
    marginVertical: 1,
  },
  mailingAddressBox: {
    flex: 1,
    paddingLeft: 10,
    paddingRight: 6,
    paddingTop: 1,
  },
  companyLegalName: {
    fontSize: 8.5,
    fontFamily: 'Helvetica-Bold',
    color: '#000000',
    marginBottom: 2.5,
  },
  addressLine: {
    fontSize: 8.2,
    color: '#111111',
    lineHeight: 1.35,
  },
  contactNumber: {
    fontSize: 8.2,
    color: '#111111',
    marginTop: 4,
  },
  companyGstLine: {
    fontSize: 8.5,
    fontFamily: 'Helvetica-Bold',
    color: '#000000',
    marginTop: 4,
  },

  // Vertical divider between mailing info and invoice/billing info
  verticalDividerMain: {
    width: 1,
    backgroundColor: '#000000',
    marginVertical: 1,
  },

  // Right side: Invoice & Billing Details
  billingCol: {
    width: '47%',
    paddingLeft: 10,
    paddingTop: 1,
  },
  metaRow: {
    flexDirection: 'row',
    marginBottom: 4,
    alignItems: 'flex-start',
  },
  metaLabel: {
    width: 95,
    fontSize: 8.5,
    fontFamily: 'Helvetica-Bold',
    color: '#222222',
    textAlign: 'right',
    paddingRight: 10,
  },
  metaValue: {
    flex: 1,
    fontSize: 8.5,
    color: '#000000',
    lineHeight: 1.25,
  },
  metaValueBold: {
    flex: 1,
    fontSize: 8.5,
    fontFamily: 'Helvetica-Bold',
    color: '#000000',
    lineHeight: 1.25,
  },

  // Items Table
  tableContainer: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#000000',
    borderStyle: 'solid',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#000000',
    backgroundColor: '#ffffff',
    height: 20,
    alignItems: 'center',
  },
  tableHeaderCol: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 8.5,
    color: '#000000',
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#000000',
    minHeight: 19,
    alignItems: 'center',
  },
  tableCell: {
    fontSize: 8.5,
    color: '#000000',
  },

  // Column Widths
  colCol1: {
    width: '14%',
    borderRightWidth: 1,
    borderRightColor: '#000000',
    textAlign: 'center',
    paddingVertical: 3,
  },
  colDesc: {
    width: '50%',
    borderRightWidth: 1,
    borderRightColor: '#000000',
    paddingLeft: 8,
    paddingRight: 6,
    paddingVertical: 3,
  },
  colUnits: {
    width: '10%',
    borderRightWidth: 1,
    borderRightColor: '#000000',
    textAlign: 'center',
    paddingVertical: 3,
  },
  colRate: {
    width: '13%',
    borderRightWidth: 1,
    borderRightColor: '#000000',
    textAlign: 'right',
    paddingRight: 6,
    paddingVertical: 3,
  },
  colAmount: {
    width: '13%',
    textAlign: 'right',
    paddingRight: 6,
    paddingVertical: 3,
  },

  // Bottom Section: Split Payment Details (Left) + Subtotal/Taxes (Right)
  bottomSplitSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  paymentDetailsArea: {
    width: '64%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
    paddingRight: 10,
  },
  bankInfoCol: {
    width: '65%',
  },
  paymentHeading: {
    fontSize: 8.5,
    fontFamily: 'Helvetica-Bold',
    textDecoration: 'underline',
    color: '#000000',
    marginBottom: 6,
  },
  bankInfoRow: {
    flexDirection: 'row',
    marginBottom: 2.5,
    alignItems: 'center',
  },
  bankInfoLabel: {
    width: 72,
    fontSize: 8,
    color: '#111111',
  },
  bankInfoValue: {
    fontSize: 8,
    color: '#000000',
    fontFamily: 'Helvetica',
  },
  bankInfoValueLink: {
    fontSize: 8,
    color: '#0000ee',
    textDecoration: 'underline',
    fontFamily: 'Helvetica',
  },
  qrCodeCol: {
    width: '35%',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 8,
  },
  qrCodeImage: {
    width: 82,
    height: 82,
    objectFit: 'contain',
  },

  // Right: Sub Total, Taxes, Total Table
  totalsTableArea: {
    width: '36%',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#000000',
    borderStyle: 'solid',
  },
  totalRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#000000',
    height: 18,
    alignItems: 'center',
  },
  totalRowFinal: {
    flexDirection: 'row',
    height: 20,
    alignItems: 'center',
  },
  totalLabelCell: {
    width: '55%',
    borderRightWidth: 1,
    borderRightColor: '#000000',
    textAlign: 'right',
    paddingRight: 6,
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#000000',
  },
  totalValueCell: {
    width: '45%',
    textAlign: 'right',
    paddingRight: 6,
    fontSize: 8,
    color: '#000000',
  },
  totalValueCellBold: {
    width: '45%',
    textAlign: 'right',
    paddingRight: 6,
    fontSize: 8.5,
    fontFamily: 'Helvetica-Bold',
    color: '#000000',
  },

  // Signature Block
  signatureArea: {
    width: 155,
    alignSelf: 'flex-end',
    marginTop: 18,
    marginBottom: 10,
  },
  signatureBox: {
    borderWidth: 1,
    borderColor: '#000000',
    borderStyle: 'solid',
    height: 54,
    padding: 3,
    justifyContent: 'space-between',
  },
  signatureLabel: {
    fontSize: 7,
    color: '#333333',
    marginLeft: 1,
  },
  signatureImage: {
    width: 105,
    height: 36,
    alignSelf: 'center',
    marginTop: -4,
    objectFit: 'contain',
  },
  signatoryName: {
    fontSize: 8.5,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
    color: '#000000',
    marginTop: 4,
  },
  signatoryDesignation: {
    fontSize: 7.5,
    textAlign: 'center',
    color: '#111111',
  },

  // Footer Section
  footerContainer: {
    position: 'absolute',
    left: 24,
    right: 24,
    bottom: 22,
    textAlign: 'center',
  },
  footerTrustText: {
    fontSize: 8.5,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
    color: '#000000',
    marginBottom: 5,
  },
  footerDivider: {
    height: 0.75,
    backgroundColor: '#000000',
    marginBottom: 4,
  },
  footerContactText: {
    fontSize: 8,
    textAlign: 'center',
    color: '#111111',
  },
});

const formatCurrencyINR = (val?: number) => {
  if (val === undefined || val === null) return '0.00';
  return val.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const formatFullDate = (dateVal?: string, fallback = '16 Aug 2026') => {
  if (!dateVal) return fallback;
  return formatDateDMY(dateVal);
};

export const InvoicePDF = ({
  invoiceData,
  qrCodeDataUri,
}: {
  invoiceData: any;
  qrCodeDataUri?: string;
}) => {
  const isPersonal = invoiceData.type === 'PERSONAL';

  const items = invoiceData.items && invoiceData.items.length > 0 ? invoiceData.items : [];
  // Ensure the table has 7-8 total rows matching the template visual
  const emptyRowCount = Math.max(0, 7 - items.length);
  const emptyRows = Array.from({ length: emptyRowCount });

  const subTotal = invoiceData.subTotal ?? invoiceData.amount ?? 0;
  const isInterState = Boolean(invoiceData.isInterState || (invoiceData.igst && invoiceData.igst > 0));
  const igst = !isPersonal && isInterState ? (invoiceData.igst || subTotal * 0.18) : 0;
  const cgst = !isPersonal && !isInterState ? (invoiceData.cgst !== undefined ? invoiceData.cgst : subTotal * 0.09) : 0;
  const sgst = !isPersonal && !isInterState ? (invoiceData.sgst !== undefined ? invoiceData.sgst : subTotal * 0.09) : 0;
  const roundOff = !isPersonal ? (invoiceData.roundOff ?? 0) : 0;
  const total = invoiceData.total ?? (subTotal + igst + cgst + sgst + roundOff);

  const displayDate = formatFullDate(
    invoiceData.rawDate || invoiceData.date,
    isPersonal ? '07 Sep 2026' : '16 Aug 2026'
  );

  // QR code source: custom passed URI > explicit image > personal/company default
  const resolvedQrUri =
    qrCodeDataUri ||
    invoiceData.paymentDetails?.qrCodeImage ||
    (isPersonal ? PERSONAL_UPI_QR_DATA_URI : UPI_QR_DATA_URI);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* 1. Header */}
        <View style={styles.headerContainer}>
          {isPersonal ? (
            <Text style={styles.personalHeaderName}>MANJUNATH NAIK S</Text>
          ) : (
            <Image src={SHANKARA_LOGO_DATA_URI} style={styles.logoImage} />
          )}

          <Text style={isPersonal ? styles.invoiceTitlePersonal : styles.invoiceTitleCompany}>
            INVOICE
          </Text>
        </View>

        <View style={isPersonal ? styles.headerDividerBlack : styles.headerDivider} />

        {/* 2. Mailing Info (Left) & Invoice / Client Meta Info (Right) */}
        <View style={styles.infoSection}>
          {/* Left Column: MAILING INFO */}
          <View style={styles.mailingCol}>
            <View style={styles.mailingLabelBox}>
              <Text style={styles.mailingLabelBold}>MAILING</Text>
              <Text style={styles.mailingLabelSub}>INFO</Text>
            </View>

            <View style={styles.verticalDividerMailing} />

            <View style={styles.mailingAddressBox}>
              <Text style={styles.companyLegalName}>
                {invoiceData.companyName || (isPersonal ? 'MANJUNATH NAIK S' : 'M/s SHANKARA ONLINE SOLUTIONS LLP.')}
              </Text>
              <Text style={styles.addressLine}>#33, 2nd Cross, Shankarappa Layout,</Text>
              <Text style={styles.addressLine}>H.V Halli, Near Manipal Hospital Road,</Text>
              <Text style={styles.addressLine}>Rajarajeshwari Nagar, Bengaluru - 560098</Text>
              <Text style={styles.contactNumber}>
                Contact Number: {invoiceData.companyPhone || '+91-9986703161'}
              </Text>
              {!isPersonal && (
                <Text style={styles.companyGstLine}>
                  GST: {invoiceData.companyGst || '29ADXFS0028E1ZT'}
                </Text>
              )}
            </View>
          </View>

          {/* Middle vertical line separating left and right */}
          <View style={styles.verticalDividerMain} />

          {/* Right Column: Invoice Details & Client Billing Info */}
          <View style={styles.billingCol}>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>INVOICE #</Text>
              <Text style={styles.metaValueBold}>
                {invoiceData.invoiceNumber || (isPersonal ? '0022/2026-27' : '0021/2026-27')}
              </Text>
            </View>

            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>INVOICE DATE</Text>
              <Text style={styles.metaValue}>{displayDate}</Text>
            </View>

            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>BILLING NAME</Text>
              <Text style={styles.metaValueBold}>
                {invoiceData.clientName ||
                  (isPersonal ? 'The Art of Living Foundation' : 'M/s Tamagna Personalcare Pvt Ltd')}
              </Text>
            </View>

            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>BILLING ADDRESS</Text>
              <Text style={styles.metaValue}>
                {invoiceData.clientAddress ||
                  (isPersonal
                    ? '#433 Race Course Road,\nFarrer Park, Singapore, 218679'
                    : '33, Gerupalya, Kumbalagodu, Behind KIADB Phase-2, Bangalore, Karnataka – 560074')}
              </Text>
            </View>

            {/* Client GST is only present on company GST invoices */}
            {!isPersonal && invoiceData.clientGst && (
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>CLIENT GST</Text>
                <Text style={styles.metaValueBold}>{invoiceData.clientGst}</Text>
              </View>
            )}
          </View>
        </View>

        {/* 3. Items Table */}
        <View style={styles.tableContainer}>
          {/* Header Row: SL # for personal non-GST vs SSC CODE for company */}
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.colCol1, styles.tableHeaderCol]}>
              {isPersonal ? 'SL #' : 'SSC CODE'}
            </Text>
            <Text style={[styles.colDesc, styles.tableHeaderCol]}>DESCRIPTION OF SERVICES</Text>
            <Text style={[styles.colUnits, styles.tableHeaderCol]}>UNITS</Text>
            <Text style={[styles.colRate, styles.tableHeaderCol]}>RATE</Text>
            <Text style={[styles.colAmount, styles.tableHeaderCol]}>AMOUNT</Text>
          </View>

          {/* Items Rows */}
          {items.map((item: any, idx: number) => (
            <View style={styles.tableRow} key={idx}>
              <Text style={[styles.colCol1, styles.tableCell]}>
                {isPersonal ? idx + 1 : (item.sac || '998361')}
              </Text>
              <Text style={[styles.colDesc, styles.tableCell]}>
                {item.description || item.desc}
              </Text>
              <Text style={[styles.colUnits, styles.tableCell]}>{item.units ?? 1}</Text>
              <Text style={[styles.colRate, styles.tableCell]}>
                {formatCurrencyINR(item.rate)}
              </Text>
              <Text style={[styles.colAmount, styles.tableCell]}>
                {formatCurrencyINR(item.amount ?? item.units * item.rate)}
              </Text>
            </View>
          ))}

          {/* Empty Fill Rows to match standard ledger height */}
          {emptyRows.map((_, idx) => (
            <View style={styles.tableRow} key={`empty-${idx}`}>
              <Text style={[styles.colCol1, styles.tableCell]}> </Text>
              <Text style={[styles.colDesc, styles.tableCell]}> </Text>
              <Text style={[styles.colUnits, styles.tableCell]}> </Text>
              <Text style={[styles.colRate, styles.tableCell]}> </Text>
              <Text style={[styles.colAmount, styles.tableCell]}> </Text>
            </View>
          ))}
        </View>

        {/* 4. Bottom Split: Payment Details (Left) + Totals & Taxes Table (Right) */}
        <View style={styles.bottomSplitSection}>
          {/* Left: Payment details + QR Code */}
          <View style={styles.paymentDetailsArea}>
            <View style={styles.bankInfoCol}>
              <Text style={styles.paymentHeading}>PAYMENT DETAILS:</Text>

              <View style={styles.bankInfoRow}>
                <Text style={styles.bankInfoLabel}>A/c Name</Text>
                <Text style={styles.bankInfoValue}>
                  {invoiceData.paymentDetails?.accountName ||
                    (isPersonal ? 'MANJUNATH NAIK S' : 'SHANKARA ONLINE SOLUTIONS LLP')}
                </Text>
              </View>

              <View style={styles.bankInfoRow}>
                <Text style={styles.bankInfoLabel}>Bank A/c No.</Text>
                <Text style={styles.bankInfoValue}>
                  {invoiceData.paymentDetails?.accountNo ||
                    (isPersonal ? '50100013517782' : '50200041387947')}
                </Text>
              </View>

              <View style={styles.bankInfoRow}>
                <Text style={styles.bankInfoLabel}>Bank Name</Text>
                <Text style={styles.bankInfoValue}>
                  {invoiceData.paymentDetails?.bankName || 'HDFC BANK'}
                </Text>
              </View>

              {/* Bank Branch row (prominent in personal invoice) */}
              {invoiceData.paymentDetails?.branch && (
                <View style={styles.bankInfoRow}>
                  <Text style={styles.bankInfoLabel}>Bank Branch</Text>
                  <Text style={styles.bankInfoValue}>{invoiceData.paymentDetails.branch}</Text>
                </View>
              )}

              <View style={styles.bankInfoRow}>
                <Text style={styles.bankInfoLabel}>IFSC Code</Text>
                <Text style={styles.bankInfoValue}>
                  {invoiceData.paymentDetails?.ifsc ||
                    (isPersonal ? 'HDFC0000076' : 'HDFC0001039')}
                </Text>
              </View>

              <View style={styles.bankInfoRow}>
                <Text style={styles.bankInfoLabel}>PAN</Text>
                <Text style={styles.bankInfoValue}>
                  {invoiceData.paymentDetails?.pan ||
                    invoiceData.companyPan ||
                    (isPersonal ? 'AMAPN1977B' : 'ADXFS0028E')}
                </Text>
              </View>

              <View style={styles.bankInfoRow}>
                <Text style={styles.bankInfoLabel}>UPI</Text>
                <Text style={isPersonal ? styles.bankInfoValueLink : styles.bankInfoValue}>
                  {invoiceData.paymentDetails?.upi || (isPersonal ? '9986703161@paytm' : 'smnaik@UPI')}
                </Text>
              </View>
            </View>

            {/* UPI QR Code */}
            <View style={styles.qrCodeCol}>
              <Image src={resolvedQrUri} style={styles.qrCodeImage} />
            </View>
          </View>

          {/* Right: Sub Total, Taxes, Round Off, Total */}
          <View style={styles.totalsTableArea}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabelCell}>SUB TOTAL</Text>
              <Text style={styles.totalValueCellBold}>{formatCurrencyINR(subTotal)}</Text>
            </View>

            <View style={styles.totalRow}>
              <Text style={styles.totalLabelCell}>IGST (18%)</Text>
              <Text style={styles.totalValueCell}>
                {isPersonal ? '-' : igst > 0 ? formatCurrencyINR(igst) : '0.00'}
              </Text>
            </View>

            <View style={styles.totalRow}>
              <Text style={styles.totalLabelCell}>CGST (9%)</Text>
              <Text style={styles.totalValueCell}>
                {isPersonal ? '-' : cgst > 0 ? formatCurrencyINR(cgst) : '0.00'}
              </Text>
            </View>

            <View style={styles.totalRow}>
              <Text style={styles.totalLabelCell}>SGST (9%)</Text>
              <Text style={styles.totalValueCell}>
                {isPersonal ? '-' : sgst > 0 ? formatCurrencyINR(sgst) : '0.00'}
              </Text>
            </View>

            <View style={styles.totalRow}>
              <Text style={styles.totalLabelCell}>Round Off</Text>
              <Text style={styles.totalValueCell}>
                {isPersonal ? '-' : roundOff !== 0 ? formatCurrencyINR(roundOff) : '0.00'}
              </Text>
            </View>

            <View style={styles.totalRowFinal}>
              <Text style={styles.totalLabelCell}>TOTAL</Text>
              <Text style={styles.totalValueCellBold}>{formatCurrencyINR(total)}</Text>
            </View>
          </View>
        </View>

        {/* 5. Signature Box */}
        <View style={styles.signatureArea}>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLabel}>Signature</Text>
            <Image
              src={invoiceData.signatory?.signatureImage || SIGNATURE_DATA_URI}
              style={styles.signatureImage}
            />
          </View>
          <Text style={styles.signatoryName}>
            {invoiceData.signatory?.name || 'Manjunath Naik S'}
          </Text>
          {!isPersonal && invoiceData.signatory?.designation && (
            <Text style={styles.signatoryDesignation}>{invoiceData.signatory.designation}</Text>
          )}
        </View>

        {/* 6. Footer Section */}
        <View style={styles.footerContainer}>
          <Text style={styles.footerTrustText}>
            {isPersonal
              ? 'Thanks for your trust in my services!'
              : 'Thanks for your trust in our services!'}
          </Text>
          <View style={styles.footerDivider} />
          <Text style={styles.footerContactText}>
            {isPersonal
              ? 'For any further inquiries or clarifications, contact: Manjunath Naik at +91-9986703161 or Email: mail4m.naik@gmail.com'
              : 'For any further inquiries or clartfications, contact: Manjunath Naik on +91-9986703161 or Email: naik@shankaraonline.com'}
          </Text>
        </View>
      </Page>
    </Document>
  );
};
