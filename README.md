# MPW TS

一个平台无关的 TypeScript Master Password v3 实现，以及一个离线优先的 PWA 前端。

项目根据姓名、主密码、网站和少量生成参数确定性地生成凭据。生成结果不需要保存，也不会上传到服务器。

## 项目组成

- [`mpw-ts`](mpw-ts/README.md)：纯 TypeScript 核心库。
  - 浏览器端使用 Web Crypto 和 TypeScript scrypt 实现。
  - Node.js 端使用 `node:crypto`。
  - ESM、严格 TypeScript、Node.js 20+。
- [`mpw-web`](mpw-web/README.md)：React + Vite + PWA 应用。
  - 简体中文界面。
  - 支持离线运行和安装到桌面/主屏幕。
  - 使用浏览器 localStorage 保存网站生成参数，不限制历史条数。
  - 支持使用相同 MPW 身份加密的多帧二维码离线迁移全部历史。

## 快速开始

需要 Node.js 20 或更高版本。

```sh
npm install
npm run dev
```

开发服务器默认启动 `mpw-web`。也可以直接运行前端 workspace：

```sh
npm run dev --workspace mpw-web
```

生产构建、测试和质量检查：

```sh
npm run check
npm run build
npm test
```

预览前端生产构建：

```sh
npm run preview --workspace mpw-web
```

## 使用前端

1. 在本地解锁页输入完整姓名和主密码。
2. 解锁后输入网站，或从最近网站中载入生成参数。
3. 点击生成密码，随后可以复制结果。
4. 模板和计数器位于高级选项中。
5. 使用右上角锁定按钮结束当前会话。

首次解锁会执行故意耗时的 scrypt 密钥派生。浏览器端首次派生需要数秒是正常现象；派生完成后，同一会话内生成网站密码会很快。

## 安全边界

- 姓名、主密码、派生密钥和生成结果只存在于当前内存会话中。
- 刷新、关闭页面或锁定会话后，需要重新解锁。
- localStorage 的 `mpw.site-history` 只保存网站、模板、计数器和最近使用时间。
- 二维码迁移数据使用当前 MPW 身份派生的专用密钥和 AES-GCM 加密，只能由相同身份解密。
- 二维码迁移完全离线；完整姓名、主密码、派生主密钥和生成结果不会写入二维码。
- 网站历史不包含姓名、主密码、派生密钥或生成结果。
- localStorage 是浏览器本地存储，不是加密保险箱；使用共享设备时应清理浏览器数据。
- `MPW.invalidate()` 会清除实例持有的主密钥，并阻止继续生成。
- 本项目尚未经过独立安全审计。

确定性生成意味着：只要姓名、主密码、网站、计数器、模板和算法版本一致，结果就一致。修改其中任意一项都会得到不同结果。

## 核心库示例

浏览器端：

```ts
import { MPW } from '@mpw/core'

const mpw = await MPW.create('Jane Doe', 'correct horse battery staple')
const password = await mpw.generateAuthentication('example.com')

mpw.invalidate()
```

Node.js 端：

```ts
import { MPW } from '@mpw/core/node'

const mpw = await MPW.create('Jane Doe', 'correct horse battery staple')
const password = await mpw.generateAuthentication('example.com')

mpw.invalidate()
```

支持的模板包括 `maximum`、`long`、`medium`、`basic`、`short`、`pin`、`name` 和 `phrase`。核心库也提供 identification 和 recovery namespace；当前 Web 前端聚焦密码生成。

## 仓库结构

```text
mpw-pwa/
├── mpw-ts/       # 平台无关的 MPW v3 TypeScript 核心库
├── mpw-web/      # React + Vite + PWA 前端
├── package.json  # npm workspace 与根级命令
└── package-lock.json
```

## 开发命令

根目录命令会转发到两个 workspace：

- `npm run check`：格式、lint、类型检查和测试。
- `npm run build`：构建核心库和 PWA 前端。
- `npm test`：运行两个 workspace 的测试。
- `npm run dev`：启动前端开发服务器。

核心库的浏览器测试需要 Playwright Chromium。首次使用时：

```sh
npx playwright install chromium
```

## 许可证

本项目使用 [Creative Commons Attribution 4.0 International](LICENSE)。核心实现改编自 Tom Thorogood 的 [`mpw-js`](https://github.com/tmthrgd/mpw-js)，具体归属和许可说明见 [LICENSE](LICENSE)。
