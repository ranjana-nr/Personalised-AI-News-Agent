from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import requests
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Personalized News Agent API")


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class NewsRequest(BaseModel):
    interests: list[str]


class ArticleDetailRequest(BaseModel):
    title: str
    description: str
    category: str
    url: str = ""


def generate_ai_summary(title: str, description: str, category: str) -> str:
    """Generates an AI summary using Gemini/OpenAI if available, or a structured key-takeaway summarizer."""
    gemini_key = os.getenv("GEMINI_API_KEY")
    openai_key = os.getenv("OPENAI_API_KEY")

    # 1. Google Gemini API if configured
    if gemini_key:
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={gemini_key}"
            payload = {
                "contents": [{
                    "parts": [{"text": f"Summarize this {category} news story in 2 crisp sentences highlighting the key event and why it matters:\nTitle: {title}\nDetails: {description}"}]
                }]
            }
            res = requests.post(url, json=payload, timeout=5)
            if res.status_code == 200:
                text = res.json()["candidates"][0]["content"]["parts"][0]["text"].strip()
                if text:
                    return text
        except Exception:
            pass

    # 2. OpenAI API if configured
    if openai_key:
        try:
            url = "https://api.openai.com/v1/chat/completions"
            headers = {"Authorization": f"Bearer {openai_key}", "Content-Type": "application/json"}
            payload = {
                "model": "gpt-4o-mini",
                "messages": [
                    {"role": "system", "content": "You are an AI news briefing assistant. Provide a concise 2-sentence summary of this news story."},
                    {"role": "user", "content": f"Title: {title}\nDescription: {description}"}
                ],
                "max_tokens": 100
            }
            res = requests.post(url, json=payload, headers=headers, timeout=5)
            if res.status_code == 200:
                text = res.json()["choices"][0]["message"]["content"].strip()
                if text:
                    return text
        except Exception:
            pass

    # 3. Built-in structured summarizer (reliable fallback without extra API keys)
    clean_desc = (description or "").strip()
    if clean_desc and not clean_desc.endswith((".", "!", "?")):
        clean_desc += "."

    if clean_desc:
        sentences = [s.strip() for s in clean_desc.split(". ") if len(s.strip()) > 15]
        if len(sentences) >= 2:
            return f"{sentences[0]}. {sentences[1]}"
        elif len(sentences) == 1:
            return f"{sentences[0]}"

    return f"Key update regarding {title} in the {category} sector."


@app.get("/")
def home():
    return {
        "message": "News Agent API is running!"
    }


def generate_detailed_summary(title: str, description: str, category: str) -> str:
    """Generates a detailed 3-4 sentence AI briefing for the article detail modal."""
    gemini_key = os.getenv("GEMINI_API_KEY")
    openai_key = os.getenv("OPENAI_API_KEY")

    prompt = (
        f"You are an expert news analyst. Provide a detailed 3-4 sentence briefing of this {category} news story. "
        f"Cover: (1) what happened, (2) why it matters, and (3) potential implications or context. "
        f"Be insightful, specific, and avoid vague language.\n"
        f"Title: {title}\nDetails: {description}"
    )

    # 1. Google Gemini
    if gemini_key:
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={gemini_key}"
            payload = {"contents": [{"parts": [{"text": prompt}]}]}
            res = requests.post(url, json=payload, timeout=8)
            if res.status_code == 200:
                text = res.json()["candidates"][0]["content"]["parts"][0]["text"].strip()
                if text:
                    return text
        except Exception:
            pass

    # 2. OpenAI
    if openai_key:
        try:
            url = "https://api.openai.com/v1/chat/completions"
            headers = {"Authorization": f"Bearer {openai_key}", "Content-Type": "application/json"}
            payload = {
                "model": "gpt-4o-mini",
                "messages": [
                    {"role": "system", "content": "You are an expert news analyst providing detailed briefings."},
                    {"role": "user", "content": prompt}
                ],
                "max_tokens": 200
            }
            res = requests.post(url, json=payload, headers=headers, timeout=8)
            if res.status_code == 200:
                text = res.json()["choices"][0]["message"]["content"].strip()
                if text:
                    return text
        except Exception:
            pass

    # 3. Structured fallback
    clean_desc = (description or "").strip()
    if not clean_desc.endswith((".", "!", "?")):
        clean_desc += "."
    sentences = [s.strip() for s in clean_desc.replace(". ", ".|").split("|") if len(s.strip()) > 15]
    if len(sentences) >= 3:
        return " ".join(sentences[:3])
    elif sentences:
        return " ".join(sentences)
    return f"This {category} story covers: {title}. The article highlights significant developments in this area. Follow the link below to read the full coverage from the original source."


def extract_story_keywords(title: str) -> str:
    """Extracts the most meaningful 4-5 words from a title to use as a NewsAPI query."""
    stopwords = {
        "a", "an", "the", "and", "or", "but", "in", "on", "at", "to", "for",
        "of", "with", "by", "from", "is", "are", "was", "were", "be", "been",
        "has", "have", "had", "will", "would", "could", "should", "may", "might",
        "its", "it", "as", "up", "how", "why", "what", "when", "who", "that",
        "this", "says", "said", "new", "over", "after", "amid", "about", "reports",
        "first", "top", "live", "latest", "today", "watch", "video", "here's",
    }
    words = [w.strip("\"'.,!?:;()[]-") for w in title.split()]
    keywords = [w for w in words if w.lower() not in stopwords and len(w) > 2]
    # Take the top 4 meaningful words to query across outlets
    return " ".join(keywords[:4])


