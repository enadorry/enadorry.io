# 11月26日版「制作路線図」の検証記録

## 反映の範囲

日本時間11月26日10時03分の[制作コミット](https://github.com/enadorry/enadorry.io/commit/8d52503b9809fd0c90f6c14995f521f9a6dc6de1)は、20時39分に[PR #1](https://github.com/enadorry/enadorry.io/pull/1)で `main` へマージされた。夜の確認時、トップ・作品詳細5ページ・音アプリ2ページの公開HTMLはすべてHTTP 200で、改行を正規化するとこのコミットの8ファイルと一致した。以下は同日ブランチに追加した改修とローカルでの確認結果。

## 内容と設計

朝の制作前の[内容一覧](inventory.json)と、夜の改修前に公開版で照合した[ページ別の内容・リンク・図版一覧](published-content.json)を参照。後者は公開HTMLの本文、見出し、各リンクの表示名と宛先、図版の説明・キャプション、入力項目、庭の住人を記録している。読み込み後に変わる表示は下記の機能検証に記載した。

完成済みの当日テーマを引き継いだ。朝の制作者が比較した原案やプロンプトの操作履歴はコミットからは復元できない。以下は夜の改修時の比較である。

| 案 | 最初に見えるもの | 作品の選択と詳細への進み方 | 操作への反応 |
| --- | --- | --- | --- |
| 路線と乗り換え（採用） | 制作・音響・記録の3つの行き先 | 制作線で作品名を開くか、図版を切り替えて詳細へ。ロボット本体と操作アプリは直接往復 | 選択位置に印が移り、横ドラッグで図版が追従。縦スクロールはページ移動に使う |
| 制作手順の目次 | ロボットの接続・操作・組立の目次 | 用途から該当箇所に飛ぶ | 選んだ見出しへ移動。H2OROBOTの説明内に採用 |
| 音の操作卓 | 再生中の状態と操作ボタン | 音源を選び、設定を聴き比べる | 値・波形・再生状態が追従。水音の庭とEVERFLOWに採用 |

H2OROBOT・水中ロボット制御・Unity・ローカルAIは、各作品の図版と説明・技術情報をPCでは左右、スマホでは縦に配置。Companionsは庭を先頭の体験とし、操作後に住人の紹介を読める構成にした。水音の庭は景色・音量・タイマー、EVERFLOWは波形・演奏・楽器設定を用途別に組み直した。両アプリから相互に移動できる。

## 参考資料と操作例

[GOV.UK Design System の Details](https://design-system.service.gov.uk/components/details/)の本文と例を読み、作品名は閉じた状態でも表示し、補足やFAQは項目を選んで開く構成を維持した。頻繁に使う再生操作は開閉欄の外に置いた。[USWDS の Collection](https://designsystem.digital.gov/components/collection/)は、関連項目に短い説明と出典を添える指針。記事の見出し・日付・抜粋から記事を選ぶ表示を確認し、作品詳細の乗り換え先には「水中ロボット制御」などの具体名を付けた。

[DesignBookmark Motion](https://designbookmark.com/motion)の各作例で「Copy a prompt for Codex to add …」をクリックして、6件のクリップボード本文を取得した。配布元の指示はいずれも、個別HTMLと同階層のCSS・JS、共通の `tokens.css`・`base.css`・`motion.js` を読み、動きの特性を既存技術で再構成し、プロジェクト固有の文言・外観で動作を確認するものだった。各リンクの個別デモをChromeで操作した。下表の「適用」は本サイト向けの実装判断で、外部プロンプトの引用ではない。

| 作例と実装ソース | デモで確認した反応 | 本サイトへの適用と確認 |
| --- | --- | --- |
| [Swipe deck](https://designbookmark.com/motion#db-swipe-deck) · [デモ](https://designbookmark.com/motion-src/swipe-deck/index.html) | 23pxのドラッグは傾いた先頭カードがほぼ原位置へ戻り、155pxでは背面に回った | 図版の移動量と傾きを小さくし、55pxを超える横移動で次の作品に切り替える。実マウス入力とタッチエミュレーションで横・斜め縦・詳細リンクのクリックを確認 |
| [Segmented control](https://designbookmark.com/motion#db-segmented-control) · [デモ](https://designbookmark.com/motion-src/segmented-control/index.html) | Year→Dayを押すとハイライトが横移動し、減衰して新しい位置に収まった | 3作品のボタン下のマーカーに適用。矢印キーでも選択・図版・リンク先が連動 |
| [Expand card](https://designbookmark.com/motion#db-expand-card) · [デモ](https://designbookmark.com/motion-src/expand-card/index.html) | 再クリックで高さが約275pxから72pxに戻り、もう一度押すと展開した | 作品の説明とFAQはその場で開閉し、他の作品名を比較できる。Enter・Space・タップから開けることを確認 |
| [Roll links](https://designbookmark.com/motion#db-roll-links) · [デモ](https://designbookmark.com/motion-src/roll-links/index.html) | Studioにポインターを置くと文字列が順番に上に送り出され、離れると戻った | ページ上部の行き先に一文字ずつ時間差を付けた。フォーカスでも同じ反応。リンク名は読み上げ用に一度だけ保持 |
| [Jelly slider](https://designbookmark.com/motion#db-jelly-slider) · [デモ](https://designbookmark.com/motion-src/jelly-slider/index.html) | ドラッグで40→67、左キーで62。値が追従し、離すとつまみ付近に戻る | 音量・音色・テンポにネイティブのスライダーを使用。ドラッグ中またはキーボード操作時に、現在値がつまみの上に出る。確定値は元の表示欄にも残る |
| [Word roll](https://designbookmark.com/motion#db-word-roll) · [デモ](https://designbookmark.com/motion-src/word-roll/index.html) | Enterとクリックで designers→founders→makers と切り替わり、古い語が上へ抜けた | 作品切り替え時の見出しの上向きの出現に応用。サイトでは利用者の操作時のみ、見出し全体を動かす。停止時も名称が更新される |

## 公開機能と検証条件

WindowsのChrome 158.0.8127.88を使用。ローカルHTTPでPC 1440×900、スマホ390×844（タッチありのエミュレーション、DPR 1）を開いた。Web Audioはブラウザ上の再生・停止・状態・描画で検証し、スピーカーでの聴感は未確認。

- 全8ページで見出し・図版・代替テキスト・キャプション・リンク宛先・ID付き操作項目を照合。欠落した見出し・図版・元のリンク宛先・ID付き操作項目は0件。内部リンクとアンカーの宛先を静的に確認し、トップから各ページへ実際に進んで戻った。両画面幅で文書全体の横はみ出しは0件。
- トップで作品の選択・横スワイプ・斜め縦スクロール・FAQ、音源切り替え・音量・ミュート・自動再生設定を操作。音量37%、自動再生オフ、ミュートの再読み込み後の保持を確認。動きの停止設定はページ移動後も維持し、OS側の動き軽減のオン・オフも確認した。
- 水音の庭では雨の庭への切り替え、風鈴64%、タイマー15分設定、再生成、再生・停止を確認。タイマー満了の実時間試験は対象外。EVERFLOWではプリセット、テンポ、演奏の開始・停止、旋律更新、ランダム設定を操作。波形の停止中に描画内容が同一で、再開後に変化することを確認した。
- Companionsは25種類。会話・矢印移動・ドラッグ・自由行動への復帰と庭の停止ボタンを操作した。ブラウザ時計の朝7時・昼13時・夕19時・夜23時で対応する時間帯に切り替わることを確認した。
- 公開 `/api/notes`、`/api/spotify/history`、`/api/social-settings` はいずれも503。トップではnoteの失敗メッセージ、同梱音楽履歴への切り替え後の空表示、SNSの初期非表示を確認した。ローカルの検証データで記事6→8件→6件、記事本文と閉じた後のフォーカス復帰、曲1件、X表示・Instagram非表示、記事0件を確認。公開管理設定の変更は行っていない。
- 公開中のリンク12件のHTTP応答を確認。XプロフィールとMoe Counterのサービス案内は403、他10件は200。画面にある元のURLを維持した。Discord宛の送信やメール送信は検証に含めていない。
- 公開版でEVERFLOWの `step` 名の競合を再現し、共通スクリプトを独立させた。庭の自動行動、カーソル追従、瞬き、波形描画をサイトの停止設定に接続。図版のドラッグ処理が内側の詳細リンクのクリックを奪う不具合も修正した。

## カウンター

フッターに `@Enadorry`。各ページの初期化時に `kasuterura-4`、`booru-jaypee`、`booru-touhoulat` の3候補からランダムに一つを選択する。共通パラメータは `padding=7&offset=0&align=top&scale=1&pixelated=1&darkmode=auto`。

| 確認段階 | 結果 |
| --- | --- |
| ソース | 既存の識別子、3テーマ、URLパラメータを維持。初期化時に一度だけ画像のURLを設定 |
| ブラウザでの取得と表示 | PC・スマホの初回ページ表示で対象画像へのリクエストを各1回記録し、実サービスがHTTP 200を返した。PCはkasuterura-4で350×100px、スマホはbooru-touhoulatで約354×110px。画像全体が表示幅内に収まった |
| 再検証・失敗時 | 後続の反復テストでは検証用の応答を使用。画像取得失敗時の代替文を確認 |
| サービス側の計数 | 管理側の履歴や増分までは未確認 |

本番と差のある追加改修は日付ブランチのみに反映する。新たな本番反映依頼を受けた時点でPR、マージ、公開確認を別々に記録する。
