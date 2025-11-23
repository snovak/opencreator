<script setup>
import { Handle, Position, useVueFlow, useNodeConnections, useNodesData } from '@vue-flow/core'
import { ref, computed, watch } from 'vue'
import { ArrowRightIcon } from '@heroicons/vue/solid'

const props = defineProps({
  id: {
    type: String,
    required: true,
  },
  data: {
    type: Object,
    required: true,
  },
})

const { updateNodeData } = useVueFlow()

// Get connections to the input handle
const connections = useNodeConnections({
  handleType: 'target',
  handleId: 'input',
})

// Get data from connected source node
const connectedNodeData = useNodesData(() => connections.value[0]?.source)

// Reactive refs for local image data
const localImageSrc = ref(props.data.imageSrc || '')
const localImageName = ref(props.data.imageName || '')

// Computed property for displayed image (prioritizes connected data over local)
const displayedImageSrc = computed(() => {
  return connectedNodeData.value?.data?.imageSrc || localImageSrc.value
})

const displayedImageName = computed(() => {
  return connectedNodeData.value?.data?.imageName || localImageName.value
})

// Watch for changes in connected data and update node data
watch([connectedNodeData, localImageSrc, localImageName], () => {
  updateNodeData(props.id, { 
    imageSrc: displayedImageSrc.value,
    imageName: displayedImageName.value
  })
})

function loadImage() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'
  input.onchange = (e) => {
    const file = e.target.files[0]
    if (file) {
      localImageSrc.value = URL.createObjectURL(file)
      localImageName.value = file.name
      // This will trigger the watcher and update node data
    }
  }
  input.click()
}

function clearImage() {
  if (localImageSrc.value) {
    URL.revokeObjectURL(localImageSrc.value)
  }
  localImageSrc.value = ''
  localImageName.value = ''
  // This will trigger the watcher and update node data
}
</script>

<template>
  <div class="imageNode">
    <div class="node-header">Image Node</div>
    <div class="nodrag nopan image-content">
      <Handle 
        id="input" 
        type="target" 
        :position="Position.Left"
      > 
       <ArrowRightIcon class="handleIcon"/>
      </Handle>
      
      <div v-if="displayedImageSrc" class="image-preview">
        <img :src="displayedImageSrc" :alt="displayedImageName" class="preview-image" />
        <div class="image-name">{{ displayedImageName }}</div>
        <button 
          @click="clearImage" 
          class="clear-btn"
          v-if="!connectedNodeData" 
        >
          Clear
        </button>
        <div v-else class="connection-info">
          Connected to: {{ connectedNodeData?.id }}
        </div>
      </div>
      
      <div v-else class="image-upload">
        <button @click="loadImage" class="load-btn">Load Image</button>
      </div>

      <Handle 
        id="output" 
        type="source" 
        :position="Position.Right"
      >
        <ArrowRightIcon class="handleIcon"/>
      </Handle>
    </div>
  </div>
</template>

<style scoped>
.image-node {
  max-width: 250px;
}



.image-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.preview-image {
  max-width: 200px;
  max-height: 150px;
  border-radius: 5px;
  border: 1px solid #ddd;
}

.image-name {
  font-size: 12px;
  color: #666;
  word-break: break-all;
  text-align: center;
}

.connection-info {
  font-size: 10px;
  color: #888;
  font-style: italic;
}

.load-btn, .clear-btn {
  background: #007e00;
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.load-btn:hover, .clear-btn:hover {
  background: #006600;
}

.clear-btn {
  background: #ff4444;
}

.clear-btn:hover {
  background: #cc0000;
}
</style>