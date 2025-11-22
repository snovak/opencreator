<script setup>
import { Handle, Position, useVueFlow } from '@vue-flow/core'

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

function onTextChange(e) {
  updateNodeData(props.id, { text: e.target.value })
}
</script>

<template>
  <div>Text Node</div>
  <div class="nodrag nopan">

    <textarea
      :value="data.text || ''"
      placeholder="Enter your text here..."
      @input="onTextChange"
    ></textarea>
    <div class="text-output">
    </div>

    <Handle id="a" type="source" :position="Position.Right" />
  </div>
</template>