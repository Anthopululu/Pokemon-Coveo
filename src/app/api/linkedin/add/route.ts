import { NextRequest } from "next/server";

const BRIGHT_DATA_TOKEN = process.env.BRIGHT_DATA_API_TOKEN;
const DATASET_ID = "gd_l1viktl72bvl7bjuj0";
const COVEO_ORG_ID = process.env.COVEO_ORG_ID;
const COVEO_API_KEY = process.env.COVEO_API_KEY;
const COVEO_SOURCE_ID = process.env.COVEO_SOURCE_ID;

async function triggerScrape(linkedinUrl: string): Promise<string> {
  const res = await fetch(
    `https://api.brightdata.com/datasets/v3/trigger?dataset_id=${DATASET_ID}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${BRIGHT_DATA_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([{ url: linkedinUrl }]),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Bright Data trigger failed: ${err}`);
  }

  const data = await res.json();
  return data.snapshot_id;
}

async function pollForCompletion(snapshotId: string): Promise<void> {
  const maxAttempts = 60;
  for (let i = 0; i < maxAttempts; i++) {
    const res = await fetch(
      `https://api.brightdata.com/datasets/v3/progress/${snapshotId}`,
      {
        headers: { Authorization: `Bearer ${BRIGHT_DATA_TOKEN}` },
      }
    );

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Progress check failed: ${err}`);
    }

    const data = await res.json();
    if (data.status === "ready") return;
    if (data.status === "failed") throw new Error("Bright Data scrape failed");

    await new Promise((r) => setTimeout(r, 2000));
  }

  throw new Error("Scraping timed out after 2 minutes");
}

async function fetchSnapshot(snapshotId: string): Promise<Record<string, unknown>> {
  const res = await fetch(
    `https://api.brightdata.com/datasets/v3/snapshot/${snapshotId}?format=json`,
    {
      headers: { Authorization: `Bearer ${BRIGHT_DATA_TOKEN}` },
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Snapshot fetch failed: ${err}`);
  }

  const data = await res.json();
  return Array.isArray(data) ? data[0] : data;
}

function mapProfileToCoveo(profile: Record<string, unknown>, linkedinUrl: string) {
  const name = (profile.name as string) || (profile.full_name as string) || "Unknown";
  const headline = (profile.headline as string) || (profile.job_title as string) || "";
  const industry = (profile.industry as string) || "";
  const about = (profile.about as string) || (profile.summary as string) || "";
  const profilePic = (profile.profile_pic_url as string) || (profile.avatar as string) || "";
  const experience = profile.experience;

  const types: string[] = [];
  if (industry) types.push(industry);
  if (profile.skills && Array.isArray(profile.skills)) {
    for (const skill of profile.skills.slice(0, 2)) {
      const skillName = typeof skill === "string" ? skill : (skill as Record<string, unknown>).name as string;
      if (skillName) types.push(skillName);
    }
  }
  if (types.length === 0) types.push("Professional");

  let body = "";
  if (headline) body += `${headline}\n\n`;
  if (about) body += `${about}\n\n`;
  if (experience && Array.isArray(experience)) {
    const recent = experience.slice(0, 3);
    for (const exp of recent) {
      const e = exp as Record<string, unknown>;
      const title = e.title || e.job_title || "";
      const company = e.company || e.company_name || "";
      if (title || company) body += `${title} at ${company}\n`;
    }
  }

  return {
    documentId: `linkedin://${linkedinUrl.replace(/https?:\/\//, "")}`,
    title: name,
    clickableUri: linkedinUrl,
    data: body || `${name} - LinkedIn Profile`,
    fileExtension: ".html",
    permissions: [
      {
        allowAnonymous: true,
      },
    ],
    pokemonimage: profilePic,
    pokemonnumber: 0,
    pokemontype: types,
    pokemonspecies: headline || "LinkedIn Professional",
    pokemongeneration: "LinkedIn",
    pokemoncategory: "People",
  };
}

async function pushToCoveo(document: ReturnType<typeof mapProfileToCoveo>) {
  const { documentId, title, clickableUri, data, fileExtension, permissions, ...customFields } = document;

  const url = `https://api.cloud.coveo.com/push/v1/organizations/${COVEO_ORG_ID}/sources/${COVEO_SOURCE_ID}/documents?documentId=${encodeURIComponent(documentId)}`;

  const body = {
    title,
    clickableUri,
    data,
    fileExtension,
    permissions,
    ...customFields,
  };

  const res = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${COVEO_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Coveo push failed: ${err}`);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { documentId } = await req.json();

    if (!documentId) {
      return Response.json({ error: "Missing documentId" }, { status: 400 });
    }

    const url = `https://api.cloud.coveo.com/push/v1/organizations/${COVEO_ORG_ID}/sources/${COVEO_SOURCE_ID}/documents?documentId=${encodeURIComponent(documentId)}`;

    const res = await fetch(url, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${COVEO_API_KEY}`,
      },
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Coveo delete failed: ${err}`);
    }

    return Response.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { url: linkedinUrl } = await req.json();

    if (!linkedinUrl || !linkedinUrl.includes("linkedin.com/in/")) {
      return Response.json(
        { error: "Please provide a valid LinkedIn profile URL" },
        { status: 400 }
      );
    }

    if (!BRIGHT_DATA_TOKEN) {
      return Response.json(
        { error: "Bright Data API token not configured" },
        { status: 500 }
      );
    }

    const snapshotId = await triggerScrape(linkedinUrl);
    await pollForCompletion(snapshotId);
    const profile = await fetchSnapshot(snapshotId);
    const coveoDoc = mapProfileToCoveo(profile, linkedinUrl);
    await pushToCoveo(coveoDoc);

    return Response.json({
      success: true,
      name: coveoDoc.title,
      message: `${coveoDoc.title} has been added to the Pokedex!`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}
