import { NextRequest, NextResponse } from "next/server";
import { downloadPdfsForTopic } from "../utils/pdfDownloader";

export async function POST(req: NextRequest) {
    try {
        const { topics } = await req.json();

        if (!topics || !Array.isArray(topics) || topics.length === 0) {
            return NextResponse.json(
                { error: "Topics list is required and must be a non-empty array" },
                { status: 400 }
            );
        }

        const results = [];
        const allDownloadedFiles: string[] = [];

        // Process topics sequentially to avoid hitting SerpApi rate limits too hard 
        // and to keep tracking simple for this version.
        for (const topic of topics) {
            const result = await downloadPdfsForTopic(topic);
            results.push(result);
            if (result.success) {
                allDownloadedFiles.push(...result.files);
            }
        }

        const successCount = results.filter(r => r.success).length;

        return NextResponse.json({
            success: true,
            summary: {
                totalTopics: topics.length,
                successCount: successCount,
                failedCount: topics.length - successCount,
            },
            results: results,
            allFiles: allDownloadedFiles,
            message: `Processed ${topics.length} topics. Successfully downloaded PDFs for ${successCount} topics.`
        });
    } catch (error: any) {
        console.error("Bulk extraction error:", error);
        return NextResponse.json(
            { error: error.message || "An error occurred during bulk extraction" },
            { status: 500 }
        );
    }
}
