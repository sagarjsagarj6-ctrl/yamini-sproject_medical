const clean = (value, max = 500) => String(value ?? '').replace(/[<>]/g, '').slice(0, max);

const SPECIALTY_KEYWORDS = [
  { specialty: 'Cardiologist', keywords: ['heart', 'chest', 'palpitation', 'bp', 'blood pressure', 'hypertension', 'cholesterol', 'cardio'] },
  { specialty: 'Neurologist', keywords: ['headache', 'migraine', 'dizziness', 'seizure', 'numbness', 'tremor', 'stroke', 'nerve', 'brain'] },
  { specialty: 'Dermatologist', keywords: ['skin', 'rash', 'acne', 'itching', 'eczema', 'allergy', 'hair', 'psoriasis'] },
  { specialty: 'Orthopedic Surgeon', keywords: ['bone', 'joint', 'knee', 'back pain', 'spine', 'fracture', 'arthritis', 'muscle', 'leg pain'] },
  { specialty: 'Gastroenterologist', keywords: ['stomach', 'acid', 'reflux', 'gastric', 'abdomen', 'digest', 'nausea', 'vomit', 'liver', 'bowel'] },
  { specialty: 'Pulmonologist', keywords: ['cough', 'breathing', 'asthma', 'lung', 'bronchitis', 'wheez', 'shortness of breath'] },
  { specialty: 'Endocrinologist', keywords: ['diabetes', 'sugar', 'glucose', 'thyroid', 'hormone', 'weight loss', 'insulin'] },
  { specialty: 'Pediatrician', keywords: ['child', 'baby', 'infant', 'toddler', 'pediatric'] },
  { specialty: 'ENT Specialist', keywords: ['ear', 'nose', 'throat', 'sinus', 'tonsil', 'hearing', 'tinnitus'] },
  { specialty: 'General Physician', keywords: ['fever', 'cold', 'flu', 'fatigue', 'weakness', 'checkup', 'general', 'malaise', 'body pain'] }
];

export const generateAIText = async ({ role, records }) => {
  const apiKey = process.env.AI_API_KEY;
  const baseUrl = (process.env.AI_BASE_URL || 'https://api.openai.com/v1').replace(/\/$/, '');
  const model = process.env.AI_MODEL;
  if (!apiKey || !model) {
    const error = new Error('AI insights are not configured. Set AI_API_KEY and AI_MODEL on the server.');
    error.statusCode = 503;
    throw error;
  }
  const safeRecords = JSON.stringify(records).slice(0, 18_000);
  const system = role === 'DOCTOR'
    ? 'Summarize only the supplied, de-identified-to-the-minimum clinical activity. Do not diagnose, prescribe, change dosage, advise stopping medication, or declare recovery. Separate recorded facts from uncertainty. Flag insufficient data. Output concise plain text.'
    : 'Explain only the supplied care-plan activity in plain language. Do not diagnose, prescribe, change dosage, advise stopping medication, or declare recovery. Encourage the patient to ask their care team about concerns. Flag insufficient data. Output concise plain text.';
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      max_tokens: 700,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: `Summarize these authorized, recorded facts. Do not infer missing values:\n${safeRecords}` }
      ]
    }),
    signal: AbortSignal.timeout(20_000)
  });
  if (!response.ok) {
    const error = new Error(response.status === 429 ? 'AI service is busy. Try again later.' : 'AI insights are unavailable right now.');
    error.statusCode = response.status === 429 ? 503 : 502;
    throw error;
  }
  const payload = await response.json();
  const text = payload.choices?.[0]?.message?.content;
  if (typeof text !== 'string' || text.trim().length < 10 || text.length > 6000) {
    const error = new Error('AI returned an incomplete result. Try again later.');
    error.statusCode = 502;
    throw error;
  }
  return { summary: clean(text, 6000), model };
};

