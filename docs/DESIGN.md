<!--
  HistogramCap-Vue 详细设计文档
  --------------------------------
  本文档描述图像灰度直方图计算应用的核心设计与实现。
  Version: 0.0.0
  Date: 2026-07-09
-->

# HistogramCap-Vue 详细设计文档

## 1. 项目概述

HistogramCap-Vue 是一款基于 Vue 3 + Capacitor 的跨平台图像直方图分析工具。用户上传图片后，应用计算其 256 级灰度直方图，并通过多种算法策略的横向对比，展示不同实现方案的性能差异。应用支持 Android 原生和 Web 两种运行环境。

- **技术栈**: Vue 3 (Composition API)、Pinia、Vue Router、Element Plus、Vite、Capacitor、Web Workers
- **核心指标**: 灰度直方图计算结果精确度、算法耗时（目标 < 300ms）、可复现的基准测试
- **运行模式**: Web 浏览器 / Android 原生（Capacitor 封装）

---

## 2. 系统架构

### 2.1 分层架构

~~~
+--------------------------------------------------+
|                    UI Layer                        |
|  Home.vue  Result.vue  About.vue                  |
|  ImageUploader  HistogramCanvas  TimeDisplay ...   |
+--------------------------------------------------+
|                 State Layer                        |
|                Pinia Store                         |
|            (stores/histogram.js)                   |
+--------------------------------------------------+
|              Algorithm Layer                       |
|  histogramBase.js  histogramOpt.js                 |
|  histogramBenchmark.js  normalize.js               |
+--------------------------------------------------+
|            Infrastructure Layer                    |
|  imagePixel.js  imageExport.js  errorHandler.js    |
|  pixelCalc.worker.js  timeTool.js                  |
+--------------------------------------------------+
|              Platform Bridge                       |
|        Capacitor (Filesystem / Camera)             |
+--------------------------------------------------+
~~~

### 2.2 路由设计

| 路径 | 页面 | 功能 |
|------|------|------|
| `/home` | Home.vue | 图片上传、裁剪区域选择、算法选择、触发分析 |
| `/result` | Result.vue | 原图预览、直方图显示、耗时统计、性能对比 |
| `/about` | About.vue | 应用说明页面 |

路由 `/` 重定向到 `/home`。

### 2.3 目录结构

~~~
src/
  main.js                 # 应用入口，挂载 Vue/Pinia/Router/ElementPlus
  App.vue                 # 根组件，提供 <router-view>
  style.css               # 全局样式与 CSS 变量
  pages/                  # 页面级组件 (Home, Result, About)
  components/             # 可复用 UI 组件
  stores/                 # Pinia 状态仓库
  utils/                  # 纯逻辑工具模块
    __tests__/            # Vitest 单元测试
  workers/                # Web Worker 脚本
  router/                 # Vue Router 配置
~~~

---

## 3. 核心算法设计

### 3.1 灰度计算公式

所有算法统一使用 **ITU-R BT.601 亮度公式**：

~~~
gray = round(R * 0.299 + G * 0.587 + B * 0.114)
~~~

结果映射到 [0, 255] 的整数区间，作为 256 个直方图 bin 的索引。

实现位置: `histogramBase.js` 的 `runBaseHistogram` 函数，以及 `histogramOpt.js` 的 `getGray` 函数。

### 3.2 算法可配置维度

核心算法 `runOptimizedHistogram` 接受一个配置对象，包含以下维度：

#### 3.2.1 灰度策略 (grayStrategy)

| 策略 | 标识 | 实现 |
|------|------|------|
| 直接公式 | `directGray` | 每次像素计算时执行 `R * 0.299 + G * 0.587 + B * 0.114` |
| 精确查表 | `lookupGray` | 预计算 256x3 的 `Float64Array` 查找表，用数组索引替代乘法 |

查表实现位于 `histogramOpt.js`:

