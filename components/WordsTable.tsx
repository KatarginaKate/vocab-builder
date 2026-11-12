"use client";

import { useState } from "react";
import { DictionaryWord } from "@/services/auth";
import ProgressBar from "./ProgressBar";
import SpriteIcon from "./SpriteIcon";
import styles from "../app/dictionary/page.module.css";

const categoryLabels: Record<string, string> = {
  verb: "Verb", participle: "Participle", noun: "Noun", adjective: "Adjective",
  pronoun: "Pronoun", numerals: "Numerals", adverb: "Adverb", preposition: "Preposition",
  conjunction: "Conjunction", "phrasal verb": "Phrasal verb", "functional phrase": "Functional phrase",
};

export default function WordsTable({ words, loading, onEdit, onDelete }: {
  words: DictionaryWord[];
  loading: boolean;
  onEdit: (word: DictionaryWord) => void;
  onDelete: (id: string) => void;
}) {
  const [actionsId, setActionsId] = useState<string | null>(null);
  return (
    <div className={styles.tableWrap}><table className={styles.table}>
      <thead><tr><th>Word <span>🇬🇧</span></th><th>Translation <span>🇺🇦</span></th><th>Category</th><th>Progress</th><th aria-label="Actions" /></tr></thead>
      <tbody>
        {!loading && words.map((word) => <tr key={word._id}>
          <td className={styles.english}>{word.en}</td><td>{word.ua}</td>
          <td>{categoryLabels[word.category] ?? word.category}</td><td><ProgressBar value={word.progress ?? 0} /></td>
          <td className={styles.actionsCell}><button type="button" className={styles.actionsButton} aria-label={`Actions for ${word.en}`} aria-expanded={actionsId === word._id} onClick={() => setActionsId(actionsId === word._id ? null : word._id)}><SpriteIcon name="icon-more" className={styles.uiIcon} /></button>
            {actionsId === word._id && <div className={styles.actionsMenu}><button type="button" onClick={() => { onEdit(word); setActionsId(null); }}><SpriteIcon name="icon-pen-black" className={styles.actionIcon} /> Edit</button><button type="button" onClick={() => { setActionsId(null); onDelete(word._id); }}><SpriteIcon name="icon-trash-black" className={styles.actionIcon} /> Delete</button></div>}
          </td>
        </tr>)}
        {!loading && words.length === 0 && <tr><td className={styles.empty} colSpan={5}>No words found.</td></tr>}
        {loading && <tr><td className={styles.empty} colSpan={5}>Loading your dictionary…</td></tr>}
      </tbody>
    </table></div>
  );
}
