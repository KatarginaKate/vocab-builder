import { configureStore } from "@reduxjs/toolkit";
import wordCategoriesReducer from "./word-categories-slice";

export const makeStore = () =>
  configureStore({
    reducer: {
      wordCategories: wordCategoriesReducer,
    },
  });

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
