# 离线密钥 Web

基于 MPW v3 的本地密码生成器。应用没有账户或后端，所有密钥派生和密码生成均在浏览器中完成。

## 使用流程

1. 在解锁页输入完整姓名和主密码，应用在内存中派生当前会话密钥。
2. 选择最近使用的网站或输入新网站，点击“生成密码”。
3. 模板和计数器位于默认收起的高级选项中。
4. 点击右上角锁定按钮可立即清除姓名、主密码、派生密钥和生成结果。

刷新或关闭页面后必须重新解锁。姓名、主密码、派生密钥和生成结果不会写入浏览器存储。

localStorage 的 `mpw.site-history.v2` 只保存网站、模板、计数器和最近使用时间。旧版历史升级时仅迁移密码记录，用户名和安全回答记录会被清理。

## 开发

从仓库根目录运行：

```bash
npm install
npm run dev
npm run check
npm run build
```

生产构建包含 PWA manifest 和离线 Service Worker。

<!--
# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.
-->
