const categories = {
  volunteer: {
    label: 'ボランティア',
    start: new Date('2024-05-25T00:00:00'),
  },
  upcoming: {
    label: 'イベント予定',
    start: new Date('2024-06-30T00:00:00'),
  },
  review: {
    label: 'イベントの様子',
    start: new Date('2024-05-24T00:00:00'),
  },
  coverage: {
    label: '取材',
    start: new Date('2024-04-28T00:00:00'),
  },
  others: {
    label: 'その他',
    start: new Date('2024-04-22T00:00:00'),
  },
};

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}/${month}/${day}`;
}

function createArticle(category, label, index, baseDate) {
  const id = `${category}-${String(index + 1).padStart(3, '0')}`;
  const date = new Date(baseDate);
  date.setDate(date.getDate() - index);
  const overview = 'あ'.repeat(30);
  const contentLength = 300;
  const content = 'あ'.repeat(contentLength);

  return {
    id,
    category,
    categoryLabel: label,
    title: 'あ'.repeat(10),
    overview,
    date: formatDate(date),
    url: `/articles/${id}/`,
    isInteractive: true,
    content,
  };
}

module.exports = () => {
  const articles = [];
  Object.entries(categories).forEach(([category, config]) => {
    for (let i = 0; i < 13; i += 1) {
      const article = createArticle(category, config.label, i, config.start);
      if (article.id === 'volunteer-001') {
        article.content = 'あ'.repeat(300);
      }
      articles.push(article);
    }
  });
  return articles;
};
