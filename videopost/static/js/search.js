<<<<<<< HEAD
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
=======
var tags = [
    "hou",
    "ren",
    "sou",
    "houchi",
    "renkyu",
    "soutai",
    "h",
    "r",
    "s"
  ];

  var dropdownMenu = document.getElementById("dropdown-menu");
  var tagList = document.getElementById("tag-list");

  function populateDropdownMenu(tags) {
    dropdownMenu.innerHTML = "";

    if (tags.length > 0) {
      tags.forEach(function(tag) {
        var listItem = document.createElement("li");
        listItem.textContent = tag;
        dropdownMenu.appendChild(listItem);
      });

      dropdownMenu.style.display = "block";
    } else {
      dropdownMenu.style.display = "none";
    }
  }

  function populateTagList(tags) {
    tagList.innerHTML = "";

    if (tags.length > 0) {
      tags.forEach(function(tag) {
        var listItem = document.createElement("li");
        listItem.textContent = tag;
        tagList.appendChild(listItem);
      });

      tagList.style.display = "block";
    } else {
      tagList.style.display = "none";
    }
  }

  document.addEventListener("DOMContentLoaded", function() {
    var searchInput = document.getElementById("search-input");
    var searchButton = document.getElementById("search-button");

    searchButton.addEventListener("click", function() {
      var searchText = searchInput.value.trim();

      if (searchText !== "") {
        var matchingTags = tags.filter(function(tag) {
          return tag.includes(searchText);
        });

        populateTagList(matchingTags);
      }
    });

    searchInput.addEventListener("input", function() {
      var searchText = searchInput.value.trim();

      if (searchText === "") {
        dropdownMenu.style.display = "none";
        dropdownMenu.innerHTML = "";
      } else {
        var matchingTags = tags.filter(function(tag) {
          return tag.includes(searchText);
        });

        populateDropdownMenu(matchingTags);
      }
    });
  });
>>>>>>> 8bd16c2 (サーチ画面の追加)
