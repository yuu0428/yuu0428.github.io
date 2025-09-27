(() => {
  const categories = [
    { id: 'volunteer', label: 'ボランティア' },
    { id: 'upcoming', label: 'イベント予定' },
    { id: 'review', label: 'イベントの様子' },
    { id: 'coverage', label: '取材' },
    { id: 'others', label: 'その他' },
  ];

  document.addEventListener('DOMContentLoaded', () => {
    const yamlSource = document.getElementById('articles-yaml');
    const categoriesContainer = document.querySelector('[data-list-categories]');
    const groupsContainer = document.querySelector('[data-list-groups]');
    const topLinks = document.querySelectorAll('[data-list-top], [data-list-top-drawer]');
    const menuToggle = document.querySelector('[data-list-menu-toggle]');
    const drawer = document.getElementById('list-drawer');
    const backdrop = document.querySelector('.list-drawer-backdrop');

    if (!yamlSource || !categoriesContainer || !groupsContainer) {
      return;
    }

    if (topLinks.length) {
      topLinks.forEach((link) => {
        link.addEventListener('click', (event) => {
          event.preventDefault();
          document.getElementById('top')?.scrollIntoView({ behavior: 'smooth' });
        });
      });
    }

    if (menuToggle && drawer && backdrop) {
      const links = drawer.querySelectorAll('a');

      const closeDrawer = () => {
        drawer.classList.remove('is-open');
        backdrop.hidden = true;
        menuToggle.setAttribute('aria-expanded', 'false');
        drawer.setAttribute('aria-hidden', 'true');
      };

      const openDrawer = () => {
        drawer.classList.add('is-open');
        backdrop.hidden = false;
        menuToggle.setAttribute('aria-expanded', 'true');
        drawer.setAttribute('aria-hidden', 'false');
      };

      menuToggle.addEventListener('click', () => {
        const expanded = menuToggle.getAttribute('aria-expanded') === 'true';
        expanded ? closeDrawer() : openDrawer();
      });

      backdrop.addEventListener('click', closeDrawer);

      links.forEach((link) => {
        link.addEventListener('click', closeDrawer);
      });

      document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && drawer.classList.contains('is-open')) {
          closeDrawer();
        }
      });
    }

    let articles = [];
    try {
      const parsed = parseYaml(yamlSource.textContent || '');
      if (parsed && Array.isArray(parsed.articles)) {
        articles = parsed.articles.slice();
      }
    } catch (error) {
      console.error(error);
    }

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

        const time = document.createElement('time');
        time.dateTime = normalizeDate(article.date);
        time.textContent = article.date || '';

        const title = document.createElement('strong');
        title.textContent = article.title || '';

        const overview = document.createElement('p');
        overview.textContent = article.overview || '';

        item.appendChild(time);
        item.appendChild(title);
        item.appendChild(overview);
        list.appendChild(item);
      });

      section.appendChild(list);

      if (!filtered.length) {
        const empty = document.createElement('p');
        empty.className = 'reports-empty';
        empty.textContent = '記事がありません。';
        section.appendChild(empty);
      }

      const hiddenCount = Math.max(filtered.length - 5, 0);
      const toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.className = 'article-list-toggle';
      toggle.textContent = '次の5件を表示';
      toggle.hidden = hiddenCount === 0;

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
    const groups = document.querySelectorAll('.article-list-group');
    const tabs = document.querySelectorAll('.article-list-category');

    const sections = Array.from(groups);
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

  function parseYaml(yamlText) {
    const lines = yamlText
      .split(/\r?\n/)
      .map((line) => line.replace(/\t/g, '  '))
      .filter((line) => line.trim().length && !line.trim().startsWith('#'))
      .map((line) => ({
        indent: line.match(/^ */)[0].length,
        content: line.trim(),
      }));

    function parseBlock(expectedIndent) {
      const obj = {};

      while (lines.length) {
        const { indent, content } = lines[0];
        if (indent < expectedIndent) break;
        if (indent > expectedIndent) throw new Error('Invalid indentation in YAML');

        lines.shift();

        if (content.startsWith('- ')) {
          throw new Error('Unexpected list item');
        }

        const [keyPart, valuePart = ''] = content.split(/:(.*)/);
        const key = keyPart.trim();
        const value = valuePart.trim();

        if (!value) {
          if (lines[0] && lines[0].indent > indent) {
            if (lines[0].content.startsWith('- ')) {
              obj[key] = parseArray(lines[0].indent);
            } else {
              obj[key] = parseBlock(lines[0].indent);
            }
          } else {
            obj[key] = null;
          }
        } else {
          obj[key] = castValue(value);
        }
      }

      return obj;
    }

    function parseArray(expectedIndent) {
      const arr = [];

      while (lines.length) {
        const { indent, content } = lines[0];
        if (indent < expectedIndent) break;
        if (indent > expectedIndent) throw new Error('Invalid indentation in YAML array');

        lines.shift();

        if (!content.startsWith('- ')) {
          throw new Error('Expected list item');
        }

        const valuePart = content.slice(2).trim();

        if (!valuePart) {
          if (lines[0] && lines[0].indent > indent) {
            if (lines[0].content.startsWith('- ')) {
              arr.push(parseArray(lines[0].indent));
            } else {
              arr.push(parseBlock(lines[0].indent));
            }
          } else {
            arr.push(null);
          }
        } else if (valuePart.includes(':')) {
          const [keyPart, rest = ''] = valuePart.split(/:(.*)/);
          const obj = {};
          obj[keyPart.trim()] = castValue(rest.trim());

          if (lines[0] && lines[0].indent > indent) {
            const nestedIndent = lines[0].indent;
            const nested = parseBlock(nestedIndent);
            Object.assign(obj, nested);
          }

          arr.push(obj);
        } else {
          arr.push(castValue(valuePart));
          if (lines[0] && lines[0].indent > indent) {
            const nestedIndent = lines[0].indent;
            const nested = parseBlock(nestedIndent);
            arr[arr.length - 1] = { value: arr[arr.length - 1], ...nested };
          }
        }
      }

      return arr;
    }

    function castValue(raw) {
      if (raw === 'true') return true;
      if (raw === 'false') return false;
      if (raw === 'null') return null;
      if (/^[-+]?[0-9]+$/.test(raw)) return Number.parseInt(raw, 10);
      if (/^[-+]?[0-9]*\.[0-9]+$/.test(raw)) return Number.parseFloat(raw);
      if ((raw.startsWith('"') && raw.endsWith('"')) || (raw.startsWith("'") && raw.endsWith("'"))) {
        return raw.slice(1, -1);
      }
      return raw;
    }

    return parseBlock(0);
  }
})();