@app.post("/article-details")
def article_details(request: ArticleDetailRequest):
    """Returns a detailed AI summary + same-story articles from different sources."""
    detailed_summary = generate_detailed_summary(
        request.title, request.description, request.category
    )

    # Fetch same-story coverage from NewsAPI using title keywords
    related_articles = []
    api_key = (os.getenv("NEWS_API_KEY") or "").strip()

    if api_key:
        try:
            story_query = extract_story_keywords(request.title)
            headers = {
                "X-Api-Key": api_key,
                "User-Agent": "PersonalizedNewsAgent/1.0",
            }
            # 1. Search in title for direct story coverage
            articles = []
            if story_query:
                response = requests.get(
                    "https://newsapi.org/v2/everything",
                    params={
                        "q": story_query,
                        "searchIn": "title",
                        "language": "en",
                        "sortBy": "relevancy",
                        "pageSize": 8,
                    },
                    headers=headers,
                    timeout=8,
                )
                if response.status_code == 200:
                    articles = response.json().get("articles", [])

                # 2. If title search returns few results, search broad content for that story
                if len(articles) < 2:
                    response = requests.get(
                        "https://newsapi.org/v2/everything",
                        params={
                            "q": story_query,
                            "language": "en",
                            "sortBy": "relevancy",
                            "pageSize": 8,
                        },
                        headers=headers,
                        timeout=8,
                    )
                    if response.status_code == 200:
                        articles = response.json().get("articles", [])

            for article in articles:
                title = article.get("title", "")
                url = article.get("url", "")
                # Skip identical article or removed items
                if not title or not url or title == "[Removed]":
                    continue
                if request.url and url == request.url:
                    continue
                related_articles.append({
                    "title": title,
                    "url": url,
                    "source": article.get("source", {}).get("name") or "News Outlet",
                    "image": article.get("urlToImage"),
                    "publishedAt": article.get("publishedAt"),
                    "description": article.get("description") or "",
                })

            # Remove duplicates by URL and keep top 4
            seen = set()
            unique_related = []
            for a in related_articles:
                if a["url"] not in seen:
                    seen.add(a["url"])
                    unique_related.append(a)
            related_articles = unique_related[:4]
        except Exception:
            related_articles = []

    return {
        "detailed_summary": detailed_summary,
        "related_articles": related_articles,
    }


@app.post("/generate-news")
def generate_news(request: NewsRequest):

    # Get NewsAPI key from .env
    api_key = os.getenv("NEWS_API_KEY")

    if not api_key:
        raise HTTPException(
            status_code=500,
            detail="NEWS_API_KEY is missing. Check your backend/.env file."
        )

    # Targeted search terms for high relevance
    search_queries = {
        "Artificial Intelligence": '"artificial intelligence" OR "AI" OR "machine learning"',
        "Technology": '"technology" OR "tech" OR "cybersecurity"',
        "Space": '"space exploration" OR NASA OR astronomy',
        "Science": '"scientific discovery" OR "science research"',
        "Gaming": '"video games" OR "gaming"',
        "Finance": '"financial markets" OR "economy" OR "investing"'
    }

    articles = []
    seen_urls = set()

    # Search for each selected interest
    for interest in request.interests:

        # Get the better search query
        search_query = search_queries.get(interest, interest)

        url = "https://newsapi.org/v2/everything"

        params = {
            "q": search_query,
            "searchIn": "title,description",
            "language": "en",
            "sortBy": "relevancy",
            "pageSize": 5
        }

        headers = {
            "X-Api-Key": api_key,
            "User-Agent": "PersonalizedNewsAgent/1.0"
        }

        try:
            response = requests.get(
                url,
                params=params,
                headers=headers,
                timeout=10
            )

            data = response.json()

        except requests.RequestException as error:
            raise HTTPException(
                status_code=500,
                detail=f"Could not connect to NewsAPI: {error}"
            )
        except ValueError:
            raise HTTPException(
                status_code=500,
                detail="Invalid response received from NewsAPI server."
            )

        # Check for NewsAPI errors
        if data.get("status") != "ok":
            raise HTTPException(
                status_code=500,
                detail={
                    "message": "NewsAPI returned an error",
                    "code": data.get("code"),
                    "error": data.get("message")
                }
            )

        # Add articles
        for article in data.get("articles", []):

            # Skip removed or incomplete articles
            article_url = article.get("url")
            article_title = article.get("title")
            if not article_title or not article_url or article_title == "[Removed]":
                continue

            # Prevent duplicate articles across categories
            if article_url in seen_urls:
                continue
            seen_urls.add(article_url)

            description = article.get("description") or "No description provided."
            ai_summary = generate_ai_summary(article_title, description, interest)

            articles.append({
                "title": article_title,
                "summary": description,
                "ai_summary": ai_summary,
                "category": interest,
                "url": article_url,
                "image": article.get("urlToImage"),
                "publishedAt": article.get("publishedAt"),
                "source": article.get("source", {}).get("name") or "Unknown Source"
            })

    return {
        "message": "News generated successfully!",
        "interests": request.interests,
        "articles": articles
    }