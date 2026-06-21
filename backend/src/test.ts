import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

async function main() {
  console.log(process.env.GEMINI_API_KEY?.substring(0, 5));

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
  });

  const result = await model.generateContent("Hello");
  console.log(result.response.text());
}

main().catch(console.error);
