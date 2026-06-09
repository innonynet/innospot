---
title: "TerraformからOpenTofuへの移行ガイド — BSLライセンス対応と実務的な判断ポイント"
description: "HashiCorp買収後のBSLライセンス変更を受け、CNCFに移管されたOpenTofuへの移行を実際に検討した記録。ツール差分・CI/CDへの影響・組織での意思決定フローまで整理。"
date: 2026-06-09
tags: [terraform, oss]
readingTime: 6
likes: 42
---

## TL;DR

- HashiCorpのBSLライセンス変更により、社内規定次第でTerraform継続利用にリスクが生じる
- OpenTofuはTerraform 1.5相当のforkで、CLIコマンドはほぼ互換
- 移行コストは低いが、プロバイダーの検証とCI/CDパイプラインの調整が必要

## なぜ今OpenTofuが話題になっているか

2023年8月、HashiCorpはTerraformのライセンスをMPL 2.0からBSL（Business Source License）1.1へ変更しました。BSLの主な制約は「HashiCorpの競合製品としての商用利用禁止」です。

インフラSEとして実務でTerraformを使う立場からすると、「競合製品」の定義が曖昧なのが一番のリスクです。自社がIaCコンサルや運用代行を業務としている場合、法務確認なしに継続利用するのは怖い。

OpenTofuはCNCFに寄贈されたTerraformのforkで、MPLライセンスを維持しています。2024年にv1.6がGA、現在はTerraform 1.8相当の機能に追いついています。

## Terraform vs OpenTofu：実務での差分

| 項目 | Terraform | OpenTofu |
|---|---|---|
| ライセンス | BSL 1.1 | MPL 2.0 |
| stateファイル | `.tfstate` | 互換（そのまま使える） |
| CLIコマンド | `terraform` | `tofu` |
| プロバイダー | registry.terraform.io | registry.opentofu.org |
| 暗号化state | なし | v1.7以降でネイティブ対応 |

stateファイルは互換なので、既存インフラを壊さずに段階的移行できます。

## 移行手順

### 1. OpenTofu CLIのインストール

```bash
# Homebrew (macOS/Linux)
brew install opentofu

# tfenvに相当するtofuenv
git clone https://github.com/tofuutils/tofuenv.git ~/.tofuenv
export PATH="$HOME/.tofuenv/bin:$PATH"
tofuenv install 1.8.0
tofuenv use 1.8.0
```

### 2. プロバイダーの動作確認

既存の`terraform.tf`をそのまま`tofu init`してみると、ほぼのケースで通ります。ただし、一部のサードパーティプロバイダーはTerraform registryのみに存在するものがあるので要確認。

```hcl
# providers.tf
terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"  # これはそのまま動く
      version = "~> 3.90"
    }
  }
}
```

### 3. CI/CDパイプラインの更新

GitHub Actionsの場合、`hashicorp/setup-terraform`を`opentofu/setup-opentofu`に差し替えます。

```yaml
# Before
- uses: hashicorp/setup-terraform@v3

# After
- uses: opentofu/setup-opentofu@v1
  with:
    tofu_version: "1.8.0"
```

## 組織で導入を検討する際の意思決定フロー

自社が純粋な「内部利用」のみであれば、BSLの制約には実質ひっかかりません。動かすかどうかは法務判断になりますが、実務的には以下のフローで検討しました：

1. **業態確認**：IaaSの提供・IaCコンサルをしているか？ → していない → Terraform継続でも問題なし（法務確認推奨）
2. **将来リスク評価**：HashiCorpのライセンス解釈が厳格化した場合のリスク許容度
3. **移行コスト試算**：小規模なら1スプリント以内

うちのチームは「将来の不確実性を排除したい」という理由でOpenTofu移行を選択しました。

## まとめ

移行コスト自体は低く、CLIを`terraform`から`tofu`に変えて`init`し直すだけで8割は済みます。残り2割はCI/CDとプロバイダーの確認です。BSLリスクを感じているチームは、まずステージング環境で`tofu plan`を実行してみることをおすすめします。
