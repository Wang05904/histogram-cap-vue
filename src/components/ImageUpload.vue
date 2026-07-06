<template>
    <n-button type="primary" @click="selectImage">上传相册图片</n-button>
  </template>
  <script setup>
  import { Camera, CameraResultType } from '@capacitor/camera'
  const emit = defineEmits(['select'])
  
  const selectImage = async () => {
    const image = await Camera.getPicture({
      source: 'photos',
      resultType: CameraResultType.Uri
    })
    emit('select', image.webPath)
  }
  </script>