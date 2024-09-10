import { NextResponse, NextRequest } from "next/server";
import { incrementAndLogTokenUsage } from "@/lib/incrementAndLogTokenUsage";
import { handleAuthorization } from "@/lib/handleAuthorization";
import { getModel } from "@/lib/models";
import { z } from "zod";
import { generateObject } from "ai";

const documentTypes = [
  "Study Guides", "Travel Plans/Itineraries", "Budget/Expense Tracking",
  "Workout Logs", "Habit Trackers", "Mind Maps", "Goal Setting",
  "Event Planning", "Recipe Collections", "Dreams Journal",
  "Reading Lists", "Contact Lists", "Shopping Lists",
  "Reflection Notes", "Lesson Plans", "Tutorials/How-To Guides",
  "Health/Medical Logs", "Meditation/Gratitude Journals",
  "Conference/Workshop Notes", "Inspirational Quotes"
];

export async function POST(request: NextRequest) {
  try {
    const { userId } = await handleAuthorization(request);
    const { document, renameInstructions, currentName } = await request.json();
    const model = getModel(process.env.MODEL_NAME);
    const prompt = `As an AI specializing in document analysis, your task is to generate highly specific and unique titles for the given document. The document may be one of the following types, but is not limited to these: ${documentTypes.join(", ")}. Analyze the content thoroughly to identify key elements such as:

    - The primary document type from the list provided
    - Specific project, company, book, movie, or other key identifier when it is relevant
    - Main topics or themes
    - Specific projects, products, or initiatives
    - Key stakeholders or entities involved
    - Crucial actions, decisions, or outcomes

    Create 3 distinct titles that capture the essence of the document. Each title should:
    - Mention the identified primary document type
    - Include the specific project, company, book, movie, or other key identifier
    - Be highly specific and unique to the document's content
    - Contain no more than 40 characters (including the document type). The shorter the better
    - Avoid using special characters
    - Be easily searchable and relevant
    - Not follow any predefined patterns or formats

    Examples:
    - "HP1 Study Guide: Sorcerer's Stone Ch1-5"
    - "Johnson Europe Trip '23"
    - "Q2 Marketing: XYZ Corp Budget"
    - "Marathon Log: J. Smith (Week 1)"
    - "2023 Q3 Sales Goals Tracker"
    - "Green Corp Annual Picnic Plan"
    - "Python 101: Lessons 1-3"
    - "Meal Prep: Vegan Dinners"
    - "Q4 Project Roadmap"


each title should vary between these formats and specificity should vary between 0.8 and 1 out of 1. avoid using the same format for all titles. very important

    Additional context:
    Time: ${new Date().toISOString()}
    Current Name: ${currentName}
    Document Content: ${document}

    ${renameInstructions}
`;

    const system = `Only answer with human readable titles`;

    const generateTitlesData = await generateObject({
      model,
      temperature: 0.5,
      schema: z.object({
        names: z.array(z.string().max(60)).length(3),
      }),
      system,
      prompt,
    });
    const titles = generateTitlesData.object.names;
    const tokens = generateTitlesData.usage.totalTokens;
    await incrementAndLogTokenUsage(userId, tokens);

    const response = NextResponse.json({ titles });
    response.headers.set("Access-Control-Allow-Origin", "*");

    return response;
  } catch (error) {
    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
  }
}