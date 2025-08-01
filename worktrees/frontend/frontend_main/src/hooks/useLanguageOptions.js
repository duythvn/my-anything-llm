// Simplified language options hook for testing interface (English only)
export function useLanguageOptions() {
  const supportedLanguages = ["en"];
  const languageNames = new Intl.DisplayNames(supportedLanguages, {
    type: "language",
  });
  const changeLanguage = (newLang = "en") => {
    // For testing interface, always use English
    return newLang === "en";
  };

  return {
    currentLanguage: "en",
    supportedLanguages,
    getLanguageName: (lang = "en") => languageNames.of(lang) || "English",
    changeLanguage,
  };
}
