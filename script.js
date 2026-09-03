const USERNAME = "ameya-jarvis-07";

const page = document.body.dataset.page;

const formatDate = (isoString) =>
  new Date(isoString).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

const getJSON = async (url) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
  return response.json();
};

const fetchProfile = () =>
  getJSON(`https://api.github.com/users/${encodeURIComponent(USERNAME)}`);

const fetchAllRepos = async () => {
  const repos = [];
  let pageNo = 1;

  while (true) {
    const batch = await getJSON(
      `https://api.github.com/users/${encodeURIComponent(
        USERNAME,
      )}/repos?per_page=100&page=${pageNo}&sort=updated`,
    );

    repos.push(...batch);

    if (batch.length < 100) {
      break;
    }
    pageNo += 1;
  }

  return repos;
};

const topScore = (repo) => repo.stargazers_count * 3 + repo.watchers_count * 2 + repo.forks_count;

const repoCardHTML = (repo) => `
  <article class="repo-card">
    <h3><a href="${repo.html_url}" target="_blank" rel="noopener noreferrer">${repo.name}</a></h3>
    <p>${repo.description ?? "No description provided."}</p>
    <div class="meta">
      <span>⭐ ${repo.stargazers_count}</span>
      <span>🍴 ${repo.forks_count}</span>
      <span>🛠 ${repo.language ?? "N/A"}</span>
      <span>Updated ${formatDate(repo.updated_at)}</span>
    </div>
  </article>
`;

const showError = (element, message) => {
  element.textContent = message;
  element.classList.remove("hidden");
};

const renderProfilePage = async () => {
  const profileStatus = document.getElementById("profile-status");
  const topReposStatus = document.getElementById("top-repos-status");
  const profileContent = document.getElementById("profile-content");
  const topRepos = document.getElementById("top-repositories");

  try {
    const [profile, repos] = await Promise.all([fetchProfile(), fetchAllRepos()]);

    profileContent.innerHTML = `
      <div class="profile">
        <img src="${profile.avatar_url}" alt="${profile.login} avatar" />
        <div>
          <h3>${profile.name ?? profile.login}</h3>
          <p>${profile.bio ?? "No bio available."}</p>
          <div class="profile-stats">
            <span class="badge">Followers: ${profile.followers}</span>
            <span class="badge">Following: ${profile.following}</span>
            <span class="badge">Public Repos: ${profile.public_repos}</span>
          </div>
          <p><a href="${profile.html_url}" target="_blank" rel="noopener noreferrer">Visit GitHub Profile</a></p>
        </div>
      </div>
    `;

    const topSix = [...repos].sort((a, b) => topScore(b) - topScore(a)).slice(0, 6);
    topRepos.innerHTML = topSix.map(repoCardHTML).join("");

    profileStatus.classList.add("hidden");
    topReposStatus.classList.add("hidden");
    profileContent.classList.remove("hidden");
    topRepos.classList.remove("hidden");
  } catch (error) {
    showError(profileStatus, "Unable to load profile right now. Please try again later.");
    showError(topReposStatus, "Unable to load repositories right now. Please try again later.");
  }
};

const sortRepos = (repos, sortBy) => {
  const sorted = [...repos];

  if (sortBy === "stars") {
    sorted.sort((a, b) => b.stargazers_count - a.stargazers_count);
  } else if (sortBy === "name") {
    sorted.sort((a, b) => a.name.localeCompare(b.name));
  } else {
    sorted.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
  }

  return sorted;
};

const renderRepositoriesPage = async () => {
  const status = document.getElementById("all-repos-status");
  const list = document.getElementById("all-repositories");
  const sortSelect = document.getElementById("repo-sort");

  try {
    const repos = await fetchAllRepos();

    const render = () => {
      const sorted = sortRepos(repos, sortSelect.value);
      list.innerHTML = sorted.map(repoCardHTML).join("");
    };

    render();
    sortSelect.addEventListener("change", render);

    status.classList.add("hidden");
    list.classList.remove("hidden");
  } catch (error) {
    showError(status, "Unable to load repositories right now. Please try again later.");
  }
};

if (page === "home") {
  renderProfilePage();
}

if (page === "repositories") {
  renderRepositoriesPage();
}