~~~javascript
const GRAY_TABLES = (() => {
  const r = new Float64Array(256)
  const g = new Float64Array(256)
  const b = new Float64Array(256)
  for (let i = 0; i < 256; i++) {
    r[i] = i * 0.299
    g[i] = i * 0.587
    b[i] = i * 0.114
  }
  return { r, g, b }
})()
~~~

#### 3.2.2 循环展开 (loopMode)

| 模式 | 每次迭代处理像素数 | 说明 |
|------|--------------------|------|
| `normalLoop` | 1 | 标准 `for` 循环，步长 4 字节 |
| `unroll2` | 2 | 每次迭代处理 2 个像素（8 字节） |
| `unroll4` | 4 | 每次迭代处理 4 个像素（16 字节） |
| `unroll8` | 8 | 每次迭代处理 8 个像素（32 字节） |

展开循环的核心逻辑：

~~~javascript
function computeUnrolledLoop(data, bins, grayStrategy, pixelStep) {
  const byteStep = pixelStep * 4
  const limit = data.length - byteStep + 1
  let i = 0
  for (; i <= limit; i += byteStep) {
    for (let offset = 0; offset < byteStep; offset += 4) {
      addPixel(data, bins, i + offset, grayStrategy)
    }
  }
  // 尾部剩余像素
  for (; i < data.length; i += 4) {
    addPixel(data, bins, i, grayStrategy)
  }
}
~~~

`unroll4` 是默认推荐配置，也是基准测试中通常性能最好的纯主线程方案。

#### 3.2.3 数据结构 (dataMode)

| 模式 | 实现 | 特点 |
|------|------|------|
| `histArray` | `new Array(256).fill(0)` | 普通 JS 数组，仅用于基准对比 |
| `histTypedArray` | `new Uint32Array(256)` | 定型数组，内存紧凑，访问更快 |

`histTypedArray` 是默认选择，`histArray` 标记为 `benchmarkOnly` 仅参与性能对比。

#### 3.2.4 线程模式 (threadMode)

| 模式 | 说明 |
|------|------|
| `mainThread` | 主线程同步计算 |
| `singleWorker` | 单个 Web Worker 异步计算 |
| `chunkWorker` | 单个 Worker 内部分块计算（大图片内存优化） |
| `fixed2Worker` | 固定 2 个 Worker 并行，按像素范围拆分 |
| `fixed4Worker` | 固定 4 个 Worker 并行 |

### 3.3 基准算法 (runBaseHistogram)

`histogramBase.js` 中的 `runBaseHistogram` 是正确性参照标准：

1. 遍历 ImageData 逐像素计算 `gray = round(R*0.299 + G*0.587 + B*0.114)`
2. 使用 `Uint32Array` 累加各灰度级像素数
3. 归一化到 [0, 100] 区间（用于 100px 高的直方图展示）
4. 可选生成 256x100 的 `ImageData` 直方图图像

所有优化算法必须与基准算法的 `bins` 完全一致（`totalDiff === 0`）才算"结果一致"。

### 3.4 并行计算 (Web Worker)

#### Worker 脚本

`pixelCalc.worker.js` 是一个独立的 ES Module Worker：

- 接收主线程通过 `postMessage` 传递的 `{ buffer, config }` —— `buffer` 是像素数据的 `ArrayBuffer`（通过 Transferable 零拷贝传递）
- 内部复用与主线程相同的计算逻辑（`createBins`、`grayValue`、`computeNormal`、`computeUnrolled`、`computeHistogram`）
- 计算完成后将 `bins` 的 `ArrayBuffer` 回传给主线程（同样通过 Transferable）

#### 多 Worker 拆分策略

`histogramOpt.js` 中的 `computeMultiWorker`：

1. 根据 `navigator.hardwareConcurrency` 或固定 workerCount 决定 worker 数量
2. 将像素数组按像素数等分，每份通过 `slice()` 创建独立 chunk
3. 并行启动多个 Worker，`Promise.all` 等待全部完成
4. 将各 Worker 返回的 256-bin 数组按索引累加，得到最终直方图

