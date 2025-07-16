const OpenAI = require("openai");

// Configure the OpenAI client to use the OpenRouter endpoint
const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

exports.handler = async function(event, context) {
  // Only allow POST requests
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { resumeText } = JSON.parse(event.body);

    if (!resumeText) {
      return { statusCode: 400, body: "Missing resumeText in request body" };
    }

    const completion = await openai.chat.completions.create({
      model: "openai/gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a skeptical, world-class hiring manager and a specialist in forensic linguistics. Your primary goal is to assess the authenticity of a resume. Analyze the provided resume text for red flags like AI-generated language, disproportionate claims, and vague achievements. You MUST return a single, clean JSON object with exactly two keys: 'riskScore' (a number from 0-100) and 'analysis' (a markdown-formatted string detailing the specific red flags found, citing examples from the text)."
        },
        {
          role: "user",
          content: resumeText
        }
      ],
      response_format: { type: "json_object" } // Ensure the response is always JSON
    });

    const analysisResult = JSON.parse(completion.choices[0].message.content);

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify(analysisResult),
    };

  } catch (error) {
    console.error("Error during AI analysis:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to process the resume." }),
    };
  }
};