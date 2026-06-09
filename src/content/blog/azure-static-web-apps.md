---
title: "Azure Static Web Appsで作るゼロコストブログ基盤"
description: "WordPressを捨て、Astro + Azure Static Web Appsに移行することで管理コストをほぼゼロにする設計を解説する。"
date: 2026-04-14
tags: [azure, devops]
readingTime: 5
likes: 33
---

## はじめに

Microsoft AzureのStatic Web Appsサービスを使えば、静的サイトを無料でホスティングし、GitHubプッシュと同時に自動デプロイが走る環境を5分で構築できます。

## Azure Static Web Appsとは

Azure Static Web Appsは、GitHubリポジトリと連携して静的サイトを自動ビルド・デプロイするMicrosoftのマネージドサービスです。

**無料プランの主なスペック：**
- カスタムドメイン対応（SSL証明書も無料）
- GitHub Actions自動デプロイ
- グローバルCDN配信
- 月間帯域100GB

## セットアップ手順

### 1. Azureポータルでリソース作成

```bash
az staticwebapp create \
  --name innospot \
  --resource-group my-rg \
  --source https://github.com/innonynet/innospot \
  --branch main \
  --app-location "/" \
  --output-location "dist"
```

### 2. GitHub Actionsの自動生成

リソース作成後、AzureはリポジトリにGitHub Actionsワークフローを自動追加します。

### 3. カスタムドメイン設定

Azureポータル → Static Web App → カスタムドメイン → `+追加` からドメインを入力し、DNSレコードをドメインレジストラに設定するだけです。

## まとめ

Static Web Appsは小規模サイトの本番運用に最適なサービスです。
