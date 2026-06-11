// // mockData.js

// export const roomsList = [
//   { id: '101', name: 'Premium Suite 101', type: 'Suite', status: 'Available', charge: 5000 },
//   { id: '102', name: 'Deluxe Room 102', type: 'Deluxe', status: 'Occupied', charge: 3500 },
//   { id: '103', name: 'Deluxe Room 103', type: 'Deluxe', status: 'Available', charge: 3500 },
//   { id: '201', name: 'Standard Room 201', type: 'Standard', status: 'Available', charge: 2000 },
//   { id: '202', name: 'Standard Room 202', type: 'Standard', status: 'Occupied', charge: 2000 },
//   { id: '203', name: 'Standard Room 203', type: 'Standard', status: 'Available', charge: 2000 }
// ];

// const todayDate = new Date().toISOString().split('T')[0];

// export const initialPatients = [
//   {
//     id: 'P-101',
//     name: 'John Doe',
//     phone: '+91 98765 43210',
//     age: 42,
//     gender: 'Male',
//     blood_group: 'O+',
//     medical_conditions: 'Chronic Fatigue, Mild Fatty Liver',
//     email: 'john.doe@example.com',
//     location: 'Salem',
//     address: '123, Green Avenue, Salem',
//     registered_at: '2026-05-10'
//   },
//   {
//     id: 'P-102',
//     name: 'Sarah Jenkins',
//     phone: '+91 98765 00123',
//     age: 35,
//     gender: 'Female',
//     blood_group: 'A+',
//     medical_conditions: 'Metabolic Dysfunction, Anxiety, IBS',
//     email: 'sarah.j@example.com',
//     location: 'Erode',
//     address: '45B, Skyline Towers, Erode',
//     registered_at: '2026-05-12'
//   },
//   {
//     id: 'P-103',
//     name: 'Priya Sharma',
//     phone: '+91 91234 56789',
//     age: 28,
//     gender: 'Female',
//     blood_group: 'B+',
//     medical_conditions: 'PCOS, Migraine, Gut Dysbiosis',
//     email: 'priya.sharma@example.com',
//     location: 'Coimbatore',
//     address: 'Flat 402, Lotus Residency, Coimbatore',
//     registered_at: '2026-05-15'
//   },
//   {
//     id: 'P-104',
//     name: 'Raj Patel',
//     phone: '+91 88776 65544',
//     age: 55,
//     gender: 'Male',
//     blood_group: 'AB+',
//     medical_conditions: 'Hypertension, Chronic Constipation, Toxemia',
//     email: 'raj.patel@example.com',
//     location: 'Trichy',
//     address: '78, Orchid Gardens, Trichy',
//     registered_at: '2026-05-18'
//   },
//   // New patients added for today's detox appointments
//   {
//     id: 'P-105',
//     name: 'Michael Chen',
//     phone: '+91 99887 66554',
//     age: 48,
//     gender: 'Male',
//     blood_group: 'A+',
//     medical_conditions: 'Chronic fatigue, liver congestion, high cholesterol',
//     email: 'michael.chen@example.com',
//     location: 'Chennai',
//     address: '15, Green Meadows, Chennai',
//     registered_at: todayDate
//   },
//   {
//     id: 'P-106',
//     name: 'Deepa Nair',
//     phone: '+91 97654 32109',
//     age: 52,
//     gender: 'Female',
//     blood_group: 'O+',
//     medical_conditions: 'Toxin overload, bloating, skin issues',
//     email: 'deepa.nair@example.com',
//     location: 'Bangalore',
//     address: '8/2, Brigade Road, Bangalore',
//     registered_at: todayDate
//   },
//   {
//     id: 'P-107',
//     name: 'Ramesh Iyer',
//     phone: '+91 96543 21098',
//     age: 61,
//     gender: 'Male',
//     blood_group: 'B+',
//     medical_conditions: 'Arthritis, digestive issues, hypertension',
//     email: 'ramesh.iyer@example.com',
//     location: 'Hyderabad',
//     address: '22, Jubilee Hills, Hyderabad',
//     registered_at: todayDate
//   }
// ];