### 3.5 自动最优算法选择

当用户选择"自动最快（精确）"模式时（`autoExact`），系统执行以下流程：

1. 对当前图片运行全部 12 种配置组合的基准测试（预热 1 次 + 5 次统计）
2. 从结果中筛选 `sameAsBaseline === true` 且非 `benchmarkOnly` 的候选
3. 按平均耗时升序排列，选择最快的配置
4. 使用该配置重新计算并显示结果

---

## 4. 基准测试系统

### 4.1 设计目标

基准测试系统（`histogramBenchmark.js`）用于：

- 对同一图片在所有算法组合下进行性能对比
- 为自动模式提供选优依据
- 向用户展示不同策略的耗时差异

### 4.2 测试配置矩阵

`BENCHMARK_CONFIGS` 定义了 12 种配置：

| # | threadMode | grayStrategy | loopMode | dataMode | 说明 |
|---|------------|-------------|----------|----------|------|
| 1 | mainThread | directGray | normalLoop | histArray | 纯数组基线（仅对比） |
| 2 | mainThread | directGray | normalLoop | histTypedArray | 定型数组基线 |
| 3 | mainThread | lookupGray | normalLoop | histTypedArray | 查表优化 |
| 4 | mainThread | directGray | unroll2 | histTypedArray | 2路展开（仅对比） |
| 5 | mainThread | directGray | unroll4 | histTypedArray | 4路展开（推荐） |
| 6 | mainThread | directGray | unroll8 | histTypedArray | 8路展开（仅对比） |
| 7 | mainThread | lookupGray | unroll4 | histTypedArray | 查表+展开 |
| 8 | singleWorker | directGray | unroll4 | histTypedArray | 单 Worker |
| 9 | chunkWorker | directGray | unroll4 | histTypedArray | 分块 Worker 32K |
| 10 | chunkWorker | directGray | unroll4 | histTypedArray | 分块 Worker 256K |
| 11 | fixed2Worker | directGray | unroll4 | histTypedArray | 固定 2 Worker |
| 12 | fixed4Worker | directGray | unroll4 | histTypedArray | 固定 4 Worker |

标记 `benchmarkOnly: true` 的配置（#1, #4, #6）仅在对比表中展示，自动模式不会选中它们。

### 4.3 测试流程

`benchmarkHistogramAlgorithms` 函数：

1. 输入支持 `ImageData` 对象、`{ name, imageData }` 包装或图片路径字符串
2. 对每种输入先运行 `runBaseHistogram` 获取基准 bins
3. 对每种配置运行 `runs + 1` 次（首次预热，不计入统计）
4. 收集每次的 `computeMs`、`normalizeMs`、`dataGenerateMs`、`totalMs`
5. 计算平均值和最小/最大值
6. 通过 `compareHistogramBins` 与基准对比正确性

### 4.4 最优算法选择

`chooseBestAlgorithm` 对结果按算法名分组聚合后：

- 仅保留对所有测试图片都 `allExact` 且非 `benchmarkOnly` 的组
- 按 `totalMs` 升序排列
- 返回最快的配置及其聚合性能数据

---

## 5. 图像处理流水线

### 5.1 图片加载

`imagePixel.js` 提供从各种输入源获取 `ImageData` 的统一接口：

~~~
File / Blob URL  ----+
                      +----> loadImageElement() --> Canvas --> getImageData() --> ImageData
图片路径字符串  ------+
~~~

- `fileToImageData(file)`: 验证文件类型后通过 `URL.createObjectURL` 创建临时 URL，加载完成后立即释放
- `imagePathToImageData(src)`: 使用 Canvas 2D 上下文绘制图片并提取像素数据
- `cropImageData(imageData, rect)`: 从原图 ImageData 中截取指定矩形区域

