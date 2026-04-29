import { cookies } from "next/headers";
import { IronSessionOptions, getIronSession } from "iron-session";

export type SessionData = {
  userId?: number;
  email?: string;
  isLoggedIn: boolean;
};

export const sessionOptions: IronSessionOptions = {
  password: process.env.SESSION_SECRET || "dev-secret-dev-secret-dev-secret-32char",
  cookieName: "keuangan_pribadi_session",
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  },
};

export async function getSession() {
  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions);
  if (session.isLoggedIn === undefined) {
    session.isLoggedIn = false;
  }
  return session;
}