// export const initialDoctors = [
//   { id: 'DOC-01', name: 'Dr. Evelyn Carter', designation: 'Chief Clinical Consultant', status: 'Available' },
//   { id: 'DOC-02', name: 'Dr. Julian Bashir', designation: 'Naturopathy Specialist', status: 'Available' },
//   { id: 'DOC-03', name: 'Dr. Priya Sharma', designation: 'Ayurvedic Detox Lead', status: 'On Leave' }
// ];

// export const initialPhoneCalls = [
//   {
//     id: 'C-01',
//     patient_name: 'John Doe',
//     phone: '+91 98765 43210',
//     date: todayDate,
//     time: '09:15 AM',
//     notes: 'Inquired about liver detox program. Booked appointment for afternoon.',
//     status: 'Booked',
//     assigned_to: 'Sarah (Receptionist)'
//   },
//   {
//     id: 'C-02',
//     patient_name: 'David Miller',
//     phone: '+91 98123 45678',
//     date: todayDate,
//     time: '10:30 AM',
//     notes: 'Called to check one-day stay availability for next week. Will call back.',
//     status: 'Inquiry Only',
//     assigned_to: 'Sarah (Receptionist)'
//   },
//   {
//     id: 'C-03',
//     patient_name: 'Priya Sharma',
//     phone: '+91 91234 56789',
//     date: todayDate,
//     time: '11:00 AM',
//     notes: 'Requested rescheduling of her review. Rebooked for today.',
//     status: 'Rescheduled',
//     assigned_to: 'Sarah (Receptionist)'
//   },
//   {
//     id: 'C-04',
//     patient_name: 'Michael Chen',
//     phone: '+91 99887 66554',
//     date: todayDate,
//     time: '08:30 AM',
//     notes: 'Called to inquire about full body detox program. Booked appointment for today 9AM.',
//     status: 'Booked',
//     assigned_to: 'Sarah (Receptionist)'
//   },
//   {
//     id: 'C-05',
//     patient_name: 'Deepa Nair',
//     phone: '+91 97654 32109',
//     date: todayDate,
//     time: '10:15 AM',
//     notes: 'WhatsApp inquiry about colon hydrotherapy. Booked session for 1PM today.',
//     status: 'Booked',
//     assigned_to: 'Sarah (Receptionist)'
//   },
//   {
//     id: 'C-06',
//     patient_name: 'Ramesh Iyer',
//     phone: '+91 96543 21098',
//     date: todayDate,
//     time: '12:00 PM',
//     notes: 'Called for liver detox consultation. Booked for 3:30 PM today.',
//     status: 'Booked',
//     assigned_to: 'Sarah (Receptionist)'
//   }
// ];

