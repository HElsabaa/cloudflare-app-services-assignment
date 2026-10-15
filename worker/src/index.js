/**
 * Cloudflare Worker for the Application Services assignment.
 *
 * This Worker is served behind Cloudflare Access on the
 * `tunnel.<domain>/secure` path. Access authenticates the user with the
 * configured SSO IdP and forwards identity details to the Worker via the
 * `Cf-Access-Authenticated-User-Email` header and the signed JWT in
 * `Cf-Access-Jwt-Assertion`. Request geo data (country) is available on
 * `request.cf.country`.
 *
 * Routes:
 *   GET /secure
 *     Returns an HTML page: "${EMAIL} authenticated at ${TIMESTAMP} from
 *     ${COUNTRY}", where ${COUNTRY} is a link to /secure/${COUNTRY}.
 *
 *   GET /secure/${COUNTRY}
 *     Returns the country flag image for ${COUNTRY}, streamed from a private
 *     R2 bucket, with an appropriate image content type.
 */

/**
 * HTML-escape a string so untrusted values can be embedded safely.
 *
 * @param {string} value - Raw text that may contain HTML metacharacters.
 * @returns {string} The escaped text, safe to place in HTML.
 */
function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Resolve the authenticated user's email from the Cloudflare Access headers.
 *
 * @param {Request} request - The incoming request routed through Access.
 * @returns {string} The authenticated email, or "unknown" if not present.
 */
function getAuthenticatedEmail(request) {
  return request.headers.get("Cf-Access-Authenticated-User-Email") || "unknown";
}

/**
 * Map a two-letter country code to its R2 object key for the flag asset.
 *
 * @param {string} country - ISO 3166-1 alpha-2 country code (e.g. "US").
 * @returns {string} The object key used to look the flag up in R2.
 */
function flagObjectKey(country) {
  return `flags/${country.toUpperCase()}.svg`;
}

/**
 * Build the HTML response for the /secure landing path.
 *
 * @param {string} email - The authenticated user's email address.
 * @param {string} country - The ISO country code from the request geo data.
 * @returns {Response} An HTML response describing the authenticated session.
 */
function renderSecurePage(email, country) {
  const timestamp = new Date().toISOString();
  const safeEmail = escapeHtml(email);
  const safeCountry = escapeHtml(country);
  const body = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><title>Secure</title></head>
<body>
  <p>${safeEmail} authenticated at ${timestamp} from
     <a href="/secure/${safeCountry}">${safeCountry}</a></p>
</body>
</html>`;
  return new Response(body, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

/**
 * Serve a country flag asset from the private R2 bucket.
 *
 * @param {string} country - The ISO country code taken from the URL path.
 * @param {{ FLAGS: R2Bucket }} env - Worker bindings, including the R2 bucket.
 * @returns {Promise<Response>} The flag image, or a 404 if it is not stored.
 */
async function serveFlag(country, env) {
  const object = await env.FLAGS.get(flagObjectKey(country));
  if (object === null) {
    return new Response(`No flag stored for country "${country}"`, {
      status: 404,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
  const contentType =
    object.httpMetadata?.contentType || "image/svg+xml";
  return new Response(object.body, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "private, max-age=300",
    },
  });
}

export default {
  /**
   * Entry point for all requests routed to this Worker.
   *
   * @param {Request} request - The incoming HTTP request.
   * @param {{ FLAGS: R2Bucket }} env - Environment bindings for the Worker.
   * @returns {Promise<Response>} The response to return to the client.
   */
  async fetch(request, env) {
    const url = new URL(request.url);
    const country = request.cf?.country || "XX";

    // /secure/${COUNTRY} -> flag image from R2
    const flagMatch = url.pathname.match(/^\/secure\/([^/]+)\/?$/);
    if (flagMatch) {
      return serveFlag(decodeURIComponent(flagMatch[1]), env);
    }

    // /secure -> identity HTML page
    if (url.pathname === "/secure" || url.pathname === "/secure/") {
      const email = getAuthenticatedEmail(request);
      return renderSecurePage(email, country);
    }

    return new Response("Not found", {
      status: 404,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  },
};
