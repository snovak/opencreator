<script setup>
import { ref, toRef, onMounted } from 'vue'
import { MiniMap } from '@vue-flow/minimap'
import { Position, VueFlow, addEdge, useVueFlow } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import TextOutputNode from './components/TextNode.vue'
import TextViewerNode from './components/MarkdownViewerNode.vue'
import ImageNode from './components/ImageNode.vue'
import NodeMenu from './components/NodeMenu.vue'

const nodes = ref([
  {
    id: '1',
    type: 'text-output',
    data: { text: '# Hi👋🏻 \nThis is a test' },
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
    type: 'text-viewer',
    position: { x: 350, y: 250 },
    targetPosition: Position.Left,
  },
])

const edges = ref([
  {
    id: 'e1a-2',
    source: '1',
    sourceHandle: 'a',
    target: '2',
    animated: true,
  },
  {
    id: 'e1a-3',
    source: '1',
    sourceHandle: 'a',
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
      return '#0041d0'
    case 'text-viewer':
      return '#ff0072'
    case 'image-node':
      return '#ff9900'
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
      <TextOutputNode :id="props.id" :data="props.data" />
    </template>

    <template #node-text-viewer>
      <TextViewerNode />
    </template>

    <template #node-image-node="props">
      <ImageNode :id="props.id" :data="props.data" />
    </template>

    <MiniMap :node-stroke-color="nodeStroke" :node-color="nodeColor" />
    <Controls />
    <Background />
    <NodeMenu />
  </VueFlow>
</template>