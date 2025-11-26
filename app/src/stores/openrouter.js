import { defineStore } from 'pinia'
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'

export const useOpenRouterStore = defineStore('openrouter', () => {
  // State
  const models = ref([])
  const isLoading = ref(false)
  const error = ref(null)
  const lastFetched = ref(null)
  const apiKey = ref('')

  // Model selector state
  const isModelSelectorOpen = ref(false)
  const modelSelectorConfig = ref({})
  const modelSelectorResolve = ref(null)

  // Constants
  const STORAGE_KEY = 'openrouter-data'
  const REFRESH_THRESHOLD_MS = 2 * 24 * 60 * 60 * 1000 // 2 days

  // Computed properties
  const modelNames = computed(() =>
    models.value.map(model => model.name || model.id)
  )

  const hasModels = computed(() => models.value.length > 0)

  const shouldRefresh = computed(() => {
    if (!lastFetched.value) return true
    return Date.now() - new Date(lastFetched.value).getTime() > REFRESH_THRESHOLD_MS
  })

  // Actions
  async function fetchModels() {
    isLoading.value = true
    error.value = null

    try {
      const response = await axios.get('https://openrouter.ai/api/v1/models')
      console.log('openrouter response', response)

      if (response.data && Array.isArray(response.data.data)) {
        models.value = response.data.data
        lastFetched.value = new Date().toISOString()

        // Save to localStorage for persistence
        saveToStorage()
      }
    } catch (err) {
      error.value = err.message || 'Failed to fetch models from OpenRouter'
      console.error('Error fetching OpenRouter models:', err)
    } finally {
      isLoading.value = false
    }
  }

  async function generateText(modelId, prompt, options = {}, onUpdate = null) {
    if (!apiKey.value) {
      throw new Error('OpenRouter API key not set. Use setApiKey() first.')
    }

    const baseBody = {
      model: modelId,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 2048,
      ...options
    }

    const headers = {
      'Authorization': `Bearer ${apiKey.value}`,
      'Content-Type': 'application/json',
      'X-Title': document.title || 'OpenCreator',
      'HTTP-Referer': window.location.origin
    }

    if (options.stream && onUpdate) {
      const requestBody = { ...baseBody, stream: true }

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      if (!response.body) {
        throw new Error('No response body')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let fullText = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n').filter(line => line.trim().startsWith('data: '))

        for (const line of lines) {
          if (line === 'data: [DONE]') continue

          try {
            const data = JSON.parse(line.slice(5).trim()) // slice 'data: '
            const delta = data.choices?.[0]?.delta?.content || ''
            if (delta) {
              fullText += delta
              onUpdate(delta, fullText)
            }
          } catch (err) {
            console.error('Error parsing stream chunk:', err)
          }
        }
      }

      return fullText
    } else {
      // Non-streaming mode
      const requestBody = { ...baseBody }
      delete requestBody.stream // Ensure stream is not set

      const response = await axios.post(
        'https://openrouter.ai/api/v1/chat/completions',
        requestBody,
        { headers }
      )

      if (!response.data?.choices?.[0]?.message?.content) {
        throw new Error('Invalid response format from OpenRouter')
      }

      return response.data.choices[0].message.content
    }
  }

  //MARK: generateImage
  async function generateImage(modelId, prompt, options = {}) {
    if (!apiKey.value) {
      throw new Error('OpenRouter API key not set. Use setApiKey() first.')
    }

    const requestBody = {
      model: modelId,
      messages: [{ role: 'user', content: prompt }],
      modalities: ['image', 'text'],
      stream: false,
      ...options
    }

    const headers = {
      'Authorization': `Bearer ${apiKey.value}`,
      'Content-Type': 'application/json',
      'X-Title': document.title || 'OpenCreator',
      'HTTP-Referer': window.location.origin
    }

    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      requestBody,
      { headers }
    )

    if (!response.data?.choices?.[0]?.message) {
      throw new Error('Invalid response format from OpenRouter')
    }

    const message = response.data.choices[0].message
    const images = []
    
    // Extract images from the response
    if (message.images && Array.isArray(message.images)) {
      message.images.forEach(img => {
        if (img?.image_url?.url) {
          // Handle nested structure: { type: "image_url", image_url: { url: "data:..." } }
          images.push(img.image_url.url)
        } else if (typeof img === 'string') {
          // Handle direct string URLs
          images.push(img)
        } else if (img?.url) {
          // Handle direct url property
          images.push(img.url)
        }
      })
    }
    
    console.log('Extracted image URLs:', images.map(url => url.substring(0, 50) + '...'))
    
    return {
      images: images,
      text: typeof message.content === 'string' ? message.content : ''
    }
  }

  function setApiKey(key) {
    apiKey.value = key.trim()
    console.log("setApiKey", apiKey.value)

    if (apiKey.value) {
      saveToStorage()
    }
  }

  async function refreshModels() {
    // Force refresh by resetting lastFetched
    lastFetched.value = null
    await fetchModels()
  }

  function getModelById(modelId) {
    return models.value.find(model => model.id === modelId)
  }

  function getModelByName(modelName) {
    return models.value.find(
      model => (model.name || model.id).toLowerCase() === modelName.toLowerCase()
    )
  }

  // Model selector actions
  async function selectModels(config = {}) {
    modelSelectorConfig.value = {
      multiSelect: config.multiSelect ?? false,
      initialFilter: config.initialFilter ?? [],
    }
    isModelSelectorOpen.value = true

    return new Promise((resolve) => {
      modelSelectorResolve.value = resolve
    })
  }

  function confirmModelSelection(selected) {
    const multi = modelSelectorConfig.value.multiSelect
    const result = multi ? selected : (selected[0] ?? null)
    
    isModelSelectorOpen.value = false
    if (modelSelectorResolve.value) {
      modelSelectorResolve.value(result)
      modelSelectorResolve.value = null
    }
    modelSelectorConfig.value = {}
  }

  function closeModelSelector() {
    isModelSelectorOpen.value = false
    if (modelSelectorResolve.value) {
      modelSelectorResolve.value(null)
      modelSelectorResolve.value = null
    }
    modelSelectorConfig.value = {}
  }

  // Storage utilities
  function saveToStorage() {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        models: models.value,
        lastFetched: lastFetched.value,
        apiKey: apiKey.value
      })
    )
  }

  function loadFromStorage() {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        models.value = parsed.models || []
        lastFetched.value = parsed.lastFetched || null
        apiKey.value = parsed.apiKey || ''
        return true // Successfully loaded from storage
      } catch (err) {
        console.error('Error parsing stored OpenRouter data:', err)
        return false
      }
    }
    return false
  }

  // Main initialization function
  async function initialize() {
    const storageLoaded = loadFromStorage()
    
    if (storageLoaded && !shouldRefresh.value) {
      console.log('Using cached OpenRouter data from localStorage')
      return
    }

    // Either no storage data or data is stale (> 2 days)
    console.log('Fetching fresh OpenRouter models...')
    await fetchModels()
  }

  // Auto-initialize when store is created
  onMounted(() => {
    initialize()
  })

  // Expose public API
  return {
    // State
    models,
    isLoading,
    error,
    lastFetched,
    apiKey,
    isModelSelectorOpen,
    modelSelectorConfig,

    // Computed
    modelNames,
    hasModels,
    shouldRefresh,

    // Actions
    fetchModels,
    refreshModels,
    generateText,
    generateImage,
    setApiKey,
    getModelById,
    getModelByName,
    selectModels,
    confirmModelSelection,
    closeModelSelector,
    initialize
  }
})