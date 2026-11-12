const configuredApiUrl = (
  process.env.NEXT_PUBLIC_API_URL ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "https://vocab-builder-backend.p.goit.global/api"
).trim().replace(/\/+$/, "");
const API_BASE_URL = configuredApiUrl.replace(/\/api-docs$/i, "/api");

export type AuthPayload = {
  name?: string;
  email: string;
  password: string;
};

export type AuthResponse = {
  name: string;
  email: string;
  token: string;
};

export async function authenticate(
  action: "signup" | "signin",
  payload: AuthPayload,
): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/users/${action}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    const message =
      typeof errorBody?.message === "string" && !/[\u0400-\u04FF]/.test(errorBody.message)
        ? errorBody.message
        : response.status === 409
          ? "An account with this email already exists."
          : response.status === 401
            ? "Incorrect email or password."
            : "The request failed. Please try again.";

    throw new Error(message);
  }

  return response.json() as Promise<AuthResponse>;
}

export type DictionaryWord = {
  _id: string;
  en: string;
  ua: string;
  category: string;
  isIrregular?: boolean;
  progress?: number;
};

export type WordPage = {
  results: DictionaryWord[];
  totalPages: number;
  page: number;
  perPage: number;
};

export type WordInput = {
  en: string;
  ua: string;
  category: string;
  isIrregular?: boolean;
};

async function authorizedMutation(path: string, token: string, method: string, payload?: unknown) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(payload ? { "Content-Type": "application/json" } : {}),
    },
    body: payload ? JSON.stringify(payload) : undefined,
    cache: "no-store",
  });
  if (!response.ok) {
    if (response.status === 401) throw new Error("SESSION_EXPIRED");
    const body = await response.json().catch(() => null);
    const message = typeof body?.message === "string" && !/[\u0400-\u04FF]/.test(body.message)
      ? body.message
      : "Could not save your changes. Please try again.";
    throw new Error(message);
  }
  return response.status === 204 ? null : response.json().catch(() => null);
}

async function authorizedFetch(path: string, token: string) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("SESSION_EXPIRED");
    }
    throw new Error("Could not load your dictionary. Please try again.");
  }

  return response.json();
}

export function getOwnWords(
  token: string,
  params: { keyword?: string; category?: string; isIrregular?: boolean; page?: number; limit?: number } = {},
) {
  const search = new URLSearchParams({ page: String(params.page ?? 1), limit: String(params.limit ?? 10) });
  if (params.keyword) search.set("keyword", params.keyword);
  if (params.category) search.set("category", params.category);
  if (params.category === "verb" && params.isIrregular !== undefined) {
    search.set("isIrregular", String(params.isIrregular));
  }
  return authorizedFetch(`/words/own?${search.toString()}`, token) as Promise<WordPage>;
}

export function createWord(token: string, payload: WordInput) {
  return authorizedMutation("/words", token, "POST", payload);
}

export function updateWord(token: string, id: string, payload: WordInput) {
  return authorizedMutation(`/words/${id}`, token, "PATCH", payload);
}

export function deleteWord(token: string, id: string) {
  return authorizedMutation(`/words/${id}`, token, "DELETE");
}

export function getWordStatistics(token: string) {
  return authorizedFetch("/words/statistics", token) as Promise<{ totalCount?: number; wordsToLearn?: number; [key: string]: unknown }>;
}

export function getWordCategories(token: string) {
  return authorizedFetch("/words/categories", token) as Promise<string[]>;
}

export async function signOut(token: string) {
  const response = await fetch(`${API_BASE_URL}/users/signout`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok && response.status !== 401) {
    throw new Error("Could not sign out.");
  }
}
