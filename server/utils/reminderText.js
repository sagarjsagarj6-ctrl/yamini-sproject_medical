const DEFAULT_IMAGES = {
  tablet: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80',
  capsule: 'https://images.unsplash.com/photo-1550572017-edd951aa8f72?w=600&auto=format&fit=crop&q=80',
  syrup: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=600&auto=format&fit=crop&q=80',
  ml: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=600&auto=format&fit=crop&q=80',
  drops: 'https://images.unsplash.com/photo-1576073719676-aa95576db207?w=600&auto=format&fit=crop&q=80',
  injection: 'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=600&auto=format&fit=crop&q=80',
  ointment: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&auto=format&fit=crop&q=80',
  default: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=600&auto=format&fit=crop&q=80'
};

export const getDefaultMedicineImage = (dosageUnit = '', category = '') => {
  const normalizedUnit = String(dosageUnit || '').toLowerCase().trim();
  const normalizedCategory = String(category || '').toLowerCase().trim();
  
  if (normalizedUnit.includes('capsule') || normalizedCategory.includes('capsule')) return DEFAULT_IMAGES.capsule;
  if (normalizedUnit.includes('syrup') || normalizedUnit.includes('ml') || normalizedCategory.includes('syrup') || normalizedCategory.includes('liquid')) return DEFAULT_IMAGES.syrup;
  if (normalizedUnit.includes('drop') || normalizedCategory.includes('drop')) return DEFAULT_IMAGES.drops;
  if (normalizedUnit.includes('inj') || normalizedCategory.includes('inject')) return DEFAULT_IMAGES.injection;
  if (normalizedUnit.includes('cream') || normalizedUnit.includes('ointment')) return DEFAULT_IMAGES.ointment;
  if (normalizedUnit.includes('tablet') || normalizedUnit.includes('tab') || normalizedCategory.includes('tablet')) return DEFAULT_IMAGES.tablet;
  
  return DEFAULT_IMAGES.tablet;
};

export const getFoodLabel = (instruction) => {
  switch (instruction) {
    case 'BEFORE_FOOD':
      return 'Take Before Food (Empty Stomach) 🥗';
    case 'AFTER_FOOD':
      return 'Take After Food (Post-Meal) 🍽️';
    case 'WITH_FOOD':
      return 'Take With Food / Meal 🍲';
    case 'ANY':
    default:
      return 'Take Anytime (With or Without Food)';
  }
};

export const buildNotificationText = ({
  medicineName,
  dosage,
  foodInstruction,
  doctorName,
  specialInstructions
}) => {
  const food = getFoodLabel(foodInstruction);
  const parts = [`⏰ Time for ${medicineName} (${dosage}).`];
  if (foodInstruction && foodInstruction !== 'ANY') {
    parts.push(`🍽️ ${food}.`);
  }
  if (doctorName) {
    parts.push(`👨‍⚕️ Prescribed by ${doctorName}.`);
  }
  if (specialInstructions && specialInstructions.trim()) {
    parts.push(`📝 Note: ${specialInstructions.trim()}`);
  }
  return parts.join(' ');
};

export const buildWhatsAppReminderText = ({
  patientName = 'Patient',
  medicineName,
  dosage,
  scheduledTime,
  foodInstruction,
  doctorName,
  specialInstructions,
  clientUrl = 'http://localhost:5173'
}) => {
  const food = getFoodLabel(foodInstruction);
  const timeStr = scheduledTime ? (typeof scheduledTime === 'string' ? scheduledTime : new Date(scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })) : 'Now';

  const lines = [
    `🏥 *MEDICO HEALTHCARE REMINDER* ⏰`,
    `Hello *${patientName}*, here is your scheduled medication reminder:`,
    ``,
    `💊 *Medication*: ${medicineName}`,
    `⚖️ *Dosage*: ${dosage}`,
    `🕒 *Scheduled Time*: ${timeStr}`,
    `🍽️ *Food Instructions*: ${food}`,
  ];

  if (doctorName) {
    lines.push(`👨‍⚕️ *Prescribed by*: ${doctorName}`);
  }

  if (specialInstructions && specialInstructions.trim()) {
    lines.push(`📝 *Doctor's Guidance*: ${specialInstructions.trim()}`);
  }

  lines.push(
    ``,
    `👉 *Record Dose*: Open MEDICO to mark as taken or snoozed:`,
    `🔗 ${clientUrl}/patient/dashboard`,
    ``,
    `_Stay healthy and follow your prescribed care plan!_`
  );

  return lines.join('\n');
};

export const buildWhatsAppUrl = (text, phone = '') => {
  const encodedText = encodeURIComponent(text);
  const cleanPhone = String(phone || '').replace(/[^\d+]/g, '').replace(/^\+/, '');
  if (cleanPhone) {
    return `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedText}`;
  }
  return `https://api.whatsapp.com/send?text=${encodedText}`;
};
