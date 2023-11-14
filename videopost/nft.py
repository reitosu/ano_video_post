from django.conf import settings
from os import path
import environ
import nft_storage
from nft_storage.api import nft_storage_api
from urllib.request import urlopen
import json
import numpy as np
import cv2
from io import BytesIO, BufferedReader
from tempfile import TemporaryDirectory
from eth_account import Account
from web3 import Web3
from web3.middleware.geth_poa import geth_poa_middleware
import requests
from pprint import pprint


class Nft:
    def __init__(self):
        self.env = environ.Env()
        self.env.read_env(path.join(settings.BASE_DIR, '.env'))
        self.configuration = nft_storage.Configuration(
            access_token=self.env("NFT_STORAGE_API_KEY")
        )
        self.wa = WalletAccount(self.env("WALLET_PRIVATE_KEY"))
        self.contract_address = self.env("CONTRACT_ADDRESS")
        self.abi_path = path.join(
            settings.STATIC_ROOT, "abi", "ExampleNFT.json")
        self.contract = Contract(self.wa, self.contract_address, self.abi_path)
    
    def get_nft_metadata(self, token_id):
        uri = self.contract.get_tokenURI(token_id)
        print(uri)
        print(uri[7:])
        uri = f"https://nftstorage.link/ipfs/{uri[7:]}"
        response = requests.get(uri)
        pprint(json.loads(response.content.decode()))
        return json.loads(response.content.decode())

    def mint_nft(self, video: str, name: str, description: str, nft_owner_address: str) -> int:
        """
        minting nft

        args:
            video (str) :  video_file name
            nft_owner_address (str) : wallet_address of who will have nft

        returns:
            int : tokenID
            str : address
        """
        # video = "w35dpkpfqntumtv26dvq"
        with TemporaryDirectory() as td:
            json_path = path.join(td, "json.json")
            self.create_matadata(video, name, description, json_path)
            cid = self.store_ipfs(json_path)
        reciept = self.contract.mint_nft(nft_owner_address, cid)
        token_id = int(dict(dict(reciept)["logs"][1])["data"], 16)
        address = dict(dict(reciept)["logs"][1])["address"]
        return token_id, address

    def trade(self, from_address: str, to_address: str, token_id: int, price: int):
        self.contract.send_matic(to_address, from_address, price)
        self.contract.transfer(from_address, to_address, token_id)

    def store_ipfs(self, file) -> str:
        """
        store at nft.storage

        args:
            file (str or BufferedReader) : filepath or url or BufferedReader

        returns:
            str : ipfsURL
        """
        with nft_storage.ApiClient(self.configuration) as api_client:
            api_instance = nft_storage_api.NFTStorageAPI(api_client)
            body = file
            if type(file) is str:
                body = urlopen(file) if "http" in file else open(file)

            try:
                api_response = api_instance.store(
                    body, _check_return_type=False)
                print(api_response)
                cid = api_response["value"]["cid"]
                return "ipfs://"+cid
            except nft_storage.ApiException as e:
                print("Exception when calling NFTStorageAPI->store: %s\n" % e)

    def create_matadata(self, video: str, name: str, description: str, path: str) -> None:
        url = f"https://res.cloudinary.com/dhlsaygev/video/upload/{video}.mp4"
        video_cid = self.store_ipfs(url)
        thumbnail = self.generate_thumbnail(url)
        thumbnail_cid = self.store_ipfs(thumbnail)

        metadata = {
            "image": thumbnail_cid,
            "animation_url": video_cid,
            "name": name,
            "description": description,
        }

        with open(path, 'w') as f:
            json.dump(metadata, f)

    def generate_thumbnail(self, video_path: str, num_frames: int = 50) -> BufferedReader:
        cap = cv2.VideoCapture(video_path)

        frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

        frame_indices = [int(i * frame_count / (num_frames - 1)) for i in range(num_frames)]

        thumbnails = []
        for idx in frame_indices:
            cap.set(cv2.CAP_PROP_POS_FRAMES, idx)
            ret, frame = cap.read()
            if ret:
                thumbnails.append(frame)

        best_thumbnail = self.select_best_thumbnail(thumbnails)
        body = self.open_image_file(best_thumbnail)

        cap.release()

        return body

    def select_best_thumbnail(self, thumbnails):
        scores = []

        # 明るさの評価
        brightness_scores = [cv2.mean(frame)[0] for frame in thumbnails]
        scores.append(brightness_scores)

        # 色の一致度の評価（例: 色相ヒストグラムの類似度）
        reference_histogram = cv2.calcHist([thumbnails[0]], [0, 1, 2], None, [
            8, 8, 8], [0, 256, 0, 256, 0, 256])
        color_similarity_scores = [cv2.compareHist(reference_histogram, cv2.calcHist([frame], [0, 1, 2], None, [
            8, 8, 8], [0, 256, 0, 256, 0, 256]), cv2.HISTCMP_CORREL) for frame in thumbnails]
        scores.append(color_similarity_scores)

        # 各アルゴリズムの評価スコアを正規化
        normalized_scores = []
        for score_list in scores:
            min_score = min(score_list)
            max_score = max(score_list)
            normalized_scores.append(
                [(score - min_score) / (max_score - min_score) for score in score_list])

        # 各サムネイルの総合評価スコアを計算
        total_scores = np.mean(normalized_scores, axis=0)

        # 最も高い評価スコアを持つサムネイルを選択
        best_thumbnail_index = np.argmax(total_scores)
        best_thumbnail = thumbnails[best_thumbnail_index]
        return best_thumbnail

    def open_image_file(self, image):
        ret, img_encode = cv2.imencode('.png', image)
        str_encode = img_encode.tostring()
        img_byteio = BytesIO(str_encode)
        img_byteio.name = 'img.jpg'
        reader = BufferedReader(img_byteio)
        return reader


