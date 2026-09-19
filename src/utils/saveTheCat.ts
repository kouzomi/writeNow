/** Save the Cat（布莱克·斯奈德）：问答引导 → 15 节拍卡片组 */

export type SaveTheCatAnswers = {
  title: string
  genrePromise: string
  hero: string
  openingImage: string
  theme: string
  catalyst: string
  midpoint: string
  allIsLost: string
  finalImage: string
}

export type SaveTheCatStepId = keyof SaveTheCatAnswers

export type SaveTheCatWizardStep = {
  id: SaveTheCatStepId
  title: string
  prompt: string
  placeholder: string
  required?: boolean
}

export type SaveTheCatBeat = {
  key: string
  name: string
  guide: string
  fillFrom?: SaveTheCatStepId
}

export const SAVE_THE_CAT_WIZARD_STEPS: SaveTheCatWizardStep[] = [
  {
    id: 'title',
    title: '作品名称',
    prompt: '这组卡片叫什么？完成后会出现在卡片侧栏里。',
    placeholder: '例如：夜港回声',
    required: true,
  },
  {
    id: 'genrePromise',
    title: '类型承诺',
    prompt: '读者冲着什么来的？中间「游戏时间」要兑现的乐趣是什么？',
    placeholder: '例如：密室追查的反转快感；或修真升级与势力博弈',
  },
  {
    id: 'hero',
    title: '主角',
    prompt: '主角是谁？表面想要什么，内在缺什么／有什么缺陷？',
    placeholder: '例如：陈溯，想查清哥哥失踪，却习惯把人推开',
  },
  {
    id: 'openingImage',
    title: '开场画像',
    prompt: '故事第一眼：主角处在怎样的世界与状态？（将与终场对照）',
    placeholder: '例如：雨夜码头，独自清点无人认领的货单',
  },
  {
    id: 'theme',
    title: '主题陈述',
    prompt: '故事真正想谈的问题是什么？最好能被某句台词或某个配角点破。',
    placeholder: '例如：真相值不值得用信任去换',
  },
  {
    id: 'catalyst',
    title: '催化剂',
    prompt: '打破日常的那件事是什么？（约在前 10%）',
    placeholder: '例如：货单背面出现哥哥生前的私章',
  },
  {
    id: 'midpoint',
    title: '中点',
    prompt: '中点是假胜利还是假失败？赌注如何突然抬高？',
    placeholder: '例如：假胜利——找到藏匿点，却发现真正目标另有其人',
  },
  {
    id: 'allIsLost',
    title: '灵魂黑夜',
    prompt: '最低谷失去了什么？（人、身份、信念、计划都可以）',
    placeholder: '例如：唯一证人死去，主角被指认为凶手',
  },
  {
    id: 'finalImage',
    title: '终场画像',
    prompt: '结束后的画面如何与开场对照，让人看见改变？',
    placeholder: '例如：同一码头，他把手里的货单交给并肩站着的同伴',
  },
]

