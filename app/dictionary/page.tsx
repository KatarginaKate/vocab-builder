"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  DictionaryWord,
  getOwnWords,
  getWordCategories,
  signOut,
} from "@/services/auth";
import styles from "./page.module.css";

const categoryLabels: Record<string, string> = {
  verb: "Дієслово",
  participle: "Дієприкметник",
  noun: "Іменник",
  adjective: "Прикметник",
  pronoun: "Займенник",
  numerals: "Числівник",
  adverb: "Прислівник",
  preposition: "Прийменник",
  conjunction: "Сполучник",
  "phrasal verb": "Фразове дієслово",
  "functional phrase": "Вираз",
};

export default function DictionaryPage() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [words, setWords] = useState<DictionaryWord[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [keyword, setKeyword] = useState("");
  const [category, setCategory] = useState("");
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadWords = useCallback(
    async (activeToken: string, query = keyword, selectedCategory = category) => {
      setLoading(true);
      setError("");
      try {
        const result = await getOwnWords(activeToken, {
          keyword: query.trim() || undefined,
          category: selectedCategory || undefined,
        });
        setWords(result.results);
      } catch (requestError) {
        if (requestError instanceof Error && requestError.message === "SESSION_EXPIRED") {
          window.localStorage.removeItem("vocab-builder-token");
          window.localStorage.removeItem("vocab-builder-user");
          router.replace("/login");
          return;
        }
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Не вдалося завантажити словник.",
        );
      } finally {
        setLoading(false);
      }
    },
    [category, keyword, router],
  );

  useEffect(() => {
    const savedToken = window.localStorage.getItem("vocab-builder-token");
    if (!savedToken) {
      router.replace("/login");
      return;
    }

    setToken(savedToken);
    const savedUser = window.localStorage.getItem("vocab-builder-user");
    if (savedUser) {
      try {
        setUserName(JSON.parse(savedUser).name ?? "");
      } catch {
        setUserName("");
      }
    }

    void Promise.all([getWordCategories(savedToken), getOwnWords(savedToken)])
      .then(([availableCategories, result]) => {
        setCategories(availableCategories);
        setWords(result.results);
      })
      .catch((requestError: unknown) => {
        if (requestError instanceof Error && requestError.message === "SESSION_EXPIRED") {
          window.localStorage.removeItem("vocab-builder-token");
          window.localStorage.removeItem("vocab-builder-user");
          router.replace("/login");
          return;
        }
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Не вдалося завантажити словник.",
        );
      })
      .finally(() => setLoading(false));
  }, [router]);

  const searchWords = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (token) void loadWords(token, keyword, category);
  };

  const handleSignOut = async () => {
    try {
      if (token) await signOut(token);
    } catch {
      // Clear the local session even if the remote sign-out request fails.
    } finally {
      window.localStorage.removeItem("vocab-builder-token");
      window.localStorage.removeItem("vocab-builder-user");
      router.replace("/");
    }
  };

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.header}>
          <a className={styles.brand} href="/" aria-label="VocabBuilder — головна">
            <span className={styles.brandMark} aria-hidden="true"><i /><i /><i /><i /></span>
            <span>VocabBuilder</span>
          </a>
          <div className={styles.userActions}>
            {userName && <span className={styles.userName}>{userName}</span>}
            <button className={styles.signOut} type="button" onClick={handleSignOut}>
              Вийти
            </button>
          </div>
        </header>

        <section className={styles.content}>
          <div className={styles.headingRow}>
            <div>
              <p className={styles.kicker}>ТВОЯ ОСОБИСТА КОЛЕКЦІЯ</p>
              <h1>Мій словник</h1>
              <p className={styles.subtitle}>Зберігай слова та повертайся до них для повторення.</p>
            </div>
            <div className={styles.wordCount}>
              <strong>{words.length}</strong>
              <span>{words.length === 1 ? "слово" : "слів"}</span>
            </div>
          </div>

          <form className={styles.filters} onSubmit={searchWords}>
            <label className={styles.searchField}>
              <span className={styles.visuallyHidden}>Пошук у словнику</span>
              <input
                type="search"
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                placeholder="Пошук слова або перекладу"
              />
            </label>
            <label className={styles.categoryField}>
              <span className={styles.visuallyHidden}>Категорія</span>
              <select value={category} onChange={(event) => setCategory(event.target.value)}>
                <option value="">Усі категорії</option>
                {categories.map((item) => (
                  <option key={item} value={item}>{categoryLabels[item] ?? item}</option>
                ))}
              </select>
            </label>
            <button className={styles.searchButton} type="submit">Знайти</button>
          </form>

          {error && <p className={styles.error} role="alert">{error}</p>}

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Англійською</th>
                  <th>Переклад</th>
                  <th>Категорія</th>
                  <th>Прогрес</th>
                </tr>
              </thead>
              <tbody>
                {!loading && words.map((word) => (
                  <tr key={word._id}>
                    <td className={styles.english}>{word.en}</td>
                    <td>{word.ua}</td>
                    <td><span className={styles.categoryTag}>{categoryLabels[word.category] ?? word.category}</span></td>
                    <td>
                      <div className={styles.progressCell}>
                        <span className={styles.progressTrack}>
                          <span style={{ width: `${Math.min(word.progress ?? 0, 100)}%` }} />
                        </span>
                        <small>{word.progress ?? 0}%</small>
                      </div>
                    </td>
                  </tr>
                ))}
                {!loading && words.length === 0 && (
                  <tr><td className={styles.empty} colSpan={4}>Слів поки немає. Додай перше слово до свого словника.</td></tr>
                )}
                {loading && (
                  <tr><td className={styles.empty} colSpan={4}>Завантажуємо словник…</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
