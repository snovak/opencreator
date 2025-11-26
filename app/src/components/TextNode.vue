<script setup>
import { ArrowRightIcon } from '@heroicons/vue/solid'
import { Handle, Position, useVueFlow } from '@vue-flow/core'
import { ref, nextTick } from 'vue'

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

const isEditingTitle = ref(false)
const tempTitle = ref('')

function editTitle() {
  tempTitle.value = props.data.title || 'Text Node'
  isEditingTitle.value = true
  nextTick(() => {
    inputRef.value?.focus()
    inputRef.value?.select()
  })
}

function saveTitle() {
  const newTitle = tempTitle.value.trim()
  updateNodeData(props.id, {
    text: props.data.text || '',
    title: newTitle || 'Text Node'
  })
  isEditingTitle.value = false
}

function onTextChange(e) {
  updateNodeData(props.id, {
    text: e.target.value,
    title: props.data.title
  })
}

const inputRef = ref(null)
</script>

<template>
  <div class="max-w-[280px] textNode">
    <div class="mb-3">
      <input
        v-if="isEditingTitle"
        ref="inputRef"
        :value="tempTitle"
        @input="tempTitle = $event.target.value"
        @blur="saveTitle"
        @keyup.enter="saveTitle"
        @keyup.escape="isEditingTitle = false"
        class="w-full font-bold text-lg px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm"
      />
      <div
        v-else
        @click="editTitle"
        class="font-bold text-lg px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors select-none border border-transparent hover:border-gray-300"
        title="Click to edit title"
      >
        {{ props.data.title || 'Text Node' }}
      </div>
    </div>
    <div class="nodrag nopan flex flex-col gap-3">
      <textarea
        :value="props.data.text || ''"
        placeholder="Enter your text here..."
        @input="onTextChange"
        class="w-full min-h-[120px] p-3 border border-gray-300 rounded-lg resize-vertical font-inherit text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
      ></textarea>

      <Handle id="input" type="target" :position="Position.Left">
        <ArrowRightIcon class="w-4 h-4" />
      </Handle>

      <Handle id="output" type="source" :position="Position.Right">
        <ArrowRightIcon class="w-4 h-4" />
      </Handle>
    </div>
  </div>
</template>