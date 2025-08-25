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

    // Calculate the start and end of the given date (UTC)
    const start = new Date(date);
    start.setUTCHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 1);

    try {
        const res = await calendar.events.list({
            calendarId: process.env.CALENDAR_ID,
            timeMin: start.toISOString(),
            timeMax: end.toISOString(),
            maxResults: 10,
            singleEvents: true,
            orderBy: "startTime",
        });

        const events = res.data.items || [];
        const meetings = events.map((event) => {
            const start = event.start.dateTime || event.start.date;
            return `${event.summary} at ${start}`;
        });

        if (meetings.length > 0) {
            return {
                meetings,
            };
        } else {
            return {
                meetings: [],
            };
        }
    } catch (err) {
        return {
            error: err.message,
        };
    }
}

// register the tool to MCP
server.registerTool(
    "getMyCalendarDataByDate",
    {
      date: z.string().describe("Date string (YYYY-MM-DD) or 'today'"),
    },
    async ({ date }) => {
      let targetDate;
      if (date.toLowerCase() === "today") {
        targetDate = new Date();
      } else {
        const parsed = Date.parse(date);
        if (isNaN(parsed)) {
          return {
            content: [
              { type: "text", text: "❌ Invalid date. Use YYYY-MM-DD or 'today'." },
            ],
          };
        }
        targetDate = new Date(parsed);
      }
  
      const result = await getMyCalendarDataByDate(targetDate.toISOString());
  
      return {
        content: [
          { type: "text", text: JSON.stringify(result, null, 2) },
        ],
      };
    }
  );

// set transfort
async function init() {
    const transport = new StdioServerTransport();
    console.log("🚀 MCP server starting...");

    await server.connect(transport);
    console.log("✅ MCP server connected via stdio");

}

// call the initialization
init();