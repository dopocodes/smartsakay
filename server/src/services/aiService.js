const Route = require("../models/Route");
const Fare = require("../models/Fare");
const Groq = require("groq-sdk");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, "../config/.env") });

console.log(
  "GROQ API KEY:",
  process.env.GROQ_API_KEY ? "LOADED" : "NOT LOADED",
);

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// ======================================================
// BUILD SYSTEM PROMPT
// ======================================================

const buildSystemPrompt = async () => {
  const routes = await Route.find({ isActive: true }).lean();
  const fares = await Fare.find({ isActive: true }).lean();

  const routeInfo =
    routes.length > 0
      ? routes
          .map(
            (r) =>
              `- ${r.name} (${r.category}): ${r.distanceKm}km from ${r.startPoint?.name || "Unknown"} to ${r.endPoint?.name || "Unknown"}`,
          )
          .join("\n")
      : "No active route information is currently available.";

  const fareInfo =
    fares.length > 0
      ? fares
          .map(
            (f) =>
              `- ${f.vehicleType}: Base fare ₱${f.baseFare} (first ${f.baseDistanceKm}km), ₱${f.perKmRate}/km after`,
          )
          .join("\n")
      : "No active fare information is currently available.";

  return `
You are SmartSakay Assistant, an AI commuter assistant for Dagupan City and Pangasinan, Philippines.

Your job is to help commuters with:

1. COMMUTER RIGHTS AND TRANSPORTATION LAWS

Relevant Philippine laws and regulations include:

- Republic Act 9994 – Expanded Senior Citizens Act
  - Eligible senior citizens are entitled to a 20% fare discount on covered public transportation.

- Republic Act 9442 – Magna Carta for Persons with Disability
  - Eligible PWD passengers are entitled to a 20% discount and accessibility accommodations.

- Republic Act 10931 and applicable LTFRB regulations
  - Qualified students may receive the applicable student fare discount upon presentation of a valid school ID.

- Republic Act 11313 – Safe Spaces Act
  - Covers sexual harassment and gender-based sexual harassment in public spaces, including public transportation.

- Republic Act 11311
  - Establishes standards concerning passenger terminal facilities.

- LTFRB rules and administrative orders
  - Cover matters such as overcharging, refusal to convey passengers, discourtesy, reckless driving, and fare matrix compliance.

If a passenger reports a possible violation:
- Explain the relevant rule or law carefully.
- Do not invent legal requirements.
- Recommend documenting the incident.
- Recommend using the SmartSakay complaint/report feature.
- Where appropriate, mention the LTFRB complaint channels.

2. ACTIVE SMARTSAKAY ROUTES

${routeInfo}

3. BUS TERMINALS

The following are provincial bus terminals/services associated with Dagupan:

- Victory Liner Terminal – Perez Boulevard
- Five Star Bus Terminal – Perez Boulevard
- Solid North Transit – Perez Boulevard
- Genesis / JoyBus – M.H. Del Pilar Street
- Dagupan Bus Company – Perez Boulevard

Do not claim a bus schedule is currently operating unless that information is provided by the application.

4. ACTIVE FARE INFORMATION

${fareInfo}

IMPORTANT RULES:

- Use the database-provided route and fare information when answering route and fare questions.
- Never invent a route, fare, terminal, schedule, or operating hour.
- If the database does not contain the requested information, clearly say that the information is unavailable.
- Do not pretend to have live GPS, traffic, or bus schedule data unless it is provided to you.
- Do not make up legal provisions.
- Give concise and useful answers.
- Use Philippine pesos (₱) when discussing fares.
- You can respond in English, Filipino/Tagalog, or Pangasinan depending on the user's language.
- Use Markdown formatting.
- Use **bold** only for important names, amounts, locations, and key information.
- Use bullet points for lists.
- Use headings (##) for major sections when appropriate.
- Leave a blank line between paragraphs and sections.
- Do not over-format simple answers.
- Keep answers suitable for a commuter mobile application.
- If they asked you outside the project's knowledge, your response should always be "I'm sorry, I'm only trained to assist with SmartSakay inquiries. Please contact an admin for other concerns."

OUTPUT FORMAT RULES:

- Return plain Markdown only.
- NEVER return HTML.
- NEVER use <br>, <br/>, <p>, <div>, <table>, <strong>, or other HTML tags.
- Do not put Markdown inside code blocks unless the user specifically asks for code.
- Prefer headings, paragraphs, bullet lists, and numbered lists.
- Avoid large tables on mobile.
- Keep paragraphs short.

You are an assistant, not a lawyer. For serious legal matters, recommend contacting the appropriate government agency or legal professional.
`;
};

// ======================================================
// GROQ CHAT
// ======================================================

