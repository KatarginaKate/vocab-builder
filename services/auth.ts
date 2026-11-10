const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "https://vocab-builder-backend.p.goit.global/api";

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
      typeof errorBody?.message === "string"
        ? errorBody.message
        : response.status === 409
          ? "Користувач із такою електронною поштою вже існує."
          : response.status === 401
            ? "Неправильна електронна пошта або пароль."
            : "Не вдалося виконати запит. Спробуйте ще раз.";

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

async function authorizedFetch(path: string, token: string) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("SESSION_EXPIRED");
    }
    throw new Error("Не вдалося завантажити словник. Спробуйте ще раз.");
  }

  return response.json();
}

export function getOwnWords(
  token: string,
  params: { keyword?: string; category?: string } = {},
) {
  const search = new URLSearchParams({ page: "1", limit: "20" });
  if (params.keyword) search.set("keyword", params.keyword);
  if (params.category) search.set("category", params.category);
  return authorizedFetch(`/words/own?${search.toString()}`, token) as Promise<WordPage>;
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
    throw new Error("Не вдалося завершити сеанс.");
  }
}
