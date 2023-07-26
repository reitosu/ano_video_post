const { createApp, ref, reactive, watch, computed, onMounted, onBeforeUnmount, nextTick } = Vue;
const { useEventListner, useDraggable, useMediaControls, useObjectUrl, useRefHistory, usePrevious, useDevicesList, useElementStyle } = VueUse;

const timeline = createApp({
    setup() {
        const popup = (message) => {
            return "<div class='popup'>"+message+"</div>"
        };

        onMounted(async () => {
            console.log("mounted")
            axios.defaults.xsrfCookieName = 'csrftoken'
            axios.defaults.xsrfHeaderName = "X-CSRFTOKEN"
            window.addEventListener('beforeunload', save)
            initTimelineWidth()
            const backupMaterials = document.querySelector("#backupMaterials").getAttribute("data-materials").replace(/'/g, '"')
            const backupPreviews = document.querySelector("#backupPreviews").getAttribute("data-previews")
            const backupWidth = document.querySelector("#backupWidth").getAttribute("data-width")
            if (backupMaterials) {
                materials.value = JSON.parse(backupMaterials)
                previews.value = JSON.parse(backupPreviews)
                const materialNodes = document.querySelector("#materials").childNodes
                await nextTick()
                materialNodes.forEach(element => {
                    materialObserve(element)
                })
                timelineSync(backupWidth,timelineWidth.value)
            }
        });

        const save = () => {
            console.log("save")
            const csrf = document.querySelector('input[name="csrfmiddlewaretoken"]').value
            const data = new FormData();
            data.append('csrfmiddlewaretoken', csrf)
            data.append('backup_materials',JSON.stringify(materialHistory.value[0].snapshot))
            data.append('backup_previews',JSON.stringify(previewHistory.value[0].snapshot))
            data.append('backup_width', widthHistory.value[0].snapshot)
            navigator.sendBeacon("/videopost/saveBackup/",data)
        };

        const materialObserve = (element) => {
            console.log(element)
            const changeStyle = (mutationsList) => {
                for (const mutation of mutationsList) {
                    if (mutation.type === 'attributes') {
                        const targetEle = mutation.target
                        const targetId = targetEle.id
                        const index = materialIndex(targetId)
                        const materialStyle = materials.value[index].style
                        materialStyle.left = parseFloat(targetEle.style.left)
                        materialStyle.top = parseFloat(targetEle.style.top)
                        materialStyle.width = parseFloat(targetEle.style.width)
                        console.log(materialStyle.left)
                    }
                }
            }
            const observer = new MutationObserver(changeStyle)
            observer.observe(element,{ attributes: true })
        }

        const initTimelineWidth = (width) => {
            if (width) {
                timelineWidth.value = width
            } else {
                timelineWidth.value = timelineElement.value.clientWidth
            }
        };

        const timeSettings = reactive({
            videoLength: 12,
            interval: 1,
        })
        const createInterval = (len,interval=1) => {
            const list = Array(parseInt(len)+1) 
            for (var i = 0; i <= len; i += interval) {
                var seconds = Math.floor(i % 60);
                var position = (i / len) * 100;
                Math.floor()
                list[i] = ({'left': position + '%' , "displayTime": (seconds < 10 ? '0' : '') + seconds})
            }
            return list
        }
        
        const timelineElement = ref()
        const intervalList = ref(createInterval(timeSettings.videoLength))
        const currentTimePosition = ref(0)
        const timelineWidth = ref(97+'%')

        const rownumbers = computed(() => {
            const len = 10
            return Array.from({ length: len}, (element, index) => index + 1);
        });

        const timelineClicked = (event) => {
            console.log("click")
            const clickPosition = ((event.pageX - timelineElement.value.offsetLeft) / timelineWidth.value) * 100;
            if (clickPosition <= 100 && clickPosition >= 0) {
                currentTimePosition.value=clickPosition
            }
        }

        const timelineWheeled = (event) => {
            const scrollIncrement = event.deltaY
            const beforeWidth = timelineWidth.value
            const afterWidth = beforeWidth+scrollIncrement
            if (afterWidth >= 425 && afterWidth <= 5000) {
                timelineWidth.value = afterWidth
                timelineSync(beforeWidth,afterWidth)
            }
        }

        const timelineSync = (beforeWidth, afterWidth) => {
            console.log("sync")
            const movement = afterWidth - beforeWidth

            for (let i=0; i<materialsLen.value; i++) {
                const material = materials.value[i]
                const materialWidth = material.style.width
                const materialLeft = material.style.left
                const rowsLeft = document.querySelector(".row").offsetLeft
                console.log(materialLeft)
                console.log(rowsLeft)
                let afterMaterialWidth = (materialWidth/beforeWidth) * movement
                const afterMaterialLeft = ((materialLeft-rowsLeft)/beforeWidth) * movement
                console.log(afterMaterialLeft)
                material.style.width = materialWidth + afterMaterialWidth
                material.style.left = materialLeft + afterMaterialLeft
            }
        }

        const timelineLeft = 20
        const timelineScroll = (event) => {
            const quantityX = event.target.scrollLeft
            timelineElement.value.style.left = timelineLeft - quantityX
        }

        const materials = ref([])
        const previews = ref([])
        //test {"id":"test", "element":"<video ref='test'></video>"},{"id":"test2", "element":"<img ref='test'>"}
        const materialsLen = computed(() => {
            return materials.value.length
        })

        const { history:materialHistory, undo:materialUndo, redo:materialRedo } = useRefHistory(materials, { deep:true, flush:"sync" })
        const { history:previewHistory, undo:previewUndo, redo:previewRedo } = useRefHistory(previews, { deep:true, flush:"sync" })
        const { history:widthHistory, undo:widthUndo, refo:widthRedo } = useRefHistory(timelineWidth)

        const editUndo = () => {
            materialUndo()
            previewUndo()
        }
        const editRedo = () => {
            materialRedo()
            previewRedo()
        }

        const positions = reactive({})

        const materialDelete = () => {
            axios({
                method: 'POST',
                url: '/videopost/delete/',
                responseType: 'json',
            })
            .then(response => {
                console.log('sucsess')
                materials.value = []
                previews.value = []
            }).catch(error => console.log('カメラストリームの取得に失敗しました: ', error))
        }

        const materialIndex = (id) => {
            for (let i=0; i<materialsLen.value; i++) {
                if (materials.value[i].id == id) {
                    return i
                }
            }
        }

        const dragNdrop = (event,el) => {
            console.log('longpress')
            const index = materialIndex(el.id)
            const rowsEle = el.parentElement.parentElement
            const rowElesArray = Array.from(document.querySelectorAll(".row"))
            const movementTop = ref()
            const initialLeft = parseFloat(el.style.left)
            const initialTop = parseFloat(el.style.top)
            
            const onMouseMove = (event) => {
                el.style.left = event.pageX-(el.offsetWidth/2)
                movementTop.value = event.clientY - el.parentElement.getBoundingClientRect().top + (el.offsetHeight/2)
                el.style.top = event.clientY - el.parentElement.getBoundingClientRect().top + (el.offsetHeight/2)
            }
            const onRowsScroll = (event) => {
                const scrollQuantity = rowsEle.scrollTop
                console.log(movementTop.value)
                console.log(scrollQuantity)
                el.style.top = movementTop.value + scrollQuantity
            }
            const onMouseUp = (event) => {
                console.log("remove")
                const inElement = document.elementsFromPoint(event.offsetX,event.clientY)[1]
                console.log(rowElesArray.includes(inElement))
                let spaceFlag = false
                if (rowElesArray.includes(inElement)) {
                    const rowLeft = rowElesArray[0].offsetLeft
                    const rowWidth = rowElesArray[0].offsetWidth
                    const rowRight = rowLeft + rowWidth
                    let left = parseFloat(el.style.left)
                    let right = left + parseFloat(el.style.width)
                    spaceFlag = true
                    const elementsInRow = document.querySelectorAll(`.${inElement.id}`)
                    elementsInRow.forEach(eleInRow => {
                        if (el != eleInRow) {
                            const inleft = parseFloat(eleInRow.style.left)
                            const inright = inleft + parseFloat(eleInRow.style.width)
                            if (rowLeft > left) {
                                left = rowLeft
                                right = left + parseFloat(el.style.width)
                            } else if (rowRight < right){
                                left = rowRight - rowWidth
                                right = rowRight
                            }
                            if (right > inleft && left < inright) {
                                spaceFlag = false
                            }
                        }
                    })
                }
                if (spaceFlag) {
                    el.style.left = left
                    el.style.top = inElement.clientTop + inElement.offsetTop
                }
                else {
                    el.style.top = initialTop
                    el.style.left = initialLeft
                }

                document.removeEventListener('mousemove', onMouseMove);
                rowsEle.removeEventListener('scroll', onRowsScroll)
                document.removeEventListener('mouseup', onMouseUp)
            }

            el.style.left = event.screenX-el.offsetWidth/2
            el.style.top = event.clientY - el.parentElement.getBoundingClientRect().top + (el.offsetHeight/2)
            el.style.position = 'absolute'
            document.addEventListener('mousemove', onMouseMove);
            rowsEle.addEventListener('scroll', onRowsScroll)
            document.addEventListener('mouseup', onMouseUp)
        }

        const horizonMove = (event, snap) => {
            const el = event.target
            const elId = el.id
            const Index = materialIndex(elId)
            console.log(Index)
            const snapElement = document.querySelector(snap)

            const onMove = (event) => {
                console.log(materialHistory.value)
                console.log(materials.value)
                const movement = event.movementX
                let afterLeft = parseFloat(el.style.left) + movement
                const elWidth = el.offsetWidth
                const snapLeft = snapElement.offsetLeft
                const snapRight = snapElement.offsetWidth + snapLeft
                const max = snapRight - elWidth
                const min = snapLeft
                console.log(max,min)
                el.style.left = Math.min(Math.max(afterLeft,min),max)
            }
            const onUp = (event) => {
                document.removeEventListener('mousemove', onMove)
                document.removeEventListener('mouseup', onUp)
            }
            document.addEventListener('mouseup', onUp)
            document.addEventListener('mousemove', onMove)
        }

        const slideUp = (el) => {
            console.log(el)
            const element = document.querySelector(el);
            element.style.width = window.innerWidth
            element.style.display = 'block';
            element.classList.add('animateSlideUp');
        }

        const slideDown = (el) => {
            const element = document.querySelector(el);
            const onAnimationEnd = () => {
                element.classList.remove('animateSlideUp')
                element.style.display = 'none'
                element.classList.remove('animateSlideDown');
                element.removeEventListener('animationend', onAnimationEnd);
            };
            element.addEventListener('animationend', onAnimationEnd)
            element.classList.add('animateSlideDown')
        }

        const videoVideo = ref()
        const imgVideo = ref()
        const mediastream = ref()
        var mediaRecorder;
        const { videoInputs:cameras } = useDevicesList({requestPermissions: true,});
        const selectedVideoInput = ref('')
        const audioSettings = ref(false)

        const getmediastream = async () => {
            try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { deviceId: selectedVideoInput.value } , audio: audioSettings.value })
                mediastream.value = stream
            }
            catch (error) {
                console.log(error)
                return error
            }
        };
        
        const recorder = () => {
            audioSettings.value = true
            getmediastream()
            .then(() => {
                console.log(mediastream)
                videoVideo.value.srcObject = mediastream.value
                mediaRecorder = new MediaRecorder(mediastream.value);
                
                mediaRecorder.ondataavailable = (event) => {
                    chunks.push(event.data);
                };

                mediaRecorder.onstop = () => {
                    // 録画されたデータをBlobオブジェクトとして作成
                    var videoBlob = new Blob(chunks, { type: 'video/mp4' });
        
                    var id = Date.now().toString();
                    var formData = new FormData();
                    formData.append('videoData', videoBlob, id+'video.mp4');

                    axios({
                        method: 'POST',
                        url: '/videopost/vpost/',
                        data: formData,
                        responseType: 'json',
                    })
                    .then(async response => {
                        console.log('sucsess')
                        const path = response.data.path
                        const materialClass = ref()
                        const list = []
                        for (let i=0; i<materialsLen.value; i++) {
                            console.log(materialsLen.value)
                            console.log(typeof materials.value)
                            const number = parseInt(materials.value[i].class.slice(-1))
                            list.push(number)
                        }
                        if (list[list.length-2]===9 && list[list.length-1]===0) {
                            alert("これ以上追加できません")
                        } else {
                            const result = rownumbers.value.filter((value) => {
                                return !list.includes(value);
                            });
                            console.log(result)
                            const key = "row"+result[0]
                            materialClass.value = key
                            const rowEle = document.querySelector(`#${key}`)
                            const rowTop = rowEle.clientTop + rowEle.offsetTop
                            const rowLeft = rowEle.getBoundingClientRect().left
                            console.log(rowTop, rowLeft)
                            const materialStyle = reactive({width:timelineWidth.value/3,top:rowTop,left:rowLeft})
                            previews.value.push({"id":path, "element":"<video src='"+path+"'></video>"})
                            materials.value.push({"id":"material"+path, "style":materialStyle, "class":materialClass})
                            console.log(materials.value)
                            await nextTick();
                            const observeElement = document.querySelector(`#materials`).children
                            console.log(observeElement[observeElement.length-1])
                            materialObserve(observeElement[observeElement.length-1])
                        }
                    }).catch(error => console.log('カメラストリームの取得に失敗しました: ', error))
                };
            })
        }

        const recFlag = ref(true);
        const startRec = () => {
            recFlag.value = false
            chunks = [];
            mediaRecorder.start();
            setTimeout(function() {
                recFlag.value = true
            mediaRecorder.stop();
            }, 12000);
        };
        const stopRec = () => {
            recFlag.value = true
            mediaRecorder.stop();
        };

        const stopStream = () => {
            console.log('stopstream')
            mediastream.value.getTracks().forEach(track => {
                track.stop();
            });
            mediaRecorder.stop();
            videoElement.srcObject = null;
        }

        const startStream = () => {
            getmediastream()
            .then(() => {
                imgVideo.value.srcObject = mediastream.value
            })
            console.log(mediastream)
        }

        const capture = () => {
            const canvas = document.getElementById('canvas');
            const context = canvas.getContext('2d');

            // canvasにvideoのフレームを描画
            context.drawImage(video, 0, 0, canvas.width, canvas.height);

            var dataURL = canvas.toDataURL('image/png');
            var id = Date.now().toString();
            var formData = new FormData();
                formData.append('photo', dataURL);
                formData.append('name', id+'image')
            
            axios({
                method: 'POST',
                url: '/videopost/ipost/',
                data: formData,
                responseType: 'json',
            })
            .then(async response => {
                console.log('sucsess')
                const path = response.data.path
                const materialClass = reactive({})
                const list = []
                for (let i=0; i<materialsLen.value; i++) {
                    const number = parseInt(materials.value[i].class.slice(-1))
                    list.push(number)
                }
                if (list[list.length-2]===9 && list[list.length-1]===0) {
                    alert("これ以上追加できません")
                } else {
                    const result = rownumbers.value.filter((value) => {
                        return !list.includes(value);
                    });
                    console.log(result)
                    const key = "row"+result[0]
                    materialClass.value = key
                    const rowEle = document.querySelector(`#${key}`)
                    const rowTop = rowEle.clientTop + rowEle.offsetTop
                    const rowLeft = rowEle.getBoundingClientRect().left
                    console.log(rowTop, rowLeft)
                    const materialStyle = reactive({width:timelineWidth.value/3,top:rowTop,left:rowLeft})
                    previews.value.push({"id":path, "element":"<img src='"+path+"'>"})
                    materials.value.push({"id":"material"+path, "style":materialStyle, "class":materialClass})
                    await nextTick();
                    const observeElement = document.querySelector(`#materials`).children
                    materialObserve(observeElement[observeElement.length-1])
                }
            }).catch(error => console.log('カメラストリームの取得に失敗しました: ', error))
        }

        const changeVideoInput = (videoElement) => {
            getmediastream().then(() => {videoElement.value.srcObject = mediastream.value})
        };

        const adjustFlag = ref(false)
        const adjustClass = ref()
        const selectVideo = ref();
        const videoFile = ref()
        const selectVideoSrc = ref(useObjectUrl(videoFile))
        const { duration, playing } = useMediaControls(selectVideo)

        const adjust = (event) => {
            videoFile.value = event.target.files[0];
            console.log(videoFile.value)
            const ifAdjust = () => {
                console.log(duration.value)
                if (duration.value > 12) {
                    adjustFlag.value = true
                    adjustIntervalList.value = createInterval(duration.value)
                    console.log(adjustIntervalList.value)
                    adjustClass.value = "animateFadeIn"
                }
                selectVideo.value.removeEventListener('loadedmetadata', ifAdjust)
            }
            selectVideo.value.addEventListener('loadedmetadata', ifAdjust)
        }

        const ajtimelineElement = ref()
        const ajtimelineWidth = computed(() => {return parseInt(getComputedStyle(ajtimelineElement.value).width)})
        const adjustIntervalList = ref()
        const ajcurrentTimePosition = ref(0)

        const ajtimelineClicked = (event) => {
            console.log("click")
            const clickPosition = ((event.clientX - ajtimelineElement.value.getBoundingClientRect().left) / ajtimelineWidth.value) * 100;
            if (clickPosition <= 100 && clickPosition >= 0) {
                ajcurrentTimePosition.value=clickPosition
            }
        }

        return {
            timeSettings,
            timelineElement,
            intervalList,
            timelineWidth,
            timelineLeft,
            rownumbers,
            currentTimePosition,
            timelineClicked,
            timelineWheeled,
            timelineScroll,

            materials,
            previews,
            positions,
            materialDelete,
            dragNdrop,
            horizonMove,
            slideUp,
            slideDown,

            mediastream,
            videoVideo,
            imgVideo,
            selectedVideoInput,
            cameras,
            getmediastream,
            recorder,
            recFlag,
            startRec,
            stopRec,
            stopStream,
            startStream,
            capture,
            changeVideoInput,

            adjustFlag,
            adjustClass,
            adjustIntervalList,
            ajcurrentTimePosition,
            selectVideo,
            selectVideoSrc,
            adjust,
            ajtimelineElement,
            ajtimelineClicked,
        }
    }
});