// export const initialAppointments = [
//   {
//     id: 'A-201',
//     patient_id: 'P-101',
//     date: todayDate,
//     session: 'AN',
//     source: 'Phone Call',
//     status: 'Scheduled',
//     appointmentType: 'Initial consultation',
//     notes: 'First time consultation for liver detox.'
//   },
//   {
//     id: 'A-202',
//     patient_id: 'P-102',
//     date: todayDate,
//     session: 'FN',
//     source: 'WhatsApp Link',
//     status: 'Completed',
//     appointmentType: 'Review',
//     notes: 'Follow-up on previous cleanse recommendations.'
//   },
//   {
//     id: 'A-203',
//     patient_id: 'P-103',
//     date: todayDate,
//     session: 'AN',
//     source: 'Phone Call',
//     status: 'Scheduled',
//     appointmentType: 'Review',
//     notes: 'Review after completing 3-day colon cleanse.'
//   },
//   {
//     id: 'A-204',
//     patient_id: 'P-104',
//     date: '2026-05-21',
//     session: 'FN',
//     source: 'Meta App',
//     status: 'Scheduled',
//     appointmentType: 'Detox',
//     notes: 'Severe bloating issues, seeking Ayurvedic detox.'
//   },
//   {
//     id: 'A-205',
//     patient_id: 'P-101',
//     date: '2026-05-21',
//     session: 'FN',
//     source: 'Phone Call',
//     status: 'Scheduled',
//     appointmentType: 'Review',
//     notes: 'Patient returned for follow-up on liver support plan.'
//   },
//   {
//     id: 'A-206',
//     patient_id: 'P-102',
//     date: '2026-05-21',
//     session: 'AN',
//     source: 'WhatsApp Link',
//     status: 'Scheduled',
//     appointmentType: 'Review',
//     notes: 'Second review after starting detox diet.'
//   },
//   // New detox appointments for today
//   {
//     id: 'A-207',
//     patient_id: 'P-105',
//     date: todayDate,
//     session: 'FN',
//     source: 'Phone Call',
//     status: 'Scheduled',
//     appointmentType: 'Detox',
//     notes: 'Full body detox - 3 day program'
//   },
//   {
//     id: 'A-208',
//     patient_id: 'P-106',
//     date: todayDate,
//     session: 'AN',
//     source: 'WhatsApp Link',
//     status: 'Scheduled',
//     appointmentType: 'Detox',
//     notes: 'Colon hydrotherapy session'
//   },
//   {
//     id: 'A-209',
//     patient_id: 'P-107',
//     date: todayDate,
//     session: 'AN',
//     source: 'Phone Call',
//     status: 'Scheduled',
//     appointmentType: 'Detox',
//     notes: 'First time detox patient'
//   }
// ];

