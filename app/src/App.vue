<script setup>
import { ref, toRef, onMounted } from 'vue'
import { MiniMap } from '@vue-flow/minimap'
import { Position, VueFlow, addEdge, useVueFlow } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import TextOutputNode from './components/TextNode.vue'
import TextViewerNode from './components/MarkdownViewerNode.vue'
import ImageNode from './components/ImageNode.vue'
import TextToTextNode from './components/TextToTextNode.vue'
import NodeMenu from './components/NodeMenu.vue'
import SelectModel from './components/SelectModel.vue'
import TextToImageNode from './components/TextToImageNode.vue'


const nodes = ref([
  {
    id: '1',
    type: 'text-output',
    data: { 
      text: 'Generate an image of Tux, the Linux mascot, wearing a space suit.',
      title: 'Sample Text'
    },
    position: { x: 0, y: 200 },
  },
  {
    id: '2',
    type: 'text-viewer',
    position: { x: 350, y: 50 },
    targetPosition: Position.Left,
  },
  {
    id: '3',
    type: 'textToImage',
    position: { x: 350, y: 250 },
    targetPosition: Position.Left,
  },
])

const edges = ref([
  {
    id: 'e1a-2',
    source: '1',
    sourceHandle: 'output',
    target: '2',
    animated: true,
  },
  {
    id: 'e1a-3',
    source: '1',
    sourceHandle: 'output',
    targetHandle: 'input',
    target: '3',
    animated: true,
  },
])

const { removeEdges } = useVueFlow()
const selectedEdges = ref([])

function onSelectionChange({ edges: selected }) {
  selectedEdges.value = selected
  console.log('Selected edges:', selected)
}

function onConnect(params) {
  console.log('Connection attempt:', params)
  edges.value = addEdge({ ...params, animated: true }, edges.value)
  console.log('Edge added successfully:', edges.value[edges.value.length - 1])
}

onMounted(() => {
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Delete' && selectedEdges.value.length > 0) {
      const edgeIds = selectedEdges.value.map((edge) => edge.id)
      removeEdges(edgeIds)
      console.log('Deleted edges:', edgeIds)
      selectedEdges.value = []
    }
  })
})

function nodeStroke(n) {
  switch (n.type) {
    case 'text-output':
      return '#0F0'
    case 'text-viewer':
      return '#0F0'
    case 'image-node':
      return '#00F'
    case 'textToText':
      return '#0F0'
    case 'textToImage':
      return '#00F'
    default:
      return '#eee'
  }
}

function nodeColor(n) {
  return '#fff'
}
</script>

<template>
  <VueFlow
    v-model:nodes="nodes"
    v-model:edges="edges"
    class="custom-node-flow"
    fit-view-on-init
    @connect="onConnect"
    @selection-change="onSelectionChange" 
    :selection-key-code="['Shift']"
  >
    <template #node-text-output="props">
      <TextOutputNode 
        :id="props.id" 
        :data="props.data" 
      />
    </template>

    <template #node-text-viewer>
      <TextViewerNode />
    </template>

    <template #node-image-node="props">
      <ImageNode 
        :id="props.id" 
        :data="props.data" 
      />
    </template>

    <template #node-textToText="props">
      <TextToTextNode 
        :id="props.id" 
        :data="props.data" 
      />
    </template>
    
    <template #node-textToImage="props">
      <TextToImageNode 
        :id="props.id" 
        :data="props.data" 
      />
    </template>

    <MiniMap :node-stroke-color="nodeStroke" :node-color="nodeColor" />
    <Controls />
    <Background />
    <NodeMenu />
    
    <!-- Global Model Selector -->
    <SelectModel />
  </VueFlow>
</template>