const { createApp, ref, reactive, watch, computed, onMounted } = Vue;
const { useDebounceFn } = VueUse;

const account = createApp({
    setup() {
        onMounted(() => {
        })
        const opt = {
            forceInjectProvider: typeof window.ethereum === 'undefined',
        };

        //const MMSDK = ref(new window.MetaMaskSDK.MetaMaskSDK(opt));
        //const ethereum = ref(MMSDK.value.getProvider())

        const request = () => {
            ethereum.request({ method: 'eth_requestAccounts' })
                .then(address => {
                    console.log(address)
                })
            if (typeof window.ethereum !== 'undefined') {
                console.log('MetaMask is installed!');
            };
            console.log("not")
        };

        return {
            request,
        };
    }
});
account.config.compilerOptions.delimiters = ['[[', ']]'];
account.mount("#account")