// export const initialConsultations = [
//   {
//     id: 'CON-301',
//     appointment_id: 'A-202',
//     patient_id: 'P-102',
//     doctor_name: 'Dr. Evelyn Carter',
//     date: '2026-05-20',
//     vitals: { bp: '120/80', weight: '64 kg', pulse: '76 bpm' },
//     symptoms: 'Mild abdominal discomfort, acid reflux, insomnia.',
//     diagnosis: 'Gut microbiome imbalance with heavy metal exposure symptoms.',
//     consultation_notes: '<p>Initial consultation completed. Recommended gentle colon hydrotherapy and liver flush protocol.</p><ul><li>Stop dairy for 7 days</li><li>Increase water intake</li><li>Start herbal detox tea</li></ul>',
//     medical_history: '<p>Longstanding IBS, irregular sleep, occasional bloating after heavy meals.</p>',
//     diet_plan_note: '<p>Start day with warm lemon water and ginger. Light vegetable broth for dinner.</p>',
//     home_care: 'Drink 2.5L warm water, avoid processed foods, and rest well.',
//     detox_recommended: true,
//     detox_type: 'Colon Hydrotherapy + Liver Flush Combo',
//     detox_doctor_id: 'DOC-03',
//     detox_doctor_name: 'Dr. Priya Sharma'
//   },
//   {
//     id: 'CON-302',
//     appointment_id: 'A-201',
//     patient_id: 'P-101',
//     doctor_name: 'Dr. Julian Bashir',
//     date: '2026-05-18',
//     vitals: { bp: '118/76', weight: '72 kg', pulse: '74 bpm' },
//     symptoms: 'Fatigue, poor digestion, dry skin.',
//     diagnosis: 'Mild liver congestion and adrenal stress.',
//     consultation_notes: '<p>Reviewed patient symptoms and suggested a 10-day liver support plan.</p><ol><li>Daily morning detox water</li><li>Evening relaxation techniques</li></ol>',
//     medical_history: '<p>History of mild fatty liver and stress-related insomnia.</p>',
//     diet_plan_note: '<p>Increase green vegetables, use coconut oil, and avoid red meat for two weeks.</p>',
//     home_care: 'Follow a structured sleep schedule and avoid screen time after 9PM.',
//     detox_recommended: false,
//     detox_type: null,
//     detox_doctor_id: null,
//     detox_doctor_name: null
//   },
//   {
//     id: 'CON-303',
//     appointment_id: 'A-205',
//     patient_id: 'P-101',
//     doctor_name: 'Dr. Evelyn Carter',
//     date: '2026-05-21',
//     vitals: { bp: '119/78', weight: '71.5 kg', pulse: '72 bpm' },
//     symptoms: 'Slight nausea and intermittent headaches.',
//     diagnosis: 'Residual liver stress with early hydration imbalance.',
//     consultation_notes: '<p>Follow-up notes: patient shows improved digestion. Continue detox tea and add evening magnesium.</p>',
//     medical_history: '<p>Ongoing fatty liver management and sleep irregularity after late meals.</p>',
//     diet_plan_note: '<p>Keep meal portions light and include cucumber salad with coriander.</p>',
//     home_care: 'Continue warm water in mornings and avoid late-night meals.',
//     detox_recommended: false,
//     detox_type: null,
//     detox_doctor_id: null,
//     detox_doctor_name: null
//   },
//   {
//     id: 'CON-304',
//     appointment_id: 'A-206',
//     patient_id: 'P-102',
//     doctor_name: 'Dr. Evelyn Carter',
//     date: '2026-05-21',
//     vitals: { bp: '121/79', weight: '63 kg', pulse: '75 bpm' },
//     symptoms: 'Mild fatigue after starting detox and slight cravings.',
//     diagnosis: 'Supportive gut reset progress with mild energy dips.',
//     consultation_notes: '<p>Reviewed daily detox routine. Progress is steady. Add sliced pear for fibre.</p>',
//     medical_history: '<p>Previous IBS, acid reflux, and poor sleep consistency.</p>',
//     diet_plan_note: '<p>Add stewed pear mid-morning to support calmer digestion.</p>',
//     home_care: 'Rest early and keep hydration consistent throughout the day.',
//     detox_recommended: false,
//     detox_type: null,
//     detox_doctor_id: null,
//     detox_doctor_name: null
//   },
//   {
//     id: 'CON-305',
//     appointment_id: 'A-202',
//     patient_id: 'P-102',
//     doctor_name: 'Dr. Julian Bashir',
//     date: '2026-05-19',
//     vitals: { bp: '122/80', weight: '63.5 kg', pulse: '76 bpm' },
//     symptoms: 'Less bloating and improved appetite.',
//     diagnosis: 'Gut reset is stabilizing; continue liver flush support.',
//     consultation_notes: '<p>Patient is tolerating the protocol. Maintain herbal bitters and lemon water.</p>',
//     medical_history: '<p>Continued history of digestive sensitivity and occasional constipation.</p>',
//     diet_plan_note: '<p>Keep meals simple with steamed greens and light proteins.</p>',
//     home_care: 'Check-in on fluid intake every 3 hours.',
//     detox_recommended: false,
//     detox_type: null,
//     detox_doctor_id: null,
//     detox_doctor_name: null
//   },
//   {
//     id: 'CON-306',
//     appointment_id: 'A-203',
//     patient_id: 'P-102',
//     doctor_name: 'Dr. Priya Sharma',
//     date: '2026-05-17',
//     vitals: { bp: '123/81', weight: '64.2 kg', pulse: '77 bpm' },
//     symptoms: 'Moderate bloating and fatigue after weekend meals.',
//     diagnosis: 'Early signs of gut flora imbalance with mild toxin build-up.',
//     consultation_notes: '<p>Started detox protocol. Advised vegetable broth, herbal tea, and rest.</p>',
//     medical_history: '<p>History of IBS and sensitivity to heavy spices.</p>',
//     diet_plan_note: '<p>Begin with gentle cleansing broth and avoid processed snacks.</p>',
//     home_care: 'Monitor symptoms and avoid cold drinks during meals.',
//     detox_recommended: true,
//     detox_type: 'Gut Microbiome Reset',
//     detox_doctor_id: 'DOC-03',
//     detox_doctor_name: 'Dr. Priya Sharma'
//   }
// ];

