const { createApp, ref, reactive, watch, computed, onMounted } = Vue;
const { useFuse } = VueUse;

const search = createApp({
  setup() {        
    const getTagDatas = () => {
      axios({
          method: 'POST',
          url: '/videopost/getTags/',
          responseType: 'json',
      })
          .then(async response => {
              const tagsNameList = response.data.tags
              return tagsNameList
          }).catch(error => console.log('タグデータの取得に失敗しました。: ', error))
  }
    onMounted(() => {
      axios.defaults.xsrfCookieName = 'csrftoken'
      axios.defaults.xsrfHeaderName = "X-CSRFTOKEN"
    });



    const items = reactive(["1","テスト1","ヤドン"],["2","テスト2","カビゴン"],["3","テスト3","リオル"])

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
    computed:[
      search=function(){

      }

    ]

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
      testdata,
    }
  }
});
search.config.compilerOptions.delimiters = ['[[', ']]'];
search.mount('#search')
