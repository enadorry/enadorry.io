# 11月28日版の設計とモーション調査

既存の当日ブランチには手動の映写スライドがあった。公開トップから辿った8ページ（音アプリのURL別名を含めると10件）の内容が、11月28日の調査時点で本番コミット 5ccb520 の配信HTMLと一致した。公開内容と操作を材料に、当日版を仕上げる際に次の3案を比較した。

| 発想 | 初めに見えるもの | 作品の選び方と詳細への移動 | 操作への反応 |
|---|---|---|---|
| 映写室 | 選択中の作品の図と短い解説 | 前後ボタンや作品名で1枚を選び、図に添ったリンクから入る | 横に送ると絵と題名が入れ替わり、フィルム番号の選択印が移る |
| 制作卓 | 通信図、制作ツール、試せる操作の目次 | 技術を選び、対応する作品の説明から詳細を開く | 絞り込みに応じて候補と件数が減る |
| 聴取室 | 音と作品を組み合わせた番組表 | 番組名を選び、曲目のように並ぶ作品へ移る | 選択した番組のエピソード一覧が開く |

音を出さずに作品の違いを見比べられ、6つの入口を指でもキーでも直接選べる映写室を継続した。技術名は図の横へ、再生と生成音の調整は音アプリへ置いた。

## 一次資料から決めた操作

| 資料 | 選んだ理由と読んだ箇所 | 映写室で実装した内容 |
|---|---|---|
| [W3C WAIのCarousel Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/carousel/) | スライドの非表示、前後ボタン使用時のフォーカス、個々のスライド選択ボタンを扱う説明を参照した。 | 手動送り、可視スライド1枚、番号と作品名による直接選択を採用。前後を連打しても同じボタンで操作でき、表示中の作品のリンクにいる時に矢印で移動してもフォーカスが行方不明にならない。 |
| [W3C WAIのSlider Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/slider/) | 方向キーによる1段階変更と、両端へ移動するキーを扱う指針を参照した。 | 音量やテンポにブラウザ標準のrangeを使い、表示値を独立させた。数値に弾みをつけてもキー入力中の選択値とフォーカスは変わらない。 |

## DesignBookmarkで取得した指示と確かめた動き

11月28日に[Motionギャラリー](https://designbookmark.com/motion)で下表の各「Codex」ボタンを実際に押し、クリップボードの本文と該当する部品名を照合した。7件の取得指示はいずれも、リンク先のHTML、隣接するCSSとJavaScript、共通設定を先に読み、既存の技術で動きを組み直し、配色と文言をサイトに合わせ、実行して確認するという内容だった。[共通トークン](https://designbookmark.com/motion-src/shared/tokens.css)、[共通CSS](https://designbookmark.com/motion-src/shared/base.css)、[ばね計算](https://designbookmark.com/motion-src/shared/motion.js)と各作例が読み込む個別ファイルを開いた。以下の採用指示はこのサイト用に作成したもの。

| Codexコピーを取得した作例と実際に開いたソース | 元デモで操作して観察した結果 | 本サイトへの実装指示・適用先 | 実装後のChrome確認 |
|---|---|---|---|
| [Segmented control](https://designbookmark.com/motion#db-segmented-control)・[デモ](https://designbookmark.com/motion-src/segmented-control/index.html) | Year、Dayと押すと背景の帯が横方向に移動し、少し横に伸びて各ボタンに収まる。 | 6つの作品名の背後に1枚だけ選択印を置く。スマホで3列に折り返した時も同じ印が次の行の選択先へ移る。 | 直接選択すると帯の座標、番号、表示中の図が変化。HomeとEndでは先頭・末尾のボタンにフォーカスも移動した。 |
| [Swipe deck](https://designbookmark.com/motion#db-swipe-deck)・[デモ](https://designbookmark.com/motion-src/swipe-deck/index.html) | 先頭カードを23px横へ引いて離すと元に収まり、155px引くと後ろのカードが前に出た。 | 作品画像を軽く傾けて追従させる。横移動が45pxを超え、かつ縦移動より大きい時に前後へ進む。短く引いた時はその場に戻す。 | PC・タッチ双方で22pxでは同じ作品、100pxでは次の作品となった。タッチで縦98pxを送ると作品を保持したままページだけがスクロールした。 |
| [Word roll](https://designbookmark.com/motion#db-word-roll)・[デモ](https://designbookmark.com/motion-src/word-roll/index.html) | Enter、クリックの順で designers、founders、makers と交代した。短時間だけ新旧の文字が上下に重なる。 | 初回見出しと作品変更時の題名を下から浮かべる。長い日本語の題名は一まとまりで動かし、手動選択時だけ作品を切り替える。 | 送りボタンで作品名が変わり、新しい見出しのアニメーションを検出。停止中は同じ操作で即時に切り替わった。 |
| [Roll links](https://designbookmark.com/motion#db-roll-links)・[デモ](https://designbookmark.com/motion-src/roll-links/index.html) | Studioにマウスを置くと文字の上下2段が約半分上に回り、離すと元の位置へ戻った。 | 共通ナビの各文字を18msずつずらして回転させる。マウス、キーボードフォーカス、タップの押下に応答し、リンクの読み上げ名は1つにする。 | Tabでナビに戻ると文字の移動を検出。軽減時は同じ文字を静止表示する。 |
| [Expand card](https://designbookmark.com/motion#db-expand-card)・[デモ](https://designbookmark.com/motion-src/expand-card/index.html) | 開いていた宿泊カードがクリックで高さ約271pxから72pxに畳まれ、再クリックで約271pxに戻った。 | FAQの質問を残し、その下に回答の高さを展開する。再操作で畳み、支援技術に開閉状態を伝える標準detailsを使う。 | Enterで回答領域に高さが付き、Spaceで0に戻った。 |
| [Jelly slider](https://designbookmark.com/motion#db-jelly-slider)・[デモ](https://designbookmark.com/motion-src/jelly-slider/index.html) | 横にドラッグして離すと数値が40から67に、左キーで62に変わった。値ラベルが上がり、つまみが落ち着く。 | 音量など既存の数値ラベルを、変更方向へ少し傾けて持ち上げ、280msで元の形へ戻す。常時表示の値を読みながら調節できる。 | 音量の右キーで値が更新され、同じoutputのアニメーションを検出した。指で調整できる標準コントロールを維持。 |
| [Copy button](https://designbookmark.com/motion#db-copy-button)・[デモ](https://designbookmark.com/motion-src/copy-button/index.html) | ボタンを押すとチェック印が拡大し、しばらく置くと縮んでコピー前に戻った。 | 連絡先でクリップボードへの書き込み完了を待ち、チェックと「コピーしました」を表示する。失敗時はメールのリンクへ案内する。 | PC・タッチで公開メールアドレスとクリップボードが一致し、2.4秒後に元の表示に戻った。 |

実装後の個別検証はChromeで1440×900と390×844を使用した。後者のスワイプはChrome DevTools Protocolでタッチの開始・移動・終了を送った。OSによる軽減またはサイト内の停止が有効な時は、ナビ、スライド、FAQ、値表示を静止させ、選択や開閉は引き続き使える。
