import dotenv from "dotenv";
dotenv.config();

import { vectorStore } from "./prepare.js";
import Groq from "groq-sdk";
import readline from "node:readline/promises";

const groq = new Groq({ apikey: process.env.GROQ_API_KEY });

export async function Chat() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  while (true) {
    const question = await rl.question("You: ");

    if (question.trim() === "/bye") {
      console.log("Goodbye!");
      break;
    }

    try {
     
      const directCompletion = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content:
              "You are a helpful assistant. Answer the question to the best of your knowledge. If you don't know, just say 'I don't know'.",
          },
          { role: "user", content: question },
        ],
      });

      const directAnswer = directCompletion.choices[0].message.content;

      if (!directAnswer.toLowerCase().includes("i don't know")) {
        console.log("Assistant:", directAnswer);
        continue; 
      }

   
      const relevantChunks = await vectorStore.similaritySearch(question, 3);

      if (relevantChunks.length === 0) {
        console.log("Assistant: I don't know.");
        continue;
      }

      const context = relevantChunks.map((chunk) => chunk.pageContent).join("\n\n");

      const systemPrompt = `You are an assistant for question-answering tasks. Use the following relevant pieces of restricted context to answer the question. If you don't know the answer, say "I don't know".\n\nContext:\n${context}`;

      const userQuery = `Question: ${question}\nAnswer:`;

      const completion = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userQuery },
        ],
      });

      console.log("Assistant:", completion.choices[0].message.content);
    } catch (err) {
      console.error("Error:", err.message);
    }
  }

  rl.close();
}


Chat();
