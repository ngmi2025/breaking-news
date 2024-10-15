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
                    allNews.push({
                        title: el.querySelector("title").textContent,
                        link: el.querySelector("link").textContent,
                        pubDate: new Date(el.querySelector("pubDate").textContent),
                        source: source.name
                    });
                });
            } catch (error) {
                console.error(`Error fetching news from ${source.name}:`, error);
            }
        }
        return allNews;
    };

    const rankNews = (news) => {
        return news.sort((a, b) => b.pubDate - a.pubDate);
    };

    const displayNews = (news) => {
        let html = '';
        news.forEach(item => {
            html += `
                <div class="news-item">
                    <h2><a href="${item.link}" target="_blank">${item.title}</a></h2>
                    <p>Source: ${item.source} | Published: ${item.pubDate.toLocaleString()}</p>
                    <button onclick="generateAngles('${item.title}')">Generate Angles</button>
                    <div id="angles-${item.title.replace(/\s+/g, '-').toLowerCase()}"></div>
                </div>
            `;
        });
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

// Placeholder function for generating angles (to be implemented with ChatGPT API later)
function generateAngles(title) {
    const anglesContainer = document.getElementById(`angles-${title.replace(/\s+/g, '-').toLowerCase()}`);
    anglesContainer.innerHTML = 'Generating angles... (This feature will be implemented with ChatGPT API in the future)';
}
