import { NextResponse } from "next/server";

import { auth } from "@/auth";

export default auth((request) => {
  if (!request.auth?.user) {
    const loginUrl = new URL("/login", request.nextUrl.origin);
    loginUrl.searchParams.set(
      "callbackUrl",
      `${request.nextUrl.pathname}${request.nextUrl.search}`
    );

    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/dashboard/:path*"]
};
