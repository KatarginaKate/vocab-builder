"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ProgressBar from "@/components/Dictionary/ProgressBar";
import SpriteIcon from "@/components/Icons/SpriteIcon";
import type { DictionaryWord, TrainingAnswer } from "@/services/auth";
import { getTrainingTasks, getWordCategories, signOut, submitTrainingAnswers } from "@/services/auth";
import { categoriesLoaded } from "@/store/word-categories-slice";
import { useAppDispatch } from "@/store/hooks";
import shared from "../dictionary/page.module.css";
import styles from "./page.module.css";

type AnswerResult = { _id: string; isCorrect?: boolean; isDone?: boolean };
type TrainingResult = { results?: AnswerResult[]; answers?: AnswerResult[]; correct?: string[]; mistakes?: string[] };
type TrainingTask = DictionaryWord & { task: "en" | "ua" };

function normalizeTrainingTasks(response: unknown): TrainingTask[] {
  const payload = response && typeof response === "object" ? response as Record<string, unknown> : {};
  const nestedPayload = payload.data && typeof payload.data === "object"
    ? payload.data as Record<string, unknown>
    : payload;
  const items = Array.isArray(response)
    ? response
    : Array.isArray(payload.words)
      ? payload.words
      : Array.isArray(payload.tasks)
      ? payload.tasks
      : Array.isArray(payload.results)
        ? payload.results
        : Array.isArray(nestedPayload.words)
          ? nestedPayload.words
          : Array.isArray(nestedPayload.tasks)
            ? nestedPayload.tasks
            : Array.isArray(nestedPayload.results)
              ? nestedPayload.results
              : [];

  const normalized = items.filter((item) => item !== null && (typeof item === "object" || typeof item === "string")).map((item, index) => {
    const task: Record<string, unknown> = typeof item === "object"
      ? item as Record<string, unknown>
      : { en: item };
    const taskDirection = task.task === "ua" ? "ua" : "en";
    const nestedCandidates = [task.word, task.answer].filter(
      (value): value is Record<string, unknown> => Boolean(value && typeof value === "object"),
    );
    const nestedWord = nestedCandidates[0] ?? {};
    const text = (...values: unknown[]) => values.find((value): value is string => typeof value === "string") ?? "";
    const en = text(
      task.en,
      task.english,
      task.enWord,
      task.wordEn,
      task.prompt,
      task.question,
      typeof task.word === "string" ? task.word : undefined,
      nestedWord.en,
      nestedWord.english,
      nestedWord.word,
    );
    const ua = text(
      task.ua,
      task.translation,
      task.uaWord,
      task.ukrainian,
      typeof task.answer === "string" ? task.answer : undefined,
      nestedWord.ua,
      nestedWord.ukrainian,
      nestedWord.translation,
    );
    return {
      ...(task as unknown as DictionaryWord),
      _id: text(task._id, task.id, nestedWord._id, nestedWord.id) || `training-task-${index}`,
      task: taskDirection,
      en: taskDirection === "ua" ? text(task.en, nestedWord.en, nestedWord.english, nestedWord.word, en) : "",
      ua: taskDirection === "en" ? text(task.ua, nestedWord.ua, nestedWord.ukrainian, nestedWord.translation, ua) : "",
    } as TrainingTask;
  });
  return normalized.filter((task, index, allTasks) =>
    allTasks.findIndex((candidate) => candidate._id === task._id) === index
  );
}

