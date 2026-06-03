# コーディング規約 — ano_video_post

## 目次

1. [全般ルール](#1-全般ルール)
2. [Python / Django](#2-python--django)
3. [JavaScript / Vue.js](#3-javascript--vuejs)
4. [ブロックチェーン / NFT](#4-ブロックチェーン--nft)
5. [HTML テンプレート](#5-html-テンプレート)
6. [ファイル・ディレクトリ構成](#6-ファイルディレクトリ構成)
7. [Git / ブランチ運用](#7-git--ブランチ運用)
8. [CI チェック一覧](#8-ci-チェック一覧)
9. [禁止事項](#9-禁止事項)

---

## 1. 全般ルール

- 文字コードは **UTF-8**（`requirements.txt` のみ歴史的経緯で UTF-16）
- 改行コードは **LF**（`.gitattributes` で統一）
- インデントは Python が **スペース 4 つ**、JS/HTML が **スペース 2 つ**
- 末尾の空白は削除する
- ファイル末尾は空行 1 行で終わらせる
- コメントは **なぜ** その実装になっているかを書く。何をしているかはコードで表現する
- 秘密情報（API キー、秘密鍵、パスワード）はコードに書かない — **`.env` から環境変数経由で取得する**

---

## 2. Python / Django

### 2.1 コードスタイル

- **PEP 8** に準拠する
- 1 行の最大文字数: **127 文字**（CI: `flake8 --max-line-length=127`）
- マイグレーションファイルは lint 対象外（CI: `--exclude=migrations`）
- 型ヒントは新規関数に積極的に付与する

```python
# Good
def get_video_by_tag(tag_name: str) -> list["Video"]:
    ...

# Bad
def get_video_by_tag(tag_name):
    ...
```

### 2.2 Django モデル

- `Meta` クラスで `verbose_name` / `verbose_name_plural` を日本語で定義する
- `__str__` は必ず実装する
- 外部キーには `on_delete` を明示する
- マイグレーションは 1 機能 1 ファイルを基本とする

### 2.3 ビュー

- ロジックはビューに書かず、モデルメソッドやユーティリティ関数に分離する
- `request.POST` への直接アクセスより `Form` クラスを使う
- CSRF トークンは Django の仕組みに任せ、手動で無効化しない

### 2.4 環境変数

- `django-environ` を使い、`.env` から読み込む
- `settings.py` に秘密情報を直書きしない

```python
# Good
import environ
env = environ.Env()
SECRET_KEY = env("DJANGO_SECRET_KEY")

# Bad
SECRET_KEY = "my-hardcoded-secret-key"
```

### 2.5 暗号処理

- 乱数は `os.urandom()` または `secrets` モジュールを使う（**`random` モジュール禁止**）
- AES・RSA 実装は `pycryptodome` を使い、自前実装を増やさない
- 鍵素材はコードに埋め込まず、環境変数または鍵管理サービスから取得する

### 2.6 ロギング

- `print()` / `pprint()` は本番コードに残さない
- 秘密情報を含む変数は `logging.debug()` 止まりにする（`INFO` 以上で出力しない）

```python
# Good
logger.debug("wallet_address=%s", wallet_addr)

# Bad
print("wallet_address:", wallet_addr)
```

---

## 3. JavaScript / Vue.js

### 3.1 コードスタイル

- ES2020+ 構文を使用する
- 変数宣言は `const` / `let` を使い、`var` は使わない
- セミコロンあり、シングルクォート統一

### 3.2 Vue.js 3

- `Options API` / `Composition API` どちらも可。ファイル内で混在させない
- コンポーネント名はパスカルケース（`VideoCard.vue`）
- `v-html` ディレクティブはサーバーから受け取った文字列には使わない（XSS リスク）

### 3.3 DOM 操作

- `innerHTML` への代入はアプリ制御コンテンツに限定する。ユーザー入力由来の値を渡すことを**禁止**する
- `document.write()` の使用を**禁止**する
- `eval()` の使用を**禁止**する

```javascript
// Good（アプリ制御のテンプレートのみ）
element.innerHTML = buildModalTemplate(videoId, videoTitle);

// Bad（ユーザー入力を渡す）
element.innerHTML = userInputString;
```

### 3.4 シークレット管理

- JS ファイルに API キー・秘密鍵をハードコードしない
- サーバーサイドが署名・暗号化し、フロントエンドには公開情報のみ渡す
- フロントエンドで Ethereum 秘密鍵を扱わない（CI でパターン検査される）

---

## 4. ブロックチェーン / NFT

### 4.1 秘密鍵・API キー

- `WALLET_PRIVATE_KEY` / `NFT_STORAGE_API_KEY` は必ず環境変数から読み込む
- Ethereum 秘密鍵（`0x` + 64 桁 16 進数）のハードコードは CI エラーになる
- テスト用でも実際の秘密鍵をコードにコミットしない

### 4.2 トランザクション

- `send_raw_transaction()` 呼び出し前に `Web3.is_address()` でアドレスを検証する

```python
# Good
if not Web3.is_address(recipient):
    raise ValueError(f"無効なアドレス: {recipient}")
w3.eth.send_raw_transaction(signed_tx.rawTransaction)

# Bad
w3.eth.send_raw_transaction(signed_tx.rawTransaction)
```

### 4.3 エラーハンドリング

- IPFS アップロード等で `except Exception: pass` は禁止（CI のカスタムルールで検出される）
- 必ずエラーをロギングするか、上位に伝播させる

```python
# Good
try:
    response = nft_storage.upload(data)
except Exception as e:
    logger.error("IPFS upload failed: %s", e)
    raise

# Bad
try:
    response = nft_storage.upload(data)
except Exception:
    pass
```

### 4.4 乱数・暗号

- NFT / 暗号ファイル（`nft.py`, `aescrypt.py`, `rsacrypto.py`）で `import random` は CI WARNING になる
- `os.urandom()` または `secrets` モジュールを使う

---

## 5. HTML テンプレート

- Django テンプレートタグ内でロジックを書かない（ビューまたはテンプレートタグに移す）
- CSRF トークンは `{% csrf_token %}` を全フォームに含める
- `{{ var }}` の自動エスケープを `safe` フィルタで無効化する場合はコードレビュー必須

---

## 6. ファイル・ディレクトリ構成

```
videopost/
├── models.py          # ORM モデル
├── views.py           # ビュー（薄く保つ）
├── urls.py            # URL ルーティング
├── forms.py           # フォームクラス
├── nft.py             # ブロックチェーン / NFT ロジック
├── aescrypt.py        # AES 暗号処理
├── rsacrypto.py       # RSA 暗号処理
├── utils.py           # 汎用ユーティリティ
├── signals.py         # シグナルハンドラ
├── middleware.py      # カスタムミドルウェア
├── storage.py         # ストレージバックエンド
├── templates/         # HTML テンプレート
├── static/
│   ├── js/            # JavaScript（ファイル名は snake_case）
│   ├── css/           # スタイルシート
│   └── abi/           # スマートコントラクト ABI JSON
└── migrations/        # マイグレーション（自動生成、直接編集しない）
```

- アプリロジックは `videopost/` 以下に集約する
- `config/` は設定のみ（ビジネスロジックを置かない）
- 一時ファイルは `videopost/static/materials/` に出力し、`.gitignore` に含める

---

## 7. Git / ブランチ運用

### 7.1 ブランチ戦略

- `main`: 本番相当。直接 push 禁止、PR 経由のみ
- 機能ブランチ: `feature/<機能名>`
- バグ修正: `fix/<修正内容>`
- セキュリティ修正: `security/<内容>` （優先マージ）

### 7.2 コミットメッセージ

Conventional Commits 形式を使う:

```
<type>(<scope>): <概要（日本語可）>

<本文（なぜこの変更が必要か）>
```

| type | 用途 |
|------|------|
| `feat` | 新機能 |
| `fix` | バグ修正 |
| `security` | セキュリティ修正 |
| `refactor` | 動作を変えないリファクタリング |
| `test` | テスト追加・修正 |
| `ci` | CI 設定変更 |
| `docs` | ドキュメントのみの変更 |
| `chore` | ビルド・依存関係等の雑務 |

### 7.3 PR ルール

- `main` への PR は CI チェック全通過を必須とする
- セキュリティ関連の変更は PR 説明に影響範囲を記載する
- マイグレーションファイルを含む PR はスキーマ変更内容を説明する

---

## 8. CI チェック一覧

### 8.1 `ci.yml` — push/PR on `main`

| ジョブ | ツール | 内容 |
|--------|--------|------|
| Lint | flake8 | PEP8 準拠チェック（最大 127 文字、migrations 除外） |
| Security Scan | Bandit | Python SAST（中以上の深刻度・確信度） |
| Security Scan | pip-audit | 依存ライブラリの既知脆弱性チェック |
| Django Check | manage.py check | Django 設定の整合性確認 |

**Bandit 結果**は `bandit-results.json` としてアーティファクト保存（30 日保持）

### 8.2 `codeql.yml` — push/PR on `main` + 毎週月曜 09:00 UTC

| 対象言語 | クエリセット |
|----------|-------------|
| Python | `security-extended`, `security-and-quality` |
| JavaScript | `security-extended`, `security-and-quality` |

結果は GitHub Security タブに表示される。

### 8.3 `secret-scan.yml` — push/PR on `main`

| ツール | 内容 |
|--------|------|
| Gitleaks | コミット履歴全体のシークレット検出（fetch-depth: 0） |

アローリスト対象:
- `videopost/static/js/rsa/node-rsa-js.js`（ライブラリソース内の PEM パターン）
- コミット `af4cca74`（過去に流出した鍵を含む履歴コミット、鍵は破棄済み）

### 8.4 `security-pr.yml` — PR on `main` のみ

#### Backend Security（Django / Python）

| ツール | ルールセット | SARIF カテゴリ |
|--------|-------------|---------------|
| Bandit | 中以上 severity/confidence | `bandit-python` |
| Semgrep | `p/django`, `p/python`, `p/owasp-top-ten` | `semgrep-backend` |
| Django check | — | — |

#### Frontend Security（JavaScript / Vue.js）

| ツール | ルールセット | SARIF カテゴリ |
|--------|-------------|---------------|
| Semgrep | `p/javascript`, `p/xss`, `p/secrets` | `semgrep-frontend` |
| grep | `eval()`, `innerHTML =`, `document.write()` | — |
| grep | API キー・秘密鍵のハードコードパターン | — |

`eval()` / `document.write()` / ハードコードキー検出時は **CI 失敗**。  
`innerHTML` 検出は **WARNING**（アプリ制御コンテンツの場合はレビューで承認）。

#### NFT / Blockchain Security

| ツール | 検査内容 | SARIF カテゴリ |
|--------|---------|---------------|
| Semgrep | `p/secrets`（NFT/暗号ファイル対象） | `semgrep-nft` |
| Semgrep カスタム | `.github/semgrep/nft-rules.yml`（11 ルール） | `semgrep-nft-custom` |
| grep | `0x` + 64 桁 16 進数（Ethereum 秘密鍵） | — |
| grep | `import random` in 暗号ファイル | — |
| grep | `print/pprint` に秘密情報を含む変数 | — |
| grep | `eval()` in 暗号ファイル | — |
| grep | `NFT_STORAGE_API_KEY` / `WALLET_PRIVATE_KEY` のハードコード | — |

いずれか検出時は **CI 失敗**。

#### カスタム Semgrep ルール一覧（`nft-rules.yml`）

| ルール ID | 深刻度 | CWE | 内容 |
|-----------|--------|-----|------|
| `nft-hardcoded-eth-private-key` | ERROR | CWE-321 | Ethereum 秘密鍵ハードコード |
| `nft-weak-random-in-crypto` | WARNING | CWE-338 | 暗号ファイルでの `random` モジュール使用 |
| `nft-eval-usage` | ERROR | CWE-95 | `eval()` 使用 |
| `nft-sensitive-data-in-print` | WARNING | CWE-532 | 秘密情報を含む `print`/`pprint` |
| `nft-unvalidated-transaction-address` | WARNING | CWE-20 | トランザクション送信前のアドレス未検証 |
| `nft-js-private-key-in-variable` | ERROR | CWE-312 | JS での秘密鍵変数格納 |
| `nft-hardcoded-aes-key` | ERROR | CWE-321 | AES 鍵ハードコード |
| `nft-broad-exception-in-ipfs` | WARNING | — | IPFS 処理での例外握りつぶし |

### 8.5 Dependabot — 毎週月曜 09:00 JST

| 対象 | グループ |
|------|---------|
| pip | Django 系、Web3 系、メディア処理系、暗号化系 |
| GitHub Actions | — |

レビュー担当: `Daisuke106`  
ラベル: `依存関係`, `Python`, `GitHub-Actions`

---

## 9. 禁止事項

以下は CI で検出・ブロックされるか、コードレビューで必ず指摘する。

| 禁止内容 | 理由 | 対処法 |
|----------|------|--------|
| 秘密鍵・API キーのハードコード | 漏洩リスク | `.env` + `django-environ` |
| `eval()` の使用 | コードインジェクション (CWE-95) | 安全な代替実装に置換 |
| 暗号処理での `random` モジュール | 予測可能乱数 (CWE-338) | `os.urandom()` / `secrets` |
| `document.write()` の使用 | XSS リスク | DOM API を使う |
| ユーザー入力を `innerHTML` に渡す | XSS リスク | `textContent` / エスケープ処理 |
| JS ファイルへの秘密鍵格納 | 鍵漏洩 (CWE-312) | サーバーサイドのみで処理 |
| AES 鍵のハードコード | 鍵漏洩 (CWE-321) | 環境変数 / 鍵管理サービス |
| IPFS 処理で `except Exception: pass` | 障害隠蔽 | 適切なログ + 例外伝播 |
| 本番コードに `print()`/`pprint()` | 情報漏洩 (CWE-532) | `logging` モジュールを使う |
| アドレス未検証でのトランザクション送信 | 誤送金 (CWE-20) | `Web3.is_address()` で事前検証 |
