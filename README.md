# README.md 图像直方图分析移动端系统
## 项目简介
本项目为课程作业《图像直方图计算及性能优化》移动端App，采用 Vue3 + Vite + Capacitor 纯前端技术栈，依靠 JS + WebWorker 本地完成图像像素计算，打包安卓APK后可完全离线运行。
核心功能：
1. 调用手机相册上传图片，采用标准灰度公式 `gray=R*0.299+G*0.587+B*0.114` 计算灰度直方图；
2. 输出固定分辨率 `256×100` 黑白直方图画布，像素计数自动归一化至0~100；
3. 高精度毫秒级耗时统计，多线程优化后计算耗时稳定控制在300ms以内；
4. 支持切换「单线程基准算法」「WebWorker多线程优化算法」，用于性能对比；
5. 一套代码同时支持网页预览、安卓App打包，Windows集显电脑可完整开发测试。

## 技术栈
- 前端框架：Vue3 + Vite
- 跨端运行时：Capacitor 5（打包Android App）
- UI组件库：NaiveUI
- 并行计算：WebWorker（子线程分块像素统计，不阻塞UI主线程）
- 图像处理：原生 Canvas ImageData 读取像素，无第三方图像库
- 原生能力插件：`@capacitor/camera` 相册图片读取

## 项目目录结构
```
histogram-cap-vue/
├── capacitor.config.ts        # Capacitor跨端全局配置（安卓权限、应用ID）
├── vite.config.js             # Vite配置：WebWorker支持、路径别名
├── package.json               # 项目依赖、启动/打包脚本
├── index.html
├── public/                    # 静态资源文件夹
├── android/                   # Capacitor自动生成安卓原生工程
├── src/
│   ├── main.js                # 项目入口，全局组件、UI库注册
│   ├── App.vue                # 根页面：上传区、原图预览、直方图、耗时面板
│   ├── components/            # 可复用UI组件
│   │   ├── ImageUploader.vue  # Capacitor相册图片上传组件
│   │   ├── ImagePreview.vue   # 原图预览容器
│   │   ├── HistogramCanvas.vue# 256*100固定尺寸直方图画布渲染
│   │   ├── TimeDisplay.vue    # 计算耗时展示面板
│   │   └── AlgorithmSwitch.vue# 基准/优化算法切换按钮
│   ├── utils/                 # 通用工具函数
│   │   ├── timeTool.js        # 高精度performance计时工具
│   │   ├── histogramBase.js   # 单线程基准灰度直方图算法
│   │   ├── histogramOpt.js    # WebWorker多线程计算封装
│   │   ├── normalize.js       # 计数归一化0~100工具
│   │   └── imagePixel.js      # 图片转ImageData像素读取工具
│   ├── workers/               # WebWorker子线程计算脚本
│   │   └── pixelCalc.worker.js# 分块并行灰度统计核心逻辑
│   └── styles/global.css      # 全局公共样式
└── .gitignore                 # Git忽略文件
```

# 一、环境前置要求（Windows开发）
必须提前安装软件：
1. Node.js 18 LTS 长期支持版本（自带npm）
2. JDK 1.8 （安卓打包编译依赖）
3. Android SDK（Capacitor可自动引导下载）
4. Android Studio（安卓真机/模拟器测试、打包APK）
5. Git（多人协同版本管理）

# 二、项目初始化 & 启动教程
## 1. 项目依赖完整安装
进入项目根目录执行：
```bash
# 安装全部核心依赖，包含Capacitor安卓平台、相册插件、UI库
npm install @capacitor/cli @capacitor/core @capacitor/android @capacitor/camera naive-ui lodash
```

## 2. Capacitor初始化（新项目首次搭建执行，已有配置可跳过）
```bash
# 生成capacitor.config.ts配置文件
npx cap init 图像直方图系统 com.histogram.app
# 生成安卓原生工程文件夹 android/
npx cap add android
```

## 3. 网页端本地调试（页面、算法快速预览）
```bash
# 启动Vite开发服务器，支持热更新
npm run dev
```
访问地址：`http://127.0.0.1:5173`
- F12打开浏览器调试面板，可断点调试灰度算法、画布渲染逻辑；
- 仅用于开发调试，无任何后端服务，所有计算在浏览器本地完成。

## 4. 前端资源打包（修改代码后同步安卓工程必执行）
```bash
# 打包Vue静态资源输出至dist文件夹
npm run build
# 将dist静态资源、插件配置同步到安卓工程
npx cap sync android
```

