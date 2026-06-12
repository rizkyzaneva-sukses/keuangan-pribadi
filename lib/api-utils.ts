import { NextResponse } from "next/server";
import { ZodSchema, ZodError } from "zod";

/**
 * Wrapper untuk API route handler yang menambahkan:
 * - Try-catch error handling
 * - Zod validation (opsional)
 * - Consistent error responses
 */
export function apiHandler<T = unknown>(
  handler: (body: T) => Promise<NextResponse>,
  schema?: ZodSchema<T>
) {
  return async (req: Request) => {
    try {
      let body: T;

      if (schema) {
        const raw = await req.json().catch(() => ({}));
        const parsed = schema.safeParse(raw);
        if (!parsed.success) {
          return NextResponse.json(
            {
              message: "Validasi gagal",
              issues: parsed.error.flatten().fieldErrors,
            },
            { status: 400 }
          );
        }
        body = parsed.data;
      } else {
        body = await req.json().catch(() => ({} as T));
      }

      return await handler(body);
    } catch (err: unknown) {
      if (err instanceof ZodError) {
        return NextResponse.json(
          { message: "Validasi gagal", issues: err.flatten().fieldErrors },
          { status: 400 }
        );
      }

      const message =
        err instanceof Error ? err.message : "Terjadi kesalahan server";
      console.error("API Error:", err);
      return NextResponse.json({ message }, { status: 500 });
    }
  };
}

/**
 * Helper untuk response error yang konsisten
 */
export function errorResponse(message: string, status: number = 500) {
  return NextResponse.json({ message }, { status });
}
