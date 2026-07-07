import { defineStore } from 'pinia'
import { ref } from 'vue'
import { ElMessage } from 'element-plus'

import {
    computeHistogram,
    normalizeHistogram,
    getHistogramStats
} from '@/utils/normalize'

export const useHistogramStore = defineStore('histogram', () => {

    /**
     * 当前图片
     */
    const imageUrl = ref('')
    const imageFile = ref(null)

    /**
     * 图片尺寸
     */
    const imageWidth = ref(0)
    const imageHeight = ref(0)

    /**
     * 算法
     */
    const algorithm = ref('realtime')

    /**
     * 是否统计中
     */
    const loading = ref(false)

    /**
     * 统计结果
     */
    const histogram = ref(new Array(256).fill(0))

    const costTime = ref(0)

    const pixelCount = ref(0)

    const peakGray = ref(0)

    const peakCount = ref(0)

    /**
     * 上传图片
     */
    function setImage(payload) {

        imageUrl.value = payload.url

        imageFile.value = payload.file

        reset()

    }

    /**
     * 重置统计数据
     */
    function reset() {

        histogram.value = new Array(256).fill(0)

        costTime.value = 0

        pixelCount.value = 0

        peakGray.value = 0

        peakCount.value = 0

        imageWidth.value = 0

        imageHeight.value = 0

    }

    /**
     * 开始统计
     */
    async function startAnalysis() {

        if (!imageUrl.value) {

            ElMessage.warning('请先上传图片')

            return false

        }

        loading.value = true

        const startTime = performance.now()

        try {

            //--------------------------------
            // 加载图片
            //--------------------------------

            const img = new Image()

            img.src = imageUrl.value

            await new Promise((resolve, reject) => {

                img.onload = resolve

                img.onerror = reject

            })

            //--------------------------------
            // Canvas
            //--------------------------------

            const canvas = document.createElement('canvas')

            canvas.width = img.width

            canvas.height = img.height

            const ctx = canvas.getContext('2d')

            if (!ctx) {

                throw new Error('Canvas初始化失败')

            }

            ctx.drawImage(img, 0, 0)

            const imageData = ctx.getImageData(
                0,
                0,
                img.width,
                img.height
            )

            //--------------------------------
            // Histogram
            //--------------------------------

            const rawHistogram = computeHistogram(
                imageData,
                algorithm.value
            )

            histogram.value =
                normalizeHistogram(rawHistogram)

            //--------------------------------
            // 图片信息
            //--------------------------------

            imageWidth.value = img.width

            imageHeight.value = img.height

            pixelCount.value =
                img.width * img.height

            //--------------------------------
            // 峰值
            //--------------------------------

            const stats =
                getHistogramStats(rawHistogram)

            peakGray.value = stats.peakGray

            peakCount.value = stats.peakCount

            //--------------------------------
            // 时间
            //--------------------------------

            costTime.value = Number(
                (
                    performance.now() -
                    startTime
                ).toFixed(2)
            )

            ElMessage.success('统计完成')

            return true

        } catch (err) {

            console.error(err)

            ElMessage.error('统计失败')

            reset()

            return false

        } finally {

            loading.value = false

        }

    }

    return {

        imageUrl,

        imageFile,

        imageWidth,

        imageHeight,

        algorithm,

        loading,

        histogram,

        costTime,

        pixelCount,

        peakGray,

        peakCount,

        setImage,

        startAnalysis,

        reset

    }

})