from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()


class NewsRequest(BaseModel):
    interests: list[str]


@app.get("/")
def home():
    return {
        "message": "Newsly AI backend is running!"
    }


@app.post("/generate-news")
def generate_news(request: NewsRequest):
    return {
        "message": "News generation started!",
        "interests": request.interests
    }