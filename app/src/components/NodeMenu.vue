<template>
  <div id="menu">
    <div @click="toggleMenu" class="icon-wrapper">
      <PlusIcon class="icon" />
    </div>
    <div v-if="isMenuOpen" class="dropdown">
      <button @click.stop="addTextNode">Add Text Node</button>
      <button @click.stop="addMarkdownViewer">Add Markdown Viewer</button>
    </div>
  </div>
</template>

<script setup>
import { PlusIcon } from "@heroicons/vue/solid";
import { ref } from 'vue';
import { useVueFlow, Position } from '@vue-flow/core';

const isMenuOpen = ref(false);
const { addNodes, nodes } = useVueFlow(); // FIXED: Use 'nodes' ref (no 'getNodes')

function toggleMenu() {
  isMenuOpen.value = !isMenuOpen.value;
}

function addTextNode() {
  const id = `text-${Date.now()}`;
  const existingNodes = nodes.value; // FIXED: Access via nodes.value (array of current nodes)
  const offset = existingNodes.length * 20; // Incremental offset to avoid overlap
  addNodes([{
    id,
    type: 'text-output',
    data: { text: '' },
    position: { x: 250 + Math.random() * 50 + offset, y: 5 + offset }, // ADD: Random/incremental position
    sourcePosition: Position.Right, // ADD: Explicitly set (matches component)
  }]);
  isMenuOpen.value = false;
}

function addMarkdownViewer() {
  const id = `viewer-${Date.now()}`;
  const existingNodes = nodes.value; // FIXED: Access via nodes.value
  const offset = existingNodes.length * 20;
  addNodes([{
    id,
    type: 'text-viewer',
    position: { x: 100 + Math.random() * 50 + offset, y: 5 + offset },
    targetPosition: Position.Left, // ADD: Explicitly set (matches component)
  }]);
  isMenuOpen.value = false;
}
</script>
<style>
#menu {
  position: fixed;
  top: 10px;
  left: 10px;
  border: 1px solid #000;
  border-radius: 5px;
  background: #FFF;
  z-index: 1000;
}

.icon-wrapper {
  cursor: pointer;
}

.icon {
  width: 50px;
  height: 50px;
  padding: 1px;
}

.dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  background: white;
  border: 1px solid #000;
  border-radius: 5px;
  min-width: 150px;
}

.dropdown button {
  display: block;
  width: 100%;
  padding: 10px;
  border: none;
  background: none;
  text-align: left;
  cursor: pointer;
}

.dropdown button:hover {
  background: #f0f0f0;
}
</style>