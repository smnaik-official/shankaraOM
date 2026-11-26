import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';
import { Quotation } from '../data/quotations';
import { SHANKARA_LETTERHEAD_DATA_URI, SIGNATURE_DATA_URI } from '../assets/invoiceAssets';
import { formatDateDDMMYYYY } from '../utils/date';

const PURPLE_PRIMARY = '#5a3e85';
const PURPLE_DARK = '#3d255f';
const PURPLE_LIGHT = '#f6f2fa';
const PURPLE_BORDER = '#d8cbe8';
const TEXT_DARK = '#222222';

const styles = StyleSheet.create({
  page: {
    paddingTop: 104,
    paddingBottom: 55,
    paddingLeft: 70,
    paddingRight: 36,
    fontFamily: 'Helvetica',
    fontSize: 8.5,
    color: TEXT_DARK,
    backgroundColor: '#ffffff',
  },
  // Full Letterhead Background Graphic
  letterheadBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 595.28,
    height: 841.89,
  },

  // Cover / Proposal Title
  proposalTitleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    marginTop: 2,
  },
  proposalTitle: {
    fontSize: 15,
    fontFamily: 'Helvetica-Bold',
    color: PURPLE_PRIMARY,
    letterSpacing: 0,
    textAlign: 'center',
    textTransform: 'uppercase',
  },

  // Meta Section: Date & Client Addressee
  metaSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    backgroundColor: '#fafafa',
    padding: '8 10',
    borderRadius: 3,
    borderLeftWidth: 3,
    borderLeftColor: PURPLE_PRIMARY,
  },
  toBox: {
    width: '68%',
  },
  metaLabel: {
    fontSize: 7.5,
    color: '#777777',
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  clientNameBold: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: TEXT_DARK,
  },
  clientCityText: {
    fontSize: 8.5,
    color: '#444444',
    marginTop: 1,
  },
  attnText: {
    fontSize: 8,
    color: '#333333',
    fontFamily: 'Helvetica-Bold',
    marginTop: 3,
  },
  dateBox: {
    width: '32%',
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  dateInnerBox: {
    alignItems: 'center',
  },
  quoteNumBadge: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: PURPLE_PRIMARY,
    backgroundColor: PURPLE_LIGHT,
    paddingVertical: 2.5,
    paddingHorizontal: 7,
    borderRadius: 3,
    marginBottom: 3.5,
    textAlign: 'center',
  },
  dateValue: {
    fontSize: 8,
    color: '#444444',
    fontFamily: 'Helvetica',
    textAlign: 'center',
  },

  // Subject & Salutation
  subjectContainer: {
    marginVertical: 6,
    paddingVertical: 5,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e0e0e0',
  },
  subjectText: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: PURPLE_DARK,
    lineHeight: 1.35,
  },
  salutationText: {
    fontSize: 8.5,
    fontFamily: 'Helvetica-Bold',
    color: TEXT_DARK,
    marginTop: 6,
    marginBottom: 4,
  },
  introParagraph: {
    fontSize: 8.5,
    color: '#333333',
    lineHeight: 1.45,
    marginBottom: 8,
  },

  // Section Headings
  sectionHeading: {
    fontSize: 10.5,
    fontFamily: 'Helvetica-Bold',
    color: PURPLE_PRIMARY,
    marginTop: 12,
    marginBottom: 6,
    paddingBottom: 2,
    borderBottomWidth: 1,
    borderBottomColor: PURPLE_BORDER,
  },
  sectionSubtext: {
    fontSize: 8.5,
    color: '#333333',
    lineHeight: 1.4,
    marginBottom: 8,
  },

  // 3 Pillars Grid
  pillarsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 6,
  },
  pillarCard: {
    width: '31.8%',
    borderWidth: 1,
    borderColor: PURPLE_BORDER,
    borderRadius: 3,
    overflow: 'hidden',
    backgroundColor: '#ffffff',
  },
  pillarHeader: {
    backgroundColor: PURPLE_PRIMARY,
    paddingVertical: 4.5,
    paddingHorizontal: 4,
    alignItems: 'center',
  },
  pillarTitle: {
    fontSize: 8.5,
    fontFamily: 'Helvetica-Bold',
    color: '#ffffff',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  pillarBody: {
    padding: 6,
    fontSize: 7.8,
    color: '#333333',
    lineHeight: 1.35,
    textAlign: 'center',
  },

  // Philosophy List
  philosophyTitle: {
    fontSize: 9.5,
    fontFamily: 'Helvetica-Bold',
    color: PURPLE_DARK,
    marginTop: 8,
    marginBottom: 4,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 3.5,
    paddingLeft: 4,
  },
  bulletDot: {
    width: 10,
    fontSize: 8.5,
    color: PURPLE_PRIMARY,
    fontFamily: 'Helvetica-Bold',
  },
  bulletContent: {
    flex: 1,
    fontSize: 8.2,
    color: '#333333',
    lineHeight: 1.38,
  },

  // Scope of Work
  phaseBox: {
    marginTop: 6,
    marginBottom: 8,
  },
  phaseHeader: {
    backgroundColor: PURPLE_LIGHT,
    borderLeftWidth: 3,
    borderLeftColor: PURPLE_PRIMARY,
    paddingVertical: 3.5,
    paddingHorizontal: 8,
    marginBottom: 6,
  },
  phaseTitleText: {
    fontSize: 9.5,
    fontFamily: 'Helvetica-Bold',
    color: PURPLE_DARK,
  },
  deliverableItem: {
    marginBottom: 7,
    paddingLeft: 6,
  },
  deliverableTitle: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  deliverableSubtitle: {
    fontSize: 8,
    color: '#555555',
    lineHeight: 1.35,
    marginBottom: 2.5,
  },
  deliverableIndicative: {
    fontSize: 7.8,
    fontFamily: 'Helvetica-Oblique',
    color: '#444444',
    lineHeight: 1.3,
  },

  // Commercial Table
  commercialTable: {
    borderWidth: 1,
    borderColor: PURPLE_BORDER,
    borderRadius: 3,
    overflow: 'hidden',
    marginVertical: 6,
  },
  commercialTableHeader: {
    flexDirection: 'row',
    backgroundColor: PURPLE_PRIMARY,
    paddingVertical: 5,
    paddingHorizontal: 6,
  },
  thService: {
    width: '54%',
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#ffffff',
  },
  thInvestment: {
    width: '24%',
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#ffffff',
    textAlign: 'right',
    paddingRight: 6,
  },
  thBilling: {
    width: '22%',
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#ffffff',
    textAlign: 'center',
  },
  commercialTableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: '#eae4f2',
  },
  tdService: {
    width: '54%',
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#222222',
  },
  tdInvestment: {
    width: '24%',
    fontSize: 8.5,
    fontFamily: 'Helvetica-Bold',
    color: PURPLE_PRIMARY,
    textAlign: 'right',
    paddingRight: 6,
  },
  tdBilling: {
    width: '22%',
    textAlign: 'center',
  },
  tdBillingText: {
    fontSize: 7.5,
    color: '#333333',
    fontFamily: 'Helvetica',
  },
  tdTaxBadge: {
    fontSize: 6.8,
    color: '#666666',
    fontFamily: 'Helvetica-Oblique',
    marginTop: 1,
  },
  commercialTableTotal: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 6,
    backgroundColor: PURPLE_LIGHT,
    borderTopWidth: 1,
    borderTopColor: PURPLE_PRIMARY,
  },
  tdTotalLabel: {
    width: '54%',
    fontSize: 8.5,
    fontFamily: 'Helvetica-Bold',
    color: PURPLE_DARK,
  },
  tdTotalValue: {
    width: '24%',
    fontSize: 9.5,
    fontFamily: 'Helvetica-Bold',
    color: PURPLE_PRIMARY,
    textAlign: 'right',
    paddingRight: 6,
  },
  tdTotalNote: {
    width: '22%',
    fontSize: 7,
    color: '#555555',
    textAlign: 'center',
  },

  // Notes & Inputs Boxes
  calloutBox: {
    backgroundColor: '#faf8fc',
    borderLeftWidth: 2.5,
    borderLeftColor: PURPLE_PRIMARY,
    padding: '6 8',
    marginVertical: 4,
    borderRadius: 2,
  },
  calloutTitle: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: PURPLE_DARK,
    marginBottom: 2,
  },
  calloutText: {
    fontSize: 7.6,
    color: '#444444',
    lineHeight: 1.35,
  },

  // Terms Section
  termsList: {
    marginVertical: 4,
  },
  termItem: {
    flexDirection: 'row',
    marginBottom: 3.5,
    paddingLeft: 4,
  },
  termBullet: {
    width: 12,
    fontSize: 8,
    color: PURPLE_PRIMARY,
    fontFamily: 'Helvetica-Bold',
  },
  termContent: {
    flex: 1,
    fontSize: 8,
    color: '#333333',
    lineHeight: 1.35,
  },
  termTitleBold: {
    fontFamily: 'Helvetica-Bold',
    color: '#1a1a1a',
  },

  // Signatory & Closing
  closingSection: {
    marginTop: 12,
    paddingTop: 8,
  },
  closingText: {
    fontSize: 8.5,
    color: '#333333',
    lineHeight: 1.4,
    marginBottom: 6,
  },
  thankYouText: {
    fontSize: 8.5,
    fontFamily: 'Helvetica-Bold',
    color: PURPLE_PRIMARY,
    marginBottom: 10,
  },
  signatoryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 8,
  },
  signatoryLeft: {
    width: '60%',
  },
  forCompanyText: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#555555',
    marginBottom: 6,
  },
  signatureImage: {
    width: 95,
    height: 38,
    objectFit: 'contain',
    marginBottom: 2,
  },
  signaturePlaceholder: {
    height: 36,
  },
  signatoryName: {
    fontSize: 9.5,
    fontFamily: 'Helvetica-Bold',
    color: TEXT_DARK,
  },
  signatoryRole: {
    fontSize: 8,
    color: '#555555',
    marginBottom: 2,
  },
  signatoryContacts: {
    fontSize: 7.5,
    color: '#666666',
    lineHeight: 1.3,
  },
});