class WalletAccount:
    def __init__(self, private_key: str) -> None:
        _account = Account.from_key(private_key)
        self.private_key = private_key
        self.address = _account.address
        print(f"アカウントのウォレットアドレス: {self.address}")


class Contract:
    def __init__(
        self,
        account: WalletAccount,
        contract_address: str,
        abi_path: str,
        http_provider: str = "https://rpc-mumbai.maticvigil.com/",
    ):
        self.contract_owner = account
        self.network = Web3(Web3.HTTPProvider(http_provider))
        self.network.middleware_onion.inject(geth_poa_middleware, layer=0)

        if not self.network.is_connected():
            print("Ethereum Networkとの接続に失敗しました。終了します。")
            exit(-1)
        self.contract = self.network.eth.contract(
            address=Web3.to_checksum_address(contract_address), abi=self._load_abi(abi_path)
        )

        name = self.contract.functions.name().call()
        print(f"スマートコントラクトの初期化に成功しました. コントラクト名: {name}")

    @staticmethod
    def _load_abi(api_json_path: str):
        with open(api_json_path, "r") as j:
            return json.load(j)

    def _execute(self, tx):
        """トランザクション実行の共通処理"""
        signed_tx = self.network.eth.account.sign_transaction(
            tx, self.contract_owner.private_key
        )
        # トランザクションの送信
        tx_hash = self.network.eth.send_raw_transaction(
            signed_tx.rawTransaction)

        return self.network.eth.wait_for_transaction_receipt(tx_hash)

    def mint_nft(self, address: str, tokenURI: str):
        """NFTを発行する

        Args:
            address (str): 所有者のウォレットアドレス
            sentence (str): 文章
        """
        tx = self.contract.functions.mintNFT(
            Web3.to_checksum_address(address), tokenURI
        ).build_transaction(
            {
                "nonce": self.network.eth.get_transaction_count(
                    self.contract_owner.address,
                ),
                "from": self.contract_owner.address,
            }
        )
        print(self.network.eth.estimate_gas(tx))
        return self._execute(tx)

    def get_tokenURI(self, tokenId: int) -> str:
        """トークンIDから文章を取得する

        Args:
            tokenId (int): 対象のトークンID

        Returns:
            str: NFTに記録された文字列
        """
        return self.contract.functions.tokenURI(tokenId).call()

    def transfer(self, from_address, to_address, tokenid):
        """指定したトークンを転送する

        Args:
            tokenId (int): 対象のトークンID
        """
        if from_address != self.contract_owner.address:
            self.contract.functions.approve(from_address, tokenid).call()
        self.contract.functions.safeTransferFrom(
            from_address, to_address, tokenid).call()

    def send_matic(self, from_address: str, to_address: str, value: int):
        nonce = self.network.eth.get_transaction_count(from_address)
        max_priority_fee = self.network.eth.max_priority_fee
        gas_price = self.network.eth.gas_price
        print(max_priority_fee)
        print(gas_price)
        self.network.eth.generate_gas_price()
        tx = {
            'chainId': 80001,
            'from': from_address,
            'to': to_address,
            'value': value,
            'nonce': nonce,
            'gasPrice': gas_price
        }
        estimate = self.network.eth.estimate_gas(tx)
        tx["gas"] = estimate
        print(estimate)
        print(tx)
        return self._execute(tx)