<script setup>
import { Handle, Position, useNodeConnections, useNodesData } from '@vue-flow/core'
import { marked } from 'marked';

const connections = useNodeConnections({
  handleType: 'target',
})

const nodesData = useNodesData(() => connections.value[0]?.source)
</script>

<template>
  <div>Markdown Viewer</div>
  <div class="nodrag nopan text-viewer" style="background-color: #fff; border-radius: 5px; padding: 5px;">
    <Handle
      type="target"
      :position="Position.Left"
      :style="{ backgroundColor: '#0F0' }"
    />
    <div style="text-transform: none;" v-html="marked.parse(nodesData?.data?.text || 'Connect a text output to see text here')"></div>
  </div>
</template>