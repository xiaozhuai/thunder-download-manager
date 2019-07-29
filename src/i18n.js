import lang_en from './i18n/en';
import lang_zh from './i18n/zh';
import lang_zh_CN from './i18n/zh_CN';
import lang_zh_TW from './i18n/zh_TW';

const langTable = {
    en: lang_en,
    zh: lang_zh,
    zh_cn: lang_zh_CN,
    zh_tw: lang_zh_TW,
};

let currentLocale = 'en';
let fallbackLocale = 'en';

export default {
    setLocale(lang) {
        lang = lang.replace(/\-/g, '_').toLowerCase();
        if (langTable.hasOwnProperty(lang)) {
            currentLocale = lang;
        }
    },
    /**
     *
     * @param name String
     */
    tr(name) {
        let msgs = langTable[currentLocale];
        if (msgs.hasOwnProperty(name)) {
            return msgs[name];
        }

        if (currentLocale.indexOf('_')) {
            msgs = langTable[currentLocale.substring(0, currentLocale.indexOf('_'))];
        }
        if (msgs.hasOwnProperty(name)) {
            return msgs[name];
        }

        msgs = langTable[fallbackLocale];
        if (msgs.hasOwnProperty(name)) {
            return msgs[name];
        }

        return '????';
    }
}