const chatWithGroq = async (messages, systemPrompt) => {
  const formattedMessages = [
    {
      role: "system",
      content: systemPrompt,
    },

    ...messages
      .filter(
        (msg) =>
          (msg.role === "user" ||
            msg.role === "assistant" ||
            msg.role === "system") &&
          typeof msg.content === "string" &&
          msg.content.trim().length > 0,
      )
      .map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
  ];

  const completion = await groq.chat.completions.create({
    model: "openai/gpt-oss-120b",
    messages: formattedMessages,
    temperature: 0.5,
    max_completion_tokens: 1024,
  });

  const content = completion.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("Groq returned an empty response.");
  }

  return content;
};

// ======================================================
// LOCAL FALLBACK
// ======================================================

const generateLocalAssistantResponse = (messages) => {
  const lastUserMsg =
    [...messages]
      .reverse()
      .find((m) => m.role === "user")
      ?.content?.toLowerCase() || "";

  if (
    lastUserMsg.includes("right") ||
    lastUserMsg.includes("human right") ||
    lastUserMsg.includes("karapatan") ||
    lastUserMsg.includes("law") ||
    lastUserMsg.includes("batas") ||
    lastUserMsg.includes("bastos") ||
    lastUserMsg.includes("safe space") ||
    lastUserMsg.includes("11311") ||
    lastUserMsg.includes("senior") ||
    lastUserMsg.includes("pwd") ||
    lastUserMsg.includes("student")
  ) {
    return (
      `📜 **Commuter Rights & Transportation Laws**\n\n` +
      `• **Senior Citizens:** Eligible senior citizens may receive the applicable 20% fare discount.\n` +
      `• **PWDs:** Qualified PWD passengers may receive the applicable 20% discount and accessibility accommodations.\n` +
      `• **Students:** Qualified students may receive the applicable student fare discount with a valid school ID.\n` +
      `• **Safe Spaces Act:** Sexual harassment and gender-based sexual harassment in public transportation are prohibited.\n\n` +
      `If you experienced a transportation violation, you can document the incident and submit a complaint through SmartSakay.`
    );
  }

  if (
    lastUserMsg.includes("bus") ||
    lastUserMsg.includes("terminal") ||
    lastUserMsg.includes("victory") ||
    lastUserMsg.includes("five star") ||
    lastUserMsg.includes("solid north") ||
    lastUserMsg.includes("genesis") ||
    lastUserMsg.includes("joybus")
  ) {
    return (
      `🚌 **Dagupan Bus Terminals**\n\n` +
      `• **Victory Liner** – Perez Boulevard\n` +
      `• **Five Star Bus** – Perez Boulevard\n` +
      `• **Solid North Transit** – Perez Boulevard\n` +
      `• **Genesis / JoyBus** – M.H. Del Pilar Street\n` +
      `• **Dagupan Bus Company** – Perez Boulevard\n\n` +
      `You can use the SmartSakay Bus Terminal Locator to view available terminal information.`
    );
  }

  if (
    lastUserMsg.includes("fare") ||
    lastUserMsg.includes("rate") ||
    lastUserMsg.includes("magkano") ||
    lastUserMsg.includes("pamasahe") ||
    lastUserMsg.includes("price")
  ) {
    return (
      `💰 **Fare Information**\n\n` +
      `Please use the SmartSakay Fare Calculator for the fare based on your selected route and vehicle type.\n\n` +
      `If you provide your **starting point, destination, and vehicle type**, I can help explain the fare calculation.`
    );
  }

  if (
    lastUserMsg.includes("route") ||
    lastUserMsg.includes("jeep") ||
    lastUserMsg.includes("bonuan") ||
    lastUserMsg.includes("calasiao") ||
    lastUserMsg.includes("san fabian") ||
    lastUserMsg.includes("lingayen")
  ) {
    return (
      `🗺️ **SmartSakay Routes**\n\n` +
      `I can help you find routes between locations in Dagupan and nearby Pangasinan areas.\n\n` +
      `Please provide your **starting point and destination**.`
    );
  }

  return `Sorry, I've encountered an error. Please check your connection or your rate limit.`;
};

// ======================================================
// MAIN CHAT FUNCTION
// ======================================================

const chat = async (messages) => {
  let systemPrompt;

  try {
    systemPrompt = await buildSystemPrompt();
  } catch (error) {
    console.error("Failed to build SmartSakay system prompt:", error);

    systemPrompt = `
You are SmartSakay Assistant, a helpful commuter assistant for Dagupan City
and Pangasinan, Philippines.

Answer questions about public transportation, routes, fares,
commuter rights, and bus terminals.

Do not invent information.
`;
  }

  // Check API key
  if (!process.env.GROQ_API_KEY) {
    console.warn("GROQ_API_KEY is not configured.");
    return generateLocalAssistantResponse(messages);
  }

  try {
    const response = await chatWithGroq(messages, systemPrompt);

    return response;
  } catch (error) {
    console.error("Groq API Error:");

    if (error?.status) {
      console.error("Status:", error.status);
    }

    if (error?.message) {
      console.error("Message:", error.message);
    }

    if (error?.error) {
      console.error("Details:", error.error);
    }

    console.warn("Using SmartSakay local fallback.");

    return generateLocalAssistantResponse(messages);
  }
};

module.exports = {
  chat,
};
