export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    // Board sayfalarını koru, login ve API route'larını hariç tut
    "/((?!login|api|_next/static|_next/image|favicon.ico).*)",
  ],
};
