<template>
  <section class="thin-scrollbar max-h-[calc(100vh-16px)] w-full overflow-auto bg-inspector text-xs">
    <header class="sticky top-0 z-[2] flex h-11 items-center justify-between gap-3 border-b border-inspector-border bg-control-surface px-[13px]">
      <div class="min-w-0">
        <strong class="block font-mono text-[11px] font-bold tracking-[.12em] text-inspector-title">INSPECT</strong>
        <small class="mt-[3px] block max-w-[210px] overflow-hidden text-[11px] text-inspector-subtitle text-ellipsis whitespace-nowrap" :title="name">{{ name }}</small>
      </div>
      <span class="font-mono text-[10px] text-inspector-type">document</span>
    </header>

    <div class="px-[13px] pb-[15px]">
      <section class="border-b border-section-divider py-3.5">
        <h3 class="mb-[9px] text-xs tracking-[.06em] text-heading uppercase">Document</h3>
        <img
          v-if="previewUrl"
          class="checkerboard mb-2.5 block max-h-[180px] w-full object-contain"
          :src="previewUrl"
          :alt="name"
        />
        <dl class="m-0">
          <div class="flex justify-between gap-[15px] py-[3px]"><dt class="text-term">Size</dt><dd class="m-0 text-control-active-key">{{ width }} × {{ height }}</dd></div>
          <div class="flex justify-between gap-[15px] py-[3px]"><dt class="text-term">Layers</dt><dd class="m-0 text-control-active-key">{{ layerCount }}</dd></div>
        </dl>
      </section>

      <section class="border-b border-section-divider py-3.5">
        <div class="mb-[9px] flex items-center justify-between gap-3">
          <h3 class="m-0 text-xs tracking-[.06em] text-heading uppercase">Colors</h3>
          <button
            class="h-7 min-w-[50px] cursor-pointer rounded border border-control-border bg-control-surface px-[9px] text-[11px] text-input-foreground hover:border-control-border-hover hover:text-white focus-visible:border-control-border-hover focus-visible:text-white focus-visible:outline-0 disabled:cursor-default disabled:opacity-40"
            type="button"
            :disabled="!colors.length"
            @click="copyColors"
          >
            {{ colorsCopied ? "Copied" : "Copy" }}
          </button>
        </div>
        <div v-if="fontsLoading" class="grid min-h-[42px] place-items-center rounded bg-welcome-base text-empty-foreground">Reading document colors…</div>
        <div v-else-if="colors.length" class="grid grid-cols-[repeat(auto-fill,24px)] gap-[7px]">
          <button
            v-for="color in colors"
            :key="color.value"
            class="size-6 cursor-pointer rounded-[3px] border border-swatch-border p-0 hover:border-drop-border-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            type="button"
            :style="{ backgroundColor: color.value }"
            :title="`${color.value} · ${color.count} uses`"
            @click="copyColor(color.value)"
          ></button>
        </div>
        <div v-else class="grid min-h-[42px] place-items-center rounded bg-welcome-base text-empty-foreground">No colors found</div>
      </section>

      <section class="border-b border-section-divider py-3.5">
        <h3 class="mb-[9px] text-xs tracking-[.06em] text-heading uppercase">Fonts</h3>
        <div v-if="fontsLoading" class="grid min-h-[42px] place-items-center rounded bg-welcome-base text-empty-foreground">Reading text layers…</div>
        <div v-else-if="fonts.length" class="grid gap-3.5">
          <article class="grid gap-[7px]" v-for="font in fonts" :key="font.family">
            <header class="flex min-w-0 items-center gap-[7px] text-layer-icon-selected">
              <i class="fa-solid fa-font w-3.5 text-center text-[10px] text-icon"></i>
              <strong class="min-w-0 overflow-hidden text-xs text-ellipsis whitespace-nowrap">{{ font.family }}</strong>
              <small class="text-[10px] text-count">{{ font.count }}</small>
            </header>

            <div
              v-for="style in font.styles"
              :key="style.name"
              class="grid grid-cols-[76px_1fr] items-start gap-2 pl-[21px]"
            >
              <span class="overflow-hidden text-font-style text-ellipsis whitespace-nowrap">{{ style.name }}</span>
              <div class="flex flex-wrap gap-1">
                <i class="rounded-[3px] border border-tag-border bg-control-surface px-[5px] py-[3px] text-[10px] not-italic text-tag-foreground" v-for="size in style.sizes" :key="size">{{ size }}px</i>
                <i v-if="!style.sizes.length" class="rounded-[3px] border border-tag-border bg-control-surface px-[5px] py-[3px] text-[10px] not-italic text-tag-foreground">—</i>
              </div>
            </div>
          </article>
        </div>
        <div v-else class="grid min-h-[42px] place-items-center rounded bg-welcome-base text-empty-foreground">No fonts found</div>
      </section>

      <section class="border-b border-section-divider py-3.5">
        <h3 class="mb-[9px] text-xs tracking-[.06em] text-heading uppercase">Export document</h3>

        <label class="block">
          <span class="sr-only">Name</span>
          <input
            class="h-7 w-full rounded border border-control-border bg-control-surface px-[9px] text-xs text-input-foreground placeholder:text-inspector-type hover:border-control-border-hover focus:border-control-border-hover focus:text-white focus:outline-0"
            v-model="exportName"
            type="text"
            :placeholder="defaultName"
            @keydown.enter="exportDocument"
          />
        </label>

        <div class="mt-2 grid grid-cols-[90px_1fr] gap-[7px]">
          <label class="min-w-0">
            <span class="sr-only">Scale</span>
            <select class="h-7 w-full cursor-pointer rounded border border-control-border bg-control-surface pr-[25px] pl-[9px] text-xs text-input-foreground hover:border-control-border-hover focus:border-control-border-hover focus:text-white focus:outline-0" v-model.number="exportScale">
              <option :value="1">1x</option>
              <option :value="2">2x</option>
              <option :value="3">3x</option>
              <option :value="4">4x</option>
            </select>
          </label>

          <label class="min-w-0">
            <span class="sr-only">Format</span>
            <select class="h-7 w-full cursor-pointer rounded border border-control-border bg-control-surface pr-[25px] pl-[9px] text-xs text-input-foreground hover:border-control-border-hover focus:border-control-border-hover focus:text-white focus:outline-0" v-model="exportFormat">
              <option value="png">PNG</option>
              <option value="jpeg">JPG</option>
              <option value="webp">WebP</option>
            </select>
          </label>
        </div>

        <button class="mt-[7px] h-[30px] w-full cursor-pointer overflow-hidden rounded border border-control-border bg-control-surface px-[9px] text-xs text-input-foreground text-ellipsis whitespace-nowrap hover:border-control-border-hover hover:text-white focus-visible:border-control-border-hover focus-visible:text-white focus-visible:outline-0" type="button" @click="exportDocument">
          Export {{ exportName.trim() || defaultName }}
        </button>
      </section>
    </div>
  </section>
</template>

<script setup>
import { computed, ref } from "vue";

const props = defineProps({
  name: { type: String, required: true },
  width: { type: Number, required: true },
  height: { type: Number, required: true },
  layerCount: { type: Number, required: true },
  fonts: { type: Array, required: true },
  colors: { type: Array, required: true },
  fontsLoading: { type: Boolean, default: false },
  previewUrl: { type: String, default: "" },
});

const emit = defineEmits(["export"]);

const exportName = ref("");
const exportScale = ref(1);
const exportFormat = ref("png");
const colorsCopied = ref(false);
const defaultName = computed(() => {
  return props.name.replace(/\.(psd|psb)$/i, "") || "document";
});

function exportDocument() {
  emit(
    "export",
    exportFormat.value,
    exportScale.value,
    exportName.value.trim(),
  );
}

async function copyColor(value) {
  await navigator.clipboard.writeText(value);
}

async function copyColors() {
  if (!props.colors.length) return;

  await navigator.clipboard.writeText(
    props.colors.map((color) => color.value).join("\n"),
  );
  colorsCopied.value = true;
  window.setTimeout(() => colorsCopied.value = false, 1200);
}
</script>