function formatQuotationAmount(amount: number, currency: string = 'INR'): string {
  if (isNaN(amount) || amount === 0) return '0';
  const curr = currency ? currency.toUpperCase() : 'INR';
  const locale = curr === 'INR' ? 'en-IN' : 'en-US';
  const formatted = amount.toLocaleString(locale);
  if (curr === 'USD') return `$ ${formatted}`;
  if (curr === 'EUR') return `€ ${formatted}`;
  if (curr === 'GBP') return `£ ${formatted}`;
  if (curr === 'AUD') return `A$ ${formatted}`;
  if (curr === 'SGD') return `S$ ${formatted}`;
  if (curr === 'AED') return `AED ${formatted}`;
  if (curr === 'CAD') return `C$ ${formatted}`;
  // For INR, return plain figure under the 'Investment (INR)' column header
  return formatted;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  return formatDateDDMMYYYY(dateStr);
}

interface QuotationPDFProps {
  quotation: Quotation;
}

export const QuotationPDF: React.FC<QuotationPDFProps> = ({ quotation }) => {
  return (
    <Document title={`${quotation.quotationNumber} - ${quotation.clientName}`}>
      <Page size="A4" style={styles.page} wrap>
        {/* Full Official Letterhead Graphic - fixed across all pages */}
        <Image src={SHANKARA_LETTERHEAD_DATA_URI} style={styles.letterheadBg} fixed />

        {/* 1. Proposal Title & Client Metadata */}
        <View style={styles.proposalTitleContainer}>
          <Text style={styles.proposalTitle}>COMMERCIAL PROPOSAL</Text>
        </View>

        <View style={styles.metaSection}>
          <View style={styles.toBox}>
            <Text style={styles.metaLabel}>Proposal Submitted To:</Text>
            <Text style={styles.clientNameBold}>{quotation.clientName}</Text>
            {quotation.clientCity && (
              <Text style={styles.clientCityText}>{quotation.clientCity}</Text>
            )}
            {quotation.attention && (
              <Text style={styles.attnText}>Kind Attn: {quotation.attention}</Text>
            )}
          </View>
          <View style={styles.dateBox}>
            <View style={styles.dateInnerBox}>
              <Text style={styles.quoteNumBadge}>{quotation.quotationNumber}</Text>
              <Text style={styles.dateValue}>Date: {formatDate(quotation.date)}</Text>
            </View>
          </View>
        </View>

        {/* Subject & Opening Salutation */}
        {quotation.subject && (
          <View style={styles.subjectContainer}>
            <Text style={styles.subjectText}>Sub: {quotation.subject}</Text>
          </View>
        )}

        {quotation.salutation && (
          <Text style={styles.salutationText}>{quotation.salutation}</Text>
        )}

        {quotation.introText && (
          <Text style={styles.introParagraph}>{quotation.introText}</Text>
        )}

        {/* Section 1: Understanding Brand & Objectives */}
        {((quotation.objectiveIntro && quotation.objectiveIntro.trim()) ||
          (quotation.includePillars !== false && quotation.pillars && quotation.pillars.length > 0)) && (
          <View wrap={false}>
            <Text style={styles.sectionHeading}>
              {quotation.objectiveHeading || '1. Understanding the Brand & Objective'}
            </Text>
            {quotation.objectiveIntro && (
              <Text style={styles.sectionSubtext}>{quotation.objectiveIntro}</Text>
            )}

            {quotation.includePillars !== false && quotation.pillars && quotation.pillars.length > 0 && (
              <View style={styles.pillarsContainer}>
                {quotation.pillars.map((pillar) => (
                  <View style={styles.pillarCard} key={pillar.id}>
                    <View style={styles.pillarHeader}>
                      <Text style={styles.pillarTitle}>{pillar.title}</Text>
                    </View>
                    <Text style={styles.pillarBody}>{pillar.description}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Philosophy Points */}
        {quotation.includePhilosophy !== false &&
          quotation.philosophyPoints &&
          quotation.philosophyPoints.length > 0 && (
          <View wrap={false}>
            <Text style={styles.philosophyTitle}>
              {quotation.philosophyTitle || 'Brand Marketing Philosophy'}
            </Text>
            {quotation.philosophyPoints.map((point, idx) => (
              <View style={styles.bulletRow} key={`phil-${idx}`}>
                <Text style={styles.bulletDot}>•</Text>
                <Text style={styles.bulletContent}>{point}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Section 2: Scope of Work */}
        {quotation.scopePhases && quotation.scopePhases.length > 0 && (
          <View>
            <Text style={styles.sectionHeading}>
              {quotation.scopeHeading || '2. Scope of Work'}
            </Text>
            {quotation.scopePhases.map((phase) => (
              <View style={styles.phaseBox} key={phase.id} wrap={false}>
                <View style={styles.phaseHeader}>
                  <Text style={styles.phaseTitleText}>{phase.phaseTitle}</Text>
                </View>

                {phase.deliverables &&
                  phase.deliverables.map((del) => (
                    <View style={styles.deliverableItem} key={del.id}>
                      <Text style={styles.deliverableTitle}>• {del.title}</Text>
                      {del.subtitle && (
                        <Text style={styles.deliverableSubtitle}>{del.subtitle}</Text>
                      )}
                      {del.indicativeDeliverables && (
                        <Text style={styles.deliverableIndicative}>
                          Indicative deliverables: {del.indicativeDeliverables}
                        </Text>
                      )}
                      {del.bulletPoints &&
                        del.bulletPoints.map((pt, pIdx) => (
                          <View style={styles.bulletRow} key={`del-pt-${pIdx}`}>
                            <Text style={styles.bulletDot}>-</Text>
                            <Text style={styles.bulletContent}>{pt}</Text>
                          </View>
                        ))}
                    </View>
                  ))}
              </View>
            ))}
          </View>
        )}

        {/* Section 3: Commercial Proposal */}
        {quotation.commercialItems && quotation.commercialItems.length > 0 && (
          <View wrap={false}>
            <Text style={styles.sectionHeading}>
              {quotation.commercialHeading || '3. Commercial Proposal'}
            </Text>

            <View style={styles.commercialTable}>
              <View style={styles.commercialTableHeader}>
                <Text style={styles.thService}>Service / Deliverable</Text>
                <Text style={styles.thInvestment}>Investment ({quotation.currency || 'INR'})</Text>
                <Text style={styles.thBilling}>Billing Arrangement</Text>
              </View>

              {quotation.commercialItems.map((item, idx) => (
                <View
                  style={[
                    styles.commercialTableRow,
                    { backgroundColor: idx % 2 === 1 ? '#faf7fc' : '#ffffff' },
                  ]}
                  key={item.id}
                >
                  <Text style={styles.tdService}>{item.service}</Text>
                  <Text style={styles.tdInvestment}>{formatQuotationAmount(item.investment, quotation.currency)}</Text>
                  <View style={styles.tdBilling}>
                    <Text style={styles.tdBillingText}>{item.billing}</Text>
                    {item.taxNote && (
                      <Text style={styles.tdTaxBadge}>{item.taxNote}</Text>
                    )}
                  </View>
                </View>
              ))}

              <View style={styles.commercialTableTotal}>
                <Text style={styles.tdTotalLabel}>Total Estimated Value</Text>
                <Text style={styles.tdTotalValue}>
                  {formatQuotationAmount(quotation.totalTentativeValue, quotation.currency)}
                </Text>
                <Text style={styles.tdTotalNote}>Taxes extra as applicable</Text>
              </View>
            </View>

            {quotation.pricingNotes && (
              <View style={styles.calloutBox}>
                <Text style={styles.calloutTitle}>
                  {quotation.pricingNotesHeading || 'Pricing Notes & Exclusions:'}
                </Text>
                <Text style={styles.calloutText}>{quotation.pricingNotes}</Text>
              </View>
            )}

            {quotation.clientInputsRequired && (
              <View style={styles.calloutBox}>
                <Text style={styles.calloutTitle}>
                  {quotation.clientInputsHeading || 'Client Inputs Required:'}
                </Text>
                <Text style={styles.calloutText}>{quotation.clientInputsRequired}</Text>
              </View>
            )}
          </View>
        )}

        {/* Section 4: Engagement Terms and Service Exclusions */}
        {((quotation.terms && quotation.terms.length > 0) ||
          (quotation.additionalExclusions && quotation.additionalExclusions.length > 0)) && (
          <View wrap={false}>
            <Text style={styles.sectionHeading}>
              {quotation.termsHeading || '4. Engagement Terms & Service Exclusions'}
            </Text>

            {quotation.terms && quotation.terms.length > 0 && (
              <View style={styles.termsList}>
                {quotation.terms.map((term, tIdx) => (
                  <View style={styles.termItem} key={`term-${tIdx}`}>
                    <Text style={styles.termBullet}>•</Text>
                    <Text style={styles.termContent}>
                      <Text style={styles.termTitleBold}>{term.title}: </Text>
                      {term.detail}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {quotation.additionalExclusions && quotation.additionalExclusions.length > 0 && (
              <View style={styles.termsList}>
                {quotation.additionalExclusions.map((ex, eIdx) => (
                  <View style={styles.termItem} key={`ex-${eIdx}`}>
                    <Text style={styles.termBullet}>•</Text>
                    <Text style={styles.termContent}>{ex}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Closing Note & Signatory Signoff */}
        <View style={styles.closingSection} wrap={false}>
          {quotation.closingNote && (
            <Text style={styles.closingText}>{quotation.closingNote}</Text>
          )}

          {quotation.thankYouNote && (
            <Text style={styles.thankYouText}>{quotation.thankYouNote}</Text>
          )}

          <View style={styles.signatoryContainer}>
            <View style={styles.signatoryLeft}>
              <Text style={styles.forCompanyText}>For Shankara Online Solutions</Text>
              {SIGNATURE_DATA_URI ? (
                <Image src={SIGNATURE_DATA_URI} style={styles.signatureImage} />
              ) : (
                <View style={styles.signaturePlaceholder} />
              )}
              <Text style={styles.signatoryName}>
                {quotation.signatoryName || 'Manjunath Naik S'}
              </Text>
              <Text style={styles.signatoryRole}>
                {quotation.signatoryDesignation || 'Founder & CEO'}
              </Text>
              <Text style={styles.signatoryContacts}>
                {quotation.signatoryPhone || '+91-9986703161'} |{' '}
                {quotation.signatoryEmail || 'naik@shankaraonline.com'}
              </Text>
              <Text style={styles.signatoryContacts}>
                {quotation.signatoryWebsite || 'www.shankaraonline.com'}
              </Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
};
