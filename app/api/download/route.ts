import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import fs from "fs";
import path from "path";

export async function POST(req: NextRequest) {
    try {
        const { urls, query } = await req.json();

        if (!urls || !Array.isArray(urls) || urls.length === 0) {
            return NextResponse.json({ error: "A list of URLs is required" }, { status: 400 });
        }

        if (!query) {
            return NextResponse.json({ error: "Query/Folder name is required" }, { status: 400 });
        }

        const rootPdfsDir = path.join(process.cwd(), "pdfs");
        const sanitizedQuery = query.replace(/[^a-zA-Z0-9.\-_]/g, "_").substring(0, 50);
        const queryDir = path.join(rootPdfsDir, sanitizedQuery);

        if (!fs.existsSync(queryDir)) {
            fs.mkdirSync(queryDir, { recursive: true });
        }

        const downloadedFiles: string[] = [];
        const errors: string[] = [];

        // Download in parallel with a limit or sequentially for stability
        for (const url of urls) {
            try {
                const response = await axios.get(url, {
                    responseType: "arraybuffer",
                    timeout: 20000,
                    headers: { "User-Agent": "Mozilla/5.0" }
                });

                let fileName = url.split("/").pop()?.split("?")[0] || `file-${Date.now()}.pdf`;
                fileName = fileName.replace(/[^a-zA-Z0-9.\-_]/g, "_");
                if (!fileName.toLowerCase().endsWith(".pdf")) fileName += ".pdf";

                const filePath = path.join(queryDir, fileName);
                fs.writeFileSync(filePath, Buffer.from(response.data));
                downloadedFiles.push(`${sanitizedQuery}/${fileName}`);
            } catch (err: any) {
                console.error(`Failed to download ${url}:`, err.message);
                errors.push(`${url}: ${err.message}`);
            }
        }

        return NextResponse.json({
            success: true,
            message: `Downloaded ${downloadedFiles.length} files. Errors: ${errors.length}`,
            files: downloadedFiles,
            errorCount: errors.length,
        });
    } catch (error: any) {
        console.error("Bulk download error:", error);
        return NextResponse.json(
            { error: error.message || "An error occurred during bulk download" },
            { status: 500 }
        );
    }
}
