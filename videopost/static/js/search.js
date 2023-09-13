const { createApp, ref, reactive, watch, computed, onMounted } = Vue;
const { useFuse } = VueUse;

const search = createApp({
  setup() {
    onMounted(() => {
      axios.defaults.xsrfCookieName = 'csrftoken'
      axios.defaults.xsrfHeaderName = "X-CSRFTOKEN"
    });

    const items = reactive(["test1","test2","test3"])
    const item_all = reactive(["all1","all2","all3"])
    const item_hot = reactive(["hot1","hot2","hot3"])
    const item_new = reactive(["new1","new2","new3"])
    const test = ref("test message")

    const cancel = (arg) => {
      console.log('canceled', arg)
    }

    const search = () => {
      console.log("searched")
    }

    const change = (event) => {
      console.log(input.value, event)
    }
    
    const input = ref("")

    return {
      items,
      item_all,
      item_hot,
      item_new,
      test,
      cancel,
      search,
      change,
      input,
    }
  }
});
search.config.compilerOptions.delimiters = ['[[', ']]'];
search.mount('#search')
