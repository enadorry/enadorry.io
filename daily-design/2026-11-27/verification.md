# 11月27日版　制作標本室

[公開内容の棚卸し](inventory.json)には作品・説明・リンクとカウンターの設定を、[公開版との照合](public-check.json)には見出し・各図の説明・操作項目・動的表示を収録した。公開トップから内部リンクをたどり、8ページと音アプリのディレクトリ形式のURLも取得。全てHTTP 200で、改行を正規化したHTMLは本番の [5ccb520](https://github.com/enadorry/enadorry.io/commit/5ccb520af3dd899f2cb715481917f2fec6f4fe22) と一致した。

## 制作と反映

日本時間10時04分に[制作標本室のコミット](https://github.com/enadorry/enadorry.io/commit/79b5e20d1477b92e6c6034cdb4e065c45507d6e0)が既にあった。14時20分の定時タスク受信後、このコミットの続きとして同日版を検証・補完した。朝のコミットには原案選定過程やブラウザの操作記録がないため、その由来は未確認。通常の反映先は `daily-design/2026-11-27`。本番マージ・デプロイは行っていない。

| 今回比較した案 | 入口・選び方 | 詳細への移動と反応 |
| --- | --- | --- |
| 標本の索引 | 代表作品の図版、作品名と技術名の検索 | 入力するたび該当作品と件数が変わり、説明を開いて詳細へ進む。同日版の中心として補完 |
| 試聴台 | 音源の紹介と再生状態を最初に見る | 水の景色や曲調を選び、数値・波形を確認。2つの音アプリ内に採用 |
| 制作日誌 | 記事から関心のある話題を選ぶ | 本文を開き、閉じると読んでいた記事に戻る。トップの「記録」に残し、作品の入口は技術名でも探せるようにした |

## 参照資料・コピー・操作検証

[Carbon Design System の Search](https://carbondesignsystem.com/components/search/usage/)は、検索対象がわかるヒントと入力を取り消せる操作を勧めている。作品名・技術名で即時に絞り込み、クリアボタンとEscapeで全件に戻す設計に採用した。0件時には次の操作を案内する。[GOV.UK の Tag](https://design-system.service.gov.uk/components/tag/)の状態と操作を区別する指針を読み、音の再生状態は文字で表示し、再生・停止やプリセット選択にはボタンを用いた。

下表の7作例で「Copy a prompt for Codex to add …」をクリックし、各作例名を含むクリップボード本文を確認。外部指示の共通点は、リンクされた個別のHTML・隣接するCSSとJS・共通のばね設定を読み、対象サイトの技術、文章、色で再構成し、動作確認すること。各個別デモをChromeで操作した。適用欄は本サイトでの判断を記載している。[作例一覧](https://designbookmark.com/motion) · [共有設定](https://designbookmark.com/motion-src/shared/tokens.css) · [共有CSS](https://designbookmark.com/motion-src/shared/base.css) · [共有JS](https://designbookmark.com/motion-src/shared/motion.js)

| 作例・個別ソース | デモでの操作と結果 | サイトでの適用と確認 |
| --- | --- | --- |
| [Segmented control](https://designbookmark.com/motion#db-segmented-control) · [ソース](https://designbookmark.com/motion-src/segmented-control/index.html) | Year、Dayを順にクリック。ハイライトの横位置が移って収束 | 代表作品3件の選択位置に採用。タップ・左右キーで作品名、図版、リンク先、選択印が更新 |
| [Expand card](https://designbookmark.com/motion#db-expand-card) · [ソース](https://designbookmark.com/motion-src/expand-card/index.html) | 選択したカードを再度押すと高さが約270pxから72pxへ戻り、次のクリックで再展開 | 標本カードの説明をその位置で開く。Enter・Spaceで開閉、詳細から索引へ復帰 |
| [Roll links](https://designbookmark.com/motion#db-roll-links) · [ソース](https://designbookmark.com/motion-src/roll-links/index.html) | Studioに重ねて離すと、文字が順番に送り出されて戻った | ナビは文字を時間差で回転。キーボードフォーカス時の変化も確認 |
| [Jelly slider](https://designbookmark.com/motion#db-jelly-slider) · [ソース](https://designbookmark.com/motion-src/jelly-slider/index.html) | 横ドラッグで40→67、左キーで62に変化 | 音色・音量・テンポのネイティブスライダーに値の吹き出しを接続。操作中はつまみに追従し、確定値は表示欄に残る |
| [Copy button](https://designbookmark.com/motion#db-copy-button) · [ソース](https://designbookmark.com/motion-src/copy-button/index.html) | クリックでチェックが現れ、待つと元の表示へ戻る | 連絡先のメールアドレスでコピー完了を示す。PC・スマホ幅でクリップボードの内容まで照合 |
| [Springy input](https://designbookmark.com/motion#db-springy-input) · [ソース](https://designbookmark.com/motion-src/springy-input/index.html) | 文字を順に入力し、Backspaceと全消去で取り消し。ソースでは文字とキャレットに別々のばねを使用 | 日本語入力欄を維持し、件数が変わったときに数字が軽く跳ねる形に調整。全角入力・0件・取消を確認 |
| [Word roll](https://designbookmark.com/motion#db-word-roll) · [ソース](https://designbookmark.com/motion-src/word-roll/index.html) | Enterとクリックで末尾の語が3種類に入れ替わった | 選択した標本のキャプションを下から出す。自動送りは採用せず、動きを止めても選択で文言が切り替わる |

## 内容・ページ・動作

トップ、H2OROBOT、水中ロボット制御、Unity、ローカルAI、Companions、水音の庭、EVERFLOWの全8ページを対象にした。5つの作品詳細は作品名・説明・制作情報と図版を読む標本ページ。音アプリは試聴と調整を分け、水音の庭では4つの景色とタイマー、EVERFLOWではプリセット・テンポ・楽器・波形を扱う。アプリ同士の相互リンクと「音の庭へ戻る」を追加した。

公開元の作品説明・技術・プロフィール・FAQ・制作動機を照合。旧テーマの日付や路線名、ナビや装飾用の英語見出しには当日の文言を使った。元のリンク宛先、画像・代替テキストを照合し、欠落0件。ローカルファイルとアンカーの宛先にも欠落はなかった。公開URLへの通信では、外部12件中10件がHTTP 200。Xプロフィールとカウンター提供元の案内ページは403で、リンク先の閲覧完了は未確認。

## ブラウザ検証

Windows版Chrome 158.0.8127.88、PC 1440×900、スマホ390×844（タッチエミュレーション・DPR 1）。ローカルで8ページの往復、ページ全幅、画像、フォーカス、表示設定を確認。各幅で横スクロールなし。スピーカーでの聴取と実機スマホは未確認。

- 全角 `ＥＳＰ３２`、作品名、未該当語で検索。0件の案内、クリア後の6件復帰、フォーカス復帰、Escape、展開と詳細リンクを確認。
- 代表作品の切替、記事本文の開閉と復帰、音量・ミュート・自動再生の保存を確認。音源・再生状態の表示は手動停止中も利用可能。
- 水音の庭で雨、風鈴64%、タイマー15分、再生成、再生・停止を操作。タイマー満了は未計測。EVERFLOWはプリセット、テンポ、旋律更新、ランダム演奏、再生・停止を操作。停止設定中は波形の描画が変化せず、再開時に再び変化した。
- 庭は25種類。会話、ドラッグ、矢印移動、自由行動復帰、停止・再開を確認。端末時計を7時・13時・19時・23時に設定して4時間帯を確認。
- 開発中に見つけた、サイトの停止設定と波形・瞬き・カーソル追従が連動しない問題、前日の停止設定を取りこぼす問題、コピー操作が閉じたFAQに隠れる問題を修正。公開中の設定キーからの引き継ぎ、OSの動き軽減、他ページへの設定保持を確認。
- 公開のnote・Spotify履歴・SNS表示設定APIは503。記事取得失敗、同梱の曲履歴への切り替え後の空表示、SNSの初期非表示を確認。検証データで記事6→8→6件、本文・閉じた後のフォーカス、曲1件、X表示・Instagram非表示、記事0件を試した。本番の保存値と実記事・実曲は未確認。

## カウンター

フッターの `@Enadorry` に、`kasuterura-4`、`booru-jaypee`、`booru-touhoulat` から1つをランダム指定する。既存の `padding=7&offset=0&align=top&scale=1&pixelated=1&darkmode=auto` を維持した。

PC幅とスマホ幅の初回表示で実画像へのリクエストは各1回、どちらも `booru-touhoulat`、HTTP 200。表示寸法はそれぞれ約451×140pxと354×110pxで、画像全体が画面内に収まった。反復テストでは検証用応答を使い、失敗時の代替文も確認。カウンター提供元の履歴や計数増分は未確認。