// export const initialDetoxSessions = [
//   {
//     id: 'DTX-401',
//     patient_id: 'P-102',
//     consultation_id: 'CON-301',
//     scheduled_date: '2026-05-20',
//     type: 'Colon Hydrotherapy',
//     status: 'In-Progress',
//     cost: 7500,
//     technician: 'Nolan Ross',
//     notes: 'Session started at 12:00 PM. Patient is calm and responding well to the warmth packs.'
//   },
//   {
//     id: 'DTX-402',
//     patient_id: 'P-101',
//     consultation_id: '',
//     scheduled_date: '2026-05-22',
//     type: 'Deep Tissue Cell Detox',
//     status: 'Scheduled',
//     cost: 8500,
//     technician: 'Nolan Ross',
//     notes: 'Pre-session fasting protocol initiated.'
//   },
//   // New detox sessions for today
//   {
//     id: 'DTX-403',
//     patient_id: 'P-105',
//     consultation_id: '',
//     scheduled_date: todayDate,
//     type: 'Full Body Detox',
//     status: 'Scheduled',
//     cost: 12500,
//     technician: 'Nolan Ross',
//     notes: '3-day detox program starting today. Pre-fasting instructions sent.'
//   },
//   {
//     id: 'DTX-404',
//     patient_id: 'P-106',
//     consultation_id: '',
//     scheduled_date: todayDate,
//     type: 'Colon Hydrotherapy',
//     status: 'Scheduled',
//     cost: 7500,
//     technician: 'Nolan Ross',
//     notes: 'First session scheduled for 1:00 PM'
//   },
//   {
//     id: 'DTX-405',
//     patient_id: 'P-107',
//     consultation_id: '',
//     scheduled_date: todayDate,
//     type: 'Liver Flush Detox',
//     status: 'Scheduled',
//     cost: 8500,
//     technician: 'Nolan Ross',
//     notes: 'New patient initial detox session'
//   }
// ];

// export const initialStayManagement = [
//   {
//     id: 'STY-501',
//     patient_id: 'P-102',
//     detox_session_id: 'DTX-401',
//     room_id: '102',
//     room_name: 'Deluxe Room 102',
//     check_in_time: '2026-05-20 09:30 AM',
//     check_out_time: '',
//     status: 'Admitted',
//     nursing_checklist: {
//       vitals_checked_morning: true,
//       detox_liquids_served: true,
//       post_procedure_bath: false,
//       resting_comfortably: true
//     },
//     notes: 'Admitted for one-day detox stay. Relaxing post hydrotherapy session.'
//   },
//   {
//     id: 'STY-502',
//     patient_id: 'P-104',
//     detox_session_id: '',
//     room_id: '202',
//     room_name: 'Standard Room 202',
//     check_in_time: '2026-05-20 08:00 AM',
//     check_out_time: '2026-05-20 05:00 PM',
//     status: 'Discharged',
//     nursing_checklist: {
//       vitals_checked_morning: true,
//       detox_liquids_served: true,
//       post_procedure_bath: true,
//       resting_comfortably: true
//     },
//     notes: 'Completed his day-stay program. Vitals stable at discharge.'
//   }
// ];

