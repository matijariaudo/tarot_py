from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel

#IMPORT REQUEST
import requests

# DOTENV
from dotenv import load_dotenv
import os
load_dotenv() # This loads the variables from .env

#OPENAI - TAROT
from openai_call import openai_tarot

app = FastAPI()

app.mount("/static", StaticFiles(directory="./static"), name="static")
templates = Jinja2Templates(directory="./templates")

@app.get("/", response_class=HTMLResponse)
async def get_index(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

@app.get("/api/checkenv")
async def ask_tarot():
    try:
        response = requests.get("https://api.example.com/tarot")
        data = response.json()
        return {"card": data["card"]}
    except:
        return {"card": os.getenv("OPEN_AI")}

class TarotRequest(BaseModel):
    name: str
    cards: str
    question: str

@app.post("/api/tarot")
async def ask_tarot(body: TarotRequest):
    try:
        answer = openai_tarot(
            userName=body.name,
            cards=body.cards,
            userQuestion=body.question,
            userInfo={}  # Podés agregar info extra si querés
        )
        return answer
    except Exception as e:
        print("Error in openai_tarot function:", e)
        return {"error": "Error in openai_tarot function"}