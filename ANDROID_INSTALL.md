# 安卓手机安装方式

推荐方式：用浏览器安装 PWA，不建议直接把文件放进手机存储后打开 `index.html`。

## 最推荐：部署到 HTTPS 后安装

1. 把 `dist` 目录里的所有文件部署到任意 HTTPS 静态网站。
2. 安卓手机用 Chrome、Edge 或三星浏览器打开该网址。
3. 浏览器菜单中选择“安装应用”或“添加到主屏幕”。
4. 安装后从桌面图标打开，后续静态资源可离线使用。

适合的部署位置包括 Cloudflare Pages、GitHub Pages、Vercel、Netlify，或你自己的 HTTPS 服务器。

## 临时测试：用电脑局域网访问

电脑运行：

```bash
npm run dev
```

手机和电脑连同一个 Wi-Fi，然后手机浏览器打开终端里显示的 Network 地址，例如：

```text
http://192.168.x.x:5173/
```

这种方式适合测试转换功能，但不是最佳安装方式。因为局域网 HTTP 通常不是安全上下文，PWA 离线缓存和“安装应用”可能受浏览器限制。

## 不推荐：直接打开手机存储里的 index.html

不要直接用文件管理器打开 `index.html`。`file://` 模式会影响模块脚本、PDF worker、Service Worker、离线缓存和部分文件权限，容易出现能打开但转换失败的问题。

## 无服务器离线方案

如果你完全不想部署网站，可以在安卓手机上安装一个本地静态服务器应用，把 `dist` 目录放到手机里后通过 `http://127.0.0.1:端口/` 打开。这个方式仍然要借助浏览器，但比直接打开文件稳定。

如果想像普通 APK 一样安装，可以后续把当前 Web 应用再封装为 Capacitor Android APK。

### 为什么这种方式可行

浏览器直接打开手机里的 `index.html` 时，地址会是 `file://...`。这不是正常网站环境，容易影响 ES module、PDF worker、Service Worker、PWA 缓存和部分文件能力。

本地静态服务器会把同一批文件通过类似下面的地址提供给浏览器：

```text
http://127.0.0.1:8080/
```

浏览器会把它当成一个正常网页源来加载。`127.0.0.1` 只代表手机本机，不需要联网，也不会把 PDF 上传到外部服务器。

### 方案 A：Termux + Python 静态服务器

适合愿意敲几行命令的用户，稳定、透明、可控。

1. 在安卓手机安装 Termux。
   建议从 F-Droid 或 Termux 官方 GitHub 获取，不建议用长期未维护的旧 Play Store 版本。
2. 把 `invoiceforge-dist.zip` 复制到手机，例如 `Download` 目录。
3. 打开 Termux，执行：

```bash
termux-setup-storage
pkg update
pkg install python unzip
mkdir -p ~/invoiceforge
unzip /sdcard/Download/invoiceforge-dist.zip -d ~/invoiceforge
cd ~/invoiceforge
python -m http.server 8080 --bind 127.0.0.1
```

4. 保持 Termux 不关闭，打开 Chrome / Edge / 三星浏览器访问：

```text
http://127.0.0.1:8080/
```

5. 浏览器菜单里尝试“添加到主屏幕”或“安装应用”。

### 方案 B：本地静态服务器 App

适合不想敲命令的用户。

1. 在手机安装一个支持“选择目录并启动 HTTP 服务”的静态服务器 App。
2. 把 `invoiceforge-dist.zip` 解压到手机某个目录，例如：

```text
/sdcard/Download/invoiceforge/
```

3. 在服务器 App 中选择这个目录作为网站根目录。
4. 启动服务，端口例如 `8080`。
5. 浏览器打开：

```text
http://127.0.0.1:8080/
```

注意网站根目录必须直接包含 `index.html`、`assets`、`pdfjs`、`sw.js`。如果打开后是目录列表或 404，通常是选错了目录层级。

### 使用注意

- 关闭 Termux 或静态服务器 App 后，浏览器里的地址就打不开了。
- 已缓存的静态资源可能还能离线打开，但不要依赖它作为唯一入口。
- PDF 转 PNG 仍然全程在手机本地处理，不经过公网。
- 如果浏览器不允许安装 PWA，可以先用书签或“添加到主屏幕”方式打开。
- 这个方案适合个人离线使用；要给多人长期用，还是 HTTPS 静态部署更省心。
