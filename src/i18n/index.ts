import sanity from "@/services/sanity";
import { sessionStore } from "@/store";
import { createI18n } from "vue-i18n";

const i18n = createI18n({
    locale: 'current',
    fallbackLocale: 'en',
    silentFallbackWarn: true,
    silentTranslationWarn: true,
})

const validLanguages = ['en', 'no']

let translations: {
    [key: string]: string;
};

const lanKey = localStorage.getItem('languageKey') ?? 'en'

let currentTranslation = validLanguages.includes(lanKey) ? lanKey : 'en';

export async function setLocale(locale: string) {
    translations = (await sanity.getAllTranslations(locale)).reduce((a, b) => ({...a, [b.key]: b.value}), {});
    i18n.global.setLocaleMessage('current', translations);
    currentTranslation = locale;
}

let englishIsFetched = false;

export async function ensureLanguageIsFetched() {
    const lan = sessionStore.getters.languageKey;
    if (!englishIsFetched) {
        englishIsFetched = true;
        i18n.global.setLocaleMessage('en', (await sanity.getAllTranslations('en')).reduce((a, b) => ({...a, [b.key]: b.value}), {}))
    }
    if (!translations || currentTranslation !== lan) {
        await setLocale(lan);
    }
}

export default i18n;