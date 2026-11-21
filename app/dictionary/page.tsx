"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import WordsTable from "@/components/Dictionary/WordsTable";
import WordsPagination from "@/components/Pagination/WordsPagination";
import SpriteIcon from "@/components/Icons/SpriteIcon";
import WordModal from "@/components/Modals/WordModal";
import { categoriesLoaded } from "@/store/word-categories-slice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  createWord, deleteWord, DictionaryWord, getOwnWords, getWordCategories,
  getWordStatistics, signOut, updateWord, WordInput,
} from "@/services/auth";
import styles from "./page.module.css";

const categoryOptions: Record<string, string> = {
  verb: "Verb", participle: "Participle", noun: "Noun", adjective: "Adjective",
  pronoun: "Pronoun", numerals: "Numerals", adverb: "Adverb", preposition: "Preposition",
  conjunction: "Conjunction", "phrasal verb": "Phrasal verb", "functional phrase": "Functional phrase",
};
const englishPattern = /^[A-Za-z'-]+(?:\s+[A-Za-z'-]+)*$/;
const ukrainianPattern = /^[\u0410-\u042F\u0430-\u044F\u0404\u0454\u0406\u0456\u0407\u0457\u0490\u0491\s]+$/u;
const pageSize = 8;

export default function DictionaryPage() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [words, setWords] = useState<DictionaryWord[]>([]);
  const wordsRequestId = useRef(0);
  const studyTasksRequestId = useRef(0);
  const dispatch = useAppDispatch();
  const categories = useAppSelector((state) => state.wordCategories);
  const [keyword, setKeyword] = useState("");
  const [category, setCategory] = useState("");
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [verbType, setVerbType] = useState("");
  const [userName, setUserName] = useState("");
  const [stats, setStats] = useState<{ totalCount?: number; wordsToLearn?: number }>({});
  const [studyTasks, setStudyTasks] = useState<DictionaryWord[]>([]);
  const [studyTasksOpen, setStudyTasksOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [modalWord, setModalWord] = useState<DictionaryWord | null | false>(false);
  const [formCategory, setFormCategory] = useState("");
  const [formError, setFormError] = useState("");
  const [toastError, setToastError] = useState("");
  const [saving, setSaving] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!notice) return;
    const timeoutId = window.setTimeout(() => setNotice(""), 4000);
    return () => window.clearTimeout(timeoutId);
  }, [notice]);

  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get("addWord") === "true") {
      setModalWord(null);
      setFormCategory("");
      setFormError("");
      url.searchParams.delete("addWord");
      window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
    }
  }, []);

  const expireSession = useCallback(() => {
    window.localStorage.removeItem("vocab-builder-token");
    window.localStorage.removeItem("vocab-builder-user");
    router.replace("/login");
  }, [router]);

  const loadWords = useCallback(async (activeToken: string, query: string, selectedCategory: string, currentPage: number) => {
    const requestId = ++wordsRequestId.current;
    setLoading(true);
    setError("");
    try {
      const result = await getOwnWords(activeToken, {
        keyword: query.trim() || undefined,
        category: selectedCategory || undefined,
        isIrregular: selectedCategory === "verb" && verbType ? verbType === "irregular" : undefined,
        page: currentPage,
        limit: pageSize,
      });
      if (requestId !== wordsRequestId.current) return;
      let results = result.results ?? [];
      let totalPages = Math.max(result.totalPages ?? 1, 1);
      const queryText = query.trim().toLocaleLowerCase();
      const matchesQuery = (word: DictionaryWord) =>
        `${word.en} ${word.ua}`.toLocaleLowerCase().includes(queryText);

      if (queryText && !results.some(matchesQuery)) {
        const firstPage = await getOwnWords(activeToken, {
          category: selectedCategory || undefined,
          isIrregular: selectedCategory === "verb" && verbType ? verbType === "irregular" : undefined,
          page: 1,
          limit: 100,
        });
        const allWords = [...(firstPage.results ?? [])];
        if (firstPage.totalPages > 1) {
          const rest = await Promise.all(
            Array.from({ length: firstPage.totalPages - 1 }, (_, index) =>
              getOwnWords(activeToken, {
                category: selectedCategory || undefined,
                isIrregular: selectedCategory === "verb" && verbType ? verbType === "irregular" : undefined,
                page: index + 2,
                limit: 100,
              }),
            ),
          );
          rest.forEach((pageResult) => allWords.push(...(pageResult.results ?? [])));
        }
        if (requestId !== wordsRequestId.current) return;
        const matchingWords = allWords.filter(matchesQuery);
        totalPages = Math.max(Math.ceil(matchingWords.length / pageSize), 1);
        const start = (currentPage - 1) * pageSize;
        results = matchingWords.slice(start, start + pageSize);
      }

      setWords(results);
      setTotalPages(totalPages);
    } catch (requestError) {
      if (requestId !== wordsRequestId.current) return;
      if (requestError instanceof Error && requestError.message === "SESSION_EXPIRED") return expireSession();
      setError(requestError instanceof Error ? requestError.message : "Could not load your dictionary.");
    } finally {
      if (requestId === wordsRequestId.current) setLoading(false);
    }
  }, [expireSession, verbType]);

  const loadStudyTasks = useCallback(async (activeToken: string) => {
    const requestId = ++studyTasksRequestId.current;
    try {
      const firstPage = await getOwnWords(activeToken, { page: 1, limit: 100 });
      const allWords = [...(firstPage.results ?? [])];
      if (firstPage.totalPages > 1) {
        const remainingPages = await Promise.all(
          Array.from({ length: firstPage.totalPages - 1 }, (_, index) =>
            getOwnWords(activeToken, { page: index + 2, limit: 100 }),
          ),
        );
        remainingPages.forEach((result) => allWords.push(...(result.results ?? [])));
      }
      if (requestId !== studyTasksRequestId.current) return;
      setStudyTasks(
        allWords
          .filter((word) => (word.progress ?? 0) < 100)
          .sort((first, second) => (first.progress ?? 0) - (second.progress ?? 0)),
      );
    } catch {
      if (requestId === studyTasksRequestId.current) setStudyTasks([]);
    }
  }, []);

  useEffect(() => {
    const savedToken = window.localStorage.getItem("vocab-builder-token");
    if (!savedToken) { router.replace("/login"); return; }
    setToken(savedToken);
    try {
      const savedUser = window.localStorage.getItem("vocab-builder-user");
      if (savedUser) setUserName(JSON.parse(savedUser).name ?? "");
    } catch { setUserName(""); }
    void getWordCategories(savedToken).then((loadedCategories) => dispatch(categoriesLoaded(loadedCategories))).catch((e: unknown) => {
      if (e instanceof Error && e.message === "SESSION_EXPIRED") expireSession();
    });
    void getWordStatistics(savedToken).then(setStats).catch(() => setStats({}));
    void loadStudyTasks(savedToken);
  }, [dispatch, expireSession, loadStudyTasks, router]);

  useEffect(() => {
    if (!token) return;
    const timer = window.setTimeout(() => void loadWords(token, keyword, category, page), 300);
    return () => window.clearTimeout(timer);
  }, [token, keyword, category, page, loadWords]);

  const refresh = () => {
    if (token) void loadWords(token, keyword, category, page);
    if (token) void getWordStatistics(token).then(setStats).catch(() => undefined);
    if (token) void loadStudyTasks(token);
  };

  const onFilterChange = (kind: "keyword" | "category", value: string) => {
    setPage(1);
    if (kind === "keyword") setKeyword(value);
    else {
      setCategory(value);
      if (value !== "verb") setVerbType("");
    }
  };

  const handleSignOut = async () => {
    try { if (token) await signOut(token); } catch { /* Local session is cleared regardless. */ }
    window.localStorage.removeItem("vocab-builder-token");
    window.localStorage.removeItem("vocab-builder-user");
    router.replace("/");
  };

  const saveWord = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError("");
    const data = new FormData(event.currentTarget);
    const en = String(data.get("en") ?? "").trim();
    const ua = String(data.get("ua") ?? "").trim();
    const selectedCategory = modalWord ? modalWord.category : String(data.get("category") ?? "");
    if (!englishPattern.test(en) || !ukrainianPattern.test(ua) || !selectedCategory) {
      setFormError("Check the English word, Ukrainian translation, and category.");
      return;
    }
    const payload: WordInput = { en, ua, category: selectedCategory };
    if (selectedCategory === "verb") payload.isIrregular = modalWord ? Boolean(modalWord.isIrregular) : data.get("isIrregular") === "irregular";
    setSaving(true);
    try {
      if (modalWord) await updateWord(token, modalWord._id, payload);
      else await createWord(token, payload);
      setModalWord(false);
      setNotice(modalWord ? "Word updated." : "Word added to your dictionary.");
      refresh();
    } catch (e) {
      if (e instanceof Error && e.message === "SESSION_EXPIRED") return expireSession();
      const message = e instanceof Error ? e.message : "Could not save the word.";
      setFormError(message);
      setToastError(message);
    } finally { setSaving(false); }
  };

  const removeWord = async (id: string) => {
    try {
      await deleteWord(token, id);
      setNotice("Word deleted.");
      refresh();
    } catch (e) {
      if (e instanceof Error && e.message === "SESSION_EXPIRED") return expireSession();
      const message = e instanceof Error ? e.message : "Could not delete the word.";
      setError(message);
      setToastError(message);
    }
  };

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.header}>
          <Link className={styles.brand} href="/dictionary" aria-label="VocabBuilder — Dictionary">
            <span className={styles.brandMark} aria-hidden="true"><i /><i /><i /><i /></span><span>VocabBuilder</span>
          </Link>
          <nav className={`${styles.navigation} ${menuOpen ? styles.navigationOpen : ""}`} aria-label="Main navigation">
            <Link className={styles.activeLink} href="/dictionary" aria-current="page">Dictionary</Link>
            <Link href="/recommend">Recommend</Link>
            <Link href="/training">Training</Link>
            <div className={styles.mobileUser}>
              <span>{userName || "User"}</span>
              <span className={styles.avatar} aria-hidden="true"><SpriteIcon name="icon-user" className={styles.avatarIcon} /></span>
            </div>
            <button className={styles.mobileLogout} type="button" onClick={handleSignOut}>Log out <SpriteIcon name="icon-arrow-right" className={styles.smallIcon} /></button>
          </nav>
          <div className={styles.userActions}>
            <span className={styles.userName}>{userName || "User"}</span>
            <span className={styles.avatar} aria-hidden="true"><SpriteIcon name="icon-user" className={styles.avatarIcon} /></span>
            <button className={styles.signOut} type="button" onClick={handleSignOut}>Log out <SpriteIcon name="icon-arrow-right" className={styles.smallIcon} /></button>
          </div>
          <button className={styles.burger} type="button" aria-label={menuOpen ? "Close menu" : "Open menu"} aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}><SpriteIcon name={menuOpen ? "icon-close" : "icon-nav-tab"} className={styles.burgerIcon} /></button>
        </header>

        <section className={styles.content}>
          <div className={styles.toolbar}>
            <form className={styles.filters} onSubmit={(event) => { event.preventDefault(); setKeyword(keyword.trim()); setPage(1); void loadWords(token, keyword, category, 1); }}>
              <div className={styles.searchField}><label className={styles.visuallyHidden} htmlFor="word-search">Search words</label><input id="word-search" type="search" value={keyword} onChange={(event) => onFilterChange("keyword", event.target.value)} placeholder="Find the word" /><button type="submit" className={styles.searchButton} aria-label="Search words"><SpriteIcon name="icon-search" className={styles.searchIcon} /></button></div>
              <div className={styles.categoryDropdown} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setCategoryOpen(false); }} onKeyDown={(event) => { if (event.key === "Escape") setCategoryOpen(false); }}>
                <button type="button" className={styles.categoryToggle} aria-haspopup="listbox" aria-expanded={categoryOpen} onClick={() => setCategoryOpen(!categoryOpen)}>{category ? categoryOptions[category] ?? category : "Categories"}<SpriteIcon name="icon-chevron-down" className={styles.chevronIcon} /></button>
                {categoryOpen && <div className={styles.categoryMenu} role="listbox" aria-label="Categories"><button type="button" role="option" aria-selected={!category} onClick={() => { onFilterChange("category", ""); setCategoryOpen(false); }}>All categories</button>{categories.map((item) => <button type="button" role="option" aria-selected={category === item} key={item} onClick={() => { onFilterChange("category", item); setCategoryOpen(false); }}>{categoryOptions[item] ?? item}</button>)}</div>}
              </div>
              {category === "verb" && <fieldset className={styles.verbFilters}><legend className={styles.visuallyHidden}>Verb type</legend><label><input type="radio" name="verbTypeFilter" checked={verbType === "regular"} onChange={() => { setVerbType("regular"); setPage(1); }} /> Regular</label><label><input type="radio" name="verbTypeFilter" checked={verbType === "irregular"} onChange={() => { setVerbType("irregular"); setPage(1); }} /> Irregular</label></fieldset>}
            </form>
            <div className={styles.tableActions}>
              <div className={styles.studyTasks}>
                <button type="button" className={styles.studyTasksButton} aria-expanded={studyTasksOpen} aria-controls="study-tasks-list" onClick={() => setStudyTasksOpen(!studyTasksOpen)}>
                  <span>To study:</span><strong>{stats.wordsToLearn ?? studyTasks.length}</strong>
                </button>
                {studyTasksOpen && <div className={styles.studyTasksList} id="study-tasks-list" role="region" aria-label="Words to study">
                  <strong className={styles.studyTasksTitle}>Statistics</strong>
                  <p className={styles.studyTasksCount}>Total words: {stats.totalCount ?? "—"}</p>
                  <strong className={styles.studyTasksTitle}>Tasks to study</strong>
                  {studyTasks.length > 0 ? <ul>{studyTasks.map((word) => <li key={word._id}><span>{word.en}</span><span>{word.ua}</span></li>)}</ul> : <p>All words are learned.</p>}
                </div>}
              </div>
              <button type="button" onClick={() => { setModalWord(null); setFormCategory(categories[0] ?? ""); setFormError(""); }}>Add word <SpriteIcon name="icon-plus" className={styles.smallIcon} /></button>
              <Link href="/training">Train oneself <SpriteIcon name="icon-arrow-right" className={styles.smallIcon} /></Link>
            </div>
          </div>
          {error && <p className={styles.error} role="alert">{error}</p>}{notice && <p className={styles.notice} role="status">{notice}<button type="button" onClick={() => setNotice("")} aria-label="Close"><SpriteIcon name="icon-close" className={styles.uiIcon} /></button></p>}

          <WordsTable
            words={words}
            loading={loading}
            onEdit={(word) => { setModalWord(word); setFormCategory(word.category); setFormError(""); }}
            onDelete={(id) => void removeWord(id)}
          />

          <WordsPagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </section>
      </div>

      {toastError && <div className={styles.toastError} role="alert"><span>{toastError}</span><button type="button" onClick={() => setToastError("")} aria-label="Close"><SpriteIcon name="icon-close" className={styles.uiIcon} /></button></div>}
      <WordModal
        open={modalWord !== false}
        word={modalWord || null}
        categories={categories}
        category={formCategory}
        error={formError}
        saving={saving}
        onCategoryChange={setFormCategory}
        onClose={() => setModalWord(false)}
        onSubmit={saveWord}
      />
    </main>
  );
}