// export const initialPrescriptions = [
//   {
//     id: 'PRSC-601',
//     consultation_id: 'CON-301',
//     patient_id: 'P-102',
//     date: '2026-05-20',
//     doctor_name: 'Dr. Evelyn Carter',
//     medicines: [
//       { name: 'Triphala Laxative Extract', dosage: '1 Capsule', frequency: 'Bedtime', duration: '14 Days' },
//       { name: 'Active Charcoal Capsules', dosage: '500mg', frequency: '2 Hours Post-detox', duration: '3 Days' },
//       { name: 'Organic Milk Thistle Complex', dosage: '1 Tablet', frequency: 'Twice daily before meals', duration: '30 Days' }
//     ],
//     home_care: 'Avoid dairy, refined sugar, and processed foods. Drink at least 3 liters of warm alkaline water daily. Do light yoga in the morning.'
//   }
// ];

// export const initialDietCharts = [
//   {
//     id: 'DIET-701',
//     consultation_id: 'CON-301',
//     patient_id: 'P-102',
//     date: '2026-05-20',
//     doctor_name: 'Dr. Evelyn Carter',
//     meals: {
//       morning: 'Warm lemon juice with ginger and organic honey',
//       breakfast: 'Green smoothie with celery, cucumber, apple, spinach, and hemp seeds',
//       lunch: 'Steamed vegetables (zucchini, carrots, ash gourd) with organic quinoa and a dash of olive oil',
//       evening: 'Herbal detox infusion tea with pumpkin seeds',
//       dinner: 'Clear vegetable broth with boiled lentils and fresh coriander seeds'
//     },
//     remarks: 'Maintain a 14-hour intermittent fasting window (Dinner at 7:00 PM, Breakfast at 9:00 AM).'
//   },
//   {
//     id: 'DIET-702',
//     consultation_id: 'CON-302',
//     patient_id: 'P-101',
//     date: '2026-05-18',
//     doctor_name: 'Dr. Julian Bashir',
//     meals: {
//       morning: 'Warm water with lemon and honey',
//       breakfast: 'Oats porridge with flax seeds and almonds',
//       lunch: 'Steamed bottle gourd with quinoa',
//       evening: 'Herbal mint tea',
//       dinner: 'Light vegetable stew with cilantro'
//     },
//     remarks: 'Focus on hydration and gentle digestion. Avoid caffeine and spicy food for 7 days.'
//   }
// ];

// export const initialFollowups = [
//   {
//     id: 'FUP-801',
//     patient_id: 'P-101',
//     scheduled_date: '2026-05-22',
//     notes: 'Call to confirm liver flush preparation fasting compliance.',
//     status: 'Pending',
//     created_at: '2026-05-20'
//   },
//   {
//     id: 'FUP-802',
//     patient_id: 'P-102',
//     scheduled_date: '2026-05-21',
//     notes: 'Follow-up call on post-stay recovery and check if detox reaction occurred.',
//     status: 'Pending',
//     created_at: '2026-05-20'
//   },
//   {
//     id: 'FUP-803',
//     patient_id: 'P-103',
//     scheduled_date: '2026-05-19',
//     notes: 'Confirm check-in time for review.',
//     status: 'Completed',
//     created_at: '2026-05-18'
//   },
//   // New followups for today's detox patients
//   {
//     id: 'FUP-804',
//     patient_id: 'P-105',
//     scheduled_date: '2026-05-24',
//     notes: 'Follow-up on Day 3 of Full Body Detox program. Check symptoms and compliance.',
//     status: 'Pending',
//     created_at: todayDate
//   },
//   {
//     id: 'FUP-805',
//     patient_id: 'P-106',
//     scheduled_date: '2026-05-24',
//     notes: 'Post-colon hydrotherapy follow-up. Check recovery and any adverse reactions.',
//     status: 'Pending',
//     created_at: todayDate
//   },
//   {
//     id: 'FUP-806',
//     patient_id: 'P-107',
//     scheduled_date: '2026-05-25',
//     notes: 'First review after liver detox. Check progress and schedule next session if needed.',
//     status: 'Pending',
//     created_at: todayDate
//   }
// ];

