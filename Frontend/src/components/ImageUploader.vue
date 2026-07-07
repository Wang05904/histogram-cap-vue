<template>
  <el-card shadow="hover" class="uploader-card">

    <template #header>
      <span>图片上传</span>
    </template>

    <div
        class="upload-area"
        @click="selectImage"
        @dragover.prevent
        @drop.prevent="onDrop"
    >

      <template v-if="!previewUrl">

        <el-icon :size="60">
          <Plus/>
        </el-icon>

        <p>点击上传图片</p>

        <small>
          支持 jpg png jpeg bmp webp
        </small>

      </template>

      <template v-else>

        <img
            class="preview"
            :src="previewUrl"
            alt=""
        />

      </template>

    </div>

    <div
        v-if="previewUrl"
        class="buttons"
    >

      <el-button
          type="primary"
          @click="selectImage"
      >
        更换图片
      </el-button>

      <el-button
          type="danger"
          @click="removeImage"
      >
        删除
      </el-button>

    </div>

    <input
        ref="inputRef"
        type="file"
        accept="image/*"
        hidden
        @change="onSelect"
    />

  </el-card>
</template>

<script setup lang="ts">

import {ref, onBeforeUnmount} from 'vue'

import {Plus} from '@element-plus/icons-vue'

import {ElMessage} from 'element-plus'

interface ImagePayload{

  url:string

  file:File

}

const emit=defineEmits<{

  (e:"image-selected",payload:ImagePayload):void

}>()

const inputRef=ref<HTMLInputElement>()

const previewUrl=ref("")

let currentFile:File|null=null

function selectImage(){

  inputRef.value?.click()

}

function onSelect(event:Event){

  const target=event.target as HTMLInputElement

  if(!target.files?.length){

    return

  }

  loadFile(target.files[0])

}

function onDrop(event:DragEvent){

  if(!event.dataTransfer?.files.length){

    return

  }

  loadFile(event.dataTransfer.files[0])

}

function loadFile(file:File){

  if(!file.type.startsWith("image")){

    ElMessage.error("请选择图片")

    return

  }

  if(previewUrl.value){

    URL.revokeObjectURL(previewUrl.value)

  }

  previewUrl.value=URL.createObjectURL(file)

  currentFile=file

  emit("image-selected",{

    url:previewUrl.value,

    file

  })

}

function removeImage(){

  if(previewUrl.value){

    URL.revokeObjectURL(previewUrl.value)

  }

  previewUrl.value=""

  currentFile=null

  if(inputRef.value){

    inputRef.value.value=""

  }

}

onBeforeUnmount(()=>{

  if(previewUrl.value){

    URL.revokeObjectURL(previewUrl.value)

  }

})

</script>

<style scoped>

.uploader-card{

  width:100%;

}

.upload-area{

  width:100%;

  height:320px;

  border:2px dashed #409EFF;

  border-radius:14px;

  display:flex;

  flex-direction:column;

  justify-content:center;

  align-items:center;

  cursor:pointer;

  transition:.25s;

  overflow:hidden;

}

.upload-area:hover{

  background:#ecf5ff;

}

.preview{

  width:100%;

  height:100%;

  object-fit:contain;

}

p{

  margin-top:15px;

  font-size:18px;

}

small{

  margin-top:10px;

  color:#999;

}

.buttons{

  display:flex;

  justify-content:center;

  margin-top:18px;

  gap:15px;

}

</style>