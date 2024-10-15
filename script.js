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
        // Simple ranking based on recency
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

    fetchNews()
        .then(rankNews)
        .then(displayNews)
        .catch(error => {
            console.error('Error:', error);
            newsContainer.innerHTML = '<p>Error loading news. Please try again later.</p>';
        });
});

// Placeholder function for generating angles (to be implemented with ChatGPT API later)
function generateAngles(title) {
    const anglesContainer = document.getElementById(`angles-${title.replace(/\s+/g, '-').toLowerCase()}`);
    anglesContainer.innerHTML = 'Generating angles... (This feature will be implemented with ChatGPT API in the future)';
}
