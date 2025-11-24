<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    @click.self="close"
  >
    <div
      class="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden flex flex-col"
      @click.stop
    >
      <!-- Modal Header -->
      <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        <div class="flex items-center gap-3">
          <h3 class="text-lg font-semibold text-gray-900">Select Model</h3>
          
          <!-- Filter Icon with Badge -->
          <button
            @click="toggleFilterPanel"
            class="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Toggle Filters"
          >
            <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            <span
              v-if="activeFilterCount > 0"
              class="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold"
            >
              {{ activeFilterCount }}
            </span>
          </button>
        </div>

        <button
          @click="close"
          class="text-gray-400 hover:text-gray-600 transition-colors duration-150"
        >
          <span class="text-2xl">&times;</span>
        </button>
      </div>

      <!-- Filter Panel (collapsible) -->
      <div
        v-if="showFilterPanel"
        class="px-6 py-4 border-b border-gray-200 bg-gray-50"
      >
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <!-- Input Modalities -->
          <div>
            <h4 class="text-sm font-semibold text-gray-700 mb-2">Input Modalities</h4>
            <div class="space-y-1">
              <label v-for="modality in inputModalityOptions" :key="modality" class="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  :value="modality"
                  v-model="filters.inputModalities"
                  class="rounded cursor-pointer"
                />
                <span class="capitalize">{{ modality }}</span>
              </label>
            </div>
          </div>

          <!-- Output Modalities -->
          <div>
            <h4 class="text-sm font-semibold text-gray-700 mb-2">Output Modalities</h4>
            <div class="space-y-1">
              <label v-for="modality in outputModalityOptions" :key="modality" class="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  :value="modality"
                  v-model="filters.outputModalities"
                  class="rounded cursor-pointer"
                />
                <span class="capitalize">{{ modality }}</span>
              </label>
            </div>
          </div>

          <!-- Context Length -->
          <div>
            <h4 class="text-sm font-semibold text-gray-700 mb-2">Context Length</h4>
            <div class="space-y-1">
              <label v-for="length in contextLengthOptions" :key="length.value" class="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  :value="length.value"
                  v-model="filters.contextLengths"
                  class="rounded cursor-pointer"
                />
                <span>{{ length.label }}</span>
              </label>
            </div>
          </div>
        </div>

        <!-- Reset Filters -->
        <div class="mt-4 flex justify-end">
          <button
            @click="resetFilters"
            class="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
          >
            Reset Filters
          </button>
        </div>
      </div>

      <!-- Search Box -->
      <div class="px-6 py-4 border-b border-gray-200">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search models by name..."
          class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
        />
      </div>

      <!-- Model List (Table) -->
      <div class="flex-1 overflow-y-auto px-6 py-4">
        <div v-if="isLoading" class="text-center py-8 text-gray-500">
          <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p class="mt-2">Loading models...</p>
        </div>
        <div v-else-if="filteredModels.length === 0" class="text-center py-8 text-gray-500">
          <p>No models found matching your criteria.</p>
          <button 
            @click="resetFilters" 
            class="mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            Clear filters
          </button>
        </div>
        <table v-else class="w-full">
          <thead class="sticky top-0 bg-white border-b-2 border-gray-200 shadow-sm">
            <tr>
              <th class="text-left py-2 px-2 w-8"></th>
              <th 
                @click="toggleSort('name')"
                class="text-left py-2 px-2 cursor-pointer hover:bg-gray-50 select-none transition-colors"
              >
                <div class="flex items-center gap-2">
                  <span class="font-semibold text-sm">Name</span>
                  <span class="text-xs text-gray-400">
                    {{ sortField === 'name' ? (sortDirection === 'asc' ? '▲' : '▼') : '⇅' }}
                  </span>
                </div>
              </th>
              <th 
                @click="toggleSort('created')"
                class="text-left py-2 px-2 cursor-pointer hover:bg-gray-50 select-none w-40 transition-colors"
              >
                <div class="flex items-center gap-2">
                  <span class="font-semibold text-sm">Created Date</span>
                  <span class="text-xs text-gray-400">
                    {{ sortField === 'created' ? (sortDirection === 'asc' ? '▲' : '▼') : '⇅' }}
                  </span>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="model in sortedModels"
              :key="model.id"
              @click="toggleModelSelection(model)"
              class="border-b border-gray-100 hover:bg-blue-50 cursor-pointer transition-colors"
              :class="{ 'bg-blue-50': isModelSelected(model) }"
            >
              <td class="py-2 px-2">
                <input
                  type="checkbox"
                  :checked="isModelSelected(model)"
                  @click.stop="toggleModelSelection(model)"
                  class="rounded cursor-pointer"
                />
              </td>
              <td class="py-2 px-2 text-sm">{{ model.name }}</td>
              <td class="py-2 px-2 text-sm text-gray-600">
                {{ formatDate(model.created) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Selected Models Pills -->
      <div
        v-if="selectedModels.length > 0"
        class="px-6 py-4 border-t border-gray-200 bg-gray-50"
      >
        <div class="flex items-center gap-2 mb-2">
          <span class="text-sm font-semibold text-gray-700">Selected ({{ selectedModels.length }}):</span>
        </div>
        <div class="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
          <div
            v-for="model in selectedModels"
            :key="model.id"
            class="inline-flex items-center gap-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs"
          >
            <span>{{ model.name }}</span>
            <button
              @click="removeSelection(model)"
              class="hover:bg-blue-200 rounded-full p-0.5 transition-colors w-4 h-4 flex items-center justify-center"
              title="Remove"
            >
              <span class="text-sm leading-none font-bold">&times;</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Modal Footer -->
      <div class="flex justify-end gap-3 px-6 py-4 border-t border-gray-200">
        <button
          @click="close"
          class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all duration-200"
        >
          Cancel
        </button>
        <button
          @click="confirmSelection"
          :disabled="selectedModels.length === 0"
          class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Select {{ selectedModels.length > 0 ? `(${selectedModels.length})` : '' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useOpenRouterStore } from '../stores/openrouter.js'

const openRouterStore = useOpenRouterStore()

// Bind to store state
const isOpen = computed(() => openRouterStore.isModelSelectorOpen)
const multiSelect = computed(() => openRouterStore.modelSelectorConfig.multiSelect ?? false)
const initialFilter = computed(() => openRouterStore.modelSelectorConfig.initialFilter ?? [])

// State
const showFilterPanel = ref(false)
const searchQuery = ref('')
const selectedModels = ref([])
const sortField = ref('name')
const sortDirection = ref('asc')

// Filter state
const filters = ref({
  inputModalities: [],
  outputModalities: [],
  contextLengths: []
})

// Filter options
const inputModalityOptions = ['text', 'image', 'file', 'audio', 'video']
const outputModalityOptions = ['text', 'image']
const contextLengthOptions = [
  { label: '4K+', value: 4000 },
  { label: '64K+', value: 64000 },
  { label: '1M+', value: 1000000 }
]

// Initialize store on mount and parse initial filter
onMounted(async () => {
  await openRouterStore.initialize()
  parseInitialFilter(initialFilter.value)
})

// Watch for changes to initialFilter
watch(initialFilter, (newVal) => {
  parseInitialFilter(newVal)
})

// Parse initial filter
function parseInitialFilter(initFilter) {
  if (Array.isArray(initFilter)) {
    // Parse array format: ["architecture.output_modalities=image"]
    initFilter.forEach(filterStr => {
      const [path, value] = filterStr.split('=')
      const pathParts = path.split('.')
      
      if (pathParts[0] === 'architecture') {
        if (pathParts[1] === 'input_modalities' && !filters.value.inputModalities.includes(value)) {
          filters.value.inputModalities.push(value)
        } else if (pathParts[1] === 'output_modalities' && !filters.value.outputModalities.includes(value)) {
          filters.value.outputModalities.push(value)
        }
      } else if (path === 'context_length') {
        const numValue = parseInt(value)
        if (!isNaN(numValue) && !filters.value.contextLengths.includes(numValue)) {
          filters.value.contextLengths.push(numValue)
        }
      }
    })
  } else if (typeof initFilter === 'object' && initFilter !== null) {
    // Direct object format
    filters.value = { ...filters.value, ...initFilter }
  }
}

// Computed
const isLoading = computed(() => openRouterStore.isLoading)

const activeFilterCount = computed(() => {
  return filters.value.inputModalities.length +
         filters.value.outputModalities.length +
         filters.value.contextLengths.length
})

const filteredModels = computed(() => {
  let models = openRouterStore.models

  // Apply search filter
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    models = models.filter(model => 
      model.name.toLowerCase().includes(query) ||
      model.id.toLowerCase().includes(query)
    )
  }

  // Apply input modality filters
  if (filters.value.inputModalities.length > 0) {
    models = models.filter(model => {
      if (!model.architecture?.input_modalities) return false
      return filters.value.inputModalities.every(modality =>
        model.architecture.input_modalities.includes(modality)
      )
    })
  }

  // Apply output modality filters
  if (filters.value.outputModalities.length > 0) {
    models = models.filter(model => {
      if (!model.architecture?.output_modalities) return false
      return filters.value.outputModalities.every(modality =>
        model.architecture.output_modalities.includes(modality)
      )
    })
  }

  // Apply context length filters
  if (filters.value.contextLengths.length > 0) {
    models = models.filter(model => {
      if (!model.context_length) return false
      return filters.value.contextLengths.some(length => {
        // Check if model's context length meets or exceeds the filter value
        return model.context_length >= length
      })
    })
  }

  return models
})

const sortedModels = computed(() => {
  const models = [...filteredModels.value]
  
  models.sort((a, b) => {
    let aVal, bVal
    
    if (sortField.value === 'name') {
      aVal = a.name || a.id
      bVal = b.name || b.id
      return sortDirection.value === 'asc' 
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal)
    } else if (sortField.value === 'created') {
      aVal = a.created || 0
      bVal = b.created || 0
      return sortDirection.value === 'asc' 
        ? aVal - bVal
        : bVal - aVal
    }
    
    return 0
  })
  
  return models
})

// Methods
function toggleFilterPanel() {
  showFilterPanel.value = !showFilterPanel.value
}

function resetFilters() {
  filters.value = {
    inputModalities: [],
    outputModalities: [],
    contextLengths: []
  }
}

function toggleSort(field) {
  if (sortField.value === field) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortField.value = field
    sortDirection.value = 'asc'
  }
}

function toggleModelSelection(model) {
  const index = selectedModels.value.findIndex(m => m.id === model.id)
  
  if (index > -1) {
    selectedModels.value.splice(index, 1)
  } else {
    if (multiSelect.value) {
      selectedModels.value.push(model)
    } else {
      selectedModels.value = [model]
    }
  }
}

function isModelSelected(model) {
  return selectedModels.value.some(m => m.id === model.id)
}

function removeSelection(model) {
  const index = selectedModels.value.findIndex(m => m.id === model.id)
  if (index > -1) {
    selectedModels.value.splice(index, 1)
  }
}

function formatDate(timestamp) {
  if (!timestamp) return 'N/A'
  const date = new Date(timestamp * 1000)
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  })
}

function close() {
  openRouterStore.closeModelSelector()
}

function confirmSelection() {
  openRouterStore.confirmModelSelection(selectedModels.value)
}
</script>