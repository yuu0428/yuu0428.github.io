(() => {
  const categories = [
    { id: 'volunteer', label: 'ボランティア' },
    { id: 'upcoming', label: 'イベント予定' },
    { id: 'review', label: 'イベントの様子' },
    { id: 'coverage', label: '取材' },
    { id: 'others', label: 'その他' },
  ];

  document.addEventListener('DOMContentLoaded', () => {
    const categoriesContainer = document.querySelector('[data-list-categories]');
    const groupsContainer = document.querySelector('[data-list-groups]');
    const topLinks = document.querySelectorAll('[data-list-top], [data-list-top-drawer]');

    if (!categoriesContainer || !groupsContainer) {
      return;
    }

    if (topLinks.length) {
      topLinks.forEach((link) => {
        link.addEventListener('click', (event) => {
          event.preventDefault();
          document.getElementById('top')?.scrollIntoView({ behavior: 'smooth' });
          window.setTimeout(() => link.blur(), 150);
        });
      });
    }

    const articles = Array.isArray(window.__ARTICLES__) ? window.__ARTICLES__ : [];

    renderCategoryNav(categoriesContainer);
    renderGroups(groupsContainer, articles);

    const initialCategory = determineInitialCategory(articles);
    updateActiveCategory(initialCategory);
  });

  function renderCategoryNav(container) {
    categories.forEach((category) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'article-list-category';
      button.dataset.category = category.id;
      button.textContent = category.label;
      button.setAttribute('aria-controls', `category-${category.id}`);
      button.setAttribute('aria-pressed', 'false');
      button.addEventListener('click', () => {
        updateActiveCategory(category.id);
      });
      container.appendChild(button);
    });
  }

  function renderGroups(container, articles) {
    categories.forEach((category) => {
      const section = document.createElement('section');
      section.className = 'article-list-group';
      section.id = `category-${category.id}`;
      section.hidden = true;
      section.dataset.category = category.id;

      const heading = document.createElement('h2');
      heading.textContent = category.label;
      section.appendChild(heading);

      const list = document.createElement('ul');
      list.className = 'article-list-items';

      const filtered = articles
        .filter((item) => item.category === category.id)
        .sort((a, b) => parseDate(b.date) - parseDate(a.date));

      filtered.forEach((article, index) => {
        const item = document.createElement('li');
        item.className = 'article-list-item';
        if (index >= 5) {
          item.classList.add('is-hidden');
        }

        const link = document.createElement('a');
        link.href = article.url || '#';
        link.className = 'article-list-link';

        const time = document.createElement('time');
        time.dateTime = normalizeDate(article.date);
        time.textContent = article.date || '';

        const title = document.createElement('strong');
        title.textContent = article.title || '';

        const overview = document.createElement('p');
        overview.textContent = article.overview || '';

        link.appendChild(time);
        link.appendChild(title);
        link.appendChild(overview);
        item.appendChild(link);
        list.appendChild(item);
      });

      section.appendChild(list);

      if (!filtered.length) {
        const empty = document.createElement('p');
        empty.className = 'reports-empty';
        empty.textContent = '記事がありません。';
        section.appendChild(empty);
      }

      const toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.className = 'article-list-toggle';
      toggle.textContent = '次の5件を表示';
      toggle.hidden = filtered.length <= 5;

      toggle.addEventListener('click', () => {
        const hiddenItems = Array.from(list.querySelectorAll('.article-list-item.is-hidden'));
        hiddenItems.slice(0, 5).forEach((item) => item.classList.remove('is-hidden'));
        if (list.querySelectorAll('.article-list-item.is-hidden').length === 0) {
          toggle.hidden = true;
        }
      });

      section.appendChild(toggle);
      container.appendChild(section);
    });
  }

  function determineInitialCategory(articles) {
    const available = new Set(articles.map((item) => item.category));
    const fallback = categories[0]?.id || '';
    for (const category of categories) {
      if (available.has(category.id)) {
        return category.id;
      }
    }
    return fallback;
  }

  function updateActiveCategory(categoryId) {
    const sections = Array.from(document.querySelectorAll('.article-list-group'));
    sections.forEach((section) => {
      const match = section.dataset.category === categoryId;
      section.hidden = !match;
      section.classList.toggle('is-active', match);
    });

    const activeSection = sections.find((section) => section.dataset.category === categoryId);
    if (activeSection && activeSection.parentElement) {
      activeSection.parentElement.prepend(activeSection);
      activeSection.hidden = false;
      activeSection.classList.add('is-active');
    }

    const tabs = document.querySelectorAll('.article-list-category');
    tabs.forEach((tab) => {
      const match = tab.dataset.category === categoryId;
      tab.classList.toggle('is-active', match);
      tab.setAttribute('aria-pressed', match ? 'true' : 'false');
    });
  }

  function parseDate(value) {
    if (!value) return new Date(0);
    const normalized = value.replace(/\//g, '-');
    return new Date(normalized);
  }

  function normalizeDate(value) {
    if (!value) return '';
    const normalized = value.replace(/\//g, '-');
    return normalized;
  }
})();
