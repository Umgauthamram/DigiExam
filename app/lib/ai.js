import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function generateQuestionAnalysis(questions) {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Prepare clean input
    const inputData = questions.map(q => ({
        id: q._id,
        text: q.text,
        options: q.options.map(o => o.text),
        correctOption: q.options.find(o => o.isCorrect)?.text || "Unknown"
    }));

    const prompt = `
    You are an expert exam analyzer. Analyze the following multiple-choice questions.
    
    For each question, return a JSON object containing:
    1. "id": The question ID provided.
    2. "aiExplanation": A concise explanation of the main concept and why the correct answer is right.
    3. "optionExplanations": An array of strings corresponding to the options in order. 
       - If the option is correct, explain why it's right.
       - If the option is incorrect, explain SPECIFICALLY why it is wrong/distractor.
    
    Input Questions:
    ${JSON.stringify(inputData)}

    Output purely valid JSON array. No markdown.
    `;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text();

        // Clean Code Blocks
        if (text.startsWith('```')) {
            text = text.replace(/^```json\s*/, '').replace(/^```\s*/, '').replace(/```$/, '');
        }

        return JSON.parse(text);
    } catch (e) {
        console.error("AI Analysis Failed:", e);
        return [];
    }
}
