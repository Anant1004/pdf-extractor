import { NextRequest, NextResponse } from "next/server";
import { downloadPdfsForTopic } from "../utils/pdfDownloader";

export async function POST(req: NextRequest) {
    try {
        const { query } = await req.json();

        if (!query) {
            return NextResponse.json({ error: "Query is required" }, { status: 400 });
        }

        const result = await downloadPdfsForTopic(query);

        if (result.success) {
            return NextResponse.json({
                success: true,
                message: result.message,
                files: result.files,
            });
        } else {
            return NextResponse.json({ error: result.message }, { status: 500 });
        }
    } catch (error: any) {
        console.error("Extraction route error:", error);
        return NextResponse.json(
            { error: error.message || "An error occurred during extraction" },
            { status: 500 }
        );
    }
}