// export const initialWhatsappLogs = [
//   {
//     id: 'WA-901',
//     patient_id: 'P-102',
//     patient_name: 'Sarah Jenkins',
//     phone: '+91 98765 00123',
//     type: 'Booking Confirmation',
//     message_text: 'Dear Sarah, your appointment with Dr. Evelyn Carter is confirmed for Today at 11:30 AM. Reply HELP for queries. - Manthrralaya\'s Wellness',
//     sent_at: '2026-05-20 09:00 AM',
//     status: 'Read',
//     template_name: 'appointment_confirm'
//   },
//   {
//     id: 'WA-902',
//     patient_id: 'P-102',
//     patient_name: 'Sarah Jenkins',
//     phone: '+91 98765 00123',
//     type: 'PDF Delivery',
//     message_text: 'Dear Sarah, here is your customized Diet Chart and Prescription from Dr. Evelyn Carter: https://manthrralayas.co/shared/docs/pdf_601. Please download and follow the instructions. - Manthrralaya\'s Wellness',
//     sent_at: '2026-05-20 01:15 PM',
//     status: 'Delivered',
//     template_name: 'document_delivery_pdf'
//   },
//   {
//     id: 'WA-903',
//     patient_id: 'P-101',
//     patient_name: 'John Doe',
//     phone: '+91 98765 43210',
//     type: 'Session Reminder',
//     message_text: 'Hello John, your Deep Tissue Cell Detox session is scheduled for May 22 at 09:00 AM. Please begin your liquid fasting protocol tomorrow. - Manthrralaya\'s Wellness',
//     sent_at: '2026-05-20 02:00 PM',
//     status: 'Sent',
//     template_name: 'detox_prep_reminder'
//   },
//   // New WhatsApp logs for today's detox patients
//   {
//     id: 'WA-904',
//     patient_id: 'P-105',
//     patient_name: 'Michael Chen',
//     phone: '+91 99887 66554',
//     type: 'Booking Confirmation',
//     message_text: `Dear Michael, your Full Body Detox appointment is confirmed for Today at 09:00 AM. Please arrive 15 minutes early. - Manthrralaya's Wellness`,
//     sent_at: `${todayDate} 08:00 AM`,
//     status: 'Delivered',
//     template_name: 'appointment_confirm'
//   },
//   {
//     id: 'WA-905',
//     patient_id: 'P-106',
//     patient_name: 'Deepa Nair',
//     phone: '+91 97654 32109',
//     type: 'Session Reminder',
//     message_text: `Hello Deepa, your Colon Hydrotherapy session is scheduled for Today at 1:00 PM. Please begin fasting 3 hours before the session. - Manthrralaya's Wellness`,
//     sent_at: `${todayDate} 10:30 AM`,
//     status: 'Delivered',
//     template_name: 'detox_prep_reminder'
//   },
//   {
//     id: 'WA-906',
//     patient_id: 'P-107',
//     patient_name: 'Ramesh Iyer',
//     phone: '+91 96543 21098',
//     type: 'Booking Confirmation',
//     message_text: `Dear Ramesh, your Liver Detox consultation with Dr. Julian Bashir is confirmed for Today at 3:30 PM. - Manthrralaya's Wellness`,
//     sent_at: `${todayDate} 12:15 PM`,
//     status: 'Sent',
//     template_name: 'appointment_confirm'
//   }
// ];

// export const initialReviews = [
//   {
//     id: 'REV-01',
//     patient_name: 'Sarah Jenkins',
//     patient_id: 'P-102',
//     rating: 5,
//     comments: 'Exceptional stay. The liver flush procedure was done under excellent clinical care, and the nursing staff was extremely polite. Highly recommended!',
//     date: '2026-05-20'
//   },
//   {
//     id: 'REV-02',
//     patient_name: 'Raj Patel',
//     patient_id: 'P-104',
//     rating: 4,
//     comments: 'Very effective Ayurvedic detox stay. Room was clean, food was completely alkaline. WhatsApp session alerts were very helpful.',
//     date: '2026-05-20'
//   }
// ];