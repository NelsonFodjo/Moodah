const manifestBody = document.getElementById('manifest-body');
const filterInput = document.getElementById('filter-input');
const sortToggle = document.getElementById('sort-toggle');
const newPrLink = document.getElementById('new-pr-link');

let entries = [];
let moodResults = [];
let sortNewest = true;

function getNewPrUrl() {
  const repoPlaceholder = 'https://github.com/your-username/Moodah/edit/main/data/manifest.json';
  return repoPlaceholder;
}

function createBadge(mood) {
  const badge = document.createElement('span');
  badge.className = 'badge';
  badge.textContent = mood;
  return badge;
}

function renderTableRows(data) {
  manifestBody.innerHTML = '';
  if (!data.length) {
    const row = document.createElement('tr');
    const cell = document.createElement('td');
    cell.colSpan = 5;
    cell.textContent = 'No moods match your search yet.';
    cell.style.textAlign = 'center';
    row.appendChild(cell);
    manifestBody.appendChild(row);
    return;
  }

  data.forEach((entry) => {
    const row = document.createElement('tr');

    const avatarCell = document.createElement('td');
    avatarCell.className = 'avatar-cell';
    const avatar = document.createElement('img');
    avatar.src = `https://github.com/${entry.username}.png`;
    avatar.alt = `${entry.username} avatar`;
    avatarCell.appendChild(avatar);

    const userCell = document.createElement('td');
    const link = document.createElement('a');
    link.className = 'username-link';
    link.href = `https://github.com/${entry.username}`;
    link.textContent = entry.username;
    link.target = '_blank';
    link.rel = 'noopener';
    userCell.appendChild(link);

    const emojisCell = document.createElement('td');
    emojisCell.className = 'emojis-cell';
    emojisCell.textContent = entry.emojis.join(' ');

    const moodCell = document.createElement('td');
    moodCell.appendChild(createBadge(entry.mood || 'Pending AI mood'));

    const descCell = document.createElement('td');
    descCell.className = 'row-description';
    descCell.textContent = entry.description || 'This entry is waiting for AI analysis to generate a mood description.';

    row.append(avatarCell, userCell, emojisCell, moodCell, descCell);
    manifestBody.appendChild(row);
  });
}

function applyFilterAndSort() {
  const query = filterInput.value.trim().toLowerCase();
  const merged = entries.map((entry) => {
    const result = moodResults.find((item) => item.username === entry.username);
    return {
      ...entry,
      mood: result?.mood,
      description: result?.description,
      addedAt: result?.addedAt
    };
  });

  const filtered = merged.filter((entry) => {
    const moodText = entry.mood || '';
    return (
      entry.username.toLowerCase().includes(query) ||
      moodText.toLowerCase().includes(query)
    );
  });

  filtered.sort((a, b) => {
    const aTime = new Date(a.addedAt || 0).getTime() || 0;
    const bTime = new Date(b.addedAt || 0).getTime() || 0;
    return sortNewest ? bTime - aTime : aTime - bTime;
  });

  renderTableRows(filtered);
}

async function loadData() {
  try {
    const manifestResponse = await fetch('./data/manifest.json');
    if (!manifestResponse.ok) throw new Error('Unable to load data manifest.');
    entries = await manifestResponse.json();

    const resultsResponse = await fetch('./generated/mood-results.json');
    moodResults = resultsResponse.ok ? await resultsResponse.json() : [];

    sortNewest = true;
    applyFilterAndSort();
  } catch (error) {
    manifestBody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:2rem;">Unable to load mood data.</td></tr>';
    console.error(error);
  }
}

filterInput.addEventListener('input', applyFilterAndSort);
sortToggle.addEventListener('click', () => {
  sortNewest = !sortNewest;
  sortToggle.textContent = sortNewest ? 'Sort by most recent ↓' : 'Sort by oldest ↑';
  applyFilterAndSort();
});

newPrLink.href = 'https://github.com/your-username/Moodah/edit/main/data/manifest.json';

loadData();