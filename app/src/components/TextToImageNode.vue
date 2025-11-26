<script setup>
import { ArrowRightIcon, PlayIcon } from '@heroicons/vue/solid'
import { Handle, Position, useVueFlow, useNodeConnections, useNodesData } from '@vue-flow/core'
import { ref, computed } from 'vue'
import { useOpenRouterStore } from '../stores/openrouter.js'

const openRouterStore = useOpenRouterStore()

const props = defineProps({
  id: {
    type: String,
    required: true,
  },
  data: {
    type: Object,
    required: true,
  }
})

const { updateNodeData, findNode, addNodes, addEdges } = useVueFlow()

// Predefined dimension presets
const dimensionPresets = [
  { label: 'Instagram Square', width: 1080, height: 1080 },
  { label: 'Instagram Portrait', width: 1080, height: 1350 },
  { label: 'Instagram Story', width: 1080, height: 1920 },
  { label: 'Facebook Post', width: 1200, height: 630 },
  { label: 'Twitter/X Post', width: 1200, height: 675 },
  { label: 'YouTube Thumbnail', width: 1280, height: 720 },
  { label: 'TikTok', width: 1080, height: 1920 },
  { label: 'LinkedIn Post', width: 1200, height: 627 },
  { label: 'Square 1:1', width: 1024, height: 1024 },
  { label: 'Landscape 16:9', width: 1024, height: 576 },
  { label: 'Portrait 9:16', width: 576, height: 1024 },
]

// Reactive data
const instruction = ref(props.data.instruction || '')
const selectedModels = ref(props.data.selectedModels || [])
const selectedDimension = ref(props.data.selectedDimension || 0)
const isGenerating = ref(false)
const statusMessages = ref([])

// Get connections to the input handle
const connections = useNodeConnections({
  handleType: 'target',
  handleId: 'input',
})

// Get data from connected source node
const connectedNodeData = useNodesData(() => connections.value[0]?.source)

// Computed property for displayed instruction (prioritizes connected data)
const displayedInstruction = computed(() => {
  return connectedNodeData.value?.data?.text || instruction.value
})

const currentDimension = computed(() => {
  return dimensionPresets[selectedDimension.value]
})

function onInstructionChange(e) {
  instruction.value = e.target.value
  updateNodeData(props.id, { 
    instruction: instruction.value,
    selectedModels: selectedModels.value,
    selectedDimension: selectedDimension.value
  })
}

function onDimensionChange(e) {
  selectedDimension.value = parseInt(e.target.value)
  updateNodeData(props.id, { 
    instruction: instruction.value,
    selectedModels: selectedModels.value,
    selectedDimension: selectedDimension.value
  })
}

async function addModel() {
  const selected = await openRouterStore.selectModels({
    multiSelect: true,
    initialFilter: ['architecture.output_modalities=image'],
  })

  if (selected) {
    onModelsSelected(selected)
  }
}

function onModelsSelected(selected) {
  let models = Array.isArray(selected) ? selected : [selected]
  
  // Avoid duplicates
  const existingIds = new Set(selectedModels.value.map(m => m.id))
  models = models.filter(m => !existingIds.has(m.id))
  
  // Append to existing
  selectedModels.value = [...selectedModels.value, ...models]
  
  updateNodeData(props.id, { 
    instruction: instruction.value,
    selectedModels: selectedModels.value,
    selectedDimension: selectedDimension.value
  })
  console.log('Models selected:', models)
}

function removeModel(model) {
  selectedModels.value = selectedModels.value.filter(m => m.id !== model.id)
  updateNodeData(props.id, { 
    instruction: instruction.value,
    selectedModels: selectedModels.value,
    selectedDimension: selectedDimension.value
  })
}

function addStatusMessage(message, type = 'info') {
  statusMessages.value.push({ message, type, timestamp: Date.now() })
}

function clearStatusMessages() {
  statusMessages.value = []
}

async function runGeneration() {
  if (selectedModels.value.length === 0) {
    alert('Please select at least one model first')
    return
  }

  if (!displayedInstruction.value.trim()) {
    alert('Please provide a creative instruction')
    return
  }

  const currentNode = findNode(props.id)
  if (!currentNode) return

  isGenerating.value = true
  clearStatusMessages()

  const baseX = currentNode.position.x + 400
  const baseY = currentNode.position.y
  const ySpacing = 250

  const promises = selectedModels.value.map(async (model, index) => {
    try {
      addStatusMessage(`Starting generation with ${model.name}...`, 'info')
      
      // Generate image (don't create node yet, wait for result)
      const result = await openRouterStore.generateImage(
        model.id,
        displayedInstruction.value,
        {
          max_tokens: 2048,
        }
      )

      if (result.images && result.images.length > 0) {
        // NOW create the image node with the actual data
        const newNodeId = `gen-${props.id}-${model.id}-${Date.now()}`
        const imageUrl = result.images[0]
        
        const newNode = {
          id: newNodeId,
          type: 'image-node',
          position: { x: baseX, y: baseY + (index * ySpacing) },
          data: { 
            imageSrc: imageUrl,
            imageName: `${model.name} - ${currentDimension.value.label}` 
          }
        }
        
        addNodes([newNode])

        // Add edge from this node to new node
        addEdges([{ 
          id: `e-${props.id}-${newNodeId}`,
          source: props.id,
          sourceHandle: 'output',
          target: newNodeId,
          targetHandle: 'input',
          animated: true 
        }])

        addStatusMessage(`✓ ${model.name} completed successfully`, 'success')
        console.log(`Image generated for ${model.name}`)
      } else {
        throw new Error('No image was generated')
      }
    } catch (err) {
      console.error(`Error generating for ${model.name}:`, err)
      addStatusMessage(`✗ ${model.name} failed: ${err.message}`, 'error')
    }
  })

  await Promise.all(promises)
  isGenerating.value = false
  
  // Clear status messages after 5 seconds
  setTimeout(() => {
    clearStatusMessages()
  }, 5000)
}
</script>

