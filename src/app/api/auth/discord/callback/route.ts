import { NextRequest, NextResponse } from "next/server";
import { DiscordService } from "@/lib/discordService";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebaseClient";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    if (error) {
      return NextResponse.redirect(
        new URL(`/profile?error=discord_auth_cancelled`, request.url)
      );
    }

    if (!code) {
      return NextResponse.redirect(
        new URL(`/profile?error=discord_auth_failed`, request.url)
      );
    }

    // Exchange code for access token
    const tokenData = await DiscordService.exchangeCodeForToken(code);
    
    // Get Discord user information
    const discordUser = await DiscordService.getUserInfo(tokenData.access_token);

    // TODO: Get the current user ID from session/auth
    // For now, we'll redirect with the Discord data
    const discordProfile = {
      id: discordUser.id,
      username: discordUser.username,
      discriminator: discordUser.discriminator,
      global_name: discordUser.global_name,
      avatar: discordUser.avatar,
      verified: discordUser.verified,
      linkedAt: new Date()
    };

    // Redirect back to profile with success message
    const params = new URLSearchParams({
      discord_linked: "true",
      discord_id: discordUser.id,
      discord_username: discordUser.username
    });

    return NextResponse.redirect(
      new URL(`/profile?${params.toString()}`, request.url)
    );

  } catch (error) {
    console.error("Discord OAuth callback error:", error);
    return NextResponse.redirect(
      new URL(`/profile?error=discord_auth_error`, request.url)
    );
  }
}
