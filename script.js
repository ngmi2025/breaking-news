document.addEventListener('DOMContentLoaded', () => {
    const newsContainer = document.getElementById('news-container');
    const corsProxy = 'https://api.allorigins.win/raw?url=';
    const rssUrl = 'https://onemileatatime.com/feed/';

    fetch(`${corsProxy}${encodeURIComponent(rssUrl)}`)
        .then(response => response.text())
        .then(str => new window.DOMParser().parseFromString(str, "text/xml"))
        .then(data => {
            const items = data.querySelectorAll("item");
            let html = '';
            items.forEach(el => {
                html += `
                    <div class="news-item">
                        <h2><a href="${el.querySelector("link").innerHTML}" target="_blank">${el.querySelector("title").innerHTML}</a></h2>
                        <p>Published: ${new Date(el.querySelector("pubDate").innerHTML).toLocaleString()}</p>
                    </div>
                `;
            });
            newsContainer.innerHTML = html;
        })
        .catch(error => {
            console.error('Error fetching news:', error);
            newsContainer.innerHTML = '<p>Error loading news. Please try again later.</p>';
        });
});
