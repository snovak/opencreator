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

// Reactive data
const instruction = ref(props.data.instruction || '')
const selectedModels = ref(props.data.selectedModels || [])

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

function onInstructionChange(e) {
  instruction.value = e.target.value
  updateNodeData(props.id, { 
    instruction: instruction.value,
    selectedModels: selectedModels.value
  })
}

async function addModel() {
  const selected = await openRouterStore.selectModels({
    multiSelect: true,
    initialFilter: ['architecture.output_modalities=text'],
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
    selectedModels: selectedModels.value
  })
  console.log('Models selected:', models)
}

function removeModel(model) {
  selectedModels.value = selectedModels.value.filter(m => m.id !== model.id)
  updateNodeData(props.id, { 
    instruction: instruction.value,
    selectedModels: selectedModels.value
  })
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

  const baseX = currentNode.position.x + 400
  const baseY = currentNode.position.y
  const ySpacing = 200

  const promises = selectedModels.value.map(async (model, index) => {
    try {
      // Create new text node
      const newNodeId = `gen-${props.id}-${model.id}-${Date.now()}`
      const newNode = {
        id: newNodeId,
        type: 'text-output',
        position: { x: baseX, y: baseY + (index * ySpacing) },
        data: { title: model.name, text: '' }
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

      // Generate with streaming
      await openRouterStore.generateText(
        model.id,
        displayedInstruction.value,
        { stream: true },
        (delta, fullText) => {
          updateNodeData(newNodeId, { text: fullText, title: model.name })
        }
      )
    } catch (err) {
      console.error(`Error generating for ${model.name}:`, err)
      alert(`Error generating for ${model.name}: ${err.message}`)
    }
  })

  await Promise.all(promises)
}
</script>

<template>
  <div class="max-w-[280px] textToTextNode">
    <div class="mb-2.5 font-bold">Text To Text Node</div>
    <div class="nodrag nopan flex flex-col gap-3">
      <!-- Input handle on the left -->
      <Handle 
        id="input" 
        type="target" 
        :position="Position.Left"
      >
        <ArrowRightIcon class="w-4 h-4" />
      </Handle>

      <div class="relative">
        <label class="block text-xs text-gray-700 mb-1 text-left">Creative instruction</label>
        <textarea
          :value="displayedInstruction"
          placeholder="Enter your creative instruction here..."
          @input="onInstructionChange"
          class="w-full min-h-[60px] p-2 border border-gray-300 rounded resize-y font-inherit text-xs"
        ></textarea>
      </div>

      <div class="relative">
        <label class="block text-xs text-gray-700 mb-1 text-left">Select AI Model(s)</label>
        <div class="flex flex-col gap-2">
          <button 
            @click="addModel" 
            class="bg-blue-500 hover:bg-blue-700 text-white px-4 py-2 rounded font-medium text-sm"
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
              class="hover:bg-gray-300 rounded-full w-4 h-4 flex items-center justify-center transition-colors flex-shrink-0 ml-1"
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
        class="bg-green-500 hover:bg-green-700 text-white px-4 py-2 rounded font-medium text-sm flex items-center justify-center gap-2 transition-all"
        :disabled="selectedModels.length === 0"
        :class="{ 'opacity-50 cursor-not-allowed': selectedModels.length === 0 }"
      >
        <PlayIcon class="w-3 h-3" />
        Run
      </button>

      <!-- Output handle on the right -->
      <Handle 
        id="output" 
        type="source" 
        :position="Position.Right"
      >
        <ArrowRightIcon class="w-4 h-4" />
      </Handle>
    </div>
  </div>
</template>