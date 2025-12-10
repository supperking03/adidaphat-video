import { NextRequest, NextResponse } from "next/server";

/**
 * TikTok OAuth Helper Endpoint
 * 
 * This endpoint helps you get TikTok access token through OAuth flow.
 * 
 * Usage:
 * 1. Visit: /api/tiktok/oauth?action=authorize
 * 2. You'll be redirected to TikTok authorization page
 * 3. After authorization, TikTok redirects back with code
 * 4. This endpoint exchanges code for access token
 * 
 * Environment variables needed:
 * - TIKTOK_CLIENT_KEY
 * - TIKTOK_CLIENT_SECRET
 * - TIKTOK_REDIRECT_URI (must match TikTok app settings)
 */

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const action = searchParams.get("action");
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  const clientKey = process.env.TIKTOK_CLIENT_KEY;
  const clientSecret = process.env.TIKTOK_CLIENT_SECRET;
  const redirectUri = process.env.TIKTOK_REDIRECT_URI || `${req.nextUrl.origin}/api/tiktok/oauth`;

  if (!clientKey || !clientSecret) {
    return NextResponse.json(
      { error: "Missing TIKTOK_CLIENT_KEY or TIKTOK_CLIENT_SECRET" },
      { status: 500 }
    );
  }

  // Step 1: Redirect to TikTok authorization
  if (action === "authorize" || !code) {
    const authState = state || Math.random().toString(36).substring(7);
    const authUrl = `https://www.tiktok.com/v2/auth/authorize/?` +
      `client_key=${clientKey}&` +
      `scope=video.upload,video.publish&` +
      `response_type=code&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `state=${authState}`;

    return NextResponse.redirect(authUrl);
  }

  // Step 2: Exchange code for access token
  if (code) {
    try {
      const tokenResponse = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          client_key: clientKey,
          client_secret: clientSecret,
          code: code,
          grant_type: "authorization_code",
          redirect_uri: redirectUri,
        }),
      });

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        return NextResponse.json(
          { error: "Failed to get access token", details: errorText },
          { status: 500 }
        );
      }

      const tokenData = (await tokenResponse.json()) as {
        access_token?: string;
        refresh_token?: string;
        expires_in?: number;
        refresh_expires_in?: number;
        scope?: string;
        token_type?: string;
      };

      return NextResponse.json({
        success: true,
        message: "Access token obtained successfully",
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_in: tokenData.expires_in,
        refresh_expires_in: tokenData.refresh_expires_in,
        scope: tokenData.scope,
        token_type: tokenData.token_type,
        instructions: [
          "1. Copy the access_token value above",
          "2. Add it to Vercel environment variables as TIKTOK_ACCESS_TOKEN",
          "3. Save refresh_token for future token refresh",
          "4. Note: Access tokens expire, you'll need to refresh them periodically",
        ],
      });
    } catch (error) {
      return NextResponse.json(
        {
          error: "Error exchanging code for token",
          details: error instanceof Error ? error.message : String(error),
        },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ error: "Invalid request" }, { status: 400 });
}

