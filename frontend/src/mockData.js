export const roomsList = [
  { id: '101', name: 'Premium Suite 101', type: 'Suite', status: 'Available', charge: 5000 },
  { id: '102', name: 'Deluxe Room 102', type: 'Deluxe', status: 'Occupied', charge: 3500 },
  { id: '103', name: 'Deluxe Room 103', type: 'Deluxe', status: 'Available', charge: 3500 },
  { id: '201', name: 'Standard Room 201', type: 'Standard', status: 'Available', charge: 2000 },
  { id: '202', name: 'Standard Room 202', type: 'Standard', status: 'Occupied', charge: 2000 },
  { id: '203', name: 'Standard Room 203', type: 'Standard', status: 'Available', charge: 2000 }
];

export const initialPatients = [
  {
    id: 'P-101',
    name: 'John Doe',
    phone: '+91 98765 43210',
    age: 42,
    gender: 'Male',
    blood_group: 'O+ ',
    medical_conditions: 'Chronic Fatigue, Mild Fatty Liver',
    email: 'john.doe@example.com',
    address: '123, Green Avenue, Cityville',
    registered_at: '2026-05-10'
  },
  {
    id: 'P-102',
    name: 'Sarah Jenkins',
    phone: '+91 98765 00123',
    age: 35,
    gender: 'Female',
    blood_group: 'A+',
    medical_conditions: 'Metabolic Dysfunction, Anxiety, IBS',
    email: 'sarah.j@example.com',
    address: '45B, Skyline Towers, Metro City',
    registered_at: '2026-05-12'
  },
  {
    id: 'P-103',
    name: 'Priya Sharma',
    phone: '+91 91234 56789',
    age: 28,
    gender: 'Female',
    blood_group: 'B+',
    medical_conditions: 'PCOS, Migraine, Gut Dysbiosis',
    email: 'priya.sharma@example.com',
    address: 'Flat 402, Lotus Residency, Bangalore',
    registered_at: '2026-05-15'
  },
  {
    id: 'P-104',
    name: 'Raj Patel',
    phone: '+91 88776 65544',
    age: 55,
    gender: 'Male',
    blood_group: 'AB+',
    medical_conditions: 'Hypertension, Chronic Constipation, Toxemia',
    email: 'raj.patel@example.com',
    address: '78, Orchid Gardens, Ahmedabad',
    registered_at: '2026-05-18'
  }
];

export const initialDoctors = [
  { id: 'DOC-01', name: 'Dr. Evelyn Carter', designation: 'Chief Clinical Consultant', status: 'Available' },
  { id: 'DOC-02', name: 'Dr. Julian Bashir', designation: 'Naturopathy Specialist', status: 'Available' },
  { id: 'DOC-03', name: 'Dr. Priya Sharma', designation: 'Ayurvedic Detox Lead', status: 'On Leave' }
];

export const initialPhoneCalls = [
  {
    id: 'C-01',
    patient_name: 'John Doe',
    phone: '+91 98765 43210',
    date: '2026-05-20',
    time: '09:15 AM',
    notes: 'Inquired about liver detox program. Booked appointment for afternoon.',
    status: 'Booked',
    assigned_to: 'Sarah (Receptionist)'
  },
  {
    id: 'C-02',
    patient_name: 'David Miller',
    phone: '+91 98123 45678',
    date: '2026-05-20',
    time: '10:30 AM',
    notes: 'Called to check one-day stay availability for next week. Will call back.',
    status: 'Inquiry Only',
    assigned_to: 'Sarah (Receptionist)'
  },
  {
    id: 'C-03',
    patient_name: 'Priya Sharma',
    phone: '+91 91234 56789',
    date: '2026-05-20',
    time: '11:00 AM',
    notes: 'Requested rescheduling of her review. Rebooked for today.',
    status: 'Rescheduled',
    assigned_to: 'Sarah (Receptionist)'
  }
];

