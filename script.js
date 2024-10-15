document.addEventListener('DOMContentLoaded', () => {
    const newsContainer = document.getElementById('news-container');
    const corsProxy = 'https://api.allorigins.win/raw?url=';
    const rssSources = [
        { url: 'https://onemileatatime.com/feed/', name: 'One Mile at a Time' },
        { url: 'https://thepointsguy.com/feed/', name: 'The Points Guy' },
        { url: 'https://frequentmiler.com/feed/', name: 'Frequent Miler' }, // Add Frequent Miler
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
                        const commentCount = el.querySelector("slash\\:comments") ? 
                            parseInt(el.querySelector("slash\\:comments").textContent) : 0;
                        allNews.push({
                            title: el.querySelector("title").textContent,
                            link: el.querySelector("link").textContent,
                            pubDate: pubDate,
                            source: source.name,
                            views: Math.floor(Math.random() * 1000) + 100, // Simulated view count
                            commentCount: commentCount
                        });
                    }
                });
            } catch (error) {
                console.error(`Error fetching news from ${source.name}:`, error);
            }
        }
        return allNews;
    };

    // ... rest of the code remains the same
});

// ... generateAngles function remains the same