### 5.2 裁剪区域选择

ImageUploader 组件支持：

- 鼠标拖拽框选（桌面端）
- 触摸拖拽框选（移动端）
- Canvas 覆盖层实时绘制遮罩和选择框
- 角标手柄指示已确认的选择区域
- 通过 ResizeObserver 响应容器尺寸变化

裁剪坐标会从 Canvas 显示坐标转换回原始图片坐标，存入 store 的 `cropRect`。

### 5.3 直方图 ImageData 生成

`histogramBase.js` 的 `createHistogramImageData`：

1. 创建 256x100 的 `Uint8ClampedArray`（RGBA 共 102400 字节）
2. 按列绘制：第 x 列的条柱高度 = `normalizedBins[x]`
3. 条柱部分填充黑色 (0, 0, 0, 255)，背景填充白色 (255, 255, 255, 255)
4. 返回 `ImageData` 对象供 Canvas 直接 `putImageData`

HistogramCanvas 组件可以将此 `ImageData` 直接绘制，也可从前端本地生成（降级方案）。

---

## 6. 状态管理

### 6.1 Pinia Store 设计

`stores/histogram.js` 使用 Pinia 的 Composition API 风格 (`defineStore` + `setup` 函数)。

**状态字段**:

| 字段 | 类型 | 说明 |
|------|------|------|
| `imageUrl` | `string` | 当前图片的 Data URL |
| `imageFile` | `File | null` | 原始文件对象 |
| `imageData` | `ImageData | null` | 裁剪后用于计算的像素数据 |
| `fullImageData` | `ImageData | null` | 原始完整像素数据（懒加载） |
| `cropRect` | `object | null` | 裁剪区域 |
| `algorithm` | `string` | 当前选中的算法 key |
| `bins` | `number[]` | 原始 256-bin 直方图数据 |
| `histogram` | `number[]` | 归一化后的直方图数据 |
| `timing` | `object` | 各阶段耗时统计 |
| `accuracy` | `object` | 与基准算法的正确性对比 |
| `benchmarkRows` | `object[]` | 性能对比表格数据 |

**计算属性**:

| 属性 | 说明 |
|------|------|
| `selectedAlgorithm` | 当前选中算法对应的完整配置对象 |
| `passed300ms` | 总耗时是否 < 300ms |
| `costTime` | 总耗时（毫秒） |

**关键方法**:

| 方法 | 说明 |
|------|------|
| `setImage(payload)` | 设置图片 URL/File，异步转换为 Data URL |
| `setCropRect(rect)` | 设置裁剪区域，触发懒加载和裁剪预览 |
| `startAnalysis()` | 核心流程：确保 ImageData 就绪 → 运行基准/优化算法 → 格式化结果 |
| `runBenchmark()` | 运行当前图片的全部算法对比 |
| `saveHistogramImage()` | 导出直方图 PNG |
| `saveMarkedOriginalImage()` | 导出自带标注信息的原图 PNG |
| `ensureImageData()` | 确保 ImageData 可用（含裁剪处理） |

### 6.2 分析流程状态机

~~~
用户点击"生成直方图"
       |
       v
 ensureImageData()
  |-- 有 cache? --> 直接返回
  |-- 无 cache --> 加载 fullImageData
  |                  |-- 有 cropRect? --> 裁剪后设置 imageData
  |                  |-- 无 cropRect? --> 使用完整 ImageData
       |
       v
 runBaseHistogram() 获取基准 bins
       |
       v
 是否为 autoExact?
  |-- 是 --> benchmarkHistogramAlgorithms() --> chooseFastestForImage()
  |-- 否 --> 使用 selectedAlgorithm.config
       |
       v
 runOptimizedHistogram() 或 runBaseHistogram()
       |
       v
 normalizeBins() --> createHistogramImageData()
       |
       v
 formatResult() --> 更新 store 状态
       |
       v
 router.push('/result')
