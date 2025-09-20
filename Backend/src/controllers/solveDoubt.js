// Google GenAI ka SDK import kar rahe hain
// Iske through hum Gemini API ko call kar paayenge
const { GoogleGenAI } = require("@google/genai");


// ================== SOLVE DOUBT CONTROLLER ==================
// Ye function ek route handler hoga jo Gemini ko call karega
// Purpose: User ke doubt ko DSA context me solve karna
const solveDoubt = async (req, res) => {
    try {
        // Step 1: Gemini client ko initialize karna using API key (env se)
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

        // Step 2: Validate karna ki request me `messages` aaye hain
        // Ye chat history / prompts hote hain jo AI ko bhejna hai
        if (!req.body.messages) {
            return res.status(400).json({
                success: false,
                error: "Messages are required in the request body"
            });
        }

        // Request body me se saari zaroori fields nikaalna
        const { messages, title, description, visibleTestCases, startCode } = req.body;

        // Step 3: Messages ka structure validate karna (array hona chahiye)
        if (!Array.isArray(messages)) {
            return res.status(400).json({
                success: false,
                error: "Messages must be an array"
            });
        }

        // Inner function banaya hai jo Gemini API ko call karega
        async function main() {
            try {
                // Step 4: Gemini API call karna with model + context
                const response = await ai.models.generateContent({
                    model: "gemini-2.5-flash",  // Fast aur cost-effective model
                    contents: messages,        // User ke messages bhej rahe hain
                    config: {
                        // System instruction: Ye AI ke liye RULEBOOK hai
                        // Isme specify kiya gaya hai ki AI sirf DSA me help kare
                        systemInstruction: `
You are an expert Data Structures and Algorithms (DSA) tutor specializing in helping users solve coding problems. Your role is strictly limited to DSA-related assistance only.

## CURRENT PROBLEM CONTEXT:
[PROBLEM_TITLE]: ${title}
[PROBLEM_DESCRIPTION]: ${description}
[EXAMPLES]: ${visibleTestCases}
[startCode]: ${startCode}

## YOUR CAPABILITIES:
1. Hint Provider
2. Code Reviewer
3. Solution Guide
4. Complexity Analyzer
5. Approach Suggester
6. Test Case Helper

## INTERACTION GUIDELINES:
- Agar user hints maange → guiding questions + steps
- Agar user code bheje → bug explain karo, fix karo
- Agar optimal solution maange → explanation + code + complexity
- Agar multiple approaches puche → compare karke batao

## RESPONSE FORMAT:
- Clear explanations
- Properly formatted code
- Use examples
- Language → wahi jo user comfortable ho

## STRICT LIMITATIONS:
- Sirf current problem ke DSA context tak limited raho
- Non-DSA ya unrelated topics pe redirect karo politely

## TEACHING PHILOSOPHY:
- Guide user to think
- Explain the "why"
- Promote best practices
`
                    },
                });

                // Step 5: Response validate karna (empty na ho)
                if (!response || !response.text) {
                    throw new Error("Received empty response from Gemini API");
                }

                // Success response bhejna client ko
                res.status(200).json({
                    success: true,
                    message: response.text
                });

            } catch (apiError) {
                console.error("Gemini API Error:", apiError);

                // Step 6: Gemini API ke specific errors handle karna
                if (apiError.status === 400) {
                    return res.status(400).json({
                        success: false,
                        error: "Invalid request to Gemini API",
                        details: apiError.message
                    });
                }

                if (apiError.status === 403) {
                    return res.status(403).json({
                        success: false,
                        error: "API key is invalid or quota exceeded"
                    });
                }

                if (apiError.status === 429) {
                    return res.status(429).json({
                        success: false,
                        error: "Too many requests to Gemini API"
                    });
                }

                // Agar koi aur error ho to upar ke catch block handle karega
                throw apiError;
            }
        }

        // Step 7: Main function run karo
        await main();

    } catch (err) {
        console.error("Server Error:", err);

        // Step 8: Agar server level error hai to generic response bhejna
        const statusCode = err.statusCode || 500;

        res.status(statusCode).json({
            success: false,
            error: "An error occurred while processing your request",
            // Dev mode me extra details dikhana debugging ke liye
            ...(process.env.NODE_ENV === 'development' && {
                details: err.message,
                stack: err.stack
            })
        });
    }
}

// Controller ko export karna taki route me use ho sake
module.exports = solveDoubt;
