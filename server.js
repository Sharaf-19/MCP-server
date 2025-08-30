import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import dotenv from "dotenv";
import { google } from "googleapis";
import { z } from "zod";

dotenv.config();

// create the MCP server
const server = new McpServer({
  name: "Sharaf's Calendar",
  version: "1.0.0",
});

// tool function
async function getMyCalendarDataByDate(date) {
  const calendar = google.calendar({
    version: "v3",
    auth: process.env.GOOGLE_PUBLIC_API_KEY,
  });

  // Ensure we have a Date object
  const inputDate = date instanceof Date ? date : new Date(date);

  // Calculate the start and end of the given date (UTC)
  const start = new Date(inputDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  try {
    const res = await calendar.events.list({
      calendarId: process.env.CALENDAR_ID,
      timeMin: start.toISOString(),
      timeMax: end.toISOString(),
      maxResults: 10,
      singleEvents: true,
      orderBy: "startTime",
      timeZone: "Asia/Riyadh",
    });

    console.log("API response:", res.data);

    const events = res.data.items || [];
    const meetings = events.map((event) => {
      const start = event.start.dateTime || event.start.date;
      return `${event.summary} at ${start}`;
    });

    return { meetings };
  } catch (err) {
    return { error: err.message };
  }
}

// register the tool to MCP
server.tool(
  "getMyCalendarDataByDate",
  {
    date: z.string().optional(), // make optional
  },
  async ({ date }) => {

  
    let targetDate;
    if (!date || date.toLowerCase() === "today") {
      targetDate = new Date();
    } else if (date.toLowerCase() === "tomorrow") {
      targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + 1);
    } else {
      targetDate = new Date(date);
    }
  
  
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(await getMyCalendarDataByDate(targetDate)),
        },
      ],
    };
  }  
);

// set transport
async function init() {
  const transport = new StdioServerTransport();
  console.log("🚀 MCP server starting...");

  await server.connect(transport);
  console.log("✅ MCP server connected via stdio");
}

// call the initialization
init();