~~~

---

## 7. 前端组件设计

### 7.1 组件树

~~~
App.vue
+-- AppHeader.vue          # 导航栏（标题、标签页切换）
+-- <router-view>
    +-- Home.vue           # 主页
    |   +-- ImageUploader  # 图片上传 + 裁剪
    |   +-- AlgorithmSwitch # 算法下拉选择
    +-- Result.vue         # 结果页
    |   +-- ImagePreview   # 原图预览
    |   +-- AlgorithmSwitch # 算法切换 + 重新运行
    |   +-- ResultPanel    # 统计结果描述列表
    |   +-- HistogramCanvas # 直方图 Canvas 渲染
    |   +-- TimeDisplay    # 耗时统计网格
    +-- About.vue          # 关于页面
~~~

### 7.2 关键组件说明

**ImageUploader** (`ImageUploader.vue`):
- 支持点击选择和拖拽上传
- 图片加载后渲染到 Canvas 上
- 第二个透明 Canvas 叠加层用于绘制裁剪框
- 支持鼠标/触摸事件的位置坐标转换
- 使用 ResizeObserver 响应容器尺寸变化

**HistogramCanvas** (`HistogramCanvas.vue`):
- 接收 `normalizedBins` 和可选的 `histogramImageData`
- 优先使用算法生成的 `ImageData`，降级时前端本地构建
- 通过 `image-rendering: pixelated` 确保像素级精确显示
- 渲染完成后通过 `emit('rendered', renderMs)` 回传统计

**TimeDisplay** (`TimeDisplay.vue`):
- 5 列网格展示: 计算、归一化、数据生成、渲染、总耗时
- 使用 `<300ms` 标签颜色指示性能等级

### 7.3 UI 组件库

项目使用 Element Plus 作为 UI 组件库（`el-card`、`el-button`、`el-table`、`el-select`、`el-tag`、`el-alert`、`el-empty`、`el-descriptions`）。

---

## 8. 导出系统

### 8.1 直方图 PNG 导出

`imageExport.js` 的 `buildHistogramPng(normalizedBins)`:

1. 创建 256x100 Canvas
2. 逐像素填充黑白 ImageData（与 `createHistogramImageData` 逻辑相同）
3. 通过 `canvas.toDataURL('image/png')` 导出

### 8.2 标注原图导出

`buildMarkedOriginalPng(imageUrl, status)`:

1. 加载原图
2. 缩放到最大边 2048px（保持宽高比）
3. 在右上角绘制状态标注框（背景色随结果一致性变化）：
   - `< 300ms` / `>= 300ms`
   - `结果一致` / `结果需复核`
   - 算法名称

### 8.3 保存策略

`saveImageFile(dataUrl, filename)`:

- **原生平台**（Android）: 通过 Capacitor Filesystem API 写入 `Directory.Documents`
- **Web 平台**: 通过 `<a download>` 触发浏览器下载

文件名格式: `{图片名}-{后缀}-{ISO时间戳}.png`

---

## 9. 错误处理

### 9.1 错误分类体系

`errorHandler.js` 定义了 8 种错误类型：

| 类型 | 说明 |
|------|------|
| `PERMISSION_DENIED` | 读取或保存权限被拒 |
| `DECODE_FAILED` | 图片解码失败 |
| `UNSUPPORTED_FILE` | 不支持的文件格式 |
| `CANVAS_UNAVAILABLE` | Canvas 2D 上下文不可用 |
| `WORKER_FAILED` | Web Worker 计算异常 |
| `SAVE_FAILED` | 图片保存失败 |
| `NO_RESULT` | 尚无计算结果 |
| `UNKNOWN` | 未知错误 |

### 9.2 错误处理机制

