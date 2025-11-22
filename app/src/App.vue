<script setup>
import { ref, toRef } from 'vue'
import { MiniMap } from '@vue-flow/minimap'
import { Position, VueFlow } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import TextOutputNode from './components/TextNode.vue'
import TextViewerNode from './components/MarkdownViewerNode.vue'

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

// minimap stroke color functions (simplified for text nodes)
function nodeStroke(n) {
  switch (n.type) {
    case 'text-output':
      return '#0041d0'
    case 'text-viewer':
      return '#ff0072'
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
    :edges="edges"
    class="custom-node-flow"
    fit-view-on-init
  >
    <template #node-text-output="props">
      <TextOutputNode :id="props.id" :data="props.data" />
    </template>

    <template #node-text-viewer>
      <TextViewerNode />
    </template>

    <MiniMap :node-stroke-color="nodeStroke" :node-color="nodeColor" />
    <Controls />
    <Background />
  </VueFlow>
</template>