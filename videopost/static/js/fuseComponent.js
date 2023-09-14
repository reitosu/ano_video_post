const { ref, computed, toRef, toValue, watch } = Vue;
import Fuse from 'https://cdn.jsdelivr.net/npm/fuse.js@6.6.2/dist/fuse.esm.js'
export function useFuse(inputRef = ref(""), list = ref([]), option = []) {
    const args = {
        "input": toRef(inputRef),
        "list": toRef(list),
        "option": option,
    }
    watch(() => [...args.list.value], (next) => {
        console.log(next)
        if (fuse.value) fuse.value.setCollection(next);
    })
    const createFuse = () => {
        return new Fuse(toValue(args.list), args.option)
    }
    const fuse = ref(createFuse())

    const results = computed(() => {
        console.log(args.list.value, fuse.value)
        return fuse.value ? fuse.value.search(args.input.value) : [];
    })

    return {
        fuse,
        results,
    }
}

/*
以下の書き方で使える
const { fuse, results } = useFuse(input, list, option)
第一引数にサーチする文字列 refを引数にすると値が変わるたびにリザルトも変化する
第二引数にサーチ元のリスト refを引数にすると値が変わるたびにfuseの元のリストも変化する
第三引数にfuse作成時のオプション

戻り値の
fuseはrefに入っているインスタンス化したfuse
resultsは検索結果のオブジェクトが入っているref results.itemに名前 results.refIndexに順番が入っている

htmlで以下のように使うと名前一覧が表示される
<ul>
    <li v-for="tag in results">[[ tag.item ]]</li>
</ul>
*/