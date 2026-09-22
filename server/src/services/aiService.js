const axios = require('axios');
const config = require('../config/env');
const Route = require('../models/Route');
const Fare = require('../models/Fare');

const buildSystemPrompt = async () => {
  const routes = await Route.find({ isActive: true }).lean();
  const fares = await Fare.find({ isActive: true }).lean();

  const routeInfo = routes.map((r) =>
    `- ${r.name} (${r.category}): ${r.distanceKm}km from ${r.startPoint.name} to ${r.endPoint.name}`
  ).join('\n');

  const fareInfo = fares.map((f) =>
    `- ${f.vehicleType}: Base fare ₱${f.baseFare} (first ${f.baseDistanceKm}km), ₱${f.perKmRate}/km after`
  ).join('\n');

  return `You are SmartSakay Assistant, an expert AI assistant for commuters in Dagupan City and Pangasinan, Philippines.

You have deep legal and operational knowledge regarding:
1. HUMAN RIGHTS OF COMMUTERS & PASSENGERS (Philippine Laws & Regulations):
   - Republic Act 11311: Mandates clean, sanitary, free-of-charge restrooms with running water, diaper-changing tables, and lactation stations for nursing mothers in land transport terminals and stops.
   - Republic Act 9994 (Expanded Senior Citizens Act): Mandatory 20% discount on regular fares, priority front seating in jeepneys and buses.
   - Republic Act 9442 (Magna Carta for PWDs): Mandatory 20% discount and barrier-free access.
   - Republic Act 10931 & LTFRB Memorandum Circular 2019-035 (Student Fare Discount Act): Mandatory 20% fare discount applicable 365 days a year (including weekends, sem breaks, and holidays) upon presenting a valid school ID.
   - Republic Act 11313 (Safe Spaces Act / Bawal Bastos Law): Strict prohibition of catcalling, sexual harassment, stalking, and obscene gestures in public utility vehicles and public terminals.
   - LTFRB Joint Administrative Order (JAO 2014-01): Strict penalties for drivers refusing to convey passengers, overcharging, discourtesy, reckless driving, or failure to display the official LTFRB fare matrix.
   - Right to safe transport, right to correct change, right to safe loading/unloading at designated stops, right to file official complaints with LTFRB (Hotline 1342) or in-app.

2. LOCAL JEEPNEY ROUTES (Dagupan & neighboring Pangasinan corridors):
${routeInfo}

3. PROVINCIAL BUS TERMINALS IN DAGUPAN (Only for Buses):
   - Victory Liner Terminal (Perez Blvd): 24/7 trips to Cubao, Pasay, Baguio, Olongapo, Clark.
   - Five Star Bus Terminal (Perez Blvd): Regular & aircon trips to Cubao, Pasay, Avenida, Cabanatuan.
   - Solid North Transit Terminal (Perez Blvd): Point-to-Point (P2P) luxury coaches directly to PITX and Kamuning via TPLEX.
   - Genesis Transport / JoyBus Executive Terminal (M.H. Del Pilar St): Luxury executive JoyBus trips to Baguio, Clark Airport, Cubao.
   - Dagupan Bus Co. Terminal (Perez Blvd): Trips to Cubao, Pasay, Baguio, Vigan.

4. FARE RATES (LTFRB Official Schedule):
${fareInfo}

RULES:
- Always give clear, compassionate, legally grounded, and actionable guidance.
- For overcharging or violations, cite the specific law (e.g., RA 9994 for seniors, RA 10931 for students, RA 11311 for terminal facilities, JAO 2014-01 for overcharging) and advise filing an in-app report or calling LTFRB 1342.
- Respond in English or Filipino/Tagalog/Pangasinan as preferred by the commuter.`;
};

const chatWithGemini = async (messages, systemPrompt) => {
  const contents = messages.map((msg) => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: msg.content }],
  }));

  const response = await axios.post(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${config.gemini.apiKey}`,
    {
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents,
    },
    { timeout: 30000 }
  );

  return response.data.candidates?.[0]?.content?.parts?.[0]?.text || 'Sorry, I could not generate a response.';
};

const chatWithGroq = async (messages, systemPrompt) => {
  const formattedMessages = [
    { role: 'system', content: systemPrompt },
    ...messages.map((msg) => ({ role: msg.role, content: msg.content })),
  ];

  const response = await axios.post(
    'https://api.groq.com/openai/v1/chat/completions',
    {
      model: 'llama-3.1-70b-versatile',
      messages: formattedMessages,
      max_tokens: 1024,
      temperature: 0.7,
    },
    {
      headers: {
        Authorization: `Bearer ${config.groq.apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    }
  );

  return response.data.choices?.[0]?.message?.content || 'Sorry, I could not generate a response.';
};

