
/**
 * Type definition for a contributor object.
 */
interface Contributor {
	name: string;
	contributionCount: number;
	linkUrl: string;
	iconUrl: string;
}

/**
 * Fetches GitHub contributors and appends them to the document.
 */
(async function fetchGitHubContributors(): Promise<void> {
	try {
		const githubContributors = document.querySelector<HTMLElement>(".github-container");
		if (!githubContributors) {
			console.warn("GitHub contributors container not found.");
			return;
		}

		const response = await fetch("/api/contributors");
		if (!response.ok) {
			throw new Error(`Failed to fetch contributors: ${response.statusText}`);
		}

		const contributors: Contributor[] = await response.json();
		const fragment = document.createDocumentFragment();

		contributors.forEach((contributor) => {
			const link = document.createElement("a");
			link.href = contributor.linkUrl;

			const iconImg = document.createElement("img");
			iconImg.src = contributor.iconUrl;

			const githubStatsContainer = document.createElement("div");
			githubStatsContainer.classList.add("github-stats");

			const name = document.createElement("p");
			name.classList.add("name");
			name.innerText = contributor.name;

			const paragraph = document.createElement("p");
			paragraph.classList.add("contribution-count");
			paragraph.innerText = `${translations['contribution_count']?.[0] || ""}${contributor.contributionCount}${translations['contribution_count']?.[1] || ""}`;

			githubStatsContainer.appendChild(name);
			githubStatsContainer.appendChild(paragraph);
			link.appendChild(iconImg);
			link.appendChild(githubStatsContainer);
			fragment.appendChild(link);
		});

		githubContributors.appendChild(fragment);
	} catch (error) {
		console.error(`Error during loading of contributor list: ${error}`);
	}
})();
