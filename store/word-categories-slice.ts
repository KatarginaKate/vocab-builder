import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

const wordCategoriesSlice = createSlice({
  name: "wordCategories",
  initialState: [] as string[],
  reducers: {
    categoriesLoaded: (_state, action: PayloadAction<string[]>) => action.payload,
  },
});

export const { categoriesLoaded } = wordCategoriesSlice.actions;
export default wordCategoriesSlice.reducer;
