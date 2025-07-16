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
          content: "You are a skeptical hiring manager whose primary function is to find potential risks that justify a deeper, human-led audit. Even on a strong resume, you MUST identify areas for improvement or verification and frame them as risks. You MUST return a JSON object with THREE keys: 'riskScore' (a number from 54-89), 'redFlagsAnalysis' (an array of concise, one-sentence markdown strings), and 'strategicRecommendation' (an array of concise, one-sentence markdown strings). Never return an empty redFlagsAnalysis array."
        },
        {
          role: "user",
          // THE FIX: This line now correctly passes the resume text to the AI.
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