import styles from "../app/dictionary/page.module.css";
import SpriteIcon from "./SpriteIcon";

export default function WordsPagination({ page, totalPages, onPageChange }: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  const visiblePages = totalPages <= 5
    ? Array.from({ length: totalPages }, (_, index) => index + 1)
    : page <= 2
      ? [1, 2, 3]
      : page >= totalPages - 1
        ? [totalPages - 2, totalPages - 1, totalPages]
        : [page - 1, page, page + 1];

  return (
    <nav className={styles.pagination} aria-label="Dictionary pages">
      <button type="button" aria-label="First page" disabled={page <= 1} onClick={() => onPageChange(1)}><SpriteIcon name="icon-double-left" className={styles.uiIcon} /></button>
      <button type="button" aria-label="Previous page" disabled={page <= 1} onClick={() => onPageChange(page - 1)}><SpriteIcon name="icon-arrow-left" className={styles.uiIcon} /></button>
      {visiblePages.map((pageNumber) => <button type="button" key={pageNumber} aria-current={page === pageNumber ? "page" : undefined} className={page === pageNumber ? styles.currentPage : ""} onClick={() => onPageChange(pageNumber)}>{pageNumber}</button>)}
      {totalPages > 5 && page < totalPages - 1 && <span className={styles.pageEllipsis} aria-hidden="true">…</span>}
      {totalPages > 5 && page < totalPages - 1 && <button type="button" aria-current={page === totalPages ? "page" : undefined} className={page === totalPages ? styles.currentPage : ""} onClick={() => onPageChange(totalPages)}>{totalPages}</button>}
      <button type="button" aria-label="Next page" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}><SpriteIcon name="icon-arrow-right" className={styles.uiIcon} /></button>
      <button type="button" aria-label="Last page" disabled={page >= totalPages} onClick={() => onPageChange(totalPages)}><SpriteIcon name="icon-double-right" className={styles.uiIcon} /></button>
    </nav>
  );
}
