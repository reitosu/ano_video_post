const { ref } = Vue;
export function useModal({ title = "modal", message = "default message", button = "OK", }) {
    const createButton = (inputButton) => {
        const button = Array.isArray(inputButton) ? inputButton : [inputButton]
        let strButton = ""
        button.forEach((b) => {
            if (b instanceof Object) {
                if (b.noClose === true) {
                    strButton += `<button id="modal${b}" class="modal-default-button noClose">${b}</button>`
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

            <div class="modal-footer">
                ${option.button}
            </div>
        </div>
    </div>
    <style>
    .modal-mask {
        position: fixed;
        z-index: 19998; 
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        transition: opacity 0.3s ease;
      }
      
      .modal-container {
        width: 300px;
        margin: auto;
        padding: 20px 30px;
        background-color: #fff;
        border-radius: 2px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.33);
        transition: all 0.3s ease;
      }
      
      .modal-header h3 {
        margin-top: 0;
        color: #42b983;
      }
      
      .modal-body {
        margin: 20px 0;
      }
      
      .modal-default-button {
        float: right;
      }

      .modal-enter-from {
        opacity: 0;
      }
      
      .modal-leave-to {
        opacity: 0;
      }
      
      .modal-enter-from .modal-container,
      .modal-leave-to .modal-container {
        -webkit-transform: scale(1.1);
        transform: scale(1.1);
      }
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