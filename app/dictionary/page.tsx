"use client";

import { FormEvent, useCallback, useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import WordsTable from "@/components/WordsTable";
import WordsPagination from "@/components/WordsPagination";
import SpriteIcon from "@/components/SpriteIcon";
import { getWordCategoriesSnapshot, setWordCategories, subscribeToWordCategories } from "@/services/word-category-store";
import {
  createWord, deleteWord, DictionaryWord, getOwnWords, getWordCategories,
  getWordStatistics, signOut, updateWord, WordInput,
} from "@/services/auth";
import styles from "./page.module.css";

const categoryLabels: Record<string, string> = {
  verb: "Verb", participle: "Participle", noun: "Noun",
  adjective: "Adjective", pronoun: "Pronoun", numerals: "Numerals",
  adverb: "Adverb", preposition: "Preposition", conjunction: "Conjunction",
  "phrasal verb": "Phrasal verb", "functional phrase": "Functional phrase",
};
const categoryOptions: Record<string, string> = {
  verb: "Verb", participle: "Participle", noun: "Noun", adjective: "Adjective",
  pronoun: "Pronoun", numerals: "Numerals", adverb: "Adverb", preposition: "Preposition",
  conjunction: "Conjunction", "phrasal verb": "Phrasal verb", "functional phrase": "Functional phrase",
};
const englishPattern = /^[A-Za-z'-]+(?:\s+[A-Za-z'-]+)*$/;
const ukrainianPattern = /^[\u0410-\u042F\u0430-\u044F\u0404\u0454\u0406\u0456\u0407\u0457\u0490\u0491\s]+$/u;
const pageSize = 10;