- `createAppError(type, detail, cause)`: 创建带 `code` 和 `cause` 的自定义 Error
- `validateImageFile(file)`: 基于扩展名和 MIME 类型验证图片文件（支持 JPG/PNG/BMP/WEBP）
- `normalizeError(error)`: 将任意异常按消息关键字映射到标准类型
- `getFriendlyError(error)`: 返回包含中文标题和描述的友好错误对象
- `formatErrorMessage(error)`: 格式化为 `{标题}：{消息}` 的用户可读字符串

所有用户可见的错误提示通过 Element Plus 的 `ElMessage.error()` 展示。

---

## 10. 测试策略

### 10.1 测试框架

使用 Vitest 作为测试运行器，支持单元测试和基准测试（benchmark）。

### 10.2 测试辅助工具

`helpers.js` 提供模拟 ImageData 的工厂函数（Node 环境无浏览器 ImageData 类）：

- `createMockImageData(width, height, pixelFactory)`: 通用像素工厂
- `createSolidImageData(width, height, r, g, b)`: 纯色图像
- `createRandomImageData(width, height)`: 随机像素图像
- `createGrayRampImageData()`: 1x256 灰度渐变条（每个灰度级恰好出现一次）
- 预定义常量: `BLACK_2x2`、`WHITE_2x2`、`RED_2x2`、`GREEN_2x2`、`BLUE_2x2`

### 10.3 测试用例覆盖

`histogramBase.test.js` 覆盖：

| 测试场景 | 验证点 |
|----------|--------|
| 纯黑图片 (0,0,0) | 灰度 = 0，所有像素落在 bin[0] |
| 纯白图片 (255,255,255) | 灰度 = 255，所有像素落在 bin[255] |
| 纯红图片 (255,0,0) | 灰度 = round(255*0.299) = 76 |
| 纯绿图片 (0,255,0) | 灰度 = round(255*0.587) = 150 |
| 纯蓝图片 (0,0,255) | 灰度 = round(255*0.114) = 29 |
| 灰度渐变条 | 每个灰度级恰好 1 个像素 |
| 1000x1000 大图 | 总像素数 = 1,000,000 |
| 0x0 空图 | 返回全 0 数组 |
| Alpha 通道忽略 | 透明红色像素灰度仍为 76 |

### 10.4 运行命令

~~~bash
npm run test          # 单元测试（watch 模式）
npm run test:run      # 单次运行
npm run bench         # 基准测试
~~~

---

## 11. 构建与部署

### 11.1 Vite 配置

项目使用 Vite 8 作为构建工具，`@vitejs/plugin-vue` 处理 `.vue` 单文件组件。通过 `@` 别名解析 `src/` 目录下的模块导入。

### 11.2 Capacitor 集成

`capacitor.config.json` 配置 Android 平台参数。项目使用以下 Capacitor 插件：

- `@capacitor/camera`: 相机拍照获取图片
- `@capacitor/filesystem`: 原生文件系统读写（保存直方图/标注原图）

### 11.3 构建产物

~~~bash
npm run build          # Web 构建到 dist/
npx cap sync           # 同步到 Android 项目
~~~

Android APK 通过 Gradle (`gradlew assembleDebug`) 构建。

---

## 12. 附录：关键文件索引

| 文件 | 职责 |
|------|------|
| `histogramBase.js` | 基准算法、归一化、ImageData 生成 |
| `histogramOpt.js` | 优化算法、Worker 调度、正确性对比 |
| `histogramBenchmark.js` | 基准测试框架、最优算法选择 |
| `pixelCalc.worker.js` | Web Worker 像素计算脚本 |
| `imagePixel.js` | 图片加载、转换、裁剪 |
| `imageExport.js` | 直方图/标注原图 PNG 导出 |
| `normalize.js` | 归一化封装、直方图统计 |
| `errorHandler.js` | 错误分类与友好提示 |
| `histogram.js` | Pinia 状态管理核心 |
| `Home.vue` | 主页：上传与算法选择 |
| `Result.vue` | 结果页：展示与对比 |