# 三、Android App 完整测试教程
## 方式1：命令行一键真机/模拟器运行（推荐快速测试）
### 真机手机前置准备
1. 手机「设置-关于本机」连续点击版本号7次，开启**开发者选项**；
2. 开发者选项开启：`USB调试`、`USB安装`、文件传输MTP模式；
3. USB数据线连接电脑，手机弹窗勾选「允许此计算机调试」；
4. CMD验证设备是否识别：
```bash
adb devices
```
终端输出设备编号即连接成功。

### 一键编译安装App
```bash
# 自动同步前端代码、构建Debug APK、安装到选中设备
npx cap run android
```
终端会列出所有可用设备，输入设备序号回车，自动启动App。

## 方式2：Android Studio可视化完整测试（排查原生权限、兼容问题）
1. 打开安卓原生工程：
```bash
npx cap open android
```
2. 首次打开会自动下载Gradle、SDK依赖，等待同步完成；
3. 顶部设备下拉框选择目标设备（USB真机/已创建模拟器）；
4. 点击绿色三角「Run」按钮，自动构建、安装、启动App。

### Windows集显电脑模拟器优化（解决卡顿）
1. Android Studio → AVD Manager → 编辑模拟器；
2. 降低模拟器分辨率、关闭硬件GPU加速；
3. 推荐API24及以上安卓镜像，完美适配Capacitor WebView。

## 方式3：Chrome远程调试（定位算法、性能Bug）
用于查看日志、校验耗时、优化多线程逻辑：
1. 真机/模拟器正常运行本App；
2. Chrome浏览器地址栏输入：`chrome://inspect/#devices`；
3. 页面列表会显示当前运行的App，点击「inspect」打开调试面板：
- Console面板：打印直方图计数、计算耗时，校验是否≤300ms；
- Sources面板：断点调试基准/优化算法代码；
- Performance面板：抓取主线程阻塞，优化多线程分块逻辑。

# 四、正式APK打包交付教程
1. 打包前端静态资源并同步安卓工程
```bash
npm run build
npx cap sync android
npx cap open android
```
2. Android Studio顶部菜单：`Build → Generate Signed Bundle / APK`；
3. 选择`APK`，新建/导入签名密钥，构建Release正式签名包；
4. 输出文件路径：`android/app/release/app-release.apk`；
5. 交付前全量复测：多台安卓手机安装，验证功能、耗时指标、直方图渲染准确性。

# 五、核心功能测试用例（测试人员使用）
## 1. 功能完整性测试
1. 相册上传亮图、暗图、纯色图、4K高清大图均可正常读取；
2. 灰度转换严格遵循指定公式，两种算法输出直方图计数数组完全一致；
3. 直方图画布固定宽256、高100，黑白柱状渲染无拉伸变形；
4. 像素最大值自动归一化至0~100区间，比例无失真；
5. 界面实时展示计算毫秒耗时，精度保留2位小数；
6. 切换两种算法，直方图结果不变，优化后耗时明显降低。

## 2. 性能验收标准
多线程优化算法处理图片平均耗时 **≤300ms**
统一测试素材：亮图、暗图、高清大图，每张图片测试5次取平均值，数据写入测试报告。

## 3. 兼容性&稳定性测试
1. Android 11/12/13/14 真机、模拟器分别测试；
2. 小屏手机、平板自适应布局，直方图画布展示正常；
3. 拒绝相册权限时弹出友好提示，App无闪退崩溃；
4. 连续10次重复上传计算，内存无持续暴涨、无卡死。

# 六、常见报错与解决方案
1. 执行 `npx cap add android` 提示找不到平台
```bash
# 缺失安卓平台依赖，先安装再执行添加命令
npm install @capacitor/android
npx cap add android
```

2. 修改前端代码后App页面无更新
未执行打包同步命令，静态资源未同步到安卓工程，执行：
```bash
npm run build && npx cap sync android
```

3. App无法读取手机相册图片
① 检查 `capacitor.config.ts` 已配置相册、存储权限；
② 卸载App重新安装，首次打开手动授予相册权限；
③ AndroidManifest.xml 确认图片读写权限已声明。

4. WebWorker计算耗时超过300ms
打开Chrome Performance面板抓取线程阻塞，调整图像分块大小，优化循环遍历逻辑。

5. 模拟器运行卡顿（Windows集显电脑）
在AVD模拟器设置中关闭硬件GPU加速、降低分辨率、调低内存分配。

# 七、项目说明补充
1. **本项目无任何后端服务**，所有图像灰度计算、像素统计、画布渲染均在前端本地完成，打包APK后无需联网、无需启动任何服务即可离线使用；
2. 提供两套计算算法用于对比：单线程基准算法（结果标准）、WebWorker多线程优化算法（满足300ms性能要求）；
3. 课堂演示仅需安装打包后的APK，无需额外部署环境，交付便捷。