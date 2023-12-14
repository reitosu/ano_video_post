const { createApp, ref, reactive, watch, watchEffect, computed, onMounted, nextTick } = Vue;
const { useDebounceFn, onClickOutside, useToggle, useEventListener, computedAsync, useShare } = VueUse;
import { useModal } from "./modalComponent.js";
import { fetchVideos, sharing } from './utils.js'
import { checkUserId } from "./assign-user-id.js"
import { aes_gcm_encrypt, aes_gcm_decrypt } from "./aescrypt.js"

const account = createApp({
    setup() {
        const canshare = ref("teststs")
        const { share, isSupported }
        const shareLink = async (event) => {
            event.preventDefault()
            const data = {
                url: "https://127.0.0.1:8000/videopost/account",
                text: "test url",
                title: "test title",
            }
        }
        useEventListener(document, 'contextmenu', event => {
            event.preventDefault()
        })
        useEventListener(document, 'click', function (event) {
            console.log("click", event.target)
            const videos = Array.from(document.querySelectorAll("video"))
            if (videos.length !== videoElements.length) {
                const result = videos.filter(ele => !videoElements.includes(ele));
                result.forEach(ele => {
                    ele.remove()
                })
            }
            var target = event.target;
            if (target.tagName.toLowerCase() === 'a' && target.getAttribute("download") !== null) {
                event.preventDefault();
                console.log(target.getAttribute("download"))
                alert('ダウンロードは禁止されています。');
            }
        })
        const
            videoElements = reactive([]),
            observerOptions = { childList: false, attributes: true },
            videoAttributeObserver = new MutationObserver((mutationList, observer) => {
                mutationList.forEach(mutation => {
                    console.log(mutation)
                    const attrName = mutation.attributeName
                    if (mutation.type === "attributes" && !["class", "id", "src"].includes(attrName)) {
                        mutation.target.removeAttribute(attrName)
                    }
                })
            })
<<<<<<< HEAD
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
=======

        const
            csrf = ref(),
            loadName = ref(),
            loadAddress = ref(),
            saveNameOrAdress = () => {
                const
                    data = new FormData(),
                    isName = !!name.value && loadName.value !== name.value,
                    isAddress = !!address.value && loadAddress.value !== address.value
                console.log(isName, isAddress)
                if (isName || isAddress) {
                    data.append('csrfmiddlewaretoken', csrf.value)
                    if (isName) {
                        data.append('name', name.value)
                        loadName.value = name.value
                    }
                    if (isAddress) {
                        data.append('address', address.value)
                        loadAddress.value = address.value
                    }
                    console.log(Object.fromEntries(data.entries()))
                    navigator.sendBeacon("/videopost/savenameoraddress/", data)
                    window.location.reload(true)
                }
            }

        const
            loadElement = ref(),
            dataList = computed(() => {
                if (loadElement.value) {
                    const fieldsList = JSON.parse(loadElement.value.getAttribute("data-test"))
                        .map(model => {
                            const fields = model.fields
                            return fields
                        })
                    console.log(fieldsList)
                    return fieldsList
                }
                else {
                    return undefined
                }
            }),

            blobVideos = reactive([]),

            nftList = computed(() => {
                if (loadElement.value) {
                    const fieldsList = JSON.parse(loadElement.value.getAttribute("data-nft")).map(model => {
                        const fields = model.fields
                        inputMatic.push(fields.price)
                        return fields
                    })
                    console.log(fieldsList)
                    return fieldsList
                }
                else {
                    return undefined
                }
            }),
            blobNfts = reactive([])

>>>>>>> f5e107a146713b6cd485fcb72c37062ded20c13b
        const debouncedSave = useDebounceFn(saveNameOrAdress, 1000)
        onMounted(async () => {
            axios.defaults.xsrfCookieName = 'csrftoken'
            axios.defaults.xsrfHeaderName = "X-CSRFTOKEN"
            window.addEventListener('beforeunload', saveNameOrAdress)
            csrf.value = document.querySelector('input[name="csrfmiddlewaretoken"]').value
            const load = document.querySelector("#load")
            name.value = loadName.value = load.getAttribute("data-name")
            address.value = loadAddress.value = load.getAttribute("data-address")
            console.log(JSON.parse(load.getAttribute("data-test")))
            blobVideos.push(...(await fetchVideos(dataList.value)).map(value => { return value.value }))
            blobNfts.push(...((await fetchVideos(nftList.value)).map(value => { return value.value })))
            videoElements.map(ele => {
                console.log(ele)
                videoAttributeObserver.observe(ele, observerOptions)
            })
            window.ethereum.on('accountsChanged', request)
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
                        window.ethereum.request({
                            method: "wallet_addEthereumChain",
                            params: [{
                                chainId: "0x89",
                                rpcUrls: ["https://polygon-rpc.com/"],
                                chainName: "Matic Mainnet",
                                nativeCurrency: {
                                    name: "MATIC",
                                    symbol: "MATIC",
                                    decimals: 18
                                },
                                blockExplorerUrls: ["https://polygonscan.com/"]
                            }]
                        });
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
                if (deleteResult.value.select === "ok") {
                    const cardElement = event.target.parentNode.parentNode
                    const videoName = cardElement.className.split(" ")[1]
                    console.log(document.querySelectorAll(`#tab-content2.${videoName}`), document.querySelectorAll(`#tab-content2.${videoName}`).length)
                    if (document.querySelectorAll(`#tab-content2.${videoName}`).length < 1) {
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
            const videoName = event.target.parentNode.parentNode.parentNode.className.split(" ")[1]
            console.log(event.target.parentNode.parentNode.parentNode.className.split(" ")[1])
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

        //const publicFlags = reactive([])
        const publicFlags = computed(() => {
            return dataList.value.map(model => {
                return model.ispublic
            })
        })
        const changePublicNPrivate = async event => {
            console.log(publicFlags.value)
            console.log(event.target.classList)
            const target = event.target
            const loader = target.parentNode.childNodes[2].classList
            console.log(loader)
            loader.add("loader")
            const targetClasses = target.classList
            const index = parseInt(targetClasses[1])
            console.log(index)
            console.log(parseInt(index))
            console.log(publicFlags[index])
            const flag = !publicFlags[index]
            console.log(flag)
            const videoName = dataList.value[index].video.split("/")[2]
            console.log(videoName)
            const data = new FormData()
            data.append("videoName", videoName)
            if (flag) {
                const response = await axios.post('/videopost/changepublic/', data)
                    .catch(error => console.log(error))
                console.log(response.data.response)
            }
            else {
                const response = await axios.get('/videopost/changepublic/', { params: { "videoName": videoName } })
                    .catch(error => console.log(error))
                console.log(response.data.response)
            }
            loader.remove("loader")
            publicFlags[index] = flag
            console.log(publicFlags[index])
            //console.log(event.target.parentNode.parentNode.className.split(" ")[1])
            //ajaxChange(flag)
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
        useEventListener(document, 'fullscreenchange', event => {
            if (!document.fullscreenElement) {
                event.target.pause()
            }
        })

        const sellNft = index => {
            const price = inputMatic[index]
            if (price > 0) {
                console.log(index)
                console.log(nftList.value[index].video, inputMatic[index])
                const data = new FormData()
                data.append('video', nftList.value[index].video)
                data.append('price', price)
                axios.post('/videopost/sellandcancelnft/', data)
                    .then(value => {
                        const price = value.data.res
                        nftList.value[index].price = price
                        inputMatic[index] = price
                    })
                    .catch(error => { console.log(error) })
            }
            else {
                alert("数値を入力してください。")
            }
        }

        const cancelSellNft = index => {
            const data = new FormData()
            data.append('video', nftList.value[index].video)
            axios.post('/videopost/sellandcancelnft/', data)
                .then(value => {
                    console.log(value.data.res)
                    nftList.value[index].price = 0
                    inputMatic[index] = 0
                })
        }

        const inputMaticElement = reactive([])
        const inputMaticMin = ref(0)
        const inputMatic = reactive([])
        const validate = index => {
            inputMatic[index] = inputMatic[index] ? parseFloat(String(inputMatic[index]).substring(0, 6)) : 0
        }

        const increaseNumber = (index) => {
            console.log(inputMatic[index])
            inputMatic[index] = (Math.floor(inputMatic[index] * 10) + 1) / 10
        }

        const decreaseNumber = (index) => {
            console.log(inputMatic[index])
            inputMatic[index] = Math.max((Math.ceil(inputMatic[index] * 10) - 1) / 10, inputMaticMin.value)
        }


        return {
            canshare,
            shareLink,
            videoElements,
            loadElement,
            blobVideos,
            dataList,
            nftList,
            blobNfts,
            address,
            request,
            nameElement,
            name,
            isSelected,
            changeName,
            change,
            deleteVideo,
            mint,
            publicFlags,
            changePublicNPrivate,
            playVideo,
            sellNft,
            cancelSellNft,
            inputMaticElement,
            inputMatic,
            validate,
            increaseNumber,
            decreaseNumber,
        };
    }
});
account.config.compilerOptions.delimiters = ['[[', ']]'];
account.mount("#account")