<template>
  <div class="max-w-[280px] textToImageNode">
    <div class="mb-2.5 font-bold">Text To Image Node</div>
    <div class="nodrag nopan flex flex-col gap-3">
      <!-- Input handle on the left -->
      <Handle 
        id="input" 
        class="textHandle"
        type="target" 
        :position="Position.Left"
      >
        <ArrowRightIcon class="w-4 h-4" />
      </Handle>

      <div class="relative">
        <label class="block text-xs text-gray-700 mb-1 text-left">Creative instruction</label>
        <textarea
          :value="displayedInstruction"
          placeholder="Describe the image you want to generate..."
          @input="onInstructionChange"
          :disabled="isGenerating"
          class="w-full min-h-[60px] p-2 border border-gray-300 rounded resize-y font-inherit text-xs disabled:bg-gray-100 disabled:cursor-not-allowed"
        ></textarea>
      </div>

      <!-- Dimension selector -->
      <div class="relative">
        <label class="block text-xs text-gray-700 mb-1 text-left">Image Dimensions</label>
        <select
          :value="selectedDimension"
          @change="onDimensionChange"
          :disabled="isGenerating"
          class="w-full p-2 border border-gray-300 rounded text-xs bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
        >
          <option 
            v-for="(preset, index) in dimensionPresets" 
            :key="index"
            :value="index"
          >
            {{ preset.label }} ({{ preset.width }}x{{ preset.height }})
          </option>
        </select>
      </div>

      <div class="relative">
        <label class="block text-xs text-gray-700 mb-1 text-left">Select AI Model(s)</label>
        <div class="flex flex-col gap-2">
          <button 
            @click="addModel" 
            :disabled="isGenerating"
            class="bg-blue-500 hover:bg-blue-700 text-white px-4 py-2 rounded font-medium text-sm disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            + Add model(s)
          </button>
        </div>

        <!-- Models pills display -->
        <div 
          v-if="selectedModels.length > 0"
          class="flex flex-wrap gap-2 mt-2"
        >
          <div 
            v-for="model in selectedModels" 
            :key="model.id"
            class="bg-gray-200 text-gray-700 px-2 py-1 rounded-full text-xs inline-flex items-center gap-2"
          >
            <span class="max-w-[180px] truncate" :title="model.name">
              {{ model.name }}
            </span>
            <button
              @click="removeModel(model)"
              :disabled="isGenerating"
              class="hover:bg-gray-300 rounded-full w-4 h-4 flex items-center justify-center transition-colors flex-shrink-0 ml-1 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Remove model"
            >
              <span class="text-xs leading-none font-bold">&times;</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Run button -->
      <button 
        @click="runGeneration" 
        class="bg-green-500 hover:bg-green-700 text-white px-4 py-2 rounded font-medium text-sm flex items-center justify-center gap-2 transition-all disabled:bg-gray-400 disabled:cursor-not-allowed"
        :disabled="selectedModels.length === 0 || isGenerating"
      >
        <!-- Spinner when generating -->
        <svg 
          v-if="isGenerating"
          class="animate-spin h-4 w-4 text-white" 
          xmlns="http://www.w3.org/2000/svg" 
          fill="none" 
          viewBox="0 0 24 24"
        >
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <PlayIcon v-else class="w-3 h-3" />
        {{ isGenerating ? 'Generating...' : 'Generate' }}
      </button>

      <!-- Status Messages -->
      <div 
        v-if="statusMessages.length > 0"
        class="flex flex-col gap-1 mt-2 max-h-32 overflow-y-auto"
      >
        <div 
          v-for="(status, idx) in statusMessages" 
          :key="idx"
          class="text-xs p-2 rounded"
          :class="{
            'bg-blue-50 text-blue-700': status.type === 'info',
            'bg-green-50 text-green-700': status.type === 'success',
            'bg-red-50 text-red-700': status.type === 'error'
          }"
        >
          {{ status.message }}
        </div>
      </div>

      <!-- Output handle on the right -->
      <Handle 
        id="output" 
        type="source" 
        :position="Position.Right"
        class="imageHandle"
      >
        <ArrowRightIcon class="w-4 h-4" />
      </Handle>
    </div>
  </div>
</template>