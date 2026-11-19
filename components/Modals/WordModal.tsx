"use client";

import { useEffect, useState, type FormEvent } from "react";
import type { DictionaryWord } from "@/services/auth";
import SpriteIcon from "@/components/Icons/SpriteIcon";
import styles from "./WordModal.module.css";

const categoryLabels: Record<string, string> = {
  verb: "Verb", participle: "Participle", noun: "Noun", adjective: "Adjective",
  pronoun: "Pronoun", numerals: "Numerals", adverb: "Adverb", preposition: "Preposition",
  conjunction: "Conjunction", "phrasal verb": "Phrasal verb", "functional phrase": "Functional phrase",
};

type WordModalProps = {
  open: boolean;
  word: DictionaryWord | null;
  categories: string[];
  category: string;
  error: string;
  saving: boolean;
  onCategoryChange: (category: string) => void;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export default function WordModal({ open, word, categories, category, error, saving, onCategoryChange, onClose, onSubmit }: WordModalProps) {
  const [categoryOpen, setCategoryOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (categoryOpen) setCategoryOpen(false);
        else onClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [categoryOpen, open, onClose]);

  if (!open) return null;
  const isEditing = word !== null;

  return (
    <div className={styles.backdrop} onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className={`${styles.modal} ${isEditing ? styles.editModal : styles.addModal}`} role="dialog" aria-modal="true" aria-labelledby="word-modal-title">
        <button type="button" className={styles.modalClose} onClick={onClose} aria-label="Close"><SpriteIcon name="icon-close" className={styles.uiIcon} /></button>
        {isEditing
          ? <span id="word-modal-title" className={styles.visuallyHidden}>Edit word</span>
          : <><h2 id="word-modal-title">Add word</h2><p className={styles.addDescription}>Adding a new word to the dictionary is an important step in enriching the language base and expanding the vocabulary.</p></>}
        <form className={isEditing ? styles.editForm : styles.wordForm} onSubmit={onSubmit}>
          {!isEditing && <div className={styles.addCategory} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setCategoryOpen(false); }}>
            <span className={styles.visuallyHidden}>Category</span>
            <button type="button" className={styles.addCategoryToggle} aria-haspopup="listbox" aria-expanded={categoryOpen} onClick={() => setCategoryOpen(!categoryOpen)}>
              {category ? categoryLabels[category] ?? category : "Select a category"}
              <SpriteIcon name="icon-chevron-down" className={styles.addCategoryChevron} />
            </button>
            <input type="hidden" name="category" value={category} />
            {categoryOpen && <div className={styles.addCategoryList} role="listbox" aria-label="Categories">
              {categories.map((item) => <button type="button" role="option" aria-selected={category === item} className={category === item ? styles.addCategoryActive : ""} key={item} onClick={() => { onCategoryChange(item); setCategoryOpen(false); }}>{categoryLabels[item] ?? item}</button>)}
            </div>}
          </div>}
          {!isEditing && category === "verb" && <fieldset className={styles.addVerbType}><legend>Verb type</legend><label><input type="radio" name="isIrregular" value="regular" defaultChecked /> Regular</label><label><input type="radio" name="isIrregular" value="irregular" /> Irregular</label><small>Such data must be entered in the format I form-II form-III form.</small></fieldset>}
          {isEditing ? <>
            <label className={styles.editField}><input name="ua" defaultValue={word.ua} required aria-label="Ukrainian translation" /><span className={styles.languageLabel}><SpriteIcon name="icon-flag-ua" /> Ukrainian</span></label>
            <label className={styles.editField}><input name="en" defaultValue={word.en} required aria-label="English word" /><span className={styles.languageLabel}><SpriteIcon name="icon-flag-gb" /> English</span></label>
          </> : <>
            <label className={styles.addWordField}><input name="ua" placeholder="Enter the translation" required /><span className={styles.addLanguage}><SpriteIcon name="icon-flag-ua" /> Ukrainian</span></label>
            <label className={styles.addWordField}><input name="en" placeholder="For example, beautiful" required /><span className={styles.addLanguage}><SpriteIcon name="icon-flag-gb" /> English</span></label>
          </>}
          {error && <p className={styles.error} role="alert">{error}</p>}
          <div className={`${styles.modalActions} ${isEditing ? styles.editActions : ""}`}>
            {isEditing
              ? <><button type="submit" className={styles.editSaveButton} disabled={saving}>{saving ? "Saving…" : "Save"}</button><button type="button" className={styles.editCancelButton} onClick={onClose}>Cancel</button></>
              : <><button type="submit" className={styles.addButton} disabled={saving}>{saving ? "Saving…" : "Add"}</button><button type="button" className={styles.cancelButton} onClick={onClose}>Cancel</button></>}
          </div>
        </form>
      </section>
    </div>
  );
}