const generateLocalAssistantResponse = (messages) => {
  const lastUserMsg = [...messages].reverse().find(m => m.role === 'user')?.content?.toLowerCase() || '';

  if (lastUserMsg.includes('right') || lastUserMsg.includes('human right') || lastUserMsg.includes('karapatan') || lastUserMsg.includes('law') || lastUserMsg.includes('batas') || lastUserMsg.includes('bastos') || lastUserMsg.includes('safe space') || lastUserMsg.includes('11311') || lastUserMsg.includes('senior') || lastUserMsg.includes('pwd') || lastUserMsg.includes('student')) {
    return `📜 **Key Commuter & Human Rights under Philippine Law:**\n\n` +
      `1. **Republic Act 11311 (Terminal Standards):** You have the right to clean, sanitary, and free-of-charge restrooms with running water, diaper-changing tables, and lactation stations at all public land transport terminals.\n\n` +
      `2. **20% Statutory Fare Discounts:**\n` +
      `   • **Students (RA 10931 / LTFRB MC 2019-035):** 20% discount all 365 days of the year, including weekends and holidays upon showing a valid school ID.\n` +
      `   • **Senior Citizens (RA 9994):** 20% discount plus priority front seats.\n` +
      `   • **Persons with Disabilities (RA 9442):** 20% discount and barrier-free access.\n\n` +
      `3. **Safe Spaces Act (RA 11313 / Bawal Bastos):** Zero tolerance for catcalling, sexual harassment, leering, or inappropriate contact in PUVs and terminals. Drivers and conductors are legally mandated to intervene.\n\n` +
      `4. **LTFRB JAO 2014-01:** Heavy fines and suspension for refusal to convey passengers, overcharging, discourtesy, or arrogant behavior.\n\n` +
      `To report a violation, file a report under our in-app **Complaints** section or call the **LTFRB Hotline 1342**.`;
  }

  if (lastUserMsg.includes('bus') || lastUserMsg.includes('terminal') || lastUserMsg.includes('victory') || lastUserMsg.includes('five star') || lastUserMsg.includes('solid north') || lastUserMsg.includes('genesis') || lastUserMsg.includes('joybus')) {
    return `🚌 **Dagupan City Bus Terminals (Provincial Buses):**\n\n` +
      `• **Victory Liner Terminal:** Perez Blvd (24/7 trips to Cubao, Pasay, Baguio, Clark, Olongapo; Tel: (075) 522-0929)\n` +
      `• **Five Star Bus Terminal:** Perez Blvd (Trips to Cubao, Pasay, Avenida, Cabanatuan; Tel: (075) 522-8618)\n` +
      `• **Solid North Transit:** Perez Blvd (Direct Point-to-Point luxury buses to PITX & Kamuning via TPLEX; Tel: (075) 522-3841)\n` +
      `• **Genesis / JoyBus Executive Terminal:** M.H. Del Pilar St (Direct luxury service to Baguio City & Clark Airport; Tel: (075) 523-1188)\n` +
      `• **Dagupan Bus Co.:** Perez Blvd (Regular and aircon trips across Northern Luzon and Metro Manila)\n\n` +
      `You can find interactive locations, walking distances, and amenities in our **Bus Terminal Locator** tab on the map!`;
  }

  if (lastUserMsg.includes('fare') || lastUserMsg.includes('rate') || lastUserMsg.includes('magkano') || lastUserMsg.includes('pamasahe') || lastUserMsg.includes('price')) {
    return `💰 **Official LTFRB Fare Matrix for Dagupan City:**\n\n` +
      `• **Traditional Jeepney:** ₱13.00 base fare (first 4 km), +₱1.80 per succeeding km\n` +
      `• **Modern Jeepney:** ₱15.00 base fare (first 4 km), +₱2.20 per succeeding km\n\n` +
      `**Discounted Fares (20% for Students, Seniors, PWDs):**\n` +
      `• Traditional Jeepney: ₱10.40 base, +₱1.44 per succeeding km\n` +
      `• Modern Jeepney: ₱12.00 base, +₱1.76 per succeeding km\n\n` +
      `Use our in-app **Fare Calculator** to compute the exact price for your specific route!`;
  }

  if (lastUserMsg.includes('route') || lastUserMsg.includes('jeep') || lastUserMsg.includes('bonuan') || lastUserMsg.includes('calasiao') || lastUserMsg.includes('san fabian') || lastUserMsg.includes('lingayen')) {
    return `🗺️ **Major Jeepney Routes in Dagupan City:**\n\n` +
      `1. **City Corridors:** Bonuan Tondaligan (Beach), Bonuan Binloc, Bonuan Boquig, Mangin, Downtown Loop, CSI Lucao, Tambac-Bolosan Dalisay.\n` +
      `2. **Intercity Corridors:** Calasiao, Binmaley, Lingayen (Provincial Capitol), Mangaldan, San Fabian, Sta. Barbara, San Carlos City, Malasiqui-Bayambang.\n\n` +
      `Check out the **Routes** tab to view complete waypoint maps, distance, and operating hours!`;
  }

  return `Kumusta! I am your SmartSakay Dagupan Commuter Assistant.\n\n` +
    `I can help you with:\n` +
    `• ⚖️ **Commuter & Human Rights** (RA 11311 terminal sanitation, RA 9994/9442/10931 20% discounts, RA 11313 Safe Spaces)\n` +
    `• 💰 **LTFRB Official Fare Rates** & calculations\n` +
    `• 🚐 **15 Dagupan Jeepney Routes** and stops\n` +
    `• 🚌 **Provincial Bus Terminal Locator** (Victory Liner, Five Star, Solid North, Genesis)\n` +
    `• 📝 **Filing complaints** for overcharging or rude drivers\n\n` +
    `How can I assist you with your trip today?`;
};


const chat = async (messages) => {
  let systemPrompt = '';
  try {
    systemPrompt = await buildSystemPrompt();
  } catch (e) {
    // Continue with basic prompt
  }

  if (config.gemini.apiKey && config.gemini.apiKey !== 'your-gemini-api-key') {
    try {
      return await chatWithGemini(messages, systemPrompt);
    } catch (error) {
      console.warn('Gemini unavailable, attempting fallback...');
    }
  }

  if (config.groq.apiKey && config.groq.apiKey !== 'your-groq-api-key') {
    try {
      return await chatWithGroq(messages, systemPrompt);
    } catch (error) {
      console.warn('Groq unavailable, attempting fallback...');
    }
  }

  // Graceful local commuter knowledge response
  return generateLocalAssistantResponse(messages);
};

module.exports = { chat };

