<script setup>
import { ArrowRightIcon } from '@heroicons/vue/solid';
import { Handle, Position, useNodeConnections, useNodesData } from '@vue-flow/core'
import { marked } from 'marked';

const connections = useNodeConnections({
  handleType: 'target',
})

const nodesData = useNodesData(() => connections.value[0]?.source)
</script>

<template>
  <div class="markdownNode">
    <div>Markdown Viewer</div>
    <div class="nodrag nopan text-viewer" style="background-color: #fff; border-radius: 5px; padding: 5px;">
      <Handle
        type="target"
        :position="Position.Left"
      >
        <ArrowRightIcon />
      </Handle>
      <div style="text-transform: none;" v-html="marked.parse(nodesData?.data?.text || 'Connect a text output to see text here')"></div>
    </div>
    </div>
</template>