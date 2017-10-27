import hljsThemes from "../src/hljs-themes.json";
import hljs from "highlight.js";
import titleCase from "title-case";

const capitalize = (string) => string.charAt(0).toUpperCase() + string.slice(1);


export const THEMES = Object.keys(hljsThemes);
export const THEMES_INDEXES_MAP = THEMES.reduce((memo, theme, index) => {
    memo[theme] = index;
    return memo;
}, {});
export const PRETTY_THEME_NAMES_MAP = THEMES.reduce((memo, theme) => {
    memo[theme] = titleCase(theme);
    return memo;
}, {});
export const LANGUAGES = hljs.listLanguages();
export const CAPITALIZED_LANGUAGES_MAP = LANGUAGES.reduce((memo, lang) => {
    memo[lang] = capitalize(lang);
    return memo;
}, {});
