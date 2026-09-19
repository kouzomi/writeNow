<script setup lang="ts">
import { computed, ref } from 'vue'
import { useCatalogStore } from '@/stores/shelf'
import {
  SAVE_THE_CAT_BEATS,
  SAVE_THE_CAT_WIZARD_STEPS,
  emptySaveTheCatAnswers,
  type SaveTheCatAnswers,
} from '@/utils/saveTheCat'

const open = ref(false)
const stepIndex = ref(0)
const answers = ref<SaveTheCatAnswers>(emptySaveTheCatAnswers())
const store = useCatalogStore()

const isPreview = computed(() => stepIndex.value >= SAVE_THE_CAT_WIZARD_STEPS.length)
const currentStep = computed(() =>
  isPreview.value ? null : SAVE_THE_CAT_WIZARD_STEPS[stepIndex.value],
)
const progressLabel = computed(() => {
  if (isPreview.value) return `预览 · ${SAVE_THE_CAT_BEATS.length} 张卡片`
  return `${stepIndex.value + 1} / ${SAVE_THE_CAT_WIZARD_STEPS.length}`
})
const canContinue = computed(() => {
  if (isPreview.value) return true
  const step = currentStep.value
  if (!step?.required) return true
  return answers.value[step.id].trim().length > 0
})

const openWizard = () => {
  answers.value = emptySaveTheCatAnswers()
  stepIndex.value = 0
  open.value = true
}

const closeWizard = () => {
  open.value = false
}

const goBack = () => {
  if (stepIndex.value <= 0) {
    closeWizard()
    return
  }
  stepIndex.value -= 1
}

const goNext = () => {
  if (!canContinue.value) return
  if (stepIndex.value < SAVE_THE_CAT_WIZARD_STEPS.length) {
    stepIndex.value += 1
  }
}

const finish = () => {
  store.createSaveTheCatCatalog({ ...answers.value })
  closeWizard()
}

defineExpose({ openWizard })
</script>

<template>
  <button type="button" class="entry" title="用 Save the Cat 问答生成 15 节拍卡片组" @click="openWizard">
    拯救猫
  </button>

  <Teleport to="body">
    <div v-if="open" class="overlay" @click.self="closeWizard">
      <div class="dialog" role="dialog" aria-labelledby="save-the-cat-title">
        <header class="header">
          <div>
            <h2 id="save-the-cat-title">拯救猫</h2>
            <p class="sub">逐步回答，生成 15 张节拍卡片</p>
          </div>
          <span class="progress">{{ progressLabel }}</span>
        </header>

        <div v-if="currentStep" class="body">
          <h3>{{ currentStep.title }}</h3>
          <p class="prompt">{{ currentStep.prompt }}</p>
          <textarea
            :value="answers[currentStep.id]"
            :placeholder="currentStep.placeholder"
            rows="5"
            @input="answers[currentStep.id] = ($event.target as HTMLTextAreaElement).value"
          />
        </div>

        <div v-else class="body preview">
          <h3>将生成的卡片组</h3>
          <p class="prompt">
            组名：{{ answers.title.trim() || '拯救猫节拍' }}。可随时在卡片上改写笔记，或进入子事件层细拆。
          </p>
          <ol>
            <li v-for="beat in SAVE_THE_CAT_BEATS" :key="beat.key">{{ beat.name }}</li>
          </ol>
        </div>

        <footer class="actions">
          <button type="button" @click="goBack">{{ stepIndex === 0 ? '取消' : '上一步' }}</button>
          <button v-if="!isPreview" type="button" :disabled="!canContinue" @click="goNext">
            下一步
          </button>
          <button v-else type="button" class="primary" @click="finish">生成卡片组</button>
        </footer>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.entry {
  height: 28px;
  padding: 0 8px;
  border: none;
  background: transparent;
  color: var(--text);
  cursor: pointer;
  flex-shrink: 0;
  font-size: 13px;
}
.overlay {
  position: fixed;
  inset: 0;
  z-index: 400;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: rgba(0, 0, 0, 0.35);
}
.dialog {
  width: min(480px, 100%);
  max-height: min(640px, 100%);
  display: flex;
  flex-direction: column;
  padding: 16px 18px;
  border: 1px solid var(--border);
  background: var(--bg-surface);
  color: var(--text);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  overflow: hidden;
}
.header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}
h2 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}
.sub {
  margin: 4px 0 0;
  color: var(--text-muted);
  font-size: 12px;
}
.progress {
  flex-shrink: 0;
  color: var(--text-hint);
  font-size: 12px;
}
.body {
  margin-top: 14px;
  overflow: auto;
}
h3 {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
}
.prompt {
  margin: 8px 0 0;
  color: var(--text-muted);
  font-size: 13px;
  line-height: 1.45;
}
textarea {
  box-sizing: border-box;
  width: 100%;
  margin-top: 12px;
  padding: 10px;
  border: 1px solid var(--border-soft);
  background: var(--bg-app);
  color: var(--text);
  font: inherit;
  font-size: 14px;
  line-height: 1.45;
  resize: vertical;
}
.preview ol {
  margin: 12px 0 0;
  padding-left: 1.25em;
  font-size: 13px;
  line-height: 1.6;
  color: var(--text);
}
.actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 16px;
}
.actions button {
  height: 28px;
  padding: 0 12px;
  border: 1px solid var(--border);
  background: var(--bg-surface);
  color: var(--text);
  cursor: pointer;
  font-size: 12px;
}
.actions button.primary {
  background: var(--bg-selected-soft);
}
.actions button:disabled {
  cursor: default;
  opacity: 0.5;
}

@media (max-width: 768px) {
  .overlay {
    padding: 0;
    align-items: stretch;
  }
  .dialog {
    width: 100%;
    max-height: 100%;
    height: 100%;
    border: none;
    border-radius: 0;
    padding: 16px 16px max(16px, env(safe-area-inset-bottom));
    box-shadow: none;
  }
  .actions button {
    height: 36px;
    padding: 0 14px;
    font-size: 14px;
  }
}
</style>