export default function TrainingPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [token, setToken] = useState("");
  const [userName, setUserName] = useState("");
  const [tasks, setTasks] = useState<TrainingTask[]>([]);
  const [taskIndex, setTaskIndex] = useState(0);
  const [answerById, setAnswerById] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [toast, setToast] = useState("");
  const [results, setResults] = useState<{ correct: string[]; mistakes: string[] } | null>(null);
  const toastTimeout = useRef<number | null>(null);
  const redirectTimeout = useRef<number | null>(null);

  const expireSession = useCallback(() => {
    window.localStorage.removeItem("vocab-builder-token");
    window.localStorage.removeItem("vocab-builder-user");
    router.replace("/login");
  }, [router]);

  const redirectToDictionary = useCallback(() => router.push("/dictionary"), [router]);

  useEffect(() => () => {
    if (toastTimeout.current !== null) window.clearTimeout(toastTimeout.current);
    if (redirectTimeout.current !== null) window.clearTimeout(redirectTimeout.current);
  }, []);

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
    void getTrainingTasks(savedToken).then((response) => {
      setTasks(normalizeTrainingTasks(response));
      setLoadError("");
    }).catch((e: unknown) => {
      if (e instanceof Error && e.message === "SESSION_EXPIRED") return expireSession();
      setLoadError(e instanceof Error ? e.message : "Could not load training tasks.");
    }).finally(() => setLoading(false));
  }, [dispatch, expireSession, router]);

  const currentTask = tasks[taskIndex]!;
  const answeredCount = useMemo(
    () => tasks.reduce((total, task) => total + (answerById[task._id]?.trim() ? 1 : 0), 0),
    [answerById, tasks],
  );
  const progress = tasks.length ? Math.round((answeredCount / tasks.length) * 100) : 0;
  const currentAnswer = answerById[currentTask?._id] ?? "";
  const hasCurrentAnswer = currentAnswer.trim().length > 0;
  const englishAnswerTask = currentTask?.task === "en";
  const promptWord = englishAnswerTask ? currentTask.ua : currentTask?.en ?? "";

  const handleSignOut = async () => {
    try { if (token) await signOut(token); } catch { /* Clear the local session even if sign-out fails. */ }
    window.localStorage.removeItem("vocab-builder-token");
    window.localStorage.removeItem("vocab-builder-user");
    router.replace("/");
  };

  const handleSubmit = async () => {
    const answers: TrainingAnswer[] = tasks
      .map((task) => {
        const answer = answerById[task._id]?.trim() ?? "";
        if (!answer) return null;
        return {
          _id: task._id,
          en: task.task === "en" ? answer : task.en,
          ua: task.task === "ua" ? answer : task.ua,
          task: task.task,
        };
      })
      .filter((answer): answer is TrainingAnswer => answer !== null);
    if (answers.length === 0) {
      setToast("Enter at least one answer before saving.");
      toastTimeout.current = window.setTimeout(() => setToast(""), 2500);
      return;
    }
    setSaving(true);
    setToast("");
    try {
      const response = await submitTrainingAnswers(token, answers) as TrainingResult | AnswerResult[] | null;
      const reported = Array.isArray(response)
        ? response
        : response?.results ?? response?.answers ?? [];
      const reportById = new Map(reported.map((item) => [item._id, item.isDone ?? item.isCorrect]));
      const correct = !Array.isArray(response) ? response?.correct ?? [] : [];
      const mistakes = !Array.isArray(response) ? response?.mistakes ?? [] : [];
      const correctWords: string[] = [];
      const mistakeWords: string[] = [];
      for (const answer of answers) {
        const task = tasks.find((item) => item._id === answer._id);
        if (!task) continue;
        const submittedAnswer = answer.task === "en" ? answer.en ?? "" : answer.ua ?? "";
        const reportedResult = reportById.get(task._id);
        const resultKeys = [task._id, submittedAnswer, task.en, task.ua];
        const isCorrect = typeof reportedResult === "boolean"
          ? reportedResult
          : correct.some((value) => resultKeys.includes(value))
            ? true
            : mistakes.some((value) => resultKeys.includes(value))
              ? false
              : null;
        if (isCorrect === null) throw new Error("TRAINING_RESULT_UNAVAILABLE");
        (isCorrect ? correctWords : mistakeWords).push(submittedAnswer);
      }
      setResults({ correct: correctWords, mistakes: mistakeWords });
    } catch (e) {
      if (e instanceof Error && e.message === "SESSION_EXPIRED") return expireSession();
      setToast(e instanceof Error && e.message === "TRAINING_RESULT_UNAVAILABLE"
        ? "Your answers may have been saved, but the training results could not be read."
        : "Your training progress was not saved. You’ll be redirected to your dictionary.");
      toastTimeout.current = window.setTimeout(() => setToast(""), 2500);
      redirectTimeout.current = window.setTimeout(redirectToDictionary, 3500);
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className={`${shared.page} ${styles.trainingPage}`}>
      <div className={`${shared.shell} ${styles.trainingShell}`}>
        <header className={shared.header}>
          <Link className={shared.brand} href="/dictionary" aria-label="VocabBuilder — Dictionary">
            <span className={shared.brandMark} aria-hidden="true"><i /><i /><i /><i /></span><span>VocabBuilder</span>
          </Link>
          <nav className={`${shared.navigation} ${menuOpen ? shared.navigationOpen : ""}`} aria-label="Main navigation">
            <Link href="/dictionary">Dictionary</Link>
            <Link href="/recommend">Recommend</Link>
            <Link className={shared.activeLink} href="/training" aria-current="page">Training</Link>
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

        <section className={styles.content}>
          {loading ? <p className={styles.loading} role="status">Loading training…</p> : loadError ? <div className={styles.loadError} role="alert"><p>{loadError}</p><button type="button" onClick={redirectToDictionary}>Go to dictionary</button></div> : tasks.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyCopy}>
                <h1>You don’t have a single word to learn right now.</h1>
                <p>Please create or add a word to start the workout. We want to improve your vocabulary and develop your knowledge, so please share the words you are interested in adding to your study.</p>
                <div className={styles.emptyActions}>
                  <button type="button" onClick={() => router.push("/dictionary?addWord=true")}>Add word</button>
                  <button type="button" className={styles.secondaryButton} onClick={redirectToDictionary}>Cancel</button>
                </div>
              </div>
              <Image src="/training-img.webp" alt="Vocabulary exercise illustration" width={240} height={240} className={styles.emptyImage} />
            </div>
          ) : (
            <div className={styles.training}>
              <div className={styles.progress}><ProgressBar value={progress} variant="training" /></div>
              <div className={styles.room}>
                <section className={styles.answerPanel} aria-label="Enter the Ukrainian translation">
                  <label htmlFor="training-answer">Введіть переклад</label>
                  <div className={styles.language}>
                    <SpriteIcon name={englishAnswerTask ? "icon-flag-gb" : "icon-flag-ua"} />
                    {englishAnswerTask ? "English" : "Ukrainian"}
                  </div>
                  <input id="training-answer" autoComplete="off" value={answerById[currentTask._id] ?? ""} onChange={(event) => setAnswerById((current) => ({ ...current, [currentTask._id]: event.target.value }))} onKeyDown={(event) => { if (event.key === "Enter" && taskIndex < tasks.length - 1 && hasCurrentAnswer) setTaskIndex((index) => index + 1); }} />
                  {taskIndex < tasks.length - 1 && <button className={styles.nextButton} type="button" disabled={!hasCurrentAnswer} onClick={() => { if (hasCurrentAnswer) setTaskIndex((index) => index + 1); }}>Next <SpriteIcon name="icon-arrow-right" /></button>}
                </section>
                <section className={styles.taskPanel} aria-label="Training word">
                  <p>{promptWord ? promptWord.charAt(0).toLocaleUpperCase() + promptWord.slice(1) : "Break in"}</p>
                  <div className={styles.language}>
                    <SpriteIcon name={englishAnswerTask ? "icon-flag-ua" : "icon-flag-gb"} />
                    {englishAnswerTask ? "Ukrainian" : "English"}
                  </div>
                </section>
              </div>
              <div className={styles.actions}>
                <button type="button" className={styles.saveButton} disabled={saving} onClick={() => void handleSubmit()}>{saving ? "Saving…" : "Save"}</button>
                <button type="button" className={styles.cancelButton} onClick={redirectToDictionary}>Cancel</button>
              </div>
            </div>
          )}
        </section>
      </div>

      {toast && <div className={styles.toast} role="alert"><span>{toast}</span><button type="button" onClick={() => setToast("")} aria-label="Close notification"><SpriteIcon name="icon-close" /></button></div>}
      {results && <div className={styles.modalBackdrop} onClick={(event) => { if (event.target === event.currentTarget) setResults(null); }}>
        <section className={styles.resultsModal} role="dialog" aria-modal="true" aria-labelledby="training-result-title">
          <button type="button" className={styles.closeModal} onClick={() => setResults(null)} aria-label="Close"><SpriteIcon name="icon-close" /></button>
          <h2 id="training-result-title">Well done</h2>
          <div className={styles.resultColumns}>
            <div><h3>Correct answers:</h3>{results.correct.length ? <ul>{results.correct.map((word, index) => <li key={`${word}-${index}`}>{word}</li>)}</ul> : <p>None</p>}</div>
            <div><h3>Mistakes:</h3>{results.mistakes.length ? <ul>{results.mistakes.map((word, index) => <li key={`${word}-${index}`}>{word}</li>)}</ul> : <p>None</p>}</div>
          </div>
          <Image src="/book-img.webp" alt="Open book" width={180} height={135} className={styles.bookImage} />
        </section>
      </div>}
    </main>
  );
}
