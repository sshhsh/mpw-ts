import {
  createContext,
  createElement,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type Language = "zh-CN" | "en";

export const LANGUAGE_STORAGE_KEY = "mpw-web-language";

type TranslationValue = string;
type TranslationDictionary = Record<string, TranslationValue>;

const translations: Record<Language, TranslationDictionary> = {
  "zh-CN": {
    "language.name": "中文",
    "language.switch": "当前为{current}，切换为{next}",
    "brand.name": "离线密钥",
    "brand.version": "MPW v3",
    "theme.light": "浅色模式",
    "theme.dark": "深色模式",
    "theme.system": "跟随系统",
    "theme.switch": "当前为{current}，切换为{next}",
    "app.migrate": "迁移网站历史",
    "app.lock": "锁定会话",
    "app.clearHistory.confirm": "清除全部网站历史？",
    "app.algorithm": "算法版本 MPW v3",
    "app.footer": "离线优先 · 无需账户 · 无网络请求",
    "unlock.title": "解锁离线密钥",
    "unlock.copy": "身份信息只在当前页面内存中使用，锁定或刷新后立即清除。",
    "unlock.fullName": "完整姓名",
    "unlock.fullNamePlaceholder": "与其他设备保持完全一致",
    "unlock.masterPassword": "主密码",
    "unlock.masterPasswordPlaceholder": "不会被保存",
    "unlock.hideMaster": "隐藏主密码",
    "unlock.showMaster": "显示主密码",
    "unlock.derive": "正在派生密钥…",
    "unlock.submit": "解锁",
    "unlock.security": "无账户 · 无网络请求 · 不保存身份",
    "unlock.required": "请输入完整姓名和主密码。",
    "unlock.failed": "解锁失败。",
    "unlock.failedWithReason": "解锁失败：{reason}",
    "generator.parameters": "密码生成参数",
    "generator.site": "网站或服务",
    "generator.sitePlaceholder": "例如 example.com",
    "generator.clear": "清空生成参数",
    "generator.advanced": "高级选项",
    "generator.counter": "计数器",
    "generator.passwordTemplate": "密码模板",
    "generator.decreaseCounter": "减少计数器",
    "generator.increaseCounter": "增加计数器",
    "generator.generating": "正在生成…",
    "generator.generate": "生成密码",
    "generator.hint": "首次解锁后，生成只需瞬间",
    "generator.required": "请输入网站或服务。",
    "generator.failed": "生成失败。",
    "generator.failedWithReason": "生成失败：{reason}",
    "generator.clipboardFailed": "无法访问剪贴板，请手动复制。",
    "result.title": "生成结果",
    "result.waiting": "等待生成",
    "result.toggle": "显示或隐藏结果",
    "result.copied": "已复制",
    "result.copy": "复制",
    "history.recent": "最近使用",
    "history.clear": "清除全部历史",
    "history.search": "搜索网站",
    "history.searchLabel": "搜索网站历史",
    "history.mobileSearchLabel": "搜索移动端网站历史",
    "history.emptyTitle": "尚无网站历史",
    "history.emptyCopy": "成功生成后会出现在这里",
    "history.noMatch": "没有匹配的网站",
    "history.mobileEmpty": "生成第一个密码后，网站会保存在这里。",
    "history.done": "完成",
    "history.manage": "管理",
    "history.sensitiveTitle": "历史中不含敏感信息",
    "history.sensitiveCopy": "姓名、主密码和生成结果永不写入浏览器存储。",
    "history.load": "载入 {site}，{template}，计数器 {counter}",
    "history.delete": "删除 {site}",
    "history.counter": "计数器 {counter}",
    "history.time.justNow": "刚刚",
    "history.time.minutes": "{count} 分钟前",
    "history.time.hours": "{count} 小时前",
    "history.time.days": "{count} 天前",
    "transfer.close": "关闭历史迁移",
    "transfer.description":
      "迁移数据使用当前身份加密，只能由相同姓名和主密码解锁的设备导入。",
    "transfer.qr": "二维码",
    "transfer.text": "文本",
    "transfer.encrypting": "正在加密历史…",
    "transfer.exportQr": "显示迁移二维码",
    "transfer.exportQrDetail": "导出全部 {count} 条历史",
    "transfer.scanCamera": "使用摄像头扫描",
    "transfer.scanCameraDetail": "手机建议使用后置摄像头",
    "transfer.chooseQr": "选择二维码图片",
    "transfer.chooseQrDetail": "电脑可一次选择多张截图",
    "transfer.exportText": "导出迁移文本",
    "transfer.exportTextDetail": "复制全部 {count} 条加密历史",
    "transfer.importText": "导入迁移文本",
    "transfer.importTextDetail": "粘贴另一台设备导出的加密文本",
    "transfer.previousQr": "上一张二维码",
    "transfer.pauseQr": "暂停二维码轮播",
    "transfer.resumeQr": "继续二维码轮播",
    "transfer.nextQr": "下一张二维码",
    "transfer.frame": "第 {current} / {total} 张",
    "transfer.back": "返回",
    "transfer.scanPrompt": "扫描或选择同一批次的全部二维码",
    "transfer.restart": "重新开始",
    "transfer.textExported": "导出的迁移文本",
    "transfer.copyPrompt": "复制这段加密文本到另一台设备",
    "transfer.copyText": "复制迁移文本",
    "transfer.importPlaceholder": "粘贴迁移文本",
    "transfer.importLabel": "要导入的迁移文本",
    "transfer.decrypting": "正在解密历史…",
    "transfer.importMerge": "导入并合并",
    "transfer.merged": "已合并 {count} 条历史",
    "transfer.collected": "已收集 {received} / {total} 张",
    "transfer.qrGenerateFailed": "无法生成二维码。",
    "transfer.failed": "无法迁移历史。",
    "transfer.pasteRequired": "请粘贴迁移文本。",
    "transfer.copied": "迁移文本已复制",
    "transfer.clipboardFailed": "无法访问剪贴板，请手动复制。",
    "transfer.qrReadFailed": "无法读取二维码。",
    "transfer.cameraFailed": "无法打开摄像头，请允许权限或选择二维码图片。",
    "transfer.imageFailed": "图片中没有可用二维码。",
    "update.title": "发现新版本",
    "update.copy": "更新会刷新页面，当前会话需要重新解锁。",
    "update.later": "稍后",
    "update.now": "立即更新",
    "update.close": "关闭更新提示",
    "build.source": "在 GitHub 查看源代码",
    "template.maximum": "最高强度 · 20 位",
    "template.long": "长密码 · 14 位",
    "template.medium": "中等 · 8 位",
    "template.basic": "基础 · 8 位",
    "template.short": "短密码 · 4 位",
    "template.pin": "PIN · 4 位数字",
    "template.name": "用户名 · 9 位",
    "template.phrase": "短语 · 4 组单词",
    "templateName.maximum": "最高强度",
    "templateName.long": "长密码",
    "templateName.medium": "中等",
    "templateName.basic": "基础",
    "templateName.short": "短密码",
    "templateName.pin": "PIN",
    "templateName.name": "用户名",
    "templateName.phrase": "短语",
  },
  en: {
    "language.name": "English",
    "language.switch": "Current: {current}. Switch to {next}",
    "brand.name": "Offline Key",
    "brand.version": "MPW v3",
    "theme.light": "Light mode",
    "theme.dark": "Dark mode",
    "theme.system": "System mode",
    "theme.switch": "Current: {current}. Switch to {next}",
    "app.migrate": "Migrate site history",
    "app.lock": "Lock session",
    "app.clearHistory.confirm": "Clear all site history?",
    "app.algorithm": "Algorithm MPW v3",
    "app.footer": "Offline first · No account · No network requests",
    "unlock.title": "Unlock offline key",
    "unlock.copy":
      "Identity details stay in this page memory and are cleared when locked or refreshed.",
    "unlock.fullName": "Full name",
    "unlock.fullNamePlaceholder": "Keep this exactly the same on other devices",
    "unlock.masterPassword": "Master password",
    "unlock.masterPasswordPlaceholder": "Never stored",
    "unlock.hideMaster": "Hide master password",
    "unlock.showMaster": "Show master password",
    "unlock.derive": "Deriving key…",
    "unlock.submit": "Unlock",
    "unlock.security": "No account · No network requests · Identity not stored",
    "unlock.required": "Enter your full name and master password.",
    "unlock.failed": "Unlock failed.",
    "unlock.failedWithReason": "Unlock failed: {reason}",
    "generator.parameters": "Password generation parameters",
    "generator.site": "Website or service",
    "generator.sitePlaceholder": "For example, example.com",
    "generator.clear": "Clear generation parameters",
    "generator.advanced": "Advanced options",
    "generator.counter": "Counter",
    "generator.passwordTemplate": "Password template",
    "generator.decreaseCounter": "Decrease counter",
    "generator.increaseCounter": "Increase counter",
    "generator.generating": "Generating…",
    "generator.generate": "Generate password",
    "generator.hint": "After the first unlock, generation is instant",
    "generator.required": "Enter a website or service.",
    "generator.failed": "Generation failed.",
    "generator.failedWithReason": "Generation failed: {reason}",
    "generator.clipboardFailed":
      "Clipboard unavailable. Please copy it manually.",
    "result.title": "Generated result",
    "result.waiting": "Waiting for generation",
    "result.toggle": "Show or hide result",
    "result.copied": "Copied",
    "result.copy": "Copy",
    "history.recent": "Recently used",
    "history.clear": "Clear all history",
    "history.search": "Search websites",
    "history.searchLabel": "Search site history",
    "history.mobileSearchLabel": "Search mobile site history",
    "history.emptyTitle": "No site history yet",
    "history.emptyCopy": "Generated passwords will appear here",
    "history.noMatch": "No matching websites",
    "history.mobileEmpty": "Generate your first password to save a site here.",
    "history.done": "Done",
    "history.manage": "Manage",
    "history.sensitiveTitle": "History contains no sensitive data",
    "history.sensitiveCopy":
      "Names, master passwords, and generated results are never saved in browser storage.",
    "history.load": "Load {site}, {template}, counter {counter}",
    "history.delete": "Delete {site}",
    "history.counter": "Counter {counter}",
    "history.time.justNow": "Just now",
    "history.time.minutes": "{count} minutes ago",
    "history.time.hours": "{count} hours ago",
    "history.time.days": "{count} days ago",
    "transfer.close": "Close history migration",
    "transfer.description":
      "Transfer data is encrypted with the current identity and can only be imported on a device unlocked with the same name and master password.",
    "transfer.qr": "QR code",
    "transfer.text": "Text",
    "transfer.encrypting": "Encrypting history…",
    "transfer.exportQr": "Show migration QR codes",
    "transfer.exportQrDetail": "Export all {count} history entries",
    "transfer.scanCamera": "Scan with camera",
    "transfer.scanCameraDetail": "A phone should use its rear camera",
    "transfer.chooseQr": "Choose QR code images",
    "transfer.chooseQrDetail":
      "On desktop, select multiple screenshots at once",
    "transfer.exportText": "Export migration text",
    "transfer.exportTextDetail": "Copy all {count} encrypted history entries",
    "transfer.importText": "Import migration text",
    "transfer.importTextDetail":
      "Paste encrypted text exported by another device",
    "transfer.previousQr": "Previous QR code",
    "transfer.pauseQr": "Pause QR rotation",
    "transfer.resumeQr": "Resume QR rotation",
    "transfer.nextQr": "Next QR code",
    "transfer.frame": "Frame {current} / {total}",
    "transfer.back": "Back",
    "transfer.scanPrompt": "Scan or choose all QR codes from the same batch",
    "transfer.restart": "Start over",
    "transfer.textExported": "Exported migration text",
    "transfer.copyPrompt": "Copy this encrypted text to another device",
    "transfer.copyText": "Copy migration text",
    "transfer.importPlaceholder": "Paste migration text",
    "transfer.importLabel": "Migration text to import",
    "transfer.decrypting": "Decrypting history…",
    "transfer.importMerge": "Import and merge",
    "transfer.merged": "Merged {count} history entries",
    "transfer.collected": "Collected {received} / {total}",
    "transfer.qrGenerateFailed": "Unable to generate QR code.",
    "transfer.failed": "Unable to migrate history.",
    "transfer.pasteRequired": "Paste migration text first.",
    "transfer.copied": "Migration text copied",
    "transfer.clipboardFailed":
      "Clipboard unavailable. Please copy it manually.",
    "transfer.qrReadFailed": "Unable to read QR code.",
    "transfer.cameraFailed":
      "Unable to open the camera. Allow access or choose QR images.",
    "transfer.imageFailed": "No usable QR code found in the image.",
    "update.title": "New version available",
    "update.copy":
      "Updating will refresh the page; the current session must be unlocked again.",
    "update.later": "Later",
    "update.now": "Update now",
    "update.close": "Close update notice",
    "build.source": "View source on GitHub",
    "template.maximum": "Maximum · 20 characters",
    "template.long": "Long · 14 characters",
    "template.medium": "Medium · 8 characters",
    "template.basic": "Basic · 8 characters",
    "template.short": "Short · 4 characters",
    "template.pin": "PIN · 4 digits",
    "template.name": "Name · 9 characters",
    "template.phrase": "Phrase · 4 word groups",
    "templateName.maximum": "Maximum",
    "templateName.long": "Long",
    "templateName.medium": "Medium",
    "templateName.basic": "Basic",
    "templateName.short": "Short",
    "templateName.pin": "PIN",
    "templateName.name": "Name",
    "templateName.phrase": "Phrase",
  },
};

function detectLanguage(): Language {
  if (typeof navigator === "undefined") return "zh-CN";
  const locales = navigator.languages?.length
    ? navigator.languages
    : [navigator.language];
  return locales.some((locale) => locale.toLowerCase().startsWith("en"))
    ? "en"
    : "zh-CN";
}

function readLanguage(): Language {
  if (typeof window === "undefined") return "zh-CN";
  const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
  return stored === "en" || stored === "zh-CN" ? stored : detectLanguage();
}

interface LanguageContextValue {
  language: Language;
  setLanguage: (language: Language) => void;
  toggleLanguage: () => void;
  t: (key: string, values?: Record<string, string | number>) => string;
}

export type Translator = LanguageContextValue["t"];

const LanguageContext = createContext<LanguageContextValue | null>(null);

function interpolate(
  value: string,
  values?: Record<string, string | number>,
): string {
  if (!values) return value;
  return value.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? String(values[key]) : match,
  );
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(readLanguage);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  function setLanguage(nextLanguage: Language): void {
    setLanguageState(nextLanguage);
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLanguage);
  }

  function toggleLanguage(): void {
    setLanguage(language === "zh-CN" ? "en" : "zh-CN");
  }

  function t(key: string, values?: Record<string, string | number>): string {
    const value = translations[language][key] ?? translations["zh-CN"][key];
    return interpolate(value ?? key, values);
  }

  return createElement(
    LanguageContext.Provider,
    { value: { language, setLanguage, toggleLanguage, t } },
    children,
  );
}

export function useLanguage(): LanguageContextValue {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
}
