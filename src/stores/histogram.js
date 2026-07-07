import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { ElMessage } from 'element-plus'

import { fileToImageData } from '@/utils/imagePixel.js'
import { getHistogramStats } from '@/utils/normalize.js'
import {
  benchmarkHistogramAlgorithms,
  compareHistogramBins,
  runBaseHistogram,
  runOptimizedHistogram
} from '@/utils/histogramOpt.js'

const ALGORITHM_OPTIONS = [
  {
    key: 'autoExact',
    label: '自动最快（精确）',
    description: '先测试当前图片，再从与基准完全一致的组合中选择耗时最短者。',
    auto: 'exact'
  },
  {
    key: 'fastest',
    label: '默认精确',
    description: '固定组合：精确灰度、循环展开、TypedArray、主线程。',
    config: {
      grayMode: 'floatGray',
      grayStrategy: 'directGray',
      loopMode: 'unroll4',
      dataMode: 'histTypedArray',
      threadMode: 'mainThread'
    }
  },
  {
    key: 'baseline',
    label: '基准算法',
    description: '使用标准浮点灰度公式的参考结果，用于校验正确性。',
    config: {
      grayMode: 'floatGray',
      grayStrategy: 'directGray',
      loopMode: 'normalLoop',
      dataMode: 'histTypedArray',
      threadMode: 'mainThread',
      base: true
    }
  },
  {
    key: 'worker',
    label: '单 Worker',
    description: '在一个 WebWorker 中执行精确灰度统计。',
    config: {
      grayMode: 'floatGray',
      grayStrategy: 'directGray',
      loopMode: 'unroll4',
      dataMode: 'histTypedArray',
      threadMode: 'singleWorker'
    }
  },
  {
    key: 'chunkWorker',
    label: '分块 Worker',
    description: '在一个 WebWorker 内部分块执行精确灰度统计。',
    config: {
      grayMode: 'floatGray',
      grayStrategy: 'directGray',
      loopMode: 'unroll4',
      dataMode: 'histTypedArray',
      threadMode: 'chunkWorker',
      chunkSize: 262144
    }
  },
  {
    key: 'multiWorker',
    label: '多 Worker',
    description: '按硬件并发能力拆分任务，多 Worker 合并 256 个 bin。',
    config: {
      grayMode: 'floatGray',
      grayStrategy: 'directGray',
      loopMode: 'unroll4',
      dataMode: 'histTypedArray',
      threadMode: 'fixed2Worker',
      workerCount: 2
    }
  }
]

function emptyTiming() {
  return {
    computeMs: 0,
    normalizeMs: 0,
    dataGenerateMs: 0,
    renderMs: 0,
    algorithmTotalMs: 0,
    totalMs: 0
  }
}

function describeConfig(config = {}) {
  if (config.base) {
    return '基准算法 / 精确灰度 / 普通循环 / TypedArray / 主线程'
  }

  const threadMap = {
    mainThread: '主线程',
    singleWorker: '单 Worker',
    chunkWorker: '分块 Worker',
    multiWorker: '多 Worker',
    fixed2Worker: '固定 2 Worker',
    fixed4Worker: '固定 4 Worker'
  }
  const grayStrategyMap = {
    directGray: '直接公式',
    lookupGray: '精确查表'
  }
  const loopMap = {
    normalLoop: '普通循环',
    skipAlpha: '跳过 Alpha',
    unrolledLoop: '展开 4 像素',
    unroll2: '展开 2 像素',
    unroll4: '展开 4 像素',
    unroll8: '展开 8 像素'
  }
  const dataMap = {
    histArray: '普通数组',
    histTypedArray: 'TypedArray'
  }

  return [
    threadMap[config.threadMode] || config.threadMode,
    '精确灰度',
    grayStrategyMap[config.grayStrategy || 'directGray'],
    loopMap[config.loopMode] || config.loopMode,
    dataMap[config.dataMode] || config.dataMode,
    config.chunkSize ? `分块 ${Math.round(config.chunkSize / 1024)}KB` : '',
    config.workerCount ? `${config.workerCount} 个 Worker` : '',
    config.includeImageData ? '生成 ImageData' : ''
  ].filter(Boolean).join(' / ')
}

function formatResult(result, baselineBins, renderMs = 0) {
  const timing = {
    computeMs: result.timing.computeMs || 0,
    normalizeMs: result.timing.normalizeMs || 0,
    dataGenerateMs: result.timing.dataGenerateMs || 0,
    renderMs,
    algorithmTotalMs: result.timing.totalMs || 0,
    totalMs: Number(((result.timing.totalMs || 0) + renderMs).toFixed(3))
  }

  return {
    timing,
    accuracy: compareHistogramBins(result.bins, baselineBins),
    normalizedBins: Array.from(result.normalizedBins),
    bins: Array.from(result.bins),
    histogramImageData: result.histogramImageData || null
  }
}

