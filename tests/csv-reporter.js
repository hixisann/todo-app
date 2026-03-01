const fs = require('fs');
const path = require('path');

class CsvReporter {
  constructor() {
    this.rows = [];
    this.runDate = new Date().toLocaleString('ja-JP');
  }

  onTestEnd(test, result) {
    const status =
      result.status === 'passed'   ? '合格' :
      result.status === 'failed'   ? '不合格' :
      result.status === 'timedOut' ? 'タイムアウト' : 'スキップ';

    const error = result.errors && result.errors.length > 0
      ? result.errors[0].message.replace(/\n/g, ' ').replace(/"/g, '""').substring(0, 200)
      : '';

    this.rows.push({
      suite: test.parent.title,
      name: test.title,
      status,
      duration: (result.duration / 1000).toFixed(2) + '秒',
      error,
      date: this.runDate,
    });
  }

  onEnd() {
    const BOM = '\uFEFF';
    const header = 'No.,テストスイート,テスト名,結果,実行時間,エラー内容,実行日時\n';
    const rows = this.rows.map((r, i) =>
      `${i + 1},"${r.suite}","${r.name}","${r.status}","${r.duration}","${r.error}","${r.date}"`
    ).join('\n');

    const filePath = path.join(process.cwd(), 'test-results.csv');
    fs.writeFileSync(filePath, BOM + header + rows, 'utf8');
    console.log(`\nテスト結果を ${filePath} に出力しました。`);
  }
}

module.exports = CsvReporter;