timeline.config.compilerOptions.delimiters = ['[[', ']]'];

timeline.directive('longpress', {
    mounted(el,binding) {
        let mouse_ivent_timer_id
        el.addEventListener('mousedown', (event) => {
            event.preventDefault();
            event.stopPropagation();
            el.addEventListener('mousemove', documentOnMouseUp)
            document.addEventListener('mouseup', documentOnMouseUp);
            mouse_ivent_timer_id = setTimeout(() => {
                binding.value(event,el)
            }, 1000);
        });
        
        const documentOnMouseUp = (event) => {
            clearTimeout(mouse_ivent_timer_id);
            console.log("mouseleave")
            el.removeEventListener('mousemove',documentOnMouseUp)
            document.removeEventListener('mouseup', documentOnMouseUp)
        }
    }
});

timeline.directive('resize',{
    mounted(el,binding) {
        const handleElements = reactive({"e":undefined, "w":undefined, "s":undefined, "n":undefined});
        const snapElements = reactive([])
        const snapModes = reactive([])
        const snapTolerances = reactive([])

        const asignObserver = ({element,width,height} = {}) => {
            const changeStyle = (mutationsList) => {
                for (const mutation of mutationsList) {
                    if (mutation.type === 'attributes') {
                        if (width) {
                            element.style[width] = el.offsetWidth
                        }
                        if (height) {
                            element.style[height] = el.offsetHeight
                        }
                    }
                }
            }
            const observer = new MutationObserver(changeStyle)
            observer.observe(el,{ attributes: true })
        }

        const getDirections = () => {
            const directions = binding.value.direction.replace(/\s/g,"").toLowerCase().split(",")
            if (directions === ["all"] || !directions) {
                directions = ["e","w","s","n"]
            }
            directions.forEach(d => {
                const handle = document.createElement("div")
                el.appendChild(handle)
                handleElements[d] = handle
                handle.id = "handle"+d
                handle.style.zIndex = 9999
                //handle.style.backgroundColor = "blue"
                handle.style.position = "absolute"
                switch (d) {
                    case "e":
                        handle.style.top = 0
                        handle.style.left = el.offsetWidth
                        handle.style.height = el.offsetHeight
                        handle.style.width = 5+"px"
                        handle.style.cursor = d+"-resize"
                        asignObserver({element:handle, width:"left", height:"height"})
                        break
                    case "w":
                        handle.style.height = el.offsetHeight
                        handle.style.width = 5+"px"
                        handle.style.top = 0
                        handle.style.left = -2
                        handle.style.cursor = d+"-resize"
                        asignObserver({element:handle, height:"height"})
                        break
                    case "s":
                        handle.style.top = el.offsetHeight
                        handle.style.left = 0
                        handle.style.width = el.offsetWidth
                        handle.style.height = 5+"px"
                        handle.style.cursor = d+"-resize"
                        asignObserver({element:handle, width:"width", height:"top"})
                        break
                    case "n":
                        handle.style.top = -2
                        handle.style.left = 0
                        handle.style.width = el.offsetWidth
                        handle.style.height = 5+"px"
                        handle.style.cursor = d+"-resize"
                        asignObserver({element:handle, width:"width"})
                        break
                };
            });
        };


        const getSnaps = () => {
            const snaps = binding.value.snap
            if (snaps) {
                if (!Array.isArray(snaps)) {
                    snaps = [snaps]
                }
                snaps.forEach(snap => {
                    const snapElement = snap.element.replace(/\s/g,"").split(",")
                    snapElements.push(document.querySelectorAll(snapElement))
                    if (snap.mode) {
                        snapModes.push(snap.mode.replace(/\s/g,""))
                    } else {
                        snapModes.push("inner")
                    }
                    if (snap.tolerance) {
                        snapTolerances.push(snap.tolerance)
                    } else {
                        snapTolerances.push(20)
                    }
                })
            }
        }

        const judgeSnap = ({ next, bounding } = {}) => {
            return new Promise((resolve,reject) => {
                const direction = next.element.id.slice(-1)
                const snapElementsLen = snapElements.length
                for (let i=0; i<snapElementsLen; i++) {
                    const snapElement = snapElements[i]
                    const snapMode = snapModes[i]
                    const snapTolerance = snapTolerances[i]
                    snapElement.forEach(ele => {
                        console.log(ele)
                        console.log(el)
                        if (ele == el) {
                            console.log("same");
                            return
                        }
                        const eleBounding = ele.getBoundingClientRect()
                        if (direction === "e") {
                            if (bounding.top < eleBounding.bottom && bounding.bottom > eleBounding.top) {
                                if (snapMode === "inner" && bounding.right > eleBounding.right+snapTolerance*-1 && next.x > eleBounding.right+snapTolerance*-1) {
                                    resolve(eleBounding.right - bounding.right)
                                }
                                else if (snapMode === "outer" && bounding.right > eleBounding.left+snapTolerance*-1 && bounding.left < eleBounding.right && next.x > eleBounding.left+snapTolerance*-1) {
                                    resolve(eleBounding.left - bounding.right)
                                }
                            }
                        } 
                        else if (direction === "w") {
                            if (bounding.top < eleBounding.bottom && bounding.bottom > eleBounding.top) {
                                if (snapMode === "inner" && bounding.left < eleBounding.left+snapTolerance && next.x < eleBounding.left+snapTolerance) {
                                    resolve(eleBounding.left - bounding.left)
                                }
                                else if (snapMode === "outer" && bounding.left < eleBounding.right+snapTolerance && bounding.right > eleBounding.left && next.x < eleBounding.right+snapTolerance) {
                                    resolve(eleBounding.right - bounding.left)
                                }
                            }
                        }
                        else if (direction === "s") {
                            if (bounding.left < eleBounding.bottom && bounding.right > eleBounding.left) {
                                if (snapMode === "inner" && bounding.bottom > eleBounding.bottom+snapTolerance*-1 && next.y > eleBounding.bottom+snapTolerance*-1) {
                                    console.log(eleBounding)
                                    resolve(eleBounding.bottom - bounding.bottom)
                                }
                                else if (snapMode === "outer" && bounding.bottom > eleBounding.top+snapTolerance*-1 && bounding.top < eleBounding.bottom && next.y > eleBounding.top+snapTolerance*-1) {
                                    resolve(eleBounding.top - bounding.bottom)
                                }
                            }
                        }
                        else {
                            if (bounding.left < eleBounding.bottom && bounding.right > eleBounding.left) {
                                if (snapMode === "inner" && bounding.top < eleBounding.top+snapTolerance && next.y < eleBounding.top+snapTolerance) {
                                    console.log(bounding.top)
                                    console.log(next.y)
                                    console.log(eleBounding.top+snapTolerance)
                                    console.log(eleBounding.top - bounding.top)
                                    resolve(eleBounding.top - bounding.top)
                                }
                                else if (snapMode === "outer" && bounding.top < eleBounding.bottom+snapTolerance && bounding.bottom > eleBounding.top && next.y < eleBounding.bottom+snapTolerance) {
                                    resolve(eleBounding.bottom - bounding.top)
                                }
                            }
                        }
                    })
                };
                resolve(0)
            });
        };

        getDirections()
        getSnaps()

        const movement = reactive({element:undefined, x:undefined, y:undefined})
        const watchStop = ref()

        const observeResize = async (next,pre) => {
            const resizeElement = next.element
            const direction = resizeElement.id.slice(-1)
            const bounding = el.getBoundingClientRect()
            const snap = await judgeSnap({next:next, bounding:bounding})
            console.log(snap)

            let amountX = next.x - pre.x
            let amountY = next.y - pre.y
            if (snap) {
                console.log("snapped")
                amountX = snap
                amountY = snap
            }
            console.log(amountX, amountY)
            let newWidth = el.offsetWidth + amountX
            let newHeight = el.offsetHeight + amountY
            const newLeft = parseInt(getComputedStyle(el).left) + amountX
            const newTop = parseInt(getComputedStyle(el).top) + amountY

            switch (direction) {
                case "e":
                    console.log("e")
                    if (next.x > bounding.left) {
                        el.style.width = newWidth
                        resizeElement.style.left = newWidth
                        if (handleElements.s) {
                            handleElements.s.style.width = newWidth
                        }
                        if (handleElements.n) {
                            handleElements.n.style.width = newWidth
                        }
                    }
                    break 
                case "w":
                    console.log("w")
                    newWidth -= amountX*2
                    if (newWidth > 0 && next.x < bounding.right) {
                        el.style.width = newWidth
                        el.style.left = newLeft
                        if (handleElements.e) {
                            handleElements.e.style.left = newWidth
                        }
                        if (handleElements.s) {
                            handleElements.s.style.width = newWidth
                        }
                        if (handleElements.n) {
                            handleElements.n.style.width = newWidth
                        }
                    }
                    break
                case "s":
                    if (next.y > bounding.top) {
                        el.style.height = newHeight
                        resizeElement.style.top = newHeight
                        if (handleElements.e) {
                            handleElements.e.style.height = newHeight
                        }
                        if (handleElements.w) {
                            handleElements.w.style.height = newHeight
                        }
                    }
                    break
                case "n":
                    newHeight -= amountY*2
                    if (newHeight > 0 && next.y < bounding.bottom) {
                        el.style.top = newTop
                        el.style.height  = newHeight
                        if (handleElements.s) {
                            handleElements.s.style.top = el.clientHeight
                        }
                        if (handleElements.e) {
                            handleElements.e.style.height = el.clientHeight
                        }
                        if (handleElements.w) {
                            handleElements.w.style.height = el.clientHeight
                        }
                    }
                    break
            }
        };
        
        const move = (event) => {
            console.log('move')
            event.preventDefault()
            movement.x = event.clientX
            movement.y = event.clientY
        };
        const up = (event) => {
            console.log('up')
            watchStop.value()
            document.removeEventListener('mousemove', move)
            document.removeEventListener('mouseup', up)
            document.body.style.cursor = 'auto'
        }
        const handleElementsKeys = Object.keys(handleElements)
        const handleElementsLen = handleElementsKeys.length

        for (let i=0; i<handleElementsLen; i++) {
            const direction = handleElementsKeys[i]
            console.log(direction)
            if (handleElements[direction]) {
                console.log("addevent")
                handleElements[direction].addEventListener('mousedown', (event) => {
                    event.preventDefault()
                    event.stopPropagation();
                    console.log('mousedown')
                    movement.element = event.target
                    movement.x = event.clientX
                    movement.y = event.clientY
                    watchStop.value = watch(() => ({...movement}), observeResize)
                    document.body.style.cursor = '$(direction)-resize'
                    document.addEventListener('mousemove', move)
                    document.addEventListener('mouseup', up)
                });
            }
        }

    }
});

timeline.mount('#edit')