import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import * as cheerio from "cheerio";

const TARGET_SITES = [
    { name: "Internet Archive", url: "https://archive.org/search.php?query=[KEYWORD]&and[]=mediatype%3A%22texts%22" },
    { name: "NCERT", url: "https://ncert.nic.in/textbook.php" },
    { name: "UNESCO", url: "https://unesdoc.unesco.org/search/[KEYWORD]" },
];

export async function POST(req: NextRequest) {
    try {
        const { keyword } = await req.json();

        if (!keyword) {
            return NextResponse.json({ error: "Keyword is required" }, { status: 400 });
        }

        const allPdfs: { url: string; source: string; filename: string }[] = [];

        // For simplicity and stability in this demo, let's scrape a few pre-defined accessible educational pages 
        // or simulate the search logic for the target sites.
        // In a real scenario, each site needs custom logic because of CSR or different HTML structures.

        const searchUrls = [
            `https://archive.org/search.php?query=${encodeURIComponent(keyword)}+AND+mediatype:texts`,
            // Add more searchable direct-link sites here
        ];

        for (const url of searchUrls) {
            try {
                const { data } = await axios.get(url, { headers: { "User-Agent": "Mozilla/5.0" }, timeout: 10000 });
                const $ = cheerio.load(data);

                $("a").each((_, el) => {
                    const href = $(el).attr("href");
                    if (href && (href.toLowerCase().endsWith(".pdf") || href.includes("download"))) {
                        let fullUrl = href;
                        if (!href.startsWith("http")) {
                            const baseUrl = new URL(url).origin;
                            fullUrl = new URL(href, baseUrl).href;
                        }

                        if (fullUrl.toLowerCase().includes(keyword.toLowerCase()) || fullUrl.toLowerCase().endsWith(".pdf")) {
                            const filename = fullUrl.split("/").pop()?.split("?")[0] || `file-${Date.now()}.pdf`;
                            if (!allPdfs.find(p => p.url === fullUrl)) {
                                allPdfs.push({ url: fullUrl, source: "Scraper", filename });
                            }
                        }
                    }
                });
            } catch (err) {
                console.error(`Error scraping ${url}:`, err);
            }
        }

        // Limit results for performance
        const results = allPdfs.slice(0, 20);

        return NextResponse.json({
            success: true,
            results,
            message: `Found ${results.length} potential PDF links.`,
        });
    } catch (error: any) {
        console.error("Scraping error:", error);
        return NextResponse.json(
            { error: error.message || "An error occurred during scraping" },
            { status: 500 }
        );
    }
}
