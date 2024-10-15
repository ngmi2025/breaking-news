document.addEventListener('DOMContentLoaded', () => {
    const newsContainer = document.getElementById('news-container');
    const corsProxy = 'https://api.allorigins.win/raw?url=';
    const rssSources = [
        { url: 'https://onemileatatime.com/feed/', name: 'One Mile at a Time' },
        { url: 'https://frequentmiler.com/feed/', name: 'Frequent Miler' },
        { url: 'https://viewfromthewing.com/feed/', name: 'View from the Wing' },
    ];

  const extractCounts = (doc, source) => {
    let commentCount = 0;
    let shareCount = 0;

    if (source === 'One Mile at a Time') {
        const commentCountEl = doc.querySelector('.post-comments.text-warning.number-of-comments .number');
        commentCount = commentCountEl ? parseInt(commentCountEl.textContent) : 0;
        console.log('OMAAT Comment Count:', commentCount);
        // Note: We don't have share count information for One Mile at a Time
    } else if (source === 'Frequent Miler' || source === 'View from the Wing') {
        // Extract share count
        const shareCountEl = doc.querySelector('.st-total .st-label');
        if (shareCountEl) {
            shareCount = parseInt(shareCountEl.textContent) || 0;
            console.log(`${source} Share Count:`, shareCount);
        } else {
            console.log(`${source} Share Count element not found`);
        }
        
        // Extract comment count
        let commentCountEl;
        if (source === 'Frequent Miler') {
            commentCountEl = doc.querySelector('.td-post-comments');
        } else { // View from the Wing
            commentCountEl = doc.querySelector('.comment-count');
        }
        if (commentCountEl) {
            const commentText = commentCountEl.textContent.trim();
            commentCount = parseInt(commentText) || 0;
        }
        console.log(`${source} Comment Count:`, commentCount);
    }

    return { commentCount, shareCount };
};
    const fetchNews = async () => {
        let allNews = [];
        const fetchPromises = [];

        for (const source of rssSources) {
            try {
                console.log(`Fetching RSS feed for ${source.name}`);
                const response = await fetch(`${corsProxy}${encodeURIComponent(source.url)}`);
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                const str = await response.text();
                const data = new window.DOMParser().parseFromString(str, "text/xml");
                const items = data.querySelectorAll("item");

                items.forEach(el => {
                    const pubDate = new Date(el.querySelector("pubDate").textContent);
                    if (Date.now() - pubDate <= 48 * 60 * 60 * 1000) { // Within last 48 hours
                        const link = el.querySelector("link").textContent;
                        console.log(`Fetching article page: ${link}`);
                        
const fetchPromise = fetch(`${corsProxy}${encodeURIComponent(link)}`)
    .then(response => response.text())
    .then(html => {
        return new Promise(resolve => {
            setTimeout(() => {
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');
                
                const { commentCount, shareCount } = extractCounts(doc, source.name);
                
                console.log(`Article parsed: Comments - ${commentCount}, Shares - ${shareCount}`);

                resolve({
                    title: el.querySelector("title").textContent,
                    link: link,
                    pubDate: pubDate,
                    source: source.name,
                    commentCount: commentCount,
                    shareCount: shareCount
                });
            }, 5000); // 5 second delay
        });
    })
    .catch(error => console.error(`Error fetching article ${link}:`, error));
                        
                        fetchPromises.push(fetchPromise);
                    }
                });
            } catch (error) {
                console.error(`Error fetching news from ${source.name}:`, error);
            }
        }

        await Promise.all(fetchPromises);
        console.log('All articles fetched and parsed');
        return allNews;
    };

const calculatePopularityScore = (article) => {
    const commentScore = article.commentCount || 0;
    const shareScore = (article.shareCount || 0) * 0.1; // Giving less weight to shares as they're often more numerous
    
    // Weighted sum of scores, removing recency
    return (commentScore * 0.6) + (shareScore * 0.4);
};
    const rankNews = (news) => {
        return news.sort((a, b) => {
            const scoreA = calculatePopularityScore(a);
            const scoreB = calculatePopularityScore(b);
            return scoreB - scoreA;
        }).slice(0, 20); // Get top 20
    };

const displayNews = (news) => {
    console.log('News to display:', news);
    let html = `
        <table>
            <thead>
                <tr>
                    <th>Title</th>
                    <th>Published Date</th>
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
    news.slice(0, 20).forEach(item => {
        console.log('Displaying item:', item);
        const commentCount = item.commentCount !== undefined ? item.commentCount : 0;
        const shareCount = item.shareCount !== undefined ? item.shareCount : 0;
        const popularityScore = calculatePopularityScore({...item, commentCount, shareCount});
        let popularityRank;
        if (popularityScore > 50) {
            popularityRank = 'High';
        } else if (popularityScore > 10) {
            popularityRank = 'Medium';
        } else {
            popularityRank = 'Low';
        }
        html += `
            <tr>
                <td><a href="${item.link}" target="_blank">${item.title}</a></td>
                <td>${new Date(item.pubDate).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                <td>${item.source}</td>
                <td>${commentCount}</td>
                <td>${shareCount}</td>
                <td>${item.isFeatured ? 'Yes' : 'No'}</td>
                <td>${popularityRank}</td>
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
