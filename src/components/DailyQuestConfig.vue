<script setup lang="ts">
import { computed } from "vue";
import type { Category, DailyQuestTemplate } from "../lib/types";
import PixelButton from "./PixelButton.vue";

type Props = {
  templates: DailyQuestTemplate[];
  categories: Category[];
};

const props = defineProps<Props>();
const emit = defineEmits<{ "update:templates": [DailyQuestTemplate[]] }>();

const categoryOptions = computed(() =>
  props.categories.map((c) => ({ id: c.id, name: c.name }))
);

const canAdd = computed(() => props.templates.length < 6);

function patchTemplate(i: number, next: DailyQuestTemplate) {
  const copy = props.templates.slice();
  copy[i] = next;
  emit("update:templates", copy);
}

function removeTemplate(i: number) {
  const copy = props.templates.slice();
  copy.splice(i, 1);
  emit("update:templates", copy);
}

function addTemplate(kind: DailyQuestTemplate["kind"]) {
  if (!canAdd.value) return;
  const copy = props.templates.slice();
  const firstCat = categoryOptions.value[0]?.id ?? "body";
  if (kind === "anySeconds") copy.push({ kind, targetMinutes: 60 });
  else if (kind === "categorySeconds") copy.push({ kind, categoryId: firstCat, targetMinutes: 30 });
  else copy.push({ kind, targetCount: 1 });
  emit("update:templates", copy);
}
</script>

<template>
  <div class="cfg">
    <div class="cfg__rows">
      <div v-for="(t, i) in templates" :key="i" class="row">
        <div class="cell kind">
          <label class="k">Type</label>
          <select
            class="sel"
            :value="t.kind"
            @change="
              (e) => {
                const kind = (e.target as HTMLSelectElement).value as DailyQuestTemplate['kind'];
                if (kind === 'anySeconds') patchTemplate(i, { kind, targetMinutes: 60 });
                else if (kind === 'categorySeconds')
                  patchTemplate(i, { kind, categoryId: categoryOptions[0]?.id ?? 'body', targetMinutes: 30 });
                else patchTemplate(i, { kind, targetCount: 1 });
              }
            "
          >
            <option value="anySeconds">Total minutes</option>
            <option value="categorySeconds">Category minutes</option>
            <option value="questsEnded">Quests finished</option>
          </select>
        </div>

        <div class="cell" v-if="t.kind === 'anySeconds'">
          <label class="k">Minutes</label>
          <input
            class="inp"
            type="number"
            min="5"
            max="240"
            step="5"
            :value="t.targetMinutes"
            @input="(e) => patchTemplate(i, { kind: 'anySeconds', targetMinutes: Number((e.target as HTMLInputElement).value) })"
          />
        </div>

        <div class="cell" v-else-if="t.kind === 'categorySeconds'">
          <label class="k">Category</label>
          <select
            class="sel"
            :value="t.categoryId"
            @change="
              (e) =>
                patchTemplate(i, {
                  kind: 'categorySeconds',
                  categoryId: (e.target as HTMLSelectElement).value as any,
                  targetMinutes: t.targetMinutes
                })
            "
          >
            <option v-for="c in categoryOptions" :key="c.id" :value="c.id">{{ c.name }}</option>
          </select>
        </div>

        <div class="cell" v-if="t.kind === 'categorySeconds'">
          <label class="k">Minutes</label>
          <input
            class="inp"
            type="number"
            min="5"
            max="240"
            step="5"
            :value="t.targetMinutes"
            @input="
              (e) =>
                patchTemplate(i, {
                  kind: 'categorySeconds',
                  categoryId: t.categoryId,
                  targetMinutes: Number((e.target as HTMLInputElement).value)
                })
            "
          />
        </div>

        <div class="cell" v-else-if="t.kind === 'questsEnded'">
          <label class="k">Count</label>
          <input
            class="inp"
            type="number"
            min="1"
            max="20"
            step="1"
            :value="t.targetCount"
            @input="(e) => patchTemplate(i, { kind: 'questsEnded', targetCount: Number((e.target as HTMLInputElement).value) })"
          />
        </div>

        <div class="cell actions">
          <PixelButton variant="ghost" @click="removeTemplate(i)">Remove</PixelButton>
        </div>
      </div>
    </div>

    <div class="cfg__add">
      <PixelButton variant="ghost" :disabled="!canAdd" @click="addTemplate('categorySeconds')"
        >+ Category</PixelButton
      >
      <PixelButton variant="ghost" :disabled="!canAdd" @click="addTemplate('anySeconds')"
        >+ Total</PixelButton
      >
      <PixelButton variant="ghost" :disabled="!canAdd" @click="addTemplate('questsEnded')"
        >+ Count</PixelButton
      >
    </div>
  </div>
</template>

<style scoped>
.cfg__rows {
  display: grid;
  gap: 12px;
}

.row {
  display: grid;
  grid-template-columns: 1.2fr 1.1fr 1.1fr 0.9fr;
  gap: 10px;
  padding: 12px;
  background: rgba(0, 0, 0, 0.22);
  box-shadow:
    0 0 0 2px rgba(0, 0, 0, 0.85),
    0 0 0 4px rgba(255, 255, 255, 0.08);
}

.cell {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.actions {
  justify-content: flex-end;
}

.k {
  font-size: 11px;
  opacity: 0.75;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.sel,
.inp {
  background: rgba(0, 0, 0, 0.35);
  color: var(--text);
  border: 0;
  padding: 10px 10px;
  font: inherit;
  box-shadow:
    0 0 0 2px rgba(0, 0, 0, 0.85),
    0 0 0 4px rgba(255, 255, 255, 0.08) inset;
}

.cfg__add {
  margin-top: 12px;
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

@media (max-width: 900px) {
  .row {
    grid-template-columns: 1fr;
  }
}
</style>