export const initialAppointments = [
  {
    id: 'A-201',
    patient_id: 'P-101',
    date: '2026-05-20',
    time: '02:00 PM',
    source: 'Phone Call',
    status: 'Checked-in',
    notes: 'First time consultation for liver detox.'
  },
  {
    id: 'A-202',
    patient_id: 'P-102',
    date: '2026-05-20',
    time: '11:30 AM',
    source: 'WhatsApp Link',
    status: 'Completed',
    notes: 'Follow-up on previous cleanse recommendations.'
  },
  {
    id: 'A-203',
    patient_id: 'P-103',
    date: '2026-05-20',
    time: '04:30 PM',
    source: 'Phone Call',
    status: 'Scheduled',
    notes: 'Review after completing 3-day colon cleanse.'
  },
  {
    id: 'A-204',
    patient_id: 'P-104',
    date: '2026-05-21',
    time: '10:00 AM',
    source: 'Meta App',
    status: 'Scheduled',
    notes: 'Severe bloating issues, seeking Ayurvedic detox.'
  }
];

export const initialConsultations = [
  {
    id: 'CON-301',
    appointment_id: 'A-202',
    patient_id: 'P-102',
    doctor_name: 'Dr. Evelyn Carter',
    date: '2026-05-20',
    vitals: { bp: '120/80', weight: '64 kg', pulse: '76 bpm' },
    symptoms: 'Mild abdominal discomfort, acid reflux, insomnia.',
    diagnosis: 'Gut microbiome imbalance with heavy metal exposure symptoms.',
    notes: 'Patient responded well to initial gut rest. Needs structured colon hydrotherapy and liver flush.',
    detox_recommended: true,
    detox_type: 'Colon Hydrotherapy + Liver Flush Combo'
  }
];

export const initialDetoxSessions = [
  {
    id: 'DTX-401',
    patient_id: 'P-102',
    consultation_id: 'CON-301',
    scheduled_date: '2026-05-20',
    type: 'Colon Hydrotherapy + Liver Flush Combo',
    status: 'In-Progress',
    cost: 7500,
    technician: 'Nolan Ross',
    notes: 'Session started at 12:00 PM. Patient is calm and responding well to the warmth packs.'
  },
  {
    id: 'DTX-402',
    patient_id: 'P-101',
    consultation_id: '',
    scheduled_date: '2026-05-22',
    type: 'Deep Tissue Cell Detox & Liver Flush',
    status: 'Scheduled',
    cost: 8500,
    technician: 'Nolan Ross',
    notes: 'Pre-session fasting protocol initiated.'
  }
];

export const initialStayManagement = [
  {
    id: 'STY-501',
    patient_id: 'P-102',
    detox_session_id: 'DTX-401',
    room_id: '102',
    room_name: 'Deluxe Room 102',
    check_in_time: '2026-05-20 09:30 AM',
    check_out_time: '',
    status: 'Admitted',
    nursing_checklist: {
      vitals_checked_morning: true,
      detox_liquids_served: true,
      post_procedure_bath: false,
      resting_comfortably: true
    },
    notes: 'Admitted for one-day detox stay. Relaxing post hydrotherapy session.'
  },
  {
    id: 'STY-502',
    patient_id: 'P-104',
    detox_session_id: '',
    room_id: '202',
    room_name: 'Standard Room 202',
    check_in_time: '2026-05-20 08:00 AM',
    check_out_time: '2026-05-20 05:00 PM',
    status: 'Discharged',
    nursing_checklist: {
      vitals_checked_morning: true,
      detox_liquids_served: true,
      post_procedure_bath: true,
      resting_comfortably: true
    },
    notes: 'Completed his day-stay program. Vitals stable at discharge.'
  }
];

export const initialPrescriptions = [
  {
    id: 'PRSC-601',
    consultation_id: 'CON-301',
    patient_id: 'P-102',
    date: '2026-05-20',
    doctor_name: 'Dr. Evelyn Carter',
    medicines: [
      { name: 'Triphala Laxative Extract', dosage: '1 Capsule', frequency: 'Bedtime', duration: '14 Days' },
      { name: 'Active Charcoal Capsules', dosage: '500mg', frequency: '2 Hours Post-detox', duration: '3 Days' },
      { name: 'Organic Milk Thistle Complex', dosage: '1 Tablet', frequency: 'Twice daily before meals', duration: '30 Days' }
    ],
    home_care: 'Avoid dairy, refined sugar, and processed foods. Drink at least 3 liters of warm alkaline water daily. Do light yoga in the morning.'
  }
];

