const { createApp, ref, reactive, watch, computed, onMounted } = Vue;
const { useDebounceFn, onClickOutside, useToggle, useEventListener } = VueUse;
import { useModal } from "./modalComponent.js";
import { checkUserId } from "./assign-user-id.js"
import { aes_gcm_encrypt, aes_gcm_decrypt } from "./aescrypt.js"

const account = createApp({
    setup() {
        const test = () => {
            axios({
                method: 'POST',
                url: '/videopost/test/',
            })
                .then(async response => {
                    print(response)
                }).catch(error => console.log(error))
        }
        const loadName = ref()
        const loadAddress = ref()
        const saveNameOrAdress = () => {
            const csrf = document.querySelector('input[name="csrfmiddlewaretoken"]').value
            console.log(csrf)
            const data = new FormData();
            console.log(address.value, loadAddress.value !== address.value)
            data.append('csrfmiddlewaretoken', csrf)
            if (name.value && loadName.value !== name.value) data.append('name', name.value)
            if (address.value && loadAddress.value !== address.value) data.append('address', address.value)
            navigator.sendBeacon("/videopost/savenameoraddress/", data)
        }
        const debouncedSave = useDebounceFn(saveNameOrAdress, 1000)
        onMounted(async () => {
            axios.defaults.xsrfCookieName = 'csrftoken'
            axios.defaults.xsrfHeaderName = "X-CSRFTOKEN"
            window.ethereum.on('accountsChanged', request)
            window.addEventListener('beforeunload', saveNameOrAdress)
            const load = document.querySelector("#load")
            name.value = loadName.value = load.getAttribute("data-name")
            address.value = loadAddress.value = load.getAttribute("data-address")
            console.log(load.getAttribute("data-list"))
        })

        const address = ref()

        const request = () => {
            console.log(typeof window.ethereum)
            if (typeof window.ethereum !== "undefined") {
                ethereum
                    .request({ method: "eth_requestAccounts" })
                    .then(async (accounts) => {
                        const currentaccount = accounts[0]
                        console.log(accounts)
                        console.log(currentaccount)
                        console.log(address.value)
                        address.value = await currentaccount
                        console.log(address.value)
                        await debouncedSave()
                    }).catch((error) => {
                        // Handle error
                        console.log(error, error.code);

                        // 4001 - The request was rejected by the user
                        // -32602 - The parameters were invalid
                        // -32603- Internal error
                    });
            } else {
                window.open("https://metamask.io/download/", "_blank");
            }
        };

        const nameElement = ref()
        const name = ref()
        const isSelected = ref(false)
        const stop = ref()
        const changeName = () => {
            isSelected.value = true
            stop.value = onClickOutside(nameElement, change)
        }
        const change = event => {
            console.log(event)
            console.log(loadName.value, name.value, loadAddress.value, address.value)
            isSelected.value = false
            debouncedSave()
            stop.value()
        }

        const { result: deleteResult, openModal: checkDelete } = useModal({ title: "", message: "本当に削除しますか？", button: ["ok", "cancel"] })

        const deleteVideo = event => {
            checkDelete()
            const cleanup = useEventListener(document, 'result', () => {
                console.log(deleteResult.value)
                if (deleteResult === "ok") {
                    const cardElement = event.target.parentNode.parentNode
                    const videoName = cardElement.className.split(" ")[1]
                    console.log(document.querySelectorAll("." + videoName), document.querySelectorAll("." + videoName).length)
                    if (document.querySelectorAll("." + videoName).length === 1) {
                        console.log(videoName)
                        const data = new FormData()
                        data.append('videoName', videoName)
                        axios.post('/videopost/deletevideo/', data)
                            .then(response => {
                                console.log(response)
                                cardElement.remove()
                            })
                            .catch(error => console.log("削除出来ませんでした。" + error))
                    }
                    else {
                        alert("NFT化されているため削除することが出来ません。")
                    }
                }
                else {
                    console.log("cancel")
                }
                cleanup()
            })
        }

        const { modal: metadataModal } = useModal({ title: "", message: '変更することは出来ません。<form>name: <input type="text" style="width:100%;" required></input>description: <textarea type="text" style="width:100%; resize:none;" required></textarea><button class="modal-default-button noClose">mint</button><button class="modal-default-button">cancel</buttom></form>', button: "" })

        const mint = event => {
            metadataModal.open()
            const videoName = event.target.parentNode.parentNode.className.split(" ")[1]
            const submited = function (event, videoName) {
                event.preventDefault()
                metadataModal.close()
                const name = event.target.childNodes[1].value
                const description = event.target.childNodes[3].value
                console.log(name, description, videoName)
                const data = new FormData()
                data.append("videoName", videoName)
                data.append("name", name)
                data.append("description", description)
                data.append("walletAddress", address.value)
                const { modal: metadataCheckModal } = useModal({ title: "確認", message: `name: ${name}\ndescription: ${description}\nでよろしいですか？`, button: ["ok", "cancel"] })
                metadataCheckModal.open()
                const cleanup = useEventListener(document, "result", event => {
                    cleanup()
                    console.log(metadataCheckModal.result.value)
                    if (metadataCheckModal.result.value.select == "ok") {
                        console.log("mint")
                        console.log(Object.fromEntries(data.entries()))
                        axios.post('/videopost/mintvideo/', data)
                    }
                })
            }
            const cleanup = useEventListener(window, "submit", event => {
                submited(event, videoName)
                cleanup()
            })
        }

        const publicFlag = ref(true)
        const toggle = useToggle(publicFlag)
        const changePublicNPrivate = async () => {
            await toggle()
            if (publicFlag.value) {
                console.log(publicFlag.value)
            }
            else {
                console.log(publicFlag.value)
            }
        }

        const playVideo = event => {
            let element = event.target
            while (element.className.split(" ")[0] !== "card") {
                console.log(element)
                element = element.parentNode
            }
            console.log(element.childNodes[2].childNodes[0])
            element.childNodes[2].childNodes[0].requestFullscreen()
        }


        return {
            test,
            address,
            request,
            nameElement,
            name,
            isSelected,
            changeName,
            change,
            deleteVideo,
            mint,
            publicFlag,
            changePublicNPrivate,
            playVideo,
        };
    }
});
account.config.compilerOptions.delimiters = ['[[', ']]'];
account.mount("#account")
