# 票影工坊 / InvoiceForge

离线优先的移动端工具应用。当前工具为 PDF 转 PNG，后续工具可在 `src/features` 下扩展并注册到工具表。

## 开发

```bash
npm install
npm run dev
```

开发服务器会先同步 PDF.js 的 `cmaps`、标准字体、wasm、ICC 和图片解码资源到 `public/pdfjs`，避免运行时依赖 CDN。

## 构建

```bash
npm run build
```

构建产物会生成 PWA 缓存，支持静态资源离线访问。PDF、PNG 和 ZIP 只在本机处理，不上传网络。

## 验证

```bash
npm run typecheck
npm run build
```

核心实现位于：

- `src/features/pdf-to-image/services/pdfRenderer.ts`
- `src/features/pdf-to-image/stores/pdfConversionStore.ts`
- `src/features/pdf-to-image/components/PdfToImageTool.vue`
