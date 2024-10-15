document.addEventListener('DOMContentLoaded', () => {
    const newsContainer = document.getElementById('news-container');
    const corsProxy = 'https://api.allorigins.win/raw?url=';
    const rssSources = [
        { url: 'https://onemileatatime.com/feed/', name: 'One Mile at a Time' },
        { url: 'https://thepointsguy.com/feed/', name: 'The Points Guy' },
        // Add more RSS feeds here
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
                        allNews.push({
                            title: el.querySelector("title").textContent,
                            link: el.querySelector("link").textContent,
                            pubDate: pubDate,
                            source: source.name,
                            views: Math.floor(Math.random() * 1000) // Mock view count
                        });
                    }
                });
            } catch (error) {
                console.error(`Error fetching news from ${source.name}:`, error);
            }
        }
        return allNews;
    };

    const rankNews = (news) => {
        // Rank based on a combination of recency and views
        return news.sort((a, b) => {
            const scoreA = a.views + (Date.now() - a.pubDate) / 3600000; // 1 hour = 1 view
            const scoreB = b.views + (Date.now() - b.pubDate) / 3600000;
            return scoreB - scoreA;
        }).slice(0, 10); // Get top 10
    };

    const displayNews = (news) => {
        let html = `
            <table>
                <thead>
                    <tr>
                        <th>Title</th>
                        <th>Source</th>
                        <th>Published</th>
                        <th>Popularity</th>
                    </tr>
                </thead>
                <tbody>
        `;
        news.forEach(item => {
            html += `
                <tr>
                    <td><a href="${item.link}" target="_blank">${item.title}</a></td>
                    <td>${item.source}</td>
                    <td>${item.pubDate.toLocaleString()}</td>
                    <td>${item.views} views</td>
                </tr>
            `;
        });
        html += '</tbody></table>';
        newsContainer.innerHTML = html;
    };

    const loadNews = async () => {
        newsContainer.innerHTML = '<p>Loading news...</p>';
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
    refreshButton.onclick = loadNews;
    document.body.insertBefore(refreshButton, newsContainer);

    // Load news on page load
    loadNews();
});
