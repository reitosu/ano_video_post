const { ref } = Vue;
export function useModal({ title = "modal", message = "default message", button = "OK", }) {
    const createButton = (inputButton) => {
        if (!inputButton) return ""
        const buttons = Array.isArray(inputButton) ? inputButton : [inputButton]
        let strButton = ""
        buttons.forEach((b) => {
            if (!b) return
            if (b instanceof Object) {
                if (b.noClose === true) {
                    strButton += `<button id="modal${b}" class="modal-default-button noClose">${b}</button>`
                    return
                }
            }
            strButton += `<button id="modal${b}" class="modal-default-button">${b}</button>`
        })
        return strButton
    }
    const option = {
        "title": title,
        "message": message.replaceAll("\n", "<br>"),
        "button": createButton(button)
    }
    const modalLayout = `
    <div class="modal-mask">
        <div class="modal-container">
            <div class="modal-header">
                <h3>${option.title}</h3>
            </div>
            <div class="modal-body">
                <p>${option.message}</p>
            </div>
            ${option.button ? `<div class="modal-footer">${option.button}</div>` : ""}
        </div>
    </div>
    <style>
    .modal-mask {
        position: fixed;
        z-index: 9998;
        top: 0; left: 0;
        width: 100%; height: 100%;
        background: rgba(0, 0, 0, 0.65);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
        box-sizing: border-box;
        backdrop-filter: blur(6px);
        -webkit-backdrop-filter: blur(6px);
    }
    .modal-container {
        width: 100%;
        max-width: 340px;
        background: #141416;
        border: 1px solid #2E2E33;
        border-radius: 20px;
        padding: 28px 24px 24px;
        box-sizing: border-box;
        box-shadow: 0 24px 64px rgba(0, 0, 0, 0.7);
        font-family: 'Inter', ui-sans-serif, system-ui, sans-serif;
        animation: modalIn 0.2s ease;
    }
    @keyframes modalIn {
        from { opacity: 0; transform: scale(0.95) translateY(8px); }
        to   { opacity: 1; transform: scale(1)    translateY(0); }
    }
    .modal-header h3 {
        margin: 0 0 8px;
        color: #F4F4F5;
        font-size: 17px;
        font-weight: 600;
        line-height: 1.3;
    }
    .modal-body {
        margin: 0 0 24px;
    }
    .modal-body p {
        margin: 0;
        color: #A1A1AA;
        font-size: 14px;
        line-height: 1.6;
    }
    .modal-footer {
        display: flex;
        gap: 10px;
        justify-content: flex-end;
    }
    .modal-default-button {
        height: 44px;
        padding: 0 20px;
        border-radius: 12px;
        font-size: 14px;
        font-weight: 600;
        font-family: 'Inter', ui-sans-serif, system-ui, sans-serif;
        cursor: pointer;
        border: none;
        outline: none;
        background: #26262B;
        color: #F4F4F5;
        transition: opacity 0.15s ease;
        box-sizing: border-box;
        flex-shrink: 0;
    }
    .modal-default-button:hover { opacity: 0.75; }
    .modal-default-button:active { opacity: 0.55; }
    #modal復元, #modalOK { background: #CBFF3C; color: #0A0A0B; }
    </style>
    `
    const show = ref(false)
    const div = ref()
    const buttonElements = ref()
    const onClickButton = (event) => {
        const i = document.querySelector(".modal-body").children[0].children
        const selectValue = event.target.id.replace("modal", "")
        if (i) {
            result.value = { select: event.target.id.replace("modal", ""), input: i }
        }
        else {
            result.value = event.target.id.replace("modal", "")
        }
        const customEvent = new CustomEvent('result', { detail: { "result": result.value } });
        document.dispatchEvent(customEvent)
        console.log(event.target.className.split(" ").length)
        if (event.target.className.split(" ").length < 2 || event.target.className.split(" ")[1] != "noClose") closeModal()
    }
    const result = ref(undefined)
    const openModal = () => {
        show.value = true
        div.value = document.createElement("div")
        document.body.appendChild(div.value)
        div.value.innerHTML = modalLayout
        buttonElements.value = document.querySelectorAll(".modal-default-button")
        buttonElements.value.forEach((ele) => {
            ele.addEventListener("click", onClickButton)
        })
    }
    const closeModal = () => {
        show.value = false
        document.body.removeChild(div.value);
        buttonElements.value.forEach((ele) => {
            ele.removeEventListener("click", onClickButton)
        })
    }
    const toggle = () => {
        show.value ? closeModal() : openModal()
    }
    const modal = { open: openModal, close: closeModal, toggle: toggle, result: result }
    return {
        modal,
        openModal,
        closeModal,
        toggle,
        result,
    }
}
