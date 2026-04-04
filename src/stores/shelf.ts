import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

interface Chapter {
  id: number
  name: string
}
interface Catalog {
  id: number
  name: string
  isCatalogExpanded: boolean
  charpterList: Chapter[]
}

export const useCatalogStore = defineStore('catalog', () => {
  
  const isMenueExpanded = ref(true)
  const currentWidth = ref(275)

  const viewMode = ref<'text' | 'card' | 'map'>('text')
  
  const textCatalogList = ref<Catalog[]>([])
  const cardCatalogList = ref<Catalog[]>([])
  const mapCatalogList = ref<Catalog[]>([])

  const textCatalogCount = ref(0)
  const cardCatalogCount = ref(0)
  const mapCatalogCount = ref(0)

  // 计算属性 (Getters)
  const isText = computed(() => viewMode.value === 'text')
  const isCard = computed(() => viewMode.value === 'card')
  const isMap = computed(() => viewMode.value === 'map')

  const currentCatalogList = computed({
    get: () => {
      if (isText.value) return textCatalogList.value
      if (isCard.value) return cardCatalogList.value
      return mapCatalogList.value
    },
    set: (val) => {
      if (isText.value) textCatalogList.value = val
      else if (isCard.value) cardCatalogList.value = val
      else mapCatalogList.value = val
    }
  })

  const currentCount = computed(() => {
    if (isText.value) return textCatalogCount.value
    if (isCard.value) return cardCatalogCount.value
    return mapCatalogCount.value
  })

  const getCatalogById = computed(() => {
    return (id: number) => currentCatalogList.value.find(c => c.id === id)
  })

  // 动作 (Actions)
  const setViewMode = (mode: 'text' | 'card' | 'map') => {
    viewMode.value = mode
  }

  const createCatalog = () => {
    const newId = Date.now(); // 生成唯一时间戳
    
    const newCatalog: Catalog = {
      id: newId,
      name: `新分类 ${newId.toString().slice(-4)}`, // 取时间戳后四位作为临时名称
      isCatalogExpanded: true,
      charpterList: []
    };
    // 根据当前视图模式推入对应的列表
    if (isText.value) {
      textCatalogList.value.push(newCatalog);
    } else if (isCard.value) {
      cardCatalogList.value.push(newCatalog);
    } else {
      mapCatalogList.value.push(newCatalog);
    }
  }

  const creatChapter = (catalogId: number) => {
    const newId = Date.now(); // 生成唯一时间戳
    const newChapter: Chapter = {
      id: newId,
      name: `新分类 ${newId.toString().slice(-4)}`,
    }
  const target = currentCatalogList.value.find(c => c.id === catalogId);
    if (!target) return;
    target.charpterList.push(newChapter);
  }

  const updateChapters = (catalogId: number, newList: Chapter[]) => {
    const target = currentCatalogList.value.find(c => c.id === catalogId)
    if (target) target.charpterList = newList
  }

  const toggleMenueExpand = () => {
    isMenueExpanded.value = !isMenueExpanded.value
  }

  const toggleCatalogExpand = (catalogId: number) => {
    const target = currentCatalogList.value.find(c => c.id === catalogId);
    if (!target) return false;
    target.isCatalogExpanded = !target.isCatalogExpanded;
    return target.isCatalogExpanded
  }


  return {
    currentWidth,
    viewMode,
    isMenueExpanded,isText, isCard, isMap,
    currentCatalogList, currentCount, getCatalogById,
    setViewMode, createCatalog, creatChapter,updateChapters, toggleMenueExpand, toggleCatalogExpand, 
  }
},{
  persist: true
})
