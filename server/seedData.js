// Initial seed data for Shankara Online Solutions Admin Panel MongoDB Collections

export const initialSeedData = {
  invoices: [
    {
      id: '0021/2026-27',
      client: 'M/s Tamagna Personalcare Pvt Ltd',
      date: '2026-08-16',
      amount: 24780,
      subtotal: 21000,
      gst: 3780,
      cgst: 1890,
      sgst: 1890,
      igst: 0,
      isInterState: false,
      status: 'Paid',
      type: 'COMPANY',
      recurringTemplateId: 'rec-inv-1',
      items: [
        { id: 'item-1', desc: 'Social media management (July-August 2026)', sac: '998361', units: 1, rate: 21000 }
      ],
      notes: 'Monthly digital marketing retainer fee.'
    },
    {
      id: '0022/2026-27',
      client: 'The Art of Living Foundation',
      date: '2026-09-07',
      amount: 18000,
      subtotal: 18000,
      gst: 0,
      status: 'Pending',
      type: 'PERSONAL',
      recurringTemplateId: 'rec-inv-2',
      items: [
        { id: 'item-2a', desc: 'Digital Marketing Services for August 2026', units: 1, rate: 12000 },
        { id: 'item-2b', desc: 'Content Writing Services - August 2026 (Blogs for artofliving.sg)', units: 2, rate: 3000 }
      ],
      notes: 'Non-GST personal consulting agreement.'
    },
    {
      id: '0023/2026-27',
      client: 'M/s Tamagna Personalcare Pvt Ltd',
      date: '2026-10-05',
      amount: 29500,
      subtotal: 25000,
      gst: 4500,
      cgst: 2250,
      sgst: 2250,
      igst: 0,
      isInterState: false,
      status: 'Paid',
      type: 'COMPANY',
      recurringTemplateId: 'rec-inv-1',
      items: [
        { id: 'item-3', desc: 'Performance Marketing & Creative Retainer (October 2026)', sac: '998361', units: 1, rate: 25000 }
      ],
      notes: 'Paid via direct bank transfer.'
    },
    {
      id: '0024/2026-27',
      client: 'The Art of Living Foundation',
      date: '2026-10-12',
      amount: 22000,
      subtotal: 22000,
      gst: 0,
      status: 'Paid',
      type: 'PERSONAL',
      recurringTemplateId: 'rec-inv-2',
      items: [
        { id: 'item-4', desc: 'Global Web Portal & Event Campaign Support (October 2026)', units: 1, rate: 22000 }
      ]
    },
    {
      id: '0025/2026-27',
      client: 'Tech Solutions Inc',
      date: '2026-10-18',
      amount: 41300,
      subtotal: 35000,
      gst: 6300,
      cgst: 0,
      sgst: 0,
      igst: 6300,
      isInterState: true,
      status: 'Paid',
      type: 'COMPANY',
      recurringTemplateId: 'rec-inv-3',
      items: [
        { id: 'item-5a', desc: 'Dedicated Engineering & Maintenance SLA (October 2026)', sac: '998314', units: 1, rate: 30000 },
        { id: 'item-5b', desc: 'Server Monitoring & Backup Retainer', sac: '998315', units: 1, rate: 5000 }
      ],
      notes: 'Inter-State client (Mumbai, Maharashtra). 18% IGST applicable.'
    },
    {
      id: '0026/2026-27',
      client: 'M/s Tamagna Personalcare Pvt Ltd',
      date: '2026-11-02',
      amount: 33040,
      subtotal: 28000,
      gst: 5040,
      cgst: 2520,
      sgst: 2520,
      igst: 0,
      isInterState: false,
      status: 'Paid',
      type: 'COMPANY',
      recurringTemplateId: 'rec-inv-1',
      items: [
        { id: 'item-6a', desc: 'Base Digital Marketing & Brand Retainer (November 2026)', sac: '998361', units: 1, rate: 21000 },
        { id: 'item-6b', desc: 'Festive Diwali Campaign Creative Surcharge', sac: '998361', units: 1, rate: 7000 }
      ]
    }
  ],

  recurring_templates: [
    {
      id: 'rec-inv-1',
      title: 'Monthly Performance Marketing & Brand Retainer',
      clientName: 'M/s Tamagna Personalcare Pvt Ltd',
      type: 'COMPANY',
      frequency: 'Monthly',
      dayOfMonth: 1,
      isActive: true,
      isInterState: false,
      items: [
        { id: 'item-1', desc: 'Social media management (July-August 2026)', sac: '998361', units: 1, rate: 21000 }
      ],
      subtotal: 21000,
      cgst: 1890,
      sgst: 1890,
      igst: 0,
      gst: 3780,
      total: 24780,
      notes: 'Intra-State Karnataka retainer due on 1st. 9% CGST + 9% SGST applicable.'
    },
    {
      id: 'rec-inv-2',
      title: 'Web Maintenance & Cloud Support Retainer',
      clientName: 'The Art of Living Foundation',
      type: 'PERSONAL',
      frequency: 'Monthly',
      dayOfMonth: 5,
      isActive: true,
      isInterState: false,
      items: [
        { id: 'item-2a', desc: 'Digital Marketing Services for August 2026', units: 1, rate: 12000 },
        { id: 'item-2b', desc: 'Content Writing Services - August 2026 (Blogs for artofliving.sg)', units: 2, rate: 3000 }
      ],
      subtotal: 18000,
      cgst: 0,
      sgst: 0,
      igst: 0,
      gst: 0,
      total: 18000,
      notes: 'Non-GST personal consulting agreement.'
    },
    {
      id: 'rec-inv-3',
      title: 'Enterprise Software SLA & Cloud Retainer',
      clientName: 'Tech Solutions Inc',
      type: 'COMPANY',
      frequency: 'Monthly',
      dayOfMonth: 10,
      isActive: true,
      isInterState: true,
      items: [
        { id: 'item-3a', desc: 'Dedicated Engineering & Maintenance SLA', sac: '998314', units: 1, rate: 30000 },
        { id: 'item-3b', desc: 'Server Monitoring & Backup Retainer', sac: '998315', units: 1, rate: 5000 }
      ],
      subtotal: 35000,
      cgst: 0,
      sgst: 0,
      igst: 6300,
      gst: 6300,
      total: 41300,
      notes: 'Inter-State client (Mumbai, Maharashtra). 18% IGST applicable.'
    }
  ],

  credit_notes: [
    {
      id: 'CN/2026-27/001',
      originalInvoiceId: '0021/2026-27',
      originalInvoiceDate: '2026-08-16',
      client: 'M/s Tamagna Personalcare Pvt Ltd',
      date: '2026-09-02',
      amount: 5900,
      subtotal: 5000,
      gst: 900,
      cgst: 450,
      sgst: 450,
      igst: 0,
      isInterState: false,
      type: 'COMPANY',
      reason: 'Post-Sale Discount / Commercial Settlement',
      items: [
        { id: 'cn-item-1', desc: 'Commercial goodwill discount on Q2 digital retainer', units: 1, rate: 5000 }
      ],
      notes: 'Credit note adjusted against upcoming October retainer.'
    }
  ],

  clients: [
    {
      id: '1',
      name: 'M/s Tamagna Personalcare Pvt Ltd',
      email: 'contact@tamagna.com',
      phone: '+91 9876543210',
      gstin: '29ABICS5363G1ZY',
      address: '33, Gerupalya, Kumbalagodu, Behind KIADB Phase-2, Bangalore, Karnataka – 560074',
      state: 'Karnataka (29)'
    },
    {
      id: '2',
      name: 'The Art of Living Foundation',
      email: 'media@artofliving.org',
      phone: '+91 9876543211',
      gstin: '',
      address: '21st KM Kanakapura Road, Udayapura, Bangalore, Karnataka – 560082',
      state: 'Karnataka (29)'
    },
    {
      id: '3',
      name: 'Tech Solutions Inc',
      email: 'billing@techsolutions.com',
      phone: '+91 9876543212',
      gstin: '27AABCT3518Q1ZS',
      address: '402, High-Tech Tower, Senapati Bapat Marg, Lower Parel, Mumbai, Maharashtra – 400013',
      state: 'Maharashtra (27)'
    }
  ],

  expenses: [
    { id: 'exp-nov-1', description: 'Client Lunch & Strategy Meeting', category: 'Meals', amount: 3800, date: '2026-11-04', isRecurring: false },
    { id: 'exp-nov-2', description: 'Office Pantry Supplies & Snacks', category: 'Office', amount: 2650, date: '2026-11-12', isRecurring: false },
    { id: 'exp-nov-3', description: 'Emergency Cloud Server Addon', category: 'IT', amount: 4500, date: '2026-11-15', isRecurring: false },
    { id: 'exp-oct-1', description: 'Staff Salaries & Payroll', category: 'Payroll', amount: 160000, date: '2026-10-01', isRecurring: true, recurringTemplateId: 'rec-1' },
    { id: 'exp-oct-2', description: 'Office Rent & Maintenance', category: 'Office', amount: 35000, date: '2026-10-05', isRecurring: true, recurringTemplateId: 'rec-2' },
    { id: 'exp-oct-3', description: 'High-Speed Broadband & Telecom', category: 'Office', amount: 3500, date: '2026-10-07', isRecurring: true, recurringTemplateId: 'rec-4' },
    { id: 'exp-oct-4', description: 'Software Subscriptions (Google Workspace, AWS, Figma)', category: 'IT', amount: 12500, date: '2026-10-10', isRecurring: true, recurringTemplateId: 'rec-3' },
    { id: 'exp-oct-5', description: 'Accounting & Compliance Retainer', category: 'Operations', amount: 8000, date: '2026-10-15', isRecurring: true, recurringTemplateId: 'rec-5' }
  ],

  subscriptions: [
    {
      id: 'sub-1',
      toolName: 'Google Workspace Business Standard',
      category: 'SaaS & Software',
      pricing: 10400,
      currency: 'INR',
      inrCost: 10400,
      duration: 'Monthly',
      ownership: 'Company',
      startDate: '2025-01-10',
      nextDueDate: '2026-12-10',
      status: 'Active',
      description: 'Corporate emails, Google Meet, Drive cloud storage for team'
    },
    {
      id: 'sub-2',
      toolName: 'AWS Cloud Infrastructure (Production)',
      category: 'Cloud & Hosting',
      pricing: 28500,
      currency: 'INR',
      inrCost: 28500,
      duration: 'Monthly',
      ownership: 'Company',
      startDate: '2025-02-01',
      nextDueDate: '2026-12-01',
      status: 'Active',
      description: 'EC2 instances, S3, RDS database servers'
    },
    {
      id: 'sub-3',
      toolName: 'Figma Organization & FigJam Pro',
      category: 'Design & Creative',
      pricing: 95,
      currency: 'USD',
      inrCost: 7980,
      duration: 'Monthly',
      ownership: 'Company',
      startDate: '2025-04-28',
      nextDueDate: '2026-11-28',
      status: 'Active',
      description: 'Product design, client prototypes, visual brand libraries'
    }
  ],

  compliances: [
    {
      id: 'comp-1',
      title: 'Monthly TDS Payment (Challan ITNS 281)',
      category: 'TDS Payment',
      applicableFor: 'Company (LLP)',
      dueDate: '2026-11-07',
      status: 'Completed',
      notes: 'TDS for contractor payments, professional fees deposited'
    },
    {
      id: 'comp-2',
      title: 'GSTR-1 Monthly Outward Supplies',
      category: 'GSTR-1',
      applicableFor: 'Company (LLP)',
      dueDate: '2026-11-11',
      status: 'Completed',
      notes: 'Reporting of all B2B sales invoices'
    },
    {
      id: 'comp-3',
      title: 'GSTR-3B Monthly Summary Return & Tax Remittance',
      category: 'GSTR-3B',
      applicableFor: 'Company (LLP)',
      dueDate: '2026-11-20',
      status: 'Completed',
      notes: 'Summary return & GST remittance'
    },
    {
      id: 'comp-4',
      title: 'Advance Tax 3rd Installment (75%)',
      category: 'Advance Tax',
      applicableFor: 'Individual',
      dueDate: '2026-12-15',
      status: 'Pending',
      notes: 'Q3 Advance income tax payment deadline'
    }
  ],

  billing_profiles: {
    id: 'default',
    company: {
      legalName: 'M/s SHANKARA ONLINE SOLUTIONS LLP.',
      tradeName: 'Shankara Online Solutions',
      gstin: '29ADXFS0028E1ZT',
      pan: 'ADXFS0028E',
      address: '#33, 2nd Cross, Shankarappa Layout,\nH.V Halli, Near Manipal Hospital Road,\nRajarajeshwari Nagar',
      city: 'Bengaluru',
      state: 'Karnataka',
      stateCode: '29',
      pincode: '560098',
      email: 'naik@shankaraonline.com',
      phone: '+91-9986703161',
      bankDetails: {
        accountName: 'SHANKARA ONLINE SOLUTIONS LLP',
        accountNumber: '50200041387947',
        bankName: 'HDFC BANK',
        branch: 'Rajarajeshwari Nagar Branch, Bengaluru',
        ifsc: 'HDFC0001039',
        upiId: 'smnaik@UPI'
      },
      authorizedSignatory: {
        name: 'Manjunath Naik S',
        designation: '(Founder, CEO)'
      }
    },
    personal: {
      legalName: 'Manjunath Naik S',
      tradeName: 'Manjunath Naik Consulting',
      pan: 'ADXFS0028E',
      address: '#33, 2nd Cross, Shankarappa Layout, Rajarajeshwari Nagar',
      city: 'Bengaluru',
      state: 'Karnataka',
      stateCode: '29',
      pincode: '560098',
      email: 'naik@shankaraonline.com',
      phone: '+91-9986703161',
      bankDetails: {
        accountName: 'MANJUNATH NAIK S',
        accountNumber: '50100023456789',
        bankName: 'HDFC BANK',
        branch: 'Rajarajeshwari Nagar, Bengaluru',
        ifsc: 'HDFC0001039',
        upiId: 'smnaik@UPI'
      },
      authorizedSignatory: {
        name: 'Manjunath Naik S',
        designation: 'Proprietor & Consultant'
      }
    }
  },

  employees: [
    {
      id: '1',
      name: 'John Doe',
      role: 'Software Engineer',
      email: 'john@example.com',
      phone: '9876543210',
      address: '123 Tech Park, Bangalore',
      pan: 'ABCDE1234F',
      grossSalary: 85000,
      bankName: 'HDFC Bank',
      accountNumber: '1234567890',
      ifscCode: 'HDFC0001234',
      dateOfJoining: '2025-01-15'
    },
    {
      id: '2',
      name: 'Jane Smith',
      role: 'Designer',
      email: 'jane@example.com',
      phone: '9876543211',
      address: '456 Design Studio, Mumbai',
      pan: 'FGHIJ5678K',
      grossSalary: 75000,
      bankName: 'ICICI Bank',
      accountNumber: '0987654321',
      ifscCode: 'ICIC0005678',
      dateOfJoining: '2025-03-01'
    }
  ],

  ad_ledger: [
    {
      id: '1',
      transactionId: 'TXN-9823471',
      client: 'M/s Tamagna Personalcare Pvt Ltd',
      platform: 'Google Ads',
      type: 'Spend',
      amount: 5000,
      date: '2026-10-02'
    },
    {
      id: '2',
      transactionId: 'TXN-1029384',
      client: 'The Art of Living Foundation',
      platform: 'Meta Ads',
      type: 'Spend',
      amount: 8000,
      date: '2026-10-06'
    },
    {
      id: '3',
      transactionId: 'DEP-10001',
      client: 'The Art of Living Foundation',
      platform: 'Bank Transfer',
      type: 'Deposit',
      amount: 15000,
      date: '2026-10-01'
    }
  ],

  proposals: [
    {
      id: 'prop-1',
      proposalNumber: 'PROP/2026-27/001',
      clientName: 'M/s Tamagna Personalcare Pvt Ltd',
      title: 'Q4 Omnichannel Growth & Meta Ad Scaling Scope',
      scopeOfWork: 'End-to-end performance creative production, conversion tracking and monthly scaling',
      monthlyRetainer: 35000,
      variableAdBudget: 150000,
      status: 'Accepted',
      probability: 100,
      targetCloseDate: '2026-10-25'
    }
  ]
};
