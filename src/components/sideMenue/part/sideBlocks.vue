<script setup lang="ts">
import { ref, computed } from 'vue'
import { useCatalogStore } from '@/stores/shelf'
import { vDraggable, VueDraggable } from 'vue-draggable-plus';


// 接收整个 catalog 对象
const props = defineProps<{
    catalog: any 
}>()
const store = useCatalogStore()

const chapters = computed({
  get: () => store.getCatalogById(props.catalog.id)?.charpterList || [],
  set: (val) => store.updateChapters(props.catalog.id, val)
})
const isCatalogExpanded = computed(() => store.getCatalogById(props.catalog.id)?.isCatalogExpanded)


</script>

<template>
    <div class="tool-bar">
        <button class="expand" @click="store.toggleCatalogExpand(props.catalog.id)" 
            :class="{ rotated: isCatalogExpanded }"> 
            > 
        </button>
        <div class="content">
            <slot></slot>
        </div>
        <button class="add" @click="store.creatChapter(props.catalog.id)"> + </button>
    </div>
    <div class="chapter-list" v-if="isCatalogExpanded">
        <VueDraggable v-model="chapters">
            <div class="charpter" :class="{text: store.isText}"v-for="item in chapters" :key="item.id">
                <label class="title" >{{ item.name }}</label>
                <label class="summary">{{ item.name }}</label>
            </div>
        </VueDraggable>
    </div>


</template>

<style scoped>
.tool-bar {
    display: flex;          
    align-items: center;    
    width: 100%;
    height: 40px;           
    box-sizing: border-box;
    padding-left: 10px;
    flex-shrink: 0; 
}

.rotated {
    transform: rotate(90deg);  /* 按钮旋转动画 */
}
.content {
    flex: 1;                /* 自动撑开，占据剩余空间 */
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis; /* 文字过长时显示省略号 */
}
.charpter {
    width: 100%;
    height: 50px;     
}
.charpter.text {
    height: 75px;
}
.title {
    padding-left: 15px;
}
.summary {
    font-size: 12px;
    padding-left: 25px;
}
button {
  height: 28px;
  width: 25px;
  border: none;
  background: transparent;
  cursor: pointer;
  overflow: hidden;
  font-size: 20px;
}
label {
    display: block;
}
</style>