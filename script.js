document.addEventListener('DOMContentLoaded', () => {
    const newsContainer = document.getElementById('news-container');
    const corsProxy = 'https://api.allorigins.win/raw?url=';
    const rssSources = [
        { url: 'https://onemileatatime.com/feed/', name: 'One Mile at a Time' },
        { url: 'https://frequentmiler.com/feed/', name: 'Frequent Miler' },
    ];
const fetchNews = async () => {
    let allNews = [];
    for (const source of rssSources) {
        try {
            const response = await fetch(`${corsProxy}${encodeURIComponent(source.url)}`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const str = await response.text();
            const data = new window.DOMParser().parseFromString(str, "text/xml");
            const items = data.querySelectorAll("item");
            items.forEach(el => {
                const pubDate = new Date(el.querySelector("pubDate").textContent);
                if (Date.now() - pubDate <= 48 * 60 * 60 * 1000) { // Within last 48 hours
                    const link = el.querySelector("link").textContent;
                    const commentCount = el.querySelectorAll("item").length;
                    
                    // Fetch the actual page to get share count
                    fetch(`${corsProxy}${encodeURIComponent(link)}`)
                        .then(response => response.text())
                        .then(html => {
                            const parser = new DOMParser();
                            const doc = parser.parseFromString(html, 'text/html');
                            const shareCountElement = doc.querySelector('.essb_totalcount');
                            const shareCount = shareCountElement ? parseInt(shareCountElement.textContent) : 0;
                            
                            allNews.push({
                                title: el.querySelector("title").textContent,
                                link: link,
                                pubDate: pubDate,
                                source: source.name,
                                commentCount: commentCount,
                                shareCount: shareCount
                            });
                        })
                        .catch(error => console.error('Error fetching share count:', error));
                }
            });
        } catch (error) {
            console.error(`Error fetching news from ${source.name}:`, error);
        }
    }
    return allNews;
};
    const calculatePopularityScore = (article) => {
        const hoursAgo = (Date.now() - article.pubDate) / 3600000;
        const recencyScore = Math.max(0, 48 - hoursAgo) / 48; // 0 to 1, higher for more recent
        const updateScore = (article.updateDate > article.pubDate) ? 0.2 : 0;
        const featuredScore = article.isFeatured ? 0.3 : 0;
        const engagementScore = (article.commentCount / 100) + (article.shareCount / 1000); // Normalize comment and share counts
        return recencyScore * 0.3 + updateScore + featuredScore + engagementScore * 0.2;
    };

    const rankNews = (news) => {
        return news.sort((a, b) => {
            const scoreA = calculatePopularityScore(a);
            const scoreB = calculatePopularityScore(b);
            return scoreB - scoreA;
        }).slice(0, 10); // Get top 10
    };

    const displayNews = (news) => {
        let html = `
            <table>
                <thead>
                    <tr>
                        <th>Title</th>
                        <th>Published Date</th>
                        <th>Updated</th>
                        <th>Source</th>
                        <th>Comments</th>
                        <th>Shares</th>
                        <th>Featured</th>
                        <th>Popularity</th>
                        <th>Generate Angle</th>
                    </tr>
                </thead>
                <tbody>
        `;
        news.forEach(item => {
            const popularityScore = calculatePopularityScore(item);
            html += `
                <tr>
                    <td><a href="${item.link}" target="_blank">${item.title}</a></td>
                    <td>${item.pubDate.toLocaleString()}</td>
                    <td>${item.updateDate > item.pubDate ? item.updateDate.toLocaleString() : 'N/A'}</td>
                    <td>${item.source}</td>
                    <td>${item.commentCount}</td>
                    <td>${item.shareCount}</td>
                    <td>${item.isFeatured ? 'Yes' : 'No'}</td>
                    <td>${popularityScore.toFixed(2)}</td>
                    <td><button onclick="generateAngles('${item.title}')">Generate</button></td>
                </tr>
            `;
        });
        html += '</tbody></table>';
        newsContainer.innerHTML = html;
    };

    const loadNews = async () => {
        newsContainer.innerHTML = '<p>Loading... please wait and don\'t refresh</p>';
        try {
            let news = await fetchNews();
            if (news.length === 0) throw new Error('No news fetched');
            news = rankNews(news);
            displayNews(news);
            localStorage.setItem('cachedNews', JSON.stringify(news));
            localStorage.setItem('lastFetchTime', Date.now());
        } catch (error) {
            console.error('Error loading news:', error);
            const cachedNews = localStorage.getItem('cachedNews');
            if (cachedNews) {
                displayNews(JSON.parse(cachedNews));
                newsContainer.innerHTML += '<p>Showing cached news. Please refresh for latest updates.</p>';
            } else {
                newsContainer.innerHTML = '<p>Error loading news. Please try again later.</p>';
            }
        }
    };

    // Add a refresh button to the page
    const refreshButton = document.createElement('button');
    refreshButton.textContent = 'Refresh News';
    refreshButton.id = 'refresh-button';
    refreshButton.onclick = loadNews;
    document.body.insertBefore(refreshButton, newsContainer);

    // Load news on page load
    loadNews();
});

// Placeholder function for generating angles (to be implemented with ChatGPT API later)
function generateAngles(title) {
    alert(`Generating angles for: ${title}\n\nThis feature will be implemented with ChatGPT API in the future.`);
}
