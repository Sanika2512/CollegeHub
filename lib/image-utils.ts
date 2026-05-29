const fallbackImage = "/college-placeholder.svg";

const imageExtensionPattern = /\.(?:avif|gif|jpe?g|png|webp)(?:[?#].*)?$/i;

export function normalizeImageSrc(value?: string | null, fallback = fallbackImage) {
  const normalized = normalizeStoredImagePath(value);
  return normalized || fallback;
}

export function normalizeStoredImagePath(value?: string | null) {
  const raw = value?.trim().replace(/^["']|["']$/g, "");
  if (!raw) return "";

  const withForwardSlashes = raw.replace(/\\/g, "/");
  const withoutOrigin = withForwardSlashes.replace(/^https?:\/\/localhost(?::\d+)?/i, "");

  if (/^(blob:|data:image\/)/i.test(withoutOrigin)) return withoutOrigin;
  if (/^file:\/\//i.test(withoutOrigin) || /^[a-z]:\//i.test(withoutOrigin)) return "";
  if (/^\/?public\/uploads\/colleges\//i.test(withoutOrigin)) {
    return withoutOrigin.replace(/^\/?public/i, "");
  }
  if (/^uploads\/colleges\//i.test(withoutOrigin)) return `/${withoutOrigin}`;
  if (/^\/uploads\/colleges\//i.test(withoutOrigin)) return withoutOrigin;
  if (/^\/college-placeholder\.svg$/i.test(withoutOrigin)) return withoutOrigin;
  if (/^https?:\/\//i.test(withoutOrigin)) return withoutOrigin;

  return withForwardSlashes.startsWith("/") ? withForwardSlashes : "";
}

export function isLikelyDirectImageUrl(value: string) {
  try {
    const url = new URL(value);
    return imageExtensionPattern.test(url.pathname) || url.hostname === "images.unsplash.com" || url.searchParams.has("fm");
  } catch {
    return imageExtensionPattern.test(value);
  }
}

export async function resolveImageUrl(value?: string | null) {
  const normalized = normalizeStoredImagePath(value);
  if (!normalized || !/^https?:\/\//i.test(normalized) || isLikelyDirectImageUrl(normalized)) {
    return normalized;
  }

  try {
    const response = await fetch(normalized, {
      redirect: "follow",
      headers: {
        accept: "image/avif,image/webp,image/*,text/html;q=0.8,*/*;q=0.5",
        "user-agent": "CollegeHub image resolver"
      }
    });

    const contentType = response.headers.get("content-type") ?? "";
    if (contentType.startsWith("image/")) return response.url;
    if (!contentType.includes("html")) return normalized;

    const html = (await response.text()).slice(0, 200_000);
    const match =
      html.match(/<meta[^>]+property=["']og:image(?::secure_url)?["'][^>]+content=["']([^"']+)["']/i) ??
      html.match(/<meta[^>]+name=["']twitter:image(?::src)?["'][^>]+content=["']([^"']+)["']/i) ??
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image(?::secure_url)?["']/i) ??
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image(?::src)?["']/i);

    return match?.[1]?.replace(/&amp;/g, "&") || normalized;
  } catch {
    return normalized;
  }
}
