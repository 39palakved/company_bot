
import dotenv from "dotenv";
dotenv.config();
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { PineconeStore } from "@langchain/pinecone";
import { OpenAIEmbeddings } from "@langchain/openai";

import { Pinecone as PineconeClient } from "@pinecone-database/pinecone";


const embeddings = new OpenAIEmbeddings({
  model: "text-embedding-3-small", 
  
  // READING API FROM .ENV IF WE ARE WRITING IN PROPER FORMAT IN ENV WE DONT NEET TO IMPORT HERE FROM ENV 
});
const pinecone = new PineconeClient({
     apiKey: process.env.PINECONE_API_KEY
});
const pineconeIndex = pinecone.Index(process.env.PINECONE_INDEX_NAME)


export const vectorStore = await PineconeStore.fromExistingIndex(embeddings,{
    pineconeIndex,
    maxConcurrency: 5
})
export async function indexTheDocument(filePath) {
 const loader =  new PDFLoader(filePath,{splitPages:false})
 const doc = await  loader.load()  // give each page in diff object


 //console.log(doc[0].pageContent)

 const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 500,
    chunkOverlap:100,
 })
 const texts = await textSplitter.splitText(doc[0].pageContent)
 const document = texts.map((chunk)=>{
    return{
        pageContent: chunk,
        metadata:doc[0].metadata
    }
 })
 await vectorStore.addDocuments(document)
 //console.log(texts)
}

