# 🧠 Semantic AI Web Platforma

> AI yordamida matnni semantik tahlil qiluvchi mustaqil ishlab chiqilgan open-source web ilova.

Flask asosida yozilgan, Groq API (LLaMA 3) modeli bilan ishlaydigan va real serverda production darajasida deploy qilingan zamonaviy AI ilova.

🌐 Live: [https://ai.oqdev.uz](https://ai.oqdev.uz)

---

## 📌 Asosiy imkoniyatlar

- 🔍 **Nomlangan obyektlarni aniqlash** (PERSON, LOCATION, SOHA, TUSHUNCHA va boshqalar)
- 🎭 **Sentiment tahlili** (matn umumiy hissiyotini aniqlash)
- 🧠 **Kalit so‘zlar ajratish** (maksimum 10ta)
- 🌐 **Obyektlar o‘rtasidagi bog‘liqliklarni aniqlash va vizual grafik shaklida ko‘rsatish**
- 📈 **Gaplar darajasida sentiment dinamikasi (har bir gapda hissiyot)**
- 🗞 **Sentimentni izohlab berish (AI tushuntiradi)**

---

## ⚙️ Texnologiyalar va Arxitektura

| Komponent     | Texnologiya                                      |
|---------------|--------------------------------------------------|
| Backend       | Python 3, Flask                                  |
| AI modeli     | Groq API (LLaMA3-8B-8192)                        |
| Server        | Gunicorn + Supervisor                            |
| Web server    | Nginx (SSL bilan)                                |
| Deploy        | Ubuntu 22.04 VM                                  |
| HTTPS         | Let's Encrypt + Certbot                          |
| Monitoring    | Supervisor (avtomatik restart)                   |

---

## 🔒 API Kaliti Maxfiyligi

API kaliti ochiq ko‘rinmasligi uchun quyidagicha usul ishlatilgan:

```python
from groq import Groq
import os

client = Groq(api_key=os.getenv("GROQ_API_KEY"))
```

🔐 API kalit `.env` fayl orqali serverda saqlanadi va `.gitignore` orqali GitHub’ga yuklanmaydi.

---

## 📂 Loyiha Strukturasi (asosiy fayllar)

```bash
├── app.py                 # Flask backend (asosiy logika)
├── semantic_project.conf  # Supervisor config
├── static/                # Statik fayllar (CSS, JS)
├── templates/             # HTML sahifalar (Jinja2)
├── requirements.txt       # Kutubxonalar ro‘yxati
├── .gitignore             # Git uchun istisno fayllar
```

---

## 🚀 Ishga tushirish (developer rejimda)

```bash
git clone git@github.com:humoyun200108/semantic.git
cd semantic
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
export GROQ_API_KEY="your_real_groq_api_key"
python app.py
```

🛆 Productionda Gunicorn + Supervisor + Nginx ishlatiladi.

---

## 📊 Muallif yutuqlari

✅ To‘liq loyiha 0 dan ishlab chiqilgan  
✅ DNS, domen bog‘lash, SSL, backend va frontend integratsiyasi  
✅ GitHub, Git, `push`, `.env`, `.gitignore` — hammasi to‘g‘ri ishlatilgan  
✅ Tajribali developer darajasida production server sozlangan

---

## 📜 Litsenziya

MIT License – istalgancha foydalaning, o‘zgartiring va ulashing. Faqat mualliflikni saqlang.

---

## 🧠 Muallif: [@humoyun200108](https://github.com/humoyun200108)

> “AI vositasi bo‘lishi mumkin, ammo **haqiqiy kuch — niyat va qat’iyatda.** Bu loyiha - shuning isboti.”

