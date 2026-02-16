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

    await new Promise((r) => setTimeout(r, 1000));
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

function generateInitialsAvatar(name: string): string {
  const parts = name.trim().split(/\s+/);
  const initials = parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : parts[0].substring(0, 2).toUpperCase();

  const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">' +
    '<rect width="200" height="200" rx="20" fill="#0077B5"/>' +
    '<text x="100" y="100" dominant-baseline="central" text-anchor="middle" ' +
    'fill="white" font-family="Arial,sans-serif" font-size="80" font-weight="bold">' +
    initials + '</text></svg>';
  return "data:image/svg+xml," + encodeURIComponent(svg);
}

function mapProfileToCoveo(profile: Record<string, unknown>, linkedinUrl: string) {
  const name = (profile.name as string) || (profile.full_name as string) || "Unknown";
  const position = (profile.position as string) || "";
  const companyName = (profile.current_company_name as string) || "";
  const headline = (profile.headline as string) || position || "";
  const about = (profile.about as string) || (profile.summary as string) || "";
  const location = (profile.location as string) || "";

  const isDefaultAvatar = profile.default_avatar === true;
  const avatar = (profile.avatar as string) || "";
  const profilePic = (!isDefaultAvatar && avatar) ? avatar : generateInitialsAvatar(name);

  const experience = profile.experience;

  const types: string[] = [];
  if (companyName) types.push(companyName);
  if (location) types.push(location);
  if (types.length === 0) types.push("Professional");

  let body = "";
  if (headline) body += `${headline}\n\n`;
  if (companyName && !headline.includes(companyName)) body += `${companyName}\n\n`;
  if (about) body += `${about}\n\n`;
  if (location) body += `Location: ${location}\n\n`;
  if (experience && Array.isArray(experience)) {
    const recent = experience.slice(0, 3);
    for (const exp of recent) {
      const e = exp as Record<string, unknown>;
      const title = e.title || e.job_title || "";
      const company = e.company || e.company_name || "";
      if (title || company) body += `${title} at ${company}\n`;
    }
  }

  const species = headline
    || (position && companyName ? `${position} at ${companyName}` : position || companyName)
    || "LinkedIn Professional";

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
    pokemonspecies: species,
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

function checkAuth(req: NextRequest): Response | null {
  const token = process.env.ADMIN_TOKEN;
  if (!token) return null;
  const header = req.headers.get("authorization");
  if (header !== `Bearer ${token}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

export async function DELETE(req: NextRequest) {
  const authError = checkAuth(req);
  if (authError) return authError;

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
  const authError = checkAuth(req);
  if (authError) return authError;

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
    // Push to Coveo in background (don't block response)
    pushToCoveo(coveoDoc).catch((e) => console.error("Coveo push error:", e));

    return Response.json({
      success: true,
      name: coveoDoc.title,
      message: `${coveoDoc.title} has been added to the Pokedex!`,
      profile: {
        documentId: coveoDoc.documentId,
        title: coveoDoc.title,
        clickableUri: coveoDoc.clickableUri,
        pokemonimage: coveoDoc.pokemonimage,
        pokemontype: coveoDoc.pokemontype,
        pokemonspecies: coveoDoc.pokemonspecies,
        pokemongeneration: coveoDoc.pokemongeneration,
        pokemoncategory: coveoDoc.pokemoncategory,
        pokemonnumber: coveoDoc.pokemonnumber,
        data: coveoDoc.data,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}
