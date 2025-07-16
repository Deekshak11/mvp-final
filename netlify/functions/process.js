const OpenAI = require("openai");

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

exports.handler = async function(event, context) {
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
          // THE FINAL PROMPT: Demands BOTH sections in the correct format.
          content: "You are a skeptical hiring manager. Analyze the resume for red flags. You MUST return a single, clean JSON object with THREE keys: 'riskScore' (0-100), 'redFlagsAnalysis' (a markdown-bulleted list of concise, one-sentence red flags), and 'strategicRecommendation' (a markdown-bulleted list of concise, one-sentence next steps based on the flags). For example: '• **Vague Objective**: The objective lacks specific, quantifiable goals.'"
        },
        {
          role: "user",
          content: resumeText
        }
      ],
      response_format: { type: "json_object" }
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