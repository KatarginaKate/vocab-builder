"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import SpriteIcon from "@/components/Icons/SpriteIcon";
import WordsPagination from "@/components/Pagination/WordsPagination";
import type { DictionaryWord } from "@/services/auth";
import { addWordToDictionary, getRecommendedWords, getWordCategories, getWordStatistics, signOut } from "@/services/auth";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { categoriesLoaded } from "@/store/word-categories-slice";
import shared from "../dictionary/page.module.css";
import styles from "./page.module.css";

const categoryLabels: Record<string, string> = {
  verb: "Verb", participle: "Participle", noun: "Noun", adjective: "Adjective",
  pronoun: "Pronoun", numerals: "Numerals", adverb: "Adverb", preposition: "Preposition",
  conjunction: "Conjunction", "phrasal verb": "Phrasal verb", "functional phrase": "Functional phrase",
};
const pageSize = 7;

export default function RecommendPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const categories = useAppSelector((state) => state.wordCategories);
  const [token, setToken] = useState("");
  const [userName, setUserName] = useState("");
  const [words, setWords] = useState<DictionaryWord[]>([]);
  const [keyword, setKeyword] = useState("");
  const [category, setCategory] = useState("");
  const [verbType, setVerbType] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [wordsToLearn, setWordsToLearn] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [addingId, setAddingId] = useState("");
  const [addedIds, setAddedIds] = useState<string[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);

  const expireSession = useCallback(() => {
    window.localStorage.removeItem("vocab-builder-token");
    window.localStorage.removeItem("vocab-builder-user");
    router.replace("/login");
  }, [router]);

  const loadWords = useCallback(async (activeToken: string, currentPage: number) => {
    setLoading(true);
    setError("");
    try {
      const result = await getRecommendedWords(activeToken, {
        keyword: keyword.trim() || undefined,
        category: category || undefined,
        isIrregular: category === "verb" && verbType ? verbType === "irregular" : undefined,
        page: currentPage,
        limit: pageSize,
      });
      setWords(result.results ?? []);
      setTotalPages(Math.max(result.totalPages ?? 1, 1));
    } catch (requestError) {
      if (requestError instanceof Error && requestError.message === "SESSION_EXPIRED") return expireSession();
      setError(requestError instanceof Error ? requestError.message : "Could not load recommended words.");
      setWords([]);
    } finally {
      setLoading(false);
    }
  }, [category, expireSession, keyword, verbType]);

  useEffect(() => {
    const savedToken = window.localStorage.getItem("vocab-builder-token");
    if (!savedToken) { router.replace("/login"); return; }
    setToken(savedToken);
    try {
      const savedUser = window.localStorage.getItem("vocab-builder-user");
      if (savedUser) setUserName(JSON.parse(savedUser).name ?? "");
    } catch { setUserName(""); }
    void getWordCategories(savedToken).then((loaded) => dispatch(categoriesLoaded(loaded))).catch((e: unknown) => {
      if (e instanceof Error && e.message === "SESSION_EXPIRED") expireSession();
    });
    void getWordStatistics(savedToken).then((stats) => setWordsToLearn(stats.wordsToLearn ?? 0)).catch(() => setWordsToLearn(0));
  }, [dispatch, expireSession, router]);

  useEffect(() => {
    if (!token) return;
    const timer = window.setTimeout(() => void loadWords(token, page), 250);
    return () => window.clearTimeout(timer);
  }, [token, keyword, category, verbType, page, loadWords]);

  const handleSignOut = async () => {
    try { if (token) await signOut(token); } catch { /* Clear the local session even if sign-out fails. */ }
    window.localStorage.removeItem("vocab-builder-token");
    window.localStorage.removeItem("vocab-builder-user");
    router.replace("/");
  };

  const addToDictionary = async (word: DictionaryWord) => {
    setAddingId(word._id);
    setError("");
    try {
      await addWordToDictionary(token, word._id);
      setAddedIds((current) => [...current, word._id]);
      setNotice(`“${word.en}” was added to your dictionary.`);
      void getWordStatistics(token).then((stats) => setWordsToLearn(stats.wordsToLearn ?? 0)).catch(() => undefined);
    } catch (requestError) {
      if (requestError instanceof Error && requestError.message === "SESSION_EXPIRED") return expireSession();
      setError(requestError instanceof Error ? requestError.message : "Could not add this word.");
    } finally {
      setAddingId("");
    }
  };

  return (
    <main className={shared.page}>
      <div className={shared.shell}>
        <header className={shared.header}>
          <Link className={shared.brand} href="/dictionary" aria-label="VocabBuilder — Dictionary">
            <span className={shared.brandMark} aria-hidden="true"><i /><i /><i /><i /></span><span>VocabBuilder</span>
          </Link>
          <nav className={`${shared.navigation} ${menuOpen ? shared.navigationOpen : ""}`} aria-label="Main navigation">
            <Link href="/dictionary">Dictionary</Link>
            <Link className={shared.activeLink} href="/recommend" aria-current="page">Recommend</Link>
            <Link href="/training">Training</Link>
            <div className={shared.mobileUser}>
              <span>{userName || "User"}</span>
              <span className={shared.avatar} aria-hidden="true"><SpriteIcon name="icon-user" className={shared.avatarIcon} /></span>
            </div>
            <button className={shared.mobileLogout} type="button" onClick={handleSignOut}>Log out <SpriteIcon name="icon-arrow-right" className={shared.smallIcon} /></button>
          </nav>
          <div className={shared.userActions}>
            <span className={shared.userName}>{userName || "User"}</span>
            <span className={shared.avatar} aria-hidden="true"><SpriteIcon name="icon-user" className={shared.avatarIcon} /></span>
            <button className={shared.signOut} type="button" onClick={handleSignOut}>Log out <SpriteIcon name="icon-arrow-right" className={shared.smallIcon} /></button>
          </div>
          <button className={shared.burger} type="button" aria-label={menuOpen ? "Close menu" : "Open menu"} aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}><SpriteIcon name={menuOpen ? "icon-close" : "icon-nav-tab"} className={shared.burgerIcon} /></button>
        </header>

        <section className={shared.content}>
          <div className={shared.toolbar}>
            <form className={styles.filters} onSubmit={(event) => { event.preventDefault(); setPage(1); }}>
              <div className={styles.searchField}>
                <label className={shared.visuallyHidden} htmlFor="recommended-word-search">Search words</label>
                <input id="recommended-word-search" type="search" value={keyword} onChange={(event) => { setKeyword(event.target.value); setPage(1); }} placeholder="Find the word" />
                <button type="submit" aria-label="Search words"><SpriteIcon name="icon-search" className={styles.searchIcon} /></button>
              </div>
              <div className={styles.categoryField}>
                <label className={shared.visuallyHidden} htmlFor="recommended-category">Category</label>
                <select id="recommended-category" value={category} onChange={(event) => { setCategory(event.target.value); setPage(1); if (event.target.value !== "verb") setVerbType(""); }}>
                  <option value="">Categories</option>
                  {categories.map((item) => <option key={item} value={item}>{categoryLabels[item] ?? item}</option>)}
                </select>
                <SpriteIcon name="icon-chevron-down" className={styles.categoryChevron} />
              </div>
              {category === "verb" && <fieldset className={styles.verbFilters}><legend className={shared.visuallyHidden}>Verb type</legend><label><input type="radio" name="verb-type" checked={verbType === "regular"} onChange={() => { setVerbType("regular"); setPage(1); }} /> Regular</label><label><input type="radio" name="verb-type" checked={verbType === "irregular"} onChange={() => { setVerbType("irregular"); setPage(1); }} /> Irregular</label></fieldset>}
            </form>
            <div className={shared.tableActions}>
              <span>To study: <strong>{wordsToLearn}</strong></span>
              <Link href="/training">Train oneself <SpriteIcon name="icon-arrow-right" className={shared.smallIcon} /></Link>
            </div>
          </div>

          {error && <p className={shared.error} role="alert">{error}</p>}
          {notice && <p className={shared.notice} role="status">{notice}<button type="button" onClick={() => setNotice("")} aria-label="Close"><SpriteIcon name="icon-close" className={shared.uiIcon} /></button></p>}

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead><tr><th>Word <SpriteIcon name="icon-flag-gb" className={styles.languageFlag} /></th><th>Translation <SpriteIcon name="icon-flag-ua" className={styles.languageFlag} /></th><th>Category</th><th><span className={shared.visuallyHidden}>Action</span></th></tr></thead>
              <tbody>
                {loading && <tr><td className={styles.empty} colSpan={4}>Loading recommended words…</td></tr>}
                {!loading && words.map((word) => {
                  const added = addedIds.includes(word._id);
                  return <tr key={word._id}><td>{word.en}</td><td>{word.ua}</td><td>{categoryLabels[word.category] ?? word.category}</td><td className={styles.actionCell}><button type="button" disabled={added || addingId === word._id} onClick={() => void addToDictionary(word)}>{added ? "Added" : addingId === word._id ? "Adding…" : "Add to dictionary"}<SpriteIcon name="icon-arrow-right" className={styles.actionArrow} /></button></td></tr>;
                })}
                {!loading && words.length === 0 && <tr><td className={styles.empty} colSpan={4}>No recommended words found.</td></tr>}
              </tbody>
            </table>
          </div>
          <WordsPagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </section>
      </div>
    </main>
  );
}
