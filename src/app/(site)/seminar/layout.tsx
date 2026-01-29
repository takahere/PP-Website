/**
 * セミナー専用レイアウト
 * レガシーCSSの articleBody スタイルを適用
 */

// articleBody スタイルと セミナーカードスタイルを定義
const seminarCSSFixes = `
  /* articleBody 見出しスタイル（旧サイト互換） */
  .articleBody {
    font-size: 1.4rem;
    line-height: 1.8;
  }

  .articleBody h2 {
    font-size: 2.2rem;
    line-height: 1.45;
    font-weight: 700;
    padding: 1.8em 0 0.8em 0;
  }

  .articleBody h3 {
    font-size: 1.6rem;
    line-height: 1.8;
    font-weight: 700;
    padding: 0.8em 0 0.8em 0;
  }

  .articleBody h4 {
    font-size: 1.4rem;
    line-height: 1.8;
    font-weight: 700;
    padding: 0.6em 0;
  }

  .articleBody p {
    font-size: 1.4rem;
    line-height: 1.8;
    margin: 0 0 1em 0;
  }

  .articleBody ul,
  .articleBody ol {
    margin: 0 0 1em 1.5em;
    line-height: 1.8;
  }

  .articleBody li {
    margin-bottom: 0.5em;
  }

  .articleBody table {
    width: 100%;
    border-collapse: collapse;
    margin: 1em 0;
  }

  .articleBody table th,
  .articleBody table td {
    border: 1px solid #e0e0e0;
    padding: 0.8em 1em;
    text-align: left;
    vertical-align: top;
  }

  .articleBody table th {
    background: #f5f5f5;
    font-weight: 700;
    white-space: nowrap;
    width: 120px;
  }

  .articleBody img {
    max-width: 100%;
    height: auto;
  }

  .articleBody a {
    color: #0066cc;
    text-decoration: underline;
  }

  .articleBody a:hover {
    color: #004499;
  }

  /* セミナー一覧カードスタイル */
  .seminar-card {
    background: #ffffff;
    padding: 16px;
    box-shadow: 0px 0px 16px #DDDDDD;
    border-radius: 16px;
    transition: box-shadow 0.2s ease;
  }

  .seminar-card:hover {
    box-shadow: 0px 0px 24px #CCCCCC;
  }

  .seminar-badge-online {
    background: #4CAF50;
    color: white;
    padding: 4px 12px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 700;
  }

  .seminar-badge-offline {
    background: #F44336;
    color: white;
    padding: 4px 12px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 700;
  }

  .seminar-badge-past {
    background: #9E9E9E;
    color: white;
    padding: 4px 12px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 700;
  }

  @media screen and (min-width: 769px) {
    .articleBody h2 {
      font-size: 2.4rem;
      line-height: 1.4;
    }

    .articleBody table th {
      width: 150px;
    }
  }
`

export default function SeminarLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: seminarCSSFixes }} />
      {children}
    </>
  )
}
