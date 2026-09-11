<template>
  <div class="select-none">
    <div
      class="flex h-[34px] min-w-0 cursor-default items-center gap-[7px] border-b border-row-divider pr-[7px] text-xs text-row-foreground hover:bg-row-hover"
      :class="[
        selected?.id === layer.id
          ? 'bg-control-surface text-white shadow-[inset_0_0_0_1px_var(--color-control-border)]'
          : '',
        !ownVisible ? 'text-row-disabled' : '',
        ownVisible && !effectiveVisible ? 'opacity-55' : '',
      ]"
      :style="{ paddingLeft: `${8 + depth * 15}px` }"
      :data-layer-id="layer.id"
      role="treeitem"
      :aria-selected="selected?.id === layer.id"
      :aria-expanded="layer.children.length ? isExpanded : undefined"
      @click="$emit('select', layer)"
    >
      <button
        v-if="layer.children.length"
        class="grid h-[22px] w-[11px] shrink-0 cursor-pointer place-items-center border-0 bg-transparent p-0 text-[11px] text-disclosure focus-visible:outline-2 focus-visible:outline-accent"
        type="button"
        :aria-label="isExpanded ? 'Collapse group' : 'Expand group'"
        @click.stop="$emit('expand', layer)"
      >
        <i class="fa-solid fa-caret-right transition-transform duration-150" :class="isExpanded ? 'rotate-90' : ''"></i>
      </button>
      <span v-else class="grid h-[22px] w-[11px] shrink-0 place-items-center"></span>

      <span
        class="grid h-6 w-[18px] shrink-0 place-items-center text-xs text-layer-icon"
        :class="[
          layer.type === 'text' ? 'text-[11px]' : '',
          selected?.id === layer.id ? 'text-layer-icon-selected' : '',
        ]"
      >
        <i :class="getIconClass(layer)"></i>
      </span>

      <span class="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap" :title="getName(layer)">{{ getName(layer) }}</span>
      <span v-if="layer.clipped" class="grid h-3.5 min-w-3.5 place-items-center rounded-sm border border-badge-border font-mono text-[8px] leading-none font-bold text-badge-foreground">↳</span>
      <span v-if="showBlendMode(layer)" class="grid h-3.5 min-w-3.5 place-items-center font-mono text-xs leading-none font-bold text-badge-foreground">◐</span>

      <button
        class="ml-0.5 grid h-7 w-6 shrink-0 cursor-pointer place-items-center border-0 bg-transparent p-0 text-xs hover:text-white focus-visible:outline-2 focus-visible:outline-accent disabled:cursor-wait"
        type="button"
        :class="ownVisible ? 'text-visibility' : 'text-visibility-hidden'"
        :disabled="busyId === layer.id"
        :aria-label="ownVisible ? 'Hide layer' : 'Show layer'"
        :title="ownVisible ? 'Hide layer' : 'Show layer'"
        @click.stop="$emit('toggle', layer)"
      >
        <i v-if="busyId === layer.id" class="fa-solid fa-circle-notch fa-spin"></i>
        <i v-else :class="ownVisible ? 'fa-solid fa-eye' : 'fa-solid fa-eye-slash'"></i>
      </button>
    </div>

    <div v-if="layer.children.length && isExpanded" role="group">
      <LayerRow
        v-for="child in layer.children"
        :key="child.id"
        :layer="child"
        :selected="selected"
        :visibility="visibility"
        :expanded="expanded"
        :busy-id="busyId"
        :parent-visible="effectiveVisible"
        :depth="depth + 1"
        @select="$emit('select', $event)"
        @toggle="$emit('toggle', $event)"
        @expand="$emit('expand', $event)"
      />
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  layer: { type: Object, required: true },
  selected: { type: Object, default: null },
  visibility: { type: Map, required: true },
  expanded: { type: Set, required: true },
  busyId: { type: String, default: null },
  parentVisible: { type: Boolean, default: true },
  depth: { type: Number, default: 0 },
});

defineEmits(["select", "toggle", "expand"]);

const ownVisible = computed(() => {
  return props.visibility.get(props.layer.id) ?? props.layer.visible;
});
const effectiveVisible = computed(() => props.parentVisible && ownVisible.value);
const isExpanded = computed(() => props.expanded.has(props.layer.id));

function getName(layer) {
  return layer.name || "Untitled layer";
}

function getIconClass(layer) {
  const icons = {
    group: "fa-solid fa-folder",
    text: "fa-solid fa-font",
    vector: "fa-solid fa-object-group",
    adjustment: "fa-solid fa-circle-half-stroke",
    smartObject: "fa-solid fa-cube",
    unknown: "fa-regular fa-file",
  };

  return icons[layer.type] || "fa-regular fa-image";
}

function showBlendMode(layer) {
  return !["normal", "passThrough"].includes(layer.blendMode);
}
</script>