const generateLocalRAGResponse = ({ role, message, contextData, availableDoctors = [] }) => {
  const query = String(message || '').toLowerCase();

  if (role === 'PATIENT') {
    const { profile = {}, medicines = [], symptoms = [], recoveryScores = [], doctorNames = [] } = contextData || {};
    
    // 1. Doctor Appointment & Specialist Recommendation Query
    if (
      query.includes('doctor') ||
      query.includes('appoint') ||
      query.includes('specialist') ||
      query.includes('who should i see') ||
      query.includes('recommend') ||
      query.includes('consult') ||
      query.includes('visit')
    ) {
      // Find matching specialty based on query + recorded symptoms + primary disease
      const textToScan = `${query} ${profile.primaryDisease || ''} ${symptoms.map((s) => s.symptom).join(' ')}`.toLowerCase();
      let matchedSpecialty = 'General Physician';
      for (const item of SPECIALTY_KEYWORDS) {
        if (item.keywords.some((kw) => textToScan.includes(kw))) {
          matchedSpecialty = item.specialty;
          break;
        }
      }

      // Look for doctors matching this specialty in our platform directory
      const matchingDocs = availableDoctors.filter((doc) =>
        String(doc.specialization || '').toLowerCase().includes(matchedSpecialty.toLowerCase().split(' ')[0])
      );

      let doctorListText = '';
      if (matchingDocs.length > 0) {
        doctorListText = `\n\n👨‍⚕️ **Recommended Doctors on MEDICO:**\n` +
          matchingDocs.slice(0, 3).map((d) => `• **${d.name}** — ${d.specialization} (${d.hospitalName || 'Clinic'})`).join('\n') +
          `\n\n📅 You can book a consultation with them under the **Appointments** tab.`;
      } else if (availableDoctors.length > 0) {
        doctorListText = `\n\n👨‍⚕️ **Available Verified Doctors on Platform:**\n` +
          availableDoctors.slice(0, 2).map((d) => `• **${d.name}** — ${d.specialization || 'General Care'}`).join('\n') +
          `\n\n📅 Visit **Search Doctors** or **Appointments** to connect.`;
      }

      return {
        reply: `Based on your symptoms and recorded medical history (${profile.primaryDisease ? `Primary: ${profile.primaryDisease}` : 'general symptoms'}), I recommend scheduling an appointment with a **${matchedSpecialty}**.\n\nA ${matchedSpecialty} can thoroughly examine your symptoms and adjust your ongoing treatment plan safely.${doctorListText}\n\n*Note: If you experience acute severe chest pain, sudden numbness, or extreme shortness of breath, please seek emergency medical attention immediately.*`,
        isLiveAI: false
      };
    }

    // 2. Health Condition & Symptom Assessment Query
    if (query.includes('health') || query.includes('condition') || query.includes('how am i') || query.includes('recovery') || query.includes('symptom')) {
      const recentSymptoms = symptoms.length > 0
        ? symptoms.slice(0, 3).map((s) => `• **${s.symptom}** (Severity: ${s.severity}/10${s.notes ? ` - ${s.notes}` : ''})`).join('\n')
        : '• No severe symptoms reported recently.';
      const latestScore = recoveryScores.length > 0 ? `${recoveryScores[0].score}%` : 'Not yet assessed';

      return {
        reply: `Here is a consolidated overview of your current health status from your internal records:\n\n` +
          `📋 **Primary Condition:** ${profile.primaryDisease || 'Not specified'}${profile.yearsSuffering ? ` (${profile.yearsSuffering} years)` : ''}\n` +
          `📈 **Latest Doctor Recovery Score:** ${latestScore}\n` +
          `⚠️ **Allergies on File:** ${profile.allergies || 'None recorded'}\n` +
          `🩺 **Connected Doctors:** ${doctorNames.join(', ') || 'None connected'}\n\n` +
          `🔍 **Recent Reported Symptoms:**\n${recentSymptoms}\n\n` +
          `💡 **Care Guidance:** Keep recording daily symptoms in your dashboard and ensure all prescribed doses are logged on time.`,
        isLiveAI: false
      };
    }

    // 3. Medication & Dosage Query
    if (query.includes('medication') || query.includes('medicine') || query.includes('dose') || query.includes('dosage') || query.includes('pill') || query.includes('food')) {
      if (medicines.length === 0) {
        return {
          reply: `You currently have no active prescribed medications in your schedule. Once your connected doctor prescribes a medication, your dosages and food instructions will reflect here.`,
          isLiveAI: false
        };
      }
      const medList = medicines.map((m) => `• **${m.medicineName}** (${m.dosage}): Take ${m.foodInstruction?.replace('_', ' ') || 'Any time'} at ${m.times?.join(', ') || 'scheduled hours'}${m.specialInstructions ? ` (Note: ${m.specialInstructions})` : ''}`).join('\n');
      return {
        reply: `Here are your active prescribed medications decided by your doctor:\n\n${medList}\n\n💡 Remember to take doses with water according to food instructions. You can log each dose or send a WhatsApp reminder directly from your dashboard cards.`,
        isLiveAI: false
      };
    }

    // Default Patient Medical Agent Response
    return {
      reply: `Hello ${profile.name?.split(' ')[0] || 'there'}! I am your personal **MEDICO Health Agent**.\n\n` +
        `I have access to your internal health records:\n` +
        `• **Primary Health Condition:** ${profile.primaryDisease || 'Under management'}\n` +
        `• **Active Prescriptions:** ${medicines.length} medications\n` +
        `• **Recent Symptoms:** ${symptoms.length} entries recorded\n\n` +
        `How can I assist you today? You can ask:\n` +
        `1. *"Which doctor should I book an appointment with for my symptoms?"*\n` +
        `2. *"What is my current health condition and recovery trend?"*\n` +
        `3. *"What are my medicine dosages and food instructions?"*\n\n` +
        `*Feel free to ask any question regarding your care plan!*`,
      isLiveAI: false
    };
  }

  // Doctor Role Local RAG
  const { totalPatients = 0, patientsRequiringAttention = 0, recentSymptoms = [], completedTreatments = 0 } = contextData || {};
  return {
    reply: `Clinical Intelligence Agent (Active):\n\n` +
      `📊 **Active Practice Metrics:**\n` +
      `• Connected Patients: **${totalPatients}**\n` +
      `• Patients Requiring Attention (Severity >= 8 or Reassessment): **${patientsRequiringAttention}**\n` +
      `• Completed Treatment Plans: **${completedTreatments}**\n\n` +
      `Recent high-severity symptom reports are prioritized on your patient management board. You can ask for patient risk analysis or medication guidelines.`,
    isLiveAI: false
  };
};

