"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { createColumnHelper, tableFeatures, useTable } from "@tanstack/react-table";
import type { DictionaryWord } from "@/services/auth";
import ProgressBar from "./ProgressBar";
import SpriteIcon from "../../components/Icons/SpriteIcon";
import styles from "../../app/dictionary/page.module.css";

const categoryLabels: Record<string, string> = {
  verb: "Verb", participle: "Participle", noun: "Noun", adjective: "Adjective",
  pronoun: "Pronoun", numerals: "Numerals", adverb: "Adverb", preposition: "Preposition",
  conjunction: "Conjunction", "phrasal verb": "Phrasal verb", "functional phrase": "Functional phrase",
};

const features = tableFeatures({});
const columnHelper = createColumnHelper<typeof features, DictionaryWord>();

export default function WordsTable({ words, loading, onEdit, onDelete }: {
  words: DictionaryWord[];
  loading: boolean;
  onEdit: (word: DictionaryWord) => void;
  onDelete: (id: string) => void;
}) {
  const [actionsId, setActionsId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const actionButtonRef = useRef<HTMLButtonElement | null>(null);
  const actionsMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!actionsId) return;

    const updateMenuPosition = () => {
      const button = actionButtonRef.current;
      const menu = actionsMenuRef.current;
      if (!button || !menu) return;

      const buttonRect = button.getBoundingClientRect();
      const menuRect = menu.getBoundingClientRect();
      const edgeGap = 8;
      const viewportGap = 12;
      const spaceBelow = window.innerHeight - buttonRect.bottom - edgeGap;
      const spaceAbove = buttonRect.top - edgeGap;
      const openAbove = spaceBelow < menuRect.height && spaceAbove > spaceBelow;
      const top = openAbove
        ? Math.max(viewportGap, buttonRect.top - menuRect.height - edgeGap)
        : Math.min(buttonRect.bottom + edgeGap, window.innerHeight - menuRect.height - viewportGap);
      const left = Math.min(
        Math.max(viewportGap, buttonRect.right - menuRect.width),
        window.innerWidth - menuRect.width - viewportGap,
      );
      setMenuPosition({ top, left });
    };

    updateMenuPosition();
    window.addEventListener("resize", updateMenuPosition);
    window.addEventListener("scroll", updateMenuPosition, true);

    const closeOnOutsideClick = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!actionsMenuRef.current?.contains(target) && !actionButtonRef.current?.contains(target)) {
        setActionsId(null);
        setMenuPosition(null);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setActionsId(null);
        setMenuPosition(null);
        actionButtonRef.current?.focus();
      }
    };

    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      window.removeEventListener("resize", updateMenuPosition);
      window.removeEventListener("scroll", updateMenuPosition, true);
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [actionsId]);

  const columns = useMemo(() => columnHelper.columns([
    columnHelper.accessor("en", {
      header: () => <>Word <SpriteIcon name="icon-flag-gb" className={styles.languageFlag} /></>,
      cell: (info) => <span className={styles.english}>{info.getValue()}</span>,
    }),
    columnHelper.accessor("ua", {
      header: () => <>Translation <SpriteIcon name="icon-flag-ua" className={styles.languageFlag} /></>,
    }),
    columnHelper.accessor("category", {
      header: "Category",
      cell: (info) => {
        const label = categoryLabels[info.getValue()] ?? info.getValue();
        return label === "Functional phrase"
          ? <span className={styles.functionalPhrase}>{label}</span>
          : label;
      },
    }),
    columnHelper.accessor((word) => word.progress ?? 0, {
      id: "progress",
      header: "Progress",
      cell: (info) => <ProgressBar value={info.getValue()} />,
    }),
    columnHelper.display({
      id: "actions",
      header: () => null,
      cell: ({ row }) => {
        const word = row.original;
        const isOpen = actionsId === word._id;
        return (
          <div className={styles.actionsCell}>
            <button type="button" className={styles.actionsButton} aria-label={`Actions for ${word.en}`} aria-expanded={isOpen} ref={isOpen ? actionButtonRef : null} onClick={(event) => {
              if (isOpen) {
                setActionsId(null);
                setMenuPosition(null);
              } else {
                actionButtonRef.current = event.currentTarget;
                setMenuPosition(null);
                setActionsId(word._id);
              }
            }}>
              <SpriteIcon name="icon-more" className={styles.uiIcon} />
            </button>
            {isOpen && typeof document !== "undefined" && createPortal(
              <div
                ref={actionsMenuRef}
                className={styles.actionsMenu}
                role="menu"
                style={{
                  position: "fixed",
                  top: menuPosition?.top ?? 0,
                  left: menuPosition?.left ?? 0,
                  visibility: menuPosition ? "visible" : "hidden",
                }}
              >
                <button type="button" role="menuitem" onClick={() => { onEdit(word); setActionsId(null); setMenuPosition(null); }}><SpriteIcon name="icon-pen-black" className={styles.actionIcon} /> Edit</button>
                <button type="button" role="menuitem" onClick={() => { setActionsId(null); setMenuPosition(null); onDelete(word._id); }}><SpriteIcon name="icon-trash-black" className={styles.actionIcon} /> Delete</button>
              </div>,
              document.body,
            )}
          </div>
        );
      },
    }),
  ]), [actionsId, menuPosition, onDelete, onEdit]);
  const table = useTable({ features, columns, data: words, getRowId: (word) => word._id });

  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>{table.getHeaderGroups().map((headerGroup) => <tr key={headerGroup.id}>
          {headerGroup.headers.map((header) => <th key={header.id} aria-label={header.id === "actions" ? "Actions" : undefined}>
            {header.isPlaceholder ? null : <table.FlexRender header={header} />}
          </th>)}
        </tr>)}</thead>
        <tbody>
          {loading && <tr><td className={styles.empty} colSpan={5}>Loading your dictionary…</td></tr>}
          {!loading && table.getRowModel().rows.map((row) => <tr key={row.id}>
            {row.getAllCells().map((cell) => <td key={cell.id}><table.FlexRender cell={cell} /></td>)}
          </tr>)}
          {!loading && table.getRowModel().rows.length === 0 && <tr><td className={styles.empty} colSpan={5}>No words found.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
