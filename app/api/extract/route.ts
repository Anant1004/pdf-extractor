import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import fs from "fs";
import path from "path";
import { SERPAPI_KEY } from "../config";

export async function POST(req: NextRequest) {
    try {
        const { query } = await req.json();

        if (!query) {
            return NextResponse.json({ error: "Query is required" }, { status: 400 });
        }

        const url = `https://serpapi.com/search.json?q=${encodeURIComponent(
            query + " filetype:pdf"
        )}&api_key=${SERPAPI_KEY}`;

        const { data } = await axios.get(url);
        const rootPdfsDir = path.join(process.cwd(), "pdfs");

        // Sanitize query to use as a folder name
        const sanitizedQuery = query.replace(/[^a-zA-Z0-9.\-_]/g, "_").substring(0, 50);
        const queryDir = path.join(rootPdfsDir, sanitizedQuery);

        if (!fs.existsSync(queryDir)) {
            fs.mkdirSync(queryDir, { recursive: true });
        }

        const downloadedFiles: string[] = [];

        for (let result of data.organic_results || []) {
            if (result.link && result.link.toLowerCase().endsWith(".pdf")) {
                try {
                    const pdfResponse = await axios.get(result.link, {
                        responseType: "arraybuffer",
                        timeout: 15000, // 15 second timeout for each PDF
                    });

                    let fileName = result.link.split("/").pop() || `pdf-${Date.now()}.pdf`;
                    // Clean filename to avoid issues with specialized characters
                    fileName = fileName.replace(/[^a-zA-Z0-9.\-_]/g, "_");
                    if (!fileName.endsWith(".pdf")) fileName += ".pdf";

                    const filePath = path.join(queryDir, fileName);
                    fs.writeFileSync(filePath, Buffer.from(pdfResponse.data));
                    downloadedFiles.push(`${sanitizedQuery}/${fileName}`);
                } catch (downloadError) {
                    console.error(`Failed to download ${result.link}:`, downloadError);
                }
            }
        }

        return NextResponse.json({
            success: true,
            message: `Successfully downloaded ${downloadedFiles.length} PDFs.`,
            files: downloadedFiles,
        });
    } catch (error: any) {
        console.error("Extraction error:", error);
        return NextResponse.json(
            { error: error.message || "An error occurred during extraction" },
            { status: 500 }
        );
    }
}