export default function DictionaryPage() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [words, setWords] = useState<DictionaryWord[]>([]);
  const categories = useSyncExternalStore(subscribeToWordCategories, getWordCategoriesSnapshot, getWordCategoriesSnapshot);
  const [keyword, setKeyword] = useState("");
  const [category, setCategory] = useState("");
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [verbType, setVerbType] = useState("");
  const [userName, setUserName] = useState("");
  const [stats, setStats] = useState<{ totalCount?: number; wordsToLearn?: number }>({});
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

  const expireSession = useCallback(() => {
    window.localStorage.removeItem("vocab-builder-token");
    window.localStorage.removeItem("vocab-builder-user");
    router.replace("/login");
  }, [router]);

  const loadWords = useCallback(async (activeToken: string, query: string, selectedCategory: string, currentPage: number) => {
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
      setWords(result.results ?? []);
      setTotalPages(Math.max(result.totalPages ?? 1, 1));
    } catch (requestError) {
      if (requestError instanceof Error && requestError.message === "SESSION_EXPIRED") return expireSession();
      setError(requestError instanceof Error ? requestError.message : "Could not load your dictionary.");
    } finally {
      setLoading(false);
    }
  }, [expireSession, verbType]);

  useEffect(() => {
    const savedToken = window.localStorage.getItem("vocab-builder-token");
    if (!savedToken) { router.replace("/login"); return; }
    setToken(savedToken);
    try {
      const savedUser = window.localStorage.getItem("vocab-builder-user");
      if (savedUser) setUserName(JSON.parse(savedUser).name ?? "");
    } catch { setUserName(""); }
    void getWordCategories(savedToken).then(setWordCategories).catch((e: unknown) => {
      if (e instanceof Error && e.message === "SESSION_EXPIRED") expireSession();
    });
    void getWordStatistics(savedToken).then(setStats).catch(() => setStats({}));
  }, [expireSession, router]);

  useEffect(() => {
    if (!token) return;
    const timer = window.setTimeout(() => void loadWords(token, keyword, category, page), 300);
    return () => window.clearTimeout(timer);
  }, [token, keyword, category, page, loadWords]);

  useEffect(() => {
    if (!modalWord) return;
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") setModalWord(false); };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [modalWord]);

  const refresh = () => {
    if (token) void loadWords(token, keyword, category, page);
    if (token) void getWordStatistics(token).then(setStats).catch(() => undefined);
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
            <div className={styles.mobileUser}><span>{userName || "User"}</span><button type="button" onClick={handleSignOut}>Log out <SpriteIcon name="icon-arrow-right" className={styles.smallIcon} /></button></div>
          </nav>
          <div className={styles.userActions}>
            <span className={styles.userName}>{userName || "User"}</span>
            <span className={styles.avatar} aria-hidden="true"><SpriteIcon name="icon-user" className={styles.avatarIcon} /></span>
            <button className={styles.signOut} type="button" onClick={handleSignOut}>Log out <SpriteIcon name="icon-arrow-right" className={styles.smallIcon} /></button>
          </div>
          <button className={styles.burger} type="button" aria-label={menuOpen ? "Close menu" : "Open menu"} aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}><SpriteIcon name="icon-menu" className={styles.burgerIcon} /></button>
        </header>

        <section className={styles.content}>
          <div className={styles.toolbar}>
            <form className={styles.filters} onSubmit={(event) => event.preventDefault()}>
              <label className={styles.searchField}><span className={styles.visuallyHidden}>Search words</span><input type="search" value={keyword} onChange={(event) => onFilterChange("keyword", event.target.value)} placeholder="Find the word" /><SpriteIcon name="icon-search" className={styles.searchIcon} /></label>
              <div className={styles.categoryDropdown} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setCategoryOpen(false); }} onKeyDown={(event) => { if (event.key === "Escape") setCategoryOpen(false); }}>
                <button type="button" className={styles.categoryToggle} aria-haspopup="listbox" aria-expanded={categoryOpen} onClick={() => setCategoryOpen(!categoryOpen)}>{category ? categoryOptions[category] ?? category : "Categories"}<SpriteIcon name="icon-chevron-down" className={styles.chevronIcon} /></button>
                {categoryOpen && <div className={styles.categoryMenu} role="listbox" aria-label="Categories"><button type="button" role="option" aria-selected={!category} onClick={() => { onFilterChange("category", ""); setCategoryOpen(false); }}>All categories</button>{categories.map((item) => <button type="button" role="option" aria-selected={category === item} key={item} onClick={() => { onFilterChange("category", item); setCategoryOpen(false); }}>{categoryOptions[item] ?? item}</button>)}</div>}
              </div>
            </form>
            <div className={styles.tableActions}><span>To study: <strong>{stats.wordsToLearn ?? stats.totalCount ?? words.length}</strong></span><button type="button" onClick={() => { setModalWord(null); setFormCategory(categories[0] ?? ""); setFormError(""); }}>Add word <SpriteIcon name="icon-plus" className={styles.smallIcon} /></button><Link href="/training">Train oneself <SpriteIcon name="icon-arrow-right" className={styles.smallIcon} /></Link></div>
          </div>
          {category === "verb" && <fieldset className={styles.verbFilters}><legend className={styles.visuallyHidden}>Verb type</legend><label><input type="radio" name="verbTypeFilter" checked={verbType === "regular"} onChange={() => { setVerbType("regular"); setPage(1); }} /> Regular</label><label><input type="radio" name="verbTypeFilter" checked={verbType === "irregular"} onChange={() => { setVerbType("irregular"); setPage(1); }} /> Irregular</label></fieldset>}

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
      {modalWord !== false && (
        <div className={styles.backdrop} onMouseDown={(event) => { if (event.target === event.currentTarget) setModalWord(false); }}>
          <section className={`${styles.modal} ${modalWord ? styles.editModal : ""}`} role="dialog" aria-modal="true" aria-labelledby="word-modal-title">
            <button type="button" className={styles.modalClose} onClick={() => setModalWord(false)} aria-label="Close"><SpriteIcon name="icon-close" className={styles.uiIcon} /></button>
            {!modalWord && <><p className={styles.kicker}>NEW WORD</p><h2 id="word-modal-title">Add a word</h2></>}
            {modalWord && <h2 id="word-modal-title" className={styles.visuallyHidden}>Edit word</h2>}
            <form className={modalWord ? styles.editForm : styles.wordForm} onSubmit={saveWord}>
              {!modalWord && <label>Category<select name="category" value={formCategory} onChange={(event) => setFormCategory(event.target.value)} required><option value="" disabled>Select a category</option>{categories.map((item) => <option key={item} value={item}>{categoryLabels[item] ?? item}</option>)}</select></label>}
              {modalWord ? <>
                <label className={styles.editField}><input name="ua" defaultValue={modalWord.ua} required aria-label="Ukrainian translation" /><span className={styles.languageLabel}><span>🇺🇦</span> Ukrainian</span></label>
                <label className={styles.editField}><input name="en" defaultValue={modalWord.en} required aria-label="English word" /><span className={styles.languageLabel}><span>🇬🇧</span> English</span></label>
              </> : <>
                <label>English word<input name="en" placeholder="For example, beautiful" required /></label>
                <label>Ukrainian translation<input name="ua" placeholder="Enter the translation" required /></label>
              </>}
              {!modalWord && formCategory === "verb" && <label className={styles.irregularField}><span>Verb type</span><span><input type="radio" name="isIrregular" value="regular" defaultChecked /> Regular</span><span><input type="radio" name="isIrregular" value="irregular" /> Irregular</span></label>}
              {formError && <p className={styles.error} role="alert">{formError}</p>}
              <div className={`${styles.modalActions} ${modalWord ? styles.editActions : ""}`}>
                {modalWord ? <><button type="submit" className={styles.editSaveButton} disabled={saving}>{saving ? "Saving…" : "Save"}</button><button type="button" className={styles.editCancelButton} onClick={() => setModalWord(false)}>Cancel</button></> : <><button type="button" className={styles.cancelButton} onClick={() => setModalWord(false)}>Cancel</button><button type="submit" className={styles.addButton} disabled={saving}>{saving ? "Saving…" : "Add"}</button></>}
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}


