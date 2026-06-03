# セキュリティポリシー — ano_video_post

## 目次

1. [概要](#1-概要)
2. [セキュリティ原則](#2-セキュリティ原則)
3. [シークレット管理](#3-シークレット管理)
4. [CI セキュリティチェック体制](#4-ci-セキュリティチェック体制)
5. [バックエンドセキュリティ要件](#5-バックエンドセキュリティ要件)
6. [フロントエンドセキュリティ要件](#6-フロントエンドセキュリティ要件)
7. [ブロックチェーン / NFT セキュリティ要件](#7-ブロックチェーン--nft-セキュリティ要件)
8. [依存関係管理](#8-依存関係管理)
9. [インシデント対応](#9-インシデント対応)
10. [過去のインシデント記録](#10-過去のインシデント記録)
11. [脆弱性報告](#11-脆弱性報告)

---

## 1. 概要

本ドキュメントは **ano_video_post**（Django ベースの動画 SNS + ブロックチェーン NFT プラットフォーム）における
セキュリティポリシーを定める。

このプロジェクトは以下の高リスク要素を含むため、セキュリティ対策を多層化している:

- Ethereum ウォレット秘密鍵の取り扱い
- NFT.Storage / IPFS へのコンテンツアップロード
- Cloudinary への動画アップロード・配信
- AES / RSA 暗号処理（カスタム実装）
- ユーザー生成コンテンツ（動画・タグ）の処理

---

## 2. セキュリティ原則

### 2.1 最小権限の原則

- 各サービスアカウントは必要最小限の権限のみ付与する
- Cloudinary API キーは読み取り専用と書き込み権限を分離することを推奨する
- ウォレットのトランザクション権限はテストネット限定とする（本番移行時は再評価）

### 2.2 多層防御

CI で 4 種類のセキュリティチェックを組み合わせている（[4章](#4-ci-セキュリティチェック体制)参照）。
1 つのツールが見逃した問題を別のツールが検出するよう設計されている。

### 2.3 秘密情報の環境分離

| 環境 | シークレット管理 |
|------|----------------|
| ローカル開発 | `.env` ファイル（Git 管理外） |
| CI（GitHub Actions） | GitHub Secrets |
| 本番 | 別途設定（本番環境のシークレット管理サービスを使用） |

---

## 3. シークレット管理

### 3.1 必須環境変数

以下の変数は `.env` で管理し、コードに直接書かない:

| 変数名 | 説明 | CI ダミー値 |
|--------|------|------------|
| `DJANGO_SECRET_KEY` | Django 秘密鍵 | `ci-only-placeholder-key-...` |
| `CLOUDINARY_NAME` | Cloudinary クラウド名 | `ci-dummy` |
| `CLOUDINARY_API_KEY` | Cloudinary API キー | `000000000000000` |
| `CLOUDINARY_API_SECRET` | Cloudinary API シークレット | `ci-dummy-secret` |
| `WALLET_PRIVATE_KEY` | Ethereum ウォレット秘密鍵 | （CI では使用しない） |
| `NFT_STORAGE_API_KEY` | NFT.Storage API キー | （CI では使用しない） |

### 3.2 禁止事項

- `settings.py` / ソースコードへの秘密情報の直書き
- `requirements.txt` や設定ファイルへの認証情報の記載
- テストコード（`test.py`, `tests.py`）へのクレデンシャル埋め込み
- フロントエンド JS ファイルへの秘密鍵・API キーの記載

> **注意**: `test.py` に Cloudinary の認証情報がハードコードされているため、
> 速やかに環境変数に移行し、該当キーをローテーションすること。

### 3.3 `.gitignore` で除外するファイル

```
.env
*.pem
*.key
db.sqlite3
videopost/static/materials/
```

---

## 4. CI セキュリティチェック体制

### 4.1 全体フロー

```
push / PR to main
    │
    ├── ci.yml
    │     ├── Lint (flake8)
    │     ├── Security Scan (Bandit + pip-audit)
    │     └── Django Check (manage.py check)
    │
    ├── codeql.yml
    │     └── CodeQL Analysis (Python + JavaScript)
    │
    ├── secret-scan.yml
    │     └── Gitleaks (全コミット履歴)
    │
    └── security-pr.yml  ← PR のみ
          ├── Backend Security
          │     ├── Bandit SAST (SARIF → Security タブ)
          │     ├── Semgrep (django / python / owasp-top-ten)
          │     └── Django 設定チェック
          ├── Frontend Security
          │     ├── Semgrep (javascript / xss / secrets)
          │     └── grep パターン検査
          └── NFT/Blockchain Security
                ├── Semgrep (secrets)
                ├── Semgrep カスタムルール (nft-rules.yml)
                └── grep パターン検査（秘密鍵・eval 等）
```

### 4.2 ワークフロー別詳細

#### `ci.yml` — push/PR on `main`

**Job: Lint (flake8)**
```
対象: videopost/ env1/ manage.py
設定: --max-line-length=127 --exclude=migrations
失敗条件: flake8 がエラーを報告した場合
```

**Job: Security Scan**
```
Bandit:
  対象: videopost/ env1/
  条件: severity >= medium, confidence >= medium
  出力: bandit-results.json（アーティファクト 30 日保持）
  ※ --exit-zero のため CI は失敗しないが結果を確認すること

pip-audit:
  対象: requirements-ci.txt（UTF-16 → UTF-8 変換済み）
  除外: pywin32（Linux CI 環境のため）
  失敗条件: || true のため CI は失敗しないが結果を確認すること
```

**Job: Django Check**
```
対象: manage.py check
前提: CI 用ダミー .env を生成してから実行
失敗条件: Django 設定エラーが発生した場合
```

#### `codeql.yml` — push/PR on `main` + 毎週月曜 09:00 UTC

```
言語: python, javascript（並列実行）
クエリ: security-extended, security-and-quality
結果: GitHub Security タブ（Alerts）に集約
定期スキャン: 毎週月曜でゼロデイ脆弱性の継続監視
```

#### `secret-scan.yml` — push/PR on `main`

```
ツール: Gitleaks v2
スキャン範囲: 全コミット履歴（fetch-depth: 0）
アローリスト:
  - videopost/static/js/rsa/node-rsa-js.js（PEM パターンを含むライブラリ）
  - コミット af4cca74（過去流出鍵を含む履歴）
失敗条件: アローリスト外でシークレットが検出された場合
```

#### `security-pr.yml` — PR on `main` のみ

**Job 1: Backend Security**

| チェック | ツール | 深刻度設定 | CI 結果 |
|---------|--------|-----------|---------|
| Python SAST | Bandit | medium 以上 | SARIF → Security タブ |
| Django/Python/OWASP | Semgrep | — | SARIF → Security タブ |
| Django 設定 | manage.py check | — | エラーで失敗 |

**Job 2: Frontend Security**

| チェック | 対象 | CI 結果 |
|---------|------|---------|
| Semgrep (JS/XSS/Secrets) | `videopost/static/js/`, `videopost/templates/` | SARIF → Security タブ |
| `eval()` 検出 | 同上 | **CI 失敗** |
| `innerHTML =` 検出 | 同上 | WARNING のみ（アプリ制御コンテンツは許容） |
| `document.write()` 検出 | 同上 | **CI 失敗** |
| API キー・秘密鍵ハードコード | `videopost/static/js/` | **CI 失敗** |

**Job 3: NFT / Blockchain Security**

| チェック | 対象 | CI 結果 |
|---------|------|---------|
| Semgrep Secrets | NFT/暗号ファイル群 | SARIF → Security タブ |
| カスタム Semgrep ルール | `videopost/` | SARIF → Security タブ |
| Ethereum 秘密鍵（`0x` + 64 桁 16 進数） | `videopost/` | **CI 失敗** |
| `import random` in 暗号ファイル | nft.py/aescrypt.py/rsacrypto.py | **CI 失敗** |
| `print/pprint` + 秘密情報変数 | nft.py/aescrypt.py/rsacrypto.py | **CI 失敗** |
| `eval()` in 暗号ファイル | nft.py/aescrypt.py/rsacrypto.py | **CI 失敗** |
| `NFT_STORAGE_API_KEY` / `WALLET_PRIVATE_KEY` ハードコード | `videopost/`, `env1/` | **CI 失敗** |

---

## 5. バックエンドセキュリティ要件

### 5.1 Django セキュリティ設定

本番環境では以下を確認すること:

```python
DEBUG = False                     # 本番では必ず False
ALLOWED_HOSTS = ["your-domain.com"]  # ワイルドカード禁止
CSRF_COOKIE_SECURE = True         # HTTPS 環境で有効化
SESSION_COOKIE_SECURE = True      # HTTPS 環境で有効化
SECURE_SSL_REDIRECT = True        # HTTP → HTTPS リダイレクト
```

### 5.2 SQL インジェクション防止

- Django ORM を使い、生 SQL（`raw()`, `extra()`）の使用は最小化する
- やむなく生 SQL を使う場合はパラメータバインディングを使う（文字列結合禁止）

### 5.3 認証・認可

- `@login_required` / パーミッションチェックを適切に実施する
- セッション固定攻撃を防ぐため、ログイン後に `request.session.cycle_key()` を呼ぶ

### 5.4 ファイルアップロード

- アップロードされたファイルの拡張子とコンテンツタイプを検証する
- 実行可能ファイルのアップロードを拒否する
- Cloudinary 経由のアップロードを優先し、ローカルディスクへの直接保存を避ける

---

## 6. フロントエンドセキュリティ要件

### 6.1 XSS 防止

| 操作 | 推奨 | 禁止 |
|------|------|------|
| DOM へのテキスト挿入 | `textContent` / `innerText` | `innerHTML`（ユーザー入力由来） |
| Vue テンプレート | `{{ var }}`（自動エスケープ） | `v-html`（ユーザー入力由来） |
| 動的スクリプト生成 | 使用しない | `eval()`, `document.write()` |

### 6.2 API キー管理

- Cloudinary 署名付きアップロード URL の生成はサーバーサイドで行う
- フロントエンドには `公開 API キー`（write 権限なし）のみを渡す
- Ethereum 秘密鍵は絶対にフロントエンドに渡さない

### 6.3 依存ライブラリ

- `videopost/static/js/rsa/node-rsa-js.js` はベンダードライブラリ（Gitleaks アローリスト対象）
- サードパーティ JS の更新は都度セキュリティアドバイザリを確認する

---

## 7. ブロックチェーン / NFT セキュリティ要件

### 7.1 秘密鍵の取り扱い

```
原則: 秘密鍵は「生成 → 使用 → 破棄」のサイクルをメモリ上のみで行う
禁止: 秘密鍵をデータベース・ファイル・ログに保存する
禁止: 秘密鍵をフロントエンドに送信する
必須: 秘密鍵は環境変数 WALLET_PRIVATE_KEY から取得する
```

### 7.2 スマートコントラクト

- コントラクト ABI (`static/abi/ExampleNFT.json`) の更新時はデプロイアドレスも合わせて更新する
- テストネット（Polygon Mumbai）と本番ネットを設定で切り替えられるようにする
- トランザクション実行前に必ずアドレス検証 (`Web3.is_address()`) を行う

### 7.3 IPFS / NFT.Storage

- メタデータに個人情報（ウォレットアドレス以外）を含めない
- アップロード失敗は握りつぶさず、適切にロギング・再試行処理を行う
- `NFT_STORAGE_API_KEY` は環境変数から取得し、ローテーション手順を用意する

### 7.4 乱数・暗号処理

- `nft.py`, `aescrypt.py`, `rsacrypto.py` での乱数は `os.urandom()` / `secrets` を使う
- AES 鍵長は 256 ビット以上を使用する
- RSA 鍵長は 2048 ビット以上を使用する

---

## 8. 依存関係管理

### 8.1 Dependabot 自動更新

毎週月曜 09:00 JST に以下を自動 PR:

| グループ | パッケージパターン |
|---------|-----------------|
| Django 系 | `django*` |
| Web3 系 | `web3*`, `eth-*` |
| メディア処理系 | `cloudinary*`, `moviepy*`, `opencv*`, `Pillow*`, `imageio*` |
| 暗号化系 | `pycryptodome*`, `cryptography*` |
| GitHub Actions | 全アクション |

### 8.2 脆弱性対応 SLA

| 深刻度 | 対応期限 |
|--------|---------|
| Critical | 24 時間以内 |
| High | 7 日以内 |
| Medium | 30 日以内 |
| Low | 次回定期メンテナンス時 |

### 8.3 pip-audit 結果の確認

`ci.yml` の pip-audit は `|| true` のため CI は失敗しないが、
結果を定期的に確認し、HIGH 以上の脆弱性は SLA に従って対応すること。

---

## 9. インシデント対応

### 9.1 シークレット漏洩が発生した場合

1. **即時対応**（1 時間以内）
   - 該当サービスで認証情報を失効・ローテーションする
   - コミット履歴に秘密情報が含まれる場合は `git filter-repo` で除去する
   - `.gitleaks.toml` の `commits` アローリストに該当コミットを追加する

2. **調査**
   - Gitleaks でスキャンし、他の漏洩がないか確認する
   - GitHub の Secret Scanning アラートを確認する
   - 漏洩した認証情報が悪用されていないか各サービスのログを確認する

3. **再発防止**
   - ポストモーテムを作成し、漏洩経路を特定する
   - 該当パターンを Semgrep / Gitleaks ルールに追加する

### 9.2 脆弱性が報告された場合

1. GitHub Security Advisories でプライベートに報告を受け付ける
2. 内容を確認・再現検証する
3. 修正 PR を `security/<内容>` ブランチで作成する（優先マージ）
4. 必要に応じて CVE を申請する

---

## 10. 過去のインシデント記録

### 2023-11-14: RSA 秘密鍵のコミット混入

- **コミット**: `af4cca740609e58acd833b1d3ae1f66c4de926f4`
- **内容**: `private.pem` がリポジトリにコミットされた
- **対応**: 当該コミットを Gitleaks アローリストに追加（履歴は残るが検出対象外とした）
- **鍵の状態**: **廃棄済み** — 再使用禁止
- **教訓**: `.gitignore` に `*.pem` を追加。秘密鍵生成後は即座にパスを確認する

> この鍵（`private.pem`）は漏洩済みのため、如何なる環境でも再使用してはならない。

---

## 11. 脆弱性報告

セキュリティ上の問題を発見した場合は、Issue ではなく以下の方法で非公開報告してください:

- **GitHub Security Advisories**: リポジトリの Security タブ → "Report a vulnerability"
- **Email**: daisuke.mtc@gmail.com

公開 Issue での脆弱性報告はしないでください。

---

*最終更新: 2026-06-03*