export const SAVE_THE_CAT_BEATS: SaveTheCatBeat[] = [
  {
    key: 'opening-image',
    name: '1. 开场画像',
    guide: '用一个鲜明画面定调：世界氛围、主角起点状态。终场将与此对照。',
    fillFrom: 'openingImage',
  },
  {
    key: 'theme-stated',
    name: '2. 主题陈述',
    guide: '尽早点出主题问题（常由配角说出），此时主角未必听懂或认同。',
    fillFrom: 'theme',
  },
  {
    key: 'setup',
    name: '3. 铺垫',
    guide: '建立日常、关系、缺陷与欲望；埋下后文会兑现的伏笔与人物。',
    fillFrom: 'hero',
  },
  {
    key: 'catalyst',
    name: '4. 催化剂',
    guide: '不可逆的破局事件出现，旧生活再也回不去。',
    fillFrom: 'catalyst',
  },
  {
    key: 'debate',
    name: '5. 争执',
    guide: '要不要踏上新路？写出犹豫、拒绝、权衡与代价预告。',
  },
  {
    key: 'break-into-two',
    name: '6. 第二幕开始',
    guide: '主角做出选择，进入新世界／新规则；主动迈出，而非继续拖延。',
  },
  {
    key: 'b-story',
    name: '7. B 故事',
    guide: '副线登场（感情、友情、导师等），往往承载主题的另一面。',
  },
  {
    key: 'fun-and-games',
    name: '8. 游戏时间',
    guide: '兑现类型承诺：让读者得到「冲着这类型来」的乐趣，而不是空转。',
    fillFrom: 'genrePromise',
  },
  {
    key: 'midpoint',
    name: '9. 中点',
    guide: '假胜利或假失败；信息公开或赌注翻倍，故事从「玩」转向「认真」。',
    fillFrom: 'midpoint',
  },
  {
    key: 'bad-guys-close-in',
    name: '10. 坏人逼近',
    guide: '内外压力同时加强：对手进逼、计划失灵、盟友离心、缺陷反噬。',
  },
  {
    key: 'all-is-lost',
    name: '11. 灵魂黑夜',
    guide: '最低点。常带「死亡」意象：人、梦、身份或关系的象征性死亡。',
    fillFrom: 'allIsLost',
  },
  {
    key: 'dark-night',
    name: '12. 黑暗灵魂暗夜',
    guide: '消化惨败，悟到真正要学的一课；为反击积蓄动机，而非立刻开挂。',
  },
  {
    key: 'break-into-three',
    name: '13. 第三幕开始',
    guide: '带着觉悟提出最后方案，主动走向终局，而不是被动挨打。',
  },
  {
    key: 'finale',
    name: '14. 决赛',
    guide: '综合 A/B 线证明转变；解决主冲突，兑现主题。',
  },
  {
    key: 'final-image',
    name: '15. 终场画像',
    guide: '用与开场对照的画面收束，让改变可见、可感。',
    fillFrom: 'finalImage',
  },
]

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

const paragraph = (text: string) => `<p>${escapeHtml(text)}</p>`

export const emptySaveTheCatAnswers = (): SaveTheCatAnswers => ({
  title: '',
  genrePromise: '',
  hero: '',
  openingImage: '',
  theme: '',
  catalyst: '',
  midpoint: '',
  allIsLost: '',
  finalImage: '',
})

export const buildSaveTheCatBeatContent = (beat: SaveTheCatBeat, answers: SaveTheCatAnswers) => {
  const parts = [paragraph(`【引导】${beat.guide}`)]

  if (answers.hero.trim() && (beat.key === 'setup' || beat.key === 'opening-image')) {
    parts.push(paragraph(`【主角】${answers.hero.trim()}`))
  }
  if (answers.theme.trim() && (beat.key === 'theme-stated' || beat.key === 'final-image')) {
    parts.push(paragraph(`【主题】${answers.theme.trim()}`))
  }

  const filled = beat.fillFrom ? answers[beat.fillFrom].trim() : ''
  if (filled) {
    parts.push(paragraph(`【你的笔记】${filled}`))
  } else {
    parts.push(paragraph('【你的笔记】（在此写下这一节拍的具体情节）'))
  }

  return parts.join('')
}

/** 5 列 × 3 行，适配 15 张节拍卡 */
export const saveTheCatCardPos = (index: number) => {
  const cols = 5
  const gapX = 32
  const gapY = 40
  const startX = 40
  const startY = 40
  const width = 280
  const height = 200
  const col = index % cols
  const row = Math.floor(index / cols)
  return {
    x: startX + col * (width + gapX),
    y: startY + row * (height + gapY),
  }
}

export const catalogNameFromSaveTheCat = (answers: SaveTheCatAnswers) => {
  const title = answers.title.trim()
  return title || '拯救猫节拍'
}
