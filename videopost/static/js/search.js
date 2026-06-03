const { createApp, ref, reactive, computed, onMounted, watch, watchEffect, nextTick } = Vue;
const { useDebounceFn, useElementVisibility, useEventListener, onClickOutside } = VueUse;
import { fetchVideo, isSmartPhone } from './utils.js'
import { useFuse } from './fuseComponent.js'

const search = createApp({
  setup() {
    const
      loadElement = ref(undefined),
      dataList = computed(() => {
        if (loadElement.value) {
          const fieldsList = JSON.parse(loadElement.value.getAttribute("data-tags"))
            .map(model => {
              const fields = { name: model.pk, ...model.fields }
              return fields
            })
          return fieldsList
        }
        else {
          return undefined
        }
      }),
      tagNames = computed(() => {
        if (dataList.value) {
          return dataList.value.map(record => {
            console.log(record)
            return record.name
          })
        }
        else { return [] }
      })

    onMounted(() => {
      console.log(dataList.value)
      console.log(tagNames.value)
    })

    const tagInputElement = ref()
    const
      inputTag = ref(""),
      historys = reactive([]),
      searchTags = reactive([])

    const
      predict = event => {
        console.log(event.target.innerText)
        inputTag.value = event.target.innerText
      },

      addSearchTag = () => {
        if (inputTag.value) {
          historys.unshift(inputTag.value)
          searchTags.push({ name: inputTag.value, flag: false })
          inputTag.value = ""
        }
      },

      toggleTagBefore = (tag) => {
        console.log(tag)
        tag.flag = !tag.flag
      },

      deleteTag = (tag) => {
        if (tag.flag) {
          if (searchTags.indexOf(tag) >= 0) searchTags.splice(searchTags.indexOf(tag), 1)
        }
      }

    const { results } = useFuse(inputTag, tagNames)

    const
      form = ref(),
      search = () => {
        if (searchTags.length) {
          form.value.submit()
        }
        else {
          alert("1つ以上")
        }
      }

    return {
      loadElement,
      tagInputElement,
      inputTag,
      historys,
      searchTags,
      predict,
      addSearchTag,
      toggleTagBefore,
      deleteTag,
      results,
      form,
      search,
    }
  }
});
search.config.compilerOptions.delimiters = ['[[', ']]'];
search.mount('#app')
