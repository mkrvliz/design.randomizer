import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('.'));

const YANDEX_API_KEY = process.env.YANDEX_API_KEY;
const YANDEX_API_URL = 'https://llm.api.cloud.yandex.net/foundationModels/v1/completion';
const FOLDER_ID = process.env.YANDEX_FOLDER_ID;

const categories = [
  "Украшения",
  "Одежда",
  "Керамика",
  "Мероприятия",
  "Продукты",
  "Свечи",
  "Вечеринки",
  "Текстиль",
  "Косметика"
];

async function generateTheme() {
  const randomCategory = categories[Math.floor(Math.random() * categories.length)];
  
  const prompt = `Придумай уникальную идею бизнеса или проекта в категории "${randomCategory}". Ответь в JSON формате: {"tag": "${randomCategory}", "title": "Краткое название (5-8 слов)", "context": "Описание (2-3 предложения)"}`;

  try {
    const response = await fetch(YANDEX_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Api-Key ${YANDEX_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        modelUri: `gpt://${FOLDER_ID}/yandexgpt-lite`,
        completionOptions: {
          stream: false,
          temperature: 0.8,
          maxTokens: 500
        },
        messages: [
          {
            role: 'user',
            text: prompt
          }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Yandex API error response:', errorText);
      throw new Error(`Yandex API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.result.alternatives[0].message.text;
    
    // Парсим JSON из ответа
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid response format from API');
    }
    
    const theme = JSON.parse(jsonMatch[0]);
    return theme;
  } catch (error) {
    console.error('Error generating theme:', error);
    throw error;
  }
}

app.get('/api/theme', async (req, res) => {
  try {
    const theme = await generateTheme();
    res.json(theme);
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to generate theme',
      details: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('Make sure YANDEX_API_KEY and YANDEX_FOLDER_ID are set in .env file');
});
