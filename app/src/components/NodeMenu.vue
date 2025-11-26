<template>
  <div>
<!-- Node Creation Menu -->
<div class="fixed top-3 left-3 z-50">
  <div id="menu" class="relative">
    <button
      @click="toggleMenu"
      class="flex items-center justify-center w-12 h-12 bg-white border border-gray-300 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
    >
      <PlusIcon class="w-6 h-6 text-gray-700" />
    </button>

    <!-- Dropdown Menu -->
    <div
      v-if="isMenuOpen"
      class="absolute top-full left-0 mt-1 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-1"
    >
                <button
            @click.stop="addTextNode"
            class="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors duration-150"
          >
            Add Text Node
          </button>
          <button
            @click.stop="addMarkdownViewer"
            class="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors duration-150"
          >
            Add Markdown Viewer
          </button>
          <button
            @click.stop="addImageNode"
            class="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors duration-150"
          >
            Add Image Node
          </button>
          <button
            @click.stop="addTextToTextNode"
            class="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors duration-150"
          >
            Add Text To Text Node
          </button>
          <button
            @click.stop="addTextToImageNode"
            class="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors duration-150"
          >
            Add Text To Image Node
          </button>  
    </div>
  </div>
</div>

    

    <!-- Settings Menu -->
    <div class="fixed top-3 right-3 z-50">
      <button
        @click="toggleSettings"
        class="flex items-center justify-center w-12 h-12 bg-white border border-gray-300 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
      >
        <CogIcon class="w-6 h-6 text-gray-700" />
      </button>

      <!-- Settings Modal -->
      <div
        v-if="isSettingsOpen"
        class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        @click.self="closeSettings"
      >
        <div
          class="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-hidden flex flex-col"
          @click.stop
        >
          <!-- Modal Header -->
          <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h3 class="text-lg font-semibold text-gray-900">Settings</h3>
            <button
              @click="closeSettings"
              class="text-gray-400 hover:text-gray-600 transition-colors duration-150"
            >
              <span class="text-2xl">&times;</span>
            </button>
          </div>

          <!-- Modal Body -->
          <div class="flex-1 px-6 py-4 overflow-y-auto">
            <div class="space-y-4">
              <div>
                <label for="openrouter-api-key" class="block text-sm font-medium text-gray-700 mb-2">
                  OpenRouter API Key
                </label>
                <input
                  id="openrouter-api-key"
                  v-model="apiKey"
                  type="password"
                  placeholder="Enter your OpenRouter API key"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                />
                <p class="mt-2 text-xs text-gray-500">
                  Get your API key from 
                  <a 
                    href="https://openrouter.ai/keys" 
                    target="_blank" 
                    class="text-blue-600 hover:text-blue-800 underline transition-colors duration-150"
                  >
                    OpenRouter
                  </a>
                </p>
              </div>
            </div>
          </div>

          <!-- Modal Footer -->
          <div class="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
            <button
              @click="closeSettings"
              class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all duration-200"
            >
              Cancel
            </button>
            <button
              @click="saveSettings"
              class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all duration-200"
            >
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { CogIcon, PlusIcon } from "@heroicons/vue/solid";
import { ref, onMounted, onUnmounted } from 'vue';
import { useVueFlow, Position } from '@vue-flow/core';
import { useOpenRouterStore } from '../stores/openrouter.js';

const isMenuOpen = ref(false);
const isSettingsOpen = ref(false);
const apiKey = ref('');

const { addNodes, nodes } = useVueFlow();
const openRouterStore = useOpenRouterStore();

// Close menus when clicking outside
const handleClickOutside = (event) => {
  if (isMenuOpen.value && !event.target.closest('#menu')) {
    isMenuOpen.value = false;
  }
};

// Load settings from localStorage on component mount
onMounted(() => {
  loadSettings();
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});

function toggleMenu() {
  isMenuOpen.value = !isMenuOpen.value;
}

function toggleSettings() {
  isSettingsOpen.value = !isSettingsOpen.value;
}

function closeSettings() {
  isSettingsOpen.value = false;
}

function loadSettings() {
  const openRouterStore = useOpenRouterStore()
  
  // Try to load from openrouter-data first (store's storage)
  const storedOpenRouter = localStorage.getItem('openrouter-data')
  if (storedOpenRouter) {
    try {
      const parsed = JSON.parse(storedOpenRouter)
      apiKey.value = parsed.apiKey || ''
      // Also set it in the store
      if (apiKey.value) {
        openRouterStore.setApiKey(apiKey.value)
      }
    } catch (error) {
      console.error('Error loading settings from openrouter-data:', error)
    }
  }
  
}

function saveSettings() {
  const openRouterStore = useOpenRouterStore()
  
  // Set the API key in the store first
  openRouterStore.setApiKey(apiKey.value)
  
  // The store will automatically save to localStorage under 'openrouter-data'
  console.log('Settings saved successfully')
  closeSettings()
  
  // Refresh models when API key is updated
  openRouterStore.refreshModels()
}

function addTextToTextNode() {
  const id = `textToText-${Date.now()}`;
  const existingNodes = nodes.value;
  const offset = existingNodes.length * 20;
  addNodes([{
    id,
    type: 'textToText',
    data: { 
      instruction: '',
      generatedText: '',
      selectedModel: ''
    },
    position: { x: 250 + Math.random() * 50 + offset, y: 5 + offset },
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
  }]);
  isMenuOpen.value = false;
}

function addTextNode() {
  const id = `text-${Date.now()}`;
  const existingNodes = nodes.value;
  const offset = existingNodes.length * 20;
  addNodes([{
    id,
    type: 'text-output',
    data: { text: '' },
    position: { x: 250 + Math.random() * 50 + offset, y: 5 + offset },
    sourcePosition: Position.Right,
  }]);
  isMenuOpen.value = false;
}

function addMarkdownViewer() {
  const id = `viewer-${Date.now()}`;
  const existingNodes = nodes.value;
  const offset = existingNodes.length * 20;
  addNodes([{
    id,
    type: 'text-viewer',
    position: { x: 100 + Math.random() * 50 + offset, y: 5 + offset },
    targetPosition: Position.Left,
  }]);
  isMenuOpen.value = false;
}

function addImageNode() {
  const id = `image-${Date.now()}`;
  const existingNodes = nodes.value;
  const offset = existingNodes.length * 20;
  addNodes([{
    id,
    type: 'image-node',
    data: { imageSrc: '', imageName: '' },
    position: { x: 150 + Math.random() * 50 + offset, y: 5 + offset },
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
  }]);
  isMenuOpen.value = false;
}
function addTextToImageNode() {
  const id = `textToImage-${Date.now()}`;
  const existingNodes = nodes.value;
  const offset = existingNodes.length * 20;
  addNodes([{
    id,
    type: 'textToImage',
    data: { 
      instruction: '',
      selectedModels: [],
      selectedDimension: 0
    },
    position: { x: 250 + Math.random() * 50 + offset, y: 5 + offset },
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
  }]);
  isMenuOpen.value = false;
}
</script>