export const generateRAGChatResponse = async ({
  role,
  message,
  history = [],
  contextData = {},
  availableDoctors = []
}) => {
  const apiKey = process.env.AI_API_KEY;
  const baseUrl = (process.env.AI_BASE_URL || 'https://api.openai.com/v1').replace(/\/$/, '');
  const model = process.env.AI_MODEL || 'gpt-4o-mini';

  // Fallback to internal knowledge RAG engine when AI_API_KEY is not configured
  if (!apiKey || apiKey.trim().length === 0) {
    return generateLocalRAGResponse({ role, message, contextData, availableDoctors });
  }

  // Construct grounded RAG system prompt with internal medical records
  const systemPrompt = role === 'DOCTOR'
    ? `You are MEDICO's Clinical AI Assistant, an advanced clinical RAG agent supporting verified medical practitioners.
You have real-time access to the doctor's connected patient rosters, logged symptoms, adherence metrics, and recovery assessments.
Provide evidence-based clinical decision support, triage suggestions, drug safety checks, and treatment analysis.
Keep responses concise, professional, and well-structured with bullet points.

Internal Clinical Practice Data (RAG Grounding):
${JSON.stringify(contextData, null, 2)}`
    : `You are MEDICO's Smart Medical Agent, a compassionate and knowledgeable personal healthcare companion.
You have real-time access to the patient's internal medical profile, active medications, logged symptoms, recovery scores, and available doctors in the directory.

Your core duties:
1. Recommend which medical specialist and specific doctor to book an appointment with based on their health condition and symptoms.
2. Clearly explain their current health condition, recovery trend, and active medication dosages (including food rules: before/after/with food).
3. Warn against triggers matching their recorded allergies.
4. If symptoms indicate emergency red flags (e.g., crushing chest pain, difficulty breathing, sudden paralysis/slurred speech), immediately instruct them to seek emergency services.
5. Keep answers clear, empathetic, and actionable with markdown formatting and emojis.

Patient's Internal Records (RAG Grounding):
${JSON.stringify(contextData, null, 2)}

Available Doctors in Platform:
${JSON.stringify(availableDoctors, null, 2)}`;

  const cleanHistory = Array.isArray(history)
    ? history.slice(-6).map((msg) => ({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: String(msg.content || '').slice(0, 1500)
      }))
    : [];

  const messages = [
    { role: 'system', content: systemPrompt },
    ...cleanHistory,
    { role: 'user', content: String(message || '').slice(0, 2000) }
  ];

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        temperature: 0.3,
        max_tokens: 900,
        messages
      }),
      signal: AbortSignal.timeout(25_000)
    });

    if (!response.ok) {
      console.warn(`External AI returned status ${response.status}. Falling back to internal RAG engine.`);
      return generateLocalRAGResponse({ role, message, contextData, availableDoctors });
    }

    const payload = await response.json();
    const replyText = payload.choices?.[0]?.message?.content;

    if (!replyText || replyText.trim().length < 5) {
      return generateLocalRAGResponse({ role, message, contextData, availableDoctors });
    }

    return {
      reply: replyText.trim(),
      model,
      isLiveAI: true
    };
  } catch (error) {
    console.warn(`External AI request error (${error.message}). Falling back to internal RAG engine.`);
    return generateLocalRAGResponse({ role, message, contextData, availableDoctors });
  }
};
