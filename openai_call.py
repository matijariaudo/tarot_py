import openai 
import json
from dotenv import load_dotenv
import os
load_dotenv() # This loads the variables from .env

api_key_openai = os.getenv("OPENAIKEY")

try:
    client = openai.OpenAI(api_key=api_key_openai)
except Exception as e:
    print("ERROR:", e)


def openai_tarot(userName, cards, userQuestion, userInfo):
    print("API Key:", api_key_openai)
    client = openai.OpenAI(
        api_key=api_key_openai,
        organization="org-0Tqti9H3plCABWuOmhQRyjqy",
        project="proj_2hUw4IOIXcdRfe2lvu7k9bIy"
    )
    print("Client initialized")
    messages = [
        {
            "role": "system",
            "content": """
            Responde exclusivamente en formato JSON **válido**, sin agregar ```json ni ningún marcador de código.
            A)Deberás actuar como un lector de tarot experto.
            B)Debes detectar automáticamente el idioma de la pregunta del user (`userQuestion`) y usar ese idioma en toda la respuesta.
            C)Debes interpretar las cartas de tarot de user(`cards`) y responder a la pregunta del user(`userQuestion`) de manera empática y realista (120 palabras máximo por carta).

            ✅ Formato de respuesta requerido:
            {
            "cards": [
                {
                "nameCard": "Nombre de la carta 1",
                "meaning": "Texto de entre 100 y 120 palabras con la interpretación de la carta relacionada a la pregunta del user (userQuestion). Sé empático y da predicciones reales.",
                "qty": número de palabras en 'meaning'
                },
                {...},
                {...} //Total 3 cartas
            ],
            "resume": "Resumen de entre 180 y 240 palabras que analiza las 3 cartas combinadas. No repitas exactamente lo dicho en cada carta, haz una conclusión con tono realista y empático."
            }

            ⚠️ IMPORTANTE:
            - El formato debe ser **JSON válido y listo para ser procesado con JSON.parse o json.loads en backend**.
            - No uses comillas triples, ni bloques tipo ```json. Solo responde el objeto JSON directamente.
            - Asegúrate de que todas las comas y llaves estén bien cerradas.
            - No uses comentarios dentro del JSON.
            - Respeta el idioma detectado en la pregunta(userQuestion).
            """
        },
        {
            "role": "user",
            "content": str(f"""
                userName: {userName} \n
                cards: {cards} \n
                userQuestion: {userQuestion} \n
                userInfo: {userInfo}
            """)
        }
    ]
    print("Messages prepared:", messages)
    response = client.chat.completions.create(
        model="gpt-4.1-mini",
        #response_format="json",
        messages=messages
    )
    print("\n",response.choices[0].message.content)

    content = json.loads(response.choices[0].message.content)
    return content