export const initialDietCharts = [
  {
    id: 'DIET-701',
    consultation_id: 'CON-301',
    patient_id: 'P-102',
    date: '2026-05-20',
    doctor_name: 'Dr. Evelyn Carter',
    meals: {
      morning: 'Warm lemon juice with ginger and organic honey',
      breakfast: 'Green smoothie with celery, cucumber, apple, spinach, and hemp seeds',
      lunch: 'Steamed vegetables (zucchini, carrots, ash gourd) with organic quinoa and a dash of olive oil',
      evening: 'Herbal detox infusion tea with pumpkin seeds',
      dinner: 'Clear vegetable broth with boiled lentils and fresh coriander seeds'
    },
    remarks: 'Maintain a 14-hour intermittent fasting window (Dinner at 7:00 PM, Breakfast at 9:00 AM).'
  }
];

export const initialFollowups = [
  {
    id: 'FUP-801',
    patient_id: 'P-101',
    scheduled_date: '2026-05-22',
    notes: 'Call to confirm liver flush preparation fasting compliance.',
    status: 'Pending',
    created_at: '2026-05-20'
  },
  {
    id: 'FUP-802',
    patient_id: 'P-102',
    scheduled_date: '2026-05-21',
    notes: 'Follow-up call on post-stay recovery and check if detox reaction occurred.',
    status: 'Pending',
    created_at: '2026-05-20'
  },
  {
    id: 'FUP-803',
    patient_id: 'P-103',
    scheduled_date: '2026-05-19',
    notes: 'Confirm check-in time for review.',
    status: 'Completed',
    created_at: '2026-05-18'
  }
];

export const initialWhatsappLogs = [
  {
    id: 'WA-901',
    patient_id: 'P-102',
    patient_name: 'Sarah Jenkins',
    phone: '+91 98765 00123',
    type: 'Booking Confirmation',
    message_text: 'Dear Sarah, your appointment with Dr. Evelyn Carter is confirmed for Today at 11:30 AM. Reply HELP for queries. - Manthrralaya\'s Wellness',
    sent_at: '2026-05-20 09:00 AM',
    status: 'Read',
    template_name: 'appointment_confirm'
  },
  {
    id: 'WA-902',
    patient_id: 'P-102',
    patient_name: 'Sarah Jenkins',
    phone: '+91 98765 00123',
    type: 'PDF Delivery',
    message_text: 'Dear Sarah, here is your customized Diet Chart and Prescription from Dr. Evelyn Carter: https://manthrralayas.co/shared/docs/pdf_601. Please download and follow the instructions. - Manthrralaya\'s Wellness',
    sent_at: '2026-05-20 01:15 PM',
    status: 'Delivered',
    template_name: 'document_delivery_pdf'
  },
  {
    id: 'WA-903',
    patient_id: 'P-101',
    patient_name: 'John Doe',
    phone: '+91 98765 43210',
    type: 'Session Reminder',
    message_text: 'Hello John, your Deep Tissue Cell Detox session is scheduled for May 22 at 09:00 AM. Please begin your liquid fasting protocol tomorrow. - Manthrralaya\'s Wellness',
    sent_at: '2026-05-20 02:00 PM',
    status: 'Sent',
    template_name: 'detox_prep_reminder'
  }
];

export const initialReviews = [
  {
    id: 'REV-01',
    patient_name: 'Sarah Jenkins',
    patient_id: 'P-102',
    rating: 5,
    comments: 'Exceptional stay. The liver flush procedure was done under excellent clinical care, and the nursing staff was extremely polite. Highly recommended!',
    date: '2026-05-20'
  },
  {
    id: 'REV-02',
    patient_name: 'Raj Patel',
    patient_id: 'P-104',
    rating: 4,
    comments: 'Very effective Ayurvedic detox stay. Room was clean, food was completely alkaline. WhatsApp session alerts were very helpful.',
    date: '2026-05-20'
  }
];
