import { AxiosError } from "axios";

export function extractErrorMessage(error: unknown, fallback: string): Error {
  if (error instanceof AxiosError) {
    const data = error.response?.data;

    if (Array.isArray(data?.detail)) {
      const messages = data.detail.map((err: any) => {
        const field = err.loc?.[err.loc.length - 1] || "field";
        return `${field}: ${err.msg}`;
      });
      return new Error(messages.join(", "));
    }

    if (typeof data?.detail === "string") {
      return new Error(data.detail);
    }

    if (!error.response) {
      return new Error("Network error: Unable to reach the server");
    }
  }

  if (error instanceof Error) return error;
  return new Error(fallback);
}