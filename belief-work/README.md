# 思い込みを手放す14日ワーク

既存のワークと独立した Apps Script ウェブアプリです。運営用シートは運営担当者に限定します。

1. 新規 Apps Script に Code.gs と Index.html（ファイル名 Index）を配置します。WORK_DOCUMENT_ID と WORK_SHEET_ID をスクリプト プロパティで指定します。
2. ウェブアプリを所有者として実行する設定にします。受講者がアクセスできる公開範囲の承認を得た上でデプロイし、/exec URL を控えます。
3. Google Cloud の Google Auth Platform でウェブアプリ用 OAuth クライアントを作り、承認済みリダイレクト URI に同じ /exec URL を追加します。外部テスト中は Google Cloud 側にもテストユーザーを登録します。
4. GOOGLE_OAUTH_CLIENT_ID、GOOGLE_OAUTH_CLIENT_SECRET、GOOGLE_OAUTH_REDIRECT_URI をスクリプト プロパティに設定します。シークレットは GitHub に保存しません。
5. 運営シートの「受講者アクセス」タブの A2 以下に対象メールを登録します。「参加者」の E/F 列はメールと Google アカウント ID に使います。
6. 登録済み・未登録の別アカウントでログインを検証し、登録済みアカウントの Day 1 提出、再ログイン、翌日0時の解放、Day 1 とワークまとめの反映を確認します。

Googleログイン後に氏名と4桁の暗証番号で初回登録します。次回は同じGoogleアカウントでログインして暗証番号を入力します。
「ワークまとめ」の確認ポイントは提出状況で自動表示されます。生成AIの回答分析は未接続です。
