<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { useCatalogStore } from '@/stores/shelf'
import type { Catalog } from '@/stores/shelf'
import { VueDraggable } from 'vue-draggable-plus'
import chapterItem from './chapterItem.vue'

const props = defineProps<{
  catalog: Catalog
}>()
const store = useCatalogStore()

const chapters = computed({
  get: () => store.getCatalogById(props.catalog.id)?.charpterList || [],
  set: (val) => store.updateChapters(props.catalog.id, val),
})
const isCatalogExpanded = computed(() => store.getCatalogById(props.catalog.id)?.isCatalogExpanded)

const editingCatalog = ref(false)
const draftName = ref('')
const nameInput = ref<HTMLInputElement | null>(null)

const startRenameCatalog = async () => {
  editingCatalog.value = true
  draftName.value = props.catalog.name
  await nextTick()
  nameInput.value?.focus()
  nameInput.value?.select()
}

const commitRename = () => {
  const name = draftName.value.trim()
  if (name) store.renameCatalog(props.catalog.id, name)
  editingCatalog.value = false
}

const cancelRename = () => {
  editingCatalog.value = false
}

const handleDeleteCatalog = () => {
  const message = store.isCard ? '确定删除这一组及其卡片？' : '确定删除这一卷及其章节？'
  if (!confirm(message)) return
  store.deleteCatalog(props.catalog.id)
}
</script>

<template>
  <div class="catalog-block">
    <div
      class="tool-bar"
      :class="{ isChosen: store.currentCatalogId === props.catalog.id }"
      @click="store.selectCatalog(props.catalog.id)"
    >
      <button
        class="expand"
        @click="store.toggleCatalogExpand(props.catalog.id)"
        :class="{ rotated: isCatalogExpanded }"
      >
        >
      </button>
      <div class="content" @dblclick.stop="startRenameCatalog">
        <input
          v-if="editingCatalog"
          ref="nameInput"
          v-model="draftName"
          class="name-input"
          @click.stop
          @keydown.enter.prevent="commitRename"
          @keydown.escape.prevent="cancelRename"
          @blur="commitRename"
        />
        <span v-else class="catalog-name">{{ props.catalog.name }}</span>
      </div>
      <button class="add" @click.stop="store.creatChapter(props.catalog.id)">+</button>
      <button class="remove" @click.stop="handleDeleteCatalog">×</button>
    </div>
    <div class="chapter-list" v-if="isCatalogExpanded">
      <VueDraggable v-model="chapters" :animation="180" :distance="8" filter=".remove,.name-input">
        <chapterItem
          v-for="item in chapters"
          :key="item.id"
          :catalog-id="props.catalog.id"
          :chapter="item"
        />
      </VueDraggable>
    </div>
  </div>
</template>

<style scoped>
.catalog-block {
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}
.tool-bar {
  display: flex;
  align-items: center;
  width: 100%;
  height: 40px;
  box-sizing: border-box;
  padding-left: 10px;
  padding-right: 10px;
  flex-shrink: 0;
  overflow: hidden;
  cursor: pointer;
}
.tool-bar.isChosen {
  background: var(--bg-selected-soft);
}
.rotated {
  transform: rotate(90deg);
}
.content {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.catalog-name {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
}
.chapter-list {
  flex-shrink: 0;
  overflow: hidden;
}
.name-input {
  width: calc(100% - 20px);
  margin-left: 10px;
  height: 24px;
  border: 1px solid var(--bg-selected);
  border-radius: 4px;
  padding: 0 6px;
  font-size: 14px;
  box-sizing: border-box;
}
button {
  height: 28px;
  width: 25px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 20px;
}
.remove {
  font-size: 18px;
  flex-shrink: 0;
}
</style>
