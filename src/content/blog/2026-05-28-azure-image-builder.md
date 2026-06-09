---
title: "Azure Image BuilderでゴールデンVMイメージを量産する"
description: "Packer内部実装との比較を交えながら、エンタープライズ環境での実用的な構成を解説。カスタマイズスクリプトの管理からマルチリージョン配布まで。"
date: 2026-05-28
tags: [azure, devops]
readingTime: 8
likes: 31
---

## Azure Image Builder（AIB）とは

Azure Image BuilderはHashicorp Packerをバックエンドに使ったマネージドサービスです。`IaasVMImageTemplate`リソースを定義するだけで、カスタムVMイメージのビルド・テスト・配布を自動化できます。

## Packerとの使い分け

| 観点 | Packer (OSS) | Azure Image Builder |
|---|---|---|
| 設定形式 | HCL / JSON | ARM / Bicep / Terraform |
| ステート管理 | なし | Azureリソースとして管理 |
| ロールバック | 手動 | イメージバージョンで管理 |
| クロスクラウド | ○ | × (Azure限定) |
| エンタープライズ統合 | 別途設計 | Managed Identity/ACR連携 |

Azureオンリーの環境ならAIBのほうが運用が楽です。特にManaged Identityとの統合でシークレット管理が不要になる点が大きい。

## 基本的なIaasVMImageTemplateの構成

```bicep
resource imageTemplate 'Microsoft.VirtualMachineImages/imageTemplates@2022-02-14' = {
  name: 'golden-ubuntu-2204'
  location: resourceGroup().location
  identity: {
    type: 'UserAssigned'
    userAssignedIdentities: {
      '${managedIdentity.id}': {}
    }
  }
  properties: {
    source: {
      type: 'PlatformImage'
      publisher: 'Canonical'
      offer: '0001-com-ubuntu-server-jammy'
      sku: '22_04-lts-gen2'
      version: 'latest'
    }
    customize: [
      {
        type: 'Shell'
        name: 'InstallPackages'
        scriptUri: 'https://mystorageaccount.blob.core.windows.net/scripts/setup.sh'
      }
      {
        type: 'Shell'
        name: 'SystemdHarden'
        inline: [
          'systemctl disable snapd'
          'systemctl mask snapd'
        ]
      }
    ]
    distribute: [
      {
        type: 'SharedImage'
        galleryImageId: '${computeGallery.id}/images/ubuntu-golden/versions/1.0.0'
        replicationRegions: ['japaneast', 'japanwest']
        runOutputName: 'ubuntu-golden-output'
      }
    ]
    buildTimeoutInMinutes: 60
  }
}
```

## カスタマイズスクリプトの管理

`scriptUri`で指定するShellスクリプトはStorage Account（またはACR）に配置します。注意点は**SASトークンなしのアクセス**が必要なこと。Managed IdentityにStorage Blob Data Readerを付与して解決します。

```bash
#!/bin/bash
set -euo pipefail

# パッケージ更新
apt-get update -y
apt-get upgrade -y

# 監視エージェント
curl -sL https://aka.ms/InstallAzureCLIDeb | bash
az extension add --name azure-monitor-agent

# CISベンチマーク対応（最低限）
sed -i 's/#ClientAliveInterval 0/ClientAliveInterval 300/' /etc/ssh/sshd_config
sed -i 's/#MaxAuthTries 6/MaxAuthTries 3/' /etc/ssh/sshd_config
```

## ビルドトリガーの自動化

DevOpsパイプラインからビルドを発火させるには`az image builder run`を使います。

```yaml
# Azure DevOps Pipeline
- task: AzureCLI@2
  inputs:
    azureSubscription: $(SERVICE_CONNECTION)
    scriptType: bash
    scriptLocation: inlineScript
    inlineScript: |
      az image builder run \
        --name golden-ubuntu-2204 \
        --resource-group $(RESOURCE_GROUP) \
        --no-wait
      
      az image builder wait \
        --name golden-ubuntu-2204 \
        --resource-group $(RESOURCE_GROUP) \
        --custom "lastRunStatus.runState=='Succeeded'"
```

## 落とし穴

1. **ビルド用サブネット**：AIBはビルド時に一時的なVMを起動します。Private Linkを使う場合はサービスエンドポイントの設定が必要。
2. **タイムアウト**：デフォルト60分。重いカスタマイズは`buildTimeoutInMinutes`を伸ばす。
3. **ログ確認**：失敗時のログはPackerが書いたStorage AccountのBlobに出力されます。`az image builder show-runs`で確認。

## まとめ

Azure環境に閉じているならAIBはPackerより運用コストが低い選択肢です。Managed Identity統合とAzure Compute Galleryを組み合わせると、ゴールデンイメージのライフサイクル管理が一元化できます。
