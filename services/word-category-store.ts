type Listener = () => void;
type WordCategoryAction = { type: "wordCategories/loaded"; payload: string[] };
type WordCategoryState = { categories: string[] };

let state: WordCategoryState = { categories: [] };
const listeners = new Set<Listener>();

function reducer(current: WordCategoryState, action: WordCategoryAction): WordCategoryState {
  switch (action.type) {
    case "wordCategories/loaded":
      return { ...current, categories: action.payload };
    default:
      return current;
  }
}

export function getWordCategoriesSnapshot() {
  return state.categories;
}

export function subscribeToWordCategories(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function setWordCategories(nextCategories: string[]) {
  state = reducer(state, { type: "wordCategories/loaded", payload: nextCategories });
  listeners.forEach((listener) => listener());
}