export const useHistogramStore = defineStore('histogram', () => {
  const imageUrl = ref('')
  const imageFile = ref(null)
  const imageName = ref('')
  const imageData = ref(null)

  const imageWidth = ref(0)
  const imageHeight = ref(0)
  const pixelCount = ref(0)

  const algorithm = ref('autoExact')
  const algorithmName = ref('')
  const algorithmConfig = ref(null)

  const loading = ref(false)
  const benchmarkLoading = ref(false)

  const bins = ref(new Array(256).fill(0))
  const histogram = ref(new Array(256).fill(0))
  const histogramImageData = ref(null)
  const timing = ref(emptyTiming())
  const accuracy = ref({
    sameAsBaseline: false,
    withinTolerance: false,
    maxBinDiff: 0,
    totalDiff: 0
  })

  const peakGray = ref(0)
  const peakCount = ref(0)
  const benchmarkRows = ref([])

  const algorithmOptions = ALGORITHM_OPTIONS

  const selectedAlgorithm = computed(() => {
    return ALGORITHM_OPTIONS.find((item) => item.key === algorithm.value) || ALGORITHM_OPTIONS[0]
  })

  const passed300ms = computed(() => timing.value.totalMs > 0 && timing.value.totalMs < 300)
  const costTime = computed(() => timing.value.totalMs)

  function revokeCurrentUrl() {
    if (imageUrl.value) {
      URL.revokeObjectURL(imageUrl.value)
    }
  }

  function clearResult() {
    imageData.value = null
    imageWidth.value = 0
    imageHeight.value = 0
    pixelCount.value = 0
    bins.value = new Array(256).fill(0)
    histogram.value = new Array(256).fill(0)
    histogramImageData.value = null
    timing.value = emptyTiming()
    accuracy.value = {
      sameAsBaseline: false,
      withinTolerance: false,
      maxBinDiff: 0,
      totalDiff: 0
    }
    peakGray.value = 0
    peakCount.value = 0
    algorithmName.value = ''
    algorithmConfig.value = null
    benchmarkRows.value = []
  }

  function setImage(payload) {
    revokeCurrentUrl()
    imageUrl.value = payload.url
    imageFile.value = payload.file
    imageName.value = payload.file?.name || '当前图片'
    clearResult()
  }

  function removeImage() {
    revokeCurrentUrl()
    imageUrl.value = ''
    imageFile.value = null
    imageName.value = ''
    clearResult()
  }

  function setAlgorithm(value) {
    algorithm.value = value
  }

  async function ensureImageData() {
    if (imageData.value) {
      return imageData.value
    }

    if (!imageFile.value) {
      throw new Error('请先上传图片')
    }

    const loaded = await fileToImageData(imageFile.value)
    imageData.value = loaded.imageData
    imageWidth.value = loaded.width
    imageHeight.value = loaded.height
    pixelCount.value = loaded.width * loaded.height

    return loaded.imageData
  }

  async function runBenchmarkRows(currentImageData, runs = 5) {
    const rows = await benchmarkHistogramAlgorithms(
      [
        {
          name: imageName.value || '当前图片',
          imageData: currentImageData
        }
      ],
      { runs }
    )

    const displayRows = rows.map((row) => ({
      ...row,
      displayName: describeConfig(row.config)
    }))

    benchmarkRows.value = displayRows
    return displayRows
  }

  function chooseFastestForImage(rows, allowApproximate = false) {
    const candidates = rows
      .filter((row) => !row.config?.benchmarkOnly)
      .filter((row) => allowApproximate || row.sameAsBaseline)
      .sort((a, b) => a.averageMs - b.averageMs)

    return candidates[0] || null
  }

  async function startAnalysis() {
    if (!imageFile.value) {
      ElMessage.warning('请先上传图片')
      return false
    }

    loading.value = true

    try {
      const currentImageData = await ensureImageData()
      const baseline = runBaseHistogram(currentImageData)
      const selected = selectedAlgorithm.value
      let selectedConfig = selected.config
      let selectedName = ''

      if (selected.auto) {
        const rows = await runBenchmarkRows(currentImageData, 5)
        const best = chooseFastestForImage(rows, false)

        if (!best) {
          throw new Error('未找到可用算法组合')
        }

        selectedConfig = best.config
        selectedName = '自动选择：' + describeConfig(best.config)
      }

      const result = selectedConfig.base
        ? runBaseHistogram(currentImageData, { includeImageData: true })
        : await runOptimizedHistogram(currentImageData, {
            ...selectedConfig,
            includeImageData: true
          })

      const formatted = formatResult(result, baseline.bins, 0)
      const stats = getHistogramStats(formatted.bins)

      bins.value = formatted.bins
      histogram.value = formatted.normalizedBins
      histogramImageData.value = formatted.histogramImageData
      timing.value = formatted.timing
      accuracy.value = formatted.accuracy
      peakGray.value = stats.peakGray
      peakCount.value = stats.peakCount
      algorithmName.value = selectedName || describeConfig(selectedConfig)
      algorithmConfig.value = { ...selectedConfig }

      ElMessage.success(selected.auto ? '已自动选择当前图片最快组合' : '直方图生成完成')
      return true
    } catch (error) {
      console.error(error)
      ElMessage.error('直方图生成失败')
      clearResult()
      return false
    } finally {
      loading.value = false
    }
  }

  function setRenderTime(renderMs) {
    timing.value = {
      ...timing.value,
      renderMs,
      totalMs: Number((timing.value.algorithmTotalMs + renderMs).toFixed(3))
    }
  }

  async function runBenchmark() {
    if (!imageFile.value) {
      ElMessage.warning('请先上传图片')
      return []
    }

    benchmarkLoading.value = true

    try {
      const currentImageData = await ensureImageData()
      const rows = await runBenchmarkRows(currentImageData, 5)

      ElMessage.success('性能对比完成')
      return rows
    } catch (error) {
      console.error(error)
      ElMessage.error('性能对比失败')
      return []
    } finally {
      benchmarkLoading.value = false
    }
  }

  return {
    accuracy,
    algorithm,
    algorithmConfig,
    algorithmName,
    algorithmOptions,
    benchmarkLoading,
    benchmarkRows,
    bins,
    costTime,
    histogram,
    histogramImageData,
    imageData,
    imageFile,
    imageHeight,
    imageName,
    imageUrl,
    imageWidth,
    loading,
    passed300ms,
    peakCount,
    peakGray,
    pixelCount,
    selectedAlgorithm,
    timing,
    removeImage,
    runBenchmark,
    setAlgorithm,
    setImage,
    setRenderTime,
    startAnalysis
  }
